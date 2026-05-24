/**
 * Handles checking conditions, rolling probabilities, and applying
 * effects for planetary random events.
 */
export class EventSystem {
    constructor() {
        this.checkInterval = 2.0;         // Check for events every 2.0 Myr
        this.timeAccumulator = 0.0;
        
        // Active event tracking (for events with durations)
        this.activeEvents = []; // Array of { id, name, remainingDuration, onEnd }
        
        // Triggered single-time event cache to prevent repeating
        this.triggeredUniqueEvents = new Set();
        
        // Define our registry of events
        this.eventsRegistry = [
            {
                id: "moon_formation",
                name: "Giant Impact (Moon Formation)",
                description: "A Mars-sized protoplanet collided with the planet. Debris has coalesced into a moon, stabilizing the planetary tilt and triggering powerful oceans tides.",
                type: "success",
                singleTrigger: true,
                chance: 0.35,
                condition: (p, b) => p.age > 5.0 && p.age < 25.0 && p.waterCoverage > 10 && !p.hasMoon,
                apply: (p, b) => {
                    p.hasMoon = true;
                    // Thermal spike and water evaporation due to impact energy
                    p.targetTemperature = Math.min(150, p.temperature + 25);
                    p.targetWaterCoverage = Math.max(0, p.waterCoverage - 8);
                    p.rebalanceAtmosphere();
                    
                    return "Tidal wet-dry estuaries established! Prebiotic organic soup synthesis speed boosted by 250%.";
                }
            },
            {
                id: "comet_impact",
                name: "Water-Ice Comet Impact",
                description: "An icy comet from the outer solar system has impacted the planet, bringing rich volumes of water-ice and nitrogenous organic chemicals.",
                type: "alert",
                singleTrigger: false,
                chance: 0.20,
                condition: (p, b) => p.age < 150.0 && p.waterCoverage < 90,
                apply: (p, b) => {
                    p.targetWaterCoverage = Math.min(100, p.waterCoverage + 15);
                    p.targetTemperature = Math.max(-30, p.temperature - 8); // water-ice cools crust
                    b.organicSoup = Math.min(100, b.organicSoup + 15.0);
                    
                    return "Oceanic hydrosphere increased (+15% water). Prebiotic organic soup enriched (+15 ppm).";
                }
            },
            {
                id: "solar_flare",
                name: "Solar Coronal Superflare",
                description: "A massive magnetic storm on the host star has bathed the planet in intense solar winds and ionizing radiation.",
                type: "hazard",
                singleTrigger: false,
                chance: 0.18,
                condition: (p, b) => !p.hasMagnetosphere && !this.isEventActive("solar_flare"),
                duration: 6.0, // active for 6 Myr
                apply: (p, b) => {
                    // Spike radiation to extreme levels
                    p.targetRadiation = 9.0;
                    
                    // Decimate living populations that are not resistant
                    const resistance = b.radiationResistance;
                    if (b.anaerobicPop > 0) b.anaerobicPop *= (0.4 + 0.5 * resistance);
                    if (b.photosyntheticPop > 0) b.photosyntheticPop *= (0.3 + 0.5 * resistance);
                    if (b.multicellularPop > 0) b.multicellularPop *= 0.1; // highly vulnerable
                    
                    return "Radiation level spiked to 9.0 rad/s. Severe cellular die-off occurred. Mutation speeds increased.";
                },
                onEnd: (p, b) => {
                    // Restores radiation target to match current slider setting
                    p.targetRadiation = parseFloat(document.getElementById('radiation-slider').value);
                    return "Solar flare subsided. Radiation returning to normal levels.";
                }
            },
            {
                id: "geodynamo_ignition",
                name: "Geodynamo Ignition",
                description: "Planetary iron core cooling has reached critical density, starting convective currents that ignite a global magnetic dynamo.",
                type: "success",
                singleTrigger: true,
                chance: 0.30,
                condition: (p, b) => p.age > 30.0 && !p.hasMagnetosphere,
                apply: (p, b) => {
                    p.hasMagnetosphere = true;
                    // Lower baseline radiation
                    p.targetRadiation = Math.max(0.1, p.radiation * 0.25);
                    
                    return "Global Magnetosphere active! The planet is now shielded from solar wind stripping. Safe for complex multicellular land-life.";
                }
            },
            {
                id: "ice_age",
                name: "Snowball Glaciation Event",
                description: "Methane carbon traps collapsed as atmospheric Oxygen accumulated. Runaway ice-albedo reflection has locked the planet in a global deep-freeze.",
                type: "hazard",
                singleTrigger: false,
                chance: 0.25,
                condition: (p, b) => p.o2 > 20.0 && p.temperature < 20.0 && !this.isEventActive("ice_age"),
                duration: 12.0, // active for 12 Myr
                apply: (p, b) => {
                    p.targetTemperature = -45;
                    p.isGlaciated = true; // freezes water
                    
                    // Decimate warmth-loving species
                    if (b.photosyntheticPop > 0) b.photosyntheticPop *= 0.25;
                    if (b.multicellularPop > 0) b.multicellularPop *= 0.15;
                    
                    return "Surface temperature locked to -45°C. Oceans frozen solid. Photosynthetic output crippled by 75%.";
                },
                onEnd: (p, b) => {
                    p.isGlaciated = false;
                    p.targetTemperature = parseFloat(document.getElementById('temp-slider').value);
                    return "Glaciation ended. Ice caps retreating. Planetary surface warming.";
                }
            }
        ];
    }

