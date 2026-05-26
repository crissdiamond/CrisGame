# Planet Cris: Evolution & Astrobiology Simulator

`Planet Cris` is a real-time, scientifically detailed, and interactive planetary laboratory simulator. Play the role of a planetary curator by managing stellar configurations, environmental pressures, solvent coverages, and chemical feedback loops to guide life from prebiotic chemistry to complex multicellularity, advanced intelligence, and post-biological networks.

---

## 1. Advanced Physical & Geological Cycles

The simulator models key astrophysical and biogeochemical processes to determine planetary habitability and atmospheric composition in real time:

*   **Stellar Class & Irradiance**: Irradiance and cosmic radiation are calculated using the inverse-square law based on the parent star's stellar class (**G-dwarf** stable yellow star, **M-dwarf** flare-active red dwarf, or **Blue Giant** hot star) and orbital distance.
*   **Geodynamo Core Cooling**: The planetary magnetic core cools and solidifies over geological time, causing the magnetic shield to decay. If a **Moon** is present, gravitational tidal flexing generates internal friction, slowing core cooling decay by **50%**.
*   **Atmospheric Stripping & Hydrogen Escape**: High-energy stellar winds strip lighter atmospheric components if the protective magnetic shield collapses below 10%. Solar UV radiation splits water vapor into $\text{O}_2$ and $\text{H}_2$ (photolysis). Light hydrogen gas escapes to the void of space, accelerating **6x** without a magnetosphere.
*   **Greenhouse Vapor Feedback**: Baseline atmospheric greenhouse warming includes carbon dioxide heating and vapor feedback (water or ammonia vapor depending on the solvent) so that planets with liquid oceans do not freeze instantly if greenhouse gases drop.
*   **Crustal Oxidation Sink**: Excess oxygen ($\text{O}_2 > 21\%$) reacts chemically with crustal ferrous iron minerals (mimicking Earth's Banded Iron Formations), buffering oxygen levels.
*   **Atmospheric Firestorms**: High atmospheric oxygen ($\text{O}_2 > 25\%$) lowers the ignition point of organic materials, triggering spontaneous wildfires that consume plants/algae and restore $\text{CO}_2$. If oxygen exceeds $35\%$, a catastrophic **Atmospheric Firestorm** sweeps the biosphere to restore chemical balance.

---

## 2. Multi-Solvent Biochemistry Paths

The simulator supports three distinct astrobiological solvent pathways, each with unique temperature ranges, geochemical processes, and biological milestones:

### A. Water-Based Biochemistry ($\text{H}_2\text{O}$ liquid solvent)
*   **Liquid Range**: $0^\circ\text{C}$ to $100^\circ\text{C}$ (at 1 atm).
*   **Carbonate-Silicate Weathering**: $\text{CO}_2$ reacts with silicate rocks to form carbonate sediments, acting as a planetary thermostat.
*   **Biological Milestones**: Prebiotic Soup $\rightarrow$ Prokaryotic Bacteria $\rightarrow$ Anaerobic Archaea $\rightarrow$ Cyanobacteria (GOE) $\rightarrow$ Eukaryotes $\rightarrow$ Multicellular Sponges, Jellyfish, and Worms $\rightarrow$ Early Fish $\rightarrow$ Terrestrial Colonization (Mosses, Ferns, Conifers, Flowering Plants) $\rightarrow$ Tetrapods $\rightarrow$ Sauropsids/Synapsids $\rightarrow$ Sentient Cognition $\rightarrow$ Cyborg/AI Singularity.
*   **Decay Loop**: Aerobic decomposition consumes molecular $\text{O}_2$ and vents $\text{CO}_2$, capping runaway oxygen spikes.

### B. Ammonia-Based Biochemistry ($\text{NH}_3$ liquid solvent)
*   **Liquid Range**: $-78^\circ\text{C}$ to $-33^\circ\text{C}$.
*   **Geochemistry**: Cryovolcanism outgasses volatile $\text{CO}_2$ and $\text{N}_2$. Silicate weathering binds carbon dioxide into ammonium carbamates/carbonates.
*   **Astrobiology**: Autotrophic silico-flora perform nitrogenous photosynthesis:
    $$6\text{CO}_2 + 8\text{NH}_3 \rightarrow 6\text{CH}_2\text{O} + 4\text{N}_2 + 6\text{H}_2\text{O}$$
    This vents molecular nitrogen into the atmosphere.
*   **Milestones**: Ammonic Soup $\rightarrow$ Silico-Prokaryotes $\rightarrow$ Ammonic Multicells $\rightarrow$ Silico-Flora $\rightarrow$ Ammonic Megafauna $\rightarrow$ Crystalline Swarms $\rightarrow$ Quantum Lattices $\rightarrow$ Glacier Hiveminds.

### C. Methane-Based Biochemistry ($\text{CH}_4$ liquid solvent)
*   **Liquid Range**: $-183^\circ\text{C}$ to $-140^\circ\text{C}$ (Titan-like cryogenic temperatures).
*   **Geochemistry**: Solar UV photolyses atmospheric methane, producing molecular hydrogen ($\text{H}_2$) and tholin aerosols. Cryovolcanic vents replenish methane.
*   **Astrobiology**: Methanogenic organisms feed on acetylene and hydrogen gas to produce methane, stabilizing the hydrocarbon cycle:
    $$\text{C}_2\text{H}_2 + 3\text{H}_2 \rightarrow 2\text{CH}_4$$
*   **Milestones**: Hydrocarbon Soup $\rightarrow$ Cryo-Methanogen Prokaryotes $\rightarrow$ Cryo-Multicells $\rightarrow$ Cyto-Beasts $\rightarrow$ Cryo-Polymer Networks $\rightarrow$ Thinking Methane Oceans $\rightarrow$ Megastructure Cryo-Colloids.

---

## 3. Core Simulation & Evolution Mechanics

*   **Oxygenic Photosynthesis (OEC) Stability Gate**: Transitioning from anoxygenic photosynthesizers to cyanobacteria requires an environmental stability window of $100\text{ Myr}$. During this window, the planet must maintain temperature between $15\text{--}55^\circ\text{C}$, liquid solvent coverage $>20\%$, and effective surface radiation $<3.0\text{ rad/s}$. Any violation instantly resets the gate timer back to $100\text{ Myr}$.
*   **Multi-Tiered Token Economy**:
    *   **Blue Mutagen Tokens (🔹)**: Spent on species evolution tree branch nudges. Accrues passively from biomass hotspots and COMMON/NOTABLE milestone breakthroughs.
    *   **Silver Adaptation Tokens (🥈)**: Spent on environmental interventions (e.g. comets, outgassing triggers) and Genetic Resilience upgrades. Earned from notable milestones, silver hotspots, or converted from Blue tokens.
    *   **Gold Deflection Tokens (🛡️)**: Reserved EXCLUSIVELY for active warning deflections (e.g. asteroid impacts, stellar flares, geodynamo repairs). Earned from major/singular milestones, gold hotspots, or converted from Silver tokens.
    *   **Curator Exchange**: Convert currencies in the **Exchange** tab under biological telemetry (`50 Blue ➔ 1 Silver`, `50 Silver ➔ 1 Gold`).
*   **Genetic Resilience Tuning**: Spend accumulated Silver Adaptation Tokens (🥈) to permanently upgrade species traits, which are inherited across all active branches:
    *   **Thermal Resilience**: Widens temperature survival ranges by $\pm 2^\circ\text{C}$ per level (max level 5).
    *   **Radiation Shielding**: Lowers effective radiation exposure by $15\%$ per level (max level 5).
    *   **Metabolic Efficiency**: Reduces biological decay and nutrient consumption by $15\%$ per level (max level 5).
*   **Eukaryogenesis Boost**: Transitioning from prokaryotes to eukaryotes (via mitochondria endosymbiosis) unlocks meiotic sexual reproduction, providing a **1.25x** carrying capacity boost and a **30% speed boost** to all subsequent evolution rates.
*   **Saturation Kinetics**: Biological gas exchanges (such as nitrogen fixation and methanogenesis) scale using Michaelis-Menten kinetics (e.g. $\frac{\text{Gas}}{\text{Gas} + K_m}$) to throttle rates and prevent absolute depletion of critical atmospheric components.
*   **Evolution Nudges**: Pay Blue Mutagen Tokens (🔹) for evolutionary branch jumps (e.g. vascular systems, amniotic eggs, seed protection, or crystalline collectives) to bypass physical constraints.
*   **Threat Management**: Deflect incoming disasters (such as Asteroid Impacts, Gamma-Ray Bursts, or Solar Flares) using Gold Deflection Tokens (🛡️). The simulator automatically locks speed to **1x** during threats for safety.
*   **Environmental Control via Events Only**: Temperature, solvent coverage, and radiation cannot be adjusted by sliders. All environmental changes occur exclusively through triggered events (disasters) or player-activated interventions (Silver token purchases via the ☄️ Trigger Event button).

---

## 4. UI Dashboard & QoL Features

The dashboard is divided into three vertical columns plus a full-width history panel below.

### Left Panel — Command Center
*   **Live Climate Pills**: Compact horizontal readouts for Temperature, Solvent Coverage, and Radiation that dynamically show current values and color-code zone status (in-zone, marginal, or out-of-zone) for quick status checks.
*   **Threats & Intel Box**: Displays active planetary threats with countdown timers and Gold-token deflect buttons. When no threats are active, this box dynamically converts into a **Biosphere Intel Card** that teaches the player about the current apex evolving life form in the simulation.
*   **Action Tabs**: Provides direct curatorial controls below the warnings/intel box:
    *   **Evolution Tree tab**: Branching roadmap with mutation progress and nudge-purchase buttons (using Blue tokens).
    *   **Gene Tuning tab**: Trait upgrades (Thermal Resilience, Radiation Shielding, Metabolic Efficiency) using Silver tokens.
    *   **Exchange tab**: Currency conversion interface (Blue → Silver, Silver → Gold).

### Center Panel — Planet Viewport & Telemetry Strip
*   **Interactive Viewport**: Click anywhere on the canvas to toggle between **Planet View (Macro)** and **Microscopic Particle View (Micro)**.
*   **Planet Telemetry Strip** (three tabs below the canvas):
    *   **🌡️ Climate tab**: Three read-only visual gauge bars for Temperature, Solvent Coverage, and Cosmic Radiation. Each gauge displays:
        - A **green habitable zone band** marking the compatible range for the active solvent (water 0–100 °C, ammonia −78–−33 °C, methane −183–−130 °C).
        - A **colour-coded thumb marker** — green inside the zone, red outside, amber on the boundary.
        - Numerical value readouts; radiation shows both space and surface (effective) values.
        - Zone label updates automatically when the solvent changes.
    *   **🌫️ Atmosphere tab**: Horizontal bar charts for CO₂, N₂, O₂, CH₄, and H₂ composition.
    *   **🪐 Planet Info tab**: Six-cell grid showing Planet Age, Habitability, Solvent State, Magnetosphere, Ozone, and Star Luminosity.
*   **Time-Series Sparklines** (full-width panel below): Historical trajectories for temperature, water/solvent coverage, surface radiation, habitability, O₂, CO₂, N₂, and biomass densities.

### Right Panel — Biosphere Monitor
Dedicated entirely to tracking cellular progress:
*   **Pacing Timeline**: Tracks current planetary age against Earth's 4,540 Myr timeline with a dynamic comparison badge (`PRIMORDIAL`, `ON TRACK`, `AHEAD`, `BEHIND`).
*   **Biomass Monitor**: Scrollable lists of progressive biomass cards that appear as each species is unlocked across the Water, Ammonia, or Methane solvent lines. Housed directly in the panel for permanent, tab-free monitoring.

### Global Controls
*   **Always-Visible Pacing Timeline**: Tracks current planetary age against Earth's 4,540 Myr timeline with a dynamic badge (`PRIMORDIAL`, `ON TRACK`, `AHEAD`, `BEHIND`).
*   **☄️ Trigger Event button**: Opens the interventions modal to purchase Silver-token events (comets, volcanic eruptions, silicate weathering, etc.) that alter the environment.
*   **Save/Load Persistence**: Full `localStorage` save/load restoring all atmospheric, biological, event, history, and log states.
*   **Simulation Speed**: 1×, 2×, 5×, 10× with automatic 1× safety lock during active threats.

---

## 5. Directory Structure

```
CrisGame/
├── index.html           # Main lab dashboard layout
├── README.md            # Scientific documentation and user guide
├── TODO.md              # Feature roadmap and implementation details
├── server.py            # Simple Python developmental server
├── css/
│   └── style.css        # Glassmorphic and retro sci-fi panel styling
└── js/
    ├── game.js          # Controller loop, save/load state, game lifecycle
    ├── planet.js        # Physical, geological, and atmospheric physics formulas
    ├── simulation.js    # Biological growth, decay fluxes, and ecosystem formulas
    ├── ui.js            # DOM caches, pacing calculations, modal popups, and toast systems
    ├── visualization.js # Canvas visualizers for planet macro / microscopic views
    ├── history.js       # Background time-series metrics data recorder
    ├── historyView.js   # Canvas drawing for historic telemetry graphs
    └── events.js        # Event registry, disaster systems, and intervention mechanics
```

---

## 6. Getting Started

No compilers or heavy frameworks are required.
1. Download or clone this directory.
2. Open `index.html` in any modern web browser to start managing your planet!
3. Alternatively, run a simple local server:
   ```bash
   python server.py
   ```
   and navigate to `http://localhost:8000`.
