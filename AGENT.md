# EvoPlanet: Agent Instructions (AGENT.md)

This file contains the core project configurations, mathematical models, and rule logic for coding agents (such as Codex) working on **EvoPlanet**.

## 1. Project Context
EvoPlanet is an astrobiology simulator game. The player acts as a planetary curator, steering life from prebiotic chemistry to sentient civilisations by managing token economies, triggering interventions, and deflecting disasters. Environmental parameters (Temperature, Solvent Coverage, Radiation) are **read-only** — they change only through game events and Silver-token interventions, never via direct slider input.
*   **Architecture**: Vanilla HTML5, CSS3, and ES6 Javascript modules. No build tool, bundler, or package manager is required.
*   **Local Server**: Must be hosted over HTTP due to CORS policies on modular Javascript. Use the local `python3 server.py` (which runs on port `8080`).

## 2. Vision Statement
EvoPlanet should be a scientifically grounded astrobiology and planetary evolution game. Creative speculation is welcome, but every organism, environmental mechanic, disaster, and evolutionary path must be anchored in current scientific understanding of biology, physics, chemistry, geology, and cosmology.

Do not add fantasy creatures, magical forces, or arbitrary evolutionary leaps. Speculative life forms must be framed as plausible extrapolations from known science, with credible solvent chemistry, energy sources, selection pressures, planetary constraints, and timescales. Evolution timelines should respect the broad order and dependency structure understood from Earth history and astrobiology: planetary formation, atmospheric and ocean chemistry, prebiotic synthesis, protocells, metabolism, heredity, prokaryotic life, oxygenation or alternative redox pathways, eukaryote-like complexity where plausible, multicellularity, ecological specialization, nervous or information-processing systems, tool use or technology, and only then sentient or high-intelligence outcomes.

When gameplay requires simplification, preserve scientific directionality and causal consistency. A feature can be compressed for playability, but it should not contradict basic constraints such as thermodynamics, orbital mechanics, radiation effects, atmospheric chemistry, mutation/selection dynamics, or known biological dependencies.

## 3. File Organization
*   `index.html`: Lab dashboard UI structure — three columns (Command & Control | Planet Viewport + Telemetry Strip | Biological Telemetry) plus full-width history and log panels.
*   `css/style.css`: Dark glassmorphism UI theme rules (neon-cyan, emerald, purple, and orange). Includes styles for `.planet-telemetry-strip`, `.climate-gauge-card`, `.sys-readout-card`, and strip tab controls.
*   `js/game.js`: Central clock and loop coordinator (`requestAnimationFrame`). Owns all debug panel callback handlers (seed, tokens, unlock, time advance).
*   `js/planet.js`: Environmental physics and gas balances (CO₂, N₂, O₂ summing to 100%).
*   `js/evolutionData.js`: Central phylogenetic DAG registry. Every node carries: `id`, `name`, `clade`, `parents`, `popKey`, `cap`, `unit`, `reqs`, `nudge`, `details`, `monitorable`, `earthAge` (Myr), and optionally `unlockProp`, `resourceKey`, `resourceThreshold`.
*   `js/rarityTiers.js`: `RARITY` tier constants (COMMON/NOTABLE/MAJOR/SINGULAR) with `rate`, `award`, `awardBlue`, `awardSilver`, `awardGold`. Also exports `SOLVENT_RATE_FACTOR` ({ water: 1.0, ammonia: 0.7, methane: 0.5 }). Import from here — never redefine inline.
*   `js/rng.js`: Seeded LCG random number generator. Exports `random()` (drop-in `Math.random()` replacement), `setDebugSeed(n)`, `clearDebugSeed()`, `isDebugSeedActive()`. All simulation-path random rolls must use `random()`.
*   `js/simulation.js`: **Orchestrator only** (~617 lines). Owns Poisson breakthrough rolls (`tryFire`), fitness delegation (`_speciesViability`), gas accounting, unlock mapping (graph-derived), and dispatches per-tick biology to the three solvent modules via a `ctx` object.
*   `js/waterBiology.js`: Full water-solvent biochemistry cycle. Exports `tickWater(bio, planet, tickRate, ctx, effRad, effDecayMult)`.
*   `js/ammoniaBiology.js`: Ammonia-solvent biochemistry cycle. Exports `tickAmmonia(bio, planet, tickRate, ctx, effRad, effDecayMult)`.
*   `js/methaneBiology.js`: Methane-solvent biochemistry cycle. Exports `tickMethane(bio, planet, tickRate, ctx, effRad, effDecayMult)`.
*   `js/evolutionEngine.js`: Genetic trait system (thermal viability, radiation resistance), fitness calculations, and resource-pool gating (reads `node.resourceKey` / `node.resourceThreshold` from the graph).
*   `js/events.js`: Random geological/solar event check and active counters.
*   `js/ui.js`: DOM binding, gauge visualisation updates (`syncSliders`/`switchStripTab`), scientific feed logs, and milestone popups. Delegates toast rendering to `views/toastView.js` and log rendering to `views/logView.js`. Hosts debug panel (`_createDebugPanel`), accessible via `Ctrl+Shift+D` or `?debug=1`.
*   `js/views/toastView.js`: `ToastView` class — `showToast(message, type)` and `showBoostToast(nodeLabel, durationMyr, multiplier)`.
*   `js/views/logView.js`: `LogView` class — `logEvent(title, desc, type, meta, timestamp)` and `clearLog()`.
*   `js/visualization.js`: 2D Canvas rendering of planet and microscopic bacteria.
*   `js/history.js`: Background time-series data recorder.
*   `js/historyView.js`: Canvas drawing for historic telemetry graphs.
*   `scripts/validate_evolution_graph.mjs`: DAG integrity validator. Run after any graph edit: `node scripts/validate_evolution_graph.mjs`.
*   `scripts/smoke_test.mjs`: Headless module import and multi-tick tests. Run before committing: `node scripts/smoke_test.mjs`.

