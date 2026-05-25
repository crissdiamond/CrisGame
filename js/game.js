import { Planet } from './planet.js';
import { BiologySimulation } from './simulation.js';
import { GameUI } from './ui.js';
import { GameVisualizer } from './visualization.js';
import { EventSystem } from './events.js';
import { HistoryRecorder } from './history.js';
import { HistoryView } from './historyView.js';

class GameController {
    constructor() {
        // Instantiate modules
        this.planet = new Planet();
        this.biology = new BiologySimulation();
        this.ui = new GameUI();
        this.visualizer = new GameVisualizer('simulation-canvas');
        this.eventSystem = new EventSystem();
        this.history = new HistoryRecorder();
        this.historyView = new HistoryView({
            envCanvasId: 'history-env',
            atmCanvasId: 'history-atm',
            bioCanvasId: 'history-bio',
            recorder: this.history
        });

        // Loop / Timing State
        this.isPlaying = false;
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

        // Nudges definition map
        const nudges = {
            'mitochondria': { id: 'endosymbiosis', cost: 8 },
            'mosses': { id: 'vascular_tissue', cost: 10 },
            'conifers': { id: 'seed_evolution', cost: 12 },
            'tetrapods': { id: 'amniotic_egg', cost: 12 },
            'sauropsids': { id: 'scales', cost: 12 },
            'synapsids': { id: 'endthermy', cost: 15 },
            'cognitive': { id: 'cognitive', cost: 15 },
            'ai': { id: 'technological_singularity', cost: 15 },
            'cyborg': { id: 'cybernetic_implants', cost: 18 },
            'noosphere': { id: 'global_consciousness', cost: 20 },
            'gaia_hivemind': { id: 'ecological_integration', cost: 20 },
            'silico_flora': { id: 'silicon_chains', cost: 12 },
            'crystalline_cognitive': { id: 'crystalline_collective', cost: 15 },
            'quantum_lattices': { id: 'quantum_alignment', cost: 18 },
            'cryo_hivemind': { id: 'cryo_neural_webs', cost: 18 },
            'cryo_beasts': { id: 'cryo_polymers', cost: 12 },
            'cryo_polymer_network': { id: 'cryo_singularity', cost: 15 },
            'thinking_ocean': { id: 'colloidal_solids', cost: 18 },
            'cryo_colloids': { id: 'macromolecular_assembly', cost: 18 }
        };

        // Bind UI triggers and controls
        this.ui.bindEvents({
            onLaunch: (config) => {
                this.planet.initializeProtoplanet(config);
                this.biology = new BiologySimulation();
                this.eventSystem = new EventSystem();
                this.history.reset();
                this.isPlaying = true;
                this.ui.setPlayState(this.isPlaying);
                this.ui.syncSliders(this.planet);
                
                const sizeLabel = config.planetSize.toUpperCase();
                const starLabel = config.starClass.replace('_', ' ').toUpperCase();
                this.ui.logEvent("PROTOPLANET INJECTED", `Star: ${starLabel} (${config.starSize}x), Orbit: ${config.orbitDistance} AU, Size: ${sizeLabel}`, "success");
                this.ui.logEvent("ENVIRONMENT DYNAMICS LOCKED", "Direct parameter controls disabled. Manage parameters via Interventions and Hazard deflections.", "system");
                
                // Force a render tick
                this.lastTime = performance.now();
            },
            
            // Interventions
            onIntervention: (type) => {
                const res = this.eventSystem.triggerIntervention(type, this.planet, this.biology);
                if (res.success) {
                    this.ui.logEvent(res.title, res.msg, "success");
                    this.ui.showMilestonePopup(res.title, res.msg, res.scientificDetails);
                    this.ui.syncSliders(this.planet);
                } else {
                    this.ui.logEvent("INTERVENTION FAILED", res.msg, "hazard");
                }
            },
            
            // Deflect active threat warning
            onDeflectThreat: (threatId) => {
                const res = this.eventSystem.deflectWarning(threatId);
                if (res.success) {
                    this.ui.logEvent("THREAT AVERTED", res.msg, "success");
                    // Immediately refresh the threat panel so the card disappears now,
                    // not on the next animation frame (important when paused).
                    this.ui.updateThreats(this.eventSystem.warnings);
                } else {
                    this.ui.logEvent("DEFLECTION FAILED", res.msg, "hazard");
                }
            },

            // Nudge evolution
            onNudgeEvolution: (nodeId) => {
                const nudge = nudges[nodeId];
                if (nudge) {
                    const res = this.eventSystem.nudgeEvolution(nudge.id, nudge.cost, this.biology);
                    if (res.success) {
                        this.ui.logEvent("EVOLUTION NUDGED", res.msg, "success");
                    } else {
                        this.ui.logEvent("NUDGE FAILED", res.msg, "hazard");
                    }
                }
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
        this.ui.logEvent("CURATOR TERMINAL ONLINE", "Awaiting Protoplanetary Configuration injection from Setup Terminal...", "system");

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
                    if (typeof evt.tokens === 'number') {
                        this.eventSystem.tokens = Math.min(99.0, this.eventSystem.tokens + evt.tokens);
                    }
                    this.history.recordEvent(evt, this.planet.age);
                    this.ui.logEvent(evt.title, evt.desc, evt.type, { tier: evt.tier, tokens: evt.tokens });
                    // Major and Singular breakthroughs always get the popup.
                    // Other 'success' (non-tiered) events keep their existing popup behavior.
                    if (evt.tier === 'MAJOR' || evt.tier === 'SINGULAR' || (evt.type === 'success' && !evt.tier)) {
                        this.ui.showMilestonePopup(evt.title, evt.desc, evt.scientificDetails);
                    }
                });
            }

            // 2. Tick random events and warning queues
            const eventLogs = this.eventSystem.tick(this.planet, this.biology, tickRate);
            if (eventLogs && eventLogs.length > 0) {
                eventLogs.forEach(evt => {
                    if (typeof evt.tokens === 'number') {
                        this.eventSystem.tokens = Math.min(99.0, this.eventSystem.tokens + evt.tokens);
                    }
                    this.history.recordEvent(evt, this.planet.age);
                    this.ui.logEvent(evt.title, evt.desc, evt.type, { tier: evt.tier, tokens: evt.tokens });
                    if (evt.tier === 'MAJOR' || evt.tier === 'SINGULAR' || evt.type === 'success' || evt.type === 'hazard') {
                        this.ui.showMilestonePopup(evt.title, evt.desc, evt.scientificDetails);
                    }
                });
                // Sync sliders back to planet values since events can alter targets
                this.ui.syncSliders(this.planet);
            }

            // 3. Update planet physical state using biological outputs (O2 / CO2 cycle)
            this.planet.update(tickRate, bioUpdate.biologicalImpact);

            // 4. Sample time-series history (real-time throttled inside the recorder)
            this.history.tick(dt, this.planet, this.biology);
        }

        // 3. Render visuals (both macro and micro views update dynamically)
        this.visualizer.draw(this.planet, this.biology);

        // 4. Update panel values, progress bars, and atmospheric graphs
        this.ui.updateDashboard(this.planet, this.biology);

        // Render history sparklines (cheap; renders trail even while paused)
        this.historyView.render();
        
        // Update warnings panel
        this.ui.updateThreats(this.eventSystem.warnings);

        // Update token readout directly from eventSystem
        this.ui.tokenBalance.textContent = Math.floor(this.eventSystem.tokens);

        // Update dynamic interventions modal compatibility/affordability state
        this.ui.updateInterventions(this.planet, this.biology, this.eventSystem);

        // Keep loop running
        requestAnimationFrame((time) => this.loop(time));
    }
}

// Instantiate and start the simulator on page load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
});
