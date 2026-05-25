/**
 * Models the environmental physical state of the planet.
 */
export class Planet {
    constructor() {
        // Physical parameters (current state)
        this.temperature = 15.0;      // in °C
        this.waterCoverage = 30.0;     // in %
        this.ammoniaCoverage = 0.0;    // in %
        this.methaneCoverage = 0.0;    // in %
        this.radiation = 3.5;          // in rad/s
        
        // Target parameters (for smooth transition from sliders / events)
        this.targetTemperature = 15.0;
        this.targetWaterCoverage = 30.0;
        this.targetAmmoniaCoverage = 0.0;
        this.targetMethaneCoverage = 0.0;
        this.targetRadiation = 3.5;
        
        // Atmosphere composition (adds up to 100%)
        this.co2 = 95.0;
        this.n2 = 4.9;
        this.o2 = 0.1;
        this.ch4 = 0.0;                // Methane gas
        this.h2 = 0.0;                 // Hydrogen gas
        
        // Atmospheric pressure in atm
        this.atmospherePressure = 1.0;
        
        // Magnetosphere and ozone
        this.magneticStrength = 100.0; // in %
        this.hasMagnetosphere = true;
        this.ozone = 0.0;              // 0 to 1 index
        
        // History/Age / Star
        this.age = 0.0;                // in Million Years (Myr)
        this.starAge = 0.0;
        this.starLuminosity = 1.0;     // Starts at solar norm
        
        // Environmental states
        this.isDisasterActive = false;
        this.disasterDuration = 0;
        this.hasMoon = false;
        this.isGlaciated = false;
        this.activeSolvent = 'water';  // 'water', 'ammonia', 'methane'

        // Post-impact climate recovery
        this.impactTemperatureOffset = 0.0;
        this.impactOffsetDecayRate = 0.0;
        this.impactCooldownMyr = 0.0;
        this.nextImpactTemperatureOffset = 0.0;
        this.nextImpactCooldownMyr = 0.0;
        this.nextImpactOffsetDecayRate = 0.0;

        // Setup parameters
        this.starClass = 'g_dwarf';
        this.starSize = 1.0;
        this.orbitDistance = 1.0;
        this.planetSize = 'medium';
        this.initialVolatiles = 40.0;
        this.initialIron = 50.0;
        this.initialCarbon = 30.0;

        // Cosmological intervention active states
        this.dustVeilActive = false;
        this.orbitalPerturbationActive = false;
    }

