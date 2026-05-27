# EvoPlanet Developer Guide (CLAUDE.md)

This guide documents the development commands, code conventions, and testing guidelines for the EvoPlanet project.

## Development & Server Commands

*   **Start Local Test Server**: `python3 server.py` (serves directory at `http://localhost:8080` with cache-control headers disabled for instant reload).
*   **Alternative static server**: `npx serve .` or `python3 -m http.server 8080`.
*   **Version Control check**: `git status`.

## Architecture & Code Style Guidelines

*   **Imports & Modules**: Use ES6 modules. Always add the `.js` extension to relative path imports (e.g., `import { Planet } from './planet.js';`). Loading scripts in HTML requires `type="module"`.
*   **Class Architecture**: Use object-oriented classes matching files (`Planet`, `BiologySimulation`, `GameUI`, `GameVisualizer`, `EventSystem`).
*   **UI Controls**: Environmental changes (temperature, water, radiation) must interpolate smoothly using target targets in `planet.js` rather than changing instantly.
*   **Biological Math**: Model populations using Logistic growth functions (`dN/dt = r * N * (1 - N/K)`) to simulate carrying capacity realistically.
*   **Evolution Graph Registry**: Treat `js/evolutionData.js` as the central registry for species, milestones, clades, parent relationships, nudges, monitorability, labels, caps, units, requirements, and transition-to-node mappings. Add or rename evolutionary elements there first, then derive UI, simulation links, save/load behavior, and visualization state from that registry.
*   **No Duplicate In-Code Evolution Metadata**: Do not introduce hard-coded species arrays, duplicate nudge maps, parallel node IDs, UI-only milestone definitions, or visualization-only aliases when the graph can provide the data. Use `EVOLUTION_GRAPH`, `TRANSITION_TO_NODE_ID`, `getEvolutionNode`, `getNodeIdForTransition`, and `getEvolutionNudge`.
*   **Refactor Boundaries**: Preserve current module ownership:
    *   `evolutionData.js` — identity/metadata; new nodes carry `earthAge`, optional `unlockProp`, `resourceKey`, `resourceThreshold`.
    *   `simulation.js` — orchestrator (~617 lines): Poisson rolls, fitness delegation, gas accounting, dispatch to solvent modules.
    *   `waterBiology.js` / `ammoniaBiology.js` / `methaneBiology.js` — per-solvent tick equations.
    *   `evolutionEngine.js` — genetic trait system and resource-gated fitness.
    *   `rarityTiers.js` — `RARITY` tier constants and `SOLVENT_RATE_FACTOR`; never redefine inline.
    *   `rng.js` — `random()`, `setDebugSeed(n)`, `clearDebugSeed()`; use `random()` in all simulation-path rolls.
    *   `events.js` — event/intervention mechanics and token spending.
    *   `game.js` — orchestration and debug callback handlers.
    *   `ui.js` — DOM rendering; delegates toasts to `views/toastView.js`, log to `views/logView.js`.
    *   `visualization.js` — canvas rendering.
    Avoid fixes that solve a local symptom by duplicating ownership in another module.
*   **Styling**: Use pure Vanilla CSS with variables in `css/style.css`. Do not install Tailwind or other UI libraries. Maintain a dark, sci-fi glassmorphic lab console design theme.
*   **Verification**: Test changes directly by opening `http://localhost:8080` in the browser. Verify the scrolling console feed in the UI for milestone updates.
*   **Graph Validation**: Run `node scripts/validate_evolution_graph.mjs` after graph-related changes. Correct graph registry inconsistencies at the source rather than adding compatibility patches across UI/controller/simulation code. Also run `node scripts/smoke_test.mjs` before committing to confirm all modules load and tick cleanly in a headless Node.js environment.
*   **Debug Mode**: A hidden debug panel lives in `ui.js` (`_createDebugPanel`). Access it via `Ctrl+Shift+D` or `?debug=1`. It provides seed control (`rng.js`), token injection, node unlock, and time advance — all wired to handlers in `game.js`. The panel is DOM-guarded and inert in Node.js tests.

## Core Directives for Agents (Mandatory)

*   **Zero Assumptions**: Do not guess user parameters, file structures, or codebase properties. Actively search the project, check existing files, and validate assumptions before coding.
*   **Information Gathering**: Actively query local files and search the web for up-to-date scientific references and API specifications when needed.
*   **Verify Execution**: Check server responses, browser rendering inputs, and terminal execution outputs rather than assuming changes compile or run correctly.
*   **Documentation Synchronization**: Whenever you modify, add, or refactor any physical, chemical, astronomical, or biological formulas or laws (e.g., in `js/planet.js`, `js/simulation.js`), you must immediately update `SCIENCE.md` and `README.md` to keep all mathematical models and scientific explanations perfectly in sync.
*   **Registry Before Implementation**: Before implementing new features, species, milestones, nudges, fixes, or general changes that touch evolutionary concepts, inspect and use the graph registry. Avoid adding in-code elements outside the registry unless the behavior is genuinely local and cannot be represented as graph metadata.
