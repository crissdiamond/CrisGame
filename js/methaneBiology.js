import { RARITY } from './rarityTiers.js';

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

/**
 * Tick all methane-based biochemistry for one simulation step.
 * @param {object} bio        - BiologySimulation instance
 * @param {object} planet     - Planet instance
 * @param {number} tickRate   - Simulation time step (Myr)
 * @param {object} ctx        - Shared context: { events, o2Prod, co2Cons, co2Prod, n2Prod, ch4Prod, h2Cons }
 * @param {number} effRad     - Effective radiation after defense scaling
 * @param {object} effDecayMult - Decay multiplier (object with valueOf for genotype lookup)
 */
export function tickMethane(bio, planet, tickRate, ctx, effRad, effDecayMult) {
    // Methane Primordial Soup (-183°C to -140°C)
    if (planet.temperature > -185 && planet.temperature < -135 && planet.methaneCoverage > 10) {
        const tempFactor = 1 - Math.abs(planet.temperature - (-160)) / 25;
        const synthesisRate = Math.max(0, tempFactor) * (planet.methaneCoverage / 100) * 5.0;
        bio.methaneSoup = Math.min(100.0, bio.methaneSoup + synthesisRate * tickRate);

        if (!bio.unlockedMethaneSoup && bio.methaneSoup > 5.0) {
            if (bio.tryFire('methane_soup', RARITY.COMMON, 1.0, tickRate, planet)) {
                bio.unlockedMethaneSoup = true;
                ctx.events.push({
                    title: "🧪 HYDROCARBON SOUP DETECTED",
                    desc: "Liquid hydrocarbons pool. Prebiotic chains form at cryogenic temperatures.",
                    scientificDetails: "In Titan-like environments, liquid methane and ethane act as non-polar solvents. Organic photochemistry in the upper atmosphere deposits nitriles and acetylene onto the surface, creating a rich cryogenic prebiotic chemical reservoir.",
                    type: "success",
                    tier: RARITY.COMMON.name,
                    tokens: RARITY.COMMON.award,
                    unlockKey: 'unlockedMethaneSoup'
                });
            }
        }
    } else {
        bio.methaneSoup = Math.max(0, bio.methaneSoup - bio.methaneSoup * 0.05 * tickRate);
    }

    const methaneSoupSnapshot = bio.methaneSoup;

    // Methanotrophic Proto-cells — MAJOR (azotosome stability hypothetical).
    if (bio.unlockedMethaneSoup && bio.methaneSoup > 10.0 && bio.methaneProtoPop === 0) {
        if (bio.tryFire('methane_proto', RARITY.MAJOR, 1.0, tickRate, planet)) {
            bio.unlockedMethaneProto = true;
            bio.methaneProtoPop = 0.1;
            ctx.events.push({
                title: "🦠 CRYO-METHANOGEN PROKARYOTES",
                desc: "Simple azotosome-based membranes form. Living cells emerge feeding off hydrogen gas.",
                scientificDetails: "Speculative cryo-cells emerge using nitrogen-based membranes (azotosomes) that remain flexible at 90 Kelvin. Lacking internal organelles, these simple prokaryotes feed on organic compounds and hydrogen gas, producing methane.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedMethaneProto'
            });
        }
    }

    bio.currentSimulatingNodeId = 'methane_proto';
    if (bio.methaneProtoPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -185, -160, -140);
        const totalViability = tempViability * (planet.methaneCoverage / 100);

        if (totalViability > 0.05) {
            const nutrientFactor = Math.min(1.0, methaneSoupSnapshot / 20.0);
            const nudgeMult = bio.getNudgeGrowthMultiplier('methane_proto', planet.activeSolvent);
            const dPop = 0.9 * totalViability * nutrientFactor * nudgeMult * bio.methaneProtoPop * (1 - bio.methaneProtoPop / 100.0) * tickRate;
            bio.methaneProtoPop = Math.max(0.01, bio.methaneProtoPop + dPop);
            bio.methaneSoup = Math.max(0, bio.methaneSoup - bio.methaneProtoPop * 0.08 * tickRate);
        } else {
            bio.methaneProtoPop = Math.max(0, bio.methaneProtoPop - bio.methaneProtoPop * 0.5 * effDecayMult * tickRate);
        }
    }

    // Methane Multicellularity — SINGULAR (apolar solvent, no proton chemistry).
    if (bio.unlockedMethaneProto && bio.methaneProtoPop > 30.0 && !bio.unlockedMethaneMulti) {
        if (bio.tryFire('methane_multi', RARITY.SINGULAR, 1.0, tickRate, planet)) {
            bio.methaneMultiPop = 0.1;
            bio.unlockedMethaneMulti = true;
            ctx.events.push({
                title: "❄️ AZOTOSOME CHAINS UNLOCKED",
                desc: "Cryo-cells link together, creating long macromolecular structures.",
                scientificDetails: "Azotosome vesicles self-assemble into polymer chains. Despite cryogenic constraints on molecule speed, these chains optimize nutrient absorption across vast surface-to-volume ratios.",
                type: "success",
                tier: RARITY.SINGULAR.name,
                tokens: RARITY.SINGULAR.award,
                unlockKey: 'unlockedMethaneMulti'
            });
        }
    }

    bio.currentSimulatingNodeId = 'methane_multi';
    if (bio.methaneMultiPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -183, -160, -140);
        const totalViability = tempViability * (planet.methaneCoverage / 100);

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('methane_multi', planet.activeSolvent);
            const dPop = 0.45 * totalViability * nudgeMult * bio.methaneMultiPop * (1 - bio.methaneMultiPop / 80.0) * tickRate;
            bio.methaneMultiPop = Math.max(0.01, bio.methaneMultiPop + dPop);
        } else {
            bio.methaneMultiPop = Math.max(0, bio.methaneMultiPop - bio.methaneMultiPop * 0.6 * effDecayMult * tickRate);
        }
    }

    // Cryo-Organisms — MAJOR.
    if (bio.unlockedMethaneMulti && !bio.unlockedCryoOrganisms) {
        if (bio.tryFire('cryo_polymers', RARITY.MAJOR, 1.0, tickRate, planet)) {
            bio.cryoOrganismsPop = 0.1;
            bio.unlockedCryoOrganisms = true;
            ctx.events.push({
                title: "👾 CYTO-PLASMIC BEASTS",
                desc: "Speculative methane animals graze on organic crusts, operating at 90 Kelvin.",
                scientificDetails: "Advanced cryogenic animals adapt to crawl along hydrocarbon snow deposits. They digest atmospheric tholins and utilize acetylene as a high-energy metabolic source in a highly efficient enzyme matrix.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedCryoOrganisms'
            });
        }
    }

    bio.currentSimulatingNodeId = 'cryo_organisms';
    if (bio.cryoOrganismsPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -183, -162, -140);
        const landViability = (100 - planet.methaneCoverage) / 100;
        const totalViability = tempViability * landViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('cryo_organisms', planet.activeSolvent);
            const dPop = 0.35 * totalViability * nudgeMult * bio.cryoOrganismsPop * (1 - bio.cryoOrganismsPop / 70.0) * tickRate;
            bio.cryoOrganismsPop = Math.max(0.01, bio.cryoOrganismsPop + dPop);
        } else {
            bio.cryoOrganismsPop = Math.max(0, bio.cryoOrganismsPop - bio.cryoOrganismsPop * 0.7 * effDecayMult * tickRate);
        }
    }

    // Cryo-Polymer Networks — MAJOR.
    if (bio.unlockedCryoOrganisms && bio.cryoOrganismsPop > 30.0 && !bio.unlockedCryoPolymerNetwork) {
        if (bio.tryFire('cryo_polymer_network', RARITY.MAJOR, 1.0, tickRate, planet)) {
            bio.cryoPolymerNetworkPop = 0.1;
            bio.unlockedCryoPolymerNetwork = true;
            ctx.events.push({
                title: "🍊 CRYO-POLYMER NETWORKS",
                desc: "Hydrocarbon structures form planetary networks that function as cryogenic supercomputing lattices.",
                scientificDetails: "Organic polymers organize into interconnected grid sheets across tholin dunes. These structures propagate mechanical and electrical signaling, operating as a solid-state cryogenic computing lattice.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedCryoPolymerNetwork'
            });
        }
    }

    bio.currentSimulatingNodeId = 'cryo_polymer_network';
    if (bio.cryoPolymerNetworkPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -185, -165, -145);
        const totalViability = tempViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('cryo_polymer_network', planet.activeSolvent);
            const dPop = 0.25 * totalViability * nudgeMult * bio.cryoPolymerNetworkPop * (1 - bio.cryoPolymerNetworkPop / 60.0) * tickRate;
            bio.cryoPolymerNetworkPop = Math.max(0.01, bio.cryoPolymerNetworkPop + dPop);
        } else {
            bio.cryoPolymerNetworkPop = Math.max(0, bio.cryoPolymerNetworkPop - bio.cryoPolymerNetworkPop * 0.6 * effDecayMult * tickRate);
        }
    }

    // Thinking Hydrocarbon Oceans — SINGULAR.
    if (bio.unlockedCryoPolymerNetwork && bio.cryoPolymerNetworkPop > 40.0 && planet.methaneCoverage > 40.0 && !bio.unlockedThinkingOcean) {
        if (bio.tryFire('colloidal_solids', RARITY.SINGULAR, 1.0, tickRate, planet)) {
            bio.thinkingOceanPop = 0.1;
            bio.unlockedThinkingOcean = true;
            ctx.events.push({
                title: "🌊 THINKING HYDROCARBON OCEANS",
                desc: "Macromolecular sheets self-assemble, turning entire methane seas into cognitive liquid membranes.",
                scientificDetails: "In cryogenic methane basins, dissolved organic polymers accumulate into sheets. Under wave action and tides, these fluid-crystalline layers act as mechanical logic gates. Currents carry signaling states, turning entire oceans into slow cognitive media.",
                type: "success",
                tier: RARITY.SINGULAR.name,
                tokens: RARITY.SINGULAR.award,
                unlockKey: 'unlockedThinkingOcean'
            });
        }
    }

    bio.currentSimulatingNodeId = 'thinking_ocean';
    if (bio.thinkingOceanPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -185, -165, -145);
        const coverageViability = planet.methaneCoverage / 100;
        const totalViability = tempViability * coverageViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('thinking_ocean', planet.activeSolvent);
            const dPop = 0.2 * totalViability * nudgeMult * bio.thinkingOceanPop * (1 - bio.thinkingOceanPop / 100.0) * tickRate;
            bio.thinkingOceanPop = Math.max(0.01, bio.thinkingOceanPop + dPop);
        } else {
            bio.thinkingOceanPop = Math.max(0, bio.thinkingOceanPop - bio.thinkingOceanPop * 0.6 * effDecayMult * tickRate);
        }
    }

    // Megastructure Cryo-Colloids — SINGULAR.
    if (bio.unlockedCryoPolymerNetwork && bio.cryoPolymerNetworkPop > 40.0 && bio.cryoOrganismsPop > 45.0 && planet.h2 > 10.0 && !bio.unlockedCryoColloid) {
        if (bio.tryFire('macromolecular_assembly', RARITY.SINGULAR, 1.0, tickRate, planet)) {
            bio.cryoColloidPop = 0.1;
            bio.unlockedCryoColloid = true;
            ctx.events.push({
                title: "👾 MEGASTRUCTURE CRYO-COLLOIDS",
                desc: "Azotosome-based beasts coordinate into massive colloidal lattices, forming living computer structures.",
                scientificDetails: "Cryogenic animals self-assemble into macro-scale colloidal structures. Lacking warm blood, they coordinate metabolic processes through slow cryogenic convection and chemical signaling, forming massive decentralized computational grids.",
                type: "success",
                tier: RARITY.SINGULAR.name,
                tokens: RARITY.SINGULAR.award,
                unlockKey: 'unlockedCryoColloid'
            });
        }
    }

    bio.currentSimulatingNodeId = 'cryo_colloid';
    if (bio.cryoColloidPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -183, -162, -140);
        const h2Viability = Math.min(1.0, planet.h2 / 15.0);
        const totalViability = tempViability * h2Viability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('cryo_colloid', planet.activeSolvent);
            const dPop = 0.25 * totalViability * nudgeMult * bio.cryoColloidPop * (1 - bio.cryoColloidPop / 100.0) * tickRate;
            bio.cryoColloidPop = Math.max(0.01, bio.cryoColloidPop + dPop);
        } else {
            bio.cryoColloidPop = Math.max(0, bio.cryoColloidPop - bio.cryoColloidPop * 0.5 * effDecayMult * tickRate);
        }
    }

    // Scale methanogenesis and hydrogen consumption by H2 availability (throttling below 5%)
    const h2ViabilityMethane = Math.min(1.0, planet.h2 / 5.0);

    // Total living methane biomass for decomposition
    const biomassMethane = bio.methaneProtoPop + bio.methaneMultiPop + bio.cryoOrganismsPop +
                           bio.cryoPolymerNetworkPop + bio.thinkingOceanPop + bio.cryoColloidPop;
    const decayFluxMethane = biomassMethane * 0.01;

    // Methane decay consumes CH4 and vents H2
    const methaneDecayCH4Drawdown = decayFluxMethane * Math.min(1.0, planet.ch4 / 10.0);

    // Methanotrophic cycle consumes H2, vents CH4, boosted by Cryo Colloids and Thinking Oceans
    let ch4ProdRaw = 0;
    if (bio.cryoColloidPop > 0 || bio.thinkingOceanPop > 0) {
        const boost = bio.cryoColloidPop * 0.05 + bio.thinkingOceanPop * 0.04;
        ch4ProdRaw = bio.methaneProtoPop * 0.05 + bio.cryoOrganismsPop * 0.02 + bio.cryoPolymerNetworkPop * 0.01 + boost;
    } else {
        ch4ProdRaw = bio.methaneProtoPop * 0.05 + bio.cryoOrganismsPop * 0.02 + bio.cryoPolymerNetworkPop * 0.01;
    }

    ctx.ch4Prod = ch4ProdRaw * h2ViabilityMethane - methaneDecayCH4Drawdown;
    ctx.h2Cons = ch4ProdRaw * h2ViabilityMethane - methaneDecayCH4Drawdown * 1.5;
}
