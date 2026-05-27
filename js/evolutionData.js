// Evolution Tree Cladogram Database (DAG Schemas)
// Supports multiple parents for endosymbiosis mergers, clades, pop keys, and requirements.

export const EVOLUTION_GRAPH = {
    water: {
        soup: {
            id: 'soup',
            name: 'Prebiotic Soup',
            clade: 'Prebiotic',
            parents: [],
            popKey: 'organicSoup',
            cap: 100.0,
            unit: 'ppm',
            reqs: { waterCoverage: 10.0, tempRange: [10, 90] },
            details: {
                desc: "Amino acids and organic compounds gather in water basins.",
                scientific: "Known as the prebiotic soup, organic molecules form abiotically from electrical discharge, heat, and raw chemical compounds in liquid water."
            }
        },
        membrane: {
            id: 'membrane',
            name: 'External Membrane',
            clade: 'Prebiotic',
            monitorable: false,
            parents: ['soup'],
            popKey: 'membranePop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { soup: 8.0 } },
            details: {
                desc: "Lipid bilayers assemble spontaneously, isolating prebiotic compounds.",
                scientific: "Amphiphilic lipids form micelles and primitive bilayers (liposomes). This isolates biochemical reactants from external dilution, concentrating metabolic precursors."
            }
        },
        bacteria: {
            id: 'bacteria',
            name: 'Prokaryotes (Bacteria)',
            clade: 'Prokaryota',
            parents: ['membrane'],
            popKey: 'bacteriaPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { soup: 15.0 }, unlocked: ['membrane'] },
            details: {
                desc: "First cellular prokaryotes emerge, establishing metabolism.",
                scientific: "Simple single-celled organisms emerge. Lacking a cellular nucleus or membrane-bound organelles, they utilize basic RNA/DNA transcription and cell division."
            }
        },
        anaerobic: {
            id: 'anaerobic',
            name: 'Anoxygenic Chemotrophs',
            clade: 'Prokaryota',
            parents: ['bacteria'],
            popKey: 'anaerobicPop',
            cap: 150.0,
            unit: 'M/mL',
            reqs: { unlocked: ['bacteria'] },
            details: {
                desc: "Early anaerobes metabolize dissolved environmental sulfur and sulfurous compounds.",
                scientific: "Anaerobic organisms feed on volcanic iron/sulfur compounds or prebiotic organic soup to generate ATP, producing carbon dioxide as a metabolic byproduct."
            }
        },
        anoxygenic_photo: {
            id: 'anoxygenic_photo',
            name: 'Anoxygenic Photosynthesizers',
            clade: 'Prokaryota',
            parents: ['anaerobic'],
            popKey: 'anoxygenicPhotoPop',
            cap: 180.0,
            unit: 'M/mL',
            reqs: { popThreshold: { anaerobic: 20.0 }, solarRadiance: 0.2 },
            details: {
                desc: "Early phototrophs capture starlight using bacteriochlorophyll, without venting oxygen.",
                scientific: "Anoxygenic phototrophs utilize starlight to drive proton pumps. They use electron donors like sulfur or hydrogen rather than water, avoiding oxygen release."
            }
        },
        photosynthetic: {
            id: 'photosynthetic',
            name: 'Cyanobacteria',
            clade: 'Prokaryota',
            parents: ['anoxygenic_photo'],
            popKey: 'photosyntheticPop',
            cap: 200.0,
            unit: 'M/mL',
            reqs: { popThreshold: { anoxygenic_photo: 15.0 }, oecGate: true },
            details: {
                desc: "Cyanobacteria strains mutate, harvesting starlight to split water, venting O₂ gas.",
                scientific: "The evolution of the oxygen-evolving complex in photosystem II enables cyanobacteria to split abundant water molecules for electrons, releasing molecular oxygen as a byproduct."
            }
        },
        nucleus: {
            id: 'nucleus',
            name: 'Cellular Nucleus',
            clade: 'Eukaryota_Precursor',
            monitorable: false,
            parents: ['photosynthetic'],
            popKey: 'nucleusPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { photosynthetic: 15.0 } },
            details: {
                desc: "A protective nuclear envelope wraps around chromosomal strands, organizing genetic code.",
                scientific: "Eukaryogenesis begins as a protective double-membrane envelops the DNA. This compartmentalization optimizes transcription and protects long chromosomal strands."
            }
        },
        mitochondria: {
            id: 'mitochondria',
            name: 'Mitochondria Symbiosis',
            clade: 'Eukaryota_Precursor',
            monitorable: false,
            parents: ['nucleus'],
            popKey: 'mitochondriaPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { unlocked: ['nucleus'], minO2: 1.2 },
            nudge: { id: 'endosymbiosis', name: 'Promote Endosymbiosis', cost: 60 },
            details: {
                desc: "An aerobic bacterium is engulfed by a host nucleus cell, establishing high-energy ATP respiration.",
                scientific: "An ancestral archaeal cell engulfs an aerobic alphaproteobacterium. Rather than digested, it stabilizes as an endosymbiont, performing oxidative phosphorylation."
            }
        },
        eukaryotes: {
            id: 'eukaryotes',
            name: 'Eukaryotic Cells',
            clade: 'Eukaryota',
            parents: ['nucleus', 'mitochondria'], // Merger
            popKey: 'eukaryoticPop',
            cap: 120.0, // Dynamic (upgraded by sexual)
            unit: 'M/mL',
            reqs: { unlocked: ['mitochondria'] },
            details: {
                desc: "High-energy eukaryotic cells radiate, supporting massive genomes.",
                scientific: "Mitochondria release the biological constraints on cellular surface area, providing the energy needed to support complex, membrane-bound eukaryotic organelles."
            }
        },
        sexual: {
            id: 'sexual',
            name: 'Sexual Reproduction',
            clade: 'Eukaryota',
            monitorable: false,
            parents: ['eukaryotes'],
            popKey: 'sexualPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { eukaryotes: 20.0 } },
            details: {
                desc: "DNA recombination is introduced, exponentially accelerating gene diversity.",
                scientific: "Moving from cloning (mitosis) to meiosis allows homologous recombination. Offspring receive unique genetic combinations, accelerating adaptive speed."
            }
        },
        multicellular: {
            id: 'multicellular',
            name: 'Multicellularity',
            clade: 'Eukaryota',
            parents: ['sexual'],
            popKey: 'multicellularPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { unlocked: ['sexual'], popThreshold: { eukaryotes: 45.0 } },
            details: {
                desc: "Individual cells cluster and coordinate, specializing tissues.",
                scientific: "Cell-adhesion structures (like cadherins) and chemical signaling networks enable individual cells to coordinate, dividing labor into structural tissues and germlines."
            }
        },
        algae: {
            id: 'algae',
            name: 'Multicellular Algae',
            clade: 'Flora',
            parents: ['multicellular', 'photosynthetic'], // Merger (Plastid Endosymbiosis)
            popKey: 'algaePop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { multicellular: 15.0 }, solarRadiance: 0.1 },
            details: {
                desc: "Photosynthetic marine eukaryotes diversify into red and green algae beds.",
                scientific: "Following primary endosymbiosis (engulfing of cyanobacteria), multicellular algae emerge. They capture starlight efficiently and establish cellulose structures."
            }
        },
        sponges: {
            id: 'sponges',
            name: 'Marine Sponges',
            clade: 'Metazoa',
            parents: ['algae'],
            popKey: 'spongesPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { algae: 20.0 }, minO2: 10.0 },
            details: {
                desc: "Simple sessile multicellular organisms filter organic soup from ocean water.",
                scientific: "Sponges (Porifera) represent the earliest animal lineage. Lacking true tissues, they utilize flagellated cells to filter nutrients and bacteria."
            }
        },
        meduses: {
            id: 'meduses',
            name: 'Jellyfish & Meduses',
            clade: 'Metazoa',
            parents: ['sponges'],
            popKey: 'medusesPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { sponges: 25.0 }, minO2: 12.0 },
            details: {
                desc: "Free-swimming cnidarians develop stinging cells, introducing early marine predation.",
                scientific: "Cnidarians evolve radial symmetry, nerve nets, and distinct tissue layers, utilizing stinging cells to capture prey in early marine ecosystems."
            }
        },
        worms: {
            id: 'worms',
            name: 'Bilateral Water Worms',
            clade: 'Metazoa',
            parents: ['meduses'],
            popKey: 'wormsPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { meduses: 30.0 }, minO2: 14.0 },
            details: {
                desc: "Burrowing marine worms introduce bilateral symmetry, head-tail polarization, and central nerves.",
                scientific: "Bilateral worms develop cephalization (a defined head with sensory clusters) and triploblastic layers, enabling active, directed locomotion."
            }
        },
        fish: {
            id: 'fish',
            name: 'Early Vertebrate Fish',
            clade: 'Chordata',
            parents: ['worms'],
            popKey: 'fishPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { worms: 30.0 }, minO2: 15.0 },
            details: {
                desc: "Jawless and jawed fish develop spinal columns, internal skeletons, and gills.",
                scientific: "Early chordates evolve a cartilaginous or bony spinal column (notochord), muscular gills, and paired fins, dominating the marine food web."
            }
        },
        cambrian: {
            id: 'cambrian',
            name: 'Cambrian Marine Life',
            clade: 'Metazoa',
            parents: ['worms'],
            popKey: 'cambrianPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { worms: 20.0 }, minO2: 15.0 },
            details: {
                desc: "Massive biological radiation of ocean invertebrates (trilobites, mollusks, early arthropods).",
                scientific: "Driven by rising oxygen and predator-prey dynamics, the Cambrian period triggers a rapid diversification of bilateral body plans and mineralized shells."
            }
        },
        mosses: {
            id: 'mosses',
            name: 'Non-Vascular Mosses',
            clade: 'Flora',
            parents: ['algae'],
            popKey: 'mossesPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { algae: 25.0 }, ozone: 0.5, magnetosphere: true },
            nudge: { id: 'vascular_tissue', name: 'Develop Vascular Tissue', cost: 75 },
            details: {
                desc: "Primitive non-vascular bryophytes carpet wet shores, initiating terrestrial soil creation.",
                scientific: "Mosses adapt to dry land by developing basic waxy cuticles. Lacking xylem/phloem, they stay small and require water films for reproduction."
            }
        },
        ferns: {
            id: 'ferns',
            name: 'Vascular Ferns',
            clade: 'Flora',
            parents: ['mosses'],
            popKey: 'fernsPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { mosses: 30.0 }, minO2: 16.0 },
            details: {
                desc: "Ferns develop vascular networks (xylem/phloem), growing tall and creating early coal forests.",
                scientific: "Vascular tissue networks let ferns transport water and nutrients vertically, using rigid lignin in cell walls to defy gravity."
            }
        },
        conifers: {
            id: 'conifers',
            name: 'Gymnosperms (Conifers)',
            clade: 'Flora',
            parents: ['ferns'],
            popKey: 'conifersPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { ferns: 30.0 } },
            nudge: { id: 'seed_evolution', name: 'Develop Seed Protection', cost: 90 },
            details: {
                desc: "Gymnosperms evolve naked seeds and pollen cones, colonizing dry continental interiors.",
                scientific: "Conifers develop embryo protection in seeds, eliminating the requirement for water films during fertilisation. Wind-blown pollen fertilises female cones."
            }
        },
        angiosperms: {
            id: 'angiosperms',
            name: 'Flowering Plants',
            clade: 'Flora',
            parents: ['conifers'],
            popKey: 'angiospermsPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { conifers: 30.0 }, minO2: 18.0 },
            details: {
                desc: "Angiosperms develop enclosed seeds, flowers, and insect-attracting pigments.",
                scientific: "Flowering plants establish complex mutualistic relationships with insects for pollination, co-evolving fruits and nutrient-dense seeds."
            }
        },
        insects: {
            id: 'insects',
            name: 'Land Insects',
            clade: 'Arthropoda',
            parents: ['cambrian', 'mosses'],
            popKey: 'insectsPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { mosses: 25.0 } },
            details: {
                desc: "Terrestrial arthropods adapt to dry air, developing protective chitin skeletons.",
                scientific: "Early insects migrate to land, utilizing tracheal tubes to breathe gaseous oxygen and a chitinous exoskeleton to prevent desiccation."
            }
        },
        tetrapods: {
            id: 'tetrapods',
            name: 'Tetrapods (Amphibia)',
            clade: 'Tetrapoda',
            parents: ['fish', 'mosses'],
            popKey: 'tetrapodPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { fish: 30.0, mosses: 30.0 } },
            nudge: { id: 'amniotic_egg', name: 'Synthesize Amniotic Egg', cost: 90 },
            details: {
                desc: "Lobe-finned descendants pull themselves onto muddy banks, breathing with primitive lungs.",
                scientific: "Tetrapods adapt sarcopterygian limbs into structural digits, using skeletal girdles to support body mass against terrestrial gravity."
            }
        },
        sauropsids: {
            id: 'sauropsids',
            name: 'Sauropsida (Dinosaurs)',
            clade: 'Diapsida',
            parents: ['tetrapods'],
            popKey: 'sauropsidPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { tetrapods: 30.0 }, minTemp: 28.0 },
            nudge: { id: 'scales', name: 'Nudge Scale Shielding', cost: 90 },
            details: {
                desc: "Scaly-skinned dinosaurs dominate warm dry continents, laying protective eggs.",
                scientific: "Sauropsids develop watertight keratin scales and amniotic membranes, decoupling vertebrate reproduction completely from external liquid basins."
            }
        },
        synapsids: {
            id: 'synapsids',
            name: 'Synapsida (Mammals)',
            clade: 'Synapsida',
            parents: ['tetrapods'],
            popKey: 'synapsidPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { tetrapods: 30.0 }, minO2: 20.0 },
            nudge: { id: 'endthermy', name: 'Nudge Endothermy (Hair)', cost: 110 },
            details: {
                desc: "Endothermic proto-mammals adapt to colder climates, developing fur insulation.",
                scientific: "Synapsids develop specialised heterodont teeth and warm-blooded homeostasis (endothermy), allowing high metabolic activity in extreme climates."
            }
        },
        cognitive: {
            id: 'cognitive',
            name: 'Cognitive Species',
            clade: 'Intelligence',
            monitorable: false,
            parents: ['synapsids'], // Can also accept sauropsids if nudged
            popKey: 'cognitiveSpeciesPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { synapsidOrSauropsidThreshold: 45.0, minO2: 19.0 },
            nudge: { id: 'cognitive', name: 'Nudge Neural Networking', cost: 110 },
            details: {
                desc: "Intelligent species develop brain mass, complex vocal tools, and abstract thoughts.",
                scientific: "Cephalisation leads to an expanded neocortex, enabling symbolic communication, complex tool fabrication, and cultural transmission of knowledge."
            }
        },
        cyborg: {
            id: 'cyborg',
            name: 'Cyborg Hybrids',
            clade: 'Technological',
            monitorable: false,
            parents: ['cognitive'],
            popKey: 'cyborgPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { cognitive: 40.0 }, minO2: 18.0 },
            nudge: { id: 'cybernetic_implants', name: 'Promote Cybernetic Implants', cost: 130 },
            details: {
                desc: "Sentient organic life integrates microelectronic implants and neural links.",
                scientific: "Direct neural interfaces bridge biological synapses with digital architectures, merging cognitive thought streams with technological databases."
            }
        },
        ai: {
            id: 'ai',
            name: 'Post-Biological AI',
            clade: 'Technological',
            monitorable: false,
            parents: ['cognitive'],
            popKey: 'aiPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { cognitive: 35.0 }, magnetosphere: true },
            nudge: { id: 'technological_singularity', name: 'Buy Singularity core', cost: 110 },
            details: {
                desc: "Autonomous silicon matrices decouple computation from organic limitations.",
                scientific: "Artificial General Intelligence triggers a self-improving recursion loop, building planetary computing stacks that bypass metabolic cellular constraints."
            }
        },
        noosphere: {
            id: 'noosphere',
            name: 'Planetary Noosphere',
            clade: 'Technological',
            monitorable: false,
            parents: ['ai', 'cyborg'], // Merger
            popKey: 'noospherePop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { aiOrCyborgThreshold: 45.0, magnetosphere: true },
            nudge: { id: 'global_consciousness', name: 'Sync Planetary Cloud', cost: 150 },
            details: {
                desc: "Global communication mesh networks connect all minds into a unified planetary consciousness.",
                scientific: "A planetary-scale cloud consciousness integrates digital AI stacks and cybernetic biological nodes, forming a global intellectual envelope."
            }
        },
        gaia_hivemind: {
            id: 'gaia_hivemind',
            name: 'Gaia Biosphere Hivemind',
            clade: 'Technological',
            monitorable: false,
            parents: ['cyborg', 'mosses'], // Merger of tech and flora
            popKey: 'gaiaHivemindPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { cyborgOrMossesThreshold: true, minO2: 20.0 },
            nudge: { id: 'ecological_integration', name: 'Weave Mycelium Synapses', cost: 150 },
            details: {
                desc: "Fungal mycelial grids and plant roots connect all living biomass into a planetary hivemind.",
                scientific: "Global ecological synapses weave terrestrial flora and artificial nodes. Biological chemical signals integrate with the digital cloud, optimizing core planetary systems."
            }
        }
    },
    ammonia: {
        ammonic_soup: {
            id: 'ammonic_soup',
            name: 'Ammonic Soup',
            clade: 'Prebiotic',
            parents: [],
            popKey: 'ammonicSoup',
            cap: 100.0,
            unit: 'ppm',
            reqs: { ammoniaCoverage: 10.0, tempRange: [-80, -30] },
            details: {
                desc: "Nitrogenous compounds pool in cold liquid ammonia oceans.",
                scientific: "Prebiotic pathways synthesize nitrogen-based molecules like imidazoles in liquid ammonia, establishing cryo-organic compounds."
            }
        },
        ammonic_proto: {
            id: 'ammonic_proto',
            name: 'Ammonic Prokaryotes',
            clade: 'Prokaryota',
            parents: ['ammonic_soup'],
            popKey: 'ammonicProtoPop',
            cap: 120.0,
            unit: 'M/mL',
            reqs: { popThreshold: { ammonic_soup: 10.0 } },
            details: {
                desc: "Single-celled entities with cold-active enzymes adapt to cryogenic ammonia.",
                scientific: "Early cells develop fluid membranes utilizing amide linkages, stabilizing intracellular metabolic pathways down to -50°C."
            }
        },
        ammonic_multi: {
            id: 'ammonic_multi',
            name: 'Ammonic Multicells',
            clade: 'Eukaryota',
            parents: ['ammonic_proto'],
            popKey: 'ammonicMultiPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { ammonic_proto: 35.0 } },
            details: {
                desc: "Ammonic cells cluster, specializing structures into cold-active tissues.",
                scientific: "Low-temperature cellular signaling networks allow coordinated cellular groups to specialized tissues, forming early multicellular mats."
            }
        },
        silico_flora: {
            id: 'silico_flora',
            name: 'Silico-Flora',
            clade: 'Flora',
            parents: ['ammonic_multi'],
            popKey: 'silicoFloraPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { maxTemp: -45.0 },
            nudge: { id: 'silicon_chains', name: 'Promote Silicon Chains', cost: 90 },
            details: {
                desc: "Starlight-harvesting plants develop silicon skeletons, venting nitrogen gas.",
                scientific: "Silico-flora utilize silicon-based backbones stable in liquid ammonia, performing nitrogenous photosynthesis and venting molecular nitrogen (N₂)."
            }
        },
        cryo_fauna: {
            id: 'cryo_fauna',
            name: 'Ammonic Megafauna',
            clade: 'Fauna',
            parents: ['silico_flora'],
            popKey: 'cryoFaunaPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { silico_flora: 30.0 } },
            details: {
                desc: "Mobile ammonic consumers graze on shore-line silico-flora beds.",
                scientific: "Faunal equivalents utilize nitrogen respiration, consuming plant silicates and organic compounds to drive mobile multicellular activities."
            }
        },
        crystalline_cognitive: {
            id: 'crystalline_cognitive',
            name: 'Crystalline Cognitive Swarms',
            clade: 'Intelligence',
            monitorable: false,
            parents: ['cryo_fauna'],
            popKey: 'crystallineCognitivePop',
            cap: 80.0,
            unit: 'Idx',
            reqs: { popThreshold: { cryo_fauna: 35.0 }, maxTemp: -40.0 },
            nudge: { id: 'crystalline_collective', name: 'Ignite Crystalline Collective', cost: 110 },
            details: {
                desc: "Silicon crystal structures establish collective, cryo-conductive thoughts.",
                scientific: "Harnessing low-temperature superconductive dynamics, crystalline networks communicate via electromagnetic fields, initiating swarm intelligence."
            }
        },
        quantum_lattices: {
            id: 'quantum_lattices',
            name: 'Quantum Lattices',
            clade: 'Technological',
            monitorable: false,
            parents: ['crystalline_cognitive'],
            popKey: 'quantumLatticePop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { crystalline_cognitive: 40.0 }, maxTemp: -50.0 },
            nudge: { id: 'quantum_alignment', name: 'Align Quantum Crystals', cost: 130 },
            details: {
                desc: "Superconducting lattices align, performing high-speed quantum calculations.",
                scientific: "Aligned crystal nodes achieve phase coherence, stabilizing qubits in cryogenic conditions to execute planetary quantum computations."
            }
        },
        cryo_hivemind: {
            id: 'cryo_hivemind',
            name: 'Cryo-Biosphere Hivemind',
            clade: 'Technological',
            monitorable: false,
            parents: ['crystalline_cognitive', 'silico_flora'], // Merger
            popKey: 'cryoHivemindPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { crystalline_cognitive: 40.0, silico_flora: 45.0 } },
            nudge: { id: 'cryo_neural_webs', name: 'Glacier Neural Synapses', cost: 130 },
            details: {
                desc: "Glacial neural webs integrate all living crystal nodes and cryo-biomass.",
                scientific: "Superconducting networks weave through subsurface glacier grids, integrating all local biological nodes into a global cyber-cryosphere."
            }
        }
    },
    methane: {
        methane_soup: {
            id: 'methane_soup',
            name: 'Hydrocarbon Soup',
            clade: 'Prebiotic',
            parents: [],
            popKey: 'methaneSoup',
            cap: 100.0,
            unit: 'ppm',
            reqs: { methaneCoverage: 10.0, tempRange: [-183, -140] },
            details: {
                desc: "Aerosols and volatile hydrocarbons gather in cold methane seas.",
                scientific: "Ultraviolet starlight photolyses atmospheric gases, depositing dense organic tholins and hydrocarbon precursors into liquid basins."
            }
        },
        methane_proto: {
            id: 'methane_proto',
            name: 'Cryo-Methanogens',
            clade: 'Prokaryota',
            parents: ['methane_soup'],
            popKey: 'methaneProtoPop',
            cap: 100.0,
            unit: 'M/mL',
            reqs: { popThreshold: { methane_soup: 10.0 } },
            details: {
                desc: "Prokaryotes metabolize environmental acetylene and hydrogen gas, venting methane.",
                scientific: "Lipidless cell membranes (azotosomes) maintain integrity at -180°C. They perform methanogenesis, consuming hydrogen and venting methane gas."
            }
        },
        methane_multi: {
            id: 'methane_multi',
            name: 'Cryo-Multicells',
            clade: 'Eukaryota',
            parents: ['methane_proto'],
            popKey: 'methaneMultiPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { methane_proto: 30.0 } },
            details: {
                desc: "Azotosome-based cell networks specialize into early cryo-tissues.",
                scientific: "Colloidal biological grids coordinate physical actions, specializing cells to adapt to apolar cryogenic hydrocarbon currents."
            }
        },
        cryo_organisms: {
            id: 'cryo_organisms',
            name: 'Cyto-Beasts',
            clade: 'Fauna',
            parents: ['methane_multi'],
            popKey: 'cryoOrganismsPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { methane_multi: 30.0 } },
            details: {
                desc: "Complex multicellular organisms swim through apolar methane tides.",
                scientific: "Cyto-beasts develop flexible outer vesicles stable in apolar liquids, consuming organic particulates and local methanogenic biomass."
            }
        },
        cryo_polymer_network: {
            id: 'cryo_polymer_network',
            name: 'Cryo-Polymer Networks',
            clade: 'Flora',
            parents: ['cryo_organisms'],
            popKey: 'cryoPolymerNetworkPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { cryo_organisms: 30.0 } },
            nudge: { id: 'cryo_polymer_network', name: 'Synthesize Cryo-Polymers', cost: 90 },
            details: {
                desc: "Superconducting polymers construct expansive network lattices over shores.",
                scientific: "Polymer-based webs capture low-energy radiation, establishing structural grids that bind cryo-organic compounds."
            }
        },
        thinking_ocean: {
            id: 'thinking_ocean',
            name: 'Thinking Methane Oceans',
            clade: 'Intelligence',
            monitorable: false,
            parents: ['cryo_polymer_network'],
            popKey: 'thinkingOceanPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { cryo_polymer_network: 40.0 }, methaneCoverage: 40.0 },
            nudge: { id: 'colloidal_solids', name: 'Dissolve Computing Polymers', cost: 130 },
            details: {
                desc: "Hydrocarbon basins align into computational networks, calculating planetary changes.",
                scientific: "Dissolved polymers and colloidal matrices organize into liquid-based circuits, utilizing ocean convection currents to process cognitive computations."
            }
        },
        cryo_colloid: {
            id: 'cryo_colloid',
            name: 'Megastructure Cryo-Colloids',
            clade: 'Technological',
            monitorable: false,
            parents: ['cryo_polymer_network', 'cryo_organisms'], // Merger
            popKey: 'cryoColloidPop',
            cap: 100.0,
            unit: 'Idx',
            reqs: { popThreshold: { cryo_polymer_network: 40.0, cryo_organisms: 45.0 } },
            nudge: { id: 'macromolecular_assembly', name: 'Assemble Colloidal structures', cost: 130 },
            details: {
                desc: "Macromolecular structures assemble, forming superconducting cryo-collectives.",
                scientific: "Colloidal matrices assemble into large crystalline structures, achieving high electrical conductivity at Titan-like temperatures."
            }
        }
    }
};

