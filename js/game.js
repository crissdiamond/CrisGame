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
            
            onToggleView: () => {
                const nextMode = this.visualizer.viewMode === 'macro' ? 'micro' : 'macro';
                this.visualizer.setViewMode(nextMode);
                this.ui.updateViewModeLabel(nextMode);
            },

            onSaveState: () => {
                this.saveGame();
            },

            onLoadState: () => {
                this.loadGame();
            }
        });

        // Log opening console message
        this.ui.logEvent("CURATOR TERMINAL ONLINE", "Awaiting Protoplanetary Configuration injection from Setup Terminal...", "system");

        // Scan for saved states
        try {
            if (localStorage.getItem('evoplanet_save')) {
                this.ui.logEvent("LOCAL SCAN", "Saved state detected. Click 'Load' to restore previous configuration.", "success");
            } else {
                this.ui.logEvent("LOCAL SCAN", "No saved states found. Initialize a protoplanet to start.", "system");
            }
        } catch (e) {
            // localStorage not available
        }

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

    saveGame() {
        try {
            const data = {
                version: 1.0,
                timestamp: Date.now(),
                planet: {
                    temperature: this.planet.temperature,
                    waterCoverage: this.planet.waterCoverage,
                    ammoniaCoverage: this.planet.ammoniaCoverage,
                    methaneCoverage: this.planet.methaneCoverage,
                    radiation: this.planet.radiation,
                    
                    targetTemperature: this.planet.targetTemperature,
                    targetWaterCoverage: this.planet.targetWaterCoverage,
                    targetAmmoniaCoverage: this.planet.targetAmmoniaCoverage,
                    targetMethaneCoverage: this.planet.targetMethaneCoverage,
                    targetRadiation: this.planet.targetRadiation,
                    
                    co2: this.planet.co2,
                    n2: this.planet.n2,
                    o2: this.planet.o2,
                    ch4: this.planet.ch4,
                    h2: this.planet.h2,
                    
                    atmospherePressure: this.planet.atmospherePressure,
                    magneticStrength: this.planet.magneticStrength,
                    hasMagnetosphere: this.planet.hasMagnetosphere,
                    ozone: this.planet.ozone,
                    
                    age: this.planet.age,
                    starAge: this.planet.starAge,
                    starLuminosity: this.planet.starLuminosity,
                    
                    isDisasterActive: this.planet.isDisasterActive,
                    disasterDuration: this.planet.disasterDuration,
                    hasMoon: this.planet.hasMoon,
                    isGlaciated: this.planet.isGlaciated,
                    activeSolvent: this.planet.activeSolvent,
                    
                    impactTemperatureOffset: this.planet.impactTemperatureOffset,
                    impactOffsetDecayRate: this.planet.impactOffsetDecayRate,
                    impactCooldownMyr: this.planet.impactCooldownMyr,
                    nextImpactTemperatureOffset: this.planet.nextImpactTemperatureOffset,
                    nextImpactCooldownMyr: this.planet.nextImpactCooldownMyr,
                    nextImpactOffsetDecayRate: this.planet.nextImpactOffsetDecayRate,
                    
                    starClass: this.planet.starClass,
                    starSize: this.planet.starSize,
                    orbitDistance: this.planet.orbitDistance,
                    planetSize: this.planet.planetSize,
                    initialVolatiles: this.planet.initialVolatiles,
                    initialIron: this.planet.initialIron,
                    initialCarbon: this.planet.initialCarbon,
                    
                    dustVeilActive: this.planet.dustVeilActive,
                    orbitalPerturbationActive: this.planet.orbitalPerturbationActive
                },
                biology: {
                    organicSoup: this.biology.organicSoup,
                    anaerobicPop: this.biology.anaerobicPop,
                    photosyntheticPop: this.biology.photosyntheticPop,
                    eukaryoticPop: this.biology.eukaryoticPop,
                    multicellularPop: this.biology.multicellularPop,
                    
                    spongesPop: this.biology.spongesPop,
                    medusesPop: this.biology.medusesPop,
                    wormsPop: this.biology.wormsPop,
                    fishPop: this.biology.fishPop,
                    
                    mossesPop: this.biology.mossesPop,
                    fernsPop: this.biology.fernsPop,
                    conifersPop: this.biology.conifersPop,
                    angiospermsPop: this.biology.angiospermsPop,
                    
                    cambrianPop: this.biology.cambrianPop,
                    landPlantsPop: this.biology.landPlantsPop,
                    arthropodPop: this.biology.arthropodPop,
                    tetrapodPop: this.biology.tetrapodPop,
                    sauropsidPop: this.biology.sauropsidPop,
                    synapsidPop: this.biology.synapsidPop,
                    cognitiveSpeciesPop: this.biology.cognitiveSpeciesPop,
                    technologicalAIPop: this.biology.technologicalAIPop,
                    cyborgPop: this.biology.cyborgPop,
                    noospherePop: this.biology.noospherePop,
                    gaiaHivemindPop: this.biology.gaiaHivemindPop,
                    
                    unlockedSoup: this.biology.unlockedSoup,
                    unlockedMembrane: this.biology.unlockedMembrane,
                    unlockedBacteria: this.biology.unlockedBacteria,
                    unlockedAnaerobic: this.biology.unlockedAnaerobic,
                    unlockedPhotosynthetic: this.biology.unlockedPhotosynthetic,
                    unlockedNucleus: this.biology.unlockedNucleus,
                    unlockedMitochondria: this.biology.unlockedMitochondria,
                    unlockedSexualReproduction: this.biology.unlockedSexualReproduction,
                    unlockedEukaryotic: this.biology.unlockedEukaryotic,
                    unlockedMulticellular: this.biology.unlockedMulticellular,
                    
                    unlockedSponges: this.biology.unlockedSponges,
                    unlockedMeduses: this.biology.unlockedMeduses,
                    unlockedWorms: this.biology.unlockedWorms,
                    unlockedFish: this.biology.unlockedFish,
                    
                    unlockedMosses: this.biology.unlockedMosses,
                    unlockedFerns: this.biology.unlockedFerns,
                    unlockedConifers: this.biology.unlockedConifers,
                    unlockedAngiosperms: this.biology.unlockedAngiosperms,
                    
                    unlockedCambrian: this.biology.unlockedCambrian,
                    unlockedLandPlants: this.biology.unlockedLandPlants,
                    unlockedArthropod: this.biology.unlockedArthropod,
                    unlockedTetrapod: this.biology.unlockedTetrapod,
                    unlockedSauropsid: this.biology.unlockedSauropsid,
                    unlockedSynapsid: this.biology.unlockedSynapsid,
                    unlockedCognitive: this.biology.unlockedCognitive,
                    unlockedTechnologicalAI: this.biology.unlockedTechnologicalAI,
                    unlockedCyborg: this.biology.unlockedCyborg,
                    unlockedNoosphere: this.biology.unlockedNoosphere,
                    unlockedGaiaHivemind: this.biology.unlockedGaiaHivemind,
                    
                    ammonicSoup: this.biology.ammonicSoup,
                    ammonicProtoPop: this.biology.ammonicProtoPop,
                    ammonicMultiPop: this.biology.ammonicMultiPop,
                    silicoFloraPop: this.biology.silicoFloraPop,
                    cryoFaunaPop: this.biology.cryoFaunaPop,
                    crystallineCognitivePop: this.biology.crystallineCognitivePop,
                    quantumLatticePop: this.biology.quantumLatticePop,
                    cryoHivemindPop: this.biology.cryoHivemindPop,
                    
                    unlockedAmmonicSoup: this.biology.unlockedAmmonicSoup,
                    unlockedAmmonicProto: this.biology.unlockedAmmonicProto,
                    unlockedAmmonicMulti: this.biology.unlockedAmmonicMulti,
                    unlockedSilicoFlora: this.biology.unlockedSilicoFlora,
                    unlockedCryoFauna: this.biology.unlockedCryoFauna,
                    unlockedCrystallineCognitive: this.biology.unlockedCrystallineCognitive,
                    unlockedQuantumLattice: this.biology.unlockedQuantumLattice,
                    unlockedCryoHivemind: this.biology.unlockedCryoHivemind,
                    
                    methaneSoup: this.biology.methaneSoup,
                    methaneProtoPop: this.biology.methaneProtoPop,
                    methaneMultiPop: this.biology.methaneMultiPop,
                    cryoOrganismsPop: this.biology.cryoOrganismsPop,
                    cryoPolymerNetworkPop: this.biology.cryoPolymerNetworkPop,
                    thinkingOceanPop: this.biology.thinkingOceanPop,
                    cryoColloidPop: this.biology.cryoColloidPop,
                    
                    unlockedMethaneSoup: this.biology.unlockedMethaneSoup,
                    unlockedMethaneProto: this.biology.unlockedMethaneProto,
                    unlockedMethaneMulti: this.biology.unlockedMethaneMulti,
                    unlockedCryoOrganisms: this.biology.unlockedCryoOrganisms,
                    unlockedCryoPolymerNetwork: this.biology.unlockedCryoPolymerNetwork,
                    unlockedThinkingOcean: this.biology.unlockedThinkingOcean,
                    unlockedCryoColloid: this.biology.unlockedCryoColloid,
                    
                    activeAdaptations: Array.from(this.biology.activeAdaptations),
                    pendingNudges: this.biology.pendingNudges,
                    radiationResistance: this.biology.radiationResistance
                },
                eventSystem: {
                    tokens: this.eventSystem.tokens,
                    timeAccumulator: this.eventSystem.timeAccumulator,
                    prevUnlocks: this.eventSystem.prevUnlocks,
                    triggeredUniqueEvents: Array.from(this.eventSystem.triggeredUniqueEvents),
                    activeEvents: this.eventSystem.activeEvents.map(e => ({
                        id: e.id,
                        name: e.name,
                        remainingDuration: e.remainingDuration
                    })),
                    warnings: this.eventSystem.warnings.map(w => ({
                        id: w.id,
                        durationRemaining: w.durationRemaining,
                        type: w.type
                    }))
                },
                history: {
                    writeIndex: this.history.writeIndex,
                    count: this.history.count,
                    accumulator: this.history.accumulator,
                    markerWrite: this.history.markerWrite,
                    markerCount: this.history.markerCount,
                    firstSimAgeMyr: this.history.firstSimAgeMyr,
                    latestSimAgeMyr: this.history.latestSimAgeMyr,
                    simAges: Array.from(this.history.simAges),
                    series: Object.fromEntries(
                        Object.entries(this.history.series).map(([key, val]) => [key, Array.from(val)])
                    ),
                    markers: this.history.markers.slice(0, this.history.markerCount)
                },
                ui: {
                    scienceLogHTML: this.ui.scienceLog.innerHTML
                },
                visualizer: {
                    viewMode: this.visualizer.viewMode
                }
            };
            localStorage.setItem('evoplanet_save', JSON.stringify(data));
            this.ui.logEvent("STATE ENCRYPTED", "Simulation progress saved successfully to local archives.", "success");
        } catch (err) {
            console.error("Save state failed:", err);
            this.ui.logEvent("SAVE FAILED", "Storage error encountered during serialization.", "hazard");
        }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem('evoplanet_save');
            if (!raw) {
                this.ui.logEvent("RESTORE FAILED", "No saved state detected in local storage.", "hazard");
                return;
            }
            const data = JSON.parse(raw);

            // Restore Planet
            for (const key in data.planet) {
                this.planet[key] = data.planet[key];
            }

            // Restore Biology
            for (const key in data.biology) {
                if (key === 'activeAdaptations') {
                    this.biology.activeAdaptations = new Set(data.biology.activeAdaptations);
                } else {
                    this.biology[key] = data.biology[key];
                }
            }

            // Restore EventSystem
            this.eventSystem.tokens = data.eventSystem.tokens;
            this.eventSystem.timeAccumulator = data.eventSystem.timeAccumulator;
            this.eventSystem.prevUnlocks = { ...data.eventSystem.prevUnlocks };
            this.eventSystem.triggeredUniqueEvents = new Set(data.eventSystem.triggeredUniqueEvents);
            this.eventSystem.activeEvents = data.eventSystem.activeEvents.map(e => ({
                id: e.id,
                name: e.name,
                remainingDuration: e.remainingDuration
            }));
            
            // Rebuild warnings
            this.eventSystem.warnings = data.eventSystem.warnings.map(savedWarning => {
                if (savedWarning.id === 'dynamo_decay') {
                    return {
                        id: 'dynamo_decay',
                        name: "MAGNETIC FIELD CRITICAL",
                        description: "Convective core cooling. Shield strength has dropped below 40%. Magnetosphere collapse imminent.",
                        scientificDetails: "As the outer nickel-iron core cools, thermal convection currents decline. This slows the geodynamo, weakening and ultimately collapsing the protective magnetosphere shield that diverts high-energy stellar winds.",
                        durationRemaining: savedWarning.durationRemaining,
                        cost: 15,
                        type: "alert",
                        apply: (p, b) => {
                            p.hasMagnetosphere = false;
                            p.magneticStrength = 10.0;
                            return "Magnetosphere collapsed! Atmosphere stripping active.";
                        }
                    };
                } else {
                    const registryEvent = this.eventSystem.eventsRegistry.find(e => e.id === savedWarning.id);
                    if (registryEvent) {
                        return {
                            id: registryEvent.id,
                            name: registryEvent.name,
                            description: registryEvent.description,
                            scientificDetails: registryEvent.scientificDetails,
                            durationRemaining: savedWarning.durationRemaining,
                            cost: registryEvent.cost,
                            apply: registryEvent.apply,
                            type: savedWarning.type || (typeof registryEvent.type === 'function' ? registryEvent.type(this.planet, this.biology) : registryEvent.type)
                        };
                    }
                    return null;
                }
            }).filter(Boolean);

            // Restore HistoryRecorder
            this.history.writeIndex = data.history.writeIndex;
            this.history.count = data.history.count;
            this.history.accumulator = data.history.accumulator;
            this.history.markerWrite = data.history.markerWrite;
            this.history.markerCount = data.history.markerCount;
            this.history.firstSimAgeMyr = data.history.firstSimAgeMyr;
            this.history.latestSimAgeMyr = data.history.latestSimAgeMyr;
            this.history.simAges = new Float32Array(data.history.simAges);
            
            for (const key in data.history.series) {
                this.history.series[key] = new Float32Array(data.history.series[key]);
            }
            
            // Reconstruct markers array
            this.history.markers = new Array(this.history.markerCapacity);
            data.history.markers.forEach((m, idx) => {
                if (m) this.history.markers[idx] = m;
            });

            // Restore UI and Visuals
            this.ui.scienceLog.innerHTML = data.ui.scienceLogHTML;
            this.visualizer.setViewMode(data.visualizer.viewMode);
            this.ui.updateViewModeLabel(data.visualizer.viewMode);
            
            // Sync dashboard & controls
            this.ui.syncSliders(this.planet);
            
            // Make sure simulation loops resume from active play state
            this.ui.setPlayState(this.isPlaying);
            
            // Redraw everything once immediately to avoid any lag frame
            this.visualizer.draw(this.planet, this.biology);
            this.ui.updateDashboard(this.planet, this.biology);
            this.historyView.render();

            this.ui.logEvent("STATE RESTORED", "Simulation state successfully synchronized to local storage archive.", "success");
        } catch (err) {
            console.error("Load state failed:", err);
            this.ui.logEvent("RECOVERY ERROR", "Saved file corrupted or incompatible.", "hazard");
        }
    }
}

// Instantiate and start the simulator on page load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
});
