import { RARITY } from './rarityTiers.js';

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

/**
 * Tick all water-based biochemistry for one simulation step.
 * @param {object} bio        - BiologySimulation instance
 * @param {object} planet     - Planet instance
 * @param {number} tickRate   - Simulation time step (Myr)
 * @param {object} ctx        - Shared context: { events, o2Prod, co2Cons, co2Prod, n2Prod, ch4Prod, h2Cons }
 * @param {number} effRad     - Effective radiation after defense scaling
 * @param {object} effDecayMult - Decay multiplier (object with valueOf for genotype lookup)
 */
export function tickWater(bio, planet, tickRate, ctx, effRad, effDecayMult) {
    const nitrogenViability = 0.5 + 0.5 * clamp01(planet.n2 / 40.0);
    const co2Viability = clamp01(planet.co2 / 2.0); // photosynthesis throttles below 2% CO2

    // Soup Synthesis (needs liquid water, 0 to 100°C)
    if (planet.temperature > 10 && planet.temperature < 90 && planet.waterCoverage > 10) {
        const tempFactor = 1 - Math.abs(planet.temperature - 50) / 45;
        const radFactor = Math.min(2.0, planet.radiation * 0.4);
        const tideBoost = planet.hasMoon ? 2.5 : 1.0;
        const synthesisRate = Math.max(0, tempFactor) * radFactor * (planet.waterCoverage / 100) * 8.0 * tideBoost;
        bio.organicSoup = Math.min(100.0, bio.organicSoup + synthesisRate * tickRate);

        if (!bio.unlockedSoup && bio.organicSoup > 5.0) {
            if (bio.tryFire('soup', RARITY.COMMON, 1.0, tickRate, planet)) {
                bio.unlockedSoup = true;
                ctx.events.push({
                    title: "🧪 PRIMORDIAL SOUP FORMED",
                    desc: "Liquid water has enabled amino acid synthesis. Organic soup accumulation active.",
                    scientificDetails: "Organic molecules (amino acids, nucleobases, lipids) accumulate in water bodies, synthesized via stellar UV radiolysis, atmospheric spark discharges, and mineral catalysis at hydrothermal vents. This prebiotic chemistry serves as the raw material for early biochemical structures.",
                    type: "success",
                    tier: RARITY.COMMON.name,
                    tokens: RARITY.COMMON.award,
                    unlockKey: 'unlockedSoup'
                });
            }
        }
    } else {
        const decay = planet.temperature > 95 ? 0.3 : 0.02;
        bio.organicSoup = Math.max(0, bio.organicSoup - bio.organicSoup * decay * tickRate);
    }

    // External Membrane
    if (bio.unlockedSoup && bio.organicSoup > 8.0 && !bio.unlockedMembrane) {
        if (bio.tryFire('membrane', RARITY.COMMON, 1.0, tickRate, planet)) {
            bio.unlockedMembrane = true;
            ctx.events.push({
                title: "🦠 EXTERNAL MEMBRANE FORMED",
                desc: "Lipid molecules spontaneously form bilayers, creating an enclosed vesicle to isolate chemical reactions.",
                scientificDetails: "Self-assembling amphiphilic fatty acids spontaneously form spherical bilayer vesicles (liposomes). This compartmentalization isolates metabolic loops and early genetic molecules from environmental entropy, keeping reactants concentrated.",
                type: "success",
                tier: RARITY.COMMON.name,
                tokens: RARITY.COMMON.award,
                unlockKey: 'unlockedMembrane'
            });
        }
    }

    const soupSnapshot = bio.organicSoup;

    // Bacteria / Archea (strict anaerobes)
    if (bio.unlockedMembrane && bio.organicSoup > 15.0 && bio.anaerobicPop === 0) {
        // Abiogenesis-equivalent. Condition richness from soup concentration.
        const condMult = 1.0 + 2.0 * clamp01((bio.organicSoup - 15.0) / 30.0);
        if (bio.tryFire('anaerobic', RARITY.NOTABLE, condMult, tickRate, planet)) {
            bio.anaerobicPop = 0.1;
            bio.unlockedBacteria = true;
            bio.unlockedAnaerobic = true;
            ctx.events.push({
                title: "🦠 PROKARYOTES UNLOCKED",
                desc: "Simple prokaryotic cells emerge. Lacking a nucleus or complex organelles, they require minimal metabolic energy.",
                scientificDetails: "Unicellular prokaryotic life establishes itself in the oceans. Characterized by naked DNA and the absence of membrane-bound internal organelles (like nuclei or mitochondria), these early bacteria require very little complexity or energy to survive, utilising simple anaerobic metabolic pathways.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedAnaerobic'
            });
        }
    }

    bio.currentSimulatingNodeId = 'anaerobic';
    if (bio.anaerobicPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 0, 45, 80);
        const o2Toxicity = Math.max(0.01, 1 - (planet.o2 / 25.0));
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 6.0);
        const totalViability = tempViability * o2Toxicity * radViability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            const nutrientFactor = Math.min(1.0, soupSnapshot / 20.0);
            // Apply upgrade factors: thermal resilience multiplier
            const traitMult = 1.0 + (bio.thermalResilienceLevel * 0.1);
            const nudgeMult = bio.getNudgeGrowthMultiplier('anaerobic', planet.activeSolvent);
            const growthRate = 1.3 * totalViability * nutrientFactor * traitMult * nudgeMult;
            const dPop = growthRate * bio.anaerobicPop * (1 - bio.anaerobicPop / 150.0) * tickRate;
            bio.anaerobicPop = Math.max(0.01, bio.anaerobicPop + dPop);
            bio.organicSoup = Math.max(0, bio.organicSoup - bio.anaerobicPop * 0.15 * effDecayMult * tickRate);
        } else {
            bio.anaerobicPop = Math.max(0, bio.anaerobicPop - bio.anaerobicPop * 0.4 * effDecayMult * tickRate);
        }
    }

    // Prokaryotes (Bacteria)
    if (bio.unlockedBacteria && bio.bacteriaPop === 0) {
        bio.bacteriaPop = 0.1;
    }
    bio.currentSimulatingNodeId = 'bacteria';
    if (bio.bacteriaPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 0, 45, 80);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 6.0);
        const totalViability = tempViability * radViability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            const nutrientFactor = Math.min(1.0, soupSnapshot / 20.0);
            const traitMult = 1.0 + (bio.thermalResilienceLevel * 0.1);
            const nudgeMult = bio.getNudgeGrowthMultiplier('bacteria', planet.activeSolvent);
            const growthRate = 1.4 * totalViability * nutrientFactor * traitMult * nudgeMult;
            const dPop = growthRate * bio.bacteriaPop * (1 - bio.bacteriaPop / 100.0) * tickRate;
            bio.bacteriaPop = Math.max(0.01, bio.bacteriaPop + dPop);
            bio.organicSoup = Math.max(0, bio.organicSoup - bio.bacteriaPop * 0.1 * effDecayMult * tickRate);
        } else {
            bio.bacteriaPop = Math.max(0, bio.bacteriaPop - bio.bacteriaPop * 0.4 * effDecayMult * tickRate);
        }
    }

    // Anoxygenic Photosynthesizers (consumes CO2 and soup, does NOT release O2)
    if (bio.unlockedBacteria && bio.anaerobicPop > 20.0 && !bio.unlockedAnoxygenicPhoto) {
        // Needs some starlight radiation
        const condMult = 1.0 + Math.min(2.0, planet.radiation * 0.5);
        if (bio.tryFire('anoxygenic_photo', RARITY.NOTABLE, condMult, tickRate, planet)) {
            bio.anoxygenicPhotoPop = 0.1;
            bio.unlockedAnoxygenicPhoto = true;
            ctx.events.push({
                title: "🌞 ANOXYGENIC PHOTOSYNTHESIS UNLOCKED",
                desc: "Early cells develop bacteriochlorophyll to capture starlight energy, using sulfur/iron rather than water.",
                scientificDetails: "Anoxygenic phototrophs utilize simple reaction centers to harvest photons, driving cyclic electron transfer to generate ATP. Using hydrogen sulfide (H2S) or ferrous iron (Fe2+) as electron donors, they synthesize carbon without venting oxygen.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedAnoxygenicPhoto'
            });
        }
    }

    bio.currentSimulatingNodeId = 'anoxygenic_photo';
    if (bio.anoxygenicPhotoPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 5, 35, 70);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 5.0);
        const totalViability = tempViability * radViability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            // Photolithoautotrophs: use light (stellar radiation proxy), CO2, and inorganic
            // electron donors (H2S/Fe2+). No organic soup required or consumed.
            const lightFactor = Math.min(1.0, planet.radiation * 1.5);
            const traitMult = 1.0 + (bio.thermalResilienceLevel * 0.1);
            const nudgeMult = bio.getNudgeGrowthMultiplier('anoxygenic_photo', planet.activeSolvent);
            const growthRate = 1.1 * totalViability * lightFactor * co2Viability * traitMult * nudgeMult;
            const dPop = growthRate * bio.anoxygenicPhotoPop * (1 - bio.anoxygenicPhotoPop / 180.0) * tickRate;
            bio.anoxygenicPhotoPop = Math.max(0.01, bio.anoxygenicPhotoPop + dPop);
        } else {
            bio.anoxygenicPhotoPop = Math.max(0, bio.anoxygenicPhotoPop - bio.anoxygenicPhotoPop * 0.45 * effDecayMult * tickRate);
        }
    }

    // OEC Stability Gate Logic (Water Line)
    if (bio.unlockedAnoxygenicPhoto && !bio.unlockedPhotosynthetic) {
        const isStable = (
            planet.temperature >= 15.0 && planet.temperature <= 55.0 &&
            planet.waterCoverage >= 20.0 &&
            effRad <= 3.0
        );

        if (isStable) {
            bio.oecStabilityTimer = Math.max(0.0, bio.oecStabilityTimer - tickRate);
        } else {
            bio.oecStabilityTimer = 100.0;
        }
    } else {
        if (!bio.unlockedPhotosynthetic) {
            bio.oecStabilityTimer = 100.0;
        }
    }

    // Photosynthetic Bacteria (Cyanobacteria - consumes CO2, releases O2)
    if (bio.unlockedAnoxygenicPhoto && bio.anoxygenicPhotoPop > 15.0 && bio.oecStabilityTimer <= 0 && !bio.unlockedPhotosynthetic) {
        const radBoost = Math.min(3.0, effRad * 0.6);
        const condMult = 1.0 + radBoost; // 1.0 .. 4.0
        if (bio.tryFire('photosynthesis', RARITY.MAJOR, condMult, tickRate, planet)) {
            bio.photosyntheticPop = 0.1;
            bio.unlockedPhotosynthetic = true;
            ctx.events.push({
                title: "🍃 OXYGENIC PHOTOSYNTHESIS EVOLVED",
                desc: "Cyanobacteria strains mutate, harvesting stellar energy to split water, venting O₂ gas.",
                scientificDetails: "The evolution of the oxygen-evolving complex in photosystem II enables cyanobacteria to split abundant water (H2O) molecules for metabolic electrons, releasing molecular oxygen (O2) as a byproduct and replacing anaerobic energy paths.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedPhotosynthetic'
            });
        }
    }

    bio.currentSimulatingNodeId = 'photosynthetic';
    if (bio.photosyntheticPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 5, 30, 60);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 5.0);
        const totalViability = tempViability * radViability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            const traitMult = 1.0 + (bio.thermalResilienceLevel * 0.1);
            const nudgeMult = bio.getNudgeGrowthMultiplier('photosynthetic', planet.activeSolvent);
            const growthRate = 1.0 * totalViability * nitrogenViability * co2Viability * (0.3 + (planet.radiation / 5.0)) * traitMult * nudgeMult;
            const dPop = growthRate * bio.photosyntheticPop * (1 - bio.photosyntheticPop / 200.0) * tickRate;
            bio.photosyntheticPop = Math.max(0.01, bio.photosyntheticPop + dPop);
        } else {
            bio.photosyntheticPop = Math.max(0, bio.photosyntheticPop - bio.photosyntheticPop * 0.5 * effDecayMult * tickRate);
        }
    }

    // Great Oxidation Event trigger (atmospheric milestone, not a stage unlock)
    if (bio.unlockedPhotosynthetic && planet.o2 >= 15.0 && !planet.goeAlertTriggered) {
        planet.goeAlertTriggered = true;
        ctx.events.push({
            title: "💨 GREAT OXIDATION EVENT (GOE)",
            desc: "Atmospheric oxygen spikes above 15%, wiping out strict anaerobes but creating the ozone layer.",
            scientificDetails: "Once marine iron and sulfur chemical sinks saturate, biological oxygen escapes into the atmosphere. This spikes O2 concentrations, forming an ozone (O3) layer that blocks cosmic UV radiation but triggering a massive extinction of obligate anaerobes.",
            type: "alert"
        });
    }

    // Cellular Nucleus
    if (bio.unlockedPhotosynthetic && bio.photosyntheticPop > 15.0 && !bio.unlockedNucleus) {
        if (bio.tryFire('nucleus', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.unlockedNucleus = true;
            ctx.events.push({
                title: "🧬 CELLULAR NUCLEUS FORMATION",
                desc: "A protective nuclear envelope wraps around chromosomal strands, organizing genetic code.",
                scientificDetails: "Eukaryogenesis begins as a protective double-membrane envelops the DNA. This compartmentalization prevents mechanical strain on genomic strands and decouples transcription (in the nucleus) from translation (in the cytoplasm), optimizing protein synthesis.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedNucleus'
            });
        }
    }

    // Mitochondria (Endosymbiosis) — SINGULAR in Earth history.
    if (bio.unlockedNucleus && planet.o2 > 1.2 && !bio.unlockedMitochondria) {
        const o2Score = clamp01((planet.o2 - 1.2) / 5.0);
        const popScore = clamp01(bio.anaerobicPop / 60);
        const condMult = 1.0 + 3.0 * (0.6 * o2Score + 0.4 * popScore);
        if (bio.tryFire('endosymbiosis', RARITY.SINGULAR, condMult, tickRate, planet)) {
            bio.unlockedMitochondria = true;
            bio.eukaryoticPop = 0.1;
            bio.unlockedEukaryotic = true;
            ctx.events.push({
                title: "⚡ MITOCHONDRIA ENDOSYMBIOSIS",
                desc: "An aerobic bacterium is engulfed by a host nucleus cell, establishing high-energy ATP respiration.",
                scientificDetails: "An ancestral archaeal cell engulfs an aerobic alphaproteobacterium. Rather than digested, it stabilizes as an endosymbiont. The host provides safe housing and pyruvate substrates, while the proto-mitochondrion performs oxidative phosphorylation, generating 15x more ATP.",
                type: "success",
                tier: RARITY.SINGULAR.name,
                tokens: RARITY.SINGULAR.award,
                unlockKey: 'unlockedMitochondria'
            });
        }
    }

    bio.currentSimulatingNodeId = 'eukaryotes';
    if (bio.eukaryoticPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 10, 25, 50);
        const o2Viability = Math.min(1.0, planet.o2 / 5.0);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 4.0);
        const totalViability = tempViability * o2Viability * radViability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            // Sexual reproduction provides 1.25x growth rate boost (rapid niche colonization)
            // and increases carrying capacity from 120 to 180 M/mL.
            const sexGrowthMult = bio.unlockedSexualReproduction ? 1.25 : 1.0;
            const eukaryotesCap = bio.unlockedSexualReproduction ? 180.0 : 120.0;

            const nudgeMult = bio.getNudgeGrowthMultiplier('eukaryotes', planet.activeSolvent);
            const growthRate = 0.8 * totalViability * sexGrowthMult * nudgeMult;
            const dPop = growthRate * bio.eukaryoticPop * (1 - bio.eukaryoticPop / eukaryotesCap) * tickRate;
            bio.eukaryoticPop = Math.max(0.01, bio.eukaryoticPop + dPop);
        } else {
            bio.eukaryoticPop = Math.max(0, bio.eukaryoticPop - bio.eukaryoticPop * 0.6 * effDecayMult * tickRate);
        }
    }

    // Sexual Reproduction — once in eukaryote stem; MAJOR.
    if (bio.unlockedMitochondria && bio.eukaryoticPop > 20.0 && !bio.unlockedSexualReproduction) {
        const condMult = 1.0 + 2.0 * clamp01((bio.eukaryoticPop - 20) / 60);
        if (bio.tryFire('sexual_reproduction', RARITY.MAJOR, condMult, tickRate, planet)) {
            bio.unlockedSexualReproduction = true;
            ctx.events.push({
                title: "🔀 SEXUAL REPRODUCTION EVOLVED",
                desc: "DNA recombination is introduced, exponentially accelerating gene diversity.",
                scientificDetails: "Moving from simple mitosis (cloning) to meiosis allows homologous recombination. Offspring receive unique genetic combinations, dramatically increasing variance and allowing life to adapt rapidly to changing climates and parasites.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedSexualReproduction'
            });
        }
    }

    // Multicellular Life — evolved ≥25 times on Earth; NOTABLE given eukaryotes.
    if (bio.unlockedSexualReproduction && bio.eukaryoticPop > 45.0 && planet.o2 >= 8.0 && !bio.unlockedMulticellular) {
        if (bio.tryFire('multicellular', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.multicellularPop = 0.1;
            bio.unlockedMulticellular = true;
            ctx.events.push({
                title: "🌱 MULTICELLULARITY IGNITED",
                desc: "Eukaryotic cells cluster, specializing tissues into early marine sponges and algae.",
                scientificDetails: "Cell-adhesion structures (like cadherins) and chemical signaling networks enable individual cells to coordinate. This allows division of labor, differentiating cells into somatic structural tissues and specialized germlines.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedMulticellular'
            });
        }
    }

    bio.currentSimulatingNodeId = 'multicellular';
    if (bio.multicellularPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 10, 22, 42);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 3.0);
        const o2Viability = Math.min(1.0, planet.o2 / 12.0);
        const totalViability = tempViability * radViability * o2Viability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('multicellular', planet.activeSolvent);
            const growthRate = 0.6 * totalViability * nudgeMult;
            const dPop = growthRate * bio.multicellularPop * (1 - bio.multicellularPop / 100.0) * tickRate;
            bio.multicellularPop = Math.max(0.01, bio.multicellularPop + dPop);
        } else {
            bio.multicellularPop = Math.max(0, bio.multicellularPop - bio.multicellularPop * 0.7 * effDecayMult * tickRate);
        }
    }

    // Multicellular Algae (Plastid Endosymbiosis merger)
    if (bio.unlockedMulticellular && bio.multicellularPop > 15.0 && planet.starLuminosity > 0.1 && !bio.unlockedAlgae) {
        const condMult = 1.0 + Math.min(2.0, planet.radiation * 0.5);
        if (bio.tryFire('algae', RARITY.NOTABLE, condMult, tickRate, planet)) {
            bio.algaePop = 0.1;
            bio.unlockedAlgae = true;
            ctx.events.push({
                title: "🍃 PLASTID ENDOSYMBIOSIS (ALGAE)",
                desc: "Photosynthetic marine eukaryotes emerge as algae beds.",
                scientificDetails: "Following primary endosymbiosis (engulfing of cyanobacteria), multicellular eukaryotes gain the capacity for photosynthesis, diversifying into red and green algae beds. This plastid merger allows eukaryotes to harness solar energy directly.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedAlgae'
            });
        }
    }

    bio.currentSimulatingNodeId = 'algae';
    if (bio.algaePop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 5, 22, 45);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 4.0);
        const co2Viability = clamp01(planet.co2 / 2.0);
        const totalViability = tempViability * radViability * co2Viability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            const traitMult = 1.0 + (bio.thermalResilienceLevel * 0.1);
            const nudgeMult = bio.getNudgeGrowthMultiplier('algae', planet.activeSolvent);
            const growthRate = 0.75 * totalViability * traitMult * nudgeMult;
            const dPop = growthRate * bio.algaePop * (1 - bio.algaePop / 100.0) * tickRate;
            bio.algaePop = Math.max(0.01, bio.algaePop + dPop);
        } else {
            bio.algaePop = Math.max(0, bio.algaePop - bio.algaePop * 0.6 * effDecayMult * tickRate);
        }
    }

    // 1. Sponges
    if (bio.unlockedAlgae && bio.algaePop > 20.0 && !bio.unlockedSponges) {
        if (bio.tryFire('sponges', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.spongesPop = 0.1;
            bio.unlockedSponges = true;
            ctx.events.push({
                title: "🧽 MARINE SPONGES EMERGE",
                desc: "Simple sessile multicellular organisms filter organic soup from ocean water.",
                scientificDetails: "Sponges (Porifera) represent the earliest animal lineage. Lacking true tissues or organs, they rely on specialized flagellated collar cells (choanocytes) to pump water through pores, filtering organic matter and bacteria for nutrients.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedSponges'
            });
        }
    }

    bio.currentSimulatingNodeId = 'sponges';
    if (bio.spongesPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 10, 22, 40);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 2.8);
        const o2Viability = Math.min(1.0, planet.o2 / 10.0);
        const totalViability = tempViability * radViability * o2Viability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('sponges', planet.activeSolvent);
            const dPop = 0.5 * totalViability * bio.spongesPop * (1 - bio.spongesPop / 100.0) * nudgeMult * tickRate;
            bio.spongesPop = Math.max(0.01, bio.spongesPop + dPop);
        } else {
            bio.spongesPop = Math.max(0, bio.spongesPop - bio.spongesPop * 0.6 * effDecayMult * tickRate);
        }
    }

    // 2. Meduses (Jellyfish / Cnidarians)
    if (bio.unlockedSponges && bio.spongesPop > 25.0 && !bio.unlockedMeduses) {
        if (bio.tryFire('meduses', RARITY.COMMON, 1.0, tickRate, planet)) {
            bio.medusesPop = 0.1;
            bio.unlockedMeduses = true;
            ctx.events.push({
                title: "🪼 JELLYFISH RADIAL RADIATION",
                desc: "Free-swimming cnidarians develop stinging cells, introducing early marine predation.",
                scientificDetails: "Cnidarians (like jellyfish and anemones) evolve radial symmetry, basic nervous nets, and distinct tissue layers. They utilize specialized stinging cells (nematocysts) to capture prey, marking the advent of active macropredation.",
                type: "success",
                tier: RARITY.COMMON.name,
                tokens: RARITY.COMMON.award,
                unlockKey: 'unlockedMeduses'
            });
        }
    }

    bio.currentSimulatingNodeId = 'meduses';
    if (bio.medusesPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 10, 22, 38);
        const o2Viability = Math.min(1.0, planet.o2 / 12.0);
        const totalViability = tempViability * o2Viability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            const dPop = 0.45 * totalViability * bio.medusesPop * (1 - bio.medusesPop / 100.0) * tickRate;
            bio.medusesPop = Math.max(0.01, bio.medusesPop + dPop);
        } else {
            bio.medusesPop = Math.max(0, bio.medusesPop - bio.medusesPop * 0.7 * effDecayMult * tickRate);
        }
    }

    // 3. Bilateral Water Worms
    if (bio.unlockedMeduses && bio.medusesPop > 30.0 && !bio.unlockedWorms) {
        if (bio.tryFire('worms', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.wormsPop = 0.1;
            bio.unlockedWorms = true;
            ctx.events.push({
                title: "🪱 BILATERAL WORMS",
                desc: "Burrowing marine worms introduce bilateral symmetry, head-tail polarization, and central nerves.",
                scientificDetails: "Bilateral worms (bilateria) develop cephalization (a defined head with sensory organs) and triploblastic tissue layers. This enables directed locomotion, burrowing through sediment, and sets the stage for all complex animal body plans.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedWorms'
            });
        }
    }

    bio.currentSimulatingNodeId = 'worms';
    if (bio.wormsPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 8, 20, 38);
        const o2Viability = Math.min(1.0, planet.o2 / 14.0);
        const totalViability = tempViability * o2Viability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            const dPop = 0.4 * totalViability * bio.wormsPop * (1 - bio.wormsPop / 100.0) * tickRate;
            bio.wormsPop = Math.max(0.01, bio.wormsPop + dPop);
        } else {
            bio.wormsPop = Math.max(0, bio.wormsPop - bio.wormsPop * 0.7 * effDecayMult * tickRate);
        }
    }

    // 4. Early Vertebrate Fish
    if (bio.unlockedWorms && bio.wormsPop > 30.0 && !bio.unlockedFish) {
        if (bio.tryFire('fish', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.fishPop = 0.1;
            bio.unlockedFish = true;
            ctx.events.push({
                title: "🐟 VERTEBRATE FISH EVOLUTION",
                desc: "Jawless and jawed fish develop spinal columns, internal skeletons, and gills.",
                scientificDetails: "Early chordates evolve a cartilaginous or bony spinal column (notochord), muscular gills for breathing, and paired fins. Jawed fish (gnathostomes) develop powerful bite mechanics, dominating the marine food web.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedFish'
            });
        }
    }

    bio.currentSimulatingNodeId = 'fish';
    if (bio.fishPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 8, 20, 36);
        const o2Viability = Math.min(1.0, planet.o2 / 15.0);
        const totalViability = tempViability * o2Viability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('fish', planet.activeSolvent);
            const dPop = 0.45 * totalViability * bio.fishPop * (1 - bio.fishPop / 100.0) * nudgeMult * tickRate;
            bio.fishPop = Math.max(0.01, bio.fishPop + dPop);
        } else {
            bio.fishPop = Math.max(0, bio.fishPop - bio.fishPop * 0.65 * effDecayMult * tickRate);
        }
    }

    // 5. Cambrian Explosion (Marine Invertebrates)
    if (bio.unlockedWorms && bio.wormsPop > 20.0 && planet.o2 >= 15.0 && !bio.unlockedCambrian) {
        if (bio.tryFire('cambrian', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.cambrianPop = 0.1;
            bio.unlockedCambrian = true;
            ctx.events.push({
                title: "🦀 CAMBRIAN EXPLOSION ACTIVE",
                desc: "Massive biological radiation of ocean invertebrates (trilobites, mollusks, early arthropods).",
                scientificDetails: "Driven by rising atmospheric oxygen levels and the development of predator-prey dynamics, the Cambrian period triggers a rapid diversification of biological body plans. Mineralized shells, compound eyes, and early chordate structures emerge in the fossil record.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedCambrian'
            });
        }
    }

    bio.currentSimulatingNodeId = 'cambrian';
    if (bio.cambrianPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 8, 20, 38);
        const o2Viability = Math.min(1.0, planet.o2 / 18.0);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 2.5);
        const totalViability = tempViability * o2Viability * radViability * (planet.waterCoverage / 100);

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('cambrian', planet.activeSolvent);
            const dPop = 0.5 * totalViability * bio.cambrianPop * (1 - bio.cambrianPop / 100.0) * nudgeMult * tickRate;
            bio.cambrianPop = Math.max(0.01, bio.cambrianPop + dPop);
        } else {
            bio.cambrianPop = Math.max(0, bio.cambrianPop - bio.cambrianPop * 0.8 * effDecayMult * tickRate);
        }
    }

    // 6. Non-Vascular Mosses (starts land soil plants) — needs UV shield to plausibly colonize land.
    if (bio.unlockedAlgae && bio.algaePop > 25.0 && planet.ozone > 0.5 && planet.hasMagnetosphere && !bio.unlockedMosses) {
        const condMult = 1.0 + 1.5 * clamp01((planet.ozone - 0.5) / 0.4);
        if (bio.tryFire('vascular_tissue', RARITY.NOTABLE, condMult, tickRate, planet)) {
            bio.mossesPop = 0.1;
            bio.unlockedMosses = true;
            ctx.events.push({
                title: "🟢 MOSSES COLONIZE SOIL",
                desc: "Primitive non-vascular bryophytes carpet wet shores, initiating terrestrial soil creation.",
                scientificDetails: "Bryophytes adapt to dry land by developing basic cuticles and rhizoids (anchoring cells). Lacking xylem/phloem, they stay small and require external water films for sperm transport during reproduction.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedMosses'
            });
        }
    }

    bio.currentSimulatingNodeId = 'mosses';
    if (bio.mossesPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 0, 20, 38);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 2.0);
        const landViability = (100 - planet.waterCoverage) / 100;
        const totalViability = tempViability * radViability * landViability * nitrogenViability * co2Viability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('mosses', planet.activeSolvent);
            const dPop = 0.4 * totalViability * bio.mossesPop * (1 - bio.mossesPop / 100.0) * nudgeMult * tickRate;
            bio.mossesPop = Math.max(0.01, bio.mossesPop + dPop);
        } else {
            bio.mossesPop = Math.max(0, bio.mossesPop - bio.mossesPop * 0.6 * effDecayMult * tickRate);
        }
    }

    // 7. Vascular Ferns
    if (bio.unlockedMosses && bio.mossesPop > 30.0 && planet.o2 >= 16.0 && !bio.unlockedFerns) {
        if (bio.tryFire('ferns', RARITY.COMMON, 1.0, tickRate, planet)) {
            bio.fernsPop = 0.1;
            bio.unlockedFerns = true;
            ctx.events.push({
                title: "🌿 VASCULAR FERNS RADIATION",
                desc: "Ferns develop vascular networks (xylem/phloem), growing tall and creating early coal forests.",
                scientificDetails: "Vascular tissue networks let ferns transport water and nutrients vertically, defying gravity to grow several meters tall. They utilize rigid lignin in cell walls, which locks carbon into organic coal sediments.",
                type: "success",
                tier: RARITY.COMMON.name,
                tokens: RARITY.COMMON.award,
                unlockKey: 'unlockedFerns'
            });
        }
    }

    bio.currentSimulatingNodeId = 'ferns';
    if (bio.fernsPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 2, 22, 40);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 2.2);
        const landViability = (100 - planet.waterCoverage) / 100;
        const totalViability = tempViability * radViability * landViability * nitrogenViability * co2Viability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('ferns', planet.activeSolvent);
            const dPop = 0.4 * totalViability * bio.fernsPop * (1 - bio.fernsPop / 100.0) * nudgeMult * tickRate;
            bio.fernsPop = Math.max(0.01, bio.fernsPop + dPop);
        } else {
            bio.fernsPop = Math.max(0, bio.fernsPop - bio.fernsPop * 0.55 * effDecayMult * tickRate);
        }
    }

    // 8. Gymnosperms (Conifers)
    if (bio.unlockedFerns && bio.fernsPop > 30.0 && !bio.unlockedConifers) {
        if (bio.tryFire('seed_evolution', RARITY.COMMON, 1.0, tickRate, planet)) {
            bio.conifersPop = 0.1;
            bio.unlockedConifers = true;
            ctx.events.push({
                title: "🌲 CONIFERS & GYMNOSPERMS",
                desc: "Gymnosperms evolve seeds and pollen, freeing plants from water-dependent reproduction.",
                scientificDetails: "Conifers protect their embryos inside moisture-locked seed husks and rely on wind-pollination rather than water films. This allows them to populate drier, colder, inland continental zones.",
                type: "success",
                tier: RARITY.COMMON.name,
                tokens: RARITY.COMMON.award,
                unlockKey: 'unlockedConifers'
            });
        }
    }

    bio.currentSimulatingNodeId = 'conifers';
    if (bio.conifersPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, -10, 18, 36);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 2.5);
        const landViability = (100 - planet.waterCoverage) / 100;
        const totalViability = tempViability * radViability * landViability * nitrogenViability * co2Viability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('conifers', planet.activeSolvent);
            const dPop = 0.35 * totalViability * bio.conifersPop * (1 - bio.conifersPop / 100.0) * nudgeMult * tickRate;
            bio.conifersPop = Math.max(0.01, bio.conifersPop + dPop);
        } else {
            bio.conifersPop = Math.max(0, bio.conifersPop - bio.conifersPop * 0.5 * effDecayMult * tickRate);
        }
    }

    // 9. Angiosperms (Flowering Plants)
    if (bio.unlockedConifers && bio.conifersPop > 30.0 && planet.o2 >= 18.0 && !bio.unlockedAngiosperms) {
        if (bio.tryFire('angiosperms', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.angiospermsPop = 0.1;
            bio.unlockedAngiosperms = true;
            ctx.events.push({
                title: "🌸 ANGIOSEPRM FLOWERS BLOOM",
                desc: "Flowering plants evolve, creating fruit and nectar that drive co-evolution with insects.",
                scientificDetails: "Angiosperms develop enclosed seeds, petals, and sweet nectar. This recruits insects for targeted pollination and animals for seed dispersal, resulting in highly efficient cycles of growth and explosive biodiversity.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedAngiosperms'
            });
        }
    }

    bio.currentSimulatingNodeId = 'angiosperms';
    if (bio.angiospermsPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 5, 22, 42);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 2.5);
        const landViability = (100 - planet.waterCoverage) / 100;
        const totalViability = tempViability * radViability * landViability * nitrogenViability * co2Viability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('angiosperms', planet.activeSolvent);
            const dPop = 0.4 * totalViability * bio.angiospermsPop * (1 - bio.angiospermsPop / 100.0) * nudgeMult * tickRate;
            bio.angiospermsPop = Math.max(0.01, bio.angiospermsPop + dPop);
        } else {
            bio.angiospermsPop = Math.max(0, bio.angiospermsPop - bio.angiospermsPop * 0.6 * effDecayMult * tickRate);
        }
    }

    // Update composite land flora values
    bio.landPlantsPop = bio.mossesPop + bio.fernsPop + bio.conifersPop + bio.angiospermsPop;
    bio.unlockedLandPlants = bio.unlockedMosses;

    // Terrestrial Invertebrates (Insects / Arthropods)
    if (bio.unlockedMosses && bio.mossesPop > 25.0 && !bio.unlockedInsects) {
        if (bio.tryFire('arthropods', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.insectsPop = 0.1;
            bio.unlockedInsects = true;
            ctx.events.push({
                title: "🕷️ INSECT COLONIZATION",
                desc: "Arthropods migrate to land. Higher O₂ enables gigantism (e.g. giant centipedes).",
                scientificDetails: "Arthropods exploit land niches. Their chitinous exoskeletons prevent water loss and provide structural support under gravity, while simple tracheal tube systems directly oxygenate tissues, enabling gigantism when oxygen levels are high.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedInsects'
            });
        }
    }

    bio.currentSimulatingNodeId = 'insects';
    if (bio.insectsPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 5, 24, 42);
        const foodViability = Math.min(1.0, bio.mossesPop / 20.0);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 2.2);
        const sizeScale = planet.o2 > 25.0 ? 1.5 : 1.0;
        const totalViability = tempViability * foodViability * radViability * sizeScale;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('insects', planet.activeSolvent);
            const dPop = 0.5 * totalViability * bio.insectsPop * (1 - bio.insectsPop / 100.0) * nudgeMult * tickRate;
            bio.insectsPop = Math.max(0.01, bio.insectsPop + dPop);
        } else {
            bio.insectsPop = Math.max(0, bio.insectsPop - bio.insectsPop * 0.7 * effDecayMult * tickRate);
        }
    }

    // Tetrapods — Earth's once-only sarcopterygian -> land transition; MAJOR.
    if (bio.unlockedFish && bio.fishPop > 30.0 && bio.unlockedMosses && bio.mossesPop > 30.0 && !bio.unlockedTetrapod) {
        const ozoneScore = clamp01((planet.ozone - 0.3) / 0.7);
        const o2Score = clamp01((planet.o2 - 17) / 8);
        const condMult = 1.0 + 1.5 * ozoneScore + 1.5 * o2Score; // 1.0 .. 4.0
        if (bio.tryFire('tetrapods', RARITY.MAJOR, condMult, tickRate, planet)) {
            bio.tetrapodPop = 0.1;
            bio.unlockedTetrapod = true;
            ctx.events.push({
                title: "🦎 TETRAPODS WALK LAND",
                desc: "Early tetrapods crawl out of swamps. Air-breathing amphibians adapt to terrestrial life.",
                scientificDetails: "Lobe-finned sarcopterygian fish evolve weight-bearing limb bones, flexible neck structures, and simple lungs. These adaptations allow them to navigate marshy shores and shallow swamps, bridging the gap to land-dwelling tetrapods.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedTetrapod'
            });
        }
    }

    bio.currentSimulatingNodeId = 'tetrapods';
    if (bio.tetrapodPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 8, 22, 38);
        const plantViability = Math.min(1.0, bio.mossesPop / 30.0);
        const o2Viability = planet.o2 >= 15.0 ? 1.0 : planet.o2 / 15.0;
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 2.0);
        const totalViability = tempViability * plantViability * o2Viability * radViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('tetrapods', planet.activeSolvent);
            const dPop = 0.45 * totalViability * bio.tetrapodPop * (1 - bio.tetrapodPop / 100.0) * nudgeMult * tickRate;
            bio.tetrapodPop = Math.max(0.01, bio.tetrapodPop + dPop);
        } else {
            bio.tetrapodPop = Math.max(0, bio.tetrapodPop - bio.tetrapodPop * 0.8 * effDecayMult * tickRate);
        }
    }

    // Branching Amniote Split: Sauropsids (Dinosaurs) vs Synapsids (Mammals)
    // Hard gate keeps the O2-dependence; rolls are independent so they can fire on different ticks.
    const splitGate = bio.unlockedTetrapod && bio.tetrapodPop > 30.0 && planet.o2 > 17.0;

    // Sauropsids (Dinosaur Line)
    if (splitGate && !bio.unlockedSauropsid) {
        const condMult = planet.temperature > 25 ? 1.5 : 1.0;
        if (bio.tryFire('scales', RARITY.NOTABLE, condMult, tickRate, planet)) {
            bio.sauropsidPop = 0.1;
            bio.unlockedSauropsid = true;
            ctx.events.push({
                title: "🦕 SAUROPSID DIVERSIFICATION",
                desc: "Amniotes adapt scales and dry-waste systems. Dinosaur precursors appear, thriving in warm climates.",
                scientificDetails: "The Sauropsid branch develops dry, keratinous scales to shield moisture loss and evolves uric acid excretion, minimizing nitrogenous waste water cost. These adaptations make them highly resilient to warm, arid Mesozoic greenhouse conditions.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedSauropsid'
            });
        }
    }

    // Synapsids (Mammal Line)
    if (splitGate && !bio.unlockedSynapsid) {
        const condMult = planet.o2 > 20 ? 1.5 : 1.0;
        if (bio.tryFire('endthermy', RARITY.NOTABLE, condMult, tickRate, planet)) {
            bio.synapsidPop = 0.1;
            bio.unlockedSynapsid = true;
            ctx.events.push({
                title: "🦧 SYNAPSIDS DIVERSIFICATION",
                desc: "Amniotes evolve higher metabolism. Proto-mammal lines appear, thriving in stable, temperate climates.",
                scientificDetails: "The Synapsid branch develops endothermic high metabolisms, insulation hair, and sweat glands. This constant thermal state enables rapid aerobic activity and mammalian brain expansion in cooler, highly oxygenated Cenozoic conditions.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedSynapsid'
            });
        }
    }

    // Competitions between Mammals and Dinosaurs
    if (bio.unlockedSauropsid && bio.sauropsidPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 12, 32, 45); // Loves warmth
        const plantViability = Math.min(1.0, bio.landPlantsPop / 25.0);
        const scaleBoost = bio.activeAdaptations.has('scales') ? 1.3 : 1.0;

        // Outcompete mammals in greenhouse climates (>28°C)
        const competitionFactor = planet.temperature > 28.0 ? 1.2 : 0.8;
        const totalViability = tempViability * plantViability * scaleBoost * competitionFactor;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('sauropsids', planet.activeSolvent);
            const dPop = 0.4 * totalViability * bio.sauropsidPop * (1 - bio.sauropsidPop / 100.0) * nudgeMult * tickRate;
            bio.sauropsidPop = Math.max(0.01, bio.sauropsidPop + dPop);
        } else {
            bio.sauropsidPop = Math.max(0, bio.sauropsidPop - bio.sauropsidPop * 0.8 * effDecayMult * tickRate);
        }
    }

    if (bio.unlockedSynapsid && bio.synapsidPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 5, 18, 30); // Likes moderate/temperate
        const plantViability = Math.min(1.0, bio.landPlantsPop / 25.0);
        const o2Requirement = planet.o2 >= 20.0 ? 1.0 : (planet.o2 / 20.0); // High oxygen dependence
        const endothermyBoost = bio.activeAdaptations.has('endothermy') ? 1.5 : 1.0;

        // Outcompete dinosaurs in cooler/highly oxygenated conditions
        const competitionFactor = (planet.temperature <= 28.0 && planet.o2 > 20.0) ? 1.3 : 0.7;
        const totalViability = tempViability * plantViability * o2Requirement * endothermyBoost * competitionFactor;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('synapsids', planet.activeSolvent);
            const dPop = 0.4 * totalViability * bio.synapsidPop * (1 - bio.synapsidPop / 100.0) * nudgeMult * tickRate;
            bio.synapsidPop = Math.max(0.01, bio.synapsidPop + dPop);
        } else {
            bio.synapsidPop = Math.max(0, bio.synapsidPop - bio.synapsidPop * 0.8 * effDecayMult * tickRate);
        }
    }

    // Cognitive Species (Intelligent Hominids / Raptors precursor) — MAJOR.
    if ((bio.synapsidPop > 45.0 || bio.sauropsidPop > 45.0) && planet.o2 >= 19.0 && !bio.unlockedCognitive) {
        const condMult = 1.0 + 1.5 * clamp01(Math.max(bio.synapsidPop, bio.sauropsidPop) / 80);
        if (bio.tryFire('cognitive', RARITY.MAJOR, condMult, tickRate, planet)) {
            bio.cognitiveSpeciesPop = 0.1;
            bio.unlockedCognitive = true;
            ctx.events.push({
                title: "🧠 COGNITIVE SPECIES EMERGE",
                desc: "Neocortex expansions lead to complex tool-making. A self-aware species begins shaping the biosphere.",
                scientificDetails: "Extreme encephalization and neocortex enlargement support symbolic reasoning, language syntax, and complex manual tool usage. The species begins actively modifying its niche and environment, bypassing slow genetic adaptations.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedCognitive'
            });
        }
    }

    bio.currentSimulatingNodeId = 'cognitive';
    if (bio.cognitiveSpeciesPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 5, 20, 35);
        const foodViability = Math.min(1.0, (bio.synapsidPop + bio.sauropsidPop) / 30.0);
        const radViability = Math.max(0, 1 - (effRad * (1 - bio.radiationResistance)) / 2.0);
        const totalViability = tempViability * foodViability * radViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('cognitive', planet.activeSolvent);
            const dPop = 0.35 * totalViability * bio.cognitiveSpeciesPop * (1 - bio.cognitiveSpeciesPop / 100.0) * nudgeMult * tickRate;
            bio.cognitiveSpeciesPop = Math.max(0.01, bio.cognitiveSpeciesPop + dPop);
        } else {
            bio.cognitiveSpeciesPop = Math.max(0, bio.cognitiveSpeciesPop - bio.cognitiveSpeciesPop * 0.7 * effDecayMult * tickRate);
        }
    }

    // Technological Silicon AI (Post-Biological Intelligence) — MAJOR.
    if (bio.unlockedCognitive && bio.cognitiveSpeciesPop > 35.0 && !bio.unlockedAI) {
        if (bio.tryFire('technological_singularity', RARITY.MAJOR, 1.0, tickRate, planet)) {
            bio.aiPop = 0.1;
            bio.unlockedAI = true;
            ctx.events.push({
                title: "🤖 TECHNOLOGICAL SINGULARITY",
                desc: "Cognitive beings code autonomous self-replicating silicon neural networks. Post-biological evolution begins.",
                scientificDetails: "Cognitive agents construct silicon-substrate neural architectures that mimic biological synapses but run at clock-rates 10,000x faster. These autonomous nodes self-replicate and improve their own algorithms, decoupling intelligence from organic carbon-based biology.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedAI'
            });
        }
    }

    if (bio.aiPop > 0) {
        // AI does not require oxygen or food, but requires stable magnetic field to shield microprocessors!
        const magnetShieldFactor = planet.hasMagnetosphere ? 1.0 : 0.25;
        const radViability = Math.max(0.1, 1 - (effRad * (1 - bio.radiationResistance)) / 4.0); // radiation harms circuitry
        const totalViability = magnetShieldFactor * radViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('ai', planet.activeSolvent);
            const dPop = 0.3 * totalViability * bio.aiPop * (1 - bio.aiPop / 100.0) * nudgeMult * tickRate;
            bio.aiPop = Math.max(0.01, bio.aiPop + dPop);
        } else {
            // AI decays if magnetic field is lost and radiation is high
            bio.aiPop = Math.max(0, bio.aiPop - bio.aiPop * 0.5 * effDecayMult * tickRate);
        }
    }

    // Cyborg Hybrids — NOTABLE continuation of tech lineage.
    if (bio.unlockedCognitive && bio.cognitiveSpeciesPop > 40.0 && planet.o2 >= 18.0 && !bio.unlockedCyborg) {
        if (bio.tryFire('cybernetic_implants', RARITY.NOTABLE, 1.0, tickRate, planet)) {
            bio.cyborgPop = 0.1;
            bio.unlockedCyborg = true;
            ctx.events.push({
                title: "🦿 CYBORG SYMBIO-INTEGRATION",
                desc: "Cognitive beings integrate neural implants and micro-machinery into their physiology. Cybernetic hybridization begins.",
                scientificDetails: "Cybernetic integration bypasses biological evolutionary bottlenecks. Silicon-neural interfaces link directly to nerve fibers, allowing real-time telemetry processing, artificial organ self-regulation, and expanded somatic durability.",
                type: "success",
                tier: RARITY.NOTABLE.name,
                tokens: RARITY.NOTABLE.award,
                unlockKey: 'unlockedCyborg'
            });
        }
    }

    bio.currentSimulatingNodeId = 'cyborg';
    if (bio.cyborgPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 5, 20, 38);
        const foodViability = Math.min(1.0, (bio.synapsidPop + bio.sauropsidPop) / 20.0 + 0.3); // partly machine, less reliant on food
        const radViability = Math.max(0.1, 1 - (effRad * (1 - bio.radiationResistance)) / 3.0); // shielding makes them radiation resistant
        const totalViability = tempViability * foodViability * radViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('cyborg', planet.activeSolvent);
            const dPop = 0.35 * totalViability * bio.cyborgPop * (1 - bio.cyborgPop / 100.0) * nudgeMult * tickRate;
            bio.cyborgPop = Math.max(0.01, bio.cyborgPop + dPop);
        } else {
            bio.cyborgPop = Math.max(0, bio.cyborgPop - bio.cyborgPop * 0.6 * effDecayMult * tickRate);
        }
    }

    // Planetary AI Noosphere — MAJOR phase shift.
    if (((bio.unlockedAI && bio.aiPop > 45.0) || (bio.unlockedCyborg && bio.cyborgPop > 45.0)) && planet.hasMagnetosphere && !bio.unlockedNoosphere) {
        if (bio.tryFire('global_consciousness', RARITY.MAJOR, 1.0, tickRate, planet)) {
            bio.noospherePop = 0.1;
            bio.unlockedNoosphere = true;
            ctx.events.push({
                title: "🌐 PLANETARY NOOSPHERE",
                desc: "Silicon AI and cybernetic minds link into a global network shell, establishing a unified planetary consciousness.",
                scientificDetails: "A planetary network of low-latency wireless transmitters and computational grids links biological and artificial nodes. The collective intelligence operates as a global thinking sphere, optimizing resource allocations and planetary energy usage.",
                type: "success",
                tier: RARITY.MAJOR.name,
                tokens: RARITY.MAJOR.award,
                unlockKey: 'unlockedNoosphere'
            });
        }
    }

    bio.currentSimulatingNodeId = 'noosphere';
    if (bio.noospherePop > 0) {
        const magnetShieldFactor = planet.hasMagnetosphere ? 1.0 : 0.2;
        const radViability = Math.max(0.05, 1 - (effRad * (1 - bio.radiationResistance)) / 5.0);
        const totalViability = magnetShieldFactor * radViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('noosphere', planet.activeSolvent);
            const dPop = 0.25 * totalViability * bio.noospherePop * (1 - bio.noospherePop / 100.0) * nudgeMult * tickRate;
            bio.noospherePop = Math.max(0.01, bio.noospherePop + dPop);
        } else {
            bio.noospherePop = Math.max(0, bio.noospherePop - bio.noospherePop * 0.5 * effDecayMult * tickRate);
        }
    }

    // Gaia Biosphere Hivemind — coupled bio-tech-planet superorganism; SINGULAR.
    if (((bio.unlockedCyborg && bio.cyborgPop > 45.0) || (bio.unlockedLandPlants && bio.landPlantsPop > 60.0)) && planet.ozone > 0.6 && planet.o2 >= 20.0 && !bio.unlockedGaiaHivemind) {
        const condMult = 1.0 + 1.5 * clamp01((planet.ozone - 0.6) / 0.4) + 1.5 * clamp01((planet.o2 - 20) / 5);
        if (bio.tryFire('ecological_integration', RARITY.SINGULAR, condMult, tickRate, planet)) {
            bio.gaiaHivemindPop = 0.1;
            bio.unlockedGaiaHivemind = true;
            ctx.events.push({
                title: "🌿 GAIA BIOSPHERE HIVEMIND",
                desc: "A self-aware planetary mycelial-neural web integrates all organic species, establishing biological homeostasis.",
                scientificDetails: "A feedback-stabilized system of chemical signaling, mycelial networks, and atmospheric regulation. The global biomass operates as a complex homeostatic system adjusting planetary parameters to optimize survival conditions.",
                type: "success",
                tier: RARITY.SINGULAR.name,
                tokens: RARITY.SINGULAR.award,
                unlockKey: 'unlockedGaiaHivemind'
            });
        }
    }

    bio.currentSimulatingNodeId = 'gaia_hivemind';
    if (bio.gaiaHivemindPop > 0) {
        const tempViability = bio.getTempViability(planet.temperature, 5, 22, 45);
        const moistureViability = planet.waterCoverage > 15.0 ? 1.0 : (planet.waterCoverage / 15.0);
        const radViability = Math.max(0.1, planet.ozone); // requires ozone protection
        const totalViability = tempViability * moistureViability * radViability;

        if (totalViability > 0.05) {
            const nudgeMult = bio.getNudgeGrowthMultiplier('gaia_hivemind', planet.activeSolvent);
            const dPop = 0.25 * totalViability * bio.gaiaHivemindPop * (1 - bio.gaiaHivemindPop / 100.0) * nudgeMult * tickRate;
            bio.gaiaHivemindPop = Math.max(0.01, bio.gaiaHivemindPop + dPop);
        } else {
            bio.gaiaHivemindPop = Math.max(0, bio.gaiaHivemindPop - bio.gaiaHivemindPop * 0.4 * effDecayMult * tickRate);
        }
    }

    // Homeostatic oxygen stabilization feedback from Gaia
    let o2ProdRaw = 0;
    bio.currentSimulatingNodeId = 'gaia_hivemind';
    if (bio.gaiaHivemindPop > 0) {
        if (planet.co2 > 1.0) {
            o2ProdRaw = (bio.photosyntheticPop * 0.06 + bio.algaePop * 0.08 + bio.landPlantsPop * 0.12 + bio.gaiaHivemindPop * 0.15) * co2Viability;
        } else if (planet.o2 > 22.0) {
            o2ProdRaw = Math.max(0, ((bio.photosyntheticPop * 0.06 + bio.algaePop * 0.08 + bio.landPlantsPop * 0.12) - bio.gaiaHivemindPop * 0.2) * co2Viability);
        } else {
            o2ProdRaw = (bio.photosyntheticPop * 0.06 + bio.algaePop * 0.08 + bio.landPlantsPop * 0.12) * co2Viability;
        }
    } else {
        o2ProdRaw = (bio.photosyntheticPop * 0.06 + bio.algaePop * 0.08 + bio.landPlantsPop * 0.12) * co2Viability;
    }

    // Aerobic respiration from consumers (sponges, meduses, worms, fish, cambrian invertebrates, synapsids, sauropsids, cognitive species)
    const respiration = bio.spongesPop * 0.008 + bio.medusesPop * 0.01 + bio.wormsPop * 0.012 + bio.fishPop * 0.025 +
                        bio.cambrianPop * 0.02 + bio.sauropsidPop * 0.05 + bio.synapsidPop * 0.06 + bio.cognitiveSpeciesPop * 0.06;

    // Total living biomass for decomposition
    const totalBiomass = bio.photosyntheticPop + bio.algaePop + bio.landPlantsPop + bio.spongesPop + bio.medusesPop +
                         bio.wormsPop + bio.fishPop + bio.cambrianPop + bio.sauropsidPop +
                         bio.synapsidPop + bio.cognitiveSpeciesPop + bio.noospherePop + bio.gaiaHivemindPop;

    // Global heterotrophic decay flux representing general decomposers (facultative anaerobes, fungi, aerobic bacteria)
    const decayFlux = totalBiomass * 0.015;

    // In an oxygenated atmosphere, decay is aerobic and consumes O2
    const aerobicDecay = decayFlux * Math.min(1.0, planet.o2 / 2.0);

    // Direct anaerobic/heterotrophic decomposition venting of CO2
    const decayCO2Prod = bio.anaerobicPop * 0.02 + decayFlux + (bio.organicSoup > 0 ? 0.35 : 0.01);

    // Spontaneous oxygen wildfires if O2 exceeds 25% (ignitions due to lightning/thunderstrike)
    let fireO2Drawdown = 0;
    let fireCO2Release = 0;
    if (planet.o2 > 25.0) {
        const excessO2 = planet.o2 - 25.0;
        const fireBurnRate = excessO2 * 0.01 * (bio.landPlantsPop > 0 ? 1.0 : 0.15);

        if (bio.landPlantsPop > 0) {
            bio.mossesPop = Math.max(0, bio.mossesPop - bio.mossesPop * fireBurnRate * tickRate);
            bio.fernsPop = Math.max(0, bio.fernsPop - bio.fernsPop * fireBurnRate * tickRate);
            bio.conifersPop = Math.max(0, bio.conifersPop - bio.conifersPop * fireBurnRate * tickRate);
            bio.angiospermsPop = Math.max(0, bio.angiospermsPop - bio.angiospermsPop * fireBurnRate * tickRate);
        }
        bio.photosyntheticPop = Math.max(0, bio.photosyntheticPop - bio.photosyntheticPop * fireBurnRate * 0.4 * tickRate);

        const biomassBurned = (bio.landPlantsPop * 0.4 + bio.photosyntheticPop * 0.1) * fireBurnRate;
        fireO2Drawdown = biomassBurned;
        fireCO2Release = biomassBurned;
    }

    // Abiotic organic soup oxidation by free oxygen (O2 > 21%)
    let soupOxidationO2Drawdown = 0;
    let soupOxidationCO2Release = 0;
    if (planet.o2 > 21.0 && bio.organicSoup > 0.0) {
        const soupOxidation = Math.min(bio.organicSoup, (planet.o2 - 21.0) * 0.02 * tickRate);
        bio.organicSoup = Math.max(0.0, bio.organicSoup - soupOxidation);
        soupOxidationO2Drawdown = soupOxidation * 0.5;
        soupOxidationCO2Release = soupOxidation * 0.5;
    }

    ctx.o2Prod = o2ProdRaw - respiration - fireO2Drawdown - soupOxidationO2Drawdown - aerobicDecay;
    ctx.co2Cons = ctx.o2Prod - decayCO2Prod;
    ctx.co2Prod = decayCO2Prod + fireCO2Release + soupOxidationCO2Release;

    // Nitrogen Cycle: denitrifiers vent N2, fixers consume N2, radiation fixes N2
    const denitrification = bio.anaerobicPop * 0.04 + decayFlux * 1.5;
    const nitrogenFixation = (bio.photosyntheticPop * 0.025 + bio.landPlantsPop * 0.06) * (planet.n2 / (planet.n2 + 30.0));
    const atmosphericFixation = Math.min(1.0, planet.radiation * 0.08);
    ctx.n2Prod = denitrification - nitrogenFixation - atmosphericFixation;
}
