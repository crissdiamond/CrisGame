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

export const RARITY = Object.freeze({
    COMMON:   { name: 'COMMON',   rate: 10.0, award: 2  },
    NOTABLE:  { name: 'NOTABLE',  rate: 2.0,  award: 5  },
    MAJOR:    { name: 'MAJOR',    rate: 0.7,  award: 12 },
    SINGULAR: { name: 'SINGULAR', rate: 0.3,  award: 25 }
});

const SOLVENT_RATE_FACTOR = { water: 1.0, ammonia: 0.7, methane: 0.5 };

function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }

export class BiologySimulation {
    constructor() {
        // --- Water Line Populations ---
        this.organicSoup = 0.0;             // Concentration in ppm (0 to 100)
        this.anaerobicPop = 0.0;            // M cells/mL
        this.photosyntheticPop = 0.0;       // M cells/mL
        this.eukaryoticPop = 0.0;           // M cells/mL
        this.multicellularPop = 0.0;        // Complexity Index (0 to 100)

        // New intermediate water animals
        this.spongesPop = 0.0;
        this.medusesPop = 0.0;
        this.wormsPop = 0.0;
        this.fishPop = 0.0;

        // New vegetable soil lines
        this.mossesPop = 0.0;
        this.fernsPop = 0.0;
        this.conifersPop = 0.0;
        this.angiospermsPop = 0.0;

        this.cambrianPop = 0.0;             // Marine Invertebrates Index
        this.landPlantsPop = 0.0;           // Land Flora Index (composite)
        this.arthropodPop = 0.0;            // Land Insects Index
        this.tetrapodPop = 0.0;             // Tetrapods Index
        this.sauropsidPop = 0.0;            // Dinosaurs/Reptiles Index
        this.synapsidPop = 0.0;             // Mammals/Synapsids Index
        this.cognitiveSpeciesPop = 0.0;     // Cognitive Species Index
        this.technologicalAIPop = 0.0;      // Silicon AI Index
        this.cyborgPop = 0.0;               // Cyborg Hybrids Index
        this.noospherePop = 0.0;            // Planetary AI Noosphere Index
        this.gaiaHivemindPop = 0.0;         // Biosphere Gaia Hivemind Index

        // Unlocked Flags - Water Line
        this.unlockedSoup = false;
        this.unlockedMembrane = false;
        this.unlockedBacteria = false;
        this.unlockedAnaerobic = false;
        this.unlockedPhotosynthetic = false;
        this.unlockedNucleus = false;
        this.unlockedMitochondria = false;
        this.unlockedSexualReproduction = false;
        this.unlockedEukaryotic = false;
        this.unlockedMulticellular = false;

        // New intermediate water unlocks
        this.unlockedSponges = false;
        this.unlockedMeduses = false;
        this.unlockedWorms = false;
        this.unlockedFish = false;

        // New vegetable soil unlocks
        this.unlockedMosses = false;
        this.unlockedFerns = false;
        this.unlockedConifers = false;
        this.unlockedAngiosperms = false;

        this.unlockedCambrian = false;
        this.unlockedLandPlants = false;
        this.unlockedArthropod = false;
        this.unlockedTetrapod = false;
        this.unlockedSauropsid = false;
        this.unlockedSynapsid = false;
        this.unlockedCognitive = false;
        this.unlockedTechnologicalAI = false;
        this.unlockedCyborg = false;
        this.unlockedNoosphere = false;
        this.unlockedGaiaHivemind = false;

        // --- Ammonia Line Populations ---
        this.ammonicSoup = 0.0;
        this.ammonicProtoPop = 0.0;
        this.ammonicMultiPop = 0.0;
        this.silicoFloraPop = 0.0;
        this.cryoFaunaPop = 0.0;
        this.crystallineCognitivePop = 0.0;
        this.quantumLatticePop = 0.0;       // Solid-State Quantum Lattices
        this.cryoHivemindPop = 0.0;         // Cryo-Biosphere Hivemind

        // Unlocked Flags - Ammonia Line
        this.unlockedAmmonicSoup = false;
        this.unlockedAmmonicProto = false;
        this.unlockedAmmonicMulti = false;
        this.unlockedSilicoFlora = false;
        this.unlockedCryoFauna = false;
        this.unlockedCrystallineCognitive = false;
        this.unlockedQuantumLattice = false;
        this.unlockedCryoHivemind = false;

        // --- Methane Line Populations ---
        this.methaneSoup = 0.0;
        this.methaneProtoPop = 0.0;
        this.methaneMultiPop = 0.0;
        this.cryoOrganismsPop = 0.0;
        this.cryoPolymerNetworkPop = 0.0;
        this.thinkingOceanPop = 0.0;        // Thinking Hydrocarbon Oceans
        this.cryoColloidPop = 0.0;          // Megastructure Cryo-Colloids

        // Unlocked Flags - Methane Line
        this.unlockedMethaneSoup = false;
        this.unlockedMethaneProto = false;
        this.unlockedMethaneMulti = false;
        this.unlockedCryoOrganisms = false;
        this.unlockedCryoPolymerNetwork = false;
        this.unlockedThinkingOcean = false;
        this.unlockedCryoColloid = false;

        // --- Genetic Adaptations / Nudges (unlocked via tokens) ---
        this.activeAdaptations = new Set(); // e.g., 'endosymbiosis', 'vascular_tissue', 'amniotic_egg', 'endothermy', 'scales', 'silicon_chains', 'cryo_polymers', etc.

        // Active per-transition rate boosts from nudges. Keyed by transition id;
        // each entry: { multiplier, remainingMyr }. Decays each tick.
        this.pendingNudges = {};

        // General Mutation / Adaptation Level
        this.radiationResistance = 0.1;
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

    /**
     * Poisson roll: returns true if a transition with the given hazard rate
     * (per Myr) fires this tick. Time-step-invariant via 1 - exp(-lambda*dt).
     */
    tryFire(transitionKey, rarity, conditionMult, tickRate, planet) {
        if (!(tickRate > 0)) return false;
        const solventMult = SOLVENT_RATE_FACTOR[planet.activeSolvent] ?? 1.0;
        const nudge = this.pendingNudges[transitionKey];
        const nudgeMult = nudge ? nudge.multiplier : 1.0;
        const lambda = rarity.rate * solventMult * conditionMult * nudgeMult;
        const p = 1 - Math.exp(-lambda * tickRate);
        return Math.random() < p;
    }

    /**
     * Compute biological updates over one simulation step
     */
    update(tickRate, planet) {
        this._decayPendingNudges(tickRate);

        const events = [];
        let o2Prod = 0;
        let co2Cons = 0;
        let n2Prod = 0;
        let ch4Prod = 0;
        let h2Cons = 0;

        const isWater = planet.activeSolvent === 'water';
        const isAmmonia = planet.activeSolvent === 'ammonia';
        const isMethane = planet.activeSolvent === 'methane';

        // ----------------------------------------------------
        // 1. WATER-BASED BIOCHEMISTRY CYCLE
        // ----------------------------------------------------
        if (isWater) {
            const nitrogenViability = 0.5 + 0.5 * clamp01(planet.n2 / 40.0);

            // Soup Synthesis (needs liquid water, 0 to 100°C)
            if (planet.temperature > 10 && planet.temperature < 90 && planet.waterCoverage > 10) {
                const tempFactor = 1 - Math.abs(planet.temperature - 50) / 45;
                const radFactor = Math.min(2.0, planet.radiation * 0.4);
                const tideBoost = planet.hasMoon ? 2.5 : 1.0;
                const synthesisRate = Math.max(0, tempFactor) * radFactor * (planet.waterCoverage / 100) * 8.0 * tideBoost;
                this.organicSoup = Math.min(100.0, this.organicSoup + synthesisRate * tickRate);

                if (!this.unlockedSoup && this.organicSoup > 5.0) {
                    if (this.tryFire('soup', RARITY.COMMON, 1.0, tickRate, planet)) {
                        this.unlockedSoup = true;
                        events.push({
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
                this.organicSoup = Math.max(0, this.organicSoup - this.organicSoup * decay * tickRate);
            }

            // External Membrane
            if (this.unlockedSoup && this.organicSoup > 8.0 && !this.unlockedMembrane) {
                if (this.tryFire('membrane', RARITY.COMMON, 1.0, tickRate, planet)) {
                    this.unlockedMembrane = true;
                    events.push({
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

            // Bacteria / Archea (strict anaerobes)
            if (this.unlockedMembrane && this.organicSoup > 15.0 && this.anaerobicPop === 0) {
                // Abiogenesis-equivalent. Condition richness from soup concentration.
                const condMult = 1.0 + 2.0 * clamp01((this.organicSoup - 15.0) / 30.0);
                if (this.tryFire('anaerobic', RARITY.NOTABLE, condMult, tickRate, planet)) {
                    this.anaerobicPop = 0.1;
                    this.unlockedBacteria = true;
                    this.unlockedAnaerobic = true;
                    events.push({
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

            if (this.anaerobicPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 0, 45, 80);
                const o2Toxicity = Math.max(0.01, 1 - (planet.o2 / 25.0));
                const radViability = Math.max(0, 1 - (planet.getEffectiveRadiation() * (1 - this.radiationResistance)) / 6.0);
                const totalViability = tempViability * o2Toxicity * radViability * (planet.waterCoverage / 100);

                if (totalViability > 0.05) {
                    const nutrientFactor = Math.min(1.0, this.organicSoup / 20.0);
                    const growthRate = 1.3 * totalViability * nutrientFactor;
                    const dPop = growthRate * this.anaerobicPop * (1 - this.anaerobicPop / 150.0) * tickRate;
                    this.anaerobicPop = Math.max(0.01, this.anaerobicPop + dPop);
                    this.organicSoup = Math.max(0, this.organicSoup - this.anaerobicPop * 0.15 * tickRate);
                } else {
                    this.anaerobicPop = Math.max(0, this.anaerobicPop - this.anaerobicPop * 0.4 * tickRate);
                }
            }

            // Photosynthetic Bacteria (Cyanobacteria - consumes CO2, releases O2)
            if (this.unlockedBacteria && this.anaerobicPop > 25.0 && !this.unlockedPhotosynthetic) {
                // Radiation-driven mutation pressure is the natural condition richness here.
                const radBoost = Math.min(3.0, planet.getEffectiveRadiation() * 0.6);
                const condMult = 1.0 + radBoost; // 1.0 .. 4.0
                if (this.tryFire('photosynthesis', RARITY.MAJOR, condMult, tickRate, planet)) {
                    this.photosyntheticPop = 0.1;
                    this.unlockedPhotosynthetic = true;
                    events.push({
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

            if (this.photosyntheticPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 5, 30, 60);
                const radViability = Math.max(0, 1 - (planet.getEffectiveRadiation() * (1 - this.radiationResistance)) / 5.0);
                const totalViability = tempViability * radViability * (planet.waterCoverage / 100);

                if (totalViability > 0.05) {
                    const growthRate = 1.0 * totalViability * nitrogenViability * (0.3 + (planet.radiation / 5.0));
                    const dPop = growthRate * this.photosyntheticPop * (1 - this.photosyntheticPop / 200.0) * tickRate;
                    this.photosyntheticPop = Math.max(0.01, this.photosyntheticPop + dPop);
                } else {
                    this.photosyntheticPop = Math.max(0, this.photosyntheticPop - this.photosyntheticPop * 0.5 * tickRate);
                }
            }

            // Great Oxidation Event trigger (atmospheric milestone, not a stage unlock)
            if (this.unlockedPhotosynthetic && planet.o2 >= 15.0 && !planet.goeAlertTriggered) {
                planet.goeAlertTriggered = true;
                events.push({
                    title: "💨 GREAT OXIDATION EVENT (GOE)",
                    desc: "Atmospheric oxygen spikes above 15%, wiping out strict anaerobes but creating the ozone layer.",
                    scientificDetails: "Once marine iron and sulfur chemical sinks saturate, biological oxygen escapes into the atmosphere. This spikes O2 concentrations, forming an ozone (O3) layer that blocks cosmic UV radiation but triggering a massive extinction of obligate anaerobes.",
                    type: "alert"
                });
            }

            // Cellular Nucleus
            if (this.unlockedPhotosynthetic && this.photosyntheticPop > 15.0 && !this.unlockedNucleus) {
                if (this.tryFire('nucleus', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.unlockedNucleus = true;
                    events.push({
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
            if (this.unlockedNucleus && planet.o2 > 1.2 && !this.unlockedMitochondria) {
                const o2Score = clamp01((planet.o2 - 1.2) / 5.0);
                const popScore = clamp01(this.anaerobicPop / 60);
                const condMult = 1.0 + 3.0 * (0.6 * o2Score + 0.4 * popScore);
                if (this.tryFire('endosymbiosis', RARITY.SINGULAR, condMult, tickRate, planet)) {
                    this.unlockedMitochondria = true;
                    this.eukaryoticPop = 0.1;
                    this.unlockedEukaryotic = true;
                    events.push({
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

            if (this.eukaryoticPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 10, 25, 50);
                const o2Viability = Math.min(1.0, planet.o2 / 5.0);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 4.0);
                const totalViability = tempViability * o2Viability * radViability * (planet.waterCoverage / 100);

                if (totalViability > 0.05) {
                    const growthRate = 0.8 * totalViability;
                    const dPop = growthRate * this.eukaryoticPop * (1 - this.eukaryoticPop / 120.0) * tickRate;
                    this.eukaryoticPop = Math.max(0.01, this.eukaryoticPop + dPop);
                } else {
                    this.eukaryoticPop = Math.max(0, this.eukaryoticPop - this.eukaryoticPop * 0.6 * tickRate);
                }
            }

            // Sexual Reproduction — once in eukaryote stem; MAJOR.
            if (this.unlockedMitochondria && this.eukaryoticPop > 20.0 && !this.unlockedSexualReproduction) {
                const condMult = 1.0 + 2.0 * clamp01((this.eukaryoticPop - 20) / 60);
                if (this.tryFire('sexual_reproduction', RARITY.MAJOR, condMult, tickRate, planet)) {
                    this.unlockedSexualReproduction = true;
                    events.push({
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
            if (this.unlockedSexualReproduction && this.eukaryoticPop > 45.0 && planet.o2 >= 8.0 && !this.unlockedMulticellular) {
                if (this.tryFire('multicellular', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.multicellularPop = 0.1;
                    this.unlockedMulticellular = true;
                    events.push({
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

            if (this.multicellularPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 10, 22, 42);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 3.0);
                const o2Viability = Math.min(1.0, planet.o2 / 12.0);
                const totalViability = tempViability * radViability * o2Viability * (planet.waterCoverage / 100);

                if (totalViability > 0.05) {
                    const growthRate = 0.6 * totalViability;
                    const dPop = growthRate * this.multicellularPop * (1 - this.multicellularPop / 100.0) * tickRate;
                    this.multicellularPop = Math.max(0.01, this.multicellularPop + dPop);
                } else {
                    this.multicellularPop = Math.max(0, this.multicellularPop - this.multicellularPop * 0.7 * tickRate);
                }
            }

            // 1. Sponges
            if (this.unlockedMulticellular && this.multicellularPop > 20.0 && !this.unlockedSponges) {
                if (this.tryFire('sponges', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.spongesPop = 0.1;
                    this.unlockedSponges = true;
                    events.push({
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

            if (this.spongesPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 10, 22, 40);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 2.8);
                const o2Viability = Math.min(1.0, planet.o2 / 10.0);
                const totalViability = tempViability * radViability * o2Viability * (planet.waterCoverage / 100);

                if (totalViability > 0.05) {
                    const dPop = 0.5 * totalViability * this.spongesPop * (1 - this.spongesPop / 100.0) * tickRate;
                    this.spongesPop = Math.max(0.01, this.spongesPop + dPop);
                } else {
                    this.spongesPop = Math.max(0, this.spongesPop - this.spongesPop * 0.6 * tickRate);
                }
            }

            // 2. Meduses (Jellyfish / Cnidarians)
            if (this.unlockedSponges && this.spongesPop > 25.0 && !this.unlockedMeduses) {
                if (this.tryFire('meduses', RARITY.COMMON, 1.0, tickRate, planet)) {
                    this.medusesPop = 0.1;
                    this.unlockedMeduses = true;
                    events.push({
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

            if (this.medusesPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 10, 22, 38);
                const o2Viability = Math.min(1.0, planet.o2 / 12.0);
                const totalViability = tempViability * o2Viability * (planet.waterCoverage / 100);

                if (totalViability > 0.05) {
                    const dPop = 0.45 * totalViability * this.medusesPop * (1 - this.medusesPop / 100.0) * tickRate;
                    this.medusesPop = Math.max(0.01, this.medusesPop + dPop);
                } else {
                    this.medusesPop = Math.max(0, this.medusesPop - this.medusesPop * 0.7 * tickRate);
                }
            }

            // 3. Bilateral Water Worms
            if (this.unlockedMeduses && this.medusesPop > 30.0 && !this.unlockedWorms) {
                if (this.tryFire('worms', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.wormsPop = 0.1;
                    this.unlockedWorms = true;
                    events.push({
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

            if (this.wormsPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 8, 20, 38);
                const o2Viability = Math.min(1.0, planet.o2 / 14.0);
                const totalViability = tempViability * o2Viability * (planet.waterCoverage / 100);

                if (totalViability > 0.05) {
                    const dPop = 0.4 * totalViability * this.wormsPop * (1 - this.wormsPop / 100.0) * tickRate;
                    this.wormsPop = Math.max(0.01, this.wormsPop + dPop);
                } else {
                    this.wormsPop = Math.max(0, this.wormsPop - this.wormsPop * 0.7 * tickRate);
                }
            }

            // 4. Early Vertebrate Fish
            if (this.unlockedWorms && this.wormsPop > 30.0 && !this.unlockedFish) {
                if (this.tryFire('fish', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.fishPop = 0.1;
                    this.unlockedFish = true;
                    events.push({
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

            if (this.fishPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 8, 20, 36);
                const o2Viability = Math.min(1.0, planet.o2 / 15.0);
                const totalViability = tempViability * o2Viability * (planet.waterCoverage / 100);

                if (totalViability > 0.05) {
                    const dPop = 0.45 * totalViability * this.fishPop * (1 - this.fishPop / 100.0) * tickRate;
                    this.fishPop = Math.max(0.01, this.fishPop + dPop);
                } else {
                    this.fishPop = Math.max(0, this.fishPop - this.fishPop * 0.65 * tickRate);
                }
            }

            // 5. Cambrian Explosion (Marine Invertebrates)
            if (this.unlockedWorms && this.wormsPop > 20.0 && planet.o2 >= 15.0 && !this.unlockedCambrian) {
                if (this.tryFire('cambrian', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.cambrianPop = 0.1;
                    this.unlockedCambrian = true;
                    events.push({
                        title: "🦀 CAMBRIAN EXPLOSION ACTIVE",
                        desc: "Massive biological radiation of ocean invertebrates (trilobites, mollusks, early arthropods).",
                        scientificDetails: "Driven by rising atmospheric oxygen levels and the development of predator-prey dynamics, the Cambrian period triggers a rapid diversification of bilateral body plans. Mineralized shells, compound eyes, and early chordate structures emerge in the fossil record.",
                        type: "success",
                        tier: RARITY.NOTABLE.name,
                        tokens: RARITY.NOTABLE.award,
                        unlockKey: 'unlockedCambrian'
                    });
                }
            }

            if (this.cambrianPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 8, 20, 38);
                const o2Viability = Math.min(1.0, planet.o2 / 18.0);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 2.5);
                const totalViability = tempViability * o2Viability * radViability * (planet.waterCoverage / 100);

                if (totalViability > 0.05) {
                    const dPop = 0.5 * totalViability * this.cambrianPop * (1 - this.cambrianPop / 100.0) * tickRate;
                    this.cambrianPop = Math.max(0.01, this.cambrianPop + dPop);
                } else {
                    this.cambrianPop = Math.max(0, this.cambrianPop - this.cambrianPop * 0.8 * tickRate);
                }
            }

            // 6. Non-Vascular Mosses (starts land soil plants) — needs UV shield to plausibly colonize land.
            if (this.unlockedFish && this.fishPop > 25.0 && planet.ozone > 0.5 && planet.hasMagnetosphere && !this.unlockedMosses) {
                const condMult = 1.0 + 1.5 * clamp01((planet.ozone - 0.5) / 0.4);
                if (this.tryFire('vascular_tissue', RARITY.NOTABLE, condMult, tickRate, planet)) {
                    this.mossesPop = 0.1;
                    this.unlockedMosses = true;
                    events.push({
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

            if (this.mossesPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 0, 20, 38);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 2.0);
                const landViability = (100 - planet.waterCoverage) / 100;
                const totalViability = tempViability * radViability * landViability * nitrogenViability;

                if (totalViability > 0.05) {
                    const dPop = 0.4 * totalViability * this.mossesPop * (1 - this.mossesPop / 100.0) * tickRate;
                    this.mossesPop = Math.max(0.01, this.mossesPop + dPop);
                } else {
                    this.mossesPop = Math.max(0, this.mossesPop - this.mossesPop * 0.6 * tickRate);
                }
            }

            // 7. Vascular Ferns
            if (this.unlockedMosses && this.mossesPop > 30.0 && planet.o2 >= 16.0 && !this.unlockedFerns) {
                if (this.tryFire('ferns', RARITY.COMMON, 1.0, tickRate, planet)) {
                    this.fernsPop = 0.1;
                    this.unlockedFerns = true;
                    events.push({
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

            if (this.fernsPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 2, 22, 40);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 2.2);
                const landViability = (100 - planet.waterCoverage) / 100;
                const totalViability = tempViability * radViability * landViability * nitrogenViability;

                if (totalViability > 0.05) {
                    const dPop = 0.4 * totalViability * this.fernsPop * (1 - this.fernsPop / 100.0) * tickRate;
                    this.fernsPop = Math.max(0.01, this.fernsPop + dPop);
                } else {
                    this.fernsPop = Math.max(0, this.fernsPop - this.fernsPop * 0.55 * tickRate);
                }
            }

            // 8. Gymnosperms (Conifers)
            if (this.unlockedFerns && this.fernsPop > 30.0 && !this.unlockedConifers) {
                if (this.tryFire('seed_evolution', RARITY.COMMON, 1.0, tickRate, planet)) {
                    this.conifersPop = 0.1;
                    this.unlockedConifers = true;
                    events.push({
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

            if (this.conifersPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -10, 18, 36);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 2.5);
                const landViability = (100 - planet.waterCoverage) / 100;
                const totalViability = tempViability * radViability * landViability * nitrogenViability;

                if (totalViability > 0.05) {
                    const dPop = 0.35 * totalViability * this.conifersPop * (1 - this.conifersPop / 100.0) * tickRate;
                    this.conifersPop = Math.max(0.01, this.conifersPop + dPop);
                } else {
                    this.conifersPop = Math.max(0, this.conifersPop - this.conifersPop * 0.5 * tickRate);
                }
            }

            // 9. Angiosperms (Flowering Plants)
            if (this.unlockedConifers && this.conifersPop > 30.0 && planet.o2 >= 18.0 && !this.unlockedAngiosperms) {
                if (this.tryFire('angiosperms', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.angiospermsPop = 0.1;
                    this.unlockedAngiosperms = true;
                    events.push({
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

            if (this.angiospermsPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 5, 22, 42);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 2.5);
                const landViability = (100 - planet.waterCoverage) / 100;
                const totalViability = tempViability * radViability * landViability * nitrogenViability;

                if (totalViability > 0.05) {
                    const dPop = 0.4 * totalViability * this.angiospermsPop * (1 - this.angiospermsPop / 100.0) * tickRate;
                    this.angiospermsPop = Math.max(0.01, this.angiospermsPop + dPop);
                } else {
                    this.angiospermsPop = Math.max(0, this.angiospermsPop - this.angiospermsPop * 0.6 * tickRate);
                }
            }

            // Update composite land flora values
            this.landPlantsPop = this.mossesPop + this.fernsPop + this.conifersPop + this.angiospermsPop;
            this.unlockedLandPlants = this.unlockedMosses;

            // Terrestrial Invertebrates (Insects / Arthropods)
            if (this.unlockedMosses && this.mossesPop > 25.0 && !this.unlockedArthropod) {
                if (this.tryFire('arthropods', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.arthropodPop = 0.1;
                    this.unlockedArthropod = true;
                    events.push({
                        title: "🕷️ INSECT COLONIZATION",
                        desc: "Arthropods migrate to land. Higher O₂ enables gigantism (e.g. giant centipedes).",
                        scientificDetails: "Arthropods exploit land niches. Their chitinous exoskeletons prevent water loss and provide structural support under gravity, while simple tracheal tube systems directly oxygenate tissues, enabling gigantism when oxygen levels are high.",
                        type: "success",
                        tier: RARITY.NOTABLE.name,
                        tokens: RARITY.NOTABLE.award,
                        unlockKey: 'unlockedArthropod'
                    });
                }
            }

            if (this.arthropodPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 5, 24, 42);
                const foodViability = Math.min(1.0, this.mossesPop / 20.0);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 2.2);
                const sizeScale = planet.o2 > 25.0 ? 1.5 : 1.0;
                const totalViability = tempViability * foodViability * radViability * sizeScale;

                if (totalViability > 0.05) {
                    const dPop = 0.5 * totalViability * this.arthropodPop * (1 - this.arthropodPop / 100.0) * tickRate;
                    this.arthropodPop = Math.max(0.01, this.arthropodPop + dPop);
                } else {
                    this.arthropodPop = Math.max(0, this.arthropodPop - this.arthropodPop * 0.7 * tickRate);
                }
            }

            // Tetrapods — Earth's once-only sarcopterygian -> land transition; MAJOR.
            if (this.unlockedFish && this.fishPop > 30.0 && this.unlockedMosses && this.mossesPop > 30.0 && !this.unlockedTetrapod) {
                const ozoneScore = clamp01((planet.ozone - 0.3) / 0.7);
                const o2Score = clamp01((planet.o2 - 17) / 8);
                const condMult = 1.0 + 1.5 * ozoneScore + 1.5 * o2Score; // 1.0 .. 4.0
                if (this.tryFire('tetrapods', RARITY.MAJOR, condMult, tickRate, planet)) {
                    this.tetrapodPop = 0.1;
                    this.unlockedTetrapod = true;
                    events.push({
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

            if (this.tetrapodPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 8, 22, 38);
                const plantViability = Math.min(1.0, this.mossesPop / 30.0);
                const o2Viability = planet.o2 >= 15.0 ? 1.0 : planet.o2 / 15.0;
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 2.0);
                const totalViability = tempViability * plantViability * o2Viability * radViability;

                if (totalViability > 0.05) {
                    const dPop = 0.45 * totalViability * this.tetrapodPop * (1 - this.tetrapodPop / 100.0) * tickRate;
                    this.tetrapodPop = Math.max(0.01, this.tetrapodPop + dPop);
                } else {
                    this.tetrapodPop = Math.max(0, this.tetrapodPop - this.tetrapodPop * 0.8 * tickRate);
                }
            }

            // Branching Amniote Split: Sauropsids (Dinosaurs) vs Synapsids (Mammals)
            // Hard gate keeps the O2-dependence; rolls are independent so they can fire on different ticks.
            const splitGate = this.unlockedTetrapod && this.tetrapodPop > 30.0 && planet.o2 > 17.0;

            // Sauropsids (Dinosaur Line)
            if (splitGate && !this.unlockedSauropsid) {
                const condMult = planet.temperature > 25 ? 1.5 : 1.0;
                if (this.tryFire('scales', RARITY.NOTABLE, condMult, tickRate, planet)) {
                    this.sauropsidPop = 0.1;
                    this.unlockedSauropsid = true;
                    events.push({
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
            if (splitGate && !this.unlockedSynapsid) {
                const condMult = planet.o2 > 20 ? 1.5 : 1.0;
                if (this.tryFire('endthermy', RARITY.NOTABLE, condMult, tickRate, planet)) {
                    this.synapsidPop = 0.1;
                    this.unlockedSynapsid = true;
                    events.push({
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
            if (this.unlockedSauropsid && this.sauropsidPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 12, 32, 45); // Loves warmth
                const plantViability = Math.min(1.0, this.landPlantsPop / 25.0);
                const scaleBoost = this.activeAdaptations.has('scales') ? 1.3 : 1.0;

                // Outcompete mammals in greenhouse climates (>28°C)
                const competitionFactor = planet.temperature > 28.0 ? 1.2 : 0.8;
                const totalViability = tempViability * plantViability * scaleBoost * competitionFactor;

                if (totalViability > 0.05) {
                    const dPop = 0.4 * totalViability * this.sauropsidPop * (1 - this.sauropsidPop / 100.0) * tickRate;
                    this.sauropsidPop = Math.max(0.01, this.sauropsidPop + dPop);
                } else {
                    this.sauropsidPop = Math.max(0, this.sauropsidPop - this.sauropsidPop * 0.8 * tickRate);
                }
            }

            if (this.unlockedSynapsid && this.synapsidPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 5, 18, 30); // Likes moderate/temperate
                const plantViability = Math.min(1.0, this.landPlantsPop / 25.0);
                const o2Requirement = planet.o2 >= 20.0 ? 1.0 : (planet.o2 / 20.0); // High oxygen dependence
                const endothermyBoost = this.activeAdaptations.has('endothermy') ? 1.5 : 1.0;

                // Outcompete dinosaurs in cooler/highly oxygenated conditions
                const competitionFactor = (planet.temperature <= 28.0 && planet.o2 > 20.0) ? 1.3 : 0.7;
                const totalViability = tempViability * plantViability * o2Requirement * endothermyBoost * competitionFactor;

                if (totalViability > 0.05) {
                    const dPop = 0.4 * totalViability * this.synapsidPop * (1 - this.synapsidPop / 100.0) * tickRate;
                    this.synapsidPop = Math.max(0.01, this.synapsidPop + dPop);
                } else {
                    this.synapsidPop = Math.max(0, this.synapsidPop - this.synapsidPop * 0.8 * tickRate);
                }
            }

            // Cognitive Species (Intelligent Hominids / Raptors precursor) — MAJOR.
            if ((this.synapsidPop > 45.0 || this.sauropsidPop > 45.0) && planet.o2 >= 19.0 && !this.unlockedCognitive) {
                const condMult = 1.0 + 1.5 * clamp01(Math.max(this.synapsidPop, this.sauropsidPop) / 80);
                if (this.tryFire('cognitive', RARITY.MAJOR, condMult, tickRate, planet)) {
                    this.cognitiveSpeciesPop = 0.1;
                    this.unlockedCognitive = true;
                    events.push({
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

            if (this.cognitiveSpeciesPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 5, 20, 35);
                const foodViability = Math.min(1.0, (this.synapsidPop + this.sauropsidPop) / 30.0);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 2.0);
                const totalViability = tempViability * foodViability * radViability;

                if (totalViability > 0.05) {
                    const dPop = 0.35 * totalViability * this.cognitiveSpeciesPop * (1 - this.cognitiveSpeciesPop / 100.0) * tickRate;
                    this.cognitiveSpeciesPop = Math.max(0.01, this.cognitiveSpeciesPop + dPop);
                } else {
                    this.cognitiveSpeciesPop = Math.max(0, this.cognitiveSpeciesPop - this.cognitiveSpeciesPop * 0.7 * tickRate);
                }
            }

            // Technological Silicon AI (Post-Biological Intelligence) — MAJOR.
            if (this.unlockedCognitive && this.cognitiveSpeciesPop > 35.0 && !this.unlockedTechnologicalAI) {
                if (this.tryFire('technological_singularity', RARITY.MAJOR, 1.0, tickRate, planet)) {
                    this.technologicalAIPop = 0.1;
                    this.unlockedTechnologicalAI = true;
                    events.push({
                        title: "🤖 TECHNOLOGICAL SINGULARITY",
                        desc: "Cognitive beings code autonomous self-replicating silicon neural networks. Post-biological evolution begins.",
                        scientificDetails: "Cognitive agents construct silicon-substrate neural architectures that mimic biological synapses but run at clock-rates 10,000x faster. These autonomous nodes self-replicate and improve their own algorithms, decoupling intelligence from organic carbon-based biology.",
                        type: "success",
                        tier: RARITY.MAJOR.name,
                        tokens: RARITY.MAJOR.award,
                        unlockKey: 'unlockedTechnologicalAI'
                    });
                }
            }

            if (this.technologicalAIPop > 0) {
                // AI does not require oxygen or food, but requires stable magnetic field to shield microprocessors!
                const magnetShieldFactor = planet.hasMagnetosphere ? 1.0 : 0.25;
                const radViability = Math.max(0.1, 1 - planet.getEffectiveRadiation() / 4.0); // radiation harms circuitry
                const totalViability = magnetShieldFactor * radViability;

                if (totalViability > 0.05) {
                    const dPop = 0.3 * totalViability * this.technologicalAIPop * (1 - this.technologicalAIPop / 100.0) * tickRate;
                    this.technologicalAIPop = Math.max(0.01, this.technologicalAIPop + dPop);
                } else {
                    // AI decays if magnetic field is lost and radiation is high
                    this.technologicalAIPop = Math.max(0, this.technologicalAIPop - this.technologicalAIPop * 0.5 * tickRate);
                }
            }

            // Cyborg Hybrids — NOTABLE continuation of tech lineage.
            if (this.unlockedCognitive && this.cognitiveSpeciesPop > 40.0 && planet.o2 >= 18.0 && !this.unlockedCyborg) {
                if (this.tryFire('cybernetic_implants', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.cyborgPop = 0.1;
                    this.unlockedCyborg = true;
                    events.push({
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

            if (this.cyborgPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 5, 20, 38);
                const foodViability = Math.min(1.0, (this.synapsidPop + this.sauropsidPop) / 20.0 + 0.3); // partly machine, less reliant on food
                const radViability = Math.max(0.1, 1 - planet.getEffectiveRadiation() / 3.0); // shielding makes them radiation resistant
                const totalViability = tempViability * foodViability * radViability;

                if (totalViability > 0.05) {
                    const dPop = 0.35 * totalViability * this.cyborgPop * (1 - this.cyborgPop / 100.0) * tickRate;
                    this.cyborgPop = Math.max(0.01, this.cyborgPop + dPop);
                } else {
                    this.cyborgPop = Math.max(0, this.cyborgPop - this.cyborgPop * 0.6 * tickRate);
                }
            }

            // Planetary AI Noosphere — MAJOR phase shift.
            if (((this.unlockedTechnologicalAI && this.technologicalAIPop > 45.0) || (this.unlockedCyborg && this.cyborgPop > 45.0)) && planet.hasMagnetosphere && !this.unlockedNoosphere) {
                if (this.tryFire('global_consciousness', RARITY.MAJOR, 1.0, tickRate, planet)) {
                    this.noospherePop = 0.1;
                    this.unlockedNoosphere = true;
                    events.push({
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

            if (this.noospherePop > 0) {
                const magnetShieldFactor = planet.hasMagnetosphere ? 1.0 : 0.2;
                const radViability = Math.max(0.05, 1 - planet.getEffectiveRadiation() / 5.0);
                const totalViability = magnetShieldFactor * radViability;

                if (totalViability > 0.05) {
                    const dPop = 0.25 * totalViability * this.noospherePop * (1 - this.noospherePop / 100.0) * tickRate;
                    this.noospherePop = Math.max(0.01, this.noospherePop + dPop);
                } else {
                    this.noospherePop = Math.max(0, this.noospherePop - this.noospherePop * 0.5 * tickRate);
                }
            }

            // Gaia Biosphere Hivemind — coupled bio-tech-planet superorganism; SINGULAR.
            if (((this.unlockedCyborg && this.cyborgPop > 45.0) || (this.unlockedLandPlants && this.landPlantsPop > 60.0)) && planet.ozone > 0.6 && planet.o2 >= 20.0 && !this.unlockedGaiaHivemind) {
                const condMult = 1.0 + 1.5 * clamp01((planet.ozone - 0.6) / 0.4) + 1.5 * clamp01((planet.o2 - 20) / 5);
                if (this.tryFire('ecological_integration', RARITY.SINGULAR, condMult, tickRate, planet)) {
                    this.gaiaHivemindPop = 0.1;
                    this.unlockedGaiaHivemind = true;
                    events.push({
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

            if (this.gaiaHivemindPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, 5, 22, 45);
                const moistureViability = planet.waterCoverage > 15.0 ? 1.0 : (planet.waterCoverage / 15.0);
                const radViability = Math.max(0.1, planet.ozone); // requires ozone protection
                const totalViability = tempViability * moistureViability * radViability;

                if (totalViability > 0.05) {
                    const dPop = 0.25 * totalViability * this.gaiaHivemindPop * (1 - this.gaiaHivemindPop / 100.0) * tickRate;
                    this.gaiaHivemindPop = Math.max(0.01, this.gaiaHivemindPop + dPop);
                } else {
                    this.gaiaHivemindPop = Math.max(0, this.gaiaHivemindPop - this.gaiaHivemindPop * 0.4 * tickRate);
                }
            }

            // Homeostatic oxygen stabilization feedback from Gaia
            let o2ProdRaw = 0;
            if (this.gaiaHivemindPop > 0) {
                if (planet.co2 > 1.0) {
                    o2ProdRaw = this.photosyntheticPop * 0.06 + this.landPlantsPop * 0.12 + this.gaiaHivemindPop * 0.15;
                } else if (planet.o2 > 22.0) {
                    o2ProdRaw = Math.max(0, (this.photosyntheticPop * 0.06 + this.landPlantsPop * 0.12) - this.gaiaHivemindPop * 0.2);
                } else {
                    o2ProdRaw = this.photosyntheticPop * 0.06 + this.landPlantsPop * 0.12;
                }
            } else {
                o2ProdRaw = this.photosyntheticPop * 0.06 + this.landPlantsPop * 0.12;
            }

            // Aerobic respiration from consumers (sponges, meduses, worms, fish, cambrian invertebrates, synapsids, sauropsids, cognitive species)
            const respiration = this.spongesPop * 0.008 + this.medusesPop * 0.01 + this.wormsPop * 0.012 + this.fishPop * 0.025 + 
                                this.cambrianPop * 0.02 + this.sauropsidPop * 0.05 + this.synapsidPop * 0.06 + this.cognitiveSpeciesPop * 0.06;

            o2Prod = o2ProdRaw - respiration;
            co2Cons = o2Prod;
            
            // Nitrogen Cycle: denitrifiers vent N2, fixers consume N2, radiation fixes N2
            const denitrification = this.anaerobicPop * 0.04;
            const nitrogenFixation = this.photosyntheticPop * 0.025 + this.landPlantsPop * 0.06;
            const atmosphericFixation = Math.min(1.0, planet.radiation * 0.08);
            n2Prod = denitrification - nitrogenFixation - atmosphericFixation;
        }

        // ----------------------------------------------------
        // 2. AMMONIA-BASED BIOCHEMISTRY CYCLE
        // ----------------------------------------------------
        if (isAmmonia) {
            // Ammonia Primordial Soup (requires ammonia liquid: -78°C to -33°C)
            if (planet.temperature > -80 && planet.temperature < -30 && planet.ammoniaCoverage > 10) {
                const tempFactor = 1 - Math.abs(planet.temperature - (-55)) / 25;
                const radFactor = Math.min(2.0, planet.radiation * 0.5);
                const synthesisRate = Math.max(0, tempFactor) * radFactor * (planet.ammoniaCoverage / 100) * 6.0;
                this.ammonicSoup = Math.min(100.0, this.ammonicSoup + synthesisRate * tickRate);

                if (!this.unlockedAmmonicSoup && this.ammonicSoup > 5.0) {
                    if (this.tryFire('ammonic_soup', RARITY.COMMON, 1.0, tickRate, planet)) {
                        this.unlockedAmmonicSoup = true;
                        events.push({
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
                this.ammonicSoup = Math.max(0, this.ammonicSoup - this.ammonicSoup * 0.05 * tickRate);
            }

            // Ammonic Anaerobes
            if (this.unlockedAmmonicSoup && this.ammonicSoup > 10.0 && this.ammonicProtoPop === 0) {
                if (this.tryFire('ammonic_proto', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.ammonicProtoPop = 0.1;
                    this.unlockedAmmonicProto = true;
                    events.push({
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

            if (this.ammonicProtoPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -80, -50, -30);
                const totalViability = tempViability * (planet.ammoniaCoverage / 100);

                if (totalViability > 0.05) {
                    const nutrientFactor = Math.min(1.0, this.ammonicSoup / 20.0);
                    const dPop = 1.0 * totalViability * nutrientFactor * this.ammonicProtoPop * (1 - this.ammonicProtoPop / 120.0) * tickRate;
                    this.ammonicProtoPop = Math.max(0.01, this.ammonicProtoPop + dPop);
                    this.ammonicSoup = Math.max(0, this.ammonicSoup - this.ammonicProtoPop * 0.1 * tickRate);
                } else {
                    this.ammonicProtoPop = Math.max(0, this.ammonicProtoPop - this.ammonicProtoPop * 0.4 * tickRate);
                }
            }

            // Ammonic Multicellularity — MAJOR (no O2 analogue to drive complex biochem).
            if (this.unlockedAmmonicProto && this.ammonicProtoPop > 35.0 && !this.unlockedAmmonicMulti) {
                if (this.tryFire('ammonic_multi', RARITY.MAJOR, 1.0, tickRate, planet)) {
                    this.ammonicMultiPop = 0.1;
                    this.unlockedAmmonicMulti = true;
                    events.push({
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

            if (this.ammonicMultiPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -78, -55, -33);
                const radViability = Math.max(0, 1 - planet.getEffectiveRadiation() / 3.0);
                const totalViability = tempViability * radViability * (planet.ammoniaCoverage / 100);

                if (totalViability > 0.05) {
                    const dPop = 0.5 * totalViability * this.ammonicMultiPop * (1 - this.ammonicMultiPop / 100.0) * tickRate;
                    this.ammonicMultiPop = Math.max(0.01, this.ammonicMultiPop + dPop);
                } else {
                    this.ammonicMultiPop = Math.max(0, this.ammonicMultiPop - this.ammonicMultiPop * 0.6 * tickRate);
                }
            }

            // Silico-Flora
            if (this.unlockedAmmonicMulti && planet.temperature < -45.0 && !this.unlockedSilicoFlora) {
                if (this.tryFire('silicon_chains', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.silicoFloraPop = 0.1;
                    this.unlockedSilicoFlora = true;
                    events.push({
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

            if (this.silicoFloraPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -85, -60, -35);
                const landViability = (100 - planet.ammoniaCoverage) / 100;
                const totalViability = tempViability * landViability;

                if (totalViability > 0.05) {
                    const dPop = 0.45 * totalViability * this.silicoFloraPop * (1 - this.silicoFloraPop / 100.0) * tickRate;
                    this.silicoFloraPop = Math.max(0.01, this.silicoFloraPop + dPop);
                } else {
                    this.silicoFloraPop = Math.max(0, this.silicoFloraPop - this.silicoFloraPop * 0.5 * tickRate);
                }
            }

            // Cryo-Fauna (speculative ammonic animals)
            if (this.unlockedSilicoFlora && this.silicoFloraPop > 30.0 && !this.unlockedCryoFauna) {
                if (this.tryFire('cryo_fauna', RARITY.NOTABLE, 1.0, tickRate, planet)) {
                    this.cryoFaunaPop = 0.1;
                    this.unlockedCryoFauna = true;
                    events.push({
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

            if (this.cryoFaunaPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -80, -58, -35);
                const plantFood = Math.min(1.0, this.silicoFloraPop / 25.0);
                const totalViability = tempViability * plantFood;

                if (totalViability > 0.05) {
                    const dPop = 0.4 * totalViability * this.cryoFaunaPop * (1 - this.cryoFaunaPop / 100.0) * tickRate;
                    this.cryoFaunaPop = Math.max(0.01, this.cryoFaunaPop + dPop);
                } else {
                    this.cryoFaunaPop = Math.max(0, this.cryoFaunaPop - this.cryoFaunaPop * 0.7 * tickRate);
                }
            }

            // Crystalline Cognitive Swarms — MAJOR.
            if (this.unlockedCryoFauna && this.cryoFaunaPop > 35.0 && !this.unlockedCrystallineCognitive) {
                if (this.tryFire('crystalline_collective', RARITY.MAJOR, 1.0, tickRate, planet)) {
                    this.crystallineCognitivePop = 0.1;
                    this.unlockedCrystallineCognitive = true;
                    events.push({
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

            if (this.crystallineCognitivePop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -80, -60, -40);
                const totalViability = tempViability * Math.min(1.0, this.cryoFaunaPop / 20.0);

                if (totalViability > 0.05) {
                    const dPop = 0.3 * totalViability * this.crystallineCognitivePop * (1 - this.crystallineCognitivePop / 80.0) * tickRate;
                    this.crystallineCognitivePop = Math.max(0.01, this.crystallineCognitivePop + dPop);
                } else {
                    this.crystallineCognitivePop = Math.max(0, this.crystallineCognitivePop - this.crystallineCognitivePop * 0.5 * tickRate);
                }
            }

            // Solid-State Quantum Lattices — SINGULAR. Requires deep cold.
            if (this.unlockedCrystallineCognitive && this.crystallineCognitivePop > 40.0 && planet.temperature < -50.0 && !this.unlockedQuantumLattice) {
                if (this.tryFire('quantum_alignment', RARITY.SINGULAR, 1.0, tickRate, planet)) {
                    this.quantumLatticePop = 0.1;
                    this.unlockedQuantumLattice = true;
                    events.push({
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

            if (this.quantumLatticePop > 0) {
                // Must be cold to maintain superconductivity!
                const tempViability = this.getTempViability(planet.temperature, -100, -65, -45); // dies if it warms up past -45°C
                const totalViability = tempViability;

                if (totalViability > 0.05) {
                    const dPop = 0.25 * totalViability * this.quantumLatticePop * (1 - this.quantumLatticePop / 100.0) * tickRate;
                    this.quantumLatticePop = Math.max(0.01, this.quantumLatticePop + dPop);
                } else {
                    this.quantumLatticePop = Math.max(0, this.quantumLatticePop - this.quantumLatticePop * 0.7 * tickRate);
                }
            }

            // Cryo-Biosphere Hivemind — SINGULAR.
            if (this.unlockedCrystallineCognitive && this.crystallineCognitivePop > 40.0 && this.silicoFloraPop > 45.0 && planet.ammoniaCoverage > 25.0 && !this.unlockedCryoHivemind) {
                if (this.tryFire('cryo_neural_webs', RARITY.SINGULAR, 1.0, tickRate, planet)) {
                    this.cryoHivemindPop = 0.1;
                    this.unlockedCryoHivemind = true;
                    events.push({
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

            if (this.cryoHivemindPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -80, -58, -30);
                const ammoniaViability = planet.ammoniaCoverage > 15.0 ? 1.0 : (planet.ammoniaCoverage / 15.0);
                const totalViability = tempViability * ammoniaViability;

                if (totalViability > 0.05) {
                    const dPop = 0.25 * totalViability * this.cryoHivemindPop * (1 - this.cryoHivemindPop / 100.0) * tickRate;
                    this.cryoHivemindPop = Math.max(0.01, this.cryoHivemindPop + dPop);
                } else {
                    this.cryoHivemindPop = Math.max(0, this.cryoHivemindPop - this.cryoHivemindPop * 0.4 * tickRate);
                }
            }

            // Ammonic life produces N2 as photosynthesis byproduct, boosted by Cryo Hivemind
            if (this.cryoHivemindPop > 0) {
                if (planet.co2 > 1.0) {
                    n2Prod = this.ammonicProtoPop * 0.05 + this.silicoFloraPop * 0.1 + this.cryoHivemindPop * 0.12;
                } else {
                    n2Prod = this.ammonicProtoPop * 0.05 + this.silicoFloraPop * 0.1;
                }
            } else {
                n2Prod = this.ammonicProtoPop * 0.05 + this.silicoFloraPop * 0.1;
            }
            co2Cons = this.silicoFloraPop * 0.08 + this.ammonicProtoPop * 0.01 + this.crystallineCognitivePop * 0.02 + this.quantumLatticePop * 0.01 + this.cryoHivemindPop * 0.03;
        }

        // ----------------------------------------------------
        // 3. METHANE-BASED BIOCHEMISTRY CYCLE
        // ----------------------------------------------------
        if (isMethane) {
            // Methane Primordial Soup (-183°C to -140°C)
            if (planet.temperature > -185 && planet.temperature < -135 && planet.methaneCoverage > 10) {
                const tempFactor = 1 - Math.abs(planet.temperature - (-160)) / 25;
                const synthesisRate = Math.max(0, tempFactor) * (planet.methaneCoverage / 100) * 5.0;
                this.methaneSoup = Math.min(100.0, this.methaneSoup + synthesisRate * tickRate);

                if (!this.unlockedMethaneSoup && this.methaneSoup > 5.0) {
                    if (this.tryFire('methane_soup', RARITY.COMMON, 1.0, tickRate, planet)) {
                        this.unlockedMethaneSoup = true;
                        events.push({
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
                this.methaneSoup = Math.max(0, this.methaneSoup - this.methaneSoup * 0.05 * tickRate);
            }

            // Methanotrophic Proto-cells — MAJOR (azotosome stability hypothetical).
            if (this.unlockedMethaneSoup && this.methaneSoup > 10.0 && this.methaneProtoPop === 0) {
                if (this.tryFire('methane_proto', RARITY.MAJOR, 1.0, tickRate, planet)) {
                    this.unlockedMethaneProto = true;
                    this.methaneProtoPop = 0.1;
                    events.push({
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

            if (this.methaneProtoPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -185, -160, -140);
                const totalViability = tempViability * (planet.methaneCoverage / 100);

                if (totalViability > 0.05) {
                    const nutrientFactor = Math.min(1.0, this.methaneSoup / 20.0);
                    const dPop = 0.9 * totalViability * nutrientFactor * this.methaneProtoPop * (1 - this.methaneProtoPop / 100.0) * tickRate;
                    this.methaneProtoPop = Math.max(0.01, this.methaneProtoPop + dPop);
                    this.methaneSoup = Math.max(0, this.methaneSoup - this.methaneProtoPop * 0.08 * tickRate);
                } else {
                    this.methaneProtoPop = Math.max(0, this.methaneProtoPop - this.methaneProtoPop * 0.5 * tickRate);
                }
            }

            // Methane Multicellularity — SINGULAR (apolar solvent, no proton chemistry).
            if (this.unlockedMethaneProto && this.methaneProtoPop > 30.0 && !this.unlockedMethaneMulti) {
                if (this.tryFire('methane_multi', RARITY.SINGULAR, 1.0, tickRate, planet)) {
                    this.methaneMultiPop = 0.1;
                    this.unlockedMethaneMulti = true;
                    events.push({
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

            if (this.methaneMultiPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -183, -160, -140);
                const totalViability = tempViability * (planet.methaneCoverage / 100);

                if (totalViability > 0.05) {
                    const dPop = 0.45 * totalViability * this.methaneMultiPop * (1 - this.methaneMultiPop / 80.0) * tickRate;
                    this.methaneMultiPop = Math.max(0.01, this.methaneMultiPop + dPop);
                } else {
                    this.methaneMultiPop = Math.max(0, this.methaneMultiPop - this.methaneMultiPop * 0.6 * tickRate);
                }
            }

            // Cryo-Organisms — MAJOR.
            if (this.unlockedMethaneMulti && !this.unlockedCryoOrganisms) {
                if (this.tryFire('cryo_polymers', RARITY.MAJOR, 1.0, tickRate, planet)) {
                    this.cryoOrganismsPop = 0.1;
                    this.unlockedCryoOrganisms = true;
                    events.push({
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

            if (this.cryoOrganismsPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -183, -162, -140);
                const landViability = (100 - planet.methaneCoverage) / 100;
                const totalViability = tempViability * landViability;

                if (totalViability > 0.05) {
                    const dPop = 0.35 * totalViability * this.cryoOrganismsPop * (1 - this.cryoOrganismsPop / 70.0) * tickRate;
                    this.cryoOrganismsPop = Math.max(0.01, this.cryoOrganismsPop + dPop);
                } else {
                    this.cryoOrganismsPop = Math.max(0, this.cryoOrganismsPop - this.cryoOrganismsPop * 0.7 * tickRate);
                }
            }

            // Cryo-Polymer Networks — MAJOR.
            if (this.unlockedCryoOrganisms && this.cryoOrganismsPop > 30.0 && !this.unlockedCryoPolymerNetwork) {
                if (this.tryFire('cryo_polymer_network', RARITY.MAJOR, 1.0, tickRate, planet)) {
                    this.cryoPolymerNetworkPop = 0.1;
                    this.unlockedCryoPolymerNetwork = true;
                    events.push({
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

            if (this.cryoPolymerNetworkPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -185, -165, -145);
                const totalViability = tempViability;

                if (totalViability > 0.05) {
                    const dPop = 0.25 * totalViability * this.cryoPolymerNetworkPop * (1 - this.cryoPolymerNetworkPop / 60.0) * tickRate;
                    this.cryoPolymerNetworkPop = Math.max(0.01, this.cryoPolymerNetworkPop + dPop);
                } else {
                    this.cryoPolymerNetworkPop = Math.max(0, this.cryoPolymerNetworkPop - this.cryoPolymerNetworkPop * 0.6 * tickRate);
                }
            }

            // Thinking Hydrocarbon Oceans — SINGULAR.
            if (this.unlockedCryoPolymerNetwork && this.cryoPolymerNetworkPop > 40.0 && planet.methaneCoverage > 40.0 && !this.unlockedThinkingOcean) {
                if (this.tryFire('colloidal_solids', RARITY.SINGULAR, 1.0, tickRate, planet)) {
                    this.thinkingOceanPop = 0.1;
                    this.unlockedThinkingOcean = true;
                    events.push({
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

            if (this.thinkingOceanPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -185, -165, -145);
                const coverageViability = planet.methaneCoverage / 100;
                const totalViability = tempViability * coverageViability;

                if (totalViability > 0.05) {
                    const dPop = 0.2 * totalViability * this.thinkingOceanPop * (1 - this.thinkingOceanPop / 100.0) * tickRate;
                    this.thinkingOceanPop = Math.max(0.01, this.thinkingOceanPop + dPop);
                } else {
                    this.thinkingOceanPop = Math.max(0, this.thinkingOceanPop - this.thinkingOceanPop * 0.6 * tickRate);
                }
            }

            // Megastructure Cryo-Colloids — SINGULAR.
            if (this.unlockedCryoPolymerNetwork && this.cryoPolymerNetworkPop > 40.0 && this.cryoOrganismsPop > 45.0 && planet.h2 > 10.0 && !this.unlockedCryoColloid) {
                if (this.tryFire('macromolecular_assembly', RARITY.SINGULAR, 1.0, tickRate, planet)) {
                    this.cryoColloidPop = 0.1;
                    this.unlockedCryoColloid = true;
                    events.push({
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

            if (this.cryoColloidPop > 0) {
                const tempViability = this.getTempViability(planet.temperature, -183, -162, -140);
                const h2Viability = Math.min(1.0, planet.h2 / 15.0);
                const totalViability = tempViability * h2Viability;

                if (totalViability > 0.05) {
                    const dPop = 0.25 * totalViability * this.cryoColloidPop * (1 - this.cryoColloidPop / 100.0) * tickRate;
                    this.cryoColloidPop = Math.max(0.01, this.cryoColloidPop + dPop);
                } else {
                    this.cryoColloidPop = Math.max(0, this.cryoColloidPop - this.cryoColloidPop * 0.5 * tickRate);
                }
            }

            // Methanotrophic cycle consumes H2, vents CH4, boosted by Cryo Colloids and Thinking Oceans
            if (this.cryoColloidPop > 0 || this.thinkingOceanPop > 0) {
                const boost = this.cryoColloidPop * 0.05 + this.thinkingOceanPop * 0.04;
                ch4Prod = this.methaneProtoPop * 0.05 + this.cryoOrganismsPop * 0.02 + this.cryoPolymerNetworkPop * 0.01 + boost;
                h2Cons = this.methaneProtoPop * 0.05 + this.cryoOrganismsPop * 0.02 + this.cryoPolymerNetworkPop * 0.01 + boost;
            } else {
                ch4Prod = this.methaneProtoPop * 0.05 + this.cryoOrganismsPop * 0.02 + this.cryoPolymerNetworkPop * 0.01;
                h2Cons = this.methaneProtoPop * 0.05 + this.cryoOrganismsPop * 0.02 + this.cryoPolymerNetworkPop * 0.01;
            }
        }

        // Return calculated biological feedback impacts
        const biologicalImpact = {
            o2Prod,
            co2Cons,
            n2Prod,
            ch4Prod,
            h2Cons
        };

        // Train radiation resistance
        if (planet.radiation > 0.5 && (this.anaerobicPop > 5.0 || this.ammonicProtoPop > 5.0 || this.methaneProtoPop > 5.0)) {
            const adaptationRate = 0.003 * Math.min(3.0, planet.radiation) * tickRate;
            this.radiationResistance = Math.min(0.9, this.radiationResistance + adaptationRate);
        }

        return {
            events,
            biologicalImpact
        };
    }

    /**
     * Helper to compute temperature viability curve
     * Returns a float 0 to 1 based on an asymmetric bell curve
     */
    getTempViability(temp, min, optimal, max) {
        if (temp <= min || temp >= max) return 0;
        if (temp === optimal) return 1.0;

        if (temp < optimal) {
            return (temp - min) / (optimal - min);
        } else {
            return (max - temp) / (max - optimal);
        }
    }
}
