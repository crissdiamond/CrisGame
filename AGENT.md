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
*   `js/game.js`: Central clock and loop coordinator (`requestAnimationFrame`).
*   `js/planet.js`: Environmental physics and gas balances (CO₂, N₂, O₂ summing to 100%).
*   `js/simulation.js`: Ecosystem biological growth and mutations.
*   `js/events.js`: Random geological/solar event check and active counters.
*   `js/ui.js`: DOM binding, gauge visualisation updates (`syncSliders`/`switchStripTab`), scientific feed logs, and milestone popups.
*   `js/visualization.js`: 2D Canvas rendering of planet and microscopic bacteria.
*   `js/history.js`: Background time-series data recorder.
*   `js/historyView.js`: Canvas drawing for historic telemetry graphs.

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

## 6. Core Directives for Agents (Mandatory)
*   **Zero Assumptions**: Do not guess user requirements, environmental states, or module APIs. Inspect the codebase, view existing files, and validate every assumption before editing.
*   **Information Gathering**: Actively query local files and search the web for up-to-date scientific references and API specifications when needed.
*   **State Verification**: Verify execution logs and script execution returns before marking tasks as complete.
*   **No Slider Dragging**: The `#temp-slider`, `#water-slider`, and `#radiation-slider` elements are hidden from the user and must remain `disabled`. Environmental values are set programmatically by `events.js` and interventions only. Never add interactive event listeners to these sliders.
*   **Gauge Sync**: When planet environmental state changes, call `ui.syncSliders(planet)`. This updates all Climate gauge fills, thumb positions, and habitable-zone band positions in the Planet Telemetry Strip.
*   **Strip Tab IDs**: The planet telemetry strip uses IDs `strip-tab-climate`, `strip-tab-atmosphere`, `strip-tab-planet` and content panes `strip-content-climate`, `strip-content-atmosphere`, `strip-content-planet`. Use `ui.switchStripTab(tabId)` to switch between them.
