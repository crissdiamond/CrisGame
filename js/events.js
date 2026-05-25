/**
 * Handles checking conditions, rolling probabilities, applying effects,
 * managing warnings/threats, and processing player token spending.
 */
export class EventSystem {
    constructor() {
        this.checkInterval = 2.0;         // Check for events every 2.0 Myr
        this.timeAccumulator = 0.0;
        
        // Player resource
        this.tokens = 15.0;
        
        // Active event tracking
        this.activeEvents = []; // Array of { id, name, remainingDuration, onEnd }
        this.triggeredUniqueEvents = new Set();
        
        // Active warnings/threats
        this.warnings = []; // Array of { id, name, description, durationRemaining, cost, apply, type }

        // Last state of unlocks to detect new milestones
        this.prevUnlocks = {
            unlockedSoup: false,
            unlockedMembrane: false,
            unlockedBacteria: false,
            unlockedAnaerobic: false,
            unlockedPhotosynthetic: false,
            unlockedNucleus: false,
            unlockedMitochondria: false,
            unlockedSexualReproduction: false,
            unlockedEukaryotic: false,
            unlockedMulticellular: false,
            unlockedSponges: false,
            unlockedMeduses: false,
            unlockedWorms: false,
            unlockedFish: false,
            unlockedMosses: false,
            unlockedFerns: false,
            unlockedConifers: false,
            unlockedAngiosperms: false,
            unlockedCambrian: false,
            unlockedLandPlants: false, unlockedArthropod: false, unlockedTetrapod: false,
            unlockedSauropsid: false, unlockedSynapsid: false,
            unlockedCognitive: false, unlockedTechnologicalAI: false,
            unlockedCyborg: false, unlockedNoosphere: false, unlockedGaiaHivemind: false,
            unlockedAmmonicSoup: false, unlockedAmmonicProto: false, unlockedAmmonicMulti: false,
            unlockedSilicoFlora: false, unlockedCryoFauna: false, unlockedCrystallineCognitive: false,
            unlockedQuantumLattice: false, unlockedCryoHivemind: false,
            unlockedMethaneSoup: false, unlockedMethaneProto: false, unlockedMethaneMulti: false,
            unlockedCryoOrganisms: false, unlockedCryoPolymerNetwork: false,
            unlockedThinkingOcean: false, unlockedCryoColloid: false
        };
        
        // Define our registry of events (with their normal application logic)
        this.eventsRegistry = [
            {
                id: "carbonaceous_impactor",
                name: "C-Type Carbonaceous Impactor",
                description: "A carbonaceous asteroid rich in water ice and organic compounds is approaching. It can seed chemistry, but impact winter will stress advanced life.",
                scientificDetails: "Carbonaceous chondrites are primitive, volatile-rich bodies containing hydrated minerals, amino-acid precursors, and complex organics. Small impacts can fertilize prebiotic chemistry while ejecta dust briefly blocks sunlight and cools the surface.",
                type: (p, b) => this.hasMulticellularLife(b) ? "hazard" : "bonus",
                chance: 0.18,
                cost: 3,
                warningDuration: 4.0,
                condition: (p, b) => p.age > 10.0,
                apply: (p, b) => {
                    p.applyImpact("carbonaceous", "small");
                    b.organicSoup = Math.min(100.0, b.organicSoup + 15.0);
                    b.anaerobicPop *= 1.05;
                    b.photosyntheticPop *= 1.03;
                    this.scaleAdvancedLife(b, 0.55);
                    return "Carbonaceous impact delivered water and organics. A short impact winter began, while complex organisms suffered regional collapse.";
                }
            },
            {
                id: "silicaceous_impactor",
                name: "S-Type Silicaceous Impactor",
                description: "A rocky silicate asteroid is on an impact path. Regional crust vaporization will trigger impact winter followed by CO2 greenhouse rebound.",
                scientificDetails: "Silicaceous asteroids are rocky olivine- and pyroxene-rich bodies. Their impacts excavate silicate crust, loft reflective dust, and can vaporize carbonate rocks, producing a delayed carbon dioxide warming pulse after the initial cooling.",
                type: "hazard",
                chance: 0.12,
                cost: 6,
                warningDuration: 3.0,
                condition: (p, b) => p.age > 10.0,
                apply: (p, b) => {
                    p.applyImpact("silicaceous", "medium");
                    this.scaleProkaryotes(b, 0.70);
                    this.scaleAdvancedLife(b, 0.40);
                    return "Rocky asteroid struck. Dust-driven cooling began, CO2 increased, and complex ecosystems lost roughly 60% of their biomass.";
                }
            },
            {
                id: "metallic_impactor",
                name: "M-Type Metallic Bolide",
                description: "A dense iron-nickel impactor is inbound at high velocity. Deflection is difficult and surface energy release will be extinction-level.",
                scientificDetails: "Metallic M-type bodies are dense iron-nickel fragments, so an equal-size impactor carries more kinetic energy than porous rock or ice. The impact produces severe thermal shock, a long dust winter, and a later greenhouse rebound from vaporized carbonates.",
                type: "hazard",
                chance: 0.06,
                cost: 12,
                warningDuration: 2.0,
                condition: (p, b) => p.age > 10.0,
                apply: (p, b) => {
                    p.applyImpact("metallic", "kp");
                    this.scaleProkaryotes(b, 0.20);
                    this.scaleAdvancedLife(b, 0.08);
                    return "Iron-nickel bolide impacted. Heat shock, impact winter, and greenhouse rebound created a mass-extinction pulse; core metals strengthened the dynamo.";
                }
            },
            {
                id: "cometary_nucleus",
                name: "Long-Period Cometary Nucleus",
                description: "An icy comet from the outer system is falling inward. It can hydrate a dry planet, but its dust plume will cause a severe impact winter.",
                scientificDetails: "Long-period comets are volatile-rich ice and dust aggregates. They can deliver water and organics to dry worlds, but their high velocities and fine ejecta load can block sunlight efficiently after impact.",
                type: (p, b) => p.waterCoverage < 10.0 && !this.hasMulticellularLife(b) ? "bonus" : "hazard",
                chance: 0.10,
                cost: 4,
                warningDuration: 5.0,
                condition: (p, b) => p.age > 10.0,
                apply: (p, b) => {
                    p.applyImpact("cometary", "medium");
                    b.organicSoup = Math.min(100.0, b.organicSoup + 8.0);
                    if (p.waterCoverage < 25.0) {
                        this.scaleProkaryotes(b, 1.05);
                    }
                    this.scaleAdvancedLife(b, this.hasMulticellularLife(b) ? 0.25 : 0.75);
                    return "Icy comet delivered a major water pulse and organics, followed by a deep dust winter that punished established ecosystems.";
                }
            },
            {
                id: "solar_flare",
                name: "Solar Flare Warning",
                description: "Stellar corona shows extreme magnetic twisting. A superflare will launch ionizing radiation toward the planet.",
                scientificDetails: "Solar superflares launch billions of tons of high-energy protons and ions (Coronal Mass Ejections). Without a planetary magnetic shield to deflect them, these particles collide directly with atmospheric molecules, triggering radiolysis, ozone destruction, and gradual atmospheric stripping.",
                type: "hazard",
                chance: 0.18,
                cost: 8,
                warningDuration: 2.0,
                condition: (p, b) => !p.hasMagnetosphere && !this.isEventActive("solar_flare"),
                duration: 6.0,
                apply: (p, b) => {
                    p.targetRadiation = 9.5;
                    
                    // Kill off unprotected populations
                    b.anaerobicPop *= 0.5;
                    b.photosyntheticPop *= 0.4;
                    b.multicellularPop *= 0.15;
                    b.eukaryoticPop *= 0.3;
                    if (b.sauropsidPop > 0) b.sauropsidPop *= 0.2;
                    if (b.synapsidPop > 0) b.synapsidPop *= 0.2;
                    
                    return "Superflare struck! Cosmic radiation spiked to 9.5 rad/s. Severe genetic mutations and cellular deaths reported.";
                },
                onEnd: (p, b) => {
                    p.targetRadiation = 3.5;
                    return "Solar flare subsided. Radiation levels normalizing.";
                }
            },
            {
                id: "volcanic_eruption",
                name: "Volcanic Outgassing Warning",
                description: "Sub-crustal convective pressures are building. Super-volcanoes are preparing to vent huge quantities of greenhouse gases.",
                scientificDetails: "Severe mantle convection leads to flood basalt volcanism, releasing massive amounts of carbon dioxide (CO2), sulfur dioxide (SO2), and halogen gases. While sulfur compounds cause brief cooling and acid rain, the accumulated CO2 leads to long-term global greenhouse warming.",
                type: "alert",
                chance: 0.20,
                cost: 10,
                warningDuration: 2.5,
                condition: (p, b) => p.age > 20.0 && !this.isEventActive("volcanic_eruption"),
                duration: 8.0,
                apply: (p, b) => {
                    p.targetTemperature = Math.min(150, p.temperature + 20);
                    p.co2 = Math.min(100, p.co2 + 10);
                    p.rebalanceAtmosphere();
                    return "Volcanism active! Extreme CO₂ outgassing triggered a warming spike.";
                },
                onEnd: (p, b) => {
                    return "Volcanic vents cooling down. Atmospheric gas ratios stabilizing.";
                }
            },
            {
                id: "glaciation_warning",
                name: "Glaciation Warning",
                description: "Albedo runaway ice reflection is beginning. The planet is slipping into a Snowball global freeze.",
                scientificDetails: "Runaway glaciation occurs due to ice-albedo positive feedback. As temperatures drop, snow and ice coverage expands, reflecting more stellar radiation back into space. This drives further cooling until ice sheets meet at the equator, locking the planet in a 'Snowball Earth' state.",
                type: "hazard",
                chance: 0.15,
                cost: 12,
                warningDuration: 4.0,
                condition: (p, b) => p.temperature < 15.0 && !p.isGlaciated && !this.isEventActive("glaciation"),
                duration: 10.0,
                apply: (p, b) => {
                    p.isGlaciated = true;
                    if (b.photosyntheticPop > 0) b.photosyntheticPop *= 0.2;
                    if (b.landPlantsPop > 0) {
                        b.landPlantsPop *= 0.1;
                        b.mossesPop *= 0.1;
                        b.fernsPop *= 0.1;
                        b.conifersPop *= 0.1;
                        b.angiospermsPop *= 0.1;
                    }
                    if (b.multicellularPop > 0) b.multicellularPop *= 0.15;
                    return "Glaciation locked! Surface temperature plummeted, oceans frozen solid, photosynthesis crippled by 80%.";
                },
                onEnd: (p, b) => {
                    p.isGlaciated = false;
                    return "Ice sheets retreating. Surface warming starting.";
                }
            },
            {
                id: "gamma_ray_burst",
                name: "Gamma-Ray Burst Warning",
                description: "A nearby binary neutron star merger has released a high-energy beam. Gamma radiation will strip the ozone layer.",
                scientificDetails: "A relativistic gamma-ray burst from a collapsing massive star strikes the atmosphere, ionizing nitrogen and oxygen molecules to produce nitrogen oxides (NOx). These compounds act as catalytic agents that destroy the ozone layer, exposing surface life to lethal UV-B radiation.",
                type: "hazard",
                chance: 0.05, // Extremely rare
                cost: 25,
                warningDuration: 4.5,
                condition: (p, b) => p.age > 100.0,
                duration: 15.0,
                apply: (p, b) => {
                    p.ozone = 0.0;
                    p.targetRadiation = 10.0;
                    
                    // Decimate surface life
                    if (b.landPlantsPop > 0) {
                        b.landPlantsPop *= 0.02;
                        b.mossesPop *= 0.02;
                        b.fernsPop *= 0.02;
                        b.conifersPop *= 0.02;
                        b.angiospermsPop *= 0.02;
                    }
                    if (b.arthropodPop > 0) b.arthropodPop *= 0.01;
                    if (b.sauropsidPop > 0) b.sauropsidPop *= 0.02;
                    if (b.synapsidPop > 0) b.synapsidPop *= 0.01;
                    
                    return "GRB struck! Ozone layer annihilated. Cosmic radiation pegged at 10.0 rad/s. Surface life completely sterile.";
                },
                onEnd: (p, b) => {
                    p.targetRadiation = 3.5;
                    return "GRB beam passed. Atmosphere beginning photochemical rebuild of ozone.";
                }
            },
            {
                id: "passing_star",
                name: "Stellar Passage Warning",
                description: "A rogue red dwarf star is passing near our solar system. Gravity distortion will perturb the planet's orbit.",
                scientificDetails: "A close stellar passage perturbs the planetary orbit, altering its eccentricity. This shifts the insolation baseline, triggering extreme seasonal temperature swings, tides, and potential climate instability.",
                type: "hazard",
                chance: 0.03, // Extremely rare
                cost: 30,
                warningDuration: 3.5,
                condition: (p, b) => p.age > 150.0,
                apply: (p, b) => {
                    p.targetTemperature = p.temperature > 30 ? Math.min(150, p.temperature + 45) : Math.max(-100, p.temperature - 50);
                    p.setTargetSolventCoverage(Math.max(0, p.getSolventCoverage() - 30));
                    return "Rogue star perturbance! Orbit shifted, triggering extreme temperature fluctuations and ocean disruptions.";
                }
            }
        ];
    }

