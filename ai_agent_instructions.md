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
├── scripts/
│   ├── validate_evolution_graph.mjs  # DAG integrity validator (run after graph edits)
│   └── smoke_test.mjs               # Headless module import and tick tests
└── js/
    ├── game.js              # Coordinator and core requestAnimationFrame loop
    ├── planet.js            # Climate states, gas balances, and physical disasters
    ├── evolutionData.js     # Central phylogenetic graph registry and transition mappings
    ├── rarityTiers.js       # RARITY tier constants (rates, token awards) and SOLVENT_RATE_FACTOR
    ├── rng.js               # Seeded LCG random number generator for deterministic debug mode
    ├── simulation.js        # Orchestrator: Poisson transitions, fitness wiring, gas accounting
    ├── waterBiology.js      # Water-solvent full biochemistry cycle (tickWater)
    ├── ammoniaBiology.js    # Ammonia-solvent biochemistry cycle (tickAmmonia)
    ├── methaneBiology.js    # Methane-solvent biochemistry cycle (tickMethane)
    ├── evolutionEngine.js   # Genetic trait system, fitness calculations, and resource gating
    ├── events.js            # Random scientific events check & active duration clocks
    ├── ui.js                # DOM node caching, telemetry rendering, and input listeners
    ├── visualization.js     # Planet & microscopic cell drawing algorithms
    ├── history.js           # Background time-series data recorder
    ├── historyView.js       # Canvas drawing for historic telemetry graphs
    └── views/
        ├── toastView.js     # Toast notification rendering (delegated from GameUI)
        └── logView.js       # Science log entry rendering (delegated from GameUI)
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
2.  **Graph Metadata**: New species, milestones, clades, parent links, population keys, caps, units, requirements, nudge definitions, monitorability, and display names belong in `EVOLUTION_GRAPH` first. Nodes also carry the following optional fields that drive simulation and UI without in-code duplication:
    *   `earthAge` (Myr from formation): used by the pacing timeline instead of a separate `earthTimeline` map.
    *   `unlockProp` (string): override for unlock property name when the auto-generated `unlockedXxx` form would not match the actual field (e.g. `unlockedSexualReproduction`, `unlockedAI`).
    *   `resourceKey` + `resourceThreshold`: for early-stage resource-pool gating (e.g. `organicSoup`, `ammonicSoup`) so `evolutionEngine.js` reads limits from the graph instead of hardcoded node-ID chains.
3.  **Simulation Behavior**: `js/simulation.js` is the orchestrator — it owns Poisson breakthrough rolls, fitness wiring, gas accounting, and dispatches per-tick biology to the three solvent modules. Solvent equations live in `waterBiology.js`, `ammoniaBiology.js`, and `methaneBiology.js`.
4.  **No Parallel Lists**: UI panels, save/load, visualization, nudge handling, and milestone displays should derive evolutionary metadata from `EVOLUTION_GRAPH` and helper mappings rather than maintaining separate hard-coded species arrays or aliases. Specifically forbidden anti-patterns:
    *   A separate `earthTimeline` map duplicating `earthAge` already on each node.
    *   A hardcoded `unlockMappings` object listing property names — derive them from `node.unlockProp || toUnlockPropName(id)`.
    *   Node-ID if/else chains in `evolutionEngine.js` for resource thresholds — read `node.resourceKey` and `node.resourceThreshold` instead.
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
3.  **Component Encapsulation**: Respect module ownership boundaries:
    *   `evolutionData.js` — identity and metadata only.
    *   `simulation.js` — orchestrator: Poisson rolls, fitness delegation, gas accounting, dispatch to solvent modules.
    *   `waterBiology.js` / `ammoniaBiology.js` / `methaneBiology.js` — per-solvent tick equations (receive a `ctx` object; write back gas deltas through it).
    *   `evolutionEngine.js` — genetic trait calculations and resource-gated fitness.
    *   `rarityTiers.js` — `RARITY` tier constants and `SOLVENT_RATE_FACTOR`; import from here, do not redefine inline.
    *   `rng.js` — `random()`, `setDebugSeed()`, `clearDebugSeed()`; replace all bare `Math.random()` calls in simulation-sensitive paths with `random()`.
    *   `events.js` — event/intervention mechanics and token spending.
    *   `game.js` — orchestration, debug callback handlers.
    *   `ui.js` — DOM rendering; delegates toast and log concerns to `views/toastView.js` and `views/logView.js`.
    *   `visualization.js` — canvas rendering.
4.  **CORS Modules**: Always load script elements in HTML with `type="module"`. Ensure all local imports contain the `.js` extension (e.g. `import { GameUI } from './ui.js';`).
5.  **Synchronize Documentation**: Whenever you implement or modify physical, chemical, or biological equations or laws in the code, you are required to immediately update `SCIENCE.md` (and `README.md` if applicable) with the updated mathematical formulas and scientific rationale.
6.  **Registry Before Implementation**: Before adding a feature, species, milestone, nudge, visualization, save/load field, or general fix involving evolution, inspect `js/evolutionData.js` and model the identity/metadata there first.
7.  **Avoid In-Code Evolution Elements**: Do not add duplicate hard-coded species lists, nudge maps, node labels, node aliases, or milestone definitions inside controller, UI, simulation, or visualization code when the graph can drive them.
8.  **Respect Structural Refactoring**: Preserve the current ownership boundaries: `evolutionData.js` is identity/metadata, `simulation.js` is biological equations and transition logic, `events.js` is events/interventions/token spending, `game.js` is orchestration, `ui.js` is DOM rendering, and `visualization.js` is canvas rendering.
9.  **Prefer Graph-Driven Iteration**: When a change applies to multiple clades or solvent lines, iterate over graph nodes and metadata instead of adding branch-specific special cases. Add local special cases only when behavior is genuinely unique and document why.
10. **Debug Mode**: A hidden debug panel is accessible via `Ctrl+Shift+D` or the `?debug=1` URL parameter. It wires to handlers in `game.js` (seed control, token injection, node unlock, time advance). Use `setDebugSeed(n)` from `rng.js` to make simulation rolls deterministic for reproducing rare events. The panel is DOM-guarded (`if (!document.body) return`) so it is inert in headless Node.js test environments.
