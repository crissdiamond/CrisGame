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
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
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
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                type: 'soup',
                size: Math.random() * 3 + 2,
                color: 'rgba(168, 85, 247, 0.6)',
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.04 + Math.random() * 0.04
            });
        }
        this.initializedParticles = true;
    }

    draw(planet, biology) {
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

        this.particles.forEach(p => {
            p.vx += (Math.random() - 0.5) * 0.12;
            p.vy += (Math.random() - 0.5) * 0.12;
            p.vx *= 0.94;
            p.vy *= 0.94;
            p.x += p.vx;
            p.y += p.vy;

            // Boundary clamp
            const particleMargin = Math.max(18, p.size * 4);
            const innerRadius = microRad - particleMargin;
            const dist = Math.hypot(p.x - cx, p.y - cy);
            if (dist > innerRadius) {
                const angle = Math.atan2(p.y - cy, p.x - cx);
                p.x = cx + Math.cos(angle) * innerRadius;
                p.y = cy + Math.sin(angle) * innerRadius;
                p.vx *= -0.5;
                p.vy *= -0.5;
            }

            p.wobble += p.wobbleSpeed;

            // Dynamically assign types based on unlocked stages of active solvent
            if (planet.activeSolvent === 'water') {
                if (biology.unlockedGaiaHivemind && Math.random() < 0.005) p.type = 'gaia_hivemind';
                else if (biology.unlockedNoosphere && Math.random() < 0.005) p.type = 'noosphere';
                else if (biology.unlockedCyborg && Math.random() < 0.006) p.type = 'cyborg';
                else if (biology.unlockedTechnologicalAI && Math.random() < 0.007) p.type = 'ai';
                else if (biology.unlockedCognitive && Math.random() < 0.008) p.type = 'cognitive';
                else if (biology.unlockedSynapsid && Math.random() < 0.008) p.type = 'synapsid';
                else if (biology.unlockedSauropsid && Math.random() < 0.008) p.type = 'sauropsid';
                else if (biology.unlockedTetrapod && Math.random() < 0.01) p.type = 'tetrapod';
                else if (biology.unlockedLandPlants && Math.random() < 0.01) p.type = 'plants';
                else if (biology.unlockedCambrian && Math.random() < 0.015) p.type = 'cambrian';
                else if (biology.unlockedMulticellular && Math.random() < 0.02) p.type = 'multicellular';
                else if (biology.unlockedEukaryotic && Math.random() < 0.02) p.type = 'eukaryotic';
                else if (biology.unlockedPhotosynthetic && Math.random() < 0.025) p.type = 'photosynthetic';
                else if (biology.unlockedAnaerobic && Math.random() < 0.03) p.type = 'anaerobic';
                else p.type = 'soup';
            } else if (planet.activeSolvent === 'ammonia') {
                if (biology.unlockedCryoHivemind && Math.random() < 0.005) p.type = 'cryo_hivemind';
                else if (biology.unlockedQuantumLattice && Math.random() < 0.005) p.type = 'quantum_lattices';
                else if (biology.unlockedCrystallineCognitive && Math.random() < 0.006) p.type = 'crystalline_cognitive';
                else if (biology.unlockedCryoFauna && Math.random() < 0.008) p.type = 'cryo_fauna';
                else if (biology.unlockedSilicoFlora && Math.random() < 0.01) p.type = 'silico_flora';
                else if (biology.unlockedAmmonicMulti && Math.random() < 0.02) p.type = 'ammonic_multi';
                else if (biology.unlockedAmmonicProto && Math.random() < 0.03) p.type = 'ammonic_proto';
                else p.type = 'ammonic_soup';
            } else if (planet.activeSolvent === 'methane') {
                if (biology.unlockedCryoColloid && Math.random() < 0.005) p.type = 'cryo_colloids';
                else if (biology.unlockedThinkingOcean && Math.random() < 0.005) p.type = 'thinking_ocean';
                else if (biology.unlockedCryoPolymerNetwork && Math.random() < 0.006) p.type = 'cryo_polymer_network';
                else if (biology.unlockedCryoOrganisms && Math.random() < 0.01) p.type = 'cryo_organisms';
                else if (biology.unlockedMethaneMulti && Math.random() < 0.02) p.type = 'methane_multi';
                else if (biology.unlockedMethaneProto && Math.random() < 0.03) p.type = 'methane_proto';
                else p.type = 'methane_soup';
            }

            // Draw micro shapes
            ctx.save();
            ctx.translate(p.x, p.y);
            
            if (p.type === 'soup') {
                ctx.fillStyle = 'rgba(168, 85, 247, 0.45)';
                ctx.beginPath();
                ctx.arc(0, 0, 2, 0, Math.PI*2);
                ctx.arc(6, Math.sin(p.wobble)*3, 1.8, 0, Math.PI*2);
                ctx.arc(-6, -Math.sin(p.wobble)*3, 1.8, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'anaerobic') {
                ctx.rotate(Math.atan2(p.vy, p.vx));
                ctx.fillStyle = 'rgba(99, 102, 241, 0.65)';
                ctx.strokeStyle = 'rgba(129, 140, 248, 0.8)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.roundRect(-7, -3.5, 14, 7, 3);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'photosynthetic') {
                ctx.rotate(p.wobble * 0.1);
                ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
                ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'eukaryotic') {
                // Eukaryote with dark central nucleus and mitochondria dots
                ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
                ctx.strokeStyle = 'rgba(14, 165, 233, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Nucleus
                ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
                ctx.beginPath();
                ctx.arc(1, 1, 2.5, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'multicellular') {
                // Cluster chain
                ctx.rotate(p.wobble * 0.05);
                ctx.fillStyle = 'rgba(236, 72, 153, 0.55)';
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
                ctx.beginPath();
                ctx.arc(0, 0, 3.5, 0, Math.PI*2);
                ctx.arc(6, 2, 3, 0, Math.PI*2);
                ctx.arc(-5, -3, 3, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'cambrian') {
                // Trilobite segmented oval
                ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI/2);
                ctx.fillStyle = 'rgba(245, 158, 11, 0.55)';
                ctx.strokeStyle = 'rgba(217, 119, 6, 0.85)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(0, 0, 6, 10, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                
                // Segmentation lines
                ctx.beginPath();
                ctx.moveTo(-5, -2); ctx.lineTo(5, -2);
                ctx.moveTo(-6, 2); ctx.lineTo(5, 2);
                ctx.stroke();
            } else if (p.type === 'plants') {
                // Green chloroplast cells block
                ctx.fillStyle = 'rgba(4, 120, 87, 0.7)';
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(-5, -5, 10, 10);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'tetrapod') {
                // Tadpole salamander shape
                ctx.rotate(Math.atan2(p.vy, p.vx));
                ctx.fillStyle = 'rgba(14, 116, 144, 0.65)';
                ctx.beginPath();
                ctx.arc(4, 0, 5, 0, Math.PI*2); // Head
                ctx.fill();
                // Tail
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(-1, 0);
                ctx.quadraticCurveTo(-7, Math.sin(p.wobble*2)*4, -14, 0);
                ctx.stroke();
            } else if (p.type === 'sauropsid') {
                // Scales or tiny dinosaur cell structure (warm reddish scale)
                ctx.fillStyle = 'rgba(185, 28, 28, 0.6)';
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(6, 0);
                ctx.lineTo(0, 6);
                ctx.lineTo(-6, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'synapsid') {
                // Mammalian nucleus with cilia hairs
                ctx.fillStyle = 'rgba(180, 83, 9, 0.6)';
                ctx.strokeStyle = '#d97706';
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'cognitive') {
                // Circle cell with dendrites web
                ctx.fillStyle = 'rgba(168, 85, 247, 0.65)';
                ctx.strokeStyle = 'rgba(216, 180, 254, 0.9)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                // Dendrite lines
                ctx.beginPath();
                ctx.moveTo(-3, -3); ctx.lineTo(-8, -8);
                ctx.moveTo(3, -3); ctx.lineTo(8, -8);
                ctx.moveTo(0, 3); ctx.lineTo(0, 9);
                ctx.stroke();
            } else if (p.type === 'ai') {
                // Tiny gold microchip square
                ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                ctx.strokeStyle = 'rgba(0, 242, 254, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(-6, -6, 12, 12);
                ctx.fill();
                ctx.stroke();
                // Golden trace lines
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-3, 0); ctx.lineTo(3, 0);
                ctx.moveTo(0, -3); ctx.lineTo(0, 3);
                ctx.stroke();
            } else if (p.type === 'cyborg') {
                // Human-like nucleus with gold circuit wiring
                ctx.fillStyle = 'rgba(16, 185, 129, 0.65)'; // emerald bio body
                ctx.strokeStyle = '#d97706'; // gold structural borders
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                // Golden traces
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(-3, -3); ctx.lineTo(3, 3);
                ctx.moveTo(3, -3); ctx.lineTo(-3, 3);
                ctx.stroke();
            } else if (p.type === 'noosphere') {
                // Glowing golden computing node emitting circles
                ctx.rotate(p.wobble * 0.1);
                ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
                ctx.strokeStyle = 'rgba(6, 182, 212, 0.9)'; // cyan glow shell
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(-5, -5, 10, 10);
                ctx.fill();
                ctx.stroke();
                // Pulse ring
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
                ctx.beginPath();
                ctx.arc(0, 0, 8 + Math.sin(p.wobble)*3, 0, Math.PI*2);
                ctx.stroke();
            } else if (p.type === 'gaia_hivemind') {
                // Chloroplast cell with radiating mycelial hairs
                ctx.rotate(p.wobble * 0.05);
                ctx.fillStyle = 'rgba(4, 120, 87, 0.6)';
                ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)'; // pink biological synapses
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                // Radials
                ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
                ctx.beginPath();
                for (let j = 0; j < 4; j++) {
                    const angle = (j * Math.PI) / 2;
                    ctx.moveTo(Math.cos(angle)*6, Math.sin(angle)*6);
                    ctx.lineTo(Math.cos(angle)*10, Math.sin(angle)*10);
                }
                ctx.stroke();
            }
            
            // Ammonia-based cells
            else if (p.type === 'ammonic_soup') {
                ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
                ctx.beginPath();
                ctx.rect(-3, -3, 6, 6);
                ctx.fill();
            } else if (p.type === 'ammonic_proto') {
                // Needle crystal shape
                ctx.rotate(p.wobble * 0.2);
                ctx.strokeStyle = 'rgba(167, 139, 250, 0.8)';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(-8, 0);
                ctx.lineTo(8, 0);
                ctx.stroke();
            } else if (p.type === 'ammonic_multi') {
                ctx.fillStyle = 'rgba(124, 58, 237, 0.6)';
                ctx.strokeStyle = 'rgba(139, 92, 246, 0.9)';
                ctx.beginPath();
                ctx.moveTo(0, -6);
                ctx.lineTo(5, 4);
                ctx.lineTo(-5, 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'silico_flora') {
                ctx.fillStyle = '#4f46e5';
                ctx.beginPath();
                ctx.arc(0, -3, 3, 0, Math.PI*2);
                ctx.arc(4, 3, 2.5, 0, Math.PI*2);
                ctx.arc(-4, 3, 2.5, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'cryo_fauna') {
                ctx.rotate(p.wobble*0.05);
                ctx.fillStyle = '#6366f1';
                ctx.beginPath();
                ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'crystalline_cognitive') {
                // Hexagonal crystal pulsing
                ctx.rotate(p.wobble * 0.1);
                ctx.fillStyle = 'rgba(129, 140, 248, 0.65)';
                ctx.strokeStyle = '#818cf8';
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
                // High contrast cyan superconducting crystal grid
                ctx.rotate(p.wobble * 0.08);
                ctx.fillStyle = 'rgba(14, 165, 233, 0.65)';
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.85)';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                // diamond shape
                ctx.moveTo(0, -6);
                ctx.lineTo(6, 0);
                ctx.lineTo(0, 6);
                ctx.lineTo(-6, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                // Inner core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, 1.8, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'cryo_hivemind') {
                // Chain of linked indigo crystal tubes
                ctx.rotate(p.wobble * 0.05);
                ctx.strokeStyle = 'rgba(139, 92, 246, 0.8)';
                ctx.fillStyle = 'rgba(99, 102, 241, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(0, 0, 3, 7, 0, 0, Math.PI*2);
                ctx.stroke();
                ctx.fill();
                // Linked satellite crystal
                ctx.beginPath();
                ctx.arc(6, -4, 2, 0, Math.PI*2);
                ctx.fill();
            }
 
            // Methane-based cells
            else if (p.type === 'methane_soup') {
                ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'methane_proto') {
                // Azotosome vesicle bubble
                ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI*2);
                ctx.stroke();
            } else if (p.type === 'methane_multi') {
                ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
                ctx.beginPath();
                ctx.arc(-4, 0, 2.5, 0, Math.PI*2);
                ctx.arc(1, 1, 2.5, 0, Math.PI*2);
                ctx.arc(5, -1, 2.5, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'cryo_organisms') {
                ctx.rotate(p.wobble * 0.1);
                ctx.fillStyle = '#ea580c';
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.ellipse(0, 0, 5, 8, 0, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'cryo_polymer_network') {
                // Orange polymer chain
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(-4, -2, 2.5, 0, Math.PI*2);
                ctx.arc(2, 2, 2.5, 0, Math.PI*2);
                ctx.fill();
            } else if (p.type === 'thinking_ocean') {
                // Amorphous orange polymer matrix with data node
                ctx.fillStyle = 'rgba(234, 88, 12, 0.6)';
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 1;
                ctx.beginPath();
                // Wobbling blob
                for (let j = 0; j < 5; j++) {
                    const angle = (j * Math.PI * 2) / 5;
                    const r = 5 + Math.sin(p.wobble + j) * 1.5;
                    ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'cryo_colloids') {
                // Large circular membrane holding nested smaller azotosomes
                ctx.strokeStyle = 'rgba(217, 119, 6, 0.85)';
                ctx.fillStyle = 'rgba(180, 83, 9, 0.4)';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.arc(0, 0, 9, 0, Math.PI*2);
                ctx.fill();
                ctx.stroke();
                // Nested dots
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
