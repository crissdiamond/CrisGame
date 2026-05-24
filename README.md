# Planet Cris: Evolution Simulator

A real-time, interactive laboratory dashboard simulation of planetary life evolution. Play the role of a planetary curator by managing temperature, water levels, and solar radiation to nurture life from prebiotic chemical synthesis to complex multicellular organisms.

## Simulation Core Mechanics

### 1. Environmental Control
Manipulate the fundamental planetary metrics to maintain a habitable climate:
*   **Temperature (°C)**: Extreme cold or extreme heat prevents chemical bonds and destroys living cellular membranes. Moderate ranges allow life to thrive.
*   **Water Coverage (%)**: Water acts as the universal solvent. High coverage facilitates chemical synthesis and monocellular mobility, but a landless planet might limit future terrestrial complex organisms.
*   **Solar Radiation (Rad/s)**: Low radiation yields slow mutation and low energy. High radiation triggers mutations but eventually destroys DNA and sterilizes the planet.

### 2. Stages of Life
*   **Stage 0: Prebiotic Synthesis (Proteins & Amino Acids)**
    *   Formed in warm, watery areas with basic radiation.
    *   Acts as the building blocks for life.
*   **Stage 1: Monocellular Life (Prokaryotes)**
    *   Evolves when amino acids are abundant, water coverage is high, and the temperature is within survival ranges (0°C to 70°C).
    *   Consumes carbon dioxide and water, releasing oxygen over time (changing the atmospheric composition).
*   **Stage 2: Multicellular Life (Eukaryotes & Early Fungi/Algae)**
    *   Evolves when monocellular populations are dense and atmospheric oxygen reaches critical levels (>15%).
    *   Requires stable, moderate conditions (10°C to 45°C) and shielding from extreme radiation.

## Project Structure

```
CrisGame/
├── index.html           # Lab dashboard Layout
├── README.md            # Project description & guide
├── .gitignore           # Excludes local files from git
├── css/
│   └── style.css        # Dashboard visual styling
└── js/
    ├── game.js          # Main game loop controller
    ├── planet.js        # Environmental physics state
    ├── simulation.js    # Biological evolution algorithms
    ├── ui.js            # User interface bindings & events
    └── visualization.js # Canvas-based drawing of planet/microbes
```

## Running the Simulator

No building tools or compilation steps required.
Simply open `index.html` in any modern web browser to start the simulation.