    /**
     * Initializes protoplanetary physics based on setup selection
     */
    initializeProtoplanet(config) {
        this.starClass = config.starClass || 'g_dwarf';
        this.starSize = parseFloat(config.starSize) || 1.0;
        this.orbitDistance = parseFloat(config.orbitDistance) || 1.0;
        this.planetSize = config.planetSize || 'medium';
        this.initialVolatiles = parseFloat(config.initialVolatiles) || 40.0;
        this.initialIron = parseFloat(config.initialIron) || 50.0;
        this.initialCarbon = parseFloat(config.initialCarbon) || 30.0;
        
        // Reset age and parameters
        this.age = 0.0;
        this.starAge = 0.0;
        this.isDisasterActive = false;
        this.isGlaciated = false;
        this.impactTemperatureOffset = 0.0;
        this.impactOffsetDecayRate = 0.0;
        this.impactCooldownMyr = 0.0;
        this.nextImpactTemperatureOffset = 0.0;
        this.nextImpactCooldownMyr = 0.0;
        this.nextImpactOffsetDecayRate = 0.0;
        
        this.dustVeilActive = false;
        this.orbitalPerturbationActive = false;

        // Base Luminosity depending on stellar type
        let baseLuminosity = 1.0;
        if (this.starClass === 'm_dwarf') baseLuminosity = 0.05;
        if (this.starClass === 'blue_giant') baseLuminosity = 10.0;
        this.starLuminosity = baseLuminosity * this.starSize;

        // Base radiation (scales with star type and distance)
        let baseRad = 1.5;
        if (this.starClass === 'm_dwarf') baseRad = 4.5;
        if (this.starClass === 'blue_giant') baseRad = 7.5;
        this.radiation = baseRad / (this.orbitDistance * this.orbitDistance);
        this.radiation = Math.max(0.05, Math.min(10.0, this.radiation));
        this.targetRadiation = this.radiation;

        // Equilibrium temp from Stefan-Boltzmann: T_eq = 278 * (L / d^2)^0.25 - 273.15
        const eqTemp = 278.0 * Math.pow(this.starLuminosity / (this.orbitDistance * this.orbitDistance), 0.25) - 273.15;
        this.temperature = eqTemp;
        this.targetTemperature = eqTemp;

        // Initial Pressure and Carbon buffer
        if (this.planetSize === 'small') {
            this.atmospherePressure = 0.3 + (this.initialCarbon / 100.0) * 0.2;
        } else if (this.planetSize === 'medium') {
            this.atmospherePressure = 0.8 + (this.initialCarbon / 100.0) * 0.6;
        } else {
            this.atmospherePressure = 1.6 + (this.initialCarbon / 100.0) * 1.4;
        }

        // Magnetic core initial strength
        this.magneticStrength = this.initialIron * 1.2;
        this.hasMagnetosphere = this.magneticStrength >= 20.0;

        // Gas balances
        this.co2 = this.initialCarbon;
        this.n2 = 100.0 - this.co2;
        this.o2 = 0.0;
        this.ch4 = 0.0;
        this.h2 = 0.0;

        // Solvent distribution
        const initialCoverage = this.initialVolatiles * 0.85;
        this.waterCoverage = 0.0;
        this.ammoniaCoverage = 0.0;
        this.methaneCoverage = 0.0;

        if (this.temperature >= 0.0) {
            this.activeSolvent = 'water';
            this.waterCoverage = initialCoverage;
            this.targetWaterCoverage = initialCoverage;
            this.o2 = 0.1;
        } else if (this.temperature >= -78.0) {
            this.activeSolvent = 'ammonia';
            this.ammoniaCoverage = initialCoverage;
            this.targetAmmoniaCoverage = initialCoverage;
        } else {
            this.activeSolvent = 'methane';
            this.methaneCoverage = initialCoverage;
            this.targetMethaneCoverage = initialCoverage;
            this.h2 = 12.0;
            this.n2 = Math.max(0.1, this.n2 - 12.0);
        }

        this.rebalanceAtmosphere();
    }

    setTargetSolventCoverage(val) {
        const value = parseFloat(val);
        if (this.activeSolvent === 'water') {
            this.targetWaterCoverage = value;
        } else if (this.activeSolvent === 'ammonia') {
            this.targetAmmoniaCoverage = value;
        } else if (this.activeSolvent === 'methane') {
            this.targetMethaneCoverage = value;
        }
    }

    /**
     * Trigger a catastrophic meteor strike
     */
    triggerMeteor() {
        this.targetTemperature = Math.min(150, this.temperature + 50);
        this.setTargetSolventCoverage(Math.max(0, this.getSolventCoverage() - 15));
        this.targetRadiation = Math.min(10, this.radiation + 3);
        this.co2 = Math.min(100, this.co2 + 4);
        this.o2 = Math.max(0, this.o2 - 1.5);
        this.rebalanceAtmosphere();
        
        return {
            title: "🌠 METEOR STRIKE DETECTED",
            desc: "A massive asteroid impacted the surface. Temperature spiked, surface liquids boiled off, and dust filled the sky.",
            type: "hazard"
        };
    }

