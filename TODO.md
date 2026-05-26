# TODO

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
- Add scientifically plausible prerequisites for advanced cognition, such as complex ecosystems, sensory systems, nervous-system analogues, social behavior, environmental stability, energy availability, and sustained evolutionary time.
- Keep speculative high-intelligence branches consistent with current biology, physics, chemistry, and cosmology rather than treating intelligence as a single unlock jump.

## Suggested First Priorities

1. Add a clear objective and progress indicator.
2. Add planet health history graphs. (Implemented: Completed biomass and environment timeline graphing with dynamic color keys.)
3. Add planet start presets for replayability. (Implemented: Initial protoplanetary presets and setup config loops.)

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
  - **Right panel** renamed to *Biosphere Monitor*: acts as a dedicated monitoring panel displaying the compacted pacing timeline and provides tabs to switch between the scrollable **Biomasses** list and the read-only **Evolution Tree** (roadmap).
  - **Decoupled Tab Controllers**: Splitting the Left and Right panel tab handlers allows independent navigation on both panels.
  - **Environmental agency via interventions only**: Temperature, water, and radiation are now exclusively driven by triggered events and Silver-token interventions — no direct slider dragging.

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



