import { EVOLUTION_GRAPH, getEvolutionNode } from './evolutionData.js';

// Base temperature ranges [min, optimal, max] for all species
const BASE_TEMP_RANGES = {
    // --- Water Line (Standard Biochemistry) ---
    soup: [10, 50, 90],
    bacteria: [0, 45, 80],
    anaerobic: [0, 45, 80],
    anoxygenic_photo: [5, 35, 70],
    photosynthetic: [5, 30, 60],
    eukaryotes: [10, 25, 50],
    multicellular: [10, 22, 42],
    algae: [5, 22, 45],
    sponges: [10, 22, 40],
    meduses: [10, 22, 38],
    worms: [8, 20, 38],
    fish: [8, 20, 36],
    cambrian: [8, 20, 38],
    mosses: [0, 20, 38],
    ferns: [2, 22, 40],
    conifers: [-10, 18, 36],
    angiosperms: [5, 22, 42],
    insects: [5, 24, 42],
    tetrapods: [8, 22, 38],
    sauropsids: [12, 32, 45],
    synapsids: [5, 18, 30],
    cognitive: [5, 20, 35],
    cyborg: [5, 20, 38],
    gaia_hivemind: [5, 22, 45],

    // --- Ammonia Line (Cryogenic Worlds) ---
    ammonic_soup: [-80, -40, -10],
    ammonic_proto: [-75, -40, -15],
    ammonic_multi: [-85, -60, -35],
    silico_flora: [-80, -58, -35],
    cryo_fauna: [-80, -60, -40],
    crystalline_cognitive: [-100, -65, -45],
    quantum_lattices: [-80, -58, -30],
    cryo_hivemind: [-60, -35, -25],

    // --- Methane Line (Titan-like Worlds) ---
    methane_soup: [-190, -170, -150],
    methane_proto: [-185, -160, -140],
    methane_multi: [-183, -162, -140],
    cryo_organisms: [-185, -165, -145],
    cryo_polymer_network: [-185, -165, -145],
    thinking_ocean: [-183, -162, -140],
    cryo_colloid: [-183, -162, -140]
};

export class EvolutionEngine {
    constructor() {
        this.speciesGenotypes = {};
    }

    /**
     * Initializes the genotype for a species if it has not been set up.
     */
    initializeGenotype(nodeId) {
        if (this.speciesGenotypes[nodeId]) return this.speciesGenotypes[nodeId];

        const node = getEvolutionNode(nodeId);
        if (!node) return null;

        const baseRange = BASE_TEMP_RANGES[nodeId];
        const baseOpt = baseRange ? baseRange[1] : null;
        const baseMin = baseRange ? baseRange[0] : null;
        const baseMax = baseRange ? baseRange[2] : null;

        this.speciesGenotypes[nodeId] = {
            optimalTemp: baseOpt,
            minTemp: baseMin,
            maxTemp: baseMax,
            baseOptimalTemp: baseOpt,
            tempSpanLower: baseOpt !== null ? (baseOpt - baseMin) : null,
            tempSpanUpper: baseOpt !== null ? (baseMax - baseOpt) : null,
            radiationResilience: 0.1, // starts at 10% base
            resourceEfficiency: 1.0,  // starts at 1.0x efficiency
            generation: 0
        };

        return this.speciesGenotypes[nodeId];
    }

    /**
     * Retrieves the current genotype of a species, initializing it if missing.
     */
    getGenotype(nodeId) {
        return this.speciesGenotypes[nodeId] || this.initializeGenotype(nodeId);
    }