    isEventActive(id) {
        return this.activeEvents.some(e => e.id === id);
    }

    hasMulticellularLife(biology) {
        return [
            biology.multicellularPop,
            biology.spongesPop,
            biology.medusesPop,
            biology.wormsPop,
            biology.fishPop,
            biology.cambrianPop,
            biology.landPlantsPop,
            biology.arthropodPop,
            biology.tetrapodPop,
            biology.sauropsidPop,
            biology.synapsidPop,
            biology.cognitiveSpeciesPop,
            biology.ammonicMultiPop,
            biology.cryoFaunaPop,
            biology.methaneMultiPop,
            biology.cryoOrganismsPop
        ].some(pop => pop > 0);
    }

    scaleProkaryotes(biology, factor) {
        biology.anaerobicPop *= factor;
        biology.photosyntheticPop *= factor;
        biology.ammonicProtoPop *= factor;
        biology.methaneProtoPop *= factor;
    }

    scaleAdvancedLife(biology, factor) {
        const populations = [
            'eukaryoticPop',
            'multicellularPop',
            'spongesPop',
            'medusesPop',
            'wormsPop',
            'fishPop',
            'mossesPop',
            'fernsPop',
            'conifersPop',
            'angiospermsPop',
            'cambrianPop',
            'arthropodPop',
            'tetrapodPop',
            'sauropsidPop',
            'synapsidPop',
            'cognitiveSpeciesPop',
            'technologicalAIPop',
            'cyborgPop',
            'noospherePop',
            'gaiaHivemindPop',
            'ammonicMultiPop',
            'silicoFloraPop',
            'cryoFaunaPop',
            'crystallineCognitivePop',
            'quantumLatticePop',
            'cryoHivemindPop',
            'methaneMultiPop',
            'cryoOrganismsPop',
            'cryoPolymerNetworkPop',
            'thinkingOceanPop',
            'cryoColloidPop'
        ];

        populations.forEach(key => {
            biology[key] *= factor;
        });
        biology.landPlantsPop = biology.mossesPop + biology.fernsPop + biology.conifersPop + biology.angiospermsPop;
    }

