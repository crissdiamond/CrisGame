# TODO

## Prioritised TODO Backlog

### P0 — Fix before adding more features

#### 1. Confirm and standardise project folder structure
- Status: Completed 2026-05-26. Canonical layout is documented in `README.md`; `scripts/validate_structure.mjs` checks local `index.html` CSS/JS references and relative JS module imports.
- Ensure `index.html` references match the actual repository layout.
- Recommended structure:
  - `index.html`
  - `server.py`
  - `css/style.css`
  - `js/game.js`
  - `js/planet.js`
  - `js/simulation.js`
  - `js/events.js`
  - `js/evolutionData.js`
  - `js/ui.js`
  - `js/visualization.js`
  - `js/history.js`
  - `js/historyView.js`
- Acceptance criteria:
  - Running `python server.py` serves the app without 404 errors for CSS or JS files.
  - Browser console is clean on first load.
  - All module imports resolve correctly.

#### 2. Make `evolutionData.js` the single source of truth for evolution metadata
- Status: Completed 2026-05-26. `game.js` now resolves nudges through `getEvolutionNudge`; transition-to-node mapping lives in `evolutionData.js`; stale methane UI/visualizer aliases were replaced with canonical graph IDs.
- Remove duplicated nudge, node, branch, and cost definitions from controller/UI logic where possible.
- Derive evolution node names, nudge IDs, parent relationships, costs, monitorability, and descriptions from `EVOLUTION_GRAPH`.
- Acceptance criteria:
  - Adding or changing an evolution node only requires updating `evolutionData.js`, unless new behaviour is genuinely required.
  - No second hard-coded nudge map exists in `game.js`.
  - UI labels and simulation IDs are generated consistently from the graph.

#### 3. Add graph integrity validation
- Create a lightweight development validation script for `EVOLUTION_GRAPH`.
- Check that:
  - every parent ID exists;
  - every node has a valid `id`, `name`, `clade`, `parents`, `popKey`, `cap`, `unit`, `reqs`, and `details`;
  - every `popKey` maps correctly to a biology property or biomass map key;
  - all nudge IDs referenced by nodes are valid and unique;
  - there are no accidental cycles in the DAG.
- Acceptance criteria:
  - A single command can validate the evolution graph.
  - Invalid graph changes fail loudly during development.

#### 4. Fix naming inconsistencies across graph, UI, controller, and simulation
- Review aliases such as `cryo_beasts` vs `cryo_organisms`, `ai` vs `technologicalAI`, `insects` vs `arthropod`, and any other graph/UI naming drift.
- Introduce a deliberate alias/display-name layer if needed.
- Acceptance criteria:
  - Internal IDs are stable and machine-oriented.
  - Display labels are separate and user-friendly.
  - Save/load uses stable internal IDs only.

---

### P1 — Stabilise the core game loop

#### 5. Add basic runtime smoke tests
- Add a simple test or script that loads core modules and instantiates:
  - `Planet`;
  - `BiologySimulation`;
  - `EventSystem`;
  - `HistoryRecorder`.
- Acceptance criteria:
  - The smoke test confirms core modules can be imported without browser DOM dependencies.
  - The simulation can advance for a small number of ticks without throwing errors.

#### 6. Add save/load migration and validation
- Save structured state, not raw or fragile UI representations where avoidable.
- Add a `saveVersion` field.
- Validate loaded state before applying it.
- Add migration shims for saves created before the DAG refactor.
- Acceptance criteria:
  - Old saves do not crash the app.
  - Invalid saves show a clear warning.
  - Save/load restores planet, biology, event, token, history, and timeline state consistently.

#### 7. Replace saved `scienceLogHTML` with structured log entries
- Store log entries as structured data:
  - timestamp / simulation age;
  - title;
  - message;
  - type;
  - optional scientific detail.
- Render logs from data on load.
- Acceptance criteria:
  - Save files no longer depend on current HTML structure.
  - Log styling can change without breaking old saves.

