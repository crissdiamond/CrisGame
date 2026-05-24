/**
 * Models the environmental physical state of the planet.
 */
export class Planet {
    constructor() {
        // Physical parameters (current state)
        this.temperature = 75.0;      // in °C
        this.waterCoverage = 30.0;     // in %
        this.radiation = 3.5;          // in rad/s
        
        // Target parameters (for smooth transition from sliders)
        this.targetTemperature = 75.0;
        this.targetWaterCoverage = 30.0;
        this.targetRadiation = 3.5;
        
        // Atmosphere composition (adds up to 100%)
        this.co2 = 95.0;
        this.n2 = 4.9;
        this.o2 = 0.1;
        
        // History/Age
        this.age = 0.0;                // in Million Years (Myr)
        
        // Environmental multipliers
        this.isDisasterActive = false;
        this.disasterDuration = 0;
    }

    /**
     * Set targets from UI sliders
     */
    setTargetTemperature(val) { this.targetTemperature = parseFloat(val); }
    setTargetWaterCoverage(val) { this.targetWaterCoverage = parseFloat(val); }
    setTargetRadiation(val) { this.targetRadiation = parseFloat(val); }

    /**
     * Trigger a catastrophic meteor strike
     */
    triggerMeteor() {
        this.targetTemperature = Math.min(150, this.temperature + 60);
        this.targetWaterCoverage = Math.max(0, this.waterCoverage - 20);
        this.targetRadiation = Math.min(10, this.radiation + 4);
        this.co2 = Math.min(100, this.co2 + 3);
        this.o2 = Math.max(0, this.o2 - 1.5);
        this.rebalanceAtmosphere();
        
        return {
            title: "🌠 METEOR STRIKE DETECTED",
            desc: "A massive asteroid impacted the surface. Temperature spiked, oceans evaporated, and cosmic shielding ruptured.",
            type: "hazard"
        };
    }

    /**
     * Trigger massive volcanic eruption
     */
    triggerVolcano() {
        this.targetTemperature = Math.min(150, this.temperature + 35);
        this.co2 = Math.min(100, this.co2 + 8);
        this.targetRadiation = Math.min(10, this.radiation + 1.5);
        this.rebalanceAtmosphere();
        
        return {
            title: "🌋 VOLCANIC ERUPTION ACTIVE",
            desc: "Super-volcanoes ruptured across continental plates, flooding the sky with carbon dioxide and toxic sulfur.",
            type: "alert"
        };
    }

    /**
     * Keep gases adding up to 100%
     */
    rebalanceAtmosphere() {
        const sum = this.co2 + this.n2 + this.o2;
        if (sum > 0) {
            this.co2 = (this.co2 / sum) * 100;
            this.n2 = (this.n2 / sum) * 100;
            this.o2 = (this.o2 / sum) * 100;
        }
    }

    /**
     * Calculates general viability score for life (0 to 100)
     */
    getHabitabilityScore() {
        // Temperature score (Ideal: 15°C to 45°C)
        let tempScore = 0;
        if (this.temperature >= 0 && this.temperature <= 90) {
            if (this.temperature >= 15 && this.temperature <= 45) {
                tempScore = 1.0;
            } else if (this.temperature < 15) {
                tempScore = (this.temperature - 0) / 15;
            } else {
                tempScore = (90 - this.temperature) / 45;
            }
        }
        
        // Water score (Ideal: 40% to 80%)
        let waterScore = 0;
        if (this.waterCoverage > 5 && this.waterCoverage <= 95) {
            if (this.waterCoverage >= 40 && this.waterCoverage <= 80) {
                waterScore = 1.0;
            } else if (this.waterCoverage < 40) {
                waterScore = (this.waterCoverage - 5) / 35;
            } else {
                waterScore = (95 - this.waterCoverage) / 15;
            }
        }

        // Radiation score (Ideal: 0.1 to 1.5 rad/s - needs small amount for mutations but not lethal)
        let radScore = 0;
        if (this.radiation <= 8) {
            if (this.radiation >= 0.1 && this.radiation <= 1.5) {
                radScore = 1.0;
            } else if (this.radiation < 0.1) {
                radScore = 0.5 + (this.radiation / 0.1) * 0.5;
            } else {
                radScore = (8 - this.radiation) / 6.5;
            }
        }

        // Aggregate score
        const habitability = Math.round((tempScore * 0.4 + waterScore * 0.4 + radScore * 0.2) * 100);
        return Math.max(0, habitability);
    }

    /**
     * Compute state change over one simulation tick
     * @param {number} tickRate - Time step in Myr
     * @param {object} biologicalImpact - how much O2 produced / CO2 consumed
     */
    update(tickRate, biologicalImpact = { o2Prod: 0, co2Cons: 0 }) {
        // Increment planetary age
        this.age += tickRate;

        // Smoothly interpolate current parameter values towards target values set by user sliders
        this.temperature += (this.targetTemperature - this.temperature) * 0.05;
        this.waterCoverage += (this.targetWaterCoverage - this.waterCoverage) * 0.05;
        this.radiation += (this.targetRadiation - this.radiation) * 0.05;

        // Apply biological feedback loop to atmosphere
        // Life consumes CO2 and produces O2
        if (biologicalImpact.o2Prod > 0) {
            const converted = Math.min(this.co2, biologicalImpact.o2Prod * tickRate * 0.1);
            this.co2 -= converted;
            this.o2 += converted;
        }
        
        // Natural atmospheric decay/regulations over time
        // Volcanic venting of carbon if temperature is extremely high
        if (this.temperature > 85) {
            this.co2 += 0.02 * tickRate;
            this.o2 = Math.max(0.1, this.o2 - 0.01 * tickRate);
        }

        this.rebalanceAtmosphere();
    }
}