    /**
     * Spend tokens to deflect a warning
     */
    deflectWarning(warningId) {
        const index = this.warnings.findIndex(w => w.id === warningId);
        if (index !== -1) {
            const warning = this.warnings[index];
            if (this.tokens >= warning.cost) {
                this.tokens -= warning.cost;
                this.warnings.splice(index, 1);
                return {
                    success: true,
                    msg: `Deflected ${warning.name}! Spent ${warning.cost} tokens.`
                };
            }
        }
        return { success: false, msg: "Insufficient tokens or invalid warning ID." };
    }

    /**
     * Determine compatibility of an intervention with the current planet and biology state
     */
    getInterventionCompatibility(type, planet, biology) {
        switch (type) {
            case 'water_comet':
            case 'ammonia_comet':
            case 'methane_comet':
                return { compatible: true };
            case 'giant_collision':
                if (planet.age < 500.0) {
                    return { compatible: true };
                } else {
                    return { compatible: false, reason: "Planet crust solidified. Can only collide in early stages (<500 Myr)." };
                }
            case 'gravitational_resonance':
                if (planet.magneticStrength < 95.0) {
                    return { compatible: true };
                } else {
                    return { compatible: false, reason: "Magnetic shield is already at maximum strength." };
                }
            case 'volcanic_eruption':
                if (planet.age > 10.0) {
                    return { compatible: true };
                } else {
                    return { compatible: false, reason: "Planet core is too young and geologically unstable (<10 Myr)." };
                }
            case 'methanogen_bloom': {
                const unlocked = !!(biology.unlockedBacteria || biology.unlockedAnaerobic || biology.unlockedAmmonicProto || biology.unlockedMethaneProto);
                if (unlocked) {
                    return { compatible: true };
                } else {
                    return { compatible: false, reason: "Requires anaerobic archaea or simple proto-cells to be unlocked." };
                }
            }
            case 'silicate_weathering': {
                const hasCo2 = planet.co2 > 2.0;
                const hasSolvent = planet.getSolventCoverage() > 5.0;
                if (hasCo2 && hasSolvent) {
                    return { compatible: true };
                } else if (!hasCo2 && !hasSolvent) {
                    return { compatible: false, reason: "Requires atmospheric CO2 > 2.0% and liquid solvent coverage > 5.0%." };
                } else if (!hasCo2) {
                    return { compatible: false, reason: "Requires atmospheric CO2 > 2.0%." };
                } else {
                    return { compatible: false, reason: "Requires liquid solvent coverage > 5.0% for chemical rain reaction." };
                }
            }
            case 'dust_veil':
                if (!planet.dustVeilActive) {
                    return { compatible: true };
                } else {
                    return { compatible: false, reason: "Stratospheric dust veil is already active." };
                }
            case 'cyanobacteria_bloom': {
                const unlocked = !!(biology.unlockedPhotosynthetic || biology.unlockedSilicoFlora);
                if (unlocked) {
                    return { compatible: true };
                } else {
                    return { compatible: false, reason: "Requires photosynthetic cyanobacteria or alternative silico-flora to be unlocked." };
                }
            }
            default:
                return { compatible: false, reason: "Unknown event type." };
        }
    }

