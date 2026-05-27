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
    ├── simulation.js        # Biological populations & mathematical logistic growth
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

### B. Biological Kingdoms (in `simulation.js`)
1.  **Organic Soup (ppm)**: Formed when water > 10% and temperature is 30°C - 120°C. Promoted by solar radiation. Consumed by anaerobic life.
2.  **Anaerobic Bacteria (M/mL)**: Emerges when organic soup > 10 ppm. Strict anaerobes; poisoned as O₂ increases (toxic cap at 30% O₂).
3.  **Photosynthetic Bacteria (M/mL)**: Mutates from anaerobes under ionizing radiation. Consumes CO₂, water, and sunlight to release O₂, driving the **Great Oxidation Event (GOE)** once O₂ exceeds 15%.
4.  **Multicellular Eukaryotes (Index)**: Unlocks when photosynthetic bacteria > 50 M/mL and O₂ >= 15%. Highly sensitive to heat and radiation.

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
