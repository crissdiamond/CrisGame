/**
 * Handles canvas drawing for both Planet (macro) and Microscope (micro) views.
 * Incorporates ozone halos, magnetosphere lines, warning tracks, solvent color scales,
 * and speculative alien microbes.
 */
export class GameVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.viewMode = 'macro'; // 'macro' or 'micro'
        
        // Microscopic particle pool
        this.particles = [];
        this.initializedParticles = false;
        this.lastSolvent = null;
        
        // Planet rotation angle
        this.rotationAngle = 0;

        // Moon orbit angle
        this.moonAngle = 0.8;
        
        // Listen for canvas resizing
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Setup initial background particles for space
        this.stars = [];
        for (let i = 0; i < 60; i++) {
            this.stars.push({
                x: Math.random(),
                y: Math.random(),
                size: Math.random() * 1.5 + 0.5,
                brightness: Math.random()
            });
        }
    }

    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
        
        if (this.viewMode === 'micro' && !this.initializedParticles) {
            this.initMicroParticles();
        }
    }

    setViewMode(mode) {
        this.viewMode = mode;
        if (mode === 'micro') {
            this.initMicroParticles();
        }
    }

    initMicroParticles() {
        this.particles = [];
        this.initializedParticles = true;
    }

    syncParticles(planet, biology, cx, cy, microRad) {
        if (planet.activeSolvent !== this.lastSolvent) {
            this.particles = [];
            this.lastSolvent = planet.activeSolvent;
        }

        const targetCounts = {};

        if (planet.activeSolvent === 'water') {
            if (biology.unlockedSoup) targetCounts['soup'] = Math.max(1, Math.min(8, Math.floor(biology.organicSoup / 12)));
            if (biology.unlockedAnaerobic) targetCounts['anaerobic'] = Math.max(1, Math.min(6, Math.floor(biology.anaerobicPop / 20)));
            if (biology.unlockedPhotosynthetic) targetCounts['photosynthetic'] = Math.max(1, Math.min(6, Math.floor(biology.photosyntheticPop / 25)));
            if (biology.unlockedEukaryotic) targetCounts['eukaryotic'] = Math.max(1, Math.min(6, Math.floor(biology.eukaryoticPop / 20)));
            if (biology.unlockedMulticellular) targetCounts['multicellular'] = Math.max(1, Math.min(6, Math.floor(biology.multicellularPop / 15)));
            if (biology.unlockedSponges) targetCounts['sponges'] = Math.max(1, Math.min(5, Math.floor(biology.spongesPop / 20)));
            if (biology.unlockedMeduses) targetCounts['meduses'] = Math.max(1, Math.min(5, Math.floor(biology.medusesPop / 20)));
            if (biology.unlockedWorms) targetCounts['worms'] = Math.max(1, Math.min(5, Math.floor(biology.wormsPop / 20)));
            if (biology.unlockedFish) targetCounts['fish'] = Math.max(1, Math.min(5, Math.floor(biology.fishPop / 20)));
            if (biology.unlockedCambrian) targetCounts['cambrian'] = Math.max(1, Math.min(5, Math.floor(biology.cambrianPop / 20)));
            if (biology.unlockedLandPlants) targetCounts['plants'] = Math.max(1, Math.min(6, Math.floor(biology.landPlantsPop / 30)));
            if (biology.unlockedTetrapod) targetCounts['tetrapod'] = Math.max(1, Math.min(5, Math.floor(biology.tetrapodPop / 20)));
            if (biology.unlockedSauropsid) targetCounts['sauropsid'] = Math.max(1, Math.min(5, Math.floor(biology.sauropsidPop / 20)));
            if (biology.unlockedSynapsid) targetCounts['synapsid'] = Math.max(1, Math.min(5, Math.floor(biology.synapsidPop / 20)));
            if (biology.unlockedCognitive) targetCounts['cognitive'] = Math.max(1, Math.min(5, Math.floor(biology.cognitiveSpeciesPop / 20)));
            if (biology.unlockedTechnologicalAI) targetCounts['ai'] = Math.max(1, Math.min(5, Math.floor(biology.technologicalAIPop / 20)));
            if (biology.unlockedCyborg) targetCounts['cyborg'] = Math.max(1, Math.min(5, Math.floor(biology.cyborgPop / 20)));
            if (biology.unlockedNoosphere) targetCounts['noosphere'] = Math.max(1, Math.min(4, Math.floor(biology.noospherePop / 25)));
            if (biology.unlockedGaiaHivemind) targetCounts['gaia_hivemind'] = Math.max(1, Math.min(4, Math.floor(biology.gaiaHivemindPop / 25)));
        } else if (planet.activeSolvent === 'ammonia') {
            if (biology.unlockedAmmonicSoup) targetCounts['ammonic_soup'] = Math.max(1, Math.min(8, Math.floor(biology.ammonicSoup / 12)));
            if (biology.unlockedAmmonicProto) targetCounts['ammonic_proto'] = Math.max(1, Math.min(6, Math.floor(biology.ammonicProtoPop / 20)));
            if (biology.unlockedAmmonicMulti) targetCounts['ammonic_multi'] = Math.max(1, Math.min(6, Math.floor(biology.ammonicMultiPop / 15)));
            if (biology.unlockedSilicoFlora) targetCounts['silico_flora'] = Math.max(1, Math.min(6, Math.floor(biology.silicoFloraPop / 20)));
            if (biology.unlockedCryoFauna) targetCounts['cryo_fauna'] = Math.max(1, Math.min(5, Math.floor(biology.cryoFaunaPop / 20)));
            if (biology.unlockedCrystallineCognitive) targetCounts['crystalline_cognitive'] = Math.max(1, Math.min(5, Math.floor(biology.crystallineCognitivePop / 16)));
            if (biology.unlockedQuantumLattice) targetCounts['quantum_lattices'] = Math.max(1, Math.min(4, Math.floor(biology.quantumLatticePop / 25)));
            if (biology.unlockedCryoHivemind) targetCounts['cryo_hivemind'] = Math.max(1, Math.min(4, Math.floor(biology.cryoHivemindPop / 25)));
        } else if (planet.activeSolvent === 'methane') {
            if (biology.unlockedMethaneSoup) targetCounts['methane_soup'] = Math.max(1, Math.min(8, Math.floor(biology.methaneSoup / 12)));
            if (biology.unlockedMethaneProto) targetCounts['methane_proto'] = Math.max(1, Math.min(6, Math.floor(biology.methaneProtoPop / 20)));
            if (biology.unlockedMethaneMulti) targetCounts['methane_multi'] = Math.max(1, Math.min(6, Math.floor(biology.methaneMultiPop / 15)));
            if (biology.unlockedCryoOrganisms) targetCounts['cryo_organisms'] = Math.max(1, Math.min(5, Math.floor(biology.cryoOrganismsPop / 15)));
            if (biology.unlockedCryoPolymerNetwork) targetCounts['cryo_polymer_network'] = Math.max(1, Math.min(5, Math.floor(biology.cryoPolymerNetworkPop / 12)));
            if (biology.unlockedThinkingOcean) targetCounts['thinking_ocean'] = Math.max(1, Math.min(4, Math.floor(biology.thinkingOceanPop / 25)));
            if (biology.unlockedCryoColloid) targetCounts['cryo_colloids'] = Math.max(1, Math.min(4, Math.floor(biology.cryoColloidPop / 25)));
        }

        const allTypes = [
            'soup', 'anaerobic', 'photosynthetic', 'eukaryotic', 'multicellular',
            'sponges', 'meduses', 'worms', 'fish', 'cambrian', 'plants', 'tetrapod',
            'sauropsid', 'synapsid', 'cognitive', 'ai', 'cyborg', 'noosphere', 'gaia_hivemind',
            'ammonic_soup', 'ammonic_proto', 'ammonic_multi', 'silico_flora', 'cryo_fauna',
            'crystalline_cognitive', 'quantum_lattices', 'cryo_hivemind',
            'methane_soup', 'methane_proto', 'methane_multi', 'cryo_organisms',
            'cryo_polymer_network', 'thinking_ocean', 'cryo_colloids'
        ];

        allTypes.forEach(type => {
            const targetCount = targetCounts[type] || 0;
            const currentParticles = this.particles.filter(p => p.type === type);
            const currentCount = currentParticles.length;

            if (currentCount < targetCount) {
                const toAdd = targetCount - currentCount;
                for (let i = 0; i < toAdd; i++) {
                    const r = Math.random() * (microRad - 25);
                    const angle = Math.random() * Math.PI * 2;
                    const px = cx + Math.cos(angle) * r;
                    const py = cy + Math.sin(angle) * r;

                    let motionType = 'wander';
                    let speed = 0.4 + Math.random() * 0.4;

                    if (['soup', 'ammonic_soup', 'methane_soup'].includes(type)) {
                        motionType = 'drift';
                        speed = 0.12 + Math.random() * 0.08;
                    } else if ([
                        'sponges', 'plants', 'silico_flora', 'quantum_lattices', 
                        'cryo_polymer_network', 'thinking_ocean', 'cryo_colloids', 
                        'noosphere', 'gaia_hivemind', 'cryo_hivemind'
                    ].includes(type)) {
                        motionType = 'static';
                        speed = 0;
                    } else {
                        if (['anaerobic', 'photosynthetic', 'ammonic_proto', 'methane_proto'].includes(type)) {
                            speed = 0.2 + Math.random() * 0.15;
                        } else if (['eukaryotic', 'multicellular', 'ammonic_multi', 'methane_multi'].includes(type)) {
                            speed = 0.3 + Math.random() * 0.2;
                        } else {
                            speed = 0.5 + Math.random() * 0.4;
                        }
                    }

                    this.particles.push({
                        x: px,
                        y: py,
                        vx: motionType === 'static' ? 0 : (Math.random() - 0.5) * speed,
                        vy: motionType === 'static' ? 0 : (Math.random() - 0.5) * speed,
                        type: type,
                        motionType: motionType,
                        speed: speed,
                        angle: Math.random() * Math.PI * 2,
                        size: Math.random() * 3 + 2,
                        wobble: Math.random() * Math.PI * 2,
                        wobbleSpeed: 0.02 + Math.random() * 0.04
                    });
                }
            } else if (currentCount > targetCount) {
                let toRemove = currentCount - targetCount;
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    if (toRemove <= 0) break;
                    if (this.particles[i].type === type) {
                        this.particles.splice(i, 1);
                        toRemove--;
                    }
                }
            }
        });
    }

    draw(planet, biology) {
        const container = this.canvas.parentElement;
        if (container) {
            const currentW = container.clientWidth;
            const currentH = container.clientHeight;
            if (currentW > 0 && currentH > 0 && (this.canvas.width !== currentW || this.canvas.height !== currentH)) {
                this.resize();
            }
        }

        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        ctx.fillStyle = '#05070a';
        ctx.fillRect(0, 0, w, h);

        if (this.viewMode === 'macro') {
            this.drawMacroView(planet, biology, w, h, ctx);
        } else {
            this.drawMicroView(planet, biology, w, h, ctx);
        }
    }

    drawMacroView(planet, biology, w, h, ctx) {
        // 1. Draw Space background stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.stars.forEach(star => {
            star.brightness += (Math.random() - 0.5) * 0.05;
            star.brightness = Math.max(0.2, Math.min(1.0, star.brightness));
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.fillRect(star.x * w, star.y * h, star.size, star.size);
        });

        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.32;

        this.rotationAngle += 0.002;
        this.moonAngle = (this.moonAngle + 0.004) % (Math.PI * 2); // moon orbits slowly

        const moon = this.getMoonGeometry(cx, cy, radius, w, h);

        // 2. Draw Moon orbit path and the far-side moon before the planet.
        if (planet.hasMoon) {
            this.drawMoonOrbit(ctx, cx, cy, moon);
            if (moon.isBehind) {
                this.drawMoonBody(ctx, moon.x, moon.y, moon.radius);
            }
        }

        // 3. Draw Magnetosphere Field Lines
        if (planet.hasMagnetosphere) {
            ctx.strokeStyle = `rgba(0, 242, 254, ${(planet.magneticStrength / 100) * 0.15})`;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) {
                const rx = radius * (1.2 + i * 0.15);
                const ry = radius * (1.5 + i * 0.25);
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, -Math.PI / 2, Math.PI / 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, Math.PI / 2, -Math.PI / 2);
                ctx.stroke();
            }
        }

        // 4. Draw Solar Wind Stripping (particles blowing across unshielded planet)
        if (!planet.hasMagnetosphere && planet.radiation > 4.0) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            for (let i = 0; i < 15; i++) {
                const px = (Date.now() * 0.15 + i * 50) % w;
                const py = cy + Math.sin(i + Date.now()*0.002) * (radius * 1.4);
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI*2);
                ctx.fill();
            }
        }

        // 5. Draw Ozone Layer outer shell
        if (planet.ozone > 0.1) {
            ctx.strokeStyle = `rgba(14, 165, 233, ${planet.ozone * 0.45})`;
            ctx.lineWidth = 4 + planet.ozone * 6;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 1.07, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 6. Draw Planet Atmosphere Glow Halo
        const glowRad = radius * 1.25;
        const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.95, cx, cy, glowRad);
        
        let haloColor = 'rgba(239, 68, 68, 0.2)';
        if (planet.activeSolvent === 'water') {
            haloColor = planet.o2 > 15.0 ? 'rgba(0, 242, 254, 0.35)' : 'rgba(168, 85, 247, 0.2)';
        } else if (planet.activeSolvent === 'ammonia') {
            haloColor = 'rgba(139, 92, 246, 0.3)'; // violet ammonic haze
        } else if (planet.activeSolvent === 'methane') {
            haloColor = 'rgba(245, 158, 11, 0.25)'; // orange hydrocarbon glow
        }
        
        glowGrad.addColorStop(0, haloColor);
        glowGrad.addColorStop(0.3, haloColor);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // 7. Draw Planet Body
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.clip();

        // Base Landmass
        let baseColor = '#1d1715';
        if (planet.temperature > 85.0) {
            baseColor = '#3f0d02'; // magma base
        } else if (planet.temperature < -40.0) {
            baseColor = '#1e293b'; // icy dark base
        }
        ctx.fillStyle = baseColor;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

        // Draw continents
        const numContinents = 7;
        for (let i = 0; i < numContinents; i++) {
            const angleOffset = (i / numContinents) * Math.PI * 2;
            const rotX = ((this.rotationAngle + angleOffset) % (Math.PI * 2));
            const posX = cx + Math.cos(rotX) * radius * 1.1;
            const posY = cy + Math.sin(i * 1.5) * radius * 0.4;
            const cRadius = radius * (0.35 + (i % 3) * 0.08);

            // Determine land biome coloration based on unlocked life forms and climate
            let landColor = '#2d2424';
            if (planet.temperature < -40.0 || planet.isGlaciated) {
                landColor = '#e2e8f0'; // snow cover
            } else if (planet.activeSolvent === 'water') {
                if (biology.synapsidPop > 15.0 && biology.synapsidPop > biology.sauropsidPop) {
                    landColor = '#065f46'; // Mammalian temperate forest
                } else if (biology.sauropsidPop > 15.0) {
                    landColor = '#78350f'; // Dinosaur arid/greenhouse rust
                } else if (biology.landPlantsPop > 10.0) {
                    landColor = '#10b981'; // Green land moss
                } else if (biology.anaerobicPop > 10.0) {
                    landColor = '#3f6212'; // Olive bacterial mats
                }
            } else if (planet.activeSolvent === 'ammonia') {
                if (biology.silicoFloraPop > 5.0) {
                    landColor = '#1e1b4b'; // Crystalline indigo silico-flora
                } else if (biology.ammonicProtoPop > 5.0) {
                    landColor = '#4338ca'; // Indanthrene bacterial cover
                }
            } else if (planet.activeSolvent === 'methane') {
                if (biology.methaneProtoPop > 5.0) {
                    landColor = '#7c2d12'; // Orange organic tholin crust
                }
            }

            if (Math.sin(rotX) >= -0.3) {
                ctx.fillStyle = landColor;
                ctx.beginPath();
                ctx.arc(posX, posY, cRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw Oceans/Liquids Overlay
        const solventCoverage = planet.getSolventCoverage();
        if (solventCoverage > 0) {
            let liquidColor = 'rgba(14, 116, 144, 0.6)'; // default water cyan
            
            if (planet.activeSolvent === 'water') {
                if (planet.temperature < 0 || planet.isGlaciated) {
                    liquidColor = 'rgba(241, 245, 249, 0.9)'; // frozen solid water
                } else if (planet.temperature > 90) {
                    liquidColor = 'rgba(180, 83, 9, 0.35)'; // boiling mud
                } else if (biology.unlockedPhotosynthetic && biology.photosyntheticPop > 20.0) {
                    liquidColor = 'rgba(13, 148, 136, 0.7)'; // teal photosynthetic oceans
                } else if (biology.unlockedSoup) {
                    liquidColor = 'rgba(58, 28, 112, 0.6)'; // purplish soup
                }
            } else if (planet.activeSolvent === 'ammonia') {
                liquidColor = 'rgba(124, 58, 237, 0.55)'; // purple ammonia oceans
            } else if (planet.activeSolvent === 'methane') {
                liquidColor = 'rgba(217, 119, 6, 0.6)'; // orange liquid methane lakes
            }

            ctx.fillStyle = liquidColor;
            ctx.save();
            const waterHeight = radius * 2 * (solventCoverage / 100);
            ctx.beginPath();
            ctx.rect(cx - radius, cy + radius - waterHeight, radius * 2, waterHeight);
            ctx.fill();
            ctx.restore();
        }

        // Draw Technosphere & Noosphere (AI/Quantum/Cyborg grids overlay on continents)
        if (biology.technologicalAIPop > 0.5 || biology.noospherePop > 0.5) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.clip(); // clip to planet sphere

            const isNoosphere = biology.noospherePop > 0.5;
            const density = isNoosphere ? 5 : 3;
            const opacity = isNoosphere 
                ? Math.min(0.85, (biology.noospherePop + biology.technologicalAIPop) / 100.0)
                : Math.min(0.65, biology.technologicalAIPop / 80.0);
            
            ctx.strokeStyle = isNoosphere ? `rgba(245, 158, 11, ${opacity * 0.8})` : `rgba(0, 242, 254, ${opacity})`;
            ctx.lineWidth = isNoosphere ? 1.5 : 1;
            ctx.beginPath();
            
            // Circuit grid lines overlay
            for (let i = -density; i <= density; i++) {
                const lat = cy + i * (radius * (0.8 / density));
                const dx = Math.sqrt(Math.max(0, radius*radius - (lat-cy)*(lat-cy)));
                ctx.moveTo(cx - dx, lat);
                ctx.lineTo(cx + dx, lat);
            }
            for (let i = -density; i <= density; i++) {
                const lngX = cx + i * (radius * (0.8 / density)) + Math.sin(this.rotationAngle) * 8;
                const dy = Math.sqrt(Math.max(0, radius*radius - (lngX-cx)*(lngX-cx)));
                ctx.moveTo(lngX, cy - dy);
                ctx.lineTo(lngX, cy + dy);
            }
            ctx.stroke();
            
            // Draw city nodes / computation hubs
            ctx.fillStyle = isNoosphere ? 'rgba(0, 242, 254, 0.9)' : 'rgba(52, 211, 153, 0.8)';
            const numHubs = isNoosphere ? 12 : 6;
            for (let i = 0; i < numHubs; i++) {
                const dotX = cx + Math.cos(this.rotationAngle + i * 1.3) * (radius * (0.3 + (i % 3) * 0.15));
                const dotY = cy + Math.sin(i * 2.3) * (radius * 0.45);
                ctx.beginPath();
                ctx.arc(dotX, dotY, isNoosphere ? 2.5 : 2, 0, Math.PI*2);
                ctx.fill();
                
                // Pulsing hub aura
                if (isNoosphere) {
                    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, 4 + Math.sin(Date.now() * 0.005 + i) * 3, 0, Math.PI*2);
                    ctx.stroke();
                }
            }
            ctx.restore();
        }

        // Draw Gaia Biosphere Hivemind (Pulsing green/emerald mycelial connections winding across landmasses)
        if (biology.gaiaHivemindPop > 0.5) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.clip(); // clip to planet sphere

            const pulseOpacity = 0.2 + 0.45 * Math.sin(Date.now() * 0.002);
            ctx.strokeStyle = `rgba(16, 185, 129, ${pulseOpacity})`;
            ctx.lineWidth = 1.8;
            ctx.shadowColor = 'rgba(52, 211, 153, 0.8)';
            ctx.shadowBlur = 6;
            ctx.beginPath();

            // Draw organic curves representing root/mycelial junctions
            for (let i = 0; i < 5; i++) {
                const x1 = cx + Math.cos(this.rotationAngle + i * 1.5) * radius * 0.6;
                const y1 = cy + Math.sin(i * 1.2) * radius * 0.5;
                const x2 = cx + Math.cos(this.rotationAngle + (i + 1) * 1.5) * radius * 0.6;
                const y2 = cy + Math.sin((i + 1) * 1.2) * radius * 0.5;
                
                ctx.moveTo(x1, y1);
                ctx.quadraticCurveTo(cx + Math.sin(this.rotationAngle * 2 + i) * 20, cy + Math.cos(this.rotationAngle + i) * 20, x2, y2);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Draw Ammonic Quantum Lattices (Glowing blue crystal fractures across sub-freezing glacier continents)
        if (biology.quantumLatticePop > 0.5) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.clip(); // clip to planet sphere

            ctx.strokeStyle = 'rgba(14, 165, 233, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();

            // Draw geometric cracks from poles down
            const pulseSize = Math.sin(Date.now() * 0.003) * 4;
            const poles = [
                { px: cx, py: cy - radius * 0.8 },
                { px: cx, py: cy + radius * 0.8 }
            ];

            poles.forEach(p => {
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3 + this.rotationAngle * 0.5;
                    ctx.moveTo(p.px, p.py);
                    ctx.lineTo(
                        p.px + Math.cos(angle) * (radius * 0.35 + pulseSize), 
                        p.py + Math.sin(angle) * (radius * 0.25)
                    );
                }
            });
            ctx.stroke();
            ctx.restore();
        }

        // Draw Methane Thinking Ocean (Slowly rotating geometric hydrocarbon structures inside the liquid layer)
        if (biology.thinkingOceanPop > 0.5) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.clip(); // clip to planet sphere

            const solventCoverage = planet.getSolventCoverage();
            const waterHeight = radius * 2 * (solventCoverage / 100);
            
            // Clip to water layer specifically
            ctx.beginPath();
            ctx.rect(cx - radius, cy + radius - waterHeight, radius * 2, waterHeight);
            ctx.clip();

            // Draw orange/gold geometric rings floating in methane oceans
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
            ctx.lineWidth = 1.5;
            
            const numPatterns = 3;
            for (let i = 0; i < numPatterns; i++) {
                const rx = radius * (0.4 + i * 0.15);
                const ry = radius * (0.12 + i * 0.04);
                const py = cy + radius * 0.6 - (i * 12);
                
                ctx.beginPath();
                ctx.ellipse(cx + Math.sin(this.rotationAngle * 0.5 + i) * 15, py, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Draw volcanic outgassing fissures
        if (planet.temperature > 75.0) {
            const glowIntensity = Math.min(0.8, (planet.temperature - 75.0) / 75.0);
            ctx.strokeStyle = `rgba(239, 68, 68, ${glowIntensity})`;
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(239, 68, 68, 1)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(cx - radius * 0.4, cy - radius * 0.3);
            ctx.lineTo(cx + radius * 0.2, cy + radius * 0.4);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Spherical 3D shading
        const shadowGrad = ctx.createRadialGradient(
            cx - radius * 0.3, cy - radius * 0.3, radius * 0.2,
            cx, cy, radius
        );
        shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
        shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 8. Draw near-side Moon after the planet so the orbital depth is clear.
        if (planet.hasMoon && !moon.isBehind) {
            this.drawMoonBody(ctx, moon.x, moon.y, moon.radius);
        }

        // 9. Draw Incoming Warnings (e.g. Asteroids, passing stars)
        // Check if there is an active warning for asteroid
        // We look at planet.age or warning lists
    }

    getMoonGeometry(cx, cy, planetRadius, w, h) {
        const moonRadius = Math.max(8, planetRadius * 0.22);
        const horizontalLimit = Math.max(planetRadius * 1.2, (w / 2) - moonRadius * 1.8);
        const verticalLimit = Math.max(planetRadius * 0.55, (h / 2) - moonRadius * 1.8);
        const orbitRadiusX = Math.min(planetRadius * 1.85, horizontalLimit);
        const orbitRadiusY = Math.min(planetRadius * 0.72, verticalLimit);

        return {
            radius: moonRadius,
            orbitRadiusX,
            orbitRadiusY,
            x: cx + Math.cos(this.moonAngle) * orbitRadiusX,
            y: cy + Math.sin(this.moonAngle) * orbitRadiusY,
            isBehind: Math.sin(this.moonAngle) < 0
        };
    }

    drawMoonOrbit(ctx, cx, cy, moon) {
        ctx.save();
        ctx.setLineDash([3, 8]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, moon.orbitRadiusX, moon.orbitRadiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    drawMoonBody(ctx, moonX, moonY, moonRadius) {
        // Moon glow halo
        const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.7, moonX, moonY, moonRadius * 1.6);
        moonGlow.addColorStop(0, 'rgba(200, 210, 230, 0.12)');
        moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Moon body
        const moonBodyGrad = ctx.createRadialGradient(
            moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, moonRadius * 0.05,
            moonX, moonY, moonRadius
        );
        moonBodyGrad.addColorStop(0, '#b0b8c8');
        moonBodyGrad.addColorStop(0.55, '#7c8494');
        moonBodyGrad.addColorStop(1, '#2a2e38');
        ctx.fillStyle = moonBodyGrad;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fill();

        // Moon craters
        ctx.fillStyle = 'rgba(40, 44, 56, 0.55)';
        const craters = [
            { dx: 0.25, dy: -0.2, r: 0.22 },
            { dx: -0.3, dy: 0.25, r: 0.16 },
            { dx: 0.05, dy: 0.35, r: 0.12 }
        ];
        craters.forEach(c => {
            ctx.beginPath();
            ctx.arc(moonX + c.dx * moonRadius, moonY + c.dy * moonRadius, c.r * moonRadius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Night side shadow gradient
        const shadowGradMoon = ctx.createRadialGradient(
            moonX + moonRadius * 0.4, moonY + moonRadius * 0.4, moonRadius * 0.1,
            moonX, moonY, moonRadius
        );
        shadowGradMoon.addColorStop(0, 'rgba(0,0,0,0)');
        shadowGradMoon.addColorStop(0.6, 'rgba(0,0,0,0.3)');
        shadowGradMoon.addColorStop(1, 'rgba(0,0,0,0.82)');
        ctx.fillStyle = shadowGradMoon;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawMicroView(planet, biology, w, h, ctx) {
        const cx = w / 2;
        const cy = h / 2;
        const microRad = Math.min(w, h) * 0.44;

        // Outer mask
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, microRad, 0, Math.PI * 2);
        ctx.rect(w, 0, -w, h);
        ctx.fillStyle = '#030406';
        ctx.fill();
        ctx.restore();

        // Lens frame border
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, microRad, 0, Math.PI * 2);
        ctx.stroke();

        // Lens background tint
        const lensGlow = ctx.createRadialGradient(cx, cy, microRad * 0.8, cx, cy, microRad);
        let lensColor = 'rgba(0, 242, 254, 0.05)';
        if (planet.activeSolvent === 'ammonia') lensColor = 'rgba(139, 92, 246, 0.06)';
        else if (planet.activeSolvent === 'methane') lensColor = 'rgba(245, 158, 11, 0.06)';
        lensGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
        lensGlow.addColorStop(1, lensColor);
        ctx.fillStyle = lensGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, microRad, 0, Math.PI * 2);
        ctx.fill();

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        for (let x = cx - microRad; x < cx + microRad; x += 40) {
            ctx.beginPath();
            const len = Math.sqrt(microRad*microRad - (x-cx)*(x-cx));
            ctx.moveTo(x, cy - len);
            ctx.lineTo(x, cy + len);
            ctx.stroke();
        }
        for (let y = cy - microRad; y < cy + microRad; y += 40) {
            ctx.beginPath();
            const len = Math.sqrt(microRad*microRad - (y-cy)*(y-cy));
            ctx.moveTo(cx - len, y);
            ctx.lineTo(cx + len, y);
            ctx.stroke();
        }

        // Draw microbes
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, microRad - 3, 0, Math.PI * 2);
        ctx.clip();

        // Sync particles based on actual biological populations
        this.syncParticles(planet, biology, cx, cy, microRad);

        this.particles.forEach(p => {
            // Update movement based on motionType
            if (p.motionType === 'drift') {
                p.angle += (Math.random() - 0.5) * 0.04;
                p.vx = Math.cos(p.angle) * p.speed;
                p.vy = Math.sin(p.angle) * p.speed;
                p.x += p.vx;
                p.y += p.vy;
            } else if (p.motionType === 'wander') {
                p.angle += (Math.random() - 0.5) * 0.15;
                const targetVx = Math.cos(p.angle) * p.speed;
                const targetVy = Math.sin(p.angle) * p.speed;
                p.vx += (targetVx - p.vx) * 0.1;
                p.vy += (targetVy - p.vy) * 0.1;
                p.x += p.vx;
                p.y += p.vy;
            } else {
                p.vx = 0;
                p.vy = 0;
            }

            // Boundary steering and clamping
            const particleMargin = Math.max(18, p.size * 4);
            const innerRadius = microRad - particleMargin;
            const dist = Math.hypot(p.x - cx, p.y - cy);
            
            if (dist > innerRadius) {
                const angleFromCenter = Math.atan2(p.y - cy, p.x - cx);
                p.x = cx + Math.cos(angleFromCenter) * innerRadius;
                p.y = cy + Math.sin(angleFromCenter) * innerRadius;
                
                const angleToCenter = Math.atan2(cy - p.y, cx - p.x);
                p.angle = angleToCenter + (Math.random() - 0.5) * 0.5;
                if (p.motionType !== 'static') {
                    p.vx = Math.cos(p.angle) * p.speed;
                    p.vy = Math.sin(p.angle) * p.speed;
                }
            }

            p.wobble += p.wobbleSpeed;

            // Draw micro shapes
            ctx.save();
            ctx.translate(p.x, p.y);
            
            if (p.type === 'soup') {
                ctx.fillStyle = 'rgba(168, 85, 247, 0.45)'; // Purple (Anaerobic)
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI*2);
                ctx.arc(6, Math.sin(p.wobble)*3, 1.8, 0, Math.PI*2);
                ctx.arc(-6, -Math.sin(p.wobble)*3, 1.8, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'anaerobic') {
                ctx.rotate(Math.atan2(p.vy, p.vx));
                ctx.fillStyle = 'rgba(168, 85, 247, 0.65)'; // Purple (Anaerobic)
                ctx.strokeStyle = 'rgba(192, 132, 252, 0.8)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect(-7, -3.5, 14, 7, 3);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'photosynthetic') {
                ctx.rotate(p.wobble * 0.1);
                ctx.fillStyle = 'rgba(16, 185, 129, 0.6)'; // Green (Photosynthetic)
                ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'eukaryotic') {
                ctx.fillStyle = 'rgba(192, 132, 252, 0.5)'; // Light Purple (Anaerobic)
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
                ctx.beginPath();
                ctx.arc(1, 1, 2.5, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'multicellular') {
                ctx.rotate(p.wobble * 0.05);
                ctx.fillStyle = 'rgba(6, 182, 212, 0.55)'; // Cyan (Multicellular)
                ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
                ctx.beginPath();
                ctx.arc(0, 0, 3.5, 0, Math.PI*2);
                ctx.arc(6, 2, 3, 0, Math.PI*2);
                ctx.arc(-5, -3, 3, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'sponges') {
                ctx.rotate(p.wobble * 0.1);
                ctx.fillStyle = 'rgba(6, 182, 212, 0.6)'; // Cyan (Multicellular)
                ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-6, 8);
                ctx.lineTo(-4, -6);
                ctx.quadraticCurveTo(0, -9, 4, -6);
                ctx.lineTo(6, 8);
                ctx.quadraticCurveTo(0, 10, -6, 8);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = 'rgba(67, 20, 7, 0.7)';
                ctx.beginPath();
                ctx.arc(-2, 2, 1.2, 0, Math.PI*2);
                ctx.arc(2, 4, 1, 0, Math.PI*2);
                ctx.arc(0, -2, 1.5, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'meduses') {
                ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI/2);
                ctx.fillStyle = 'rgba(6, 182, 212, 0.5)'; // Cyan (Multicellular)
                ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(0, -2, 6, Math.PI, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
                ctx.lineWidth = 1;
                for (let j = -2; j <= 2; j += 2) {
                    ctx.beginPath();
                    ctx.moveTo(j, 0);
                    ctx.quadraticCurveTo(
                        j + Math.sin(p.wobble * 2 + j) * 2, 
                        5, 
                        j + Math.sin(p.wobble * 2 + j * 0.5) * 4, 
                        10
                    );
                    ctx.stroke();
                }
            } else if (p.type === 'worms') {
                ctx.rotate(Math.atan2(p.vy, p.vx));
                ctx.fillStyle = 'rgba(6, 182, 212, 0.6)'; // Cyan (Multicellular)
                ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
                ctx.lineWidth = 1.2;
                for (let j = 0; j < 5; j++) {
                    const segX = -j * 3.5;
                    const segY = Math.sin(p.wobble * 1.5 - j * 0.8) * 2.2;
                    const segRad = 3.5 - j * 0.4;
                    ctx.beginPath();
                    ctx.arc(segX, segY, segRad, 0, Math.PI*2);
                    ctx.fill();
                    ctx.stroke();
                }
            } else if (p.type === 'fish') {
                ctx.rotate(Math.atan2(p.vy, p.vx));
                ctx.fillStyle = 'rgba(245, 158, 11, 0.6)'; // Amber (Complex)
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                const tailX = -7;
                const tailY = Math.sin(p.wobble * 2.5) * 3;
                ctx.beginPath();
                ctx.moveTo(tailX, 0);
                ctx.lineTo(tailX - 4, tailY - 3);
                ctx.lineTo(tailX - 2, tailY);
                ctx.lineTo(tailX - 4, tailY + 3);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(4, -1, 1, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'cambrian') {
                ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI/2);
                ctx.fillStyle = 'rgba(6, 182, 212, 0.55)'; // Cyan (Multicellular)
                ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(0, 0, 6, 10, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-5, -2); ctx.lineTo(5, -2);
                ctx.moveTo(-6, 2); ctx.lineTo(5, 2);
                ctx.stroke();
            } else if (p.type === 'plants') {
                ctx.fillStyle = 'rgba(4, 120, 87, 0.7)'; // Green (Photosynthetic)
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(-5, -5, 10, 10);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'tetrapod') {
                ctx.rotate(Math.atan2(p.vy, p.vx));
                ctx.fillStyle = 'rgba(245, 158, 11, 0.65)'; // Amber (Complex)
                ctx.beginPath();
                ctx.arc(4, 0, 5, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(-1, 0);
                ctx.quadraticCurveTo(-7, Math.sin(p.wobble*2)*4, -14, 0);
                ctx.stroke();
            } else if (p.type === 'sauropsid') {
                ctx.fillStyle = 'rgba(245, 158, 11, 0.6)'; // Amber (Complex)
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(6, 0);
                ctx.lineTo(0, 6);
                ctx.lineTo(-6, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'synapsid') {
                ctx.fillStyle = 'rgba(245, 158, 11, 0.6)'; // Amber (Complex)
                ctx.strokeStyle = '#f59e0b';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'cognitive') {
                ctx.fillStyle = 'rgba(236, 72, 153, 0.65)'; // Pink (Sentient)
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-3, -3); ctx.lineTo(-8, -8);
                ctx.moveTo(3, -3); ctx.lineTo(8, -8);
                ctx.moveTo(0, 3); ctx.lineTo(0, 9);
                ctx.stroke();
            } else if (p.type === 'ai') {
                ctx.fillStyle = 'rgba(236, 72, 153, 0.8)'; // Pink (Sentient)
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(-6, -6, 12, 12);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
                ctx.moveTo(0, -3); ctx.lineTo(0, 3);
                ctx.stroke();
            } else if (p.type === 'cyborg') {
                ctx.fillStyle = 'rgba(236, 72, 153, 0.65)'; // Pink (Sentient)
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(-3, -3); ctx.lineTo(3, 3);
                ctx.moveTo(3, -3); ctx.lineTo(-3, 3);
                ctx.stroke();
            } else if (p.type === 'noosphere') {
                ctx.rotate(p.wobble * 0.1);
                ctx.fillStyle = 'rgba(236, 72, 153, 0.7)'; // Pink (Sentient)
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(-5, -5, 10, 10);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
                ctx.beginPath();
                ctx.arc(0, 0, 8 + Math.sin(p.wobble)*3, 0, Math.PI*2);
                ctx.stroke();
            } else if (p.type === 'gaia_hivemind') {
                ctx.rotate(p.wobble * 0.05);
                ctx.fillStyle = 'rgba(236, 72, 153, 0.6)'; // Pink (Sentient)
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
                ctx.beginPath();
                for (let j = 0; j < 4; j++) {
                    const angle = (j * Math.PI) / 2;
                    ctx.moveTo(Math.cos(angle)*6, Math.sin(angle)*6);
                    ctx.lineTo(Math.cos(angle)*10, Math.sin(angle)*10);
                }
                ctx.stroke();
            }
            
            else if (p.type === 'ammonic_soup') {
                ctx.fillStyle = 'rgba(168, 85, 247, 0.4)'; // Purple (Anaerobic)
                ctx.beginPath();
                ctx.rect(-3, -3, 6, 6);
                ctx.fill();
            } else if (p.type === 'ammonic_proto') {
                ctx.rotate(p.wobble * 0.2);
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)'; // Purple (Anaerobic)
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(-8, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
            } else if (p.type === 'ammonic_multi') {
                ctx.fillStyle = 'rgba(6, 182, 212, 0.6)'; // Cyan (Multicellular)
                ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(5, 4);
                ctx.lineTo(-5, 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'silico_flora') {
                ctx.fillStyle = '#10b981'; // Green (Photosynthetic)
                ctx.beginPath();
                ctx.arc(0, -3, 3, 0, Math.PI*2);
                ctx.arc(4, 3, 2.5, 0, Math.PI*2);
                ctx.arc(-4, 3, 2.5, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'cryo_fauna') {
                ctx.rotate(p.wobble*0.05);
                ctx.fillStyle = '#f59e0b'; // Amber (Complex)
                ctx.beginPath();
                ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'crystalline_cognitive') {
                ctx.rotate(p.wobble * 0.1);
                ctx.fillStyle = 'rgba(236, 72, 153, 0.65)'; // Pink (Sentient)
                ctx.strokeStyle = '#ec4899';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                for (let j = 0; j < 6; j++) {
                    const angle = (j * Math.PI) / 3;
                    ctx.lineTo(Math.cos(angle) * 7, Math.sin(angle) * 7);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'quantum_lattices') {
                ctx.rotate(p.wobble * 0.08);
                ctx.fillStyle = 'rgba(236, 72, 153, 0.65)'; // Pink (Sentient)
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(6, 0);
                ctx.lineTo(0, 6);
                ctx.lineTo(-6, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, 1.8, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'cryo_hivemind') {
                ctx.rotate(p.wobble * 0.05);
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
                ctx.fillStyle = 'rgba(236, 72, 153, 0.5)'; // Pink (Sentient)
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(0, 0, 3, 7, 0, 0, Math.PI*2);
                ctx.stroke();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(6, -4, 2, 0, Math.PI*2);
                ctx.fill();
            }
 
            else if (p.type === 'methane_soup') {
                ctx.fillStyle = 'rgba(168, 85, 247, 0.35)'; // Purple (Anaerobic)
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'methane_proto') {
                ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)'; // Purple (Anaerobic)
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI*2);
                ctx.stroke();
            } else if (p.type === 'methane_multi') {
                ctx.fillStyle = 'rgba(6, 182, 212, 0.5)'; // Cyan (Multicellular)
                ctx.beginPath();
                ctx.arc(-4, 0, 2.5, 0, Math.PI*2);
                ctx.arc(1, 1, 2.5, 0, Math.PI*2);
                ctx.arc(5, -1, 2.5, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'cryo_organisms') {
                ctx.rotate(p.wobble * 0.1);
                ctx.fillStyle = '#f59e0b'; // Amber (Complex)
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'cryo_polymer_network') {
                ctx.fillStyle = '#10b981'; // Green (Photosynthetic)
                ctx.beginPath();
                ctx.arc(-4, -2, 2.5, 0, Math.PI*2);
                ctx.arc(2, 2, 2.5, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'thinking_ocean') {
                ctx.fillStyle = 'rgba(236, 72, 153, 0.6)'; // Pink (Sentient)
                ctx.strokeStyle = '#ec4899';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let j = 0; j < 5; j++) {
                    const angle = (j * Math.PI * 2) / 5;
                    const r = 5 + Math.sin(p.wobble + j) * 1.5;
                    ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'cryo_colloids') {
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
                ctx.fillStyle = 'rgba(236, 72, 153, 0.4)'; // Pink (Sentient)
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(0, 0, 9, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-2.5, -2, 1, 0, Math.PI*2);
                ctx.arc(2.5, 2, 1, 0, Math.PI*2);
                ctx.arc(-1, 3.5, 1, 0, Math.PI*2);
                ctx.fill();
            }
            
            ctx.restore();
        });

        ctx.restore();
    }
}
