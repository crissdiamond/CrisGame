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

    console.log("── Smoke Test Passed Successfully! ──");
    process.exit(0);
} catch (err) {
    console.error("❌ Smoke test failed with error:");
    console.error(err);
    process.exit(1);
}