    /**
     * Trigger comet injection or positive intervention
     */
    triggerIntervention(type, planet, biology) {
        if (type === 'water_comet') {
            if (this.tokens >= 6) {
                this.tokens -= 6;
                planet.waterCoverage = Math.min(100, planet.waterCoverage + 20);
                planet.targetWaterCoverage = Math.min(100, planet.targetWaterCoverage + 20);
                biology.organicSoup = Math.min(100, biology.organicSoup + 10.0);
                planet.rebalanceAtmosphere();
                return { 
                    success: true, 
                    title: "☄️ WATER COMET COLLISION", 
                    msg: "Water-rich comet directed! Water coverage increased by +20% and prebiotic soup enriched.",
                    scientificDetails: "Directing carbonaceous chondrite comets from the outer solar system utilizes orbital gravity-assist nudges to deposit water vapor, nitrogen compounds, and amino acid precursors directly onto the planetary crust, seeding prebiotic chemistry."
                };
            }
        } else if (type === 'ammonia_comet') {
            if (this.tokens >= 6) {
                this.tokens -= 6;
                planet.ammoniaCoverage = Math.min(100, planet.ammoniaCoverage + 25);
                planet.targetAmmoniaCoverage = Math.min(100, planet.targetAmmoniaCoverage + 25);
                biology.ammonicSoup = Math.min(100, biology.ammonicSoup + 15.0);
                return { 
                    success: true, 
                    title: "☄️ AMMONIA COMET COLLISION", 
                    msg: "Ammonia-rich comet directed! Ammonia coverage increased by +25%.",
                    scientificDetails: "Directing ammonia-rich comets from the planetary boundary delivers concentrated nitrogenous species. Liquid ammonia acts as a cryogenic ionizing solvent, establishing alternative biochemistry pathways at sub-freezing temperatures."
                };
            }
        } else if (type === 'methane_comet') {
            if (this.tokens >= 6) {
                this.tokens -= 6;
                planet.methaneCoverage = Math.min(100, planet.methaneCoverage + 20);
                planet.targetMethaneCoverage = Math.min(100, planet.targetMethaneCoverage + 20);
                biology.methaneSoup = Math.min(100, biology.methaneSoup + 12.0);
                planet.h2 = Math.min(100, planet.h2 + 5.0);
                planet.rebalanceAtmosphere();
                return { 
                    success: true, 
                    title: "☄️ HYDROCARBON COMET COLLISION", 
                    msg: "Methane-rich comet directed! Hydrocarbon coverage increased by +20%.",
                    scientificDetails: "Hydrocarbon comets deposit volatile methane and ethane. On cold planets, these condense into liquid lakes, providing non-polar media suitable for hydrophobic azotosomal membranes to assemble."
                };
            }
        } else if (type === 'giant_collision') {
            if (planet.age > 500.0) {
                return { success: false, title: "ACTION FAILED", msg: "Planet has solidified. Giant collisions are only possible in early stages (<500 Myr)." };
            }
            if (this.tokens >= 15) {
                this.tokens -= 15;
                planet.hasMoon = true;
                planet.magneticStrength = Math.min(100.0, planet.magneticStrength + 35.0);
                planet.hasMagnetosphere = true;
                planet.temperature = Math.min(150, planet.temperature + 45.0);
                planet.targetTemperature = Math.min(150, planet.targetTemperature + 45.0);
                planet.co2 = Math.min(100, planet.co2 + 10.0);
                planet.rebalanceAtmosphere();
                return {
                    success: true,
                    title: "💥 GIANT PROTOPLANET COLLISION",
                    msg: "Mars-sized impactor collides! Core merged, Moon formed (+2.5x tide boost), crust melted.",
                    scientificDetails: "A giant impact with a Mars-sized protoplanet (like Theia on early Earth) vaporizes surface water, releases mantle volatiles, and ejects a massive debris ring that quickly coalesces to form a Moon. The iron cores merge, boosting the planetary geodynamo convection and magnetic shield potential."
                };
            }
        } else if (type === 'gravitational_resonance') {
            if (this.tokens >= 12) {
                this.tokens -= 12;
                planet.magneticStrength = 100.0;
                planet.hasMagnetosphere = true;
                return { 
                    success: true, 
                    title: "🧲 GRAVITATIONAL RESONANCE NUDGE", 
                    msg: "Orbital tidal flex heated core. Core convection dynamo returns to 100%.",
                    scientificDetails: "A close gravitational transit from a passing giant planet or star induces tidal forces, heating the iron core via frictional flexing. This restarts mantle-core convection and re-establishes the planetary geodynamo magnetosphere shield."
                };
            }
        } else if (type === 'volcanic_eruption') {
            if (this.tokens >= 10) {
                this.tokens -= 10;
                planet.co2 = Math.min(100, planet.co2 + 12.0);
                planet.atmospherePressure = Math.min(3.0, planet.atmospherePressure + 0.2);
                planet.rebalanceAtmosphere();
                return {
                    success: true,
                    title: "🌋 TRIGGER VOLCANIC ERUPTION",
                    msg: "Induced flood basalt volcanism! Outgassed massive CO2 and heated climate.",
                    scientificDetails: "Tectonic triggers open deep crustal vents. Massive volcanic outgassing releases greenhouse carbon dioxide and vapor, creating a thick heat-trapping atmospheric blanket."
                };
            }
        } else if (type === 'methanogen_bloom') {
            if (this.tokens >= 8) {
                this.tokens -= 8;
                planet.ch4 = Math.min(100, planet.ch4 + 12.0);
                planet.rebalanceAtmosphere();
                return {
                    success: true,
                    title: "🦠 INDUCE METHANOGENIC BLOOM",
                    msg: "Stimulated hydrothermal methanogens! CH4 outgassed (+12%) warming the planet.",
                    scientificDetails: "Adding chemical trace minerals stimulates deep-sea methanotrophic archaea. These simple prokaryotes consume hydrogen gas and vent massive amounts of methane (CH₄), a greenhouse gas 25x more potent than CO₂."
                };
            }
        } else if (type === 'silicate_weathering') {
            if (this.tokens >= 10) {
                this.tokens -= 10;
                planet.co2 = Math.max(0.5, planet.co2 - 8.0);
                planet.rebalanceAtmosphere();
                return {
                    success: true,
                    title: "🪨 SILICATE WEATHERING STIMULATION",
                    msg: "Accelerated rock chemical weathering. Absorbed atmospheric CO2 and cooled climate.",
                    scientificDetails: "Stimulating continental rock weathering accelerates the carbon-silicate cycle. Rainwater combines with CO₂ to form carbonic acid, which dissolves surface rocks, trapping carbon as limestone in sea sediments and cooling the planet."
                };
            }
        } else if (type === 'dust_veil') {
            if (this.tokens >= 8) {
                this.tokens -= 8;
                planet.dustVeilActive = true;
                return {
                    success: true,
                    title: "🌫️ SEED AEROSOL DUST VEIL",
                    msg: "Directed minor asteroid dust veil! Starlight blocked, cooling surface temperature.",
                    scientificDetails: "Directing a minor carbonaceous body to disintegrate in the upper atmosphere releases sulfur and dust aerosols. This creates a stratospheric dust veil that reflects starlight, acting as a natural planetary parasol."
                };
            }
        } else if (type === 'cyanobacteria_bloom') {
            if (this.tokens >= 8) {
                this.tokens -= 8;
                planet.co2 = Math.max(0.5, planet.co2 - 5.0);
                planet.o2 = Math.min(100, planet.o2 + 8.0);
                planet.rebalanceAtmosphere();
                return {
                    success: true,
                    title: "🌿 INDUCE CYANOBACTERIA BLOOM",
                    msg: "Seeded oceanic iron fertilizers! Algae bloom absorbed CO2 and vented +8% oxygen.",
                    scientificDetails: "Adding iron or phosphorus nutrients to liquid basins triggers a runaway bloom of photosynthetic cyanobacteria. These prokaryotes consume atmospheric carbon dioxide to produce gaseous oxygen (O₂)."
                };
            }
        }
        return { success: false, title: "ACTION FAILED", msg: "Insufficient tokens." };
        return { success: false, title: "ACTION FAILED", msg: "Insufficient tokens." };
    }