    /**
     * Check if a specific duration-based event is currently running
     */
    isEventActive(id) {
        return this.activeEvents.some(e => e.id === id);
    }

    /**
     * Tick event system. Returns array of event notification logs to display.
     */
    tick(planet, biology, tickRate) {
        const outputLogs = [];
        
        // 1. Process active duration-based events
        for (let i = this.activeEvents.length - 1; i >= 0; i--) {
            const active = this.activeEvents[i];
            active.remainingDuration -= tickRate;
            
            if (active.remainingDuration <= 0) {
                // Event expired, run cleanup
                const registryEvent = this.eventsRegistry.find(e => e.id === active.id);
                if (registryEvent && registryEvent.onEnd) {
                    const cleanupMsg = registryEvent.onEnd(planet, biology);
                    outputLogs.push({
                        title: `${registryEvent.name} [ENDED]`,
                        desc: cleanupMsg,
                        type: "system"
                    });
                }
                this.activeEvents.splice(i, 1);
            }
        }

        // 2. Accumulate time to check for triggering new events
        this.timeAccumulator += tickRate;
        if (this.timeAccumulator >= this.checkInterval) {
            this.timeAccumulator = 0.0;
            
            // Gather all candidate events whose conditions are met
            const candidates = this.eventsRegistry.filter(e => {
                if (e.singleTrigger && this.triggeredUniqueEvents.has(e.id)) {
                    return false;
                }
                if (this.isEventActive(e.id)) {
                    return false;
                }
                return e.condition(planet, biology);
            });

            if (candidates.length > 0) {
                // Select one random candidate to evaluate
                const selected = candidates[Math.floor(Math.random() * candidates.length)];
                
                // Roll probability
                if (Math.random() < selected.chance) {
                    // Trigger Event!
                    const effectMsg = selected.apply(planet, biology);
                    
                    if (selected.singleTrigger) {
                        this.triggeredUniqueEvents.add(selected.id);
                    }
                    
                    if (selected.duration) {
                        this.activeEvents.push({
                            id: selected.id,
                            name: selected.name,
                            remainingDuration: selected.duration
                        });
                    }

                    outputLogs.push({
                        title: `🔔 ${selected.name.toUpperCase()}`,
                        desc: `${selected.description} EFFECT: ${effectMsg}`,
                        type: selected.type
                    });
                }
            }
        }

        return outputLogs;
    }
}
