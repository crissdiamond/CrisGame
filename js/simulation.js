/**
 * Handles the biological progression calculations:
 * Organic Soup -> Monocellular (Anaerobic & Photosynthetic) -> Multicellular
 */
export class BiologySimulation {
    constructor() {
        // Populations & Densities
        this.organicSoup = 0.0;             // Concentration in ppm (0 to 100)
        this.anaerobicPop = 0.0;            // Population in Million cells/mL
        this.photosyntheticPop = 0.0;       // Population in Million cells/mL
        this.multicellularPop = 0.0;        // Complexity/Population (0 to 100)

        // Evolutionary stages unlocked flags
        this.unlockedSoup = false;
        this.unlockedAnaerobic = false;
        this.unlockedPhotosynthetic = false;
        this.unlockedMulticellular = false;

        // Mutation / Adaptation levels (0.0 to 1.0)
        this.radiationResistance = 0.1;
    }

    /**
     * Compute biological updates over one simulation step
     * @param {number} tickRate - simulation speed step in Million Years (Myr)
     * @param {Planet} planet - reference to the planet environmental state
     * @returns {Array} array of events/alerts triggered during this step
     */
    update(tickRate, planet) {
        const events = [];
        
        // ----------------------------------------------------
        // 1. ORGANIC SOUP (Prebiotic Synthesis)
        // ----------------------------------------------------
        if (planet.temperature > 30 && planet.temperature < 120 && planet.waterCoverage > 10) {
            // Synthesis speed depends on water, temperature (peaks around 70C), and ionizing radiation
            const tempFactor = 1 - Math.abs(planet.temperature - 70) / 50; // peaks at 70C
            const radFactor = Math.min(2.0, planet.radiation * 0.5); // some radiation speeds up synthesis
            const waterFactor = planet.waterCoverage / 100;
            // Moon tides boost prebiotic synthesis by 2.5x
            const tideBoost = planet.hasMoon ? 2.5 : 1.0;
            
            const synthesisRate = Math.max(0, tempFactor) * radFactor * waterFactor * 8.0 * tideBoost;
            this.organicSoup = Math.min(100.0, this.organicSoup + synthesisRate * tickRate);
            
            if (!this.unlockedSoup && this.organicSoup > 5.0) {
                this.unlockedSoup = true;
                events.push({
                    title: "🧪 PREBIOTIC SYNTHESIS COMPLETED",
                    desc: "Amino acids, purines, and nucleotides are accumulating in the primordial warm ponds. The building blocks of life are ready.",
                    type: "success"
                });
            }
        } else {
            // Denaturing of compounds in extreme heat, or slow decay
            const decay = planet.temperature > 120 ? 0.3 : 0.02;
            this.organicSoup = Math.max(0, this.organicSoup - this.organicSoup * decay * tickRate);
        }

        // ----------------------------------------------------
        // 2. ANAEROBIC BACTERIA (Single-cell life - no oxygen required)
        // ----------------------------------------------------
        if (this.unlockedSoup && this.organicSoup > 10.0) {
            // Evolve first anaerobic cell if not yet active
            if (this.anaerobicPop === 0) {
                this.anaerobicPop = 0.1;
                this.unlockedAnaerobic = true;
                events.push({
                    title: "🧫 MONOCELLULAR LIFE EMERGED",
                    desc: "The first single-cell anaerobic organisms have formed in deep ocean thermal vents, feeding off the surrounding organic compounds.",
                    type: "success"
                });
            }
        }

        if (this.anaerobicPop > 0) {
            // Environment viability factors
            const tempViability = this.getTempViability(planet.temperature, 0, 45, 80); // peaks at 45C
            let waterViability = planet.waterCoverage > 15 ? 1.0 : (planet.waterCoverage / 15);
            // Glaciation restricts liquid water access
            if (planet.isGlaciated) waterViability *= 0.4;
            // Radiation hazard: high radiation kills unless resistance is high
            const radViability = Math.max(0, 1 - (planet.radiation * (1 - this.radiationResistance)) / 6.0);
            // Oxygen is toxic to strict anaerobes (Great Oxidation Event effect)
            const o2Toxicity = Math.max(0.1, 1 - (planet.o2 / 30.0));

            const totalViability = tempViability * waterViability * radViability * o2Toxicity;

            if (totalViability > 0.1) {
                // Growth relies on organic soup as nutrients
                const nutrientFactor = Math.min(1.0, this.organicSoup / 20.0);
                const growthRate = 1.2 * totalViability * nutrientFactor;
                
                // Logistic growth (cap at 150 M/mL)
                const carryingCapacity = 150.0 * waterViability;
                const dPop = growthRate * this.anaerobicPop * (1 - this.anaerobicPop / carryingCapacity) * tickRate;
                this.anaerobicPop = Math.max(0.01, this.anaerobicPop + dPop);
                
                // Consume soup
                const consumedSoup = this.anaerobicPop * 0.15 * tickRate;
                this.organicSoup = Math.max(0, this.organicSoup - consumedSoup);
            } else {
                // Decay/die-off
                const deathRate = 0.5 * (1 - totalViability);
                this.anaerobicPop = Math.max(0, this.anaerobicPop - this.anaerobicPop * deathRate * tickRate);
            }
        }

        // ----------------------------------------------------
        // 3. PHOTOSYNTHETIC BACTERIA (Aerobic/oxygen-releasing bacteria)
        // ----------------------------------------------------
        if (this.unlockedAnaerobic && this.anaerobicPop > 30.0 && !this.unlockedPhotosynthetic) {
            // Mutation chance scales with radiation. Solar flares boost mutation chance by 3x.
            const flareBoost = planet.radiation > 7.0 ? 3.0 : 1.0;
            const mutationChance = Math.min(0.5, planet.radiation * 0.02 * tickRate * flareBoost);
            if (Math.random() < mutationChance || planet.age > 40.0) { // guarantee at some point
                this.photosyntheticPop = 0.1;
                this.unlockedPhotosynthetic = true;
                events.push({
                    title: "🍃 PHOTOSYNTHESIS EVOLVED",
                    desc: "A strain of cells mutated to harness energy from stellar radiation, consuming carbon dioxide and releasing free Oxygen as a byproduct.",
                    type: "success"
                });
            }
        }

        if (this.photosyntheticPop > 0) {
            const tempViability = this.getTempViability(planet.temperature, 5, 30, 60); // peaks at 30C
            let waterViability = planet.waterCoverage > 25 ? 1.0 : Math.max(0, (planet.waterCoverage - 5) / 20);
            // Glaciation severely blocks light and liquid water
            if (planet.isGlaciated) waterViability *= 0.1;
            const radViability = Math.max(0, 1 - (planet.radiation * (1 - this.radiationResistance)) / 5.0);
            
            const totalViability = tempViability * waterViability * radViability;

            if (totalViability > 0.1) {
                // Growth relies on sunlight (radiation) and water, less on organic soup
                const growthRate = 0.9 * totalViability * (0.3 + (planet.radiation / 5.0));
                
                // Logistic growth (cap at 200 M/mL)
                const carryingCapacity = 200.0 * waterViability;
                const dPop = growthRate * this.photosyntheticPop * (1 - this.photosyntheticPop / carryingCapacity) * tickRate;
                this.photosyntheticPop = Math.max(0.01, this.photosyntheticPop + dPop);
            } else {
                const deathRate = 0.6 * (1 - totalViability);
                this.photosyntheticPop = Math.max(0, this.photosyntheticPop - this.photosyntheticPop * deathRate * tickRate);
            }
        }

        // Great Oxidation Event Alert
        if (this.unlockedPhotosynthetic && planet.o2 >= 15.0 && !planet.goeAlertTriggered) {
            planet.goeAlertTriggered = true;
            events.push({
                title: "💨 GREAT OXIDATION EVENT",
                desc: "Atmospheric Oxygen has exceeded 15%. This has triggered a massive die-off of ancient anaerobic species, but paved the path for highly efficient aerobic systems.",
                type: "alert"
            });
        }

        // ----------------------------------------------------
        // 4. MULTICELLULAR LIFE (Complex eukaryotic structures)
        // ----------------------------------------------------
        if (this.unlockedPhotosynthetic && this.photosyntheticPop > 50.0 && planet.o2 >= 15.0 && !this.unlockedMulticellular) {
            this.multicellularPop = 0.1;
            this.unlockedMulticellular = true;
            events.push({
                title: "🌱 MULTICELLULARITY UNLOCKED",
                desc: "High oxygen levels enabled high-energy aerobic respiration. Cells have aggregated, specializing into complex tissues and early sea flora.",
                type: "success"
            });
        }

        if (this.multicellularPop > 0) {
            const tempViability = this.getTempViability(planet.temperature, 10, 22, 45); // peaks at 22C (very sensitive)
            let waterViability = planet.waterCoverage > 30 ? 1.0 : Math.max(0, (planet.waterCoverage - 15) / 15);
            // Glaciation decimates multicellular mobility
            if (planet.isGlaciated) waterViability *= 0.05;
            // Radiation is very dangerous for complex DNA structure
            const radViability = Math.max(0, 1 - planet.radiation / 3.0);
            const o2Viability = planet.o2 >= 15.0 ? 1.0 : (planet.o2 / 15.0);

            const totalViability = tempViability * waterViability * radViability * o2Viability;

            if (totalViability > 0.1) {
                const growthRate = 0.5 * totalViability;
                const carryingCapacity = 100.0 * waterViability * o2Viability;
                const dPop = growthRate * this.multicellularPop * (1 - this.multicellularPop / carryingCapacity) * tickRate;
                this.multicellularPop = Math.max(0.01, this.multicellularPop + dPop);
            } else {
                const deathRate = 0.8 * (1 - totalViability);
                this.multicellularPop = Math.max(0, this.multicellularPop - this.multicellularPop * deathRate * tickRate);
            }
        }

        // ----------------------------------------------------
        // 5. MUTATION & ADAPTATION UPGRADES
        // ----------------------------------------------------
        // Over time, exposure to moderate radiation slowly trains radiation resistance (simulating genetic selection)
        if (planet.radiation > 0.5 && (this.anaerobicPop > 5.0 || this.photosyntheticPop > 5.0)) {
            // Radiation stimulates resistance adaptations up to a maximum
            const adaptationRate = 0.002 * Math.min(3.0, planet.radiation) * tickRate;
            this.radiationResistance = Math.min(0.85, this.radiationResistance + adaptationRate);
        }

        // Return a calculated oxygen production rate and CO2 consumption rate based on current biology
        // This is used by planet.js to update gases
        const biologicalImpact = {
            o2Prod: this.photosyntheticPop * 0.05,
            co2Cons: this.photosyntheticPop * 0.05 + this.anaerobicPop * 0.01
        };

        return {
            events,
            biologicalImpact
        };
    }

    /**
     * Helper to compute temperature viability curve
     * Returns a float 0 to 1 based on an asymmetric bell curve
     */
    getTempViability(temp, min, optimal, max) {
        if (temp <= min || temp >= max) return 0;
        if (temp === optimal) return 1.0;
        
        if (temp < optimal) {
            return (temp - min) / (optimal - min);
        } else {
            return (max - temp) / (max - optimal);
        }
    }
}
