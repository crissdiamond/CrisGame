import { Planet } from '../js/planet.js';
import { BiologySimulation } from '../js/simulation.js';
import { EventSystem } from '../js/events.js';
import { HistoryRecorder } from '../js/history.js';

console.log("── Running Biology & Climate Simulation Smoke Test ──");

try {
    // 1. Instantiation
    console.log("Instantiating modules...");
    const planet = new Planet();
    const biology = new BiologySimulation();
    const eventSystem = new EventSystem();
    const history = new HistoryRecorder();
    
    console.log("✓ All modules instantiated successfully.");

    // 2. Validate Initial States
    if (planet.temperature !== 15.0) throw new Error("Incorrect initial planet temperature");
    if (biology.organicSoup !== 0.0) throw new Error("Incorrect initial organic soup value");
    if (eventSystem.tokensBlue !== 50.0) throw new Error("Incorrect initial tokensBlue value");

    // 3. Test Backward-Compatibility Aliases (Getters)
    console.log("Testing backward-compatibility aliases (Getters)...");
    if (biology.insectsPop !== 0) throw new Error("insectsPop should start at 0");
    if (biology.arthropodPop !== 0) throw new Error("arthropodPop (alias) should start at 0");
    if (biology.aiPop !== 0) throw new Error("aiPop should start at 0");
    if (biology.technologicalAIPop !== 0) throw new Error("technologicalAIPop (alias) should start at 0");
    if (biology.unlockedInsects !== false) throw new Error("unlockedInsects should start as false");
    if (biology.unlockedArthropod !== false) throw new Error("unlockedArthropod (alias) should start as false");
    if (biology.unlockedAI !== false) throw new Error("unlockedAI should start as false");
    if (biology.unlockedTechnologicalAI !== false) throw new Error("unlockedTechnologicalAI (alias) should start as false");

    // 4. Test Backward-Compatibility Aliases (Setters)
    console.log("Testing backward-compatibility aliases (Setters)...");
    biology.arthropodPop = 12.3;
    if (biology.insectsPop !== 12.3) throw new Error("Setting arthropodPop should update insectsPop");
    if (biology.biomassMap['insects'] !== 12.3) throw new Error("Setting arthropodPop should update biomassMap['insects']");

    biology.unlockedArthropod = true;
    if (biology.unlockedInsects !== true) throw new Error("Setting unlockedArthropod should update unlockedInsects");
    if (biology.unlockedMap['insects'] !== true) throw new Error("Setting unlockedArthropod should update unlockedMap['insects']");

    biology.technologicalAIPop = 45.6;
    if (biology.aiPop !== 45.6) throw new Error("Setting technologicalAIPop should update aiPop");
    if (biology.biomassMap['ai'] !== 45.6) throw new Error("Setting technologicalAIPop should update biomassMap['ai']");

    biology.unlockedTechnologicalAI = true;
    if (biology.unlockedAI !== true) throw new Error("Setting unlockedTechnologicalAI should update unlockedAI");
    if (biology.unlockedMap['ai'] !== true) throw new Error("Setting unlockedTechnologicalAI should update unlockedMap['ai']");

    console.log("✓ Backward-compatibility aliases work perfectly.");

    // Reset properties for simulation tick checks
    biology.biomassMap['insects'] = 0;
    biology.unlockedMap['insects'] = false;
    biology.biomassMap['ai'] = 0;
    biology.unlockedMap['ai'] = false;

    // 5. Advance Simulation Loop for several ticks
    console.log("Running simulation ticks...");
    const tickRate = 2.0; // 2.0 Myr per tick
    const dt = 0.5;       // 0.5 real seconds

    // Setup planet for primordial soup synthesis
    planet.waterCoverage = 50.0;
    planet.temperature = 40.0;
    planet.radiation = 5.0;

    for (let i = 0; i < 5; i++) {
        console.log(`Tick ${i + 1}: Planet age = ${planet.age.toFixed(2)} Myr, Organic Soup = ${biology.organicSoup.toFixed(2)} ppm`);
        
        // Biology update
        const bioUpdate = biology.update(tickRate, planet);
        
        // Event check
        const eventLogs = eventSystem.tick(planet, biology, tickRate);
        
        // Planet update
        planet.update(tickRate, bioUpdate.biologicalImpact);
        planet.age += tickRate;
        
        // History record
        history.tick(dt, planet, biology);
    }

    console.log("✓ Simulation tick loop passed with no exceptions.");
    console.log("Final check of organic soup level:", biology.organicSoup.toFixed(2), "ppm");
    if (biology.organicSoup <= 0) {
        throw new Error("Organic soup should have accumulated under these conditions");
    }

    // 6. Test Structured Save/Load and Migration
    console.log("Initializing DOM mock environment for GameController save/load testing...");
    
    // Setup standard browser environment mocks
    globalThis.window = {
        addEventListener: () => {}
    };
    globalThis.performance = {
        now: () => Date.now()
    };
    globalThis.requestAnimationFrame = () => {};
    
    const store = {};
    globalThis.localStorage = {
        getItem: (key) => store[key] || null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { for (const k in store) delete store[k]; }
    };
    
    const noop = () => {};
    const gradientMock = { addColorStop: noop };
    const contextProxy = new Proxy({}, {
        get: (target, prop) => {
            if (prop === 'createRadialGradient' || prop === 'createLinearGradient') {
                return () => gradientMock;
            }
            if (prop in target) return target[prop];
            return noop;
        }
    });

    const elementsRegistry = {};
    const getMockElement = (id) => {
        // Strip selectors like '#' or '.' for simple key mapping
        const key = id.replace(/^[#\.]/, '');
        if (!elementsRegistry[key]) {
            elementsRegistry[key] = {
                style: {},
                classList: {
                    contains: () => false,
                    add: () => {},
                    remove: () => {},
                    toggle: () => {}
                },
                addEventListener: () => {},
                appendChild: () => {},
                innerHTML: '',
                scrollTop: 0,
                scrollHeight: 0,
                clientWidth: 800,
                clientHeight: 600,
                parentElement: {
                    clientWidth: 800,
                    clientHeight: 600
                },
                querySelectorAll: () => [],
                getBoundingClientRect: () => ({ width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800 }),
                getContext: () => contextProxy
            };
        }
        return elementsRegistry[key];
    };
    
    globalThis.document = {
        getElementById: (id) => getMockElement(id),
        createElement: () => ({
            style: {},
            innerHTML: '',
            appendChild: () => {},
            addEventListener: () => {}
        }),
        querySelector: (selector) => getMockElement(selector),
        querySelectorAll: () => []
    };

    console.log("Dynamically importing GameController...");
    const { GameController } = await import('../js/game.js');
    const controller = new GameController();
    console.log("✓ GameController instantiated successfully inside DOM mock environment.");

    // Clear local storage and log history
    globalThis.localStorage.clear();
    controller.logs = [];

    // Test Structured Log Recording
    console.log("Testing structured log recording...");
    controller.logEvent("MOCK MILESTONE", "Simulated eukaryotic radiation", "success", { tier: "COMMON" });
    if (controller.logs.length !== 1) {
        throw new Error("Failed to record structured log entry");
    }
    const log = controller.logs[0];
    if (log.title !== "MOCK MILESTONE" || log.desc !== "Simulated eukaryotic radiation" || log.type !== "success") {
        throw new Error("Structured log fields are incorrect");
    }
    if (!log.timestamp) {
        throw new Error("Structured log entry is missing timestamp");
    }
    console.log("✓ Structured logs are recorded with correct fields and timestamps.");

    // Test Save Serialization
    console.log("Testing save serialization...");
    controller.planet.temperature = 42.1;
    controller.saveGame();
    
    const rawSave = globalThis.localStorage.getItem('evoplanet_save');
    if (!rawSave) {
        throw new Error("Game progress was not serialized to localStorage");
    }
    const parsedSave = JSON.parse(rawSave);
    if (parsedSave.version !== 1.1 || parsedSave.saveVersion !== 1.1) {
        throw new Error("Incorrect save file version; should be 1.1");
    }
    if (!parsedSave.logs || parsedSave.logs.length !== 1) {
        throw new Error("Structured logs were not properly serialized in the save file");
    }
    if (parsedSave.ui && parsedSave.ui.scienceLogHTML) {
        throw new Error("Legacy scienceLogHTML should not be present in v1.1 saves");
    }
    console.log("✓ Save file version 1.1 structured log serialization is correct.");

    // Test Load Deserialization
    console.log("Testing load deserialization...");
    controller.planet.temperature = 12.0; // modify state
    controller.loadGame();
    if (controller.planet.temperature !== 42.1) {
        throw new Error("loadGame failed to restore correct planet parameters");
    }
    if (controller.logs.length < 1 || controller.logs[0].title !== "MOCK MILESTONE") {
        throw new Error(`loadGame failed to restore structured logs array (length: ${controller.logs.length})`);
    }
    console.log("✓ loadGame successfully restored simulation parameters and structured logs.");

    // Test Validation on Corrupted Saves
    console.log("Testing save/load validation on corrupted states...");
    // Put completely malformed JSON in localStorage
    globalThis.localStorage.setItem('evoplanet_save', '{invalidjson');
    // Calling loadGame should handle parsing exceptions and log warning without crashing
    controller.loadGame();
    console.log("✓ Handled malformed JSON gracefully.");

    // Put missing sub-objects in localStorage
    globalThis.localStorage.setItem('evoplanet_save', JSON.stringify({ version: 1.1, planet: {} }));
    controller.loadGame();
    console.log("✓ Handled missing sub-systems gracefully.");

    // Test Legacy v1.0 Save Migration Fallback
    console.log("Testing legacy save migration fallback (v1.0)...");
    const legacySave = {
        version: 1.0,
        planet: { temperature: 28.5, waterCoverage: 40.0, ammoniaCoverage: 0, methaneCoverage: 0, radiation: 3.5, age: 10.0 },
        biology: { biomassMap: {}, unlockedMap: {}, activeAdaptations: [] },
        eventSystem: { warnings: [], triggeredUniqueEvents: [], activeEvents: [] },
        history: { series: {}, simAges: [], markers: [] },
        ui: { scienceLogHTML: "<div class='log-entry'>Legacy Log HTML</div>" }
    };
    globalThis.localStorage.setItem('evoplanet_save', JSON.stringify(legacySave));
    
    // Load legacy save
    controller.loadGame();
    if (controller.planet.temperature !== 28.5) {
        throw new Error("loadGame failed to restore parameters from legacy v1.0 save");
    }
    console.log("DEBUG: scienceLog.innerHTML is:", JSON.stringify(controller.ui.scienceLog.innerHTML));
    if (controller.ui.scienceLog.innerHTML !== "<div class='log-entry'>Legacy Log HTML</div>") {
        throw new Error("loadGame failed to restore legacy log HTML element");
    }
    console.log("✓ Legacy v1.0 save loaded successfully via fallback handler.");

    console.log("── Smoke Test Passed Successfully! ──");
    process.exit(0);
} catch (err) {
    console.error("❌ Smoke test failed with error:");
    console.error(err);
    process.exit(1);
}
