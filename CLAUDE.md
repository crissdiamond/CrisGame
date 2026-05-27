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
*   **Styling**: Use pure Vanilla CSS with variables in `css/style.css`. Do not install Tailwind or other UI libraries. Maintain a dark, sci-fi glassmorphic lab console design theme.
*   **Verification**: Test changes directly by opening `http://localhost:8080` in the browser. Verify the scrolling console feed in the UI for milestone updates.

## Core Directives for Agents (Mandatory)

*   **Zero Assumptions**: Do not guess user parameters, file structures, or codebase properties. Actively search the project, check existing files, and validate assumptions before coding.
*   **Information Gathering**: Actively query local files and search the web for up-to-date scientific references and API specifications when needed.
*   **Verify Execution**: Check server responses, browser rendering inputs, and terminal execution outputs rather than assuming changes compile or run correctly.
*   **Documentation Synchronization**: Whenever you modify, add, or refactor any physical, chemical, astronomical, or biological formulas or laws (e.g., in `js/planet.js`, `js/simulation.js`), you must immediately update `SCIENCE.md` and `README.md` to keep all mathematical models and scientific explanations perfectly in sync.