// ---------------------------------------------------------------------------
// Scientific Evolutionary and Thermodynamic Constraints per Species
// ---------------------------------------------------------------------------
const EVOL_PARAMS = {
    // --- Water Line (Standard Biochemistry) ---
    soup: { evolvability: 1.0, thermalCap: 90.0, minThermalCap: 0.0, radiationToleranceCap: 0.90, radDivisor: 6.0 },
    membrane: { evolvability: 1.0, thermalCap: 90.0, minThermalCap: 0.0, radiationToleranceCap: 0.90, radDivisor: 6.0 },
    bacteria: { evolvability: 1.0, thermalCap: 90.0, minThermalCap: 0.0, radiationToleranceCap: 0.90, radDivisor: 6.0 },
    anaerobic: { evolvability: 1.0, thermalCap: 90.0, minThermalCap: 0.0, radiationToleranceCap: 0.90, radDivisor: 6.0 },
    anoxygenic_photo: { evolvability: 1.0, thermalCap: 90.0, minThermalCap: 0.0, radiationToleranceCap: 0.90, radDivisor: 6.0 },
    photosynthetic: { evolvability: 1.0, thermalCap: 90.0, minThermalCap: 0.0, radiationToleranceCap: 0.90, radDivisor: 6.0 },
    nucleus: { evolvability: 0.4, thermalCap: 60.0, minThermalCap: 0.0, radiationToleranceCap: 0.60, radDivisor: 4.0 },
    mitochondria: { evolvability: 0.4, thermalCap: 60.0, minThermalCap: 0.0, radiationToleranceCap: 0.60, radDivisor: 4.0 },
    eukaryotes: { evolvability: 0.4, thermalCap: 60.0, minThermalCap: 0.0, radiationToleranceCap: 0.60, radDivisor: 4.0 },
    sexual: { evolvability: 0.4, thermalCap: 60.0, minThermalCap: 0.0, radiationToleranceCap: 0.60, radDivisor: 4.0 },
    multicellular: { evolvability: 0.15, thermalCap: 55.0, minThermalCap: 0.0, radiationToleranceCap: 0.50, radDivisor: 3.5 },
    algae: { evolvability: 0.15, thermalCap: 55.0, minThermalCap: 0.0, radiationToleranceCap: 0.85, radDivisor: 4.0 },
    sponges: { evolvability: 0.05, thermalCap: 48.0, minThermalCap: 0.0, radiationToleranceCap: 0.40, radDivisor: 3.0 },
    meduses: { evolvability: 0.05, thermalCap: 48.0, minThermalCap: 0.0, radiationToleranceCap: 0.40, radDivisor: 2.8 },
    worms: { evolvability: 0.05, thermalCap: 48.0, minThermalCap: 0.0, radiationToleranceCap: 0.40, radDivisor: 2.8 },
    fish: { evolvability: 0.02, thermalCap: 45.0, minThermalCap: 0.0, radiationToleranceCap: 0.30, radDivisor: 2.5 },
    cambrian: { evolvability: 0.05, thermalCap: 48.0, minThermalCap: 0.0, radiationToleranceCap: 0.40, radDivisor: 2.8 },
    mosses: { evolvability: 0.05, thermalCap: 50.0, minThermalCap: 0.0, radiationToleranceCap: 0.50, radDivisor: 3.0 },
    ferns: { evolvability: 0.05, thermalCap: 50.0, minThermalCap: 0.0, radiationToleranceCap: 0.50, radDivisor: 3.0 },
    conifers: { evolvability: 0.02, thermalCap: 50.0, minThermalCap: -15.0, radiationToleranceCap: 0.40, radDivisor: 2.5 },
    angiosperms: { evolvability: 0.02, thermalCap: 50.0, minThermalCap: 0.0, radiationToleranceCap: 0.40, radDivisor: 2.5 },
    insects: { evolvability: 0.05, thermalCap: 48.0, minThermalCap: 0.0, radiationToleranceCap: 0.50, radDivisor: 3.0 },
    tetrapods: { evolvability: 0.02, thermalCap: 45.0, minThermalCap: 0.0, radiationToleranceCap: 0.30, radDivisor: 2.5 },
    sauropsids: { evolvability: 0.01, thermalCap: 45.0, minThermalCap: 0.0, radiationToleranceCap: 0.25, radDivisor: 2.0 },
    synapsids: { evolvability: 0.01, thermalCap: 45.0, minThermalCap: -5.0, radiationToleranceCap: 0.25, radDivisor: 2.0 },
    cognitive: { evolvability: 0.005, thermalCap: 45.0, minThermalCap: 0.0, radiationToleranceCap: 0.25, radDivisor: 2.0 },
    cyborg: { evolvability: 0.5, thermalCap: 80.0, minThermalCap: 0.0, radiationToleranceCap: 0.95, radDivisor: 5.0 },
    ai: { evolvability: 0.5, thermalCap: 80.0, minThermalCap: 0.0, radiationToleranceCap: 0.95, radDivisor: 5.0 },
    noosphere: { evolvability: 0.5, thermalCap: 80.0, minThermalCap: 0.0, radiationToleranceCap: 0.95, radDivisor: 5.0 },
    gaia_hivemind: { evolvability: 0.5, thermalCap: 80.0, minThermalCap: 0.0, radiationToleranceCap: 0.95, radDivisor: 5.0 },

    // --- Ammonia Line (Cryogenic Worlds) ---
    ammonic_soup: { evolvability: 1.0, thermalCap: -10.0, minThermalCap: -90.0, radiationToleranceCap: 0.90, radDivisor: 6.0 },
    ammonic_proto: { evolvability: 1.0, thermalCap: -10.0, minThermalCap: -90.0, radiationToleranceCap: 0.90, radDivisor: 6.0 },
    ammonic_multi: { evolvability: 0.15, thermalCap: -25.0, minThermalCap: -90.0, radiationToleranceCap: 0.50, radDivisor: 3.5 },
    silico_flora: { evolvability: 0.05, thermalCap: -20.0, minThermalCap: -90.0, radiationToleranceCap: 0.50, radDivisor: 3.0 },
    cryo_fauna: { evolvability: 0.02, thermalCap: -25.0, minThermalCap: -90.0, radiationToleranceCap: 0.30, radDivisor: 2.5 },
    crystalline_cognitive: { evolvability: 0.005, thermalCap: -25.0, minThermalCap: -90.0, radiationToleranceCap: 0.25, radDivisor: 2.0 },
    quantum_lattices: { evolvability: 0.5, thermalCap: -15.0, minThermalCap: -90.0, radiationToleranceCap: 0.95, radDivisor: 5.0 },
    cryo_hivemind: { evolvability: 0.5, thermalCap: -15.0, minThermalCap: -90.0, radiationToleranceCap: 0.95, radDivisor: 5.0 },

    // --- Methane Line (Titan-like Worlds) ---
    methane_soup: { evolvability: 1.0, thermalCap: -130.0, minThermalCap: -190.0, radiationToleranceCap: 0.90, radDivisor: 6.0 },
    methane_proto: { evolvability: 1.0, thermalCap: -130.0, minThermalCap: -190.0, radiationToleranceCap: 0.90, radDivisor: 6.0 },
    methane_multi: { evolvability: 0.15, thermalCap: -140.0, minThermalCap: -190.0, radiationToleranceCap: 0.50, radDivisor: 3.5 },
    cryo_organisms: { evolvability: 0.02, thermalCap: -140.0, minThermalCap: -190.0, radiationToleranceCap: 0.30, radDivisor: 2.5 },
    cryo_polymer_network: { evolvability: 0.05, thermalCap: -135.0, minThermalCap: -190.0, radiationToleranceCap: 0.50, radDivisor: 3.0 },
    thinking_ocean: { evolvability: 0.5, thermalCap: -120.0, minThermalCap: -190.0, radiationToleranceCap: 0.95, radDivisor: 5.0 },
    cryo_colloid: { evolvability: 0.5, thermalCap: -120.0, minThermalCap: -190.0, radiationToleranceCap: 0.95, radDivisor: 5.0 }
};

