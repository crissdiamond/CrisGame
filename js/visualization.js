/**
 * Handles canvas drawing for both Planet (macro) and Microscope (micro) views.
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

    /**
     * Set width and height from parent container
     */
    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        
        if (this.viewMode === 'micro' && !this.initializedParticles) {
            this.initMicroParticles();
        }
    }

    /**
     * Set view mode
     */
    setViewMode(mode) {
        this.viewMode = mode;
        if (mode === 'micro') {
            this.initMicroParticles();
        }
    }

    /**
     * Generate floating microbial particles
     */
    initMicroParticles() {
        this.particles = [];
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Generate a variety of cell placeholders
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                type: 'soup', // 'soup', 'anaerobic', 'photosynthetic', 'multicellular'
                size: Math.random() * 2 + 2,
                color: 'rgba(168, 85, 247, 0.6)',
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.05 + Math.random() * 0.05
            });
        }
        this.initializedParticles = true;
    }

    /**
     * Draw current view on canvas
     */
    draw(planet, biology) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#06070c';
        ctx.fillRect(0, 0, w, h);

        if (this.viewMode === 'macro') {
            this.drawMacroView(planet, biology, w, h, ctx);
        } else {
            this.drawMicroView(planet, biology, w, h, ctx);
        }
    }

    /**
     * Draw the 3D-looking planet and atmosphere
     */
    drawMacroView(planet, biology, w, h, ctx) {
        // 1. Draw Space background stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.stars.forEach(star => {
            // Twinkle effect
            star.brightness += (Math.random() - 0.5) * 0.05;
            star.brightness = Math.max(0.2, Math.min(1.0, star.brightness));
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.fillRect(star.x * w, star.y * h, star.size, star.size);
        });

        const centerX = w / 2;
        const centerY = h / 2;
        const radius = Math.min(w, h) * 0.32;

        this.rotationAngle += 0.002;

        // 2. Draw Planet Atmosphere Glow Halo
        const glowRad = radius * 1.25;
        const glowGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.95, centerX, centerY, glowRad);
        
        // Atmosphere color adapts to oxygen
        let haloColor = 'rgba(239, 68, 68, 0.25)'; // toxic co2 halo
        if (planet.o2 > 15.0) {
            haloColor = 'rgba(0, 242, 254, 0.3)'; // clean oxygen halo
        } else if (planet.o2 > 2.0) {
            haloColor = 'rgba(168, 85, 247, 0.25)'; // chemical evolution halo
        }
        glowGrad.addColorStop(0, haloColor);
        glowGrad.addColorStop(0.3, haloColor);
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // 3. Draw Planet Body
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip(); // clip drawing inside planet sphere

        // Base Landmass / Magma Color
        let baseColor = '#241a15'; // cooled volcanic crust
        if (planet.temperature > 85.0) {
            baseColor = '#421605'; // very hot molten rock base
        } else if (planet.temperature < 0.0) {
            baseColor = '#334155'; // frozen planet rock
        }
        ctx.fillStyle = baseColor;
        ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

        // Draw rotating land and oceans
        // Generate pseudo-random landmass segments rotating across the face
        const seedValue = 42; // static seed for geography
        const numContinents = 7;
        
        for (let i = 0; i < numContinents; i++) {
            const angleOffset = (i / numContinents) * Math.PI * 2;
            const rotX = ((this.rotationAngle + angleOffset) % (Math.PI * 2));
            
            // Projecting 3D rotation onto 2D surface
            const posX = centerX + Math.cos(rotX) * radius * 1.1;
            const posY = centerY + Math.sin(i * 1.5) * radius * 0.4;
            
            // Size of landmass
            const cRadius = radius * (0.35 + (i % 3) * 0.1);

            // Continent color blends based on life density
            let landColor = '#3b2f2f'; // dead land
            if (planet.temperature < 0) {
                landColor = '#cbd5e1'; // frozen snow
            } else if (biology.multicellularPop > 5.0) {
                landColor = '#065f46'; // deep green flora
            } else if (biology.photosyntheticPop > 20.0) {
                landColor = '#10b981'; // green moss/algae
            } else if (biology.anaerobicPop > 10.0) {
                landColor = '#4b5320'; // olive bacterial mats
            }

            // Only draw continent if on front face
            if (Math.sin(rotX) >= -0.3) {
                ctx.fillStyle = landColor;
                ctx.beginPath();
                ctx.arc(posX, posY, cRadius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw Ocean/Water Level Overlay
        if (planet.waterCoverage > 0) {
            let waterColor = 'rgba(14, 116, 144, 0.65)'; // deep cyan water
            if (planet.temperature < 0) {
                waterColor = 'rgba(241, 245, 249, 0.9)'; // frozen solid ice water
            } else if (planet.temperature > 95) {
                waterColor = 'rgba(180, 83, 9, 0.4)'; // boiling acidic soup
            } else if (biology.unlockedSoup) {
                waterColor = 'rgba(45, 20, 90, 0.6)'; // purplish organic-rich water
                if (biology.photosyntheticPop > 10.0) {
                    waterColor = 'rgba(13, 148, 136, 0.7)'; // teal photosynthetic oceans
                }
            }
            
            // Draw ocean coverage as a circular mask from the bottom up or radial gradient overlay
            ctx.fillStyle = waterColor;
            ctx.save();
            // Draw water covering planet relative to percentage
            const waterHeight = radius * 2 * (planet.waterCoverage / 100);
            ctx.beginPath();
            ctx.rect(centerX - radius, centerY + radius - waterHeight, radius * 2, waterHeight);
            ctx.fill();
            ctx.restore();
        }

        // Draw Magma Glow Lines (for hot planets)
        if (planet.temperature > 70.0) {
            const glowIntensity = Math.min(0.8, (planet.temperature - 70.0) / 80.0);
            ctx.strokeStyle = `rgba(239, 68, 68, ${glowIntensity})`;
            ctx.lineWidth = 4;
            ctx.shadowColor = 'rgba(239, 68, 68, 1)';
            ctx.shadowBlur = 10;
            
            // Draw a few crack lines
            ctx.beginPath();
            ctx.moveTo(centerX - radius * 0.5, centerY - radius * 0.2);
            ctx.lineTo(centerX + radius * 0.3, centerY + radius * 0.4);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(centerX - radius * 0.2, centerY + radius * 0.5);
            ctx.lineTo(centerX + radius * 0.6, centerY - radius * 0.1);
            ctx.stroke();

            // reset shadow
            ctx.shadowBlur = 0;
        }

        // 4. Planet 3D Shading Spherical Overlay (Creates shadow/highlight)
        const shadowGrad = ctx.createRadialGradient(
            centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2,
            centerX, centerY, radius
        );
        shadowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)'); // light source reflection
        shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)'); // dark side of planet
        
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // restore clipping region
    }

    /**
     * Draw microscopic cellular simulation
     */
    drawMicroView(planet, biology, w, h, ctx) {
        // 1. Draw Microscope Grid Overlay
        const cx = w / 2;
        const cy = h / 2;
        const microRad = Math.min(w, h) * 0.45;

        // Draw black mask outside microscope lens circular frame
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, microRad, 0, Math.PI * 2);
        ctx.rect(w, 0, -w, h); // inverse path to create mask
        ctx.fillStyle = '#030407';
        ctx.fill();
        ctx.restore();

        // Draw Microscope circular border
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, microRad, 0, Math.PI * 2);
        ctx.stroke();

        // Grid lines (faint cyan lines)
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.04)';
        ctx.lineWidth = 1;
        for (let x = cx - microRad; x < cx + microRad; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, cy - Math.sqrt(microRad*microRad - (x-cx)*(x-cx)));
            ctx.lineTo(x, cy + Math.sqrt(microRad*microRad - (x-cx)*(x-cx)));
            ctx.stroke();
        }
        for (let y = cy - microRad; y < cy + microRad; y += 40) {
            ctx.beginPath();
            ctx.moveTo(cx - Math.sqrt(microRad*microRad - (y-cy)*(y-cy)), y);
            ctx.lineTo(cx + Math.sqrt(microRad*microRad - (y-cy)*(y-cy)), y);
            ctx.stroke();
        }

        // Draw lens reflection vignette
        const lensGlow = ctx.createRadialGradient(cx, cy, microRad * 0.8, cx, cy, microRad);
        lensGlow.addColorStop(0, 'rgba(0, 242, 254, 0.0)');
        lensGlow.addColorStop(1, 'rgba(0, 242, 254, 0.08)');
        ctx.fillStyle = lensGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, microRad, 0, Math.PI * 2);
        ctx.fill();

        // 2. Update and Draw Micro Particles
        this.particles.forEach(p => {
            // Brownian random force
            p.vx += (Math.random() - 0.5) * 0.15;
            p.vy += (Math.random() - 0.5) * 0.15;

            // Apply fluid resistance (drag)
            p.vx *= 0.95;
            p.vy *= 0.95;

            // Move particle
            p.x += p.vx;
            p.y += p.vy;

            // Constrain inside circular lens boundary
            const dist = Math.hypot(p.x - cx, p.y - cy);
            if (dist > microRad - 20) {
                // push back towards center
                const angle = Math.atan2(p.y - cy, p.x - cx);
                p.x = cx + Math.cos(angle) * (microRad - 20);
                p.vx = -p.vx * 0.5;
                p.vy = -p.vy * 0.5;
            }

            p.wobble += p.wobbleSpeed;

            // Determine target type from biological progress
            if (biology.unlockedMulticellular && Math.random() < 0.01 && p.type !== 'multicellular') {
                p.type = 'multicellular';
            } else if (biology.unlockedPhotosynthetic && Math.random() < 0.02 && p.type === 'soup') {
                p.type = 'photosynthetic';
            } else if (biology.unlockedAnaerobic && Math.random() < 0.03 && p.type === 'soup') {
                p.type = 'anaerobic';
            }

            // Draw based on type
            if (p.type === 'soup') {
                // Amino acid strands (chain of 3 glowing dots)
                ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
                ctx.beginPath();
                const offset = Math.sin(p.wobble) * 4;
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.arc(p.x + 5, p.y + offset, 1.8, 0, Math.PI * 2);
                ctx.arc(p.x - 5, p.y - offset, 1.8, 0, Math.PI * 2);
                ctx.fill();
            } 
            else if (p.type === 'anaerobic') {
                // Anaerobic bacteria: blue rod shape with wiggling tail flagellum
                ctx.save();
                ctx.translate(p.x, p.y);
                const angle = Math.atan2(p.vy, p.vx);
                ctx.rotate(angle);

                // Cell Body
                ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
                ctx.strokeStyle = 'rgba(129, 140, 248, 0.9)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                // capsule shape
                ctx.roundRect(-8, -4, 16, 8, 4);
                ctx.fill();
                ctx.stroke();

                // Flagellum (tail) wiggling
                ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-8, 0);
                const tailWiggle = Math.sin(p.wobble * 2) * 5;
                ctx.quadraticCurveTo(-16, tailWiggle, -24, tailWiggle * -0.5);
                ctx.stroke();
                ctx.restore();
            } 
            else if (p.type === 'photosynthetic') {
                // Photosynthetic: green spheres containing internal chloroplasts
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.wobble * 0.1);

                // Main Cell body (Emerald sphere)
                ctx.fillStyle = 'rgba(16, 185, 129, 0.65)';
                ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Internal details (chloroplasts)
                ctx.fillStyle = 'rgba(4, 120, 87, 0.8)';
                ctx.beginPath();
                ctx.arc(-2, -2, 1.5, 0, Math.PI * 2);
                ctx.arc(2, 3, 1.5, 0, Math.PI * 2);
                ctx.arc(3, -2, 1.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } 
            else if (p.type === 'multicellular') {
                // Multicellular: chain of green/red circles linked together
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.wobble * 0.05);

                const linkRadius = 4;
                const offset = Math.sin(p.wobble) * 2;
                ctx.fillStyle = 'rgba(225, 29, 72, 0.65)'; // red eukaryotic tissue
                ctx.strokeStyle = 'rgba(251, 113, 133, 0.85)';
                ctx.lineWidth = 1.2;

                ctx.beginPath();
                ctx.arc(0, 0, linkRadius, 0, Math.PI * 2);
                ctx.arc(8, offset, linkRadius, 0, Math.PI * 2);
                ctx.arc(-8, -offset, linkRadius, 0, Math.PI * 2);
                ctx.arc(16, offset * 1.5, linkRadius - 1, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        });
    }
}
