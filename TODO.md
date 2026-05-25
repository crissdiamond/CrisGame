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

### 2. Ecological & Evolutionary Dynamics
- **Photosynthesis CO₂ Dependency**: Plant and cyanobacteria growth rates are throttled when CO₂ drops below 2%, simulating carbon starvation and preventing absolute CO₂ depletion.
- **Decomposer CO₂ Venting**: Heterotrophic decay of organic soup and anaerobic bacteria respiration directly replenishes atmospheric CO₂.
- **Spontaneous Wildfires & Firestorms**: Spontaneous brushfires above 25% oxygen consume O₂ and release CO₂ while burning plant biomass. An **Atmospheric Firestorm** hazard event triggers above 35% oxygen to restore planetary gas equilibrium.
- **Eukaryote Recombination Boost**: Evolutionary endosymbiosis (Mitochondria) enables meiotic Sexual Reproduction. Evolving sex provides a 1.25x niche colonization growth/capacity boost to eukaryotes, and accelerates all subsequent advanced evolutionary breakthroughs by 30% due to genetic recombination.

### 3. Interface & Quality of Life
- **Save & Load System**: Full local storage save/load persistence that restores all physical, biological, event, timeline history, and scrollable terminal log HTML states.
- **Interactive Viewport View Toggle**: Click anywhere on the viewport panel to transition between Planet View (Macro) and Microscopic View (Micro), with hover borders and a dynamic status badge.
- **Biomass Graph & Color Alignment**: Restructured the environment history graph to dynamically color solvent lines based on active presets (Green/Water, Purple/Ammonia, Amber/Methane), changed N₂ history line to match the dashboard, and color-aligned all 20+ microscopic view particles to their 5 biomass categories.
- **Auto-Pause & Dynamic Milestone Popups**: Milestone modal overlays automatically pause the simulation ticks and threat clocks, resuming automatically on close. Milestone popups dynamically display actual token rewards (+2, +5, +12, or +25) based on event rarity.

