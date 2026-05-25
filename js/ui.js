/**
 * Manages UI interactions, DOM updates, tab switches, threat alerts,
 * and the interactive evolution tree rendering.
 */
export class GameUI {
    constructor() {
        // Cache DOM Elements - Sliders
        this.tempSlider = document.getElementById('temp-slider');
        this.tempVal = document.getElementById('temp-val');
        this.waterSlider = document.getElementById('water-slider');
        this.waterVal = document.getElementById('water-val');
        this.radSlider = document.getElementById('radiation-slider');
        this.radVal = document.getElementById('radiation-val');
        this.radEffectiveVal = document.getElementById('radiation-effective-val');
        
        // Cache DOM Elements - Buttons & Core Telemetry
        this.btnPausePlay = document.getElementById('btn-pause-play');
        this.btnSaveState = document.getElementById('btn-save-state');
        this.btnLoadState = document.getElementById('btn-load-state');
        this.currentViewModeLabel = document.getElementById('current-view-mode');
        this.canvasContainer = document.getElementById('canvas-container');
        this.systemStatusText = document.getElementById('system-status-text');
        this.systemIndicator = document.querySelector('.status-indicator');
        
        this.planetAge = document.getElementById('planet-age');
        this.habitabilityScore = document.getElementById('habitability-score');
        this.solventState = document.getElementById('solvent-state');
        this.solventIcon = document.getElementById('solvent-icon');
        this.solventLabel = document.getElementById('solvent-label');
        
        this.magnetShield = document.getElementById('magnet-shield');
        this.ozoneLayer = document.getElementById('ozone-layer');
        this.starLuminosity = document.getElementById('star-luminosity');
        this.moonIndicator = document.getElementById('moon-indicator');
        
        this.tokenBalance = document.getElementById('token-balance');
        this.threatList = document.getElementById('threat-list');
        
        // Interventions Modal
        this.btnOpenInterventions = document.getElementById('btn-open-interventions');
        this.interventionsModal = document.getElementById('interventions-modal');
        this.interventionsCloseBtn = document.getElementById('interventions-close-btn');
        this.interventionsGridList = document.getElementById('interventions-grid-list');
        this.handlers = null;

        // Water Cards
        this.soupCard = document.getElementById('soup-card');
        this.anaerobicCard = document.getElementById('anaerobic-card');
        this.photosyntheticCard = document.getElementById('photosynthetic-card');
        this.eukaryoticCard = document.getElementById('eukaryotic-card');
        this.multicellularCard = document.getElementById('multicellular-card');
        this.spongesCard = document.getElementById('sponges-card');
        this.medusesCard = document.getElementById('meduses-card');
        this.wormsCard = document.getElementById('worms-card');
        this.fishCard = document.getElementById('fish-card');
        this.mossesCard = document.getElementById('mosses-card');
        this.fernsCard = document.getElementById('ferns-card');
        this.conifersCard = document.getElementById('conifers-card');
        this.angiospermsCard = document.getElementById('angiosperms-card');
        this.sauropsidCard = document.getElementById('sauropsid-card');
        this.synapsidCard = document.getElementById('synapsid-card');

        // Ammonia Cards
        this.ammoniaSoupCard = document.getElementById('ammonia-soup-card');
        this.ammoniaProtoCard = document.getElementById('ammonia-proto-card');
        this.ammoniaMultiCard = document.getElementById('ammonia-multi-card');
        this.silicoFloraCard = document.getElementById('silico-flora-card');
        this.cryoFaunaCard = document.getElementById('cryo-fauna-card');

        // Methane Cards
        this.methaneSoupCard = document.getElementById('methane-soup-card');
        this.methaneProtoCard = document.getElementById('methane-proto-card');
        this.methaneMultiCard = document.getElementById('methane-multi-card');
        this.cryoOrganismsCard = document.getElementById('cryo-organisms-card');

        // List of all 10 interventions with titles and descriptions
        this.interventionsList = [
            { id: 'water_comet', name: '☄️ Redirect Water Comet', cost: 6, desc: 'Redirects a water-rich comet from the outer system. Increases solvent coverage (+20%) and enriches prebiotic soup.' },
            { id: 'ammonia_comet', name: '☄️ Redirect Ammonia Comet', cost: 6, desc: 'Redirects a nitrogenous ammonia-rich comet. Adds alternative liquid solvent coverage (+25%) for cold pathways.' },
            { id: 'methane_comet', name: '☄️ Redirect Hydrocarbon Comet', cost: 6, desc: 'Redirects a methane-rich comet, forming non-polar liquid hydrocarbon seas (+20%) on cold worlds.' },
            { id: 'giant_collision', name: '💥 Giant Protoplanet Collision', cost: 15, desc: 'Triggers a massive collision with a Mars-sized body. Forms a Moon (+tides), melts crust, and boosts magnetosphere potential.' },
            { id: 'gravitational_resonance', name: '🧲 Gravitational Resonance', cost: 12, desc: 'Uses orbital gravitational flex to heat core convection dynamo, restoring planetary magnetosphere shield to 100%.' },
            { id: 'volcanic_eruption', name: '🌋 Trigger Volcanic Eruptions', cost: 10, desc: 'Opens tectonic crustal vents, triggering basalt volcanism. Outgasses CO2 (+12%) and thickens atmosphere (+0.2 atm).' },
            { id: 'methanogen_bloom', name: '🦠 Induce Methanogenic Bloom', cost: 8, desc: 'Fertilizes deep-sea hydrothermal vents to trigger methanogen growth. Releases methane gas (+12%) to warm the planet.' },
            { id: 'silicate_weathering', name: '🪨 Silicate Weathering', cost: 10, desc: 'Accelerates continental rock chemical weathering via acid rain. Traps atmospheric CO2 (-8%) into sea carbonate sediment.' },
            { id: 'dust_veil', name: '🌫️ Seed Aerosol Dust Veil', cost: 8, desc: 'Disintegrates a minor asteroid in the upper atmosphere. Seeds dust reflecting starlight to cool the planet.' },
            { id: 'cyanobacteria_bloom', name: '🌿 Cyanobacteria Bloom', cost: 8, desc: 'Injects nutrients into liquid basins to trigger photosynthetic blooms. Releases oxygen (+8%) and absorbs CO2 (-5%).' }
        ];

        this.currentPlanet = null;
        this.currentBiology = null;
        this.currentEventSystem = null;
        
        // Atmosphere Horizontal Bars
        this.barCo2 = document.getElementById('bar-co2');
        this.barN2 = document.getElementById('bar-n2');
        this.barO2 = document.getElementById('bar-o2');
        this.barCh4 = document.getElementById('bar-ch4');
        this.barH2 = document.getElementById('bar-h2');
        this.ch4GasWrapper = document.getElementById('ch4-gas-wrapper');
        this.h2GasWrapper = document.getElementById('h2-gas-wrapper');
        
        this.gasCo2Val = document.getElementById('gas-co2-val');
        this.gasN2Val = document.getElementById('gas-n2-val');
        this.gasO2Val = document.getElementById('gas-o2-val');
        this.gasCh4Val = document.getElementById('gas-ch4-val');
        this.gasH2Val = document.getElementById('gas-h2-val');
        
        // Biomass Groups
        this.waterMetrics = document.getElementById('water-metrics');
        this.ammoniaMetrics = document.getElementById('ammonia-metrics');
        this.methaneMetrics = document.getElementById('methane-metrics');
        
        // Biomass History Legends
        this.bioLegend1 = document.getElementById('bio-legend-1');
        this.bioLegend2 = document.getElementById('bio-legend-2');
        this.bioLegend3 = document.getElementById('bio-legend-3');
        this.bioLegend4 = document.getElementById('bio-legend-4');
        this.bioLegend5 = document.getElementById('bio-legend-5');
        
        // Water Biomass progress bars
        this.soupDensity = document.getElementById('soup-density');
        this.soupProgress = document.getElementById('soup-progress');
        this.anaerobicPop = document.getElementById('anaerobic-pop');
        this.anaerobicProgress = document.getElementById('anaerobic-progress');
        this.photosyntheticPop = document.getElementById('photosynthetic-pop');
        this.photosyntheticProgress = document.getElementById('photosynthetic-progress');
        this.eukaryoticPop = document.getElementById('eukaryotic-pop');
        this.eukaryoticProgress = document.getElementById('eukaryotic-progress');
        this.multicellularPop = document.getElementById('multicellular-pop');
        this.multicellularProgress = document.getElementById('multicellular-progress');

        // New intermediate water elements
        this.spongesPop = document.getElementById('sponges-pop');
        this.spongesProgress = document.getElementById('sponges-progress');
        this.medusesPop = document.getElementById('meduses-pop');
        this.medusesProgress = document.getElementById('meduses-progress');
        this.wormsPop = document.getElementById('worms-pop');
        this.wormsProgress = document.getElementById('worms-progress');
        this.fishPop = document.getElementById('fish-pop');
        this.fishProgress = document.getElementById('fish-progress');

        // New soil plants vegetable line elements
        this.mossesPop = document.getElementById('mosses-pop');
        this.mossesProgress = document.getElementById('mosses-progress');
        this.fernsPop = document.getElementById('ferns-pop');
        this.fernsProgress = document.getElementById('ferns-progress');
        this.conifersPop = document.getElementById('conifers-pop');
        this.conifersProgress = document.getElementById('conifers-progress');
        this.angiospermsPop = document.getElementById('angiosperms-pop');
        this.angiospermsProgress = document.getElementById('angiosperms-progress');

        this.sauropsidPop = document.getElementById('sauropsid-pop');
        this.sauropsidProgress = document.getElementById('sauropsid-progress');
        this.synapsidPop = document.getElementById('synapsid-pop');
        this.synapsidProgress = document.getElementById('synapsid-progress');

        // Ammonia Biomass bars
        this.ammoniaSoupDensity = document.getElementById('ammonia-soup-density');
        this.ammoniaSoupProgress = document.getElementById('ammonia-soup-progress');
        this.ammoniaProtoPop = document.getElementById('ammonia-proto-pop');
        this.ammoniaProtoProgress = document.getElementById('ammonia-proto-progress');
        this.ammoniaMultiPop = document.getElementById('ammonia-multi-pop');
        this.ammoniaMultiProgress = document.getElementById('ammonia-multi-progress');
        this.silicoFloraPop = document.getElementById('silico-flora-pop');
        this.silicoFloraProgress = document.getElementById('silico-flora-progress');
        this.cryoFaunaPop = document.getElementById('cryo-fauna-pop');
        this.cryoFaunaProgress = document.getElementById('cryo-fauna-progress');

        // Methane Biomass bars
        this.methaneSoupDensity = document.getElementById('methane-soup-density');
        this.methaneSoupProgress = document.getElementById('methane-soup-progress');
        this.methaneProtoPop = document.getElementById('methane-proto-pop');
        this.methaneProtoProgress = document.getElementById('methane-proto-progress');
        this.methaneMultiPop = document.getElementById('methane-multi-pop');
        this.methaneMultiProgress = document.getElementById('methane-multi-progress');
        this.cryoOrganismsPop = document.getElementById('cryo-organisms-pop');
        this.cryoOrganismsProgress = document.getElementById('cryo-organisms-progress');

        // Tabs
        this.tabMetrics = document.getElementById('tab-metrics');
        this.tabRoadmap = document.getElementById('tab-roadmap');
        this.tabContentMetrics = document.getElementById('tab-content-metrics');
        this.tabContentRoadmap = document.getElementById('tab-content-roadmap');
        
        // Evolution Tree UI
        this.treeNodesList = document.getElementById('tree-nodes-list');
        this.activeBranchName = document.getElementById('active-branch-name');
        this.nodeDetailsTitle = document.getElementById('node-details-title');
        this.nodeDetailsText = document.getElementById('node-details-text');
        this.btnNudgeEvolution = document.getElementById('btn-nudge-evolution');
        
        this.selectedNodeId = null;
        this.scienceLog = document.getElementById('science-log');
        
        // Popup Overlay Cache
        this.popupOverlay = document.getElementById('milestone-popup');
        this.popupTitle = document.getElementById('popup-title');
        this.popupDesc = document.getElementById('popup-desc');
        this.popupCloseBtn = document.getElementById('popup-close-btn');
        this.popupDismissBtn = document.getElementById('popup-dismiss-btn');
        this.popupDossierContainer = document.getElementById('popup-dossier-container');
        this.popupToggleDossier = document.getElementById('popup-toggle-dossier');
        this.popupDossierText = document.getElementById('popup-dossier-text');
        this.popupDossierToggleIcon = document.getElementById('popup-dossier-toggle-icon');
        this.popupDossierTextWrapper = document.getElementById('popup-dossier-text-wrapper');

        // Future Metric Cards Cache
        this.cyborgCard = document.getElementById('cyborg-card');
        this.cyborgPop = document.getElementById('cyborg-pop');
        this.cyborgProgress = document.getElementById('cyborg-progress');
        this.noosphereCard = document.getElementById('noosphere-card');
        this.noospherePop = document.getElementById('noosphere-pop');
        this.noosphereProgress = document.getElementById('noosphere-progress');
        this.gaiaCard = document.getElementById('gaia-card');
        this.gaiaPop = document.getElementById('gaia-pop');
        this.gaiaProgress = document.getElementById('gaia-progress');

        this.quantumLatticeCard = document.getElementById('quantum-lattice-card');
        this.quantumLatticePop = document.getElementById('quantum-lattice-pop');
        this.quantumLatticeProgress = document.getElementById('quantum-lattice-progress');
        this.cryoHivemindCard = document.getElementById('cryo-hivemind-card');
        this.cryoHivemindPop = document.getElementById('cryo-hivemind-pop');
        this.cryoHivemindProgress = document.getElementById('cryo-hivemind-progress');

        this.thinkingOceanCard = document.getElementById('thinking-ocean-card');
        this.thinkingOceanPop = document.getElementById('thinking-ocean-pop');
        this.thinkingOceanProgress = document.getElementById('thinking-ocean-progress');
        this.cryoColloidCard = document.getElementById('cryo-colloid-card');
        this.cryoColloidPop = document.getElementById('cryo-colloid-pop');
        this.cryoColloidProgress = document.getElementById('cryo-colloid-progress');

        // Setup Modal Elements
        this.setupModal = document.getElementById('setup-modal');
        this.setupStarClass = document.getElementById('setup-star-class');
        this.setupStarSize = document.getElementById('setup-star-size');
        this.setupStarSizeVal = document.getElementById('setup-star-size-val');
        this.setupOrbit = document.getElementById('setup-orbit');
        this.setupOrbitVal = document.getElementById('setup-orbit-val');
        this.setupPlanetSizeGroup = document.getElementById('setup-planet-size-group');
        this.setupVolatiles = document.getElementById('setup-volatiles');
        this.setupVolatilesVal = document.getElementById('setup-volatiles-val');
        this.setupIron = document.getElementById('setup-iron');
        this.setupIronVal = document.getElementById('setup-iron-val');
        this.setupCarbon = document.getElementById('setup-carbon');
        this.setupCarbonVal = document.getElementById('setup-carbon-val');
        
        this.setupTempEq = document.getElementById('setup-temp-eq');
        this.setupPressureEq = document.getElementById('setup-pressure-eq');
        this.setupOrbitalZone = document.getElementById('setup-orbital-zone');
        this.setupViableLine = document.getElementById('setup-viable-line');
        this.setupLaunchBtn = document.getElementById('setup-launch-btn');
        
        this.setupPlanetSize = 'medium'; // default
        
        // Interventions now managed via dropdown selector

        // Toggle Scientific Dossier Accordion Listener
        this.popupToggleDossier.addEventListener('click', () => this.togglePopupDossier());
        
        // Tab switching events
        this.tabMetrics.addEventListener('click', () => this.switchTab('metrics'));
        this.tabRoadmap.addEventListener('click', () => this.switchTab('roadmap'));

        // Setup modal event listeners for realtime feedback
        this.setupStarClass.addEventListener('change', () => this.updateSetupTelemetry());
        this.setupStarSize.addEventListener('input', (e) => {
            this.setupStarSizeVal.textContent = `${parseFloat(e.target.value).toFixed(1)}x`;
            this.updateSetupTelemetry();
        });
        this.setupOrbit.addEventListener('input', (e) => {
            this.setupOrbitVal.textContent = `${parseFloat(e.target.value).toFixed(1)} AU`;
            this.updateSetupTelemetry();
        });
        this.setupVolatiles.addEventListener('input', (e) => {
            this.setupVolatilesVal.textContent = `${e.target.value}%`;
            this.updateSetupTelemetry();
        });
        this.setupIron.addEventListener('input', (e) => {
            this.setupIronVal.textContent = `${e.target.value}%`;
            this.updateSetupTelemetry();
        });
        this.setupCarbon.addEventListener('input', (e) => {
            this.setupCarbonVal.textContent = `${e.target.value}%`;
            this.updateSetupTelemetry();
        });

        // Planet Size button toggles
        const sizeButtons = this.setupPlanetSizeGroup.querySelectorAll('.setup-toggle-btn');
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setupPlanetSize = btn.dataset.size;
                this.updateSetupTelemetry();
            });
        });
        
        // Initial feedback calculation
        this.updateSetupTelemetry();
    }

    togglePopupDossier() {
        const isOpen = this.popupDossierTextWrapper.classList.toggle('open');
        this.popupDossierToggleIcon.classList.toggle('rotated', isOpen);
    }

    updateSetupTelemetry() {
        if (!this.setupStarClass) return;
        const starClass = this.setupStarClass.value;
        const starSize = parseFloat(this.setupStarSize.value);
        const orbit = parseFloat(this.setupOrbit.value);
        
        let baseLuminosity = 1.0;
        if (starClass === 'm_dwarf') baseLuminosity = 0.05;
        if (starClass === 'blue_giant') baseLuminosity = 10.0;
        const starLuminosity = baseLuminosity * starSize;

        // Stefan-Boltzmann equilibrium temperature
        const eqTemp = 278.0 * Math.pow(starLuminosity / (orbit * orbit), 0.25) - 273.15;
        this.setupTempEq.textContent = `${eqTemp.toFixed(1)}°C`;
        
        // Estimated pressure
        let pressure = 1.0;
        const carbon = parseFloat(this.setupCarbon.value);
        if (this.setupPlanetSize === 'small') {
            pressure = 0.3 + (carbon / 100.0) * 0.2;
        } else if (this.setupPlanetSize === 'medium') {
            pressure = 0.8 + (carbon / 100.0) * 0.6;
        } else {
            pressure = 1.6 + (carbon / 100.0) * 1.4;
        }
        this.setupPressureEq.textContent = `${pressure.toFixed(2)} atm`;
        
        // Orbital Zone & Viable Line
        let zone = "BOILING WASTELAND";
        let line = "No Viable Chemistry";
        
        if (eqTemp >= 0.0 && eqTemp <= 100.0) {
            zone = "WATER HABITABLE ZONE";
            line = "Water-based Life";
            this.setupOrbitalZone.className = "value highlight-orange";
            this.setupViableLine.className = "value highlight-cyan";
        } else if (eqTemp >= -78.0 && eqTemp < 0.0) {
            zone = "AMMONIA HABITABLE ZONE";
            line = "Ammonia-based Life";
            this.setupOrbitalZone.className = "value highlight-cyan";
            this.setupViableLine.className = "value highlight-orange";
        } else if (eqTemp >= -183.0 && eqTemp < -78.0) {
            zone = "METHANE HABITABLE ZONE";
            line = "Cryo-Methane Life";
            this.setupOrbitalZone.className = "value highlight-cyan";
            this.setupViableLine.className = "value highlight-orange";
        } else if (eqTemp < -183.0) {
            zone = "FROZEN CRYOSPHERE";
            line = "Deep Cryo-Decoherence";
            this.setupOrbitalZone.className = "value text-muted";
            this.setupViableLine.className = "value text-muted";
        } else {
            zone = "THERMAL INFERNO";
            line = "Dissociated Plasma";
            this.setupOrbitalZone.className = "value text-red";
            this.setupViableLine.className = "value text-red";
        }
        
        this.setupOrbitalZone.textContent = zone;
        this.setupViableLine.textContent = line;
    }

    switchTab(tabId) {
        if (tabId === 'metrics') {
            this.tabMetrics.classList.add('active');
            this.tabRoadmap.classList.remove('active');
            this.tabContentMetrics.classList.add('active');
            this.tabContentRoadmap.classList.remove('active');
        } else {
            this.tabRoadmap.classList.add('active');
            this.tabMetrics.classList.remove('active');
            this.tabContentRoadmap.classList.add('active');
            this.tabContentMetrics.classList.remove('active');
        }
    }

    showMilestonePopup(title, desc, scientificDetails = null) {
        this.popupTitle.textContent = title;
        this.popupDesc.textContent = desc;
        
        // Reset accordion state
        this.popupDossierTextWrapper.classList.remove('open');
        this.popupDossierToggleIcon.classList.remove('rotated');
        
        if (scientificDetails) {
            this.popupDossierText.textContent = scientificDetails;
            this.popupDossierContainer.style.display = 'block';
        } else {
            this.popupDossierContainer.style.display = 'none';
        }
        
        this.popupOverlay.style.display = 'flex';
    }

    hidePopup() {
        this.popupOverlay.style.display = 'none';
    }

    /**
     * Set up event bindings to game functions
     */
    bindEvents(handlers) {
        // Disable main sliders so they act as gauges
        this.tempSlider.disabled = true;
        this.waterSlider.disabled = true;
        this.radSlider.disabled = true;

        this.handlers = handlers;

        // Interventions via modal triggers
        this.btnOpenInterventions.addEventListener('click', () => {
            this.interventionsModal.style.display = 'flex';
            this.renderInterventionsModal();
        });

        this.interventionsCloseBtn.addEventListener('click', () => {
            this.interventionsModal.style.display = 'none';
        });

        this.interventionsModal.addEventListener('click', (e) => {
            if (e.target === this.interventionsModal) {
                this.interventionsModal.style.display = 'none';
            }
        });
        
        // Launch configuration from setup modal
        this.setupLaunchBtn.addEventListener('click', () => {
            const config = {
                starClass: this.setupStarClass.value,
                starSize: this.setupStarSize.value,
                orbitDistance: this.setupOrbit.value,
                planetSize: this.setupPlanetSize,
                initialVolatiles: this.setupVolatiles.value,
                initialIron: this.setupIron.value,
                initialCarbon: this.setupCarbon.value
            };
            this.setupModal.style.display = 'none';
            handlers.onLaunch(config);
        });

        // Play/Pause
        this.btnPausePlay.addEventListener('click', () => handlers.onPauseToggle());

        // Canvas container click view toggle
        this.canvasContainer.addEventListener('click', () => {
            handlers.onToggleView();
        });

        // Save and Load State
        this.btnSaveState.addEventListener('click', () => handlers.onSaveState());
        this.btnLoadState.addEventListener('click', () => handlers.onLoadState());

        // Nudge evolution button click
        this.btnNudgeEvolution.addEventListener('click', () => {
            if (this.selectedNodeId) {
                handlers.onNudgeEvolution(this.selectedNodeId);
            }
        });

        // Delegate threat deflection click
        this.threatList.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-deflect');
            if (btn) {
                const threatId = btn.getAttribute('data-id');
                handlers.onDeflectThreat(threatId);
            }
        });

        // Close popup listeners
        this.popupCloseBtn.addEventListener('click', () => this.hidePopup());
        this.popupDismissBtn.addEventListener('click', () => this.hidePopup());
    }

    /**
     * Add entry to scientific feed console
     */
    logEvent(title, desc, type = 'system', meta = null) {
        const entry = document.createElement('div');
        const tierClass = meta && meta.tier ? ` tier-${meta.tier.toLowerCase()}` : '';
        entry.className = `log-entry ${type}${tierClass}`;

        const tierPrefix = meta && meta.tier
            ? `[${meta.tier}${typeof meta.tokens === 'number' ? ` +${meta.tokens}T` : ''}] `
            : '';
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        entry.innerHTML = `<span>[${timestamp}]</span> <strong>${tierPrefix}${title}:</strong> ${desc}`;

        this.scienceLog.appendChild(entry);
        this.scienceLog.scrollTop = this.scienceLog.scrollHeight;
    }

    /**
     * Update play/pause state
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
     * Synchronize sliders back to planet values
     */
    syncSliders(planet) {
        this.tempSlider.value = Math.round(planet.temperature);
        this.tempVal.textContent = `${this.tempSlider.value}°C`;

        this.waterSlider.value = Math.round(planet.getSolventCoverage());
        this.waterVal.textContent = `${this.waterSlider.value}%`;

        const currentRad = planet.radiation;
        const effectiveRad = planet.getEffectiveRadiation();
        this.radSlider.value = currentRad.toFixed(1);
        this.radVal.textContent = `Space: ${currentRad.toFixed(1)}`;
        if (this.radEffectiveVal) {
            this.radEffectiveVal.textContent = `Surf: ${effectiveRad.toFixed(1)} rad/s`;
        }

        // Color surface radiation value by warning level
        if (this.radEffectiveVal) {
            if (effectiveRad > 4.0) {
                this.radEffectiveVal.style.color = 'var(--accent-red)';
                this.radEffectiveVal.style.background = 'var(--accent-red-glow)';
            } else if (effectiveRad > 1.5) {
                this.radEffectiveVal.style.color = 'var(--accent-amber)';
                this.radEffectiveVal.style.background = 'rgba(245, 158, 11, 0.1)';
            } else {
                this.radEffectiveVal.style.color = 'var(--accent-green)';
                this.radEffectiveVal.style.background = 'var(--accent-green-glow)';
            }
        }

        // Update labels based on solvent
        if (planet.activeSolvent === 'water') {
            this.solventIcon.textContent = '💧';
            this.solventLabel.textContent = 'Water';
        } else if (planet.activeSolvent === 'ammonia') {
            this.solventIcon.textContent = '❄️';
            this.solventLabel.textContent = 'Ammonia';
        } else if (planet.activeSolvent === 'methane') {
            this.solventIcon.textContent = '🍊';
            this.solventLabel.textContent = 'Methane';
        }
    }

    /**
     * Render active threats/warnings list in threat control panel
     */
    updateThreats(warnings) {
        const cards = this.threatList.querySelectorAll('.threat-card');
        const cardIds = Array.from(cards).map(card => {
            const btn = card.querySelector('.btn-deflect');
            return btn ? btn.getAttribute('data-id') : null;
        });
        const warningIds = warnings.map(w => w.id);

        const hasChanged = cardIds.length !== warningIds.length || 
                           cardIds.some((id, idx) => id !== warningIds[idx]) ||
                           this.threatList.querySelector('.no-threats-msg');

        if (hasChanged) {
            this.threatList.innerHTML = '';
            if (warnings.length === 0) {
                this.threatList.innerHTML = '<div class="no-threats-msg">No active threats detected.</div>';
                return;
            }

            warnings.forEach(threat => {
                const row = document.createElement('div');
                row.className = `threat-card ${threat.type}`;
                row.innerHTML = `
                    <div class="threat-header">
                        <span class="threat-title">⚠️ ${threat.name}</span>
                        <span class="threat-timer">${threat.durationRemaining.toFixed(1)} Myr</span>
                    </div>
                    <div class="threat-desc">${threat.description}</div>
                    <button class="btn btn-warning btn-deflect" data-id="${threat.id}">
                        Deflect [${threat.cost}T]
                    </button>
                `;
                this.threatList.appendChild(row);
            });
        } else {
            // Update timers in place to prevent button recreation from breaking click events
            cards.forEach((card, idx) => {
                const threat = warnings[idx];
                const timerSpan = card.querySelector('.threat-timer');
                if (timerSpan) {
                    const newText = `${threat.durationRemaining.toFixed(1)} Myr`;
                    if (timerSpan.textContent !== newText) {
                        timerSpan.textContent = newText;
                    }
                }
            });
        }
    }

    /**
     * Render the branching nodes tree in the roadmap tab
     */
    renderEvolutionTree(planet, biology) {
        const solvent = planet.activeSolvent;
        this.activeBranchName.textContent = solvent.charAt(0).toUpperCase() + solvent.slice(1) + ' Line';
        
        let nodes = [];
        if (solvent === 'water') {
            nodes = [
                { id: 'soup', name: 'Prebiotic Soup', pop: biology.organicSoup, cap: 100.0, unit: 'ppm', req: 'Water > 10%, Temp 10-90°C', nudgeId: null, cost: 0 },
                { id: 'membrane', name: 'External Membrane', pop: biology.unlockedMembrane ? 100.0 : 0.0, cap: 100.0, unit: 'Idx', req: 'Organic Soup > 8 ppm', nudgeId: null, cost: 0 },
                { id: 'bacteria', name: 'Prokaryotes (Bacteria)', pop: biology.unlockedBacteria ? 100.0 : 0.0, cap: 100.0, unit: 'Idx', req: 'Membrane & Soup > 15 ppm', nudgeId: null, cost: 0 },
                { id: 'anaerobic', name: 'Anaerobic Archea', pop: biology.anaerobicPop, cap: 150.0, unit: 'M/mL', req: 'Bacterial emergence', nudgeId: null, cost: 0 },
                { id: 'photosynthetic', name: 'Cyanobacteria', pop: biology.photosyntheticPop, cap: 200.0, unit: 'M/mL', req: 'Bacteria > 25 M/mL', nudgeId: null, cost: 0 },
                { id: 'nucleus', name: 'Cellular Nucleus', pop: biology.unlockedNucleus ? 100.0 : 0.0, cap: 100.0, unit: 'Idx', req: 'Cyanobacteria > 15 M/mL', nudgeId: null, cost: 0 },
                { id: 'mitochondria', name: 'Mitochondria Symbiosis', pop: biology.unlockedMitochondria ? 100.0 : 0.0, cap: 100.0, unit: 'Idx', req: 'Nucleus & O₂ > 1.2% OR Nudge', nudgeId: 'endosymbiosis', nudgeName: 'Promote Endosymbiosis', cost: 8 },
                { id: 'eukaryotes', name: 'Eukaryotic Cells', pop: biology.eukaryoticPop, cap: 120.0, unit: 'M/mL', req: 'Mitochondria Symbiosis', nudgeId: null, cost: 0 },
                { id: 'sexual', name: 'Sexual Reproduction', pop: biology.unlockedSexualReproduction ? 100.0 : 0.0, cap: 100.0, unit: 'Idx', req: 'Eukaryotes > 20 M/mL', nudgeId: null, cost: 0 },
                { id: 'multicellular', name: 'Multicellularity', pop: biology.multicellularPop, cap: 100.0, unit: 'Idx', req: 'Sexual Reprod & Eukaryotes > 45 M/mL', nudgeId: null, cost: 0 },
                
                // New water animals
                { id: 'sponges', name: 'Marine Sponges', pop: biology.spongesPop, cap: 100.0, unit: 'Idx', req: 'Multicellularity > 20, O₂ > 10%', nudgeId: null, cost: 0 },
                { id: 'meduses', name: 'Jellyfish & Meduses', pop: biology.medusesPop, cap: 100.0, unit: 'Idx', req: 'Sponges > 25, O₂ > 12%', nudgeId: null, cost: 0 },
                { id: 'worms', name: 'Bilateral Water Worms', pop: biology.wormsPop, cap: 100.0, unit: 'Idx', req: 'Meduses > 30, O₂ > 14%', nudgeId: null, cost: 0 },
                { id: 'fish', name: 'Early Vertebrate Fish', pop: biology.fishPop, cap: 100.0, unit: 'Idx', req: 'Worms > 30, O₂ > 15%', nudgeId: null, cost: 0 },
                
                // New soil plants vegetable line
                { id: 'mosses', name: 'Non-Vascular Mosses', pop: biology.mossesPop, cap: 100.0, unit: 'Idx', req: 'Fish > 25, Magnetosphere & Ozone OR Nudge', nudgeId: 'vascular_tissue', nudgeName: 'Develop Vascular Tissue', cost: 10 },
                { id: 'ferns', name: 'Vascular Ferns', pop: biology.fernsPop, cap: 100.0, unit: 'Idx', req: 'Mosses > 30, O₂ > 16%', nudgeId: null, cost: 0 },
                { id: 'conifers', name: 'Gymnosperms (Conifers)', pop: biology.conifersPop, cap: 100.0, unit: 'Idx', req: 'Ferns > 30 OR Nudge', nudgeId: 'seed_evolution', nudgeName: 'Develop Seed Protection', cost: 12 },
                { id: 'angiosperms', name: 'Flowering Plants', pop: biology.angiospermsPop, cap: 100.0, unit: 'Idx', req: 'Conifers > 30, O₂ > 18%', nudgeId: null, cost: 0 },
                
                { id: 'cambrian', name: 'Cambrian Marine Life', pop: biology.cambrianPop, cap: 100.0, unit: 'Idx', req: 'Worms > 20, O₂ > 15%', nudgeId: null, cost: 0 },
                { id: 'insects', name: 'Land Insects', pop: biology.arthropodPop, cap: 100.0, unit: 'Idx', req: 'Mosses > 25%', nudgeId: null, cost: 0 },
                { id: 'tetrapods', name: 'Tetrapods (Amphibia)', pop: biology.tetrapodPop, cap: 100.0, unit: 'Idx', req: 'Fish > 30, Mosses > 30', nudgeId: 'amniotic_egg', nudgeName: 'Synthesize Amniotic Egg', cost: 12 },
                { id: 'sauropsids', name: 'Sauropsida (Dinosaurs)', pop: biology.sauropsidPop, cap: 100.0, unit: 'Idx', req: 'Tetrapods > 30, Temp > 28°C OR Nudge', nudgeId: 'scales', nudgeName: 'Nudge Scale Shielding', cost: 12 },
                { id: 'synapsids', name: 'Synapsida (Mammals)', pop: biology.synapsidPop, cap: 100.0, unit: 'Idx', req: 'Tetrapods > 30, O₂ > 20% OR Nudge', nudgeId: 'endthermy', nudgeName: 'Nudge Endothermy (Hair)', cost: 15 },
                { id: 'cognitive', name: 'Cognitive Species', pop: biology.cognitiveSpeciesPop, cap: 100.0, unit: 'Idx', req: 'Mammal/Dino > 45, O₂ > 19% OR Nudge', nudgeId: 'cognitive', nudgeName: 'Nudge Neural Networking', cost: 15 },
                { id: 'ai', name: 'Post-Biological AI', pop: biology.technologicalAIPop, cap: 100.0, unit: 'Idx', req: 'Cognitive > 35, Magnetosphere OR Nudge', nudgeId: 'ai', nudgeName: 'Buy Singularity core', cost: 15 },
                { id: 'cyborg', name: 'Cyborg Hybrids', pop: biology.cyborgPop, cap: 100.0, unit: 'Idx', req: 'Cognitive > 40, O₂ > 18% OR Nudge', nudgeId: 'cybernetic_implants', nudgeName: 'Promote Cybernetic Implants', cost: 18 },
                { id: 'noosphere', name: 'Planetary Noosphere', pop: biology.noospherePop, cap: 100.0, unit: 'Idx', req: 'AI/Cyborg > 45, Magnetosphere OR Nudge', nudgeId: 'global_consciousness', nudgeName: 'Sync Planetary Cloud', cost: 20 },
                { id: 'gaia_hivemind', name: 'Gaia Biosphere Hivemind', pop: biology.gaiaHivemindPop, cap: 100.0, unit: 'Idx', req: 'Cyborg > 45 OR Mosses > 60, O₂ > 20% OR Nudge', nudgeId: 'ecological_integration', nudgeName: 'Weave Mycelium Synapses', cost: 20 }
            ];
        } else if (solvent === 'ammonia') {
            nodes = [
                { id: 'ammonic_soup', name: 'Ammonic Soup', pop: biology.ammonicSoup, cap: 100.0, unit: 'ppm', req: 'Ammonia > 10%, Temp -80 to -30°C', nudgeId: null, cost: 0 },
                { id: 'ammonic_proto', name: 'Ammonic Prokaryotes', pop: biology.ammonicProtoPop, cap: 120.0, unit: 'M/mL', req: 'Ammonic Soup > 10 ppm', nudgeId: null, cost: 0 },
                { id: 'ammonic_multi', name: 'Ammonic Multicells', pop: biology.ammonicMultiPop, cap: 100.0, unit: 'Idx', req: 'Ammonic Proto > 35 M/mL', nudgeId: null, cost: 0 },
                { id: 'silico_flora', name: 'Silico-Flora', pop: biology.silicoFloraPop, cap: 100.0, unit: 'Idx', req: 'Temp < -45°C OR Nudge', nudgeId: 'silicon_chains', nudgeName: 'Promote Silicon Chains', cost: 12 },
                { id: 'cryo_fauna', name: 'Ammonic Megafauna', pop: biology.cryoFaunaPop, cap: 100.0, unit: 'Idx', req: 'Silico-Flora > 30', nudgeId: null, cost: 0 },
                { id: 'crystalline_cognitive', name: 'Crystalline Cognitive Swarms', pop: biology.crystallineCognitivePop, cap: 80.0, unit: 'Idx', req: 'Megafauna > 35, Temp < -40°C OR Nudge', nudgeId: 'crystalline_cognitive', nudgeName: 'Ignite Crystalline Collective', cost: 15 },
                { id: 'quantum_lattices', name: 'Quantum Lattices', pop: biology.quantumLatticePop, cap: 100.0, unit: 'Idx', req: 'Crystalline > 40, Temp < -50°C OR Nudge', nudgeId: 'quantum_alignment', nudgeName: 'Align Quantum Crystals', cost: 18 },
                { id: 'cryo_hivemind', name: 'Cryo-Biosphere Hivemind', pop: biology.cryoHivemindPop, cap: 100.0, unit: 'Idx', req: 'Crystalline > 40, Silico-Flora > 45 OR Nudge', nudgeId: 'cryo_neural_webs', nudgeName: 'Glacier Neural Synapses', cost: 18 }
            ];
        } else if (solvent === 'methane') {
            nodes = [
                { id: 'methane_soup', name: 'Hydrocarbon Soup', pop: biology.methaneSoup, cap: 100.0, unit: 'ppm', req: 'Methane > 10%, Temp -185 to -135°C', nudgeId: null, cost: 0 },
                { id: 'methane_proto', name: 'Cryo-Methanogen Prokaryotes', pop: biology.methaneProtoPop, cap: 100.0, unit: 'M/mL', req: 'Hydrocarbon Soup > 10 ppm', nudgeId: null, cost: 0 },
                { id: 'methane_multi', name: 'Cryo-Multicells', pop: biology.methaneMultiPop, cap: 80.0, unit: 'Idx', req: 'Methanogens > 30 M/mL', nudgeId: null, cost: 0 },
                { id: 'cryo_beasts', name: 'Cyto-Beasts', pop: biology.cryoOrganismsPop, cap: 70.0, unit: 'Idx', req: 'Stability OR Nudge', nudgeId: 'cryo_polymers', nudgeName: 'Synthesize Cryo-Polymers', cost: 12 },
                { id: 'cryo_polymer_network', name: 'Cryo-Polymer Networks', pop: biology.cryoPolymerNetworkPop, cap: 60.0, unit: 'Idx', req: 'Cyto-beasts > 30, Stability OR Nudge', nudgeId: 'cryo_polymer_network', nudgeName: 'Boot Cryo-Singularity Lattices', cost: 15 },
                { id: 'thinking_ocean', name: 'Thinking Methane Oceans', pop: biology.thinkingOceanPop, cap: 100.0, unit: 'Idx', req: 'Polymer Net > 40, Methane > 40% OR Nudge', nudgeId: 'colloidal_solids', nudgeName: 'Dissolve Computing Polymers', cost: 18 },
                { id: 'cryo_colloids', name: 'Megastructure Cryo-Colloids', pop: biology.cryoColloidPop, cap: 100.0, unit: 'Idx', req: 'Polymer Net > 40, Beasts > 45 OR Nudge', nudgeId: 'macromolecular_assembly', nudgeName: 'Assemble Colloidal structures', cost: 18 }
            ];
        }

        this.treeNodesList.innerHTML = '';
        nodes.forEach(node => {
            const card = document.createElement('div');
            const percent = Math.min(100, (node.pop / node.cap) * 100);
            
            let statusClass = 'locked';
            if (node.pop > 0) {
                statusClass = percent >= 50 ? 'dominant' : 'unlocked';
            }

            card.className = `tree-node-card ${statusClass} ${this.selectedNodeId === node.id ? 'selected' : ''}`;
            card.innerHTML = `
                <div class="node-meta">
                    <span class="node-name">${node.name}</span>
                    <span class="node-pop-val">${node.pop.toFixed(1)} ${node.unit}</span>
                </div>
                <div class="node-bar-container">
                    <div class="node-bar-fill" style="width: ${percent}%"></div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                this.selectedNodeId = node.id;
                this.renderSelectedNodeDetails(node, biology);
                // re-render list to show selection border
                this.renderEvolutionTree(planet, biology);
            });

            this.treeNodesList.appendChild(card);
        });
    }

    renderSelectedNodeDetails(node, biology) {
        this.nodeDetailsTitle.textContent = node.name;
        this.nodeDetailsText.innerHTML = `
            <strong>Milestone Requirements:</strong> ${node.req}<br>
            <strong>Current Population:</strong> ${node.pop.toFixed(2)} / ${node.cap.toFixed(0)}<br>
            ${node.nudgeId ? `<strong>Gene Upgrade Nudge:</strong> ${node.nudgeName} (Allows unlocking or speeds up development).` : 'No manual gene upgrades for this branch.'}
        `;

        if (node.nudgeId && !biology.activeAdaptations.has(node.nudgeId)) {
            this.btnNudgeEvolution.style.display = 'block';
            this.btnNudgeEvolution.textContent = `🧬 Nudge Adaptations [${node.cost}T]`;
            this.btnNudgeEvolution.setAttribute('data-nudge', node.nudgeId);
            this.btnNudgeEvolution.setAttribute('data-cost', node.cost);
        } else if (node.nudgeId && biology.activeAdaptations.has(node.nudgeId)) {
            this.btnNudgeEvolution.style.display = 'block';
            this.btnNudgeEvolution.textContent = "✅ ADAPTATION ACTIVE";
            this.btnNudgeEvolution.disabled = true;
        } else {
            this.btnNudgeEvolution.style.display = 'none';
        }
    }

    /**
     * Redraw dashboard telemetry, progress bars, and tab information
     */
    updateDashboard(planet, biology) {
        // Synchronize main sliders / gauges in real-time
        this.syncSliders(planet);

        // Curatorial Token display
        this.tokenBalance.textContent = planet.age > 0 
            ? `${Math.floor(biology.organicSoup > 0 || biology.ammonicSoup > 0 || biology.methaneSoup > 0 ? biology.organicSoup * 0.1 + biology.anaerobicPop * 0.05 + 15 : 15)}` 
            : '15'; 
        // Wait, let's tie this tokenBalance directly to events.tokens
        // We will make sure game.js overrides this with events.tokens.
        
        // Planet Age
        this.planetAge.textContent = `${planet.age.toFixed(1)} Myr`;
        
        // Habitability
        const hab = planet.getHabitabilityScore();
        this.habitabilityScore.textContent = `${hab}%`;
        
        // Solvent details
        this.solventState.textContent = planet.activeSolvent.toUpperCase();

        // Update solvent label and dot color in history legend dynamically
        const envWaterLegend = document.getElementById('env-water-legend');
        if (envWaterLegend) {
            if (planet.activeSolvent === 'water') {
                envWaterLegend.innerHTML = '<em class="dot env-water" style="background: var(--accent-green);"></em>Water';
            } else if (planet.activeSolvent === 'ammonia') {
                envWaterLegend.innerHTML = '<em class="dot env-water" style="background: var(--accent-purple);"></em>Ammonia';
            } else if (planet.activeSolvent === 'methane') {
                envWaterLegend.innerHTML = '<em class="dot env-water" style="background: var(--accent-amber);"></em>Methane';
            }
        }

        // Update biomass history graph legend text and visibility
        if (planet.activeSolvent === 'water') {
            this.bioLegend1.innerHTML = `<em class="dot bio-anaerobic"></em>Anaerobic`;
            this.bioLegend2.innerHTML = `<em class="dot bio-photo"></em>Photo.`;
            this.bioLegend3.innerHTML = `<em class="dot bio-multi"></em>Early Multi.`;
            this.bioLegend4.innerHTML = `<em class="dot bio-complex"></em>Complex`;
            this.bioLegend5.innerHTML = `<em class="dot bio-sentient"></em>Sentient`;
        } else if (planet.activeSolvent === 'ammonia') {
            this.bioLegend1.innerHTML = `<em class="dot bio-anaerobic"></em>Ammonic Proto`;
            this.bioLegend2.innerHTML = `<em class="dot bio-photo"></em>Silico-Flora`;
            this.bioLegend3.innerHTML = `<em class="dot bio-multi"></em>Early Multi.`;
            this.bioLegend4.innerHTML = `<em class="dot bio-complex"></em>Complex Fauna`;
            this.bioLegend5.innerHTML = `<em class="dot bio-sentient"></em>Sentient`;
        } else if (planet.activeSolvent === 'methane') {
            this.bioLegend1.innerHTML = `<em class="dot bio-anaerobic"></em>Methane Proto`;
            this.bioLegend2.innerHTML = `<em class="dot bio-photo"></em>Polymer Net.`;
            this.bioLegend3.innerHTML = `<em class="dot bio-multi"></em>Early Multi.`;
            this.bioLegend4.innerHTML = `<em class="dot bio-complex"></em>Complex Fauna`;
            this.bioLegend5.innerHTML = `<em class="dot bio-sentient"></em>Sentient`;
        }

        const hasSentient = biology.unlockedCognitive || biology.unlockedCrystallineCognitive || biology.unlockedThinkingOcean || 
                            biology.cognitiveSpeciesPop > 0.0 || biology.crystallineCognitivePop > 0.0 || biology.thinkingOceanPop > 0.0;
        this.bioLegend5.style.display = hasSentient ? 'inline-flex' : 'none';
        
        // Shield, Ozone, Star, and Moon telemetry
        this.magnetShield.textContent = `${planet.magneticStrength.toFixed(0)}%`;
        this.ozoneLayer.textContent = `${(planet.ozone * 100).toFixed(0)}%`;
        this.starLuminosity.textContent = `${planet.starLuminosity.toFixed(2)}x`;
        this.moonIndicator.style.display = planet.hasMoon ? 'flex' : 'none';

        // Update atmospheric graph bars
        this.barCo2.style.width = `${planet.co2}%`;
        this.gasCo2Val.textContent = `${planet.co2.toFixed(1)}%`;
        this.barN2.style.width = `${planet.n2}%`;
        this.gasN2Val.textContent = `${planet.n2.toFixed(1)}%`;
        this.barO2.style.width = `${planet.o2}%`;
        this.gasO2Val.textContent = `${planet.o2.toFixed(1)}%`;

        if (planet.activeSolvent === 'methane') {
            this.ch4GasWrapper.style.display = 'flex';
            this.h2GasWrapper.style.display = 'flex';
            this.barCh4.style.width = `${planet.ch4}%`;
            this.gasCh4Val.textContent = `${planet.ch4.toFixed(1)}%`;
            this.barH2.style.width = `${planet.h2}%`;
            this.gasH2Val.textContent = `${planet.h2.toFixed(1)}%`;
        } else {
            this.ch4GasWrapper.style.display = 'none';
            this.h2GasWrapper.style.display = 'none';
        }

        // Show/hide metric group categories based on active solvent
        if (planet.activeSolvent === 'water') {
            this.waterMetrics.style.display = 'block';
            this.ammoniaMetrics.style.display = 'none';
            this.methaneMetrics.style.display = 'none';
            
            // Progressive card visibility
            this.soupCard.style.display = biology.unlockedSoup ? 'block' : 'none';
            this.anaerobicCard.style.display = biology.unlockedAnaerobic ? 'block' : 'none';
            this.photosyntheticCard.style.display = biology.unlockedPhotosynthetic ? 'block' : 'none';
            this.eukaryoticCard.style.display = biology.unlockedEukaryotic ? 'block' : 'none';
            this.multicellularCard.style.display = biology.unlockedMulticellular ? 'block' : 'none';
            this.spongesCard.style.display = biology.unlockedSponges ? 'block' : 'none';
            this.medusesCard.style.display = biology.unlockedMeduses ? 'block' : 'none';
            this.wormsCard.style.display = biology.unlockedWorms ? 'block' : 'none';
            this.fishCard.style.display = biology.unlockedFish ? 'block' : 'none';
            this.mossesCard.style.display = biology.unlockedMosses ? 'block' : 'none';
            this.fernsCard.style.display = biology.unlockedFerns ? 'block' : 'none';
            this.conifersCard.style.display = biology.unlockedConifers ? 'block' : 'none';
            this.angiospermsCard.style.display = biology.unlockedAngiosperms ? 'block' : 'none';
            this.sauropsidCard.style.display = biology.unlockedSauropsid ? 'block' : 'none';
            this.synapsidCard.style.display = biology.unlockedSynapsid ? 'block' : 'none';
            
            this.soupDensity.textContent = `${biology.organicSoup.toFixed(2)} ppm`;
            this.soupProgress.style.width = `${biology.organicSoup}%`;
            this.anaerobicPop.textContent = `${biology.anaerobicPop.toFixed(2)} M/mL`;
            this.anaerobicProgress.style.width = `${(biology.anaerobicPop / 150) * 100}%`;
            this.photosyntheticPop.textContent = `${biology.photosyntheticPop.toFixed(2)} M/mL`;
            this.photosyntheticProgress.style.width = `${(biology.photosyntheticPop / 200) * 100}%`;
            this.eukaryoticPop.textContent = `${biology.eukaryoticPop.toFixed(2)} M/mL`;
            this.eukaryoticProgress.style.width = `${(biology.eukaryoticPop / 120) * 100}%`;
            this.multicellularPop.textContent = `${biology.multicellularPop.toFixed(2)} Index`;
            this.multicellularProgress.style.width = `${biology.multicellularPop}%`;

            // Sponges, Meduses, Worms, Fish updates
            this.spongesPop.textContent = `${biology.spongesPop.toFixed(2)} Index`;
            this.spongesProgress.style.width = `${biology.spongesPop}%`;
            this.medusesPop.textContent = `${biology.medusesPop.toFixed(2)} Index`;
            this.medusesProgress.style.width = `${biology.medusesPop}%`;
            this.wormsPop.textContent = `${biology.wormsPop.toFixed(2)} Index`;
            this.wormsProgress.style.width = `${biology.wormsPop}%`;
            this.fishPop.textContent = `${biology.fishPop.toFixed(2)} Index`;
            this.fishProgress.style.width = `${biology.fishPop}%`;

            // Mosses, Ferns, Conifers, Flowers updates
            this.mossesPop.textContent = `${biology.mossesPop.toFixed(2)} Index`;
            this.mossesProgress.style.width = `${biology.mossesPop}%`;
            this.fernsPop.textContent = `${biology.fernsPop.toFixed(2)} Index`;
            this.fernsProgress.style.width = `${biology.fernsPop}%`;
            this.conifersPop.textContent = `${biology.conifersPop.toFixed(2)} Index`;
            this.conifersProgress.style.width = `${biology.conifersPop}%`;
            this.angiospermsPop.textContent = `${biology.angiospermsPop.toFixed(2)} Index`;
            this.angiospermsProgress.style.width = `${biology.angiospermsPop}%`;

            this.sauropsidPop.textContent = `${biology.sauropsidPop.toFixed(2)} Index`;
            this.sauropsidProgress.style.width = `${biology.sauropsidPop}%`;
            this.synapsidPop.textContent = `${biology.synapsidPop.toFixed(2)} Index`;
            this.synapsidProgress.style.width = `${biology.synapsidPop}%`;

            // Update future metrics cards
            if (biology.unlockedCyborg) {
                this.cyborgCard.style.display = 'block';
                this.cyborgPop.textContent = `${biology.cyborgPop.toFixed(2)} Index`;
                this.cyborgProgress.style.width = `${biology.cyborgPop}%`;
            } else {
                this.cyborgCard.style.display = 'none';
            }
            if (biology.unlockedNoosphere) {
                this.noosphereCard.style.display = 'block';
                this.noospherePop.textContent = `${biology.noospherePop.toFixed(2)} Index`;
                this.noosphereProgress.style.width = `${biology.noospherePop}%`;
            } else {
                this.noosphereCard.style.display = 'none';
            }
            if (biology.unlockedGaiaHivemind) {
                this.gaiaCard.style.display = 'block';
                this.gaiaPop.textContent = `${biology.gaiaHivemindPop.toFixed(2)} Index`;
                this.gaiaProgress.style.width = `${biology.gaiaHivemindPop}%`;
            } else {
                this.gaiaCard.style.display = 'none';
            }
        } else if (planet.activeSolvent === 'ammonia') {
            this.waterMetrics.style.display = 'none';
            this.ammoniaMetrics.style.display = 'block';
            this.methaneMetrics.style.display = 'none';

            // Progressive card visibility
            this.ammoniaSoupCard.style.display = biology.unlockedAmmonicSoup ? 'block' : 'none';
            this.ammoniaProtoCard.style.display = biology.unlockedAmmonicProto ? 'block' : 'none';
            this.ammoniaMultiCard.style.display = biology.unlockedAmmonicMulti ? 'block' : 'none';
            this.silicoFloraCard.style.display = biology.unlockedSilicoFlora ? 'block' : 'none';
            this.cryoFaunaCard.style.display = biology.unlockedCryoFauna ? 'block' : 'none';

            this.ammoniaSoupDensity.textContent = `${biology.ammonicSoup.toFixed(2)} ppm`;
            this.ammoniaSoupProgress.style.width = `${biology.ammonicSoup}%`;
            this.ammoniaProtoPop.textContent = `${biology.ammonicProtoPop.toFixed(2)} M/mL`;
            this.ammoniaProtoProgress.style.width = `${(biology.ammonicProtoPop / 120) * 100}%`;
            this.ammoniaMultiPop.textContent = `${biology.ammonicMultiPop.toFixed(2)} Index`;
            this.ammoniaMultiProgress.style.width = `${biology.ammonicMultiPop}%`;
            this.silicoFloraPop.textContent = `${biology.silicoFloraPop.toFixed(2)} Index`;
            this.silicoFloraProgress.style.width = `${biology.silicoFloraPop}%`;
            this.cryoFaunaPop.textContent = `${biology.cryoFaunaPop.toFixed(2)} Index`;
            this.cryoFaunaProgress.style.width = `${biology.cryoFaunaPop}%`;

            // Update future metrics cards
            if (biology.unlockedQuantumLattice) {
                this.quantumLatticeCard.style.display = 'block';
                this.quantumLatticePop.textContent = `${biology.quantumLatticePop.toFixed(2)} Index`;
                this.quantumLatticeProgress.style.width = `${biology.quantumLatticePop}%`;
            } else {
                this.quantumLatticeCard.style.display = 'none';
            }
            if (biology.unlockedCryoHivemind) {
                this.cryoHivemindCard.style.display = 'block';
                this.cryoHivemindPop.textContent = `${biology.cryoHivemindPop.toFixed(2)} Index`;
                this.cryoHivemindProgress.style.width = `${biology.cryoHivemindPop}%`;
            } else {
                this.cryoHivemindCard.style.display = 'none';
            }
        } else if (planet.activeSolvent === 'methane') {
            this.waterMetrics.style.display = 'none';
            this.ammoniaMetrics.style.display = 'none';
            this.methaneMetrics.style.display = 'block';

            // Progressive card visibility
            this.methaneSoupCard.style.display = biology.unlockedMethaneSoup ? 'block' : 'none';
            this.methaneProtoCard.style.display = biology.unlockedMethaneProto ? 'block' : 'none';
            this.methaneMultiCard.style.display = biology.unlockedMethaneMulti ? 'block' : 'none';
            this.cryoOrganismsCard.style.display = biology.unlockedCryoOrganisms ? 'block' : 'none';

            this.methaneSoupDensity.textContent = `${biology.methaneSoup.toFixed(2)} ppm`;
            this.methaneSoupProgress.style.width = `${biology.methaneSoup}%`;
            this.methaneProtoPop.textContent = `${biology.methaneProtoPop.toFixed(2)} M/mL`;
            this.methaneProtoProgress.style.width = `${(biology.methaneProtoPop / 100) * 100}%`;
            this.methaneMultiPop.textContent = `${biology.methaneMultiPop.toFixed(2)} Index`;
            this.methaneMultiProgress.style.width = `${(biology.methaneMultiPop / 80) * 100}%`;
            this.cryoOrganismsPop.textContent = `${biology.cryoOrganismsPop.toFixed(2)} Index`;
            this.cryoOrganismsProgress.style.width = `${(biology.cryoOrganismsPop / 70) * 100}%`;

            // Update future metrics cards
            if (biology.unlockedThinkingOcean) {
                this.thinkingOceanCard.style.display = 'block';
                this.thinkingOceanPop.textContent = `${biology.thinkingOceanPop.toFixed(2)} Index`;
                this.thinkingOceanProgress.style.width = `${biology.thinkingOceanPop}%`;
            } else {
                this.thinkingOceanCard.style.display = 'none';
            }
            if (biology.unlockedCryoColloid) {
                this.cryoColloidCard.style.display = 'block';
                this.cryoColloidPop.textContent = `${biology.cryoColloidPop.toFixed(2)} Index`;
                this.cryoColloidProgress.style.width = `${biology.cryoColloidPop}%`;
            } else {
                this.cryoColloidCard.style.display = 'none';
            }
        }

        // Render Evolution Tree nodes dynamically
        this.renderEvolutionTree(planet, biology);
    }

    /**
     * Cache game state objects for the interventions modal.
     * Does NOT re-render every frame — that would destroy buttons between
     * mousedown and mouseup and prevent click events from firing.
     */
    updateInterventions(planet, biology, eventSystem) {
        this.currentPlanet = planet;
        this.currentBiology = biology;
        this.currentEventSystem = eventSystem;
    }

    /**
     * Render the list of interventions dynamically in the modal popup
     */
    renderInterventionsModal() {
        if (!this.currentPlanet || !this.currentBiology || !this.currentEventSystem) return;

        const planet = this.currentPlanet;
        const biology = this.currentBiology;
        const eventSystem = this.currentEventSystem;
        const tokens = eventSystem.tokens;

        this.interventionsGridList.innerHTML = '';

        this.interventionsList.forEach(event => {
            const comp = eventSystem.getInterventionCompatibility(event.id, planet, biology);
            const canAfford = tokens >= event.cost;

            const card = document.createElement('div');
            card.className = `intervention-card${comp.compatible ? '' : ' disabled'}`;

            const header = document.createElement('div');
            header.className = 'intervention-header';
            
            const title = document.createElement('h3');
            title.className = 'intervention-title';
            title.textContent = event.name;

            const cost = document.createElement('span');
            cost.className = 'intervention-cost';
            cost.textContent = `${event.cost} T`;

            header.appendChild(title);
            header.appendChild(cost);
            card.appendChild(header);

            const desc = document.createElement('p');
            desc.className = 'intervention-desc';
            desc.textContent = event.desc;
            card.appendChild(desc);

            if (!comp.compatible && comp.reason) {
                const warning = document.createElement('div');
                warning.className = 'intervention-warning';
                warning.innerHTML = `⚠️ <span>${comp.reason}</span>`;
                card.appendChild(warning);
            }

            const btn = document.createElement('button');
            btn.className = 'btn btn-action';
            btn.style.width = '100%';
            
            if (!comp.compatible) {
                btn.textContent = 'INCOMPATIBLE';
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            } else if (!canAfford) {
                btn.textContent = `NEED ${event.cost} TOKENS (HAVE ${Math.floor(tokens)})`;
                btn.disabled = true;
                btn.style.opacity = '0.6';
                btn.style.cursor = 'not-allowed';
            } else {
                btn.textContent = 'TRIGGER EVENT';
                btn.addEventListener('click', () => {
                    if (this.handlers && this.handlers.onIntervention) {
                        this.handlers.onIntervention(event.id);
                        this.interventionsModal.style.display = 'none';
                    }
                });
            }
            card.appendChild(btn);

            this.interventionsGridList.appendChild(card);
        });
    }

    updateViewModeLabel(viewMode) {
        if (this.currentViewModeLabel) {
            this.currentViewModeLabel.textContent = viewMode === 'macro' ? 'PLANET (MACRO)' : 'MICROSCOPIC (MICRO)';
        }
    }
}