#### 8. Add deterministic debug mode
- Add an optional seeded random number generator for development.
- Use it for event rolls, biological transition rolls, hotspot generation, and other random simulation behaviours.
- Acceptance criteria:
  - A given seed produces repeatable simulation outcomes.
  - Debugging rare milestone or disaster bugs becomes practical.

---

### P2 — Refactor for maintainability

#### 9. Split `GameUI` into focused view modules
- Break the current UI layer into smaller modules, for example:
  - `setupView.js`
  - `dashboardView.js`
  - `evolutionTreeView.js`
  - `interventionsView.js`
  - `toastView.js`
  - `logView.js`
- Acceptance criteria:
  - Each view module owns a clear section of DOM.
  - `GameUI` becomes an orchestrator/facade rather than a very large class.

#### 10. Split `simulation.js` by biological domain
- Separate water, ammonia, and methane evolution logic.
- Extract shared mechanics such as growth curves, hazard rolls, transition gates, biomass decay, and biodiversity calculations.
- Acceptance criteria:
  - Adding a new solvent line does not require editing one very large simulation file.
  - Shared transition mechanics are tested once and reused.

#### 11. Split `events.js` into event registry and event engine
- Move event definitions into data/registry files.
- Keep warning lifecycle, deflection logic, and application mechanics in a smaller event engine.
- Acceptance criteria:
  - Adding a new hazard or intervention does not require editing core event lifecycle code.
  - Event definitions are easier to scan and balance.

#### 12. Reduce inline styles in `index.html`
- Move token container and repeated visual styles into `style.css`.
- Keep HTML focused on structure.
- Acceptance criteria:
  - Header token styling is CSS-driven.
  - Theme changes do not require editing HTML.

---

### P3 — Improve player experience

#### 13. Add a first-run onboarding flow
- Add a short guided introduction explaining:
  - the player objective;
  - climate and solvent basics;
  - tokens;
  - interventions;
  - threats;
  - evolution milestones.
- Acceptance criteria:
  - A new player understands what to do in the first 2 minutes.
  - Onboarding can be skipped and replayed.

#### 14. Make active objectives visible and measurable
- Implement one or more clear success targets, for example:
  - reach stable multicellular life;
  - sustain complex life for a fixed time;
  - reach sentient life;
  - maximise biodiversity before stellar decline.
- Acceptance criteria:
  - The dashboard always shows the active objective.
  - The player can see progress and failure/recovery conditions.

#### 15. Improve failure, extinction, and recovery clarity
- Make population crashes, extinction pressure, and recovery phases more obvious.
- Add severity labels and recovery progress indicators.
- Acceptance criteria:
  - A player can tell why a biosphere collapsed.
  - The game suggests possible recovery levers without solving the game for the player.

#### 16. Add developer/debug controls
- Add an optional debug panel for local development:
  - add tokens;
  - force event;
  - unlock node;
  - advance time;
  - print current planet/biology state;
  - reset history.
- Acceptance criteria:
  - Debug tools are hidden from normal players.
  - Testing rare branches does not require waiting through long simulations.

---

### P4 — Expand content after stabilisation

#### 17. Complete the interactive SVG cladogram visualiser
- Implement pan/drag navigation.
- Add curved parent-child lines and merger nodes.
- Add hover/click detail popups.
- Show locked, unlocked, boosted, extinct, and thriving node states.
- Acceptance criteria:
  - The tree is readable across water, ammonia, and methane lines.
  - The visualiser uses graph data rather than duplicate hard-coded layout rules where practical.

#### 18. Add scenario presets and challenge modes
- Expand starting presets such as:
  - Frozen Ocean World;
  - Dry Super-Earth;
  - High Radiation Young Star;
  - Volcanic Proto-Planet;
  - Methane Cryoworld;
  - Ammonia Twilight World.
- Acceptance criteria:
  - Each preset creates a meaningfully different strategy.
  - Presets are data-driven and easy to add.