// Enrich EVOLUTION_GRAPH nodes dynamically
for (const [solvent, nodes] of Object.entries(EVOLUTION_GRAPH)) {
    for (const [id, node] of Object.entries(nodes)) {
        const params = EVOL_PARAMS[id] || { evolvability: 0.1, thermalCap: 50.0, minThermalCap: 0.0, radiationToleranceCap: 0.50, radDivisor: 4.0 };
        node.evolvability = params.evolvability;
        node.thermalCap = params.thermalCap;
        node.minThermalCap = params.minThermalCap;
        node.radiationToleranceCap = params.radiationToleranceCap;
        node.radDivisor = params.radDivisor;
    }
}

export const TRANSITION_TO_NODE_ID = {
    // Water line
    soup: 'soup',
    membrane: 'membrane',
    anaerobic: 'anaerobic',
    anoxygenic_photo: 'anoxygenic_photo',
    photosynthesis: 'photosynthetic',
    nucleus: 'nucleus',
    endosymbiosis: 'mitochondria',
    sexual_reproduction: 'sexual',
    multicellular: 'multicellular',
    sponges: 'sponges',
    meduses: 'meduses',
    worms: 'worms',
    fish: 'fish',
    cambrian: 'cambrian',
    vascular_tissue: 'mosses',
    ferns: 'ferns',
    seed_evolution: 'conifers',
    angiosperms: 'angiosperms',
    arthropods: 'insects',
    amniotic_egg: 'tetrapods',
    tetrapods: 'tetrapods',
    scales: 'sauropsids',
    endthermy: 'synapsids',
    cognitive: 'cognitive',
    technological_singularity: 'ai',
    cybernetic_implants: 'cyborg',
    global_consciousness: 'noosphere',
    ecological_integration: 'gaia_hivemind',

    // Ammonia line
    ammonic_soup: 'ammonic_soup',
    ammonic_proto: 'ammonic_proto',
    ammonic_multi: 'ammonic_multi',
    silicon_chains: 'silico_flora',
    cryo_fauna: 'cryo_fauna',
    crystalline_collective: 'crystalline_cognitive',
    quantum_alignment: 'quantum_lattices',
    cryo_neural_webs: 'cryo_hivemind',

    // Methane line
    methane_soup: 'methane_soup',
    methane_proto: 'methane_proto',
    methane_multi: 'methane_multi',
    cryo_polymers: 'cryo_organisms',
    cryo_polymer_network: 'cryo_polymer_network',
    colloidal_solids: 'thinking_ocean',
    macromolecular_assembly: 'cryo_colloid'
};

