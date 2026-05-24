import { Planet } from './planet.js';
import { BiologySimulation } from './simulation.js';
import { GameUI } from './ui.js';
import { GameVisualizer } from './visualization.js';

class GameController {
    constructor() {
        // Instantiate modules
        this.planet = new Planet();
        this.biology = new BiologySimulation();
        this.ui = new GameUI();
        this.visualizer = new GameVisualizer('simulation-canvas');

        // Loop / Timing State
        this.isPlaying = true;
        this.lastTime = 0;
        
        // Time scale: 1 real second = 0.1 Million Years (Myr)
        this.timeScale = 0.1; 

        // Initialize bindings and setup initial state
        this.init();
    }

    init() {
        // Synchronize UI values with starting values of the planet
        this.ui.syncSliders(this.planet);
        this.ui.setPlayState(this.isPlaying);

        // Bind UI triggers and controls
        this.ui.bindEvents({
            onTemperatureChange: (val) => this.planet.setTargetTemperature(val),
            onWaterCoverageChange: (val) => this.planet.setTargetWaterCoverage(val),
            onRadiationChange: (val) => this.planet.setTargetRadiation(val),
            
            onMeteorStrike: () => {
                const event = this.planet.triggerMeteor();
                this.ui.logEvent(event.title, event.desc, event.type);
                this.ui.syncSliders(this.planet);
            },
            
            onVolcanoErupt: () => {
                const event = this.planet.triggerVolcano();
                this.ui.logEvent(event.title, event.desc, event.type);
                this.ui.syncSliders(this.planet);
            },
            
            onPauseToggle: () => {
                this.isPlaying = !this.isPlaying;
                this.ui.setPlayState(this.isPlaying);
                if (this.isPlaying) {
                    this.lastTime = performance.now(); // reset timer to avoid huge delta-time jump
                }
            },
            
            onViewChange: (viewMode) => {
                this.visualizer.setViewMode(viewMode);
            }
        });

        // Log opening console message
        this.ui.logEvent("SENSOR ACTIVE", "Environmental monitors are recording. Initial temperature set to 75°C. Water at 30%. Adjust controls to optimize planetary viability.", "system");

        // Launch simulation loop
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    /**
     * Core animation and calculation loop
     */
    loop(timestamp) {
        // Calculate delta time in seconds
        const dt = (timestamp - this.lastTime) / 1000.0;
        this.lastTime = timestamp;

        // Perform simulation updates if active
        if (this.isPlaying && dt > 0) {
            // Convert real-world time step into Million Years (Myr)
            const tickRate = dt * this.timeScale;

            // 1. Run biological computations (pass current planet climate factors)
            const bioUpdate = this.biology.update(tickRate, this.planet);

            // Print any biological milestones / events to the science feed
            if (bioUpdate.events && bioUpdate.events.length > 0) {
                bioUpdate.events.forEach(evt => {
                    this.ui.logEvent(evt.title, evt.desc, evt.type);
                });
            }

            // 2. Update planet physical state using biological outputs (O2 / CO2 cycle)
            this.planet.update(tickRate, bioUpdate.biologicalImpact);
        }

        // 3. Render visuals (both macro and micro views update dynamically)
        this.visualizer.draw(this.planet, this.biology);

        // 4. Update panel values, progress bars, and atmospheric graphs
        this.ui.updateDashboard(this.planet, this.biology);

        // Keep loop running
        requestAnimationFrame((time) => this.loop(time));
    }
}

// Instantiate and start the simulator on page load
window.addEventListener('DOMContentLoaded', () => {
    new GameController();
});