    /**
     * Apply an asteroid/comet impact with staged climate recovery.
     */
    applyImpact(type, sizeClass = 'medium') {
        const sizeMultipliers = {
            small: 0.75,
            medium: 1.0,
            large: 1.25,
            kp: 1.0
        };
        const multiplier = sizeMultipliers[sizeClass] || 1.0;
        const impactProfiles = {
            carbonaceous: {
                coolingOffset: -8.0,
                coolingDuration: 2.0,
                warmingOffset: 0.0,
                warmingDuration: 0.0,
                co2Boost: 2.0,
                waterBoost: 5.0,
                radiationBoost: 0.4
            },
            silicaceous: {
                coolingOffset: -15.0,
                coolingDuration: 1.5,
                warmingOffset: 8.0,
                warmingDuration: 3.0,
                co2Boost: 8.0,
                solventBoost: -5.0,
                radiationBoost: 1.0
            },
            metallic: {
                immediateTemperatureSpike: 40.0,
                coolingOffset: -30.0,
                coolingDuration: 5.0,
                warmingOffset: 20.0,
                warmingDuration: 8.0,
                co2Boost: 15.0,
                solventBoost: -15.0,
                radiationBoost: 2.5,
                magneticBoost: 15.0
            },
            cometary: {
                coolingOffset: -20.0,
                coolingDuration: 4.0,
                warmingOffset: 0.0,
                warmingDuration: 0.0,
                co2Boost: 5.0,
                waterBoost: 15.0,
                radiationBoost: 0.8
            }
        };

        const profile = impactProfiles[type] || impactProfiles.silicaceous;
        if (profile.immediateTemperatureSpike) {
            this.temperature = Math.min(150.0, this.temperature + profile.immediateTemperatureSpike * multiplier);
        }

        const coolingOffset = profile.coolingOffset * multiplier;
        const coolingDuration = profile.coolingDuration;
        this.impactTemperatureOffset = coolingOffset;
        this.impactCooldownMyr = coolingDuration;
        this.impactOffsetDecayRate = Math.abs(coolingOffset) / coolingDuration;

        const warmingOffset = profile.warmingOffset * multiplier;
        this.nextImpactTemperatureOffset = warmingOffset;
        this.nextImpactCooldownMyr = profile.warmingDuration;
        this.nextImpactOffsetDecayRate = profile.warmingDuration > 0 ? Math.abs(warmingOffset) / profile.warmingDuration : 0.0;

        if (profile.waterBoost) {
            this.waterCoverage = Math.min(100.0, this.waterCoverage + profile.waterBoost);
            this.targetWaterCoverage = Math.min(100.0, this.targetWaterCoverage + profile.waterBoost);
        }

        if (profile.solventBoost) {
            this.setTargetSolventCoverage(Math.max(0.0, Math.min(100.0, this.getSolventCoverage() + profile.solventBoost)));
        }

        this.co2 = Math.min(100.0, this.co2 + profile.co2Boost * multiplier);
        this.targetRadiation = Math.min(10.0, this.targetRadiation + profile.radiationBoost * multiplier);
        this.radiation = Math.min(10.0, this.radiation + profile.radiationBoost * 0.5 * multiplier);

        if (profile.magneticBoost) {
            this.magneticStrength = Math.min(100.0, this.magneticStrength + profile.magneticBoost);
            this.hasMagnetosphere = this.magneticStrength >= 20.0;
        }

        this.rebalanceAtmosphere();
    }

    /**
     * Trigger massive volcanic eruption
     */
    triggerVolcano() {
        this.targetTemperature = Math.min(150, this.temperature + 25);
        this.co2 = Math.min(100, this.co2 + 7);
        this.targetRadiation = Math.min(10, this.radiation + 1.0);
        this.rebalanceAtmosphere();
        
        return {
            title: "🌋 VOLCANIC ERUPTION ACTIVE",
            desc: "Super-volcanoes erupted, venting huge amounts of carbon dioxide and greenhouse gases.",
            type: "alert"
        };
    }

    /**
     * Keep gases adding up to 100%
     */
    rebalanceAtmosphere() {
        const sum = this.co2 + this.n2 + this.o2 + this.ch4 + this.h2;
        if (sum > 0) {
            this.co2 = (this.co2 / sum) * 100;
            this.n2 = (this.n2 / sum) * 100;
            this.o2 = (this.o2 / sum) * 100;
            this.ch4 = (this.ch4 / sum) * 100;
            this.h2 = (this.h2 / sum) * 100;
        }
    }

    getSolventCoverage() {
        if (this.activeSolvent === 'water') return this.waterCoverage;
        if (this.activeSolvent === 'ammonia') return this.ammoniaCoverage;
        if (this.activeSolvent === 'methane') return this.methaneCoverage;
        return 0;
    }

