import { Planet } from './planet.js';
import { BiologySimulation } from './simulation.js';
import { GameUI } from './ui.js';
import { GameVisualizer } from './visualization.js';
import { EventSystem } from './events.js';
import { HistoryRecorder } from './history.js';
import { HistoryView } from './historyView.js';
import { getEvolutionNudge } from './evolutionData.js';

export class GameController {
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
        this.wasPlayingBeforePopup = false;
        
        // Simulation speed controls
        this.userSpeed = 1;
        this.activeSpeed = 1;
        this.speedLockedMessageLogged = false;
        this.popupQueue = [];
        this.logs = [];
        
        // Time scale: 1 real second = 0.1 Million Years (Myr) * activeSpeed
        this.timeScale = 0.1; 

        // Hotspot generation state
        this.hotspotTimer = 0;
        this.nextHotspotTime = 5 + Math.random() * 5;

        // Initialize bindings and setup initial state
        this.init();
    }

    logEvent(title, desc, type = 'system', meta = null, timestamp = null) {
        const ts = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.logs.push({ title, desc, type, meta, timestamp: ts });
        this.ui.logEvent(title, desc, type, meta, ts);
    }

    init() {
        // Synchronize UI values with starting values of the planet
        this.ui.syncSliders(this.planet);
        this.ui.setPlayState(this.isPlaying);

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
                this.logEvent("PROTOPLANET INJECTED", `Star: ${starLabel} (${config.starSize}x), Orbit: ${config.orbitDistance} AU, Size: ${sizeLabel}`, "success");
                this.logEvent("ENVIRONMENT DYNAMICS LOCKED", "Direct parameter controls disabled. Manage parameters via Interventions and Hazard deflections.", "system");
                
                // Force a render tick
                this.lastTime = performance.now();
            },
            
            onIntervention: (type) => {
                const res = this.eventSystem.triggerIntervention(type, this.planet, this.biology);
                if (res.success) {
                    this.logEvent(res.title, res.msg, "success");
                    this.triggerPopup(res.title, res.msg, res.scientificDetails);
                    this.ui.syncSliders(this.planet);
                } else {
                    this.logEvent("INTERVENTION FAILED", res.msg, "hazard");
                }
                return res;
            },
            
            // Deflect active threat warning
            onDeflectThreat: (threatId) => {
                const res = this.eventSystem.deflectWarning(threatId);
                if (res.success) {
                    this.logEvent("THREAT AVERTED", res.msg, "success");
                    // Immediately refresh the threat panel so the card disappears now,
                    // not on the next animation frame (important when paused).
                    this.ui.updateThreats(this.eventSystem.warnings, this.eventSystem, this.biology, this.planet);
                } else {
                    this.logEvent("DEFLECTION FAILED", res.msg, "hazard");
                }
                return res;
            },

            // Nudge evolution
            onNudgeEvolution: (nodeId) => {
                const nudge = getEvolutionNudge(nodeId, this.planet.activeSolvent);
                if (nudge) {
                    const res = this.eventSystem.nudgeEvolution(nudge.id, nudge.cost, this.biology);
                    if (res.success) {
                        this.logEvent("EVOLUTION NUDGED", res.msg, "success");
                        const nodeLabel = nudge.name || nudge.nodeName;
                        this.ui.showBoostToast(nodeLabel, 5, 3);
                    } else {
                        this.logEvent("NUDGE FAILED", res.msg, "hazard");
                        this.ui.showToast(res.msg, "hazard");
                    }
                    return res;
                }
                return { success: false, msg: "Invalid node for nudging." };
            },

            // Convert tokens
            onConvertTokens: (type) => {
                if (type === 'blue_silver') {
                    if (this.eventSystem.tokensBlue >= 50.0) {
                        this.eventSystem.tokensBlue -= 50.0;
                        this.eventSystem.tokensSilver = Math.min(200.0, this.eventSystem.tokensSilver + 1.0);
                        this.logEvent("TOKEN EXCHANGE", "🔹 Converted 50 Mutagen tokens into 1 Silver Adaptation token.", "success");
                        return { success: true, msg: "Converted 50 Blue ➔ 1 Silver" };
                    }
                    return { success: false, msg: "Insufficient Mutagen tokens." };
                } else if (type === 'silver_gold') {
                    if (this.eventSystem.tokensSilver >= 50.0) {
                        this.eventSystem.tokensSilver -= 50.0;
                        this.eventSystem.tokensGold = Math.min(50.0, this.eventSystem.tokensGold + 1.0);
                        this.logEvent("TOKEN EXCHANGE", "⚙️ Converted 50 Adaptation tokens into 1 Gold Deflection token.", "success");
                        return { success: true, msg: "Converted 50 Silver ➔ 1 Gold" };
                    }
                    return { success: false, msg: "Insufficient Adaptation tokens." };
                }
                return { success: false, msg: "Invalid conversion type." };
            },

            // Upgrade permanent genetic adaptation trait
            onUpgradeTrait: (traitType) => {
                let currentLevel = 0;
                let traitField = "";
                if (traitType === 'thermal') {
                    currentLevel = this.biology.thermalResilienceLevel || 0;
                    traitField = "thermalResilienceLevel";
                } else if (traitType === 'radiation') {
                    currentLevel = this.biology.radiationDefenseLevel || 0;
                    traitField = "radiationDefenseLevel";
                } else if (traitType === 'metabolic') {
                    currentLevel = this.biology.metabolicEfficiencyLevel || 0;
                    traitField = "metabolicEfficiencyLevel";
                }
                
                if (currentLevel >= 5) {
                    return { success: false, msg: `Your species' ${traitType} resilience has already reached maximum level.` };
                }
                
                const cost = Math.round(5 * Math.pow(2.2, currentLevel));
                if (this.eventSystem.tokensSilver >= cost) {
                    this.eventSystem.tokensSilver -= cost;
                    this.biology[traitField] = currentLevel + 1;
                    const names = {
                        thermal: "Thermal Resilience",
                        radiation: "Radiation Shielding",
                        metabolic: "Metabolic Efficiency"
                    };
                    return { 
                        success: true, 
                        msg: `Successfully upgraded ${names[traitType]} to Level ${currentLevel + 1}!`, 
                        newLevel: currentLevel + 1 
                    };
                } else {
                    return { success: false, msg: `Insufficient Silver tokens. Upgrading ${traitType} requires ${cost} Silver tokens.` };
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
            },

            onPopupClose: () => {
                if (this.popupQueue.length > 0) {
                    this.processPopupQueue();
                } else {
                    if (this.wasPlayingBeforePopup) {
                        this.isPlaying = true;
                        this.ui.setPlayState(this.isPlaying);
                        this.lastTime = performance.now(); // reset timer to avoid huge delta-time jump
                        this.wasPlayingBeforePopup = false;
                    }
                }
            },

            onChangeSpeed: (speed) => {
                if (this.eventSystem.warnings.length > 0 && speed > 1) {
                    this.logEvent("SPEED LOCKED", "⚠️ Simulation speed restricted to 1x during active planetary threats.", "hazard");
                    return;
                }
                this.userSpeed = speed;
                this.activeSpeed = speed;
                this.timeScale = 0.1 * this.activeSpeed;
                this.ui.updateSpeedControls(this.userSpeed, this.activeSpeed, this.eventSystem.warnings.length > 0);
                this.logEvent("SPEED ADJUSTED", `Simulation speed set to ${speed}x.`, "system");
            }
        });

        // Log opening console message
        this.logEvent("CURATOR TERMINAL ONLINE", "Awaiting Protoplanetary Configuration injection from Setup Terminal...", "system");

        // Scan for saved states
        try {
            if (localStorage.getItem('evoplanet_save')) {
                this.logEvent("LOCAL SCAN", "Saved state detected. Click 'Load' to restore previous configuration.", "success");
                this.ui.setupLoadBtn.style.display = 'block';
            } else {
                this.logEvent("LOCAL SCAN", "No saved states found. Initialize a protoplanet to start.", "system");
                this.ui.setupLoadBtn.style.display = 'none';
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
            // Constrain simulation speed if active threats exist
            const hasWarnings = this.eventSystem.warnings.length > 0;
            if (hasWarnings) {
                if (this.activeSpeed !== 1) {
                    if (!this.speedLockedMessageLogged) {
                        this.logEvent("SPEED RESTRICTED", "⚠️ Simulation speed locked to 1x during active planetary threats.", "alert");
                        this.speedLockedMessageLogged = true;
                    }
                    this.activeSpeed = 1;
                }
            } else {
                if (this.activeSpeed !== this.userSpeed) {
                    this.logEvent("SPEED RESTORED", `🟢 Crisis resolved. Restoring simulation speed to ${this.userSpeed}x.`, "success");
                    this.activeSpeed = this.userSpeed;
                    this.speedLockedMessageLogged = false;
                }
            }
            this.timeScale = 0.1 * this.activeSpeed;

            // Convert real-world time step into Million Years (Myr)
            const tickRate = dt * this.timeScale;

            const bioUpdate = this.biology.update(tickRate, this.planet);

            // Print any biological milestones / events to the science feed
            if (bioUpdate.events && bioUpdate.events.length > 0) {
                bioUpdate.events.forEach(evt => {
                    const rarityTier = evt.tier;
                    let rewardText = null;
                    if (rarityTier === 'COMMON') {
                        this.eventSystem.tokensBlue = Math.min(900.0, this.eventSystem.tokensBlue + 25);
                        rewardText = "+25 Mutagen (🔹)";
                    } else if (rarityTier === 'NOTABLE') {
                        this.eventSystem.tokensBlue = Math.min(900.0, this.eventSystem.tokensBlue + 50);
                        this.eventSystem.tokensSilver = Math.min(200.0, this.eventSystem.tokensSilver + 5);
                        rewardText = "+50 Mutagen (🔹), +5 Adapt (🥈)";
                    } else if (rarityTier === 'MAJOR') {
                        this.eventSystem.tokensSilver = Math.min(200.0, this.eventSystem.tokensSilver + 15);
                        this.eventSystem.tokensGold = Math.min(50.0, this.eventSystem.tokensGold + 1);
                        rewardText = "+15 Adapt (🥈), +1 Deflect (🛡️)";
                    } else if (rarityTier === 'SINGULAR') {
                        this.eventSystem.tokensSilver = Math.min(200.0, this.eventSystem.tokensSilver + 30);
                        this.eventSystem.tokensGold = Math.min(50.0, this.eventSystem.tokensGold + 5);
                        rewardText = "+30 Adapt (🥈), +5 Deflect (🛡️)";
                    }
                    this.history.recordEvent(evt, this.planet.age);
                    this.logEvent(evt.title, evt.desc, evt.type, { tier: evt.tier, tokens: rewardText });
                    // Major and Singular breakthroughs always get the popup.
                    // Other 'success' (non-tiered) events keep their existing popup behavior.
                    if (evt.tier === 'MAJOR' || evt.tier === 'SINGULAR' || (evt.type === 'success' && !evt.tier)) {
                        this.triggerPopup(evt.title, evt.desc, evt.scientificDetails, rewardText);
                    }
                });
            }

            // 2. Tick random events and warning queues
            const eventLogs = this.eventSystem.tick(this.planet, this.biology, tickRate);
            if (eventLogs && eventLogs.length > 0) {
                eventLogs.forEach(evt => {
                    const rarityTier = evt.tier;
                    let rewardText = null;
                    if (rarityTier === 'COMMON') {
                        this.eventSystem.tokensBlue = Math.min(900.0, this.eventSystem.tokensBlue + 25);
                        rewardText = "+25 Mutagen (🔹)";
                    } else if (rarityTier === 'NOTABLE') {
                        this.eventSystem.tokensBlue = Math.min(900.0, this.eventSystem.tokensBlue + 50);
                        this.eventSystem.tokensSilver = Math.min(200.0, this.eventSystem.tokensSilver + 5);
                        rewardText = "+50 Mutagen (🔹), +5 Adapt (🥈)";
                    } else if (rarityTier === 'MAJOR') {
                        this.eventSystem.tokensSilver = Math.min(200.0, this.eventSystem.tokensSilver + 15);
                        this.eventSystem.tokensGold = Math.min(50.0, this.eventSystem.tokensGold + 1);
                        rewardText = "+15 Adapt (🥈), +1 Deflect (🛡️)";
                    } else if (rarityTier === 'SINGULAR') {
                        this.eventSystem.tokensSilver = Math.min(200.0, this.eventSystem.tokensSilver + 30);
                        this.eventSystem.tokensGold = Math.min(50.0, this.eventSystem.tokensGold + 5);
                        rewardText = "+30 Adapt (🥈), +5 Deflect (🛡️)";
                    }
                    this.history.recordEvent(evt, this.planet.age);
                    this.logEvent(evt.title, evt.desc, evt.type, { tier: evt.tier, tokens: rewardText });
                    if (evt.tier === 'MAJOR' || evt.tier === 'SINGULAR' || evt.type === 'success' || evt.type === 'hazard' || evt.type === 'alert') {
                        const isDetection = evt.title.includes("DETECTED");
                        const warningMeta = isDetection ? { id: evt.warningId, cost: evt.warningCost } : null;
                        this.triggerPopup(evt.title, evt.desc, evt.scientificDetails, isDetection ? null : rewardText, warningMeta);
                    }
                });
                // Sync sliders back to planet values since events can alter targets
                this.ui.syncSliders(this.planet);
            }

            // 3. Update planet physical state using biological outputs (O2 / CO2 cycle)
            this.planet.update(tickRate, bioUpdate.biologicalImpact);

            // 4. Sample time-series history (real-time throttled inside the recorder)
            this.history.tick(dt, this.planet, this.biology);

            // 5. Periodic Hotspot Spawning (every 5-10 seconds)
            this.hotspotTimer += dt;
            if (this.hotspotTimer >= this.nextHotspotTime) {
                this.hotspotTimer = 0;
                this.nextHotspotTime = 5 + Math.random() * 5;
                if (this.planet.getHabitabilityScore() > 10) {
                    const lon = Math.random() * Math.PI * 2;
                    const yFactor = (Math.random() - 0.5) * 1.6; // between -0.8 and 0.8
                    
                    const roll = Math.random();
                    let type = 'blue';
                    let value = 0;
                    let currencyName = "Mutagen";
                    let symbol = "🔹";
                    
                    if (roll < 0.80) {
                        type = 'blue';
                        value = Math.floor(Math.random() * 21) + 10; // 10..30 Blue
                        this.eventSystem.tokensBlue = Math.min(900.0, this.eventSystem.tokensBlue + value);
                    } else if (roll < 0.95) {
                        type = 'silver';
                        value = Math.floor(Math.random() * 6) + 3; // 3..8 Silver
                        this.eventSystem.tokensSilver = Math.min(200.0, this.eventSystem.tokensSilver + value);
                        currencyName = "Adaptation";
                        symbol = "🥈";
                    } else {
                        type = 'gold';
                        value = Math.floor(Math.random() * 2) + 1; // 1..2 Gold
                        this.eventSystem.tokensGold = Math.min(50.0, this.eventSystem.tokensGold + value);
                        currencyName = "Deflection";
                        symbol = "🛡️";
                    }
                    
                    this.visualizer.spawnHotspot(lon, yFactor, value, type);
                    this.logEvent("BIOSPHERE HOTSPOT", `${symbol} A genetic hotspot emerged, yielding +${value} ${currencyName} Tokens.`, "success");
                }
            }
        }

        // 3. Render visuals (both macro and micro views update dynamically)
        this.visualizer.draw(this.planet, this.biology);

        // 4. Update panel values, progress bars, and atmospheric graphs
        this.ui.updateDashboard(this.planet, this.biology);

        // Render history sparklines (cheap; renders trail even while paused)
        this.historyView.render();
        
        // Update warnings panel
        this.ui.updateThreats(this.eventSystem.warnings, this.eventSystem, this.biology, this.planet);

        // Update speed controls visually
        this.ui.updateSpeedControls(this.userSpeed, this.activeSpeed, this.eventSystem.warnings.length > 0);

        // Update token readout directly from eventSystem
        this.ui.tokenBalanceBlue.textContent = Math.floor(this.eventSystem.tokensBlue);
        this.ui.tokenBalanceSilver.textContent = Math.floor(this.eventSystem.tokensSilver);
        this.ui.tokenBalanceGold.textContent = Math.floor(this.eventSystem.tokensGold);

        // Update dynamic interventions modal compatibility/affordability state
        this.ui.updateInterventions(this.planet, this.biology, this.eventSystem);

        // Keep loop running
        requestAnimationFrame((time) => this.loop(time));
    }

    triggerPopup(title, desc, details, rewardTokens = null, warningMeta = null) {
        if (this.isPlaying) {
            this.isPlaying = false;
            this.ui.setPlayState(this.isPlaying);
            this.wasPlayingBeforePopup = true;
        }
        this.popupQueue.push({ title, desc, details, rewardTokens, warningMeta });
        this.processPopupQueue();
    }

    processPopupQueue() {
        if (this.ui.isPopupVisible()) {
            return;
        }
        if (this.popupQueue.length > 0) {
            const nextPopup = this.popupQueue.shift();
            this.ui.showMilestonePopup(
                nextPopup.title,
                nextPopup.desc,
                nextPopup.details,
                nextPopup.rewardTokens,
                nextPopup.warningMeta,
                this.eventSystem
            );
        }
    }

    saveGame() {
        try {
            const data = {
                version: 1.1,
                saveVersion: 1.1,
                timestamp: Date.now(),
                userSpeed: this.userSpeed,
                isPlaying: this.isPlaying,
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
                    biomassMap: this.biology.biomassMap,
                    biodiversityMap: this.biology.biodiversityMap,
                    unlockedMap: this.biology.unlockedMap,
                    chemoProkaryotePop: this.biology.chemoProkaryotePop,
                    unlockedChemoProkaryote: this.biology.unlockedChemoProkaryote,
                    oecStabilityTimer: this.biology.oecStabilityTimer,
                    thermalResilienceLevel: this.biology.thermalResilienceLevel,
                    radiationDefenseLevel: this.biology.radiationDefenseLevel,
                    metabolicEfficiencyLevel: this.biology.metabolicEfficiencyLevel,
                    activeAdaptations: Array.from(this.biology.activeAdaptations),
                    pendingNudges: this.biology.pendingNudges,
                    radiationResistance: this.biology.radiationResistance,
                    unlockAges: this.biology.unlockAges
                },
                eventSystem: {
                    tokensBlue: this.eventSystem.tokensBlue,
                    tokensSilver: this.eventSystem.tokensSilver,
                    tokensGold: this.eventSystem.tokensGold,
                    tokens: this.eventSystem.tokensBlue, // Legacy fallback
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
                logs: this.logs,
                visualizer: {
                    viewMode: this.visualizer.viewMode
                }
            };
            localStorage.setItem('evoplanet_save', JSON.stringify(data));
            this.logEvent("STATE ENCRYPTED", "Simulation progress saved successfully to local archives.", "success");
            this.ui.showToast("Simulation progress saved successfully!", "success");
        } catch (err) {
            console.error("Save state failed:", err);
            this.logEvent("SAVE FAILED", "Storage error encountered during serialization.", "hazard");
            this.ui.showToast("Save progress failed!", "hazard");
        }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem('evoplanet_save');
            if (!raw) {
                this.logEvent("RESTORE FAILED", "No saved state detected in local storage.", "hazard");
                this.ui.showToast("No saved game state detected!", "hazard");
                return;
            }
            const data = JSON.parse(raw);

            // Validation: Ensure main sections exist and are valid objects
            if (!data || typeof data !== 'object') {
                throw new Error("Save data is not a valid object.");
            }
            if (!data.planet || typeof data.planet !== 'object') {
                throw new Error("Planet parameters missing or corrupted.");
            }
            if (!data.biology || typeof data.biology !== 'object') {
                throw new Error("Biology parameters missing or corrupted.");
            }
            if (!data.eventSystem || typeof data.eventSystem !== 'object') {
                throw new Error("Event parameters missing or corrupted.");
            }
            if (!data.history || typeof data.history !== 'object') {
                throw new Error("History telemetry parameters missing or corrupted.");
            }

            // Sanitize planet numeric properties to prevent NaNs or non-finite values
            const criticalPlanetKeys = ['temperature', 'waterCoverage', 'ammoniaCoverage', 'methaneCoverage', 'radiation', 'age'];
            for (const key of criticalPlanetKeys) {
                if (data.planet[key] !== undefined) {
                    const val = Number(data.planet[key]);
                    if (!Number.isFinite(val)) {
                        data.planet[key] = key === 'temperature' ? 15.0 : (key === 'waterCoverage' ? 30.0 : 0.0);
                    } else {
                        data.planet[key] = val;
                    }
                }
            }

            if (typeof data.isPlaying === 'boolean') {
                this.isPlaying = data.isPlaying;
            } else {
                this.isPlaying = true;
            }
            this.ui.setupModal.style.display = 'none';

            if (typeof data.userSpeed === 'number') {
                this.userSpeed = data.userSpeed;
            } else {
                this.userSpeed = 1;
            }
            this.activeSpeed = data.eventSystem.warnings.length > 0 ? 1 : this.userSpeed;
            this.timeScale = 0.1 * this.activeSpeed;

            // Restore Planet
            for (const key in data.planet) {
                this.planet[key] = data.planet[key];
            }

            // Restore Biology
            for (const key in data.biology) {
                if (key === 'activeAdaptations') {
                    this.biology.activeAdaptations = new Set(data.biology.activeAdaptations);
                } else {
                    if ((key === 'biomassMap' || key === 'biodiversityMap' || key === 'unlockedMap') && !data.biology[key]) {
                        continue;
                    }
                    this.biology[key] = data.biology[key];
                }
            }
            // Migration for older saves: rebuild maps if missing
            if (!this.biology.biomassMap || Object.keys(this.biology.biomassMap).length === 0) {
                this.biology.biomassMap = {};
                this.biology.unlockedMap = {};
                
                // Setters on the class will have already run and written flat fields into the maps
                // so we just make sure everything is initialized
            }
            if (!this.biology.biodiversityMap || Object.keys(this.biology.biodiversityMap).length === 0) {
                this.biology.biodiversityMap = {};
                // Import target to populate
                import('./evolutionData.js').then(({ EVOLUTION_GRAPH }) => {
                    for (const solvent in EVOLUTION_GRAPH) {
                        for (const nodeId in EVOLUTION_GRAPH[solvent]) {
                            if (this.biology.unlockedMap[nodeId]) {
                                this.biology.biodiversityMap[nodeId] = Math.max(1, Math.floor((this.biology.biomassMap[nodeId] || 0) * 1.5));
                            } else {
                                this.biology.biodiversityMap[nodeId] = 0;
                            }
                        }
                    }
                }).catch(() => {});
            }
            if (!this.biology.unlockAges) {
                this.biology.unlockAges = {};
            }

            // Restore EventSystem
            this.eventSystem.tokensBlue = data.eventSystem.tokensBlue !== undefined ? data.eventSystem.tokensBlue : (data.eventSystem.tokens !== undefined ? data.eventSystem.tokens : 50.0);
            this.eventSystem.tokensSilver = data.eventSystem.tokensSilver !== undefined ? data.eventSystem.tokensSilver : 1.0;
            this.eventSystem.tokensGold = data.eventSystem.tokensGold !== undefined ? data.eventSystem.tokensGold : 0.0;
            this.eventSystem.timeAccumulator = data.eventSystem.timeAccumulator;
            this.eventSystem.prevUnlocks = { ...(data.eventSystem.prevUnlocks || {}) };
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
                        cost: 6,
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
            if (data.history.markers && Array.isArray(data.history.markers)) {
                data.history.markers.forEach((m, idx) => {
                    if (m) this.history.markers[idx] = m;
                });
            }

            // Restore UI and Visuals
            this.ui.clearLog();
            this.logs = [];
            if (data.logs && Array.isArray(data.logs)) {
                this.logs = data.logs;
                this.logs.forEach(log => {
                    this.ui.logEvent(log.title, log.desc, log.type, log.meta, log.timestamp);
                });
            } else if (data.ui && typeof data.ui.scienceLogHTML === 'string') {
                this.ui.scienceLog.innerHTML = data.ui.scienceLogHTML;
            }

            const viewMode = (data.visualizer && data.visualizer.viewMode) || 'planet';
            this.visualizer.setViewMode(viewMode);
            this.ui.updateViewModeLabel(viewMode);
            
            // Sync dashboard & controls
            this.ui.syncSliders(this.planet);
            
            // Make sure simulation loops resume from active play state
            this.ui.setPlayState(this.isPlaying);
            
            // Redraw everything once immediately to avoid any lag frame
            this.visualizer.draw(this.planet, this.biology);
            this.ui.updateDashboard(this.planet, this.biology);
            this.historyView.render();

            this.logEvent("STATE RESTORED", "Simulation state successfully synchronized to local storage archive.", "success");
            this.ui.showToast("Simulation progress loaded successfully!", "success");
        } catch (err) {
            console.error("Load state failed:", err);
            this.logEvent("RECOVERY ERROR", "Saved file corrupted or incompatible.", "hazard");
            this.ui.showToast("Load progress failed!", "hazard");
        }
    }
}

// Instantiate and start the simulator on page load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
});