#### 19. Balance token economy and intervention costs
- Review Blue, Silver, and Gold token accrual and conversion rates.
- Balance disaster deflection, genetic upgrades, and environmental interventions.
- Acceptance criteria:
  - Tokens create meaningful tradeoffs.
  - No token tier becomes irrelevant or trivially abundant.

#### 20. Add scientific glossary and explainability layer
- Add a compact glossary for terms such as:
  - eukaryogenesis;
  - endosymbiosis;
  - photolysis;
  - geodynamo;
  - silicate weathering;
  - Michaelis-Menten kinetics;
  - methanogenesis;
  - azotosome.
- Acceptance criteria:
  - Scientific explanations are accessible without overwhelming gameplay.
  - Players can inspect why a mechanic exists.

---

### P5 — Packaging and release readiness

#### 21. Add repository documentation
- Add or update:
  - `README.md`;
  - run instructions;
  - project structure;
  - gameplay overview;
  - development notes;
  - known limitations.
- Acceptance criteria:
  - A new developer can run the project locally in under 5 minutes.

#### 22. Add lightweight linting/formatting
- Add a formatter and linter suitable for vanilla JavaScript.
- Keep configuration minimal.
- Acceptance criteria:
  - Formatting is consistent.
  - Common JavaScript mistakes are caught early.

#### 23. Add browser compatibility notes
- Define supported browsers.
- Test at least Chrome/Edge and Firefox.
- Acceptance criteria:
  - Known browser limitations are documented.
  - Canvas, modules, local storage, and CSS features work in supported browsers.

#### 24. Prepare a playable release build
- Create a clean release folder or deployment process.
- Remove debug-only console noise.
- Confirm local storage, save/load, and assets work from the release location.
- Acceptance criteria:
  - The project can be shared as a playable static web app.
  - The release has no broken paths or missing assets.

---

## Roadmap Ideas

### 1. Add Clear Player Objectives
- Define one or more success targets, such as sustaining multicellular life for a fixed period or reaching a biodiversity score.
- Add visible progress toward the active objective in the dashboard.
- Include failure or recovery states so the simulator has clearer game tension.

### 2. Add Planet Health History
- Add timeline graphs for habitability, oxygen, carbon dioxide, temperature, and biomass.
- Keep enough history to show delayed environmental and biological consequences.
- Make graph updates readable while the simulation is running.

### 3. Add Research and Upgrade Systems
- Introduce unlockable planetary tools such as orbital mirrors, asteroid deflection, greenhouse gas seeding, artificial magnetosphere support, controlled volcanic release, and ocean mineral enrichment.
- Tie unlocks to time, life-stage milestones, or accumulated research points.
- Make upgrades create strategic tradeoffs rather than simple permanent buffs.

### 4. Expand Extinction and Recovery Arcs
- Make major disasters and population crashes more legible in the science feed and dashboard.
- Add recovery actions that let players respond to extinction pressure.
- Track extinction severity and recovery progress over time.

### 5. Add Different Planet Starts
- Create starting presets such as Frozen Ocean World, Dry Super-Earth, High Radiation Young Star, and Volcanic Proto-Planet.
- Give each preset distinct initial conditions and strategic constraints.
- Add a simple start selector before or during simulation reset.

### 6. Expand Biological Diversity
- Add branching life paths after multicellular life, such as ocean life, land plants, fungi, arthropods, and intelligent life.
- Make each branch depend on different atmospheric, water, radiation, and stability requirements.
- Reflect new biodiversity in the dashboard and visualization.

### 7. Expand Astrobiology Toward Sentient Life
- Model more intermediate steps between simple organisms and sentient or high-intelligence life forms.
- Keep speculative high-intelligence branches consistent with current biology, physics, chemistry, and cosmology rather than treating intelligence as a single unlock jump.

