/**
 * Manages UI interactions, DOM updates, and logging feeds.
 */
export class GameUI {
    constructor() {
        // Cache DOM Elements
        this.tempSlider = document.getElementById('temp-slider');
        this.tempVal = document.getElementById('temp-val');
        this.waterSlider = document.getElementById('water-slider');
        this.waterVal = document.getElementById('water-val');
        this.radSlider = document.getElementById('radiation-slider');
        this.radVal = document.getElementById('radiation-val');
        
        this.btnMeteor = document.getElementById('btn-meteor');
        this.btnVolcano = document.getElementById('btn-volcano');
        this.btnPausePlay = document.getElementById('btn-pause-play');
        this.btnViewMacro = document.getElementById('btn-view-macro');
        this.btnViewMicro = document.getElementById('btn-view-micro');
        
        this.systemStatusText = document.getElementById('system-status-text');
        this.systemIndicator = document.querySelector('.status-indicator');
        
        this.planetAge = document.getElementById('planet-age');
        this.habitabilityScore = document.getElementById('habitability-score');
        this.atmStatus = document.getElementById('atm-status');
        
        this.soupDensity = document.getElementById('soup-density');
        this.soupProgress = document.getElementById('soup-progress');
        this.anaerobicPop = document.getElementById('anaerobic-pop');
        this.anaerobicProgress = document.getElementById('anaerobic-progress');
        this.photosyntheticPop = document.getElementById('photosynthetic-pop');
        this.photosyntheticProgress = document.getElementById('photosynthetic-progress');
        this.multicellularPop = document.getElementById('multicellular-pop');
        this.multicellularProgress = document.getElementById('multicellular-progress');
        
        this.gasCo2 = document.getElementById('gas-co2');
        this.gasN2 = document.getElementById('gas-n2');
        this.gasO2 = document.getElementById('gas-o2');
        
        this.scienceLog = document.getElementById('science-log');
    }

    /**
     * Set up event bindings to game functions
     */
    bindEvents(handlers) {
        // Sliders
        this.tempSlider.addEventListener('input', (e) => {
            this.tempVal.textContent = `${e.target.value}°C`;
            handlers.onTemperatureChange(e.target.value);
        });

        this.waterSlider.addEventListener('input', (e) => {
            this.waterVal.textContent = `${e.target.value}%`;
            handlers.onWaterCoverageChange(e.target.value);
        });

        this.radSlider.addEventListener('input', (e) => {
            this.radVal.textContent = `${parseFloat(e.target.value).toFixed(1)} rad/s`;
            handlers.onRadiationChange(e.target.value);
        });

        // Disaster buttons
        this.btnMeteor.addEventListener('click', () => handlers.onMeteorStrike());
        this.btnVolcano.addEventListener('click', () => handlers.onVolcanoErupt());

        // Play/Pause
        this.btnPausePlay.addEventListener('click', () => handlers.onPauseToggle());

        // View Toggles
        this.btnViewMacro.addEventListener('click', () => {
            this.btnViewMacro.classList.add('active');
            this.btnViewMicro.classList.remove('active');
            handlers.onViewChange('macro');
        });

        this.btnViewMicro.addEventListener('click', () => {
            this.btnViewMicro.classList.add('active');
            this.btnViewMacro.classList.remove('active');
            handlers.onViewChange('micro');
        });
    }

    /**
     * Add entry to scientific feed console
     */
    logEvent(title, desc, type = 'system') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.innerHTML = `<span>[${timestamp}]</span> <strong>${title}:</strong> ${desc}`;
        
        this.scienceLog.appendChild(entry);
        // Scroll console container to bottom
        this.scienceLog.scrollTop = this.scienceLog.scrollHeight;
    }

    /**
     * Update pause/play state button display
     */
    setPlayState(isPlaying) {
        if (isPlaying) {
            this.btnPausePlay.textContent = "⏸️ Pause";
            this.systemStatusText.textContent = "SYSTEMS ACTIVE";
            this.systemIndicator.className = "status-indicator online";
        } else {
            this.btnPausePlay.textContent = "▶️ Resume";
            this.systemStatusText.textContent = "SYSTEMS PAUSED";
            this.systemIndicator.className = "status-indicator paused";
        }
    }

    /**
     * Synchronize sliders back to planet values (useful after events)
     */
    syncSliders(planet) {
        this.tempSlider.value = Math.round(planet.targetTemperature);
        this.tempVal.textContent = `${this.tempSlider.value}°C`;

        this.waterSlider.value = Math.round(planet.targetWaterCoverage);
        this.waterVal.textContent = `${this.waterSlider.value}%`;

        this.radSlider.value = planet.targetRadiation.toFixed(1);
        this.radVal.textContent = `${this.radSlider.value} rad/s`;
    }

    /**
     * Redraw text, progress bars, and stats across the dashboard
     */
    updateDashboard(planet, biology) {
        // Planet physical readouts
        this.planetAge.textContent = `${planet.age.toFixed(1)} Myr`;
        
        const hab = planet.getHabitabilityScore();
        this.habitabilityScore.textContent = `${hab}%`;
        
        // Atmosphere text description
        let atmDesc = "Toxic (CO₂ Haze)";
        if (planet.o2 > 18) atmDesc = "Respirable (Oxygen Rich)";
        else if (planet.o2 > 10) atmDesc = "Sub-oxic (Nitrogen/Oxygen)";
        else if (planet.o2 > 1) atmDesc = "Chemically Active (Traces of O₂)";
        this.atmStatus.textContent = atmDesc;

        // Gases
        this.gasCo2.textContent = `${planet.co2.toFixed(1)}%`;
        this.gasN2.textContent = `${planet.n2.toFixed(1)}%`;
        this.gasO2.textContent = `${planet.o2.toFixed(1)}%`;

        // Biological progress values & bar widths
        this.soupDensity.textContent = `${biology.organicSoup.toFixed(2)} ppm`;
        this.soupProgress.style.width = `${biology.organicSoup}%`;

        this.anaerobicPop.textContent = `${biology.anaerobicPop.toFixed(2)} M/mL`;
        // Scale bar capacity to 150
        this.anaerobicProgress.style.width = `${Math.min(100, (biology.anaerobicPop / 150) * 100)}%`;

        this.photosyntheticPop.textContent = `${biology.photosyntheticPop.toFixed(2)} M/mL`;
        // Scale bar capacity to 200
        this.photosyntheticProgress.style.width = `${Math.min(100, (biology.photosyntheticPop / 200) * 100)}%`;

        this.multicellularPop.textContent = biology.multicellularPop > 0 
            ? `${biology.multicellularPop.toFixed(2)} Index` 
            : '0';
        // Scale bar capacity to 100
        this.multicellularProgress.style.width = `${Math.min(100, biology.multicellularPop)}%`;
    }
}