## 4. Astrobiology Simulation Rules
*   **Prebiotic Soup**: Synthesized when water > 10% and temp is 30°C - 120°C. Moon tides multiply this synthesis rate by `2.5x`.
*   **Anaerobic Bacteria**: Strict anaerobes. Poisoned by O₂ levels > 10% (growth caps at 30% O₂).
*   **Photosynthetic Bacteria**: Mutate from anaerobes under radiation. Consume CO₂ and release O₂ (triggering the Great Oxidation Event when O₂ > 15%).
*   **Multicellular Eukaryotes**: Unlocked when photosynthetic cells > 50 M/mL and O₂ > 15%. Sensitive to high radiation (> 3 rad/s).
*   **Shielding**: Magnetosphere blocks 75% of incoming cosmic radiation.
*   **Glaciation**: Freezes water, reducing anaerobic, photosynthetic, and multicellular growth viability factors.

## 5. Development Principles
*   Use smooth interpolation for parameter transitions (e.g., `value += (target - value) * 0.05`).
*   Use Logistic growth formulas (`dN/dt = r * N * (1 - N/K)`) for population modeling.
*   Always include `.js` extensions on module imports.
*   Prefer scientifically plausible abstractions over fantasy shortcuts. If adding speculative biology or cosmology, document the scientific basis in UI text, event descriptions, or comments where useful.
*   Keep evolutionary prerequisites coherent: advanced life should depend on stable habitats, energy gradients, ecological complexity, and appropriate atmospheric/radiation conditions.
*   Treat `js/evolutionData.js` as the central registry for evolution graph metadata. New species, milestones, clades, nudge definitions, parent links, monitoring flags, population keys, caps, units, requirements, and display labels belong in `EVOLUTION_GRAPH` and its helper mappings first.
*   Do not add duplicate in-code species lists, hard-coded nudge maps, parallel node aliases, or UI-only milestone definitions when graph metadata can drive the feature. If a feature needs evolution metadata, derive it from `EVOLUTION_GRAPH`, `TRANSITION_TO_NODE_ID`, `getEvolutionNode`, `getNodeIdForTransition`, or `getEvolutionNudge`. Specifically forbidden patterns that were previously removed and must not be reintroduced:
    *   A separate `earthTimeline` constant duplicating `earthAge` on each node — read `getEvolutionNode(id)?.earthAge` instead.
    *   A hardcoded `unlockMappings` object — derive from `node.unlockProp || toUnlockPropName(id)` by iterating `EVOLUTION_GRAPH`.
    *   Node-ID `if/else` chains in `evolutionEngine.js` for resource thresholds — read `node.resourceKey` and `node.resourceThreshold`.