    /**
     * Calculates general viability score for life (0 to 100)
     */
    getHabitabilityScore() {
        // Viability curves differ based on active solvent
        let tempScore = 0;
        let coverageScore = 0;
        const coverage = this.getSolventCoverage();

        if (this.activeSolvent === 'water') {
            // Water-based Life: Ideal 15°C to 45°C
            if (this.temperature >= 0 && this.temperature <= 90) {
                if (this.temperature >= 15 && this.temperature <= 45) tempScore = 1.0;
                else if (this.temperature < 15) tempScore = this.temperature / 15;
                else tempScore = (90 - this.temperature) / 45;
            }
            // Coverage score
            if (coverage > 5 && coverage <= 95) {
                if (coverage >= 40 && coverage <= 80) coverageScore = 1.0;
                else if (coverage < 40) coverageScore = (coverage - 5) / 35;
                else coverageScore = (95 - coverage) / 15;
            }
        } else if (this.activeSolvent === 'ammonia') {
            // Ammonia-based Life: Ideal -60°C to -25°C
            if (this.temperature >= -90 && this.temperature <= -10) {
                if (this.temperature >= -60 && this.temperature <= -25) tempScore = 1.0;
                else if (this.temperature < -60) tempScore = (this.temperature + 90) / 30;
                else tempScore = (-10 - this.temperature) / 15;
            }
            if (coverage > 5 && coverage <= 95) {
                if (coverage >= 30 && coverage <= 75) coverageScore = 1.0;
                else if (coverage < 30) coverageScore = (coverage - 5) / 25;
                else coverageScore = (95 - coverage) / 20;
            }
        } else if (this.activeSolvent === 'methane') {
            // Methane-based Life: Ideal -180°C to -150°C
            if (this.temperature >= -210 && this.temperature <= -120) {
                if (this.temperature >= -180 && this.temperature <= -150) tempScore = 1.0;
                else if (this.temperature < -180) tempScore = (this.temperature + 210) / 30;
                else tempScore = (-120 - this.temperature) / 30;
            }
            if (coverage > 5 && coverage <= 95) {
                if (coverage >= 20 && coverage <= 60) coverageScore = 1.0;
                else if (coverage < 20) coverageScore = (coverage - 5) / 15;
                else coverageScore = (95 - coverage) / 35;
            }
        }

        // Radiation score (Ideal: 0.1 to 1.5 rad/s - needs a little for mutation, but too much is lethal)
        const effRad = this.getEffectiveRadiation();
        let radScore = 0;
        if (effRad <= 8.0) {
            if (effRad >= 0.1 && effRad <= 1.5) radScore = 1.0;
            else if (effRad < 0.1) radScore = 0.5 + (effRad / 0.1) * 0.5;
            else radScore = (8.0 - effRad) / 6.5;
        }

        // Aggregate score
        const habitability = Math.round((tempScore * 0.4 + coverageScore * 0.4 + radScore * 0.2) * 100);
        return Math.max(0, habitability);
    }

    getEffectiveRadiation() {
        // Shielded by Magnetosphere (blocks 75%) and Ozone (blocks up to 90%)
        let shield = 1.0;
        if (this.hasMagnetosphere) shield *= 0.25;
        shield *= (1.0 - this.ozone * 0.9);
        return this.radiation * shield;
    }