### 8. Interactive SVG Cladogram Visualizer
- Design an interactive SVG Cladogram visualizer in the UI showing column-aligned clades, curved bezier connecting lines, merger nodes, and hover info popups.
- Support dynamic pan/drag navigation across the full phylogenetic tree.

### 9. Save/Load Persistence for Graph State
- Extend the save/load system to fully serialize `biomassMap`, `biodiversityMap`, `unlockedMap`, and `pendingNudges` from `BiologySimulation`.
- Implement migration shims for saves created before the DAG refactor.

---

## Suggested First Priorities

1. Add a clear objective and progress indicator.
2. Add planet health history graphs. (Implemented: Completed biomass and environment timeline graphing with dynamic color keys.)
3. Add planet start presets for replayability. (Implemented: Initial protoplanetary presets and setup config loops.)
4. Implement the Phylogenetic Graph Database, clade biodiversity model, and interactive SVG Cladogram visualizer across Water, Ammonia, and Methane lines. (DAG database **implemented** in `js/evolutionData.js`; SVG cladogram popup stub implemented; biodiversity model tracking active; full interactive visualizer pending.)

---

## Implemented

### 1. Advanced Physical & Chemical Cycles
- **Dual Radiation & Real-Time Gauges**: Space (Cosmic) and Surf (Effective) radiation split into real-time gauges with dynamic hazard color-coding (Green/Amber/Red) and plotted on history graphs.
- **Geodynamo Core Cooling & Lunar Preservation**: Core magnetic field cooling decay based on planet size, with a 50% decay reduction if a Moon is present due to gravitational tidal flexing.
- **Atmospheric Nitrogen Cycle**: Nitrogen fixation by autotrophs, denitrification by decomposers, and upper atmosphere ionization, constraining plant growth when nitrogen falls below 40%.
- **Balanced Carbon-Oxygen Respiration**: Consumer animal respiration rates scale with complexity and metabolisms, drawing down O₂ and releasing CO₂ to counter runaway oxygenation.
- **Abiotic Water Photolysis & Hydrogen Escape**: Solar UV splits atmospheric water vapor into H₂ and O₂ under radiation. Light hydrogen gas escapes to the void of space over time, with the escape rate accelerating 6x if the protective magnetosphere is lost.
- **Greenhouse Vapor Feedbacks**: Included baseline water and ammonia vapor greenhouse heating in temperature calculations so planets with liquid oceans do not freeze instantly if CO₂ drops.
- **Geological Crustal Oxidation Sink**: Excess oxygen ($\text{O}_2 > 21\%$) reacts chemically with crustal mineral sinks (such as ferrous iron), depositing iron oxides and buffering atmospheric $\text{O}_2$ (mimicking Earth's Banded Iron Formations).
- **Multi-Solvent Volcanic Outgassing**: Mantle outgassing of volatiles matches the planet's solvent (Water/Ammonia outgasses $\text{CO}_2$ and $\text{N}_2$; Methane outgasses $\text{CH}_4$ and $\text{N}_2$) to resupply the atmosphere geologically.
- **Abiotic Silicate Weathering**: Carbonate-silicate weathering (on Water and Ammonia worlds) acts as a planetary carbon sink thermostat, scaling with temperature and surface ocean coverage.
- **Solar Methane Photolysis**: Methane gas splits under solar UV radiation on methane worlds, drawing down $\text{CH}_4$ and releasing $\text{H}_2$ gas.

### 2. Ecological & Evolutionary Dynamics
- **Photosynthesis CO₂ Dependency**: Photosynthesis oxygen production and carbon consumption rates scale with CO₂ availability. If CO₂ drops to zero, photosynthesis stops entirely to prevent absolute carbon depletion.
- **Decomposer CO₂ Venting**: Heterotrophic decay of organic soup and anaerobic bacteria respiration directly replenishes atmospheric CO₂.
- **Abiotic Prebiotic Soup Oxidation**: Excess oxygen ($\text{O}_2 > 21\%$) abiotically decomposes dissolved organic compounds in the water pool, consuming $\text{O}_2$ and venting $\text{CO}_2$.
- **Spontaneous Wildfires & Firestorms**: Spontaneous brushfires above 25% oxygen consume O₂ and release CO₂ while burning plant biomass. An **Atmospheric Firestorm** hazard event triggers above 35% oxygen (on either land plants or marine algal/cyanobacteria mats) to restore planetary gas equilibrium.
- **Eukaryote Recombination Boost**: Evolutionary endosymbiosis (Mitochondria) enables meiotic Sexual Reproduction. Evolving sex provides a 1.25x niche colonization growth/capacity boost to eukaryotes, and accelerates all subsequent advanced evolutionary breakthroughs by 30% due to genetic recombination.
- **Multi-Solvent Biomass Decay**: Integrated global biomass decay fluxes for all three solvent lines (Water, Ammonia, Methane). On Water worlds, this decay is aerobic, consuming $\text{O}_2$ and venting $\text{CO}_2$, capping oxygen spikes under high biomass.
- **Metabolic Saturation Kinetics**: Biological cycles (nitrogen fixation, methanogenesis, and ammonic photosynthesis) scale with atmospheric gas concentration via Michaelis-Menten kinetics, preventing absolute depletion.
- **Phylogenetic DAG Database (`js/evolutionData.js`)**: Full Directed Acyclic Graph schema for all three solvent lines (Water, Ammonia, Methane) with node metadata: id, name, clade, parents (supporting multi-parent merger nodes), popKey, cap, unit, reqs, nudge, details, and `monitorable` flag.
- **Clade Biodiversity Tracking**: `biodiversityMap` in `BiologySimulation` tracks per-clade species counts using speciation/extinction differential equations. Species count grows toward a target proportional to biomass and is accelerated by active nudge boosts.
- **Temporary Nudge Boost System**: Spending Blue Mutagen Tokens (🔹) now activates a **temporary ×3 growth multiplier** for 5 Myr on the target clade (rather than a permanent stat change). `getNudgeGrowthMultiplier` propagates this boost to all growth loops across all three solvent lines. A non-blocking amber toast popup confirms the activation without pausing the simulation.
- **Biomasses Monitor Filter**: The Biomasses tab in the right panel now only shows actual living population clades. Evolutionary advance/milestone nodes (transitional steps like Nucleus/Mitochondria/Sexual, and technological endpoints like Cognitive/Cyborg/AI/Noosphere/Gaia, Quantum Lattices, Hiveminds, Thinking Oceans, Cryo-Colloids) are hidden using the `monitorable: false` flag.

### 3. Interface & Quality of Life
- **Save & Load System**: Full local storage save/load persistence that restores all physical, biological, event, timeline history, and scrollable terminal log HTML states. Includes responsive toast popups for immediate feedback upon saving or loading.
- **Interactive Viewport View Toggle**: Click anywhere on the viewport panel to transition between Planet View (Macro) and Microscopic View (Micro), with hover borders and a dynamic status badge.
- **Biomass Graph & Color Alignment**: Restructured the environment history graph to dynamically color solvent lines based on active presets (Green/Water, Purple/Ammonia, Amber/Methane), changed N₂ history line to match the dashboard, and color-aligned all 20+ microscopic view particles to their 5 biomass categories.
- **Auto-Pause & Dynamic Milestone Popups**: Milestone modal overlays automatically pause the simulation ticks and threat clocks, resuming automatically on close. Milestone popups dynamically display actual token rewards (+2, +5, +12, or +25) based on event rarity.
- **Simulation Speed Controls**: Adjustable speed options (1x, 2x, 5x, 10x) with an automated safety lock that restricts simulation to 1x during active threat warnings to prevent panic. Speed settings are automatically restored once all warnings are resolved.
- **Threat Warning Deflect Popups**: Automatic pauses and warning popups triggered upon first warning detection, allowing players to deflect the threat immediately from the modal or dismiss it.
- **Always-Visible Pacing Comparison Timeline**: Added a dedicated pacing timeline card on the main dashboard above the tab controls. The component dynamically displays the planet's current age, the latest unlocked milestone, and an Earth comparison badge (`PRIMORDIAL`, `ON TRACK`, `AHEAD`, or `BEHIND`) across all solvent types. Remapped names for cryo-beasts and cryo-colloids to support methane worlds.
- **Multi-Tiered Token Economy**: Replaced the single Evo-Token currency with a robust three-tier system: Blue Mutagen (🔹) for evolutionary branch nudges, Silver Adaptation (🥈) for genetic upgrades/interventions, and Gold Deflection (🛡️) reserved for deflecting disasters. Added an Exchange tab permitting conversion (`50 Blue ➔ 1 Silver`, `50 Silver ➔ 1 Gold`) with dynamic affordability checking and color-coded hotspots.
- **Planet Telemetry Strip & UI Reorganization**: Redesigned the dashboard layout for clarity, visual consistency, and screen efficiency:
  - **Left panel** renamed to *Command Center*: environmental sliders and redundant system status cards removed (hidden/spanned in DOM); replaced with a row of three compact climate pills (Temp, Water, Rad) that dynamically show values and zone status, a fixed-height threats/lore box (displaying active threat warning cards, or transforming into an educational Biosphere Intel card when clear), and the action tabs (**Gene Tuning** and **Exchange**) relocated from the right panel.
  - **Center panel** gains a three-tab *Planet Telemetry Strip* below the canvas with a fixed height of `218px` to prevent canvas dimension shifting:
    - **🌡️ Climate** — compact horizontal gauges for Temperature, Solvent Coverage, and Cosmic Radiation that match the design of the atmosphere bars. Each gauge displays a green habitable-zone band and a colour-coded thumb marker (green = in zone, red = out, amber = marginal). Space and surface radiation values are displayed as a vertical column of badges on the right.
    - **🌫️ Atmosphere** — gas composition bars (CO₂, N₂, O₂, CH₄, H₂) relocated from the right panel.
    - **🪐 Planet Info** — six-cell grid (Age, Habitability, Solvent, Magnetosphere, Ozone, Star).
  - **Right panel** renamed to *Biosphere Monitor*: acts as a dedicated monitoring panel displaying the compacted pacing timeline and provides tabs to switch between the scrollable **Biomasses** list (filtered to living populations only) and the read-only **Evolution Tree** (roadmap).
  - **Decoupled Tab Controllers**: Splitting the Left and Right panel tab handlers allows independent navigation on both panels.
  - **Environmental agency via interventions only**: Temperature, water, and radiation are now exclusively driven by triggered events and Silver-token interventions — no direct slider dragging.
- **Evolution Boost Toast**: A non-blocking amber floating popup confirms nudge boost activation with node name, multiplier, and duration — auto-dismisses after 5 seconds without pausing the simulation.

---

## Scientific Foundations & Rationale

This simulator utilizes established astrophysical, chemical, and biological principles to model planetary evolution:

### 1. Eukaryogenesis & Mitochondria Symbiosis
* **Scientific Basis**: Eukaryotic cells arose from the endosymbiotic engulfment of an aerobic alphaproteobacterium (proto-mitochondrion) by an archaeal host cell. 
* **Energetics (Lane & Martin, 2010)**: This singular event bypassed the surface-area-to-volume physical limitations that constrain prokaryotic ATP synthesis. Mitochondria provided a **100,000-fold increase in energy availability per gene**, enabling eukaryotes to support massive genomes, synthesize thousands of times more proteins, construct dynamic cytoskeletons, and evolve phagocytosis.
* **Reproductive Evolution**: This energetic surplus physically enabled the evolution of energy-expensive meiosis and sexual recombination.

### 2. Meiotic Sexual Recombination
* **Scientific Basis**: Recombination during sexual reproduction reshuffles genetic material, creating unique combinations of alleles in every generation.
* **Evolutionary Speed Boost**: Sex provides two major evolutionary benefits:
  1. **The Red Queen Hypothesis**: Accelerated adaptation rates allow host organisms to adapt fast enough to stay ahead of co-evolving parasites and rapid environmental shifts.
  2. **Fisher-Muller Effect / Muller's Ratchet**: Recombination combines beneficial mutations and purges deleterious ones far more efficiently than asexual cloning (mitosis). 
* **Model Implementation**: This is represented in-game by a 30% transition rate speed boost (`1.30x` multiplier to evolutionary breakthroughs) and increased carrying capacity and growth rates for eukaryotic populations due to rapid niche specialization.

### 3. Atmospheric Photolysis & Hydrodynamic Escape
* **Scientific Basis**: In the upper atmosphere, water vapor molecules are split by starlight ultraviolet radiation ($2\text{H}_2\text{O} + h\nu \rightarrow 2\text{H}_2 + \text{O}_2$). 
* **Hydrogen Loss**: Due to its extremely low atomic weight, molecular hydrogen ($\text{H}_2$) reaches escape velocity easily and escapes into the vacuum of space (hydrodynamic escape). Oxygen, being heavier, is retained by gravity and contributes to abiotic atmospheric oxygenation.
* **Magnetic Shielding**: A planetary magnetosphere deflects the stellar wind. If the magnetic field decays below critical strength, solar wind collides directly with the atmosphere, accelerating hydrogen stripping by orders of magnitude and causing oceans to dry out.

### 4. Wildfire Oxygen Buffers & Feedback Loops
* **Scientific Basis**: High atmospheric oxygen concentrations (exceeding 25–30%) lower the activation energy of combustion. Under these hyper-oxygenated conditions, damp organic material ignites spontaneously from lightning strikes.
* **Equilibrium Feedback**: Runaway forest fires burn terrestrial biomass, consuming atmospheric $\text{O}_2$ and venting $\text{CO}_2$ at a molecular 1:1 ratio. This functions as a natural geochemical negative feedback loop, preventing oxygen levels from reaching values like 60%+ that would incinerate the biosphere.
* **Early Oxygen Caps**: If oxygen spikes before land plants evolve, it is buffered by abiotic chemical oxidation of dissolved organic compounds and early marine cyanobacteria mat combustions (spontaneously triggered via **Atmospheric Firestorms** above 35% oxygen).
* **Model Implementation**: Fireburn equations consume plant/algae biomass and shift oxygen back into carbon dioxide when $\text{O}_2 > 25\%$, with a catastrophic **Atmospheric Firestorm** hazard event triggering if oxygen surpasses 35%.

### 5. Biological & Geological Carbon Cycles
* **Scientific Basis**: Carbon dioxide ($\text{CO}_2$) is drawn down biologically by carbon fixation (photosynthesis) and abiotically by silicate weathering. It is replenished biologically by respiration and decomposer decay, and geologically by volcanic outgassing.
* **Photosynthetic Constraints**: Photosynthesis requires gaseous carbon. If $\text{CO}_2$ is depleted, photosynthesizers undergo carbon starvation and their growth and oxygen production collapses, preventing the atmosphere from being entirely stripped of carbon.
* **Abiotic Resupply (Soup Oxidation)**: Gaseous oxygen chemically reacts with the prebiotic organic soup, decomposing organic molecules back into $\text{CO}_2$ and $\text{H}_2\text{O}$ abiotically when oxygen levels are high.
* **Tectonic Replenishment**: Background volcanic outgassing (driven by internal mantle heat and core convection) slowly vents mantle $\text{CO}_2$ back into the air over millions of years, closing the geological carbon loop.

### 6. Geodynamo Core Cooling & Lunar Tidal Flexing
* **Scientific Basis**: Planetary magnetic fields are generated by thermal-compositional convection in a molten iron outer core (the geodynamo). As the planet ages, the core cools and solidifies, decaying the magnetic field and eventually stripping the magnetosphere.
* **Tidal preservation**: If a massive Moon is present, gravitational tidal forces flex the planet's mantle and core. This tidal friction generates substantial internal heat (tidal flexing), slowing core cooling decay by 50% and prolonging the active geodynamo.

### 7. Atmospheric Nitrogen Cycle & Nutrient Limitation
* **Scientific Basis**: Nitrogen ($\text{N}_2$) is chemically stable but forms the structural backbone of proteins, DNA, and enzymes.
* **Biological Loops**: Diazotrophs (cyanobacteria/plants) perform biological nitrogen fixation, converting inert atmospheric $\text{N}_2$ to ammonia/nitrates to build biomass. Anaerobic denitrifiers reduce nitrogen oxides back to gaseous $\text{N}_2$ during metabolism. Abiotic starlight ionization also slowly oxidizes nitrogen.
* **Nutrient Bottleneck**: If atmospheric nitrogen falls below 40%, plant protein synthesis suffers, imposing a 50% growth rate penalty representing nitrogen starvation.

### 8. Astrophysics: Stellar Classification & Inverse-Square Law
* **Scientific Basis**: Solar irradiance and UV emission are calculated based on stellar class (G-dwarf, M-dwarf, Blue Giant) and orbital distance.
* **Luminosity & Radiation**: Follows the inverse-square law ($I = L / d^2$). M-dwarfs have low luminosity but high chromospheric flare activity, Blue Giants emit intense ionizing radiation and high luminosity, and G-dwarfs offer stable luminosity and moderate radiation.

### 9. Astrobiological Presets (Water, Ammonia, Methane)
* **Scientific Basis**: The liquid range and chemical polarity of the primary solvent shape the prebiotic synthesis and metabolic paths:
  - **Water ($\text{H}_2\text{O}$)**: Highly polar, liquid range $0^\circ\text{C}$ to $100^\circ\text{C}$ at 1 atm. Supports standard carbon-oxygen biochemistry.
  - **Ammonia ($\text{NH}_3$)**: Polar solvent liquid at lower temperatures ($-78^\circ\text{C}$ to $-33^\circ\text{C}$). Supports nitrogen-centric metabolic paths in cryogenic environments.
  - **Methane ($\text{CH}_4$)**: Apolar solvent liquid at cryogenic temperatures ($-183^\circ\text{C}$ to $-140^\circ\text{C}$). Requires non-lipid bilayers (such as nitrogen-rich azotosome vesicles) and methanogenesis (consuming hydrogen, producing methane).

### 10. Earth History Milestone Timelines
* **Scientific Basis**: Measured in Million Years (Myr) from planetary formation (4.54 billion years ago), the timeline of major biological breakthroughs provides the baseline for the simulator's comparative pacing:
  - **Prebiotic Chemistry/Soup**: ~600 Myr
  - **First Prokaryotes (Bacteria)**: ~800 Myr
  - **Great Oxidation Event (GOE)**: ~2100 Myr
  - **Cellular Nucleus & Endosymbiosis**: ~2100 - 2500 Myr
  - **Eukaryotic Cells**: ~2700 Myr
  - **Meiotic Sexual Reproduction**: ~3300 Myr
  - **Multicellularity (Metazoans)**: ~3700 Myr
  - **Cambrian Explosion / Vertebrates**: ~4000 Myr
  - **Land Colonization & Vascular Plants**: ~4100 Myr
  - **Dinosaurs & Mammals**: ~4300 Myr
  - **Cognitive Species (Sentient Life)**: ~4540 Myr (present day)
* **Comparative Pacing**: By mapping alternative biochemistry stages (Ammonia and Methane) to their functional Earth equivalents, players gain a quantitative understanding of how different chemical solvents and environmental constraints affect the speed of evolutionary jumps.