    /**
     * Evolve nudging
     */
    nudgeEvolution(adaptationId, cost, biology) {
        if (this.tokens >= cost) {
            this.tokens -= cost;
            biology.applyAdaptation(adaptationId);
            return { success: true, msg: `Nudge successful! Unlocked gene adaptation: ${adaptationId.toUpperCase()}` };
        }
        return { success: false, msg: "Insufficient tokens." };
    }

    /**
     * Tick event system. Returns array of event notification logs to display.
     */
    tick(planet, biology, tickRate) {
        const outputLogs = [];
        
        // 1. Earn tokens based on biosphere biomass / complexity
        let biomassRating = 0;
        if (planet.activeSolvent === 'water') {
            biomassRating = (
                biology.anaerobicPop * 0.01 +
                biology.photosyntheticPop * 0.02 +
                biology.eukaryoticPop * 0.04 +
                biology.multicellularPop * 0.08 +
                biology.cambrianPop * 0.12 +
                biology.landPlantsPop * 0.12 +
                biology.arthropodPop * 0.15 +
                biology.tetrapodPop * 0.18 +
                biology.sauropsidPop * 0.25 +
                biology.synapsidPop * 0.25 +
                biology.cognitiveSpeciesPop * 0.35 +
                biology.technologicalAIPop * 0.45 +
                biology.cyborgPop * 0.40 +
                biology.noospherePop * 0.50 +
                biology.gaiaHivemindPop * 0.50
            );
        } else if (planet.activeSolvent === 'ammonia') {
            biomassRating = (
                biology.ammonicProtoPop * 0.02 +
                biology.ammonicMultiPop * 0.08 +
                biology.silicoFloraPop * 0.15 +
                biology.cryoFaunaPop * 0.25 +
                biology.crystallineCognitivePop * 0.35 +
                biology.quantumLatticePop * 0.40 +
                biology.cryoHivemindPop * 0.45
            );
        } else if (planet.activeSolvent === 'methane') {
            biomassRating = (
                biology.methaneProtoPop * 0.02 +
                biology.methaneMultiPop * 0.08 +
                biology.cryoOrganismsPop * 0.25 +
                biology.cryoPolymerNetworkPop * 0.35 +
                biology.thinkingOceanPop * 0.40 +
                biology.cryoColloidPop * 0.45
            );
        }

        // Accrual rate: flat base rate + biomass boost
        const accrual = (0.2 + biomassRating * 0.15) * tickRate;
        this.tokens = Math.min(99.0, this.tokens + accrual);

        // Check milestones and award flat bonuses
        for (const k in this.prevUnlocks) {
            if (biology[k] && !this.prevUnlocks[k]) {
                this.prevUnlocks[k] = true;
                this.tokens = Math.min(99.0, this.tokens + 5.0);
                outputLogs.push({
                    title: "🎁 MILESTONE UNLOCKED (+5 tokens)",
                    desc: `Your planet achieved a biological leap: ${k.replace('unlocked', '').toUpperCase()}`,
                    type: "system_silent" // Silent log that doesn't trigger the modal popup
                });
            }
        }

        // 2. Core Dynamo Low Warning
        if (planet.magneticStrength < 40.0 && planet.hasMagnetosphere) {
            const hasDynamoWarning = this.warnings.some(w => w.id === 'dynamo_decay');
            if (!hasDynamoWarning) {
                this.warnings.push({
                    id: 'dynamo_decay',
                    name: "MAGNETIC FIELD CRITICAL",
                    description: "Convective core cooling. Shield strength has dropped below 40%. Magnetosphere collapse imminent.",
                    scientificDetails: "As the outer nickel-iron core cools, thermal convection currents decline. This slows the geodynamo, weakening and ultimately collapsing the protective magnetosphere shield that diverts high-energy stellar winds.",
                    durationRemaining: 4.0,
                    cost: 15,
                    type: "alert",
                    apply: (p, b) => {
                        p.hasMagnetosphere = false;
                        p.magneticStrength = 10.0;
                        return "Magnetosphere collapsed! Atmosphere stripping active.";
                    }
                });
            }
        }

        // 3. Process active warnings/threats
        for (let i = this.warnings.length - 1; i >= 0; i--) {
            const warning = this.warnings[i];
            warning.durationRemaining -= tickRate;
            
            if (warning.durationRemaining <= 0) {
                // Warning triggered! Disaster strikes
                const effectMsg = warning.apply(planet, biology);
                
                if (warning.id !== 'dynamo_decay') {
                    const registryEvent = this.eventsRegistry.find(e => e.id === warning.id);
                    if (registryEvent && registryEvent.duration) {
                        this.activeEvents.push({
                            id: registryEvent.id,
                            name: registryEvent.name.replace(' Warning', ''),
                            remainingDuration: registryEvent.duration
                        });
                    }
                }

                outputLogs.push({
                    title: `💥 THREAT TRIGGERED: ${warning.name}`,
                    desc: effectMsg,
                    scientificDetails: warning.scientificDetails,
                    type: "hazard"
                });
                
                this.warnings.splice(i, 1);
            }
        }

        // 4. Process active duration-based events
        for (let i = this.activeEvents.length - 1; i >= 0; i--) {
            const active = this.activeEvents[i];
            active.remainingDuration -= tickRate;
            
            if (active.remainingDuration <= 0) {
                const registryEvent = this.eventsRegistry.find(e => e.id === active.id);
                if (registryEvent && registryEvent.onEnd) {
                    const cleanupMsg = registryEvent.onEnd(planet, biology);
                    outputLogs.push({
                        title: `${active.name} [ENDED]`,
                        desc: cleanupMsg,
                        type: "system"
                    });
                }
                this.activeEvents.splice(i, 1);
            }
        }

        // 5. Accumulate time to check for triggering new warnings
        this.timeAccumulator += tickRate;
        if (this.timeAccumulator >= this.checkInterval) {
            this.timeAccumulator = 0.0;
            
            const candidates = this.eventsRegistry.filter(e => {
                if (this.warnings.some(w => w.id === e.id) || this.isEventActive(e.id)) {
                    return false;
                }
                return e.condition(planet, biology);
            });

            if (candidates.length > 0) {
                const selected = candidates[Math.floor(Math.random() * candidates.length)];
                
                if (Math.random() < selected.chance) {
                    const warningType = typeof selected.type === 'function' ? selected.type(planet, biology) : selected.type;
                    // Queue a threat warning!
                    this.warnings.push({
                        id: selected.id,
                        name: selected.name,
                        description: selected.description,
                        scientificDetails: selected.scientificDetails,
                        durationRemaining: selected.warningDuration,
                        cost: selected.cost,
                        apply: selected.apply,
                        type: warningType
                    });

                    outputLogs.push({
                        title: `⚠️ DETECTED: ${selected.name.toUpperCase()}`,
                        desc: `${selected.description} TIME TO EFFECT: ${selected.warningDuration.toFixed(1)} Myr. Spend ${selected.cost} tokens to avoid.`,
                        type: warningType === "bonus" ? "system" : "alert"
                    });
                }
            }
        }

        return outputLogs;
    }
}
