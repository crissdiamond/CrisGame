# AI Coding Assistant Instructions - EvoPlanet Project

This document provides context, design specs, and simulation rules for any AI coding assistant (e.g., Claude, Codex) collaborating on **EvoPlanet: Laboratory Dashboard**. 

---

## 1. Project Overview & Tech Stack

EvoPlanet is an interactive astrobiology simulation game. The user takes the role of a planetary curator adjusting temperature, moisture, and solar radiation to guide life from prebiotic chemical soup to complex multicellular organisms.

*   **Core stack**: Pure HTML5, Vanilla CSS3 (no frameworks/Tailwind), and modular ES6 Javascript.
*   **Design system**: Sleek, futuristic dark-mode laboratory dashboard utilizing glassmorphism cards (`backdrop-filter: blur(20px)`), HSL gradients, glowing indicator LEDs, and dynamic progress bars.
*   **Rendering**: Dual-mode rendering on HTML5 2D Canvas (`js/visualization.js`) showing a rotating 3D shaded planet (Macro) and microscopic fluid cell physics (Micro).
*   **Hosting**: Static files must be served over a local HTTP server to satisfy browser CORS requirements for ES6 modules (a local `server.py` helper script is present in root).

---

## 2. Directory Structure

```
CrisGame/
├── index.html               # Main laboratory dashboard layout
├── README.md                # Project README
├── .gitignore               # Excludes system & helper files (including this one)
├── server.py                # Python test server (CORS-enabled, Cache-disabled)
├── css/
│   └── style.css            # Futuristic dashboard styling & colors
└── js/
    ├── game.js              # Coordinator and core requestAnimationFrame loop
    ├── planet.js            # Climate states, gas balances, and physical disasters
    ├── evolutionData.js     # Central phylogenetic graph registry and transition mappings
    ├── simulation.js        # Biological populations, transitions, and mathematical logistic growth
    ├── events.js            # Random scientific events check & active duration clocks
    ├── ui.js                # DOM node caching, telemetry rendering, and input listeners
    └── visualization.js     # Planet & microscopic cell drawing algorithms
```

---

## 3. Core Simulator Mechanics

To maintain consistency, any code edits must comply with the following simulation rules:

### A. Environmental Scaling (in `planet.js` & `simulation.js`)
*   **Time Step**: 1 real second = 0.1 Million Years (Myr).
*   **Habitability Score**: Derived dynamically using a custom asymmetric viability bell curve mapping temperature, moisture, and radiation.
*   **Gases**: Atmospheric gases (`co2`, `n2`, `o2`) are updated dynamically. They must always sum to 100% via `rebalanceAtmosphere()`.

### B. Evolution Graph and Biological Kingdoms
1.  **Central Registry**: `js/evolutionData.js` is the source of truth for evolutionary node identity and metadata across water, ammonia, and methane solvent lines.
2.  **Graph Metadata**: New species, milestones, clades, parent links, population keys, caps, units, requirements, nudge definitions, monitorability, and display names belong in `EVOLUTION_GRAPH` first.
3.  **Simulation Behavior**: `js/simulation.js` owns the equations, gates, Poisson breakthrough rolls, biomass dynamics, and biological feedbacks that operate on graph-linked clades.
4.  **No Parallel Lists**: UI panels, save/load, visualization, nudge handling, and milestone displays should derive evolutionary metadata from `EVOLUTION_GRAPH` and helper mappings rather than maintaining separate hard-coded species arrays or aliases.
5.  **Validation**: Run `node scripts/validate_evolution_graph.mjs` after graph edits and fix registry errors at the source.

### C. Scientific Event Modifiers (in `events.js`)
*   **Giant Impact (Moon)**: Permanently activates `hasMoon = true`, accelerating organic soup synthesis rate by **2.5x** due to tidal pools.
*   **Comet Impact**: Increases water coverage, cools the crust, and injects prebiotic compounds.
*   **Solar Superflare**: Increases radiation to 9.0 rad/s temporarily. Damages living populations but triples mutation rates.
*   **Geodynamo Ignition (Magnetosphere)**: Restricts cosmic radiation limits to 25% of baseline values (required for land multicellular life).
*   **Snowball Glaciation (Ice Age)**: Forces temperature to -45°C, freezing water coverage and crippling photosynthetic output by 75%.

---

## 4. Guidelines for Code Enhancements

When writing or modifying files:
1.  **Preserve State Interpolation**: Do not apply slider values instantly to planetary parameters. Always interpolate smoothly (e.g., `value += (target - value) * 0.05`) to create smooth dashboard transitions.
2.  **Mathematical Models**: Use Logistic growth formulas (`dN/dt = r * N * (1 - N/K)`) to simulate populations instead of linear clocks.
3.  **Component Encapsulation**: Keep UI operations in `ui.js`, rendering details in `visualization.js`, biological calculations in `simulation.js`, and event ticking in `events.js`.
4.  **CORS Modules**: Always load script elements in HTML with `type="module"`. Ensure all local imports contain the `.js` extension (e.g. `import { GameUI } from './ui.js';`).
5.  **Synchronize Documentation**: Whenever you implement or modify physical, chemical, or biological equations or laws in the code, you are required to immediately update `SCIENCE.md` (and `README.md` if applicable) with the updated mathematical formulas and scientific rationale.
6.  **Registry Before Implementation**: Before adding a feature, species, milestone, nudge, visualization, save/load field, or general fix involving evolution, inspect `js/evolutionData.js` and model the identity/metadata there first.
7.  **Avoid In-Code Evolution Elements**: Do not add duplicate hard-coded species lists, nudge maps, node labels, node aliases, or milestone definitions inside controller, UI, simulation, or visualization code when the graph can drive them.
8.  **Respect Structural Refactoring**: Preserve the current ownership boundaries: `evolutionData.js` is identity/metadata, `simulation.js` is biological equations and transition logic, `events.js` is events/interventions/token spending, `game.js` is orchestration, `ui.js` is DOM rendering, and `visualization.js` is canvas rendering.
9.  **Prefer Graph-Driven Iteration**: When a change applies to multiple clades or solvent lines, iterate over graph nodes and metadata instead of adding branch-specific special cases. Add local special cases only when behavior is genuinely unique and document why.
