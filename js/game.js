import { Planet } from './planet.js';
import { BiologySimulation } from './simulation.js';
import { GameUI } from './ui.js';
import { GameVisualizer } from './visualization.js';
import { EventSystem } from './events.js';
import { HistoryRecorder } from './history.js';
import { HistoryView } from './historyView.js';

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
        
        // Time scale: 1 real second = 0.1 Million Years (Myr) * activeSpeed
        this.timeScale = 0.1; 

        // Hotspot generation state
        this.hotspotTimer = 0;
        this.nextHotspotTime = 5 + Math.random() * 5;

        // Initialize bindings and setup initial state
        this.init();
    }

    init() {
        // Synchronize UI values with starting values of the planet
        this.ui.syncSliders(this.planet);
        this.ui.setPlayState(this.isPlaying);

        // Nudges definition map
        const nudges = {
            'mitochondria': { id: 'endosymbiosis', cost: 60 },
            'mosses': { id: 'vascular_tissue', cost: 75 },
            'conifers': { id: 'seed_evolution', cost: 90 },
            'tetrapods': { id: 'amniotic_egg', cost: 90 },
            'sauropsids': { id: 'scales', cost: 90 },
            'synapsids': { id: 'endthermy', cost: 110 },
            'cognitive': { id: 'cognitive', cost: 110 },
            'ai': { id: 'technological_singularity', cost: 110 },
            'cyborg': { id: 'cybernetic_implants', cost: 130 },
            'noosphere': { id: 'global_consciousness', cost: 150 },
            'gaia_hivemind': { id: 'ecological_integration', cost: 150 },
            'silico_flora': { id: 'silicon_chains', cost: 90 },
            'crystalline_cognitive': { id: 'crystalline_collective', cost: 110 },
            'quantum_lattices': { id: 'quantum_alignment', cost: 130 },
            'cryo_hivemind': { id: 'cryo_neural_webs', cost: 130 },
            'cryo_beasts': { id: 'cryo_polymers', cost: 90 },
            'cryo_polymer_network': { id: 'cryo_singularity', cost: 110 },
            'thinking_ocean': { id: 'colloidal_solids', cost: 130 },
            'cryo_colloids': { id: 'macromolecular_assembly', cost: 130 }
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
            
            onIntervention: (type) => {
                const res = this.eventSystem.triggerIntervention(type, this.planet, this.biology);
                if (res.success) {
                    this.ui.logEvent(res.title, res.msg, "success");
                    this.triggerPopup(res.title, res.msg, res.scientificDetails);
                    this.ui.syncSliders(this.planet);
                } else {
                    this.ui.logEvent("INTERVENTION FAILED", res.msg, "hazard");
                }
                return res;
            },
            
            // Deflect active threat warning
            onDeflectThreat: (threatId) => {
                const res = this.eventSystem.deflectWarning(threatId);
                if (res.success) {
                    this.ui.logEvent("THREAT AVERTED", res.msg, "success");
                    // Immediately refresh the threat panel so the card disappears now,
                    // not on the next animation frame (important when paused).
                    this.ui.updateThreats(this.eventSystem.warnings, this.eventSystem);
                } else {
                    this.ui.logEvent("DEFLECTION FAILED", res.msg, "hazard");
                }
                return res;
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
                        this.ui.logEvent("TOKEN EXCHANGE", "🔹 Converted 50 Mutagen tokens into 1 Silver Adaptation token.", "success");
                        return { success: true, msg: "Converted 50 Blue ➔ 1 Silver" };
                    }
                    return { success: false, msg: "Insufficient Mutagen tokens." };
                } else if (type === 'silver_gold') {
                    if (this.eventSystem.tokensSilver >= 50.0) {
                        this.eventSystem.tokensSilver -= 50.0;
                        this.eventSystem.tokensGold = Math.min(50.0, this.eventSystem.tokensGold + 1.0);
                        this.ui.logEvent("TOKEN EXCHANGE", "⚙️ Converted 50 Adaptation tokens into 1 Gold Deflection token.", "success");
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
                    this.ui.logEvent("SPEED LOCKED", "⚠️ Simulation speed restricted to 1x during active planetary threats.", "hazard");
                    return;
                }
                this.userSpeed = speed;
                this.activeSpeed = speed;
                this.timeScale = 0.1 * this.activeSpeed;
                this.ui.updateSpeedControls(this.userSpeed, this.activeSpeed, this.eventSystem.warnings.length > 0);
                this.ui.logEvent("SPEED ADJUSTED", `Simulation speed set to ${speed}x.`, "system");
            }
        });

        // Log opening console message
        this.ui.logEvent("CURATOR TERMINAL ONLINE", "Awaiting Protoplanetary Configuration injection from Setup Terminal...", "system");

        // Scan for saved states
        try {
            if (localStorage.getItem('evoplanet_save')) {
                this.ui.logEvent("LOCAL SCAN", "Saved state detected. Click 'Load' to restore previous configuration.", "success");
                this.ui.setupLoadBtn.style.display = 'block';
            } else {
                this.ui.logEvent("LOCAL SCAN", "No saved states found. Initialize a protoplanet to start.", "system");
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
                        this.ui.logEvent("SPEED RESTRICTED", "⚠️ Simulation speed locked to 1x during active planetary threats.", "alert");
                        this.speedLockedMessageLogged = true;
                    }
                    this.activeSpeed = 1;
                }
            } else {
                if (this.activeSpeed !== this.userSpeed) {
                    this.ui.logEvent("SPEED RESTORED", `🟢 Crisis resolved. Restoring simulation speed to ${this.userSpeed}x.`, "success");
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
                    this.ui.logEvent(evt.title, evt.desc, evt.type, { tier: evt.tier, tokens: rewardText });
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
                    this.ui.logEvent(evt.title, evt.desc, evt.type, { tier: evt.tier, tokens: rewardText });
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
                    this.ui.logEvent("BIOSPHERE HOTSPOT", `${symbol} A genetic hotspot emerged, yielding +${value} ${currencyName} Tokens.`, "success");
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
        this.ui.updateThreats(this.eventSystem.warnings, this.eventSystem);

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
                version: 1.0,
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
                    
                    chemoProkaryotePop: this.biology.chemoProkaryotePop,
                    anoxygenicPhotoPop: this.biology.anoxygenicPhotoPop,
                    unlockedChemoProkaryote: this.biology.unlockedChemoProkaryote,
                    unlockedAnoxygenicPhoto: this.biology.unlockedAnoxygenicPhoto,
                    oecStabilityTimer: this.biology.oecStabilityTimer,
                    thermalResilienceLevel: this.biology.thermalResilienceLevel,
                    radiationDefenseLevel: this.biology.radiationDefenseLevel,
                    metabolicEfficiencyLevel: this.biology.metabolicEfficiencyLevel,
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
                ui: {
                    scienceLogHTML: this.ui.scienceLog.innerHTML
                },
                visualizer: {
                    viewMode: this.visualizer.viewMode
                }
            };
            localStorage.setItem('evoplanet_save', JSON.stringify(data));
            this.ui.logEvent("STATE ENCRYPTED", "Simulation progress saved successfully to local archives.", "success");
            this.ui.showToast("Simulation progress saved successfully!", "success");
        } catch (err) {
            console.error("Save state failed:", err);
            this.ui.logEvent("SAVE FAILED", "Storage error encountered during serialization.", "hazard");
            this.ui.showToast("Save progress failed!", "hazard");
        }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem('evoplanet_save');
            if (!raw) {
                this.ui.logEvent("RESTORE FAILED", "No saved state detected in local storage.", "hazard");
                this.ui.showToast("No saved game state detected!", "hazard");
                return;
            }
            const data = JSON.parse(raw);

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
                    this.biology[key] = data.biology[key];
                }
            }
            if (!this.biology.unlockAges) {
                this.biology.unlockAges = {};
            }

            // Restore EventSystem
            this.eventSystem.tokensBlue = data.eventSystem.tokensBlue !== undefined ? data.eventSystem.tokensBlue : (data.eventSystem.tokens !== undefined ? data.eventSystem.tokens : 50.0);
            this.eventSystem.tokensSilver = data.eventSystem.tokensSilver !== undefined ? data.eventSystem.tokensSilver : 1.0;
            this.eventSystem.tokensGold = data.eventSystem.tokensGold !== undefined ? data.eventSystem.tokensGold : 0.0;
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
            this.ui.showToast("Simulation progress loaded successfully!", "success");
        } catch (err) {
            console.error("Load state failed:", err);
            this.ui.logEvent("RECOVERY ERROR", "Saved file corrupted or incompatible.", "hazard");
            this.ui.showToast("Load progress failed!", "hazard");
        }
    }
}

// Instantiate and start the simulator on page load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
});