    /**
     * Advances selection pressures and dynamic adaptations for all active species.
     */
    update(planet, biology, tickRate) {
        const activeNodes = EVOLUTION_GRAPH[planet.activeSolvent];
        if (!activeNodes) return;

        // Constants for selection speed tuning
        const S_thermal = 0.05;  // Thermal adaptation selection coefficient
        const S_rad     = 0.08;  // Radiation selection coefficient
        const S_eff     = 0.05;  // Resource efficiency selection coefficient
        const mu_base   = 0.2;   // Base mutation coefficient per tick

        // Get effective radiation
        const effRad = planet.radiation * (planet.hasMagnetosphere ? 0.25 : 1.0) * (1.0 - 0.9 * (planet.ozone || 0.0));

        for (const nodeId in activeNodes) {
            const node = activeNodes[nodeId];
            
            // Check if population is active
            let pop = 0.0;
            if (biology.biomassMap && typeof biology.biomassMap[nodeId] === 'number') {
                pop = biology.biomassMap[nodeId];
            } else if (typeof biology[node.popKey] === 'number') {
                pop = biology[node.popKey];
            }

            // Species must have an active, unlocked population to adapt
            if (pop <= 0.01) continue;

            const genotype = this.getGenotype(nodeId);
            if (!genotype) continue;

            // 1. Calculate mutation rate scaled by species evolvability and radiation exposure
            const evolvability = node.evolvability || 0.1;
            const mu_species = mu_base * evolvability * (1.0 + effRad * 2.0);

            // Increment generation counter (fractionally representing genetic cycles in geological time)
            genotype.generation += mu_species * tickRate;

            // 2. Thermal Adaptation Selection (drifting optimal temperature)
            if (genotype.optimalTemp !== null) {
                const thermalCap = node.thermalCap !== undefined ? node.thermalCap : 50.0;
                const minThermalCap = node.minThermalCap !== undefined ? node.minThermalCap : 0.0;

                const deltaTemp = (planet.temperature - genotype.optimalTemp) * S_thermal * mu_species * tickRate;
                let targetOpt = genotype.optimalTemp + deltaTemp;

                // Enforce biological hard bounds
                targetOpt = Math.max(minThermalCap, Math.min(thermalCap, targetOpt));

                // Shift the window
                genotype.optimalTemp = targetOpt;
                genotype.minTemp = targetOpt - genotype.tempSpanLower;
                genotype.maxTemp = targetOpt + genotype.tempSpanUpper;
            }

            // 3. Radiation Selection (mutations drive radio-protection up to biological ceiling)
            if (node.radiationToleranceCap !== undefined) {
                const radCap = node.radiationToleranceCap;
                const theta_rad = 3.0; // scale factor for selection pressure strength
                
                if (effRad > 0.1 && genotype.radiationResilience < radCap) {
                    const deltaRad = (radCap - genotype.radiationResilience) * S_rad * mu_species * (effRad / theta_rad) * tickRate;
                    genotype.radiationResilience = Math.min(radCap, genotype.radiationResilience + deltaRad);
                }
            }

            // 4. Resource Efficiency Selection (starvation pressures optimize resource usage)
            // Determine if food/nutrients are scarce
            let resourceFactor = 1.0;
            if (nodeId === 'soup' || nodeId === 'bacteria' || nodeId === 'anaerobic') {
                resourceFactor = Math.min(1.0, biology.organicSoup / 20.0);
            } else if (nodeId === 'ammonic_soup' || nodeId === 'ammonic_proto') {
                resourceFactor = Math.min(1.0, biology.ammonicSoup / 15.0);
            } else if (nodeId === 'methane_soup' || nodeId === 'methane_proto') {
                resourceFactor = Math.min(1.0, biology.methaneSoup / 15.0);
            } else if (node.reqs && node.reqs.popThreshold) {
                // Predator/herbivore - check food parents
                let totalFood = 0;
                for (const parentId of node.parents) {
                    if (biology.biomassMap && typeof biology.biomassMap[parentId] === 'number') {
                        totalFood += biology.biomassMap[parentId];
                    }
                }
                resourceFactor = Math.min(1.0, totalFood / 25.0);
            }

            if (resourceFactor < 0.8 && genotype.resourceEfficiency < 2.0) {
                const starvationPressure = 1.0 - resourceFactor;
                const deltaEff = (2.0 - genotype.resourceEfficiency) * S_eff * mu_species * starvationPressure * tickRate;
                genotype.resourceEfficiency = Math.min(2.0, genotype.resourceEfficiency + deltaEff);
            }
        }
    }

    /**
     * Calculates the dynamic viability factors based on the current species genotype.
     * Returns an object { tempViability, radViability, totalViability }
     */
    calculateFitness(nodeId, planet, biology) {
        const node = getEvolutionNode(nodeId);
        if (!node) return { tempViability: 1.0, radViability: 1.0, totalViability: 1.0 };

        const genotype = this.getGenotype(nodeId);
        if (!genotype) return { tempViability: 1.0, radViability: 1.0, totalViability: 1.0 };

        // 1. Temperature Viability
        let tempViability = 1.0;
        if (genotype.optimalTemp !== null) {
            const offset = (biology.thermalResilienceLevel || 0) * 2.0;
            const adjustedMin = genotype.minTemp - offset;
            const adjustedMax = genotype.maxTemp + offset;
            const temp = planet.temperature;

            if (temp <= adjustedMin || temp >= adjustedMax) {
                tempViability = 0.0;
            } else if (temp === genotype.optimalTemp) {
                tempViability = 1.0;
            } else if (temp < genotype.optimalTemp) {
                tempViability = (temp - adjustedMin) / (genotype.optimalTemp - adjustedMin);
            } else {
                tempViability = (adjustedMax - temp) / (adjustedMax - genotype.optimalTemp);
            }
        }

        // 2. Radiation Viability
        const effRad = planet.radiation * (planet.hasMagnetosphere ? 0.25 : 1.0) * (1.0 - 0.9 * (planet.ozone || 0.0));
        const radDivisor = node.radDivisor !== undefined ? node.radDivisor : 4.0;
        
        let radViability = 1.0;
        if (node.id !== 'gaia_hivemind' && node.id !== 'noosphere' && node.id !== 'soup' && node.id !== 'ammonic_soup' && node.id !== 'methane_soup') {
            radViability = Math.max(0.0, 1.0 - (effRad * (1.0 - genotype.radiationResilience)) / radDivisor);
        }

        return {
            tempViability,
            radViability,
            totalViability: tempViability * radViability
        };
    }
}
