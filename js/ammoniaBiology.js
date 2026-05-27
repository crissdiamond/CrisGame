import { RARITY } from './rarityTiers.js';

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

/**
 * Tick all ammonia-based biochemistry for one simulation step.
 * @param {object} bio        - BiologySimulation instance
 * @param {object} planet     - Planet instance
 * @param {number} tickRate   - Simulation time step (Myr)
 * @param {object} ctx        - Shared context: { events, o2Prod, co2Cons, co2Prod, n2Prod, ch4Prod, h2Cons }
 * @param {number} effRad     - Effective radiation after defense scaling
 * @param {object} effDecayMult - Decay multiplier (object with valueOf for genotype lookup)
 */
export function tickAmmonia(bio, planet, tickRate, ctx, effRad, effDecayMult) {
    // Ammonia Primordial Soup (requires ammonia liquid: -78°C to -33°C)
    if (planet.temperature > -80 && planet.temperature < -30 && planet.ammoniaCoverage > 10) {
        const tempFactor = 1 - Math.abs(planet.temperature - (-55)) / 25;
        const radFactor = Math.min(2.0, planet.radiation * 0.5);
        const synthesisRate = Math.max(0, tempFactor) * radFactor * (planet.ammoniaCoverage / 100) * 6.0;
        bio.ammonicSoup = Math.min(100.0, bio.ammonicSoup + synthesisRate * tickRate);

        if (!bio.unlockedAmmonicSoup && bio.ammonicSoup > 5.0) {
            if (bio.tryFire('ammonic_soup', RARITY.COMMON, 1.0, tickRate, planet)) {
                bio.unlockedAmmonicSoup = true;
                ctx.events.push({
                    title: "🧪 AMMONIC SYNTHESIS DETECTED",
                    desc: "Liquid ammonia has acted as a solvent for non-polar prebiotic synthesis.",
                    scientificDetails: "In cryogenic environments, liquid ammonia acts as a ionizing solvent, enabling nucleophilic reactions and metal-ammonia reductions. Prebiotic organic precursors accumulate, bypassing the need for liquid water solvent systems.",
                    type: "success",
                    tier: RARITY.COMMON.name,
                    tokens: RARITY.COMMON.award,
                    unlockKey: 'unlockedAmmonicSoup'
                });
            }
        }
    } else {
        bio.ammonicSoup = Math.max(0, bio.ammonicSoup - bio.ammonicSoup * 0.05 * tickRate);
    }

    const ammoniaSoupSnapshot = bio.ammonicSoup;

    // Ammonic Anaerobes
    if (bio.unlockedAmmonicSoup && bio.ammonicSoup > 10.0 && bio.ammonicProtoPop === 0) {
        if (bio.tryFire('ammonic_proto', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.ammonicProtoPop = 0.1;
            bio.unlockedAmmonicProto = true;
            ctx.events.push({
                title: "🦠 AMMONIC PROKARYOTES",
                desc: "Simple, organelle-less cells emerge using liquid ammonia as an intracellular fluid.",
                scientificDetails: "Early prokaryotic cells develop membranes constructed of lipids or specialized polymers that remain fluid at -50°C, utilizing liquid ammonia as their primary intracellular solvent and exploiting nitrogenous metabolic cycles.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedAmmonicProto'
            });
        }
    }

    bio.currentSimulatingNodeId = 'ammonic_proto';
    if (bio.ammonicProtoPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -80, -50, -30);
        const totalViability = tempViability * (planet.ammoniaCoverage / 100);

        if (totalViability > 0.05) {
            const nutrientFactor = Math.min(1.0, ammoniaSoupSnapshot / 20.0);
            const nudgeMult = bio.getNudgeGrowthMultiplier('ammonic_proto', planet.activeSolvent);
            const dPop = 1.0 * totalViability * nutrientFactor * bio.ammonicProtoPop * (1 - bio.ammonicProtoPop / 120.0) * nudgeMult * tickRate;
            bio.ammonicProtoPop = Math.max(0.01, bio.ammonicProtoPop + dPop);
            bio.ammonicSoup = Math.max(0, bio.ammonicSoup - bio.ammonicProtoPop * 0.1 * tickRate);
        } else {
            bio.ammonicProtoPop = Math.max(0, bio.ammonicProtoPop - bio.ammonicProtoPop * 0.4 * effDecayMult * tickRate);
        }
    }

    // Ammonic Multicellularity — MAJOR (no O2 analogue to drive complex biochem).
    if (bio.unlockedAmmonicProto && bio.ammonicProtoPop > 35.0 && !bio.unlockedAmmonicMulti) {
        if (bio.tryFire('ammonic_multi', RARITY.MAJOR, 1.0, tickRate, planet)) {
            bio.ammonicMultiPop = 0.1;
            bio.unlockedAmmonicMulti = true;
            ctx.events.push({
                title: "❄️ CRYOGENIC COMPLEXITY",
                desc: "Ammonic cells cluster into tissue layers, adapting to sub-freezing marine networks.",
                scientificDetails: "Low-temperature cellular groupings form early macro-structures. Because kinetic reaction rates are slow in cold ammonia, these organisms rely on highly efficient internal catalyst enzymes to coordinate multicellular tissue systems.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedAmmonicMulti'
            });
        }
    }

    bio.currentSimulatingNodeId = 'ammonic_multi';
    if (bio.ammonicMultiPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -78, -55, -33);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 3.0);
        const totalViability = tempViability * radViability * (planet.ammoniaCoverage / 100);

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('ammonic_multi', planet.activeSolvent);
            const dPop = 0.5 * totalViability * bio.ammonicMultiPop * (1 - bio.ammonicMultiPop / 100.0) * nudgeMult * tickRate;
            bio.ammonicMultiPop = Math.max(0.01, bio.ammonicMultiPop + dPop);
        } else {
            bio.ammonicMultiPop = Math.max(0, bio.ammonicMultiPop - bio.ammonicMultiPop * 0.6 * effDecayMult * tickRate);
        }
    }

    // Silico-Flora
    if (bio.unlockedAmmonicMulti && planet.temperature < -45.0 && !bio.unlockedSilicoFlora) {
        if (bio.tryFire('silicon_chains', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.silicoFloraPop = 0.1;
            bio.unlockedSilicoFlora = true;
            ctx.events.push({
                title: "💎 SILICO-FLORA ESTABLISHED",
                desc: "Silicon-backbone plants rise along ammonia glaciers, absorbing volcanic sulfur.",
                scientificDetails: "In dry, sub-freezing conditions, silicone-oxygen polymer chains (silicones) replace carbon backbones. These crystalline plants thrive along glaciers, absorbing geothermal sulfur compounds and ambient radiation.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedSilicoFlora'
            });
        }
    }

    bio.currentSimulatingNodeId = 'silico_flora';
    if (bio.silicoFloraPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -85, -60, -35);
        const landViability = (100 - planet.ammoniaCoverage) / 100;
        const totalViability = tempViability * landViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('silico_flora', planet.activeSolvent);
            const dPop = 0.45 * totalViability * bio.silicoFloraPop * (1 - bio.silicoFloraPop / 100.0) * nudgeMult * tickRate;
            bio.silicoFloraPop = Math.max(0.01, bio.silicoFloraPop + dPop);
        } else {
            bio.silicoFloraPop = Math.max(0, bio.silicoFloraPop - bio.silicoFloraPop * 0.5 * effDecayMult * tickRate);
        }
    }

    // Cryo-Fauna (speculative ammonic animals)
    if (bio.unlockedSilicoFlora && bio.silicoFloraPop > 30.0 && !bio.unlockedCryoFauna) {
        if (bio.tryFire('cryo_fauna', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.cryoFaunaPop = 0.1;
            bio.unlockedCryoFauna = true;
            ctx.events.push({
                title: "🦕 AMMONIC MEGAFAUNA EMERGED",
                desc: "Speculative cryo-fauna walk the ammonium frost, breathing ambient nitrogenous compounds.",
                scientificDetails: "Speculative mobile fauna emerge, using liquid ammonia in their circulatory systems. They graze on silico-flora and metabolize nitrogenous chemical gradients, venting inert molecular nitrogen gas.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedCryoFauna'
            });
        }
    }

    bio.currentSimulatingNodeId = 'cryo_fauna';
    if (bio.cryoFaunaPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -80, -58, -35);
        const plantFood = Math.min(1.0, bio.silicoFloraPop / 25.0);
        const totalViability = tempViability * plantFood;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('cryo_fauna', planet.activeSolvent);
            const dPop = 0.4 * totalViability * bio.cryoFaunaPop * (1 - bio.cryoFaunaPop / 100.0) * nudgeMult * tickRate;
            bio.cryoFaunaPop = Math.max(0.01, bio.cryoFaunaPop + dPop);
        } else {
            bio.cryoFaunaPop = Math.max(0, bio.cryoFaunaPop - bio.cryoFaunaPop * 0.7 * effDecayMult * tickRate);
        }
    }

    // Crystalline Cognitive Swarms — MAJOR.
    if (bio.unlockedCryoFauna && bio.cryoFaunaPop > 35.0 && !bio.unlockedCrystallineCognitive) {
        if (bio.tryFire('crystalline_collective', RARITY.MAJOR, 1.0, tickRate, planet)) {
            bio.crystallineCognitivePop = 0.1;
            bio.unlockedCrystallineCognitive = true;
            ctx.events.push({
                title: "💎 CRYSTALLINE COGNITIVE SWARMS",
                desc: "Silico-ammonia cells evolve collective consciousness, forming vibrating crystalline networks.",
                scientificDetails: "Speculative cryo-fauna evolve piezoelectric crystalline structures that transmit electrical oscillations. Vibrating in resonance across ammonia ice plates, they achieve collective neural-like cognition.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedCrystallineCognitive'
            });
        }
    }

    bio.currentSimulatingNodeId = 'crystalline_cognitive';
    if (bio.crystallineCognitivePop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -80, -60, -40);
        const totalViability = tempViability * Math.min(1.0, bio.cryoFaunaPop / 20.0);

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('crystalline_cognitive', planet.activeSolvent);
            const dPop = 0.3 * totalViability * nudgeMult * bio.crystallineCognitivePop * (1 - bio.crystallineCognitivePop / 80.0) * tickRate;
            bio.crystallineCognitivePop = Math.max(0.01, bio.crystallineCognitivePop + dPop);
        } else {
            bio.crystallineCognitivePop = Math.max(0, bio.crystallineCognitivePop - bio.crystallineCognitivePop * 0.5 * effDecayMult * tickRate);
        }
    }

    // Solid-State Quantum Lattices — SINGULAR. Requires deep cold.
    if (bio.unlockedCrystallineCognitive && bio.crystallineCognitivePop > 40.0 && planet.temperature < -50.0 && !bio.unlockedQuantumLattice) {
        if (bio.tryFire('quantum_alignment', RARITY.SINGULAR, 1.0, tickRate, planet)) {
            bio.quantumLatticePop = 0.1;
            bio.unlockedQuantumLattice = true;
            ctx.events.push({
                title: "🧊 SOLID-STATE QUANTUM LATTICES",
                desc: "Crystalline networks align into stable, superconducting quantum computation sheets within ice glaciers.",
                scientificDetails: "At cryogenic temperatures (below -50°C), thermal decoherence is minimized. Crystalline silicon-ammonia lattices align their electron spins, achieving stable macroscopic quantum coherence. These frozen sheets function as massive, low-power parallel computers.",
                type: "success",
                tier: RARITY.SINGULAR.name,
                tokens: RARITY.SINGULAR.award,
                unlockKey: 'unlockedQuantumLattice'
            });
        }
    }

    bio.currentSimulatingNodeId = 'quantum_lattices';
    if (bio.quantumLatticePop > 0) {
        // Must be cold to maintain superconductivity!
        const tempViability = bio.getTempViability(planet.temperature, -100, -65, -45); // dies if it warms up past -45°C
        const totalViability = tempViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('quantum_lattices', planet.activeSolvent);
            const dPop = 0.25 * totalViability * nudgeMult * bio.quantumLatticePop * (1 - bio.quantumLatticePop / 100.0) * tickRate;
            bio.quantumLatticePop = Math.max(0.01, bio.quantumLatticePop + dPop);
        } else {
            bio.quantumLatticePop = Math.max(0, bio.quantumLatticePop - bio.quantumLatticePop * 0.7 * effDecayMult * tickRate);
        }
    }

    // Cryo-Biosphere Hivemind — SINGULAR.
    if (bio.unlockedCrystallineCognitive && bio.crystallineCognitivePop > 40.0 && bio.silicoFloraPop > 45.0 && planet.ammoniaCoverage > 25.0 && !bio.unlockedCryoHivemind) {
        if (bio.tryFire('cryo_neural_webs', RARITY.SINGULAR, 1.0, tickRate, planet)) {
            bio.cryoHivemindPop = 0.1;
            bio.unlockedCryoHivemind = true;
            ctx.events.push({
                title: "💜 CRYO-BIOSPHERE HIVEMIND",
                desc: "Glacier-spanning chemical and crystalline networks weave silico-flora and cryo-fauna into a cold planetary brain.",
                scientificDetails: "Silicate chemical pathways and low-resistance nitrogenous signaling channels link stationary flora and motile fauna. The biosphere operates as a single homeostatic unit optimized for energy retention in sub-zero conditions.",
                type: "success",
                tier: RARITY.SINGULAR.name,
                tokens: RARITY.SINGULAR.award,
                unlockKey: 'unlockedCryoHivemind'
            });
        }
    }

    bio.currentSimulatingNodeId = 'cryo_hivemind';
    if (bio.cryoHivemindPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -80, -58, -30);
        const ammoniaViability = planet.ammoniaCoverage > 15.0 ? 1.0 : (planet.ammoniaCoverage / 15.0);
        const totalViability = tempViability * ammoniaViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('cryo_hivemind', planet.activeSolvent);
            const dPop = 0.25 * totalViability * nudgeMult * bio.cryoHivemindPop * (1 - bio.cryoHivemindPop / 100.0) * tickRate;
            bio.cryoHivemindPop = Math.max(0.01, bio.cryoHivemindPop + dPop);
        } else {
            bio.cryoHivemindPop = Math.max(0, bio.cryoHivemindPop - bio.cryoHivemindPop * 0.4 * effDecayMult * tickRate);
        }
    }

    // Scale autotrophic production by CO2 availability (throttling below 2%)
    const co2ViabilityAmmonia = Math.min(1.0, planet.co2 / 2.0);

    // Total living ammonic biomass for decomposition
    const biomassAmmonia = bio.ammonicProtoPop + bio.ammonicMultiPop + bio.silicoFloraPop + bio.cryoFaunaPop +
                           bio.crystallineCognitivePop + bio.quantumLatticePop + bio.cryoHivemindPop;
    const decayFluxAmmonia = biomassAmmonia * 0.012;

    // Ammonic decay consumes N2 (nitrogenous respiration analog) and vents CO2
    const ammonicDecayN2Drawdown = decayFluxAmmonia * Math.min(1.0, planet.n2 / 10.0);

    // Ammonic life produces N2 as photosynthesis byproduct, boosted by Cryo Hivemind
    let n2ProdRaw = 0;
    bio.currentSimulatingNodeId = 'cryo_hivemind';
    if (bio.cryoHivemindPop > 0) {
        n2ProdRaw = bio.ammonicProtoPop * 0.05 + bio.silicoFloraPop * 0.1 + bio.cryoHivemindPop * 0.12;
    } else {
        n2ProdRaw = bio.ammonicProtoPop * 0.05 + bio.silicoFloraPop * 0.1;
    }

    ctx.n2Prod = n2ProdRaw * co2ViabilityAmmonia - ammonicDecayN2Drawdown;

    const co2ConsRaw = bio.silicoFloraPop * 0.08 + bio.ammonicProtoPop * 0.01 +
                       bio.crystallineCognitivePop * 0.02 + bio.quantumLatticePop * 0.01 + bio.cryoHivemindPop * 0.03;
    ctx.co2Cons = co2ConsRaw * co2ViabilityAmmonia - decayFluxAmmonia;
}