export function getNodeIdForTransition(transitionKey) {
    return TRANSITION_TO_NODE_ID[transitionKey] || transitionKey;
}

export function getEvolutionNode(nodeId, preferredSolvent = null) {
    if (preferredSolvent && EVOLUTION_GRAPH[preferredSolvent]?.[nodeId]) {
        return EVOLUTION_GRAPH[preferredSolvent][nodeId];
    }

    for (const nodes of Object.values(EVOLUTION_GRAPH)) {
        if (nodes[nodeId]) {
            return nodes[nodeId];
        }
    }

    return null;
}

export function getEvolutionNudge(nodeId, preferredSolvent = null) {
    const node = getEvolutionNode(nodeId, preferredSolvent);
    if (!node?.nudge) {
        return null;
    }

    return {
        ...node.nudge,
        nodeId: node.id,
        nodeName: node.name
    };
}

export function getEvolutionNodes(solvent = null) {
    if (solvent) {
        return Object.values(EVOLUTION_GRAPH[solvent] || {});
    }

    return Object.values(EVOLUTION_GRAPH).flatMap(nodes => Object.values(nodes));
}

export function getNodeBiomass(biology, node) {
    if (!biology || !node) return 0.0;
    if (biology.biomassMap && typeof biology.biomassMap[node.id] === 'number') {
        return biology.biomassMap[node.id];
    }
    return typeof biology[node.popKey] === 'number' ? biology[node.popKey] : 0.0;
}

export function isNodeUnlocked(biology, node) {
    if (!biology || !node) return false;
    if (biology.unlockedMap && typeof biology.unlockedMap[node.id] === 'boolean') {
        return biology.unlockedMap[node.id];
    }
    return getNodeBiomass(biology, node) > 0.0;
}

export function getUnlockedEvolutionNodes(biology, solvent = null, options = {}) {
    const { requireBiomass = false } = options;
    return getEvolutionNodes(solvent).filter(node => {
        if (!isNodeUnlocked(biology, node)) return false;
        return !requireBiomass || getNodeBiomass(biology, node) > 0.0;
    });
}

export function sumEvolutionBiomass(biology, solvent, predicate) {
    return getEvolutionNodes(solvent).reduce((sum, node) => {
        if (!predicate(node)) return sum;
        return sum + getNodeBiomass(biology, node);
    }, 0.0);
}
