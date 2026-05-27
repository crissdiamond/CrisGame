import { EVOLUTION_GRAPH, getEvolutionNode, getNodeIdForTransition } from './evolutionData.js';
import { EvolutionEngine } from './evolutionEngine.js';
import { random } from './rng.js';
import { RARITY, SOLVENT_RATE_FACTOR } from './rarityTiers.js';
import { tickWater } from './waterBiology.js';
import { tickAmmonia } from './ammoniaBiology.js';
import { tickMethane } from './methaneBiology.js';

function toUnlockPropName(id) {
    const camel = id.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    return 'unlocked' + camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Handles the biological progression calculations for three solvent systems:
 * 1. Water Line: Primordial Soup -> Anaerobic -> Photosynthetic -> Eukaryotic -> Multicellular -> Cambrian -> Land Plants -> Arthropods -> Tetrapods -> Sauropsids (Dinosaurs) & Synapsids (Mammals)
 * 2. Ammonia Line: Ammonic Soup -> Proto-Ammonic -> Ammonic Multicellular -> Silico-Flora -> Cryo-Fauna
 * 3. Methane Line: Hydrocarbon Soup -> Methanotrophic Proto -> Methane Multicellular -> Cryo-Organisms
 *
 * Each life-stage transition fires as a Poisson event while its gate is
 * satisfied. Rarity tiers set the base hazard rate per Myr; solvent kinetics
 * scale that; per-transition condition multipliers reward well-tuned planets;
 * player-bought nudges multiply the rate for a 5 Myr window.
 */

// RARITY and SOLVENT_RATE_FACTOR are imported from './rarityTiers.js'
export { RARITY } from './rarityTiers.js';

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

export class BiologySimulation {
    constructor() {
        // --- Core Graph State Maps ---
        this.biomassMap = {};
        this.biodiversityMap = {};
        this.unlockedMap = {};

        // Initialize maps from EVOLUTION_GRAPH
        for (const solvent in EVOLUTION_GRAPH) {
            for (const nodeId in EVOLUTION_GRAPH[solvent]) {
                this.biomassMap[nodeId] = 0.0;
                this.biodiversityMap[nodeId] = 0;
                this.unlockedMap[nodeId] = false;
            }
        }

        // Define dynamic properties with getters and setters for backward-compatibility
        const popMappings = {};
        for (const solvent in EVOLUTION_GRAPH) {
            for (const nodeId in EVOLUTION_GRAPH[solvent]) {
                const node = EVOLUTION_GRAPH[solvent][nodeId];
                popMappings[node.popKey] = nodeId;
            }
        }

        for (const [propName, nodeKey] of Object.entries(popMappings)) {
            Object.defineProperty(this, propName, {
                get: () => this.biomassMap[nodeKey] || 0,
                set: (v) => { this.biomassMap[nodeKey] = v; },
                configurable: true,
                enumerable: true
            });
        }

        // Derive unlock property → nodeId map from EVOLUTION_GRAPH.
        // Nodes with a non-standard property name carry unlockProp in the graph.
        const unlockMappings = {};
        for (const solvent in EVOLUTION_GRAPH) {
            for (const nodeId in EVOLUTION_GRAPH[solvent]) {
                const node = EVOLUTION_GRAPH[solvent][nodeId];
                const propName = node.unlockProp || toUnlockPropName(nodeId);
                unlockMappings[propName] = nodeId;
            }
        }

        for (const [propName, nodeKey] of Object.entries(unlockMappings)) {
            Object.defineProperty(this, propName, {
                get: () => !!this.unlockedMap[nodeKey],
                set: (v) => { this.unlockedMap[nodeKey] = !!v; },
                configurable: true,
                enumerable: true
            });
        }

        Object.defineProperty(this, 'landPlantsPop', {
            get: () => (this.biomassMap['mosses'] || 0) + (this.biomassMap['ferns'] || 0) + (this.biomassMap['conifers'] || 0) + (this.biomassMap['angiosperms'] || 0),
            set: (v) => { this.biomassMap['mosses'] = v; },
            configurable: true,
            enumerable: true
        });

        Object.defineProperty(this, 'unlockedLandPlants', {
            get: () => !!this.unlockedMap['mosses'],
            set: (v) => { this.unlockedMap['mosses'] = !!v; },
            configurable: true,
            enumerable: true
        });

        // Deprecated aliases for backward-compatibility with older save formats
        Object.defineProperty(this, 'arthropodPop', {
            get: () => this.insectsPop,
            set: (v) => { this.insectsPop = v; },
            configurable: true,
            enumerable: false
        });
        Object.defineProperty(this, 'unlockedArthropod', {
            get: () => this.unlockedInsects,
            set: (v) => { this.unlockedInsects = v; },
            configurable: true,
            enumerable: false
        });
        Object.defineProperty(this, 'technologicalAIPop', {
            get: () => this.aiPop,
            set: (v) => { this.aiPop = v; },
            configurable: true,
            enumerable: false
        });
        Object.defineProperty(this, 'unlockedTechnologicalAI', {
            get: () => this.unlockedAI,
            set: (v) => { this.unlockedAI = v; },
            configurable: true,
            enumerable: false
        });

        // --- Genetic Adaptations / Nudges (unlocked via tokens) ---
        this.activeAdaptations = new Set(); // e.g., 'endosymbiosis', 'vascular_tissue', 'amniotic_egg', 'endothermy', 'scales', 'silicon_chains', 'cryo_polymers', etc.

        // Active per-transition rate boosts from nudges. Keyed by transition id;
        // each entry: { multiplier, remainingMyr }. Decays each tick.
        this.pendingNudges = {};

        // General Mutation / Adaptation Level
        this._radiationResistance = 0.1;
        this.unlockAges = {};

        // --- Stability Gate ---
        this.oecStabilityTimer = 100.0;

        // --- Genetic Trait Upgrade Levels (0 to 5) ---
        this.thermalResilienceLevel = 0;
        this.radiationDefenseLevel = 0;
        this.metabolicEfficiencyLevel = 0;

        // Instantiate Trait-Based Evolution and Natural Selection Engine
        this.evolutionEngine = new EvolutionEngine();

        // --- Legacy/dummy attributes ---
        this.chemoProkaryotePop = 0.0;
        this.unlockedChemoProkaryote = false;
        this.popChangeRates = {};
    }

    /**
     * Nudge evolution via spending tokens
     */
    applyAdaptation(id) {
        this.activeAdaptations.add(id);
    }

    /**
     * Decay all pending nudge windows in real sim-time.
     */
    _decayPendingNudges(tickRate) {
        for (const id in this.pendingNudges) {
            const entry = this.pendingNudges[id];
            entry.remainingMyr -= tickRate;
            if (entry.remainingMyr <= 0) delete this.pendingNudges[id];
        }
    }

    getNudgeGrowthMultiplier(nodeId, activeSolvent) {
        const node = EVOLUTION_GRAPH[activeSolvent]?.[nodeId];
        if (!node) return 1.0;
        const hasNudge = this.pendingNudges[nodeId] || (node.nudge && this.pendingNudges[node.nudge.id]);
        return hasNudge ? 3.0 : 1.0;
    }

    /**
     * Poisson roll: returns true if a transition with the given hazard rate
     * (per Myr) fires this tick. Time-step-invariant via 1 - exp(-lambda*dt).
     */
    tryFire(transitionKey, rarity, conditionMult, tickRate, planet) {
        if (!(tickRate > 0)) return false;
        const solventMult = SOLVENT_RATE_FACTOR[planet.activeSolvent] ?? 1.0;
        const nodeId = getNodeIdForTransition(transitionKey);
        const node = getEvolutionNode(nodeId, planet.activeSolvent);
        const nudge = this.pendingNudges[transitionKey] || (node?.nudge && this.pendingNudges[node.nudge.id]);
        const nudgeMult = nudge ? nudge.multiplier : 1.0;
        let sexBoost = 1.0;
        if (this.unlockedSexualReproduction) {
            const earlyKeys = ['soup', 'anaerobic', 'photosynthesis', 'nucleus', 'endosymbiosis', 'sexual_reproduction', 'ammonic_soup', 'ammonic_proto', 'methane_soup', 'methane_proto'];
            if (!earlyKeys.includes(transitionKey)) {
                sexBoost = 1.30;
            }
        }

        const lambda = rarity.rate * solventMult * conditionMult * nudgeMult * sexBoost;
        const p = 1 - Math.exp(-lambda * tickRate);
        const success = random() < p;

        if (success) {
            if (!this.unlockAges) this.unlockAges = {};
            this.unlockAges[nodeId] = planet.age;
            this.unlockedMap[nodeId] = true;

            // Special double-unlock cases
            if (transitionKey === 'anaerobic') {
                this.unlockAges['bacteria'] = planet.age;
                this.unlockedMap['bacteria'] = true;
            } else if (transitionKey === 'endosymbiosis') {
                this.unlockAges['eukaryotes'] = planet.age;
                this.unlockedMap['eukaryotes'] = true;
            }
        }
        return success;
    }

    /**
     * Compute biological updates over one simulation step
     */
    update(tickRate, planet) {
        this.currentSimulatingNodeId = null;
        // Run selection pressures and genotype evolution
        this.evolutionEngine.update(planet, this, tickRate);

        const prevBiomass = { ...this.biomassMap };
        this._decayPendingNudges(tickRate);

        const effRad = planet.getEffectiveRadiation() * Math.max(0.2, 1.0 - this.radiationDefenseLevel * 0.15);
        const baseDecayMult = Math.max(0.25, 1.0 - this.metabolicEfficiencyLevel * 0.15);
        const effDecayMult = {
            valueOf: () => {
                if (this.currentSimulatingNodeId) {
                    const genotype = this.evolutionEngine.getGenotype(this.currentSimulatingNodeId);
                    const resEff = genotype ? genotype.resourceEfficiency : 1.0;
                    return baseDecayMult / resEff;
                }
                return baseDecayMult;
            }
        };

        const events = [];
        let o2Prod = 0;
        let co2Cons = 0;
        let co2Prod = 0;
        let n2Prod = 0;
        let ch4Prod = 0;
        let h2Cons = 0;

        const isWater = planet.activeSolvent === 'water';
        const isAmmonia = planet.activeSolvent === 'ammonia';
        const isMethane = planet.activeSolvent === 'methane';

        const ctx = { events, o2Prod, co2Cons, co2Prod, n2Prod, ch4Prod, h2Cons };
        if (isWater)   tickWater(this, planet, tickRate, ctx, effRad, effDecayMult);
        if (isAmmonia) tickAmmonia(this, planet, tickRate, ctx, effRad, effDecayMult);
        if (isMethane) tickMethane(this, planet, tickRate, ctx, effRad, effDecayMult);
        // Pull ctx values back out for biologicalImpact
        ({ o2Prod, co2Cons, co2Prod, n2Prod, ch4Prod, h2Cons } = ctx);


        // Return calculated biological feedback impacts
        const biologicalImpact = {
            o2Prod,
            co2Cons,
            co2Prod,
            n2Prod,
            ch4Prod,
            h2Cons
        };

        // Train radiation resistance
        if (planet.radiation > 0.5 && (this.anaerobicPop > 5.0 || this.ammonicProtoPop > 5.0 || this.methaneProtoPop > 5.0)) {
            const adaptationRate = 0.003 * Math.min(3.0, planet.radiation) * tickRate;
            this.radiationResistance = Math.min(0.9, this.radiationResistance + adaptationRate);
        }

        // Update species-count (biodiversity) map for all clades of the active solvent
        const activeNodes = EVOLUTION_GRAPH[planet.activeSolvent];
        if (activeNodes) {
            for (const nodeId in activeNodes) {
                const node = activeNodes[nodeId];
                if (!this.unlockedMap[nodeId]) {
                    this.biodiversityMap[nodeId] = 0;
                    continue;
                }
                const biomass = this.biomassMap[nodeId] || 0.0;
                const currentSpecies = this.biodiversityMap[nodeId] || 0;
                
                if (biomass < 0.05) {
                    // Decay to extinction
                    const decay = Math.max(1, Math.floor(currentSpecies * 0.25 * tickRate));
                    this.biodiversityMap[nodeId] = Math.max(0, currentSpecies - decay);
                } else {
                    // Growth based on biomass and mutagen speed boosters
                    const targetSpecies = Math.floor(biomass * 1.5);
                    const delta = targetSpecies - currentSpecies;
                    const speed = 0.1 * tickRate * this.getNudgeGrowthMultiplier(nodeId, planet.activeSolvent);
                    
                    let nextSpecies = currentSpecies + delta * speed;
                    if (nextSpecies < 1) nextSpecies = 1;
                    
                    // Dead-end trap cap
                    if (node.isDeadEnd) {
                        nextSpecies = Math.min(100, nextSpecies);
                    }
                    this.biodiversityMap[nodeId] = Math.round(nextSpecies);
                }
            }
        }

        this.popChangeRates = {};
        for (const nodeId in this.biomassMap) {
            const prev = prevBiomass[nodeId] || 0;
            const current = this.biomassMap[nodeId] || 0;
            this.popChangeRates[nodeId] = (current - prev) / (tickRate || 1.0);
        }

        this.currentSimulatingNodeId = null;
        return {
            events,
            biologicalImpact
        };
    }

    getViabilityFactors(nodeId, planet) {
        this.currentSimulatingNodeId = nodeId;
        const factors = [];
        const effRad = planet.getEffectiveRadiation() * Math.max(0.2, 1.0 - this.radiationDefenseLevel * 0.15);
        const isWater = planet.activeSolvent === 'water';
        const isAmmonia = planet.activeSolvent === 'ammonia';
        const isMethane = planet.activeSolvent === 'methane';

        // Helper to push a factor description
        const addFactor = (name, value, details) => {
            factors.push({ name, value: Math.max(0, Math.min(1, value)), details });
        };

        if (isWater) {
            if (nodeId === 'soup') {
                if (planet.temperature > 10 && planet.temperature < 90 && planet.waterCoverage > 10) {
                    const tempFactor = 1 - Math.abs(planet.temperature - 50) / 45;
                    const radFactor = Math.min(2.0, planet.radiation * 0.4);
                    addFactor("Temperature", tempFactor, `Optimal range 50°C. Current: ${planet.temperature.toFixed(1)}°C`);
                    addFactor("Solar Radiation", Math.min(1, radFactor), `Radiolysis synthesizes organics. Current: ${planet.radiation.toFixed(1)} rad/s`);
                    addFactor("Water Coverage", planet.waterCoverage / 100, `Requires liquid water. Current: ${planet.waterCoverage.toFixed(1)}%`);
                } else {
                    addFactor("Global Habitat", 0, "Liquid water or temperature outside 10°C - 90°C bounds.");
                }
            } else if (nodeId === 'anaerobic') {
                const tempFactor = this.getTempViability(planet.temperature, 15, 45, 80);
                const o2Toxicity = Math.max(0.01, 1 - planet.o2 / 25.0);
                const radViability = Math.max(0.1, 1 - (effRad * (1 - this.radiationResistance)) / 6.0);
                const nutrientFactor = Math.min(1.0, this.organicSoup / 15.0);
                addFactor("Temperature", tempFactor, `Optimal 45°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Oxygen Toxicity", o2Toxicity, `Poisoned by oxygen levels > 25%. Current O₂: ${planet.o2.toFixed(1)}%`);
                addFactor("Radiation Resilience", radViability, `Current surface radiation: ${effRad.toFixed(1)} rad/s`);
                addFactor("Organic Soup Abundance", nutrientFactor, `Requires prebiotic nutrients. Current: ${this.organicSoup.toFixed(1)} ppm`);
            } else if (nodeId === 'photosynthetic') {
                const tempFactor = this.getTempViability(planet.temperature, 10, 35, 70);
                const radViability = Math.max(0.1, 1 - (effRad * (1 - this.radiationResistance)) / 6.0);
                const nutrientFactor = Math.min(1.0, this.organicSoup / 20.0);
                addFactor("Temperature", tempFactor, `Optimal 35°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Sunlight & Water", planet.waterCoverage / 100, `Requires ocean surface water. Current: ${planet.waterCoverage.toFixed(1)}%`);
                addFactor("Radiation Mutation Rate", radViability, `Current surface radiation: ${effRad.toFixed(1)} rad/s`);
                addFactor("Organic Soup Abundance", nutrientFactor, `Requires prebiotic nutrients. Current: ${this.organicSoup.toFixed(1)} ppm`);
            } else if (nodeId === 'eukaryotes') {
                const tempFactor = this.getTempViability(planet.temperature, 5, 25, 50);
                const radViability = Math.max(0, 1 - (effRad * (1 - this.radiationResistance)) / 2.0);
                const o2Viability = planet.o2 >= 15.0 ? 1.0 : (planet.o2 / 15.0);
                addFactor("Temperature", tempFactor, `Optimal 25°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Oxygen Level", o2Viability, `Requires O₂ >= 15.0%. Current O₂: ${planet.o2.toFixed(1)}%`);
                addFactor("Radiation Shielding", radViability, `Highly vulnerable to radiation. Current: ${effRad.toFixed(1)} rad/s`);
            } else if (['sponges', 'meduses', 'worms', 'fish', 'cambrian'].includes(nodeId)) {
                const tempRange = {
                    sponges: { min: 5, opt: 25, max: 45 },
                    meduses: { min: 8, opt: 25, max: 45 },
                    worms: { min: 5, opt: 22, max: 45 },
                    fish: { min: 4, opt: 20, max: 40 },
                    cambrian: { min: 5, opt: 22, max: 45 }
                }[nodeId];
                const tempFactor = this.getTempViability(planet.temperature, tempRange.min, tempRange.opt, tempRange.max);
                const o2Viability = planet.o2 >= 15.0 ? 1.0 : (planet.o2 / 15.0);
                addFactor("Temperature", tempFactor, `Optimal ${tempRange.opt}°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Oxygen Level", o2Viability, `Requires O₂ >= 15.0%. Current O₂: ${planet.o2.toFixed(1)}%`);
                addFactor("Ocean Habitat", planet.waterCoverage / 100, `Requires marine water. Current: ${planet.waterCoverage.toFixed(1)}%`);
                if (nodeId === 'cambrian') {
                    const radViability = Math.max(0, 1 - (effRad * (1 - this.radiationResistance)) / 4.0);
                    addFactor("Radiation Shielding", radViability, `Current surface radiation: ${effRad.toFixed(1)} rad/s`);
                }
            } else if (['mosses', 'ferns', 'conifers', 'angiosperms'].includes(nodeId)) {
                const tempRange = {
                    mosses: { min: 0, opt: 20, max: 45 },
                    ferns: { min: 5, opt: 25, max: 50 },
                    conifers: { min: -15, opt: 15, max: 40 },
                    angiosperms: { min: 5, opt: 22, max: 45 }
                }[nodeId];
                const tempFactor = this.getTempViability(planet.temperature, tempRange.min, tempRange.opt, tempRange.max);
                const landViability = (100 - planet.waterCoverage) / 100;
                const co2Viability = Math.max(0, Math.min(1, planet.co2 / 2.0));
                const nitrogenViability = 0.5 + 0.5 * Math.max(0, Math.min(1, planet.n2 / 40.0));
                addFactor("Temperature", tempFactor, `Optimal ${tempRange.opt}°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Land Area", landViability, `Requires dry continents. Current: ${(landViability*100).toFixed(1)}%`);
                addFactor("Carbon Dioxide (CO₂)", co2Viability, `Requires CO₂. Current CO₂: ${planet.co2.toFixed(1)}%`);
                addFactor("Atmospheric Nitrogen", nitrogenViability, `Requires nitrogen. Current N₂: ${planet.n2.toFixed(1)}%`);
            } else if (nodeId === 'insects') {
                const tempFactor = this.getTempViability(planet.temperature, 5, 25, 45);
                const landViability = (100 - planet.waterCoverage) / 100;
                const foodViability = Math.min(1.0, this.landPlantsPop / 15.0);
                const radViability = Math.max(0, 1 - (effRad * (1 - this.radiationResistance)) / 3.0);
                addFactor("Temperature", tempFactor, `Optimal 25°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Land Area", landViability, `Requires dry continents. Current: ${(landViability*100).toFixed(1)}%`);
                addFactor("Land Flora Abundance", foodViability, `Requires plants for food. Current: ${this.landPlantsPop.toFixed(1)}`);
                addFactor("Radiation Shielding", radViability, `Current surface radiation: ${effRad.toFixed(1)} rad/s`);
            } else if (nodeId === 'tetrapods') {
                const tempFactor = this.getTempViability(planet.temperature, 5, 22, 45);
                const landViability = (100 - planet.waterCoverage) / 100;
                const foodViability = Math.min(1.0, this.insectsPop / 15.0);
                const o2Requirement = planet.o2 >= 18.0 ? 1.0 : (planet.o2 / 18.0);
                addFactor("Temperature", tempFactor, `Optimal 22°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Land Area", landViability, `Requires dry continents. Current: ${(landViability*100).toFixed(1)}%`);
                addFactor("Oxygen level", o2Requirement, `Requires O₂ >= 18.0%. Current O₂: ${planet.o2.toFixed(1)}%`);
                addFactor("Insect Abundance (Food)", foodViability, `Requires insects for food. Current: ${this.insectsPop.toFixed(1)}`);
            } else if (nodeId === 'sauropsids') {
                const tempFactor = this.getTempViability(planet.temperature, 15, 32, 48);
                const landViability = (100 - planet.waterCoverage) / 100;
                const foodViability = Math.min(1.0, (this.insectsPop + this.tetrapodPop) / 20.0);
                addFactor("Temperature", tempFactor, `Optimal 32°C (Prefers warm). Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Land Area", landViability, `Requires dry continents. Current: ${(landViability*100).toFixed(1)}%`);
                addFactor("Prey Abundance (Food)", foodViability, `Requires smaller fauna for food. Current: ${(this.insectsPop + this.tetrapodPop).toFixed(1)}`);
            } else if (nodeId === 'synapsids') {
                const tempFactor = this.getTempViability(planet.temperature, 5, 18, 30);
                const plantViability = Math.min(1.0, this.landPlantsPop / 25.0);
                const o2Requirement = planet.o2 >= 20.0 ? 1.0 : (planet.o2 / 20.0);
                addFactor("Temperature", tempFactor, `Optimal 18°C (Prefers temperate). Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Oxygen level", o2Requirement, `Requires high O₂ >= 20.0%. Current O₂: ${planet.o2.toFixed(1)}%`);
                addFactor("Flora Abundance (Food)", plantViability, `Requires plants for food. Current: ${this.landPlantsPop.toFixed(1)}`);
            } else if (nodeId === 'cognitive') {
                const tempFactor = this.getTempViability(planet.temperature, 5, 20, 40);
                const o2Requirement = planet.o2 >= 20.0 ? 1.0 : (planet.o2 / 20.0);
                const foodViability = Math.min(1.0, (this.synapsidPop + this.sauropsidPop) / 30.0);
                addFactor("Temperature", tempFactor, `Optimal 20°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Oxygen level", o2Requirement, `Requires high O₂ >= 20.0%. Current O₂: ${planet.o2.toFixed(1)}%`);
                addFactor("Ecological Complexity (Food)", foodViability, `Requires abundant prey species. Current: ${(this.synapsidPop + this.sauropsidPop).toFixed(1)}`);
            } else if (nodeId === 'cyborg') {
                const tempFactor = this.getTempViability(planet.temperature, 0, 20, 45);
                const o2Requirement = planet.o2 >= 18.0 ? 1.0 : (planet.o2 / 18.0);
                const foodViability = Math.min(1.0, (this.synapsidPop + this.sauropsidPop) / 20.0 + 0.3);
                addFactor("Temperature", tempFactor, `Optimal 20°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Oxygen level", o2Requirement, `Requires O₂ >= 18.0%. Current O₂: ${planet.o2.toFixed(1)}%`);
                addFactor("Nutrient & Resource Flow", foodViability, `Requires biological and raw inputs. Current: ${foodViability.toFixed(2)}`);
            } else if (nodeId === 'ai') {
                const magnetShieldFactor = planet.hasMagnetosphere ? 1.0 : 0.25;
                const radViability = Math.max(0.1, 1 - (effRad * (1 - this.radiationResistance)) / 4.0);
                addFactor("Magnetosphere Strength", magnetShieldFactor, `Requires magnetic field to shield circuits. Magnetosphere: ${planet.hasMagnetosphere ? 'ACTIVE' : 'OFFLINE'}`);
                addFactor("Radiation Interference", radViability, `High radiation causes memory errors. Current: ${effRad.toFixed(1)} rad/s`);
            } else if (nodeId === 'noosphere') {
                const magnetFactor = planet.hasMagnetosphere ? 1.0 : 0.1;
                addFactor("Planetary Magnetosphere", magnetFactor, `Requires global connection shielding. Magnetosphere: ${planet.hasMagnetosphere ? 'ACTIVE' : 'OFFLINE'}`);
            } else if (nodeId === 'gaia_hivemind') {
                const tempFactor = this.getTempViability(planet.temperature, 10, 22, 40);
                addFactor("Temperature", tempFactor, `Optimal 22°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Global Biomass Health", this.cognitiveSpeciesPop / 50.0, `Requires active cognitive populations. Current: ${this.cognitiveSpeciesPop.toFixed(1)}`);
            }
        } else if (isAmmonia) {
            const solventViability = planet.ammoniaCoverage / 100.0;
            if (nodeId === 'ammonic_soup') {
                if (planet.temperature > -80 && planet.temperature < -10 && planet.ammoniaCoverage > 10) {
                    const tempFactor = 1 - Math.abs(planet.temperature - (-40)) / 30;
                    addFactor("Temperature", tempFactor, `Optimal -40°C. Current: ${planet.temperature.toFixed(1)}°C`);
                    addFactor("Ammonia Coverage", solventViability, `Requires liquid ammonia. Current: ${planet.ammoniaCoverage.toFixed(1)}%`);
                } else {
                    addFactor("Global Habitat", 0, "Liquid ammonia or temperature outside -80°C - -10°C bounds.");
                }
            } else if (nodeId === 'ammonic_proto') {
                const tempFactor = this.getTempViability(planet.temperature, -75, -40, -15);
                const nutrientFactor = Math.min(1.0, this.ammonicSoup / 15.0);
                addFactor("Temperature", tempFactor, `Optimal -40°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Ammonia Soup Abundance", nutrientFactor, `Requires ammonic soup. Current: ${this.ammonicSoup.toFixed(1)} ppm`);
            } else if (nodeId === 'ammonic_multi') {
                const tempFactor = this.getTempViability(planet.temperature, -70, -40, -20);
                addFactor("Temperature", tempFactor, `Optimal -40°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Ammonia Solvent", solventViability, `Requires ammonia oceans. Current: ${planet.ammoniaCoverage.toFixed(1)}%`);
            } else if (nodeId === 'silico_flora') {
                const tempFactor = this.getTempViability(planet.temperature, -70, -35, -20);
                const landViability = (100 - planet.ammoniaCoverage) / 100;
                addFactor("Temperature", tempFactor, `Optimal -35°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Land Area", landViability, `Requires dry continents. Current: ${(landViability*100).toFixed(1)}%`);
            } else if (nodeId === 'cryo_fauna') {
                const tempFactor = this.getTempViability(planet.temperature, -65, -35, -25);
                const foodViability = Math.min(1.0, this.silicoFloraPop / 15.0);
                addFactor("Temperature", tempFactor, `Optimal -35°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Silico-Flora Abundance (Food)", foodViability, `Requires plants for food. Current: ${this.silicoFloraPop.toFixed(1)}`);
            } else if (nodeId === 'crystalline_cognitive') {
                const tempFactor = this.getTempViability(planet.temperature, -65, -35, -25);
                const foodViability = Math.min(1.0, this.cryoFaunaPop / 15.0);
                addFactor("Temperature", tempFactor, `Optimal -35°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Cryo-Fauna Abundance (Food)", foodViability, `Requires fauna for food. Current: ${this.cryoFaunaPop.toFixed(1)}`);
            } else if (nodeId === 'quantum_lattices') {
                const magnetFactor = planet.hasMagnetosphere ? 1.0 : 0.25;
                const radViability = Math.max(0.1, 1 - (effRad * (1 - this.radiationResistance)) / 4.0);
                addFactor("Magnetosphere Strength", magnetFactor, `Requires magnetic field to stabilize quantum states.`);
                addFactor("Radiation Interference", radViability, `Current surface radiation: ${effRad.toFixed(1)} rad/s`);
            } else if (nodeId === 'cryo_hivemind') {
                const tempFactor = this.getTempViability(planet.temperature, -60, -35, -25);
                addFactor("Temperature", tempFactor, `Optimal -35°C. Current: ${planet.temperature.toFixed(1)}°C`);
            }
        } else if (isMethane) {
            const solventViability = planet.methaneCoverage / 100.0;
            if (nodeId === 'methane_soup') {
                if (planet.temperature > -190 && planet.temperature < -150 && planet.methaneCoverage > 10) {
                    const tempFactor = 1 - Math.abs(planet.temperature - (-170)) / 15;
                    addFactor("Temperature", tempFactor, `Optimal -170°C. Current: ${planet.temperature.toFixed(1)}°C`);
                    addFactor("Methane Coverage", solventViability, `Requires liquid methane. Current: ${planet.methaneCoverage.toFixed(1)}%`);
                } else {
                    addFactor("Global Habitat", 0, "Liquid methane or temperature outside -190°C - -150°C bounds.");
                }
            } else if (nodeId === 'methane_proto') {
                const tempFactor = this.getTempViability(planet.temperature, -185, -170, -155);
                const nutrientFactor = Math.min(1.0, this.methaneSoup / 15.0);
                addFactor("Temperature", tempFactor, `Optimal -170°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Methane Soup Abundance", nutrientFactor, `Requires methane soup. Current: ${this.methaneSoup.toFixed(1)} ppm`);
            } else if (nodeId === 'methane_multi') {
                const tempFactor = this.getTempViability(planet.temperature, -180, -170, -160);
                addFactor("Temperature", tempFactor, `Optimal -170°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Methane Solvent", solventViability, `Requires methane lakes. Current: ${planet.methaneCoverage.toFixed(1)}%`);
            } else if (nodeId === 'cryo_organisms') {
                const tempFactor = this.getTempViability(planet.temperature, -180, -170, -160);
                const foodViability = Math.min(1.0, this.methaneMultiPop / 15.0);
                addFactor("Temperature", tempFactor, `Optimal -170°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Methane Multicellular Abundance", foodViability, `Requires food. Current: ${this.methaneMultiPop.toFixed(1)}`);
            } else if (nodeId === 'cryo_polymer_network') {
                const tempFactor = this.getTempViability(planet.temperature, -180, -168, -160);
                addFactor("Temperature", tempFactor, `Optimal -168°C. Current: ${planet.temperature.toFixed(1)}°C`);
            } else if (nodeId === 'thinking_ocean') {
                const tempFactor = this.getTempViability(planet.temperature, -180, -168, -160);
                addFactor("Temperature", tempFactor, `Optimal -168°C. Current: ${planet.temperature.toFixed(1)}°C`);
                addFactor("Methane Solvent", solventViability, `Requires deep methane oceans. Current: ${planet.methaneCoverage.toFixed(1)}%`);
            } else if (nodeId === 'cryo_colloid') {
                const tempFactor = this.getTempViability(planet.temperature, -180, -165, -160);
                addFactor("Temperature", tempFactor, `Optimal -165°C. Current: ${planet.temperature.toFixed(1)}°C`);
            }
        }

        // Add Mutagen nudge boost factor
        const hasBoost = this.pendingNudges[nodeId] || (EVOLUTION_GRAPH[planet.activeSolvent]?.[nodeId]?.nudge && this.pendingNudges[EVOLUTION_GRAPH[planet.activeSolvent][nodeId].nudge.id]);
        if (hasBoost) {
            factors.push({ name: "Mutagen Nudge (Boost)", value: 1.0, details: "Active 3.0x mutation and growth booster" });
        }

        this.currentSimulatingNodeId = null;
        return factors;
    }


    /**
     * Helper to compute temperature viability curve
     * Returns a float 0 to 1 based on an asymmetric bell curve, incorporating species-specific genotypes
     */
    getTempViability(temp, min, optimal, max) {
        if (this.currentSimulatingNodeId) {
            const genotype = this.evolutionEngine.getGenotype(this.currentSimulatingNodeId);
            if (genotype && genotype.optimalTemp !== null) {
                min = genotype.minTemp;
                optimal = genotype.optimalTemp;
                max = genotype.maxTemp;
            }
        }
        const offset = (this.thermalResilienceLevel || 0) * 2.0;
        const adjustedMin = min - offset;
        const adjustedMax = max + offset;
        if (temp <= adjustedMin || temp >= adjustedMax) return 0;
        if (temp === optimal) return 1.0;

        if (temp < optimal) {
            return (temp - adjustedMin) / (optimal - adjustedMin);
        } else {
            return (adjustedMax - temp) / (adjustedMax - optimal);
        }
    }

    /**
     * Returns { tempViability, radViability, totalViability } for a node using its
     * adaptive genotype. Delegates to EvolutionEngine.calculateFitness so callers
     * get the same values that getTempViability/radiationResistance already apply
     * internally during growth loops.
     */
    _speciesViability(nodeId, planet) {
        return this.evolutionEngine.calculateFitness(nodeId, planet, this);
    }

    /**
     * Dynamic radiation resistance getter. Returns species genotype resilience if simulated.
     */
    get radiationResistance() {
        if (this.currentSimulatingNodeId) {
            const genotype = this.evolutionEngine.getGenotype(this.currentSimulatingNodeId);
            return genotype ? genotype.radiationResilience : 0.1;
        }
        return this._radiationResistance !== undefined ? this._radiationResistance : 0.1;
    }

    set radiationResistance(val) {
        this._radiationResistance = val;
    }

    /**
     * Helper to get species genotype resource efficiency
     */
    get currentResourceEfficiency() {
        if (this.currentSimulatingNodeId) {
            const genotype = this.evolutionEngine.getGenotype(this.currentSimulatingNodeId);
            return genotype ? genotype.resourceEfficiency : 1.0;
        }
        return 1.0;
    }
}