*   Preserve the post-refactor separation of concerns. Module ownership:
    *   `evolutionData.js` — identity and metadata only.
    *   `simulation.js` — orchestrator: Poisson rolls, fitness delegation, gas accounting, solvent dispatch.
    *   `waterBiology.js` / `ammoniaBiology.js` / `methaneBiology.js` — per-solvent tick equations; receive `(bio, planet, tickRate, ctx, effRad, effDecayMult)` and write gas deltas back through `ctx`.
    *   `evolutionEngine.js` — genetic trait calculations and resource-gated fitness; reads `node.resourceKey` / `node.resourceThreshold` from the graph.
    *   `rarityTiers.js` — tier constants only; never redefine `RARITY` or `SOLVENT_RATE_FACTOR` inline.
    *   `rng.js` — seeded RNG; replace bare `Math.random()` in simulation paths with `random()`.
    *   `events.js` — event/intervention mechanics and token spending.
    *   `game.js` — orchestration and debug callbacks.
    *   `ui.js` — DOM rendering; delegates toast/log to `views/`.
    *   `visualization.js` — canvas rendering.
    Avoid reintroducing cross-module ownership drift.
*   When adding or renaming graph nodes, update the central graph and run `node scripts/validate_evolution_graph.mjs`. Fix validator failures by correcting the registry rather than patching around inconsistencies in UI or simulation code. Also run `node scripts/smoke_test.mjs` before committing to confirm all modules load headlessly and the simulation can tick without errors.
*   Prefer reusable graph-driven iteration over one-off conditionals. Exceptions are acceptable only when the behavior is genuinely local and cannot sensibly be represented as graph metadata; document that reason briefly near the code.

## 6. Debug Mode

A hidden debug panel is embedded in `ui.js` (`_createDebugPanel`). It is accessible via `Ctrl+Shift+D` or the `?debug=1` URL parameter. Controls are wired to handlers in `game.js`:

*   **Seed RNG**: Calls `setDebugSeed(n)` from `rng.js`, making all `random()` calls deterministic for reproducing rare event sequences.
*   **Clear Seed**: Calls `clearDebugSeed()`, restoring true randomness.
*   **Add Tokens**: Injects Blue/Silver/Gold tokens directly into `EventSystem`.
*   **Unlock Node**: Sets `biology.unlockedMap[nodeId] = true` for any graph node.
*   **Advance Time**: Increments `planet.age` by a configurable number of Myr.

The panel is guarded with `if (!document.body) return` so it is inert in Node.js test environments. Do not remove this guard.

## 7. Core Directives for Agents (Mandatory)
*   **Zero Assumptions**: Do not guess user requirements, environmental states, or module APIs. Inspect the codebase, view existing files, and validate every assumption before editing.
*   **Information Gathering**: Actively query local files and search the web for up-to-date scientific references and API specifications when needed.
*   **State Verification**: Verify execution logs and script execution returns before marking tasks as complete.
*   **No Slider Dragging**: The `#temp-slider`, `#water-slider`, and `#radiation-slider` elements are hidden from the user and must remain `disabled`. Environmental values are set programmatically by `events.js` and interventions only. Never add interactive event listeners to these sliders.
*   **Gauge Sync**: When planet environmental state changes, call `ui.syncSliders(planet)`. This updates all Climate gauge fills, thumb positions, and habitable-zone band positions in the Planet Telemetry Strip.
*   **Strip Tab IDs**: The planet telemetry strip uses IDs `strip-tab-climate`, `strip-tab-atmosphere`, `strip-tab-planet` and content panes `strip-content-climate`, `strip-content-atmosphere`, `strip-content-planet`. Use `ui.switchStripTab(tabId)` to switch between them.
*   **Formula & Science Sync**: Any change to simulation logic, geochemical cycles, or astrobiological formulas in the codebase must be immediately documented in `SCIENCE.md` and referenced in `README.md` to ensure the scientific reference manuals are always aligned with the source code.
*   **Graph Registry First**: For any new feature, species, milestone, nudge, UI panel, visualization, save/load behavior, or bug fix that touches evolutionary identity, inspect `js/evolutionData.js` before coding. Do not create new hard-coded evolution elements elsewhere unless they are derived from or explicitly linked back to the graph registry.