    /**
     * Compute state change over one simulation tick
     */
    update(tickRate, biologicalImpact = { o2Prod: 0, co2Cons: 0, co2Prod: 0, n2Prod: 0, ch4Prod: 0, h2Cons: 0 }) {
        // Increment planetary age
        this.age += tickRate;
        this.starAge += tickRate;

        // Stellar aging: host star luminosity increases by 0.005 every 10 Myr
        let baseLuminosity = 1.0;
        if (this.starClass === 'm_dwarf') baseLuminosity = 0.05;
        if (this.starClass === 'blue_giant') baseLuminosity = 10.0;
        this.starLuminosity = (baseLuminosity * this.starSize) * (1.0 + (this.starAge / 10.0) * 0.005);
        
        // Base solar radiation (inverse square)
        let baseRad = 1.5;
        if (this.starClass === 'm_dwarf') baseRad = 4.5;
        if (this.starClass === 'blue_giant') baseRad = 7.5;
        let starRad = baseRad / (this.orbitDistance * this.orbitDistance);
        if (this.dustVeilActive) {
            starRad = Math.max(0.05, starRad * 0.8); // Aerosol dust veil blocks some starlight/radiation
        }
        this.radiation += (starRad - this.radiation) * 0.05 * tickRate;

        // Magnetic core decay: core cools down (rate depends on planet size and lunar tides)
        let coreDecayFactor = 1.0;
        if (this.planetSize === 'small') coreDecayFactor = 1.8;
        if (this.planetSize === 'large') coreDecayFactor = 0.4;
        
        // Scientific geodynamo preservation: lunar tides reduce core cooling decay by 50%
        const moonTidalPreservation = this.hasMoon ? 0.5 : 1.0;
        const decayRate = 0.07 * coreDecayFactor * moonTidalPreservation;
        
        this.magneticStrength = Math.max(0, this.magneticStrength - decayRate * tickRate);
        if (this.magneticStrength < 20.0) {
            this.hasMagnetosphere = false;
        }

        // Abiotic water photolysis under radiation
        if (this.activeSolvent === 'water' && this.waterCoverage > 0.0) {
            // Radiation splits water vapor into O2 and H2
            const photolysis = 0.005 * this.radiation * (this.waterCoverage / 100.0) * tickRate;
            this.waterCoverage = Math.max(0.0, this.waterCoverage - photolysis);
            this.o2 += photolysis * 0.4;
            this.h2 += photolysis * 0.8;
        }

        // Hydrogen gas atmospheric escape to space (lightest element escapes into the void)
        // Rate is 6x faster if magnetosphere is lost
        const h2EscapeRate = (this.hasMagnetosphere ? 0.04 : 0.25) * tickRate;
        this.h2 = Math.max(0.0, this.h2 - this.h2 * h2EscapeRate);

        // Atmospheric Stripping if magnetosphere is gone
        if (!this.hasMagnetosphere) {
            this.atmospherePressure = Math.max(0.1, this.atmospherePressure - 0.003 * this.radiation * tickRate);
            // Solar wind strips solvents slowly (over and above photolysis)
            this.waterCoverage = Math.max(0.0, this.waterCoverage - 0.04 * tickRate);
            this.ammoniaCoverage = Math.max(0.0, this.ammoniaCoverage - 0.05 * tickRate);
            this.methaneCoverage = Math.max(0.0, this.methaneCoverage - 0.05 * tickRate);
        }

        // Base equilibrium temp: T_eq = 278 * (L / d^2)^0.25 - 273.15
        const eqTemp = 278.0 * Math.pow(this.starLuminosity / (this.orbitDistance * this.orbitDistance), 0.25) - 273.15;
        
        // Greenhouse heating: CO2 (0.6x), CH4 (1.2x), H2 (0.4x) scaled by pressure, plus water/ammonia vapor feedback
        let vaporGreenhouse = 0.0;
        if (this.activeSolvent === 'water') {
            vaporGreenhouse = (this.waterCoverage / 100.0) * 8.0;
        } else if (this.activeSolvent === 'ammonia') {
            vaporGreenhouse = (this.ammoniaCoverage / 100.0) * 5.0;
        }
        const greenhouse = (this.co2 * 0.6 + this.ch4 * 1.2 + this.h2 * 0.4) * (this.atmospherePressure / 1.0) * 0.45 + vaporGreenhouse;

        // Cosmological effects
        let orbitalPerturbationHeating = this.orbitalPerturbationActive ? 8.0 : 0.0;
        let dustVeilCooling = this.dustVeilActive ? -15.0 : 0.0;

        // Albedo / Glaciation albedo cooling
        let albedoEffect = 0.0;
        if (this.activeSolvent === 'water' && this.temperature < -10.0) {
            this.isGlaciated = true;
        } else if (this.activeSolvent === 'water' && this.temperature > 5.0) {
            this.isGlaciated = false;
        }
        if (this.activeSolvent === 'ammonia' && this.temperature < -85.0) {
            this.isGlaciated = true;
        } else if (this.activeSolvent === 'ammonia' && this.temperature > -55.0) {
            this.isGlaciated = false;
        }
        
        if (this.isGlaciated) {
            albedoEffect = -35.0;
        }

        const targetTemp = eqTemp + greenhouse + orbitalPerturbationHeating + dustVeilCooling + albedoEffect + this.impactTemperatureOffset;
        this.targetTemperature = targetTemp;
        this.temperature += (targetTemp - this.temperature) * 0.05 * tickRate;

        if (this.impactCooldownMyr > 0.0) {
            this.impactCooldownMyr = Math.max(0.0, this.impactCooldownMyr - tickRate);
            const decay = this.impactOffsetDecayRate * tickRate;
            if (this.impactTemperatureOffset > 0.0) {
                this.impactTemperatureOffset = Math.max(0.0, this.impactTemperatureOffset - decay);
            } else {
                this.impactTemperatureOffset = Math.min(0.0, this.impactTemperatureOffset + decay);
            }

            if (this.impactCooldownMyr === 0.0) {
                this.impactTemperatureOffset = 0.0;
                if (this.nextImpactCooldownMyr > 0.0) {
                    this.impactTemperatureOffset = this.nextImpactTemperatureOffset;
                    this.impactCooldownMyr = this.nextImpactCooldownMyr;
                    this.impactOffsetDecayRate = this.nextImpactOffsetDecayRate;
                    this.nextImpactTemperatureOffset = 0.0;
                    this.nextImpactCooldownMyr = 0.0;
                    this.nextImpactOffsetDecayRate = 0.0;
                }
            }
        }

        // Phase transition checks and coverage interpolation
        const checkPhaseTransition = (current, target, freezePt, boilPt) => {
            if (this.temperature < freezePt) {
                // Freezing: coverages decline as solvent locks in ice state
                return Math.max(0, current - 2.5 * tickRate);
            } else if (this.temperature > boilPt) {
                // Evaporating: coverage declines as it boils off into atmosphere
                return Math.max(0, current - 3.5 * tickRate);
            } else {
                // Stable liquid state: smoothly recover towards base target coverage
                return current + (target - current) * 0.05 * tickRate;
            }
        };

        if (this.activeSolvent === 'water' || this.waterCoverage > 0) {
            this.waterCoverage = checkPhaseTransition(this.waterCoverage, this.targetWaterCoverage, 0.0, 100.0);
        }
        if (this.activeSolvent === 'ammonia' || this.ammoniaCoverage > 0) {
            this.ammoniaCoverage = checkPhaseTransition(this.ammoniaCoverage, this.targetAmmoniaCoverage, -78.0, -33.0);
        }
        if (this.activeSolvent === 'methane' || this.methaneCoverage > 0) {
            this.methaneCoverage = checkPhaseTransition(this.methaneCoverage, this.targetMethaneCoverage, -183.0, -140.0);
        }

        // Determine active solvent based on liquid temperature state and availability
        if (this.temperature >= 0 && this.temperature <= 100 && this.waterCoverage > 0) {
            this.activeSolvent = 'water';
        } else if (this.temperature >= -78 && this.temperature <= -33 && this.ammoniaCoverage > 0) {
            this.activeSolvent = 'ammonia';
        } else if (this.temperature >= -183 && this.temperature <= -140 && this.methaneCoverage > 0) {
            this.activeSolvent = 'methane';
        }

        // Photo-chemical Ozone formation from O2 (maxes out when O2 is high)
        if (this.o2 > 2.0) {
            const targetOzone = Math.min(1.0, this.o2 / 21.0);
            this.ozone += (targetOzone - this.ozone) * 0.05 * tickRate;
        } else {
            this.ozone = Math.max(0, this.ozone - 0.05 * tickRate);
        }

        // Continuous baseline tectonic outgassing of CO2 (geological carbon cycle)
        const tectonicCO2 = (this.magneticStrength > 10.0 ? 0.005 : 0.001) * tickRate;
        this.co2 += tectonicCO2;

        // Apply biological feedback to atmosphere gases
        if (this.activeSolvent === 'water') {
            if (biologicalImpact.o2Prod > 0) {
                const converted = Math.min(this.co2, biologicalImpact.o2Prod * tickRate * 0.1);
                this.co2 -= converted;
                this.o2 += converted;
            } else if (biologicalImpact.o2Prod < 0) {
                // Aerobic respiration exceeds photosynthesis: consume O2, release CO2
                const converted = Math.min(this.o2, -biologicalImpact.o2Prod * tickRate * 0.1);
                this.o2 -= converted;
                this.co2 += converted;
            }
            // Direct anaerobic/decomposer/fire CO2 production
            if (biologicalImpact.co2Prod > 0) {
                this.co2 += biologicalImpact.co2Prod * tickRate * 0.1;
            }
            // Terrestrial Nitrogen cycle feedback:
            if (biologicalImpact.n2Prod !== 0) {
                this.n2 += biologicalImpact.n2Prod * tickRate * 0.1;
                this.n2 = Math.max(0.1, this.n2);
            }
        } else if (this.activeSolvent === 'ammonia') {
            if (biologicalImpact.n2Prod > 0) {
                const converted = Math.min(this.co2, biologicalImpact.n2Prod * tickRate * 0.1);
                this.co2 -= converted;
                this.n2 += converted;
            }
        } else if (this.activeSolvent === 'methane') {
            if (biologicalImpact.ch4Prod > 0) {
                const converted = Math.min(this.h2, biologicalImpact.h2Cons * tickRate * 0.1);
                this.h2 -= converted;
                this.ch4 += biologicalImpact.ch4Prod * tickRate * 0.1;
            }
        }

        // Natural geological outgassing
        if (this.temperature > 85.0) {
            this.co2 += 0.03 * tickRate;
            this.o2 = Math.max(0.1, this.o2 - 0.02 * tickRate);
        }

        this.rebalanceAtmosphere();
    }
}
