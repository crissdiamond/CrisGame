import { EVOLUTION_GRAPH, getEvolutionNode, getEvolutionNodes, getNodeBiomass, isNodeUnlocked } from './evolutionData.js';
import { ToastView } from './views/toastView.js';
import { LogView } from './views/logView.js';

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
        
        this.tokenBalanceBlue = document.getElementById('token-balance-blue');
        this.tokenBalanceSilver = document.getElementById('token-balance-silver');
        this.tokenBalanceGold = document.getElementById('token-balance-gold');
        this.threatList = document.getElementById('threat-list');

        // Gauge Elements (Planet Telemetry Strip — Climate Tab)
        this.gaugeTempVal = document.getElementById('gauge-temp-val');
        this.gaugeTempFill = document.getElementById('gauge-temp-fill');
        this.gaugeTempThumb = document.getElementById('gauge-temp-thumb');
        this.gaugeTempZone = document.getElementById('gauge-temp-zone');
        this.gaugeTempZoneLabel = document.getElementById('gauge-temp-zone-label');
        this.gaugeWaterVal = document.getElementById('gauge-water-val');
        this.gaugeWaterFill = document.getElementById('gauge-water-fill');
        this.gaugeWaterThumb = document.getElementById('gauge-water-thumb');
        this.gaugeWaterZone = document.getElementById('gauge-water-zone');
        this.gaugeSolventIcon = document.getElementById('gauge-solvent-icon');
        this.gaugeSolventLabel = document.getElementById('gauge-solvent-label');
        this.gaugeRadSpaceVal = document.getElementById('gauge-rad-space-val');
        this.gaugeRadSurfVal = document.getElementById('gauge-rad-surf-val');
        this.gaugeRadFill = document.getElementById('gauge-rad-fill');
        this.gaugeRadThumb = document.getElementById('gauge-rad-thumb');
        this.gaugeRadZone = document.getElementById('gauge-rad-zone');

        // Strip Tab buttons and content panes
        this.stripTabClimate = document.getElementById('strip-tab-climate');
        this.stripTabAtmosphere = document.getElementById('strip-tab-atmosphere');
        this.stripTabPlanet = document.getElementById('strip-tab-planet');
        this.stripContentClimate = document.getElementById('strip-content-climate');
        this.stripContentAtmosphere = document.getElementById('strip-content-atmosphere');
        this.stripContentPlanet = document.getElementById('strip-content-planet');

        // Planet Info strip mirrors
        this.stripMagnetShield = document.getElementById('strip-magnet-shield');
        this.stripOzoneLayer = document.getElementById('strip-ozone-layer');
        this.stripStarLuminosity = document.getElementById('strip-star-luminosity');

        // Left panel climate pills
        this.pillTemp = document.getElementById('pill-temp');
        this.pillTempVal = document.getElementById('pill-temp-val');
        this.pillWater = document.getElementById('pill-water');
        this.pillWaterVal = document.getElementById('pill-water-val');
        this.pillSolventIcon = document.getElementById('pill-solvent-icon');
        this.pillRad = document.getElementById('pill-rad');
        this.pillRadVal = document.getElementById('pill-rad-val');

        Object.defineProperty(this, 'tokenBalance', {
            get: () => this.tokenBalanceBlue || { textContent: '0' },
            configurable: true
        });
        
        // Interventions Modal
        this.btnOpenInterventions = document.getElementById('btn-open-interventions');
        this.interventionsModal = document.getElementById('interventions-modal');
        this.interventionsCloseBtn = document.getElementById('interventions-close-btn');
        this.interventionsGridList = document.getElementById('interventions-grid-list');
        this.handlers = null;

        // Pacing Timeline Elements
        this.pacingStatus = document.getElementById('pacing-status');
        this.pacingPlayerFill = document.getElementById('pacing-player-fill');
        this.pacingText = document.getElementById('pacing-text');

        // Water Cards
        this.soupCard = document.getElementById('soup-card');
        this.anaerobicCard = document.getElementById('anaerobic-card');
        this.photosyntheticCard = document.getElementById('photosynthetic-card');
        this.eukaryoticCard = document.getElementById('eukaryotes-card');
        this.multicellularCard = document.getElementById('multicellular-card');
        this.spongesCard = document.getElementById('sponges-card');
        this.medusesCard = document.getElementById('meduses-card');
        this.wormsCard = document.getElementById('worms-card');
        this.fishCard = document.getElementById('fish-card');
        this.mossesCard = document.getElementById('mosses-card');
        this.fernsCard = document.getElementById('ferns-card');
        this.conifersCard = document.getElementById('conifers-card');
        this.angiospermsCard = document.getElementById('angiosperms-card');
        this.sauropsidCard = document.getElementById('sauropsids-card');
        this.synapsidCard = document.getElementById('synapsids-card');

        // Ammonia Cards
        this.ammoniaSoupCard = document.getElementById('ammonic_soup-card');
        this.ammoniaProtoCard = document.getElementById('ammonic_proto-card');
        this.ammoniaMultiCard = document.getElementById('ammonic_multi-card');
        this.silicoFloraCard = document.getElementById('silico_flora-card');
        this.cryoFaunaCard = document.getElementById('cryo_fauna-card');

        // Methane Cards
        this.methaneSoupCard = document.getElementById('methane_soup-card');
        this.methaneProtoCard = document.getElementById('methane_proto-card');
        this.methaneMultiCard = document.getElementById('methane_multi-card');
        this.cryoOrganismsCard = document.getElementById('cryo_organisms-card');

        // List of all 10 interventions with titles and descriptions
        this.interventionsList = [
            { id: 'water_comet', name: '☄️ Redirect Water Comet', cost: 10, desc: 'Redirects a water-rich comet from the outer system. Increases solvent coverage (+20%) and enriches prebiotic soup.' },
            { id: 'ammonia_comet', name: '☄️ Redirect Ammonia Comet', cost: 10, desc: 'Redirects a nitrogenous ammonia-rich comet. Adds alternative liquid solvent coverage (+25%) for cold pathways.' },
            { id: 'methane_comet', name: '☄️ Redirect Hydrocarbon Comet', cost: 10, desc: 'Redirects a methane-rich comet, forming non-polar liquid hydrocarbon seas (+20%) on cold worlds.' },
            { id: 'giant_collision', name: '💥 Giant Protoplanet Collision', cost: 30, desc: 'Triggers a massive collision with a Mars-sized body. Forms a Moon (+tides), melts crust, and boosts magnetosphere potential.' },
            { id: 'gravitational_resonance', name: '🧲 Gravitational Resonance', cost: 20, desc: 'Uses orbital gravitational flex to heat core convection dynamo, restoring planetary magnetosphere shield to 100%.' },
            { id: 'volcanic_eruption', name: '🌋 Trigger Volcanic Eruptions', cost: 15, desc: 'Opens tectonic crustal vents, triggering basalt volcanism. Outgasses CO2 (+12%) and thickens atmosphere (+0.2 atm).' },
            { id: 'methanogen_bloom', name: '🦠 Induce Methanogenic Bloom', cost: 12, desc: 'Fertilizes deep-sea hydrothermal vents to trigger methanogen growth. Releases methane gas (+12%) to warm the planet.' },
            { id: 'silicate_weathering', name: '🪨 Silicate Weathering', cost: 15, desc: 'Accelerates continental rock chemical weathering via acid rain. Traps atmospheric CO2 (-8%) into sea carbonate sediment.' },
            { id: 'dust_veil', name: '🌫️ Seed Aerosol Dust Veil', cost: 12, desc: 'Disintegrates a minor asteroid in the upper atmosphere. Seeds dust reflecting starlight to cool the planet.' },
            { id: 'cyanobacteria_bloom', name: '🌿 Cyanobacteria Bloom', cost: 12, desc: 'Injects nutrients into liquid basins to trigger photosynthetic blooms. Releases oxygen (+8%) and absorbs CO2 (-5%).' }
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
        this.tabTuning = document.getElementById('tab-tuning');
        this.tabExchange = document.getElementById('tab-exchange');
        this.tabContentMetrics = document.getElementById('tab-content-metrics');
        this.tabContentRoadmap = document.getElementById('tab-content-roadmap');
        this.tabContentTuning = document.getElementById('tab-content-tuning');
        this.tabContentExchange = document.getElementById('tab-content-exchange');
        this.btnConvertBlueSilver = document.getElementById('btn-convert-blue-silver');
        this.btnConvertSilverGold = document.getElementById('btn-convert-silver-gold');

        // OEC stability gate UI elements
        this.pacingGateWrapper = document.getElementById('pacing-gate-wrapper');
        this.pacingGateTimer = document.getElementById('pacing-gate-timer');

        // Anoxygenic photosynthesizer biomass elements
        this.anoxygenicPhotoCard = document.getElementById('anoxygenic_photo-card');
        this.anoxygenicPhotoPop = document.getElementById('anoxygenic_photo-density');
        this.anoxygenicPhotoProgress = document.getElementById('anoxygenic_photo-progress');

        // Gene tuning interface elements
        this.thermalResilienceLevelVal = document.getElementById('thermal-resilience-level-val');
        this.thermalResilienceEffectVal = document.getElementById('thermal-resilience-effect-val');
        this.btnUpgradeThermal = document.getElementById('btn-upgrade-thermal');

        this.radiationDefenseLevelVal = document.getElementById('radiation-defense-level-val');
        this.radiationDefenseEffectVal = document.getElementById('radiation-defense-effect-val');
        this.btnUpgradeRadiation = document.getElementById('btn-upgrade-radiation');

        this.metabolicEfficiencyLevelVal = document.getElementById('metabolic-efficiency-level-val');
        this.metabolicEfficiencyEffectVal = document.getElementById('metabolic-efficiency-effect-val');
        this.btnUpgradeMetabolic = document.getElementById('btn-upgrade-metabolic');
        
        // Evolution Tree UI
        this.treeNodesList = document.getElementById('tree-nodes-list');
        this.activeBranchName = document.getElementById('active-branch-name');
        this.nodeDetailsTitle = document.getElementById('node-details-title');
        this.nodeDetailsText = document.getElementById('node-details-text');
        this.btnNudgeEvolution = document.getElementById('btn-nudge-evolution');
        
        this.selectedNodeId = null;
        this.scienceLog = document.getElementById('science-log');
        this._toastView = new ToastView();
        this._logView = new LogView(this.scienceLog);

        // Popup Overlay Cache
        this.popupOverlay = document.getElementById('milestone-popup');
        this.popupTitle = document.getElementById('popup-title');
        this.popupDesc = document.getElementById('popup-desc');
        this.popupReward = document.getElementById('popup-reward');
        this.popupCloseBtn = document.getElementById('popup-close-btn');
        this.popupDismissBtn = document.getElementById('popup-dismiss-btn');
        this.popupDeflectBtn = document.getElementById('popup-deflect-btn');
        this.popupIcon = document.getElementById('popup-icon');
        this.popupDossierContainer = document.getElementById('popup-dossier-container');
        this.popupToggleDossier = document.getElementById('popup-toggle-dossier');
        this.popupDossierText = document.getElementById('popup-dossier-text');
        this.popupDossierTextWrapper = document.getElementById('popup-dossier-text-wrapper');
        this.popupDossierToggleIcon = document.getElementById('popup-dossier-toggle-icon');
        
        this.activePopupWarningId = null;

        // Biomass details modal cache
        this.biomassModal = document.getElementById('biomass-modal');
        this.biomassCloseBtn = document.getElementById('biomass-close-btn');
        this.biomassModalTitle = document.getElementById('biomass-modal-title');
        this.biomassModalClade = document.getElementById('biomass-modal-clade');
        this.biomassModalPop = document.getElementById('biomass-modal-pop');
        this.biomassModalCap = document.getElementById('biomass-modal-cap');
        this.biomassModalUnit = document.getElementById('biomass-modal-unit');
        this.biomassModalSpecies = document.getElementById('biomass-modal-species');
        this.biomassModalTrend = document.getElementById('biomass-modal-trend');
        this.biomassModalDesc = document.getElementById('biomass-modal-desc');
        this.biomassModalScientific = document.getElementById('biomass-modal-scientific');
        this.biomassModalFactors = document.getElementById('biomass-modal-factors');
        this.biomassModalGenotypeSection = document.getElementById('biomass-modal-genotype-section');
        this.biomassModalGenotype = document.getElementById('biomass-modal-genotype');
        this.wasPlayingBeforeBiomassPopup = false;
        this.activeBiomassNodeId = null;

        // Setup Modal Elements
        this.setupModal = document.getElementById('setup-modal');
        this.setupLoadBtn = document.getElementById('setup-load-btn');
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
        if (this.tabMetrics) this.tabMetrics.addEventListener('click', () => this.switchTab('metrics'));
        if (this.tabRoadmap) this.tabRoadmap.addEventListener('click', () => this.switchTab('roadmap'));
        if (this.tabTuning) this.tabTuning.addEventListener('click', () => this.switchTab('tuning'));
        if (this.tabExchange) this.tabExchange.addEventListener('click', () => this.switchTab('exchange'));

        // Strip tab switching events
        if (this.stripTabClimate) this.stripTabClimate.addEventListener('click', () => this.switchStripTab('climate'));
        if (this.stripTabAtmosphere) this.stripTabAtmosphere.addEventListener('click', () => this.switchStripTab('atmosphere'));
        if (this.stripTabPlanet) this.stripTabPlanet.addEventListener('click', () => this.switchStripTab('planet'));

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

    switchLeftTab(tabId) {
        if (this.tabTuning) this.tabTuning.classList.toggle('active', tabId === 'tuning');
        if (this.tabExchange) this.tabExchange.classList.toggle('active', tabId === 'exchange');

        if (this.tabContentTuning) this.tabContentTuning.classList.toggle('active', tabId === 'tuning');
        if (this.tabContentExchange) this.tabContentExchange.classList.toggle('active', tabId === 'exchange');
    }

    switchRightTab(tabId) {
        if (this.tabMetrics) this.tabMetrics.classList.toggle('active', tabId === 'metrics');
        if (this.tabRoadmap) this.tabRoadmap.classList.toggle('active', tabId === 'roadmap');

        if (this.tabContentMetrics) this.tabContentMetrics.classList.toggle('active', tabId === 'metrics');
        if (this.tabContentRoadmap) this.tabContentRoadmap.classList.toggle('active', tabId === 'roadmap');
    }

    switchTab(tabId) {
        if (tabId === 'tuning' || tabId === 'exchange') {
            this.switchLeftTab(tabId);
        } else if (tabId === 'metrics' || tabId === 'roadmap') {
            this.switchRightTab(tabId);
        }
    }

    switchStripTab(tabId) {
        if (this.stripTabClimate) this.stripTabClimate.classList.toggle('active', tabId === 'climate');
        if (this.stripTabAtmosphere) this.stripTabAtmosphere.classList.toggle('active', tabId === 'atmosphere');
        if (this.stripTabPlanet) this.stripTabPlanet.classList.toggle('active', tabId === 'planet');
        if (this.stripContentClimate) this.stripContentClimate.classList.toggle('active', tabId === 'climate');
        if (this.stripContentAtmosphere) this.stripContentAtmosphere.classList.toggle('active', tabId === 'atmosphere');
        if (this.stripContentPlanet) this.stripContentPlanet.classList.toggle('active', tabId === 'planet');
    }

    getApexLifeForm(biology, solvent) {
        if (!biology) return null;
        const nodes = getEvolutionNodes(solvent);
        const unlocked = nodes.filter(node => isNodeUnlocked(biology, node) || getNodeBiomass(biology, node) > 0);
        const apex = unlocked[unlocked.length - 1] || nodes[0];
        if (!apex) return null;

        return {
            name: apex.name,
            details: apex.details?.scientific || apex.details?.desc || 'Evolutionary state is being resolved from the phylogenetic graph.'
        };
    }


    showMilestonePopup(title, desc, scientificDetails = null, rewardTokens = null, warningMeta = null, eventSystem = null) {
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

        // Dynamically set reward text
        if (rewardTokens) {
            if (typeof rewardTokens === 'string') {
                this.popupReward.textContent = `Curator Reward: ${rewardTokens}`;
            } else if (typeof rewardTokens === 'number' && rewardTokens > 0) {
                this.popupReward.textContent = `Curator Reward: +${rewardTokens} Evo-Tokens`;
            } else {
                this.popupReward.textContent = `Curator Reward: ${rewardTokens}`;
            }
            this.popupReward.style.display = 'block';
        } else {
            this.popupReward.style.display = 'none';
        }

        // Handle threat warning configuration
        if (warningMeta) {
            this.popupIcon.textContent = '⚠️';
            this.popupDeflectBtn.style.display = 'block';
            this.activePopupWarningId = warningMeta.id;
            
            const gold = (eventSystem && typeof eventSystem.tokensGold === 'number') ? eventSystem.tokensGold : 0;
            if (gold >= warningMeta.cost) {
                this.popupDeflectBtn.disabled = false;
                this.popupDeflectBtn.textContent = `Deflect [${warningMeta.cost}🛡️]`;
                this.popupDeflectBtn.classList.remove('disabled');
            } else {
                this.popupDeflectBtn.disabled = true;
                this.popupDeflectBtn.textContent = `Deflect [${warningMeta.cost}🛡️] (Need Gold)`;
                this.popupDeflectBtn.classList.add('disabled');
            }
            this.popupDismissBtn.textContent = "Dismiss (Run Simulation)";
        } else {
            this.popupIcon.textContent = '🎉';
            this.popupDeflectBtn.style.display = 'none';
            this.activePopupWarningId = null;
            this.popupDismissBtn.textContent = "Acknowledge";
        }
        
        this.popupOverlay.style.display = 'flex';
    }

    hidePopup() {
        this.popupOverlay.style.display = 'none';
    }

    isPopupVisible() {
        return this.popupOverlay.style.display === 'flex';
    }

    openBiomassModal(nodeId, node, planet, biology) {
        if (!this.biomassModal) return;
        
        // Pause simulation if it is playing
        if (this.handlers && this.handlers.isGamePlaying && this.handlers.isGamePlaying()) {
            this.wasPlayingBeforeBiomassPopup = true;
            if (this.handlers.pauseGame) this.handlers.pauseGame();
        } else {
            this.wasPlayingBeforeBiomassPopup = false;
        }

        this.activeBiomassNodeId = nodeId;

        // Fill in details
        this.biomassModalTitle.textContent = node.name;
        this.biomassModalClade.textContent = `${node.clade} clade`;
        
        const biomass = biology.biomassMap[nodeId] || 0.0;
        let cap = node.cap;
        if (nodeId === 'eukaryotes') {
            cap = biology.unlockedSexualReproduction ? 180 : 120;
        }
        
        this.biomassModalPop.textContent = biomass.toFixed(2);
        this.biomassModalCap.textContent = cap.toFixed(2);
        this.biomassModalUnit.textContent = node.unit;
        this.biomassModalSpecies.textContent = Math.floor(biology.biodiversityMap[nodeId] || 0).toLocaleString();
        
        const rate = biology.popChangeRates[nodeId] || 0.0;
        if (rate > 0.005) {
            this.biomassModalTrend.textContent = `▲ +${rate.toFixed(2)} ${node.unit}/Myr`;
            this.biomassModalTrend.style.color = 'var(--accent-green)';
        } else if (rate < -0.005) {
            this.biomassModalTrend.textContent = `▼ ${rate.toFixed(2)} ${node.unit}/Myr`;
            this.biomassModalTrend.style.color = 'var(--accent-red)';
        } else {
            this.biomassModalTrend.textContent = `■ 0.00 ${node.unit}/Myr`;
            this.biomassModalTrend.style.color = 'var(--text-secondary)';
        }
        
        this.biomassModalDesc.textContent = node.details?.desc || node.desc || '';
        this.biomassModalScientific.textContent = node.details?.scientific || node.scientific || 'Scientific dossier is being compiled...';
        
        // Calculate viability factors
        const factors = biology.getViabilityFactors(nodeId, planet);
        let factorsHTML = "";
        if (factors && factors.length > 0) {
            factors.forEach(factor => {
                const percent = Math.round(factor.value * 100);
                let barColor = "var(--accent-green)";
                if (percent < 30) {
                    barColor = "var(--accent-red)";
                } else if (percent < 70) {
                    barColor = "var(--accent-amber)";
                }
                
                factorsHTML += `
                    <div class="viability-factor-row">
                        <div class="factor-meta">
                            <span class="factor-name">${factor.name}</span>
                            <span class="factor-pct" style="color: ${barColor};">${percent}%</span>
                        </div>
                        <div class="factor-bar-container">
                            <div class="factor-bar-fill" style="width: ${percent}%; background: ${barColor}; box-shadow: 0 0 6px ${barColor}55;"></div>
                        </div>
                        <div class="factor-details">${factor.details}</div>
                    </div>
                `;
            });
        } else {
            factorsHTML = `<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; text-align: left;">No active limiting environmental factors. Growth is unconstrained.</div>`;
        }
        this.biomassModalFactors.innerHTML = factorsHTML;
        this.updateGenotypeSection(nodeId, planet, biology);
        
        this.biomassModal.style.display = 'flex';
    }

    closeBiomassModal() {
        if (!this.biomassModal) return;
        this.biomassModal.style.display = 'none';
        this.activeBiomassNodeId = null;
        
        // Resume simulation if it was playing before
        if (this.wasPlayingBeforeBiomassPopup) {
            if (this.handlers && this.handlers.resumeGame) {
                this.handlers.resumeGame();
            }
            this.wasPlayingBeforeBiomassPopup = false;
        }
    }

    updateGenotypeSection(nodeId, planet, biology) {
        if (!this.biomassModalGenotypeSection || !this.biomassModalGenotype) return;

        const node = EVOLUTION_GRAPH[planet.activeSolvent][nodeId];
        if (!node || !biology.evolutionEngine) {
            this.biomassModalGenotypeSection.style.display = 'none';
            return;
        }

        const genotype = biology.evolutionEngine.getGenotype(nodeId);
        if (!genotype) {
            this.biomassModalGenotypeSection.style.display = 'none';
            return;
        }

        this.biomassModalGenotypeSection.style.display = 'block';

        let genotypeHTML = "";

        // 1. Generation Count Badge / Stat
        const genCount = Math.floor(genotype.generation || 0);
        const evolvability = node.evolvability || 0.1;
        
        genotypeHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; padding: 0.5rem; background: rgba(255, 255, 255, 0.02); border-radius: 6px; font-family: var(--font-mono); font-size: 0.8rem;">
                <div>
                    <span style="color: var(--text-muted);">Generations:</span>
                    <strong style="color: var(--accent-cyan); margin-left: 4px;">${genCount.toLocaleString()}</strong>
                </div>
                <div>
                    <span style="color: var(--text-muted);">Evolvability:</span>
                    <strong style="color: var(--accent-purple); margin-left: 4px;">${(evolvability * 100).toFixed(0)}%</strong>
                </div>
            </div>
        `;

        // 2. Optimal Temperature Drift
        if (genotype.optimalTemp !== null) {
            const currentOpt = genotype.optimalTemp;
            const baseOpt = genotype.baseOptimalTemp !== null ? genotype.baseOptimalTemp : currentOpt;
            const minCap = node.minThermalCap !== undefined ? node.minThermalCap : 0.0;
            const maxCap = node.thermalCap !== undefined ? node.thermalCap : 50.0;

            const tempSpan = maxCap - minCap;
            let tempPercent = 50;
            if (tempSpan > 0) {
                tempPercent = Math.max(0, Math.min(100, ((currentOpt - minCap) / tempSpan) * 100));
            }
            
            // Format labels nicely
            const unit = planet.activeSolvent === 'water' ? '°C' : (planet.activeSolvent === 'ammonia' ? '°C (Ammonic)' : '°C (Methane)');

            genotypeHTML += `
                <div class="viability-factor-row">
                    <div class="factor-meta">
                        <span class="factor-name">Optimal Temp Adaptation</span>
                        <span class="factor-pct" style="color: var(--accent-cyan);">${currentOpt.toFixed(1)}${unit}</span>
                    </div>
                    <div class="factor-bar-container" style="position: relative; height: 8px; border-radius: 4px; overflow: visible; background: rgba(255, 255, 255, 0.08);">
                        <!-- Base marker -->
                        ${tempSpan > 0 && baseOpt >= minCap && baseOpt <= maxCap ? `
                            <div style="position: absolute; left: ${((baseOpt - minCap) / tempSpan * 100).toFixed(1)}%; top: -3px; width: 2px; height: 14px; background: var(--text-muted); z-index: 2;" title="Ancestral Base: ${baseOpt.toFixed(1)}${unit}"></div>
                        ` : ''}
                        <!-- Current planet temp indicator dot -->
                        ${tempSpan > 0 && planet.temperature >= minCap && planet.temperature <= maxCap ? `
                            <div style="position: absolute; left: ${((planet.temperature - minCap) / tempSpan * 100).toFixed(1)}%; top: -4px; width: 6px; height: 16px; background: var(--accent-amber); border-radius: 3px; z-index: 3; box-shadow: 0 0 6px var(--accent-amber);" title="Current Planet Temp: ${planet.temperature.toFixed(1)}${unit}"></div>
                        ` : ''}
                        <!-- Range filled up to current opt -->
                        <div class="factor-bar-fill" style="width: ${tempPercent}%; background: linear-gradient(90deg, #3b82f6, #38bdf8); box-shadow: 0 0 6px rgba(56, 189, 248, 0.4); height: 100%; border-radius: 4px;"></div>
                    </div>
                    <div class="factor-details" style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-top: 0.1rem;">
                        <span>Min Cap: ${minCap.toFixed(1)}${unit}</span>
                        <span>Ancestral Base: ${baseOpt.toFixed(1)}${unit}</span>
                        <span>Max Cap: ${maxCap.toFixed(1)}${unit}</span>
                    </div>
                </div>
            `;
        }

        // 3. Radiation Resilience
        if (node.radiationToleranceCap !== undefined) {
            const currentRes = genotype.radiationResilience || 0.1;
            const maxCap = node.radiationToleranceCap;
            
            let resPercent = 0;
            if (maxCap > 0) {
                resPercent = Math.max(0, Math.min(100, (currentRes / maxCap) * 100));
            }

            genotypeHTML += `
                <div class="viability-factor-row" style="margin-top: 0.5rem;">
                    <div class="factor-meta">
                        <span class="factor-name">Radiation Shielding</span>
                        <span class="factor-pct" style="color: var(--accent-green);">${(currentRes * 100).toFixed(0)}%</span>
                    </div>
                    <div class="factor-bar-container" style="position: relative; height: 8px; border-radius: 4px; overflow: visible; background: rgba(255, 255, 255, 0.08);">
                        <!-- Base marker (10%) -->
                        ${maxCap > 0.1 ? `
                            <div style="position: absolute; left: ${(0.1 / maxCap * 100).toFixed(1)}%; top: -3px; width: 2px; height: 14px; background: var(--text-muted); z-index: 2;" title="Base Resilience: 10%"></div>
                        ` : ''}
                        <div class="factor-bar-fill" style="width: ${resPercent}%; background: linear-gradient(90deg, #10b981, #34d399); box-shadow: 0 0 6px rgba(52, 211, 153, 0.4); height: 100%; border-radius: 4px;"></div>
                    </div>
                    <div class="factor-details" style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-top: 0.1rem;">
                        <span>Base: 10%</span>
                        <span>Limit Cap: ${(maxCap * 100).toFixed(0)}%</span>
                    </div>
                </div>
            `;
        }

        // 4. Resource Efficiency
        const currentEff = genotype.resourceEfficiency || 1.0;
        const maxEff = 2.0;
        const baseEff = 1.0;
        let effPercent = Math.max(0, Math.min(100, ((currentEff - baseEff) / (maxEff - baseEff)) * 100));

        genotypeHTML += `
            <div class="viability-factor-row" style="margin-top: 0.5rem;">
                <div class="factor-meta">
                    <span class="factor-name">Resource Efficiency</span>
                    <span class="factor-pct" style="color: var(--accent-purple);">${currentEff.toFixed(2)}x</span>
                </div>
                <div class="factor-bar-container" style="position: relative; height: 8px; border-radius: 4px; overflow: visible; background: rgba(255, 255, 255, 0.08);">
                    <div class="factor-bar-fill" style="width: ${effPercent}%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); box-shadow: 0 0 6px rgba(167, 139, 250, 0.4); height: 100%; border-radius: 4px;"></div>
                </div>
                <div class="factor-details" style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-top: 0.1rem;">
                    <span>Base: 1.00x</span>
                    <span>Max Limit: 2.00x</span>
                </div>
            </div>
        `;

        this.biomassModalGenotype.innerHTML = genotypeHTML;
    }

    updateSpeedControls(userSpeed, activeSpeed, hasWarnings) {
        const speedBtns = document.querySelectorAll('.speed-btn');
        speedBtns.forEach(btn => {
            const speed = parseInt(btn.getAttribute('data-speed'), 10);
            
            // Highlight user selected speed
            if (speed === userSpeed) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            
            // Lock/disable higher speed controls during active warning crises
            if (hasWarnings && speed > 1) {
                btn.disabled = true;
                btn.classList.add('disabled');
                btn.title = "Restricted to 1x speed during active planetary threats";
            } else {
                btn.disabled = false;
                btn.classList.remove('disabled');
                btn.removeAttribute('title');
            }
        });
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

        // Load configuration from setup modal
        this.setupLoadBtn.addEventListener('click', () => {
            handlers.onLoadState();
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

        // Cladogram Popup Modal triggers
        const btnOpenCladogram = document.getElementById('btn-open-cladogram');
        const cladogramModal = document.getElementById('cladogram-modal');
        const cladogramCloseBtn = document.getElementById('cladogram-close-btn');

        if (btnOpenCladogram && cladogramModal) {
            btnOpenCladogram.addEventListener('click', () => {
                if (this.currentPlanet && this.currentBiology) {
                    cladogramModal.style.display = 'flex';
                    this.drawCladogramSVG(this.currentPlanet, this.currentBiology, handlers);
                }
            });
        }

        if (cladogramCloseBtn && cladogramModal) {
            cladogramCloseBtn.addEventListener('click', () => {
                cladogramModal.style.display = 'none';
            });
        }

        // Delegate threat deflection click
        this.threatList.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-deflect');
            if (btn) {
                const threatId = btn.getAttribute('data-id');
                handlers.onDeflectThreat(threatId);
            }
        });

        // Close popup listeners
        this.popupCloseBtn.addEventListener('click', () => {
            this.hidePopup();
            if (handlers.onPopupClose) handlers.onPopupClose();
        });
        this.popupDismissBtn.addEventListener('click', () => {
            this.hidePopup();
            if (handlers.onPopupClose) handlers.onPopupClose();
        });

        // Popup deflect button click listener
        this.popupDeflectBtn.addEventListener('click', () => {
            if (this.activePopupWarningId) {
                handlers.onDeflectThreat(this.activePopupWarningId);
                this.hidePopup();
                if (handlers.onPopupClose) handlers.onPopupClose();
            }
        });

        // Biomass Details Modal close listeners
        if (this.biomassCloseBtn) {
            this.biomassCloseBtn.addEventListener('click', () => this.closeBiomassModal());
        }
        if (this.biomassModal) {
            this.biomassModal.addEventListener('click', (e) => {
                if (e.target === this.biomassModal) {
                    this.closeBiomassModal();
                }
            });
        }
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.biomassModal && this.biomassModal.style.display === 'flex') {
                    this.closeBiomassModal();
                }
            }
        });

        // Bind speed selection controls
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const speed = parseInt(btn.getAttribute('data-speed'), 10);
                if (handlers.onChangeSpeed) {
                    handlers.onChangeSpeed(speed);
                }
            });
        });

        // Bind biological adaptation tuning button clicks
        const handleUpgrade = (traitType) => {
            if (handlers.onUpgradeTrait) {
                const res = handlers.onUpgradeTrait(traitType);
                if (res.success) {
                    this.logEvent("GENETIC UPGRADE", res.msg, "success");
                    this.showToast(res.msg, "success");
                } else {
                    this.logEvent("UPGRADE DENIED", res.msg, "hazard");
                    this.showToast(res.msg, "hazard");
                }
            }
        };

        this.btnUpgradeThermal.addEventListener('click', () => handleUpgrade('thermal'));
        this.btnUpgradeRadiation.addEventListener('click', () => handleUpgrade('radiation'));
        this.btnUpgradeMetabolic.addEventListener('click', () => handleUpgrade('metabolic'));

        if (this.btnConvertBlueSilver) {
            this.btnConvertBlueSilver.addEventListener('click', () => {
                if (handlers.onConvertTokens) {
                    const res = handlers.onConvertTokens('blue_silver');
                    if (res.success) {
                        this.showToast(res.msg, "success");
                    } else {
                        this.showToast(res.msg, "hazard");
                    }
                }
            });
        }
        if (this.btnConvertSilverGold) {
            this.btnConvertSilverGold.addEventListener('click', () => {
                if (handlers.onConvertTokens) {
                    const res = handlers.onConvertTokens('silver_gold');
                    if (res.success) {
                        this.showToast(res.msg, "success");
                    } else {
                        this.showToast(res.msg, "hazard");
                    }
                }
            });
        }

        this._createDebugPanel(handlers);
    }

    /**
     * Add entry to scientific feed console
     */
    logEvent(title, desc, type = 'system', meta = null, timestamp = null) {
        this._logView.logEvent(title, desc, type, meta, timestamp);
    }

    /**
     * Clear all entries from the scientific feed console
     */
    clearLog() {
        this._logView.clearLog();
    }

    /**
     * Build and attach the hidden developer debug panel.
     * Activated by ?debug=1 in the URL or Ctrl+Shift+D.
     */
    _createDebugPanel(handlers) {
        if (!document.body) return;
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style.cssText = `
            position:fixed;top:10px;right:10px;z-index:99999;
            background:rgba(10,10,20,0.97);border:1px solid rgba(250,204,21,0.6);
            border-radius:8px;padding:14px 16px;min-width:260px;
            font-family:var(--font-mono,monospace);font-size:0.78rem;color:#facc15;
            display:none;flex-direction:column;gap:10px;
        `;
        panel.innerHTML = `
            <div style="font-weight:700;letter-spacing:0.08em;border-bottom:1px solid rgba(250,204,21,0.3);padding-bottom:6px;">
                ⚙ DEBUG PANEL <span style="font-weight:400;color:rgba(255,255,255,0.4);font-size:0.72rem;">(Ctrl+Shift+D)</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <input id="dbg-seed" type="number" placeholder="Seed" style="width:90px;background:#111;border:1px solid #444;color:#fff;padding:3px 6px;border-radius:4px;font-size:0.78rem;">
                <button id="dbg-set-seed" style="flex:1;background:#1e293b;border:1px solid #facc15;color:#facc15;padding:3px 8px;border-radius:4px;cursor:pointer;">Set Seed</button>
                <button id="dbg-clear-seed" style="flex:1;background:#1e293b;border:1px solid #888;color:#aaa;padding:3px 8px;border-radius:4px;cursor:pointer;">Clear</button>
            </div>
            <button id="dbg-add-tokens" style="background:#1e293b;border:1px solid #38bdf8;color:#38bdf8;padding:4px 8px;border-radius:4px;cursor:pointer;">+100 Blue  +10 Silver  +1 Gold</button>
            <div style="display:flex;gap:6px;align-items:center;">
                <select id="dbg-node-select" style="flex:1;background:#111;border:1px solid #444;color:#fff;padding:3px 6px;border-radius:4px;font-size:0.75rem;"></select>
                <button id="dbg-unlock-node" style="background:#1e293b;border:1px solid #4ade80;color:#4ade80;padding:3px 8px;border-radius:4px;cursor:pointer;">Unlock</button>
            </div>
            <button id="dbg-advance-time" style="background:#1e293b;border:1px solid #c084fc;color:#c084fc;padding:4px 8px;border-radius:4px;cursor:pointer;">Advance Time +100 Myr</button>
        `;
        document.body.appendChild(panel);

        // Populate node select from graph
        const nodeSelect = panel.querySelector('#dbg-node-select');
        for (const solvent in EVOLUTION_GRAPH) {
            for (const nodeId in EVOLUTION_GRAPH[solvent]) {
                const opt = document.createElement('option');
                opt.value = nodeId;
                opt.textContent = `[${solvent}] ${nodeId}`;
                nodeSelect.appendChild(opt);
            }
        }

        // Wire controls
        panel.querySelector('#dbg-set-seed').addEventListener('click', () => {
            const seed = parseInt(panel.querySelector('#dbg-seed').value);
            if (!isNaN(seed) && handlers.onDebugSetSeed) handlers.onDebugSetSeed(seed);
        });
        panel.querySelector('#dbg-clear-seed').addEventListener('click', () => {
            panel.querySelector('#dbg-seed').value = '';
            if (handlers.onDebugClearSeed) handlers.onDebugClearSeed();
        });
        panel.querySelector('#dbg-add-tokens').addEventListener('click', () => {
            if (handlers.onDebugAddTokens) handlers.onDebugAddTokens(100, 10, 1);
        });
        panel.querySelector('#dbg-unlock-node').addEventListener('click', () => {
            const id = nodeSelect.value;
            if (id && handlers.onDebugUnlockNode) handlers.onDebugUnlockNode(id);
        });
        panel.querySelector('#dbg-advance-time').addEventListener('click', () => {
            if (handlers.onDebugAdvanceTime) handlers.onDebugAdvanceTime(100);
        });

        // Show/hide logic
        const show = () => { panel.style.display = 'flex'; };
        const hide = () => { panel.style.display = 'none'; };
        const toggle = () => { panel.style.display === 'none' ? show() : hide(); };

        if (new URLSearchParams(window.location.search).get('debug') === '1') show();
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') { e.preventDefault(); toggle(); }
        });
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
     * Synchronize sliders back to planet values, and update all gauge visualizations
     */
    syncSliders(planet) {
        // Keep hidden sliders in sync for any code that reads .value
        this.tempSlider.value = Math.round(planet.temperature);
        this.waterSlider.value = Math.round(planet.getSolventCoverage());
        const currentRad = planet.radiation;
        const effectiveRad = planet.getEffectiveRadiation();
        this.radSlider.value = currentRad.toFixed(1);

        // Update hidden legacy spans (backwards compat)
        this.tempVal.textContent = `${this.tempSlider.value}°C`;
        this.waterVal.textContent = `${this.waterSlider.value}%`;
        this.radVal.textContent = `Space: ${currentRad.toFixed(1)}`;
        if (this.radEffectiveVal) {
            this.radEffectiveVal.textContent = `Surf: ${effectiveRad.toFixed(1)} rad/s`;
        }

        // ── Temperature Gauge ──────────────────────────────────────────────
        const temp = planet.temperature;
        // Range: -200 to +150 = 350 total
        const tempPct = Math.max(0, Math.min(100, ((temp - (-200)) / 350) * 100));
        if (this.gaugeTempFill) this.gaugeTempFill.style.width = `${tempPct}%`;
        if (this.gaugeTempThumb) this.gaugeTempThumb.style.left = `${tempPct}%`;
        if (this.gaugeTempVal) this.gaugeTempVal.textContent = `${temp.toFixed(1)}°C`;

        // Set habitable zone band and label based on solvent
        if (this.gaugeTempZone && this.gaugeTempZoneLabel) {
            let zoneLeft, zoneWidth, zoneLabel;
            if (planet.activeSolvent === 'water') {
                // Water: 0–100°C out of -200–150 range
                zoneLeft = ((0 - (-200)) / 350) * 100;      // ~57.1%
                zoneWidth = (100 / 350) * 100;               // ~28.6%
                zoneLabel = '— Water Zone (0–100°C) —';
            } else if (planet.activeSolvent === 'ammonia') {
                // Ammonia: -78 to -33°C
                zoneLeft = ((-78 - (-200)) / 350) * 100;    // ~34.9%
                zoneWidth = (45 / 350) * 100;                // ~12.9%
                zoneLabel = '— Ammonia Zone (-78 to -33°C) —';
            } else {
                // Methane: -183 to -130°C
                zoneLeft = ((-183 - (-200)) / 350) * 100;   // ~4.9%
                zoneWidth = (53 / 350) * 100;                // ~15.1%
                zoneLabel = '— Methane Zone (-183 to -130°C) —';
            }
            this.gaugeTempZone.style.left = `${zoneLeft}%`;
            this.gaugeTempZone.style.width = `${zoneWidth}%`;
            this.gaugeTempZoneLabel.textContent = zoneLabel;
        }

        // Color the thumb based on whether temp is inside habitable zone
        if (this.gaugeTempThumb) {
            const inZone = (planet.activeSolvent === 'water' && temp >= 0 && temp <= 100) ||
                           (planet.activeSolvent === 'ammonia' && temp >= -78 && temp <= -33) ||
                           (planet.activeSolvent === 'methane' && temp >= -183 && temp <= -130);
            this.gaugeTempThumb.style.background = inZone ? 'var(--accent-green)' : 'var(--accent-red)';
            this.gaugeTempThumb.style.boxShadow = inZone
                ? '0 0 6px rgba(16,185,129,0.8)'
                : '0 0 6px rgba(239,68,68,0.8)';
        }

        // ── Solvent Coverage Gauge ─────────────────────────────────────────
        const water = planet.getSolventCoverage();
        const waterPct = Math.max(0, Math.min(100, water));
        if (this.gaugeWaterFill) this.gaugeWaterFill.style.width = `${waterPct}%`;
        if (this.gaugeWaterThumb) this.gaugeWaterThumb.style.left = `${waterPct}%`;
        if (this.gaugeWaterVal) this.gaugeWaterVal.textContent = `${waterPct.toFixed(0)}%`;

        const inWaterZone = water >= 10 && water <= 90;
        if (this.gaugeWaterThumb) {
            this.gaugeWaterThumb.style.background = inWaterZone ? 'var(--accent-green)' : 'var(--accent-amber)';
            this.gaugeWaterThumb.style.boxShadow = inWaterZone
                ? '0 0 6px rgba(16,185,129,0.8)'
                : '0 0 6px rgba(245,158,11,0.8)';
        }

        // Update solvent icons & labels
        let solventIcon = '💧', solventLabelText = 'WATER';
        if (planet.activeSolvent === 'ammonia') {
            solventIcon = '❄️'; solventLabelText = 'AMMONIA';
        } else if (planet.activeSolvent === 'methane') {
            solventIcon = '🍊'; solventLabelText = 'METHANE';
        }
        if (this.solventIcon) this.solventIcon.textContent = solventIcon;
        if (this.solventLabel) this.solventLabel.textContent = solventLabelText;
        if (this.gaugeSolventIcon) this.gaugeSolventIcon.textContent = solventIcon;
        if (this.gaugeSolventLabel) this.gaugeSolventLabel.textContent = solventLabelText;

        // ── Radiation Gauge ────────────────────────────────────────────────
        // Range: 0 to 10
        const radPct = Math.max(0, Math.min(100, (currentRad / 10) * 100));
        if (this.gaugeRadFill) this.gaugeRadFill.style.width = `${radPct}%`;
        if (this.gaugeRadThumb) this.gaugeRadThumb.style.left = `${radPct}%`;
        if (this.gaugeRadSpaceVal) this.gaugeRadSpaceVal.textContent = `Space: ${currentRad.toFixed(1)}`;
        if (this.gaugeRadSurfVal) {
            this.gaugeRadSurfVal.textContent = `Surf: ${effectiveRad.toFixed(1)} rad/s`;
            if (effectiveRad > 4.0) {
                this.gaugeRadSurfVal.style.color = 'var(--accent-red)';
                this.gaugeRadSurfVal.style.background = 'rgba(239,68,68,0.1)';
            } else if (effectiveRad > 1.5) {
                this.gaugeRadSurfVal.style.color = 'var(--accent-amber)';
                this.gaugeRadSurfVal.style.background = 'rgba(245,158,11,0.1)';
            } else {
                this.gaugeRadSurfVal.style.color = 'var(--accent-green)';
                this.gaugeRadSurfVal.style.background = 'rgba(16,185,129,0.1)';
            }
        }
        const radSafe = effectiveRad <= 2.5;
        if (this.gaugeRadThumb) {
            this.gaugeRadThumb.style.background = radSafe ? 'var(--accent-green)' : 'var(--accent-red)';
            this.gaugeRadThumb.style.boxShadow = radSafe
                ? '0 0 6px rgba(16,185,129,0.8)'
                : '0 0 6px rgba(239,68,68,0.8)';
        }

        // ── Climate Pills (left panel compact readout) ─────────────────────
        if (this.pillTempVal) {
            this.pillTempVal.textContent = `${temp.toFixed(1)}°C`;
            const inTempZone = (planet.activeSolvent === 'water' && temp >= 0 && temp <= 100) ||
                               (planet.activeSolvent === 'ammonia' && temp >= -78 && temp <= -33) ||
                               (planet.activeSolvent === 'methane' && temp >= -183 && temp <= -130);
            this.pillTemp.className = 'climate-pill ' + (inTempZone ? 'in-zone' : 'out-zone');
        }
        if (this.pillWaterVal) {
            this.pillWaterVal.textContent = `${waterPct.toFixed(0)}%`;
            const wZone = inWaterZone ? 'in-zone' : (waterPct < 5 || waterPct > 95 ? 'out-zone' : 'marginal-zone');
            this.pillWater.className = 'climate-pill ' + wZone;
            if (this.pillSolventIcon) this.pillSolventIcon.textContent = solventIcon;
        }
        if (this.pillRadVal) {
            this.pillRadVal.textContent = `${currentRad.toFixed(1)} / ${effectiveRad.toFixed(1)}`;
            this.pillRad.className = 'climate-pill ' + (radSafe ? 'in-zone' : (effectiveRad > 4.0 ? 'out-zone' : 'marginal-zone'));
        }
    }

    /**
     * Render active threats/warnings list in threat control panel
     */
    updateThreats(warnings, eventSystem = null, biology = null, planet = null) {
        const cards = this.threatList.querySelectorAll('.threat-card');
        const cardIds = Array.from(cards).map(card => {
            const btn = card.querySelector('.btn-deflect');
            return btn ? btn.getAttribute('data-id') : null;
        });
        const warningIds = warnings.map(w => w.id);

        const hasChanged = cardIds.length !== warningIds.length || 
                           cardIds.some((id, idx) => id !== warningIds[idx]) ||
                           this.threatList.querySelector('.no-threats-msg') ||
                           this.threatList.querySelector('.intel-card');

        const gold = (eventSystem && typeof eventSystem.tokensGold === 'number') ? eventSystem.tokensGold : 0;

        if (warnings.length === 0) {
            const solvent = planet ? planet.activeSolvent : 'water';
            const apex = this.getApexLifeForm(biology, solvent);
            const currentSubjectEl = this.threatList.querySelector('.intel-subject');
            const currentSubject = currentSubjectEl ? currentSubjectEl.textContent : '';
            if (!currentSubjectEl || (apex && apex.name !== currentSubject)) {
                this.threatList.innerHTML = apex ? `
                    <div class="intel-card">
                        <div class="intel-header">
                            <span class="intel-title">🧬 BIOSPHERE INTEL</span>
                            <span class="intel-subtitle">Current Apex Life</span>
                        </div>
                        <div class="intel-subject">${apex.name}</div>
                        <div class="intel-body">${apex.details}</div>
                    </div>
                ` : '<div class="no-threats-msg">No active threats detected.</div>';
            }
            return;
        }

        if (hasChanged) {
            this.threatList.innerHTML = '';

            warnings.forEach(threat => {
                const row = document.createElement('div');
                row.className = `threat-card ${threat.type}`;
                const canAfford = gold >= threat.cost;
                row.innerHTML = `
                    <div class="threat-header">
                        <span class="threat-title">⚠️ ${threat.name}</span>
                        <span class="threat-timer">${threat.durationRemaining.toFixed(1)} Myr</span>
                    </div>
                    <div class="threat-desc">${threat.description}</div>
                    <button class="btn btn-warning btn-deflect${canAfford ? '' : ' disabled'}" data-id="${threat.id}"${canAfford ? '' : ' disabled'}>
                        Deflect [${threat.cost}🛡️]${canAfford ? '' : ' (Need Gold)'}
                    </button>
                `;
                this.threatList.appendChild(row);
            });
        } else {
            // Update timers and button states in place to prevent button recreation from breaking click events
            cards.forEach((card, idx) => {
                const threat = warnings[idx];
                const timerSpan = card.querySelector('.threat-timer');
                if (timerSpan) {
                    const newText = `${threat.durationRemaining.toFixed(1)} Myr`;
                    if (timerSpan.textContent !== newText) {
                        timerSpan.textContent = newText;
                    }
                }
                const btn = card.querySelector('.btn-deflect');
                if (btn) {
                    const canAfford = gold >= threat.cost;
                    if (canAfford) {
                        btn.disabled = false;
                        btn.classList.remove('disabled');
                        btn.textContent = `Deflect [${threat.cost}🛡️]`;
                    } else {
                        btn.disabled = true;
                        btn.classList.add('disabled');
                        btn.textContent = `Deflect [${threat.cost}🛡️] (Need Gold)`;
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
        const graphNodes = EVOLUTION_GRAPH[solvent] || {};
        for (const id in graphNodes) {
            const graphNode = graphNodes[id];
            
            // Format requirements text
            let reqText = '';
            if (graphNode.reqs) {
                const parts = [];
                if (graphNode.reqs.waterCoverage) parts.push(`Water > ${graphNode.reqs.waterCoverage}%`);
                if (graphNode.reqs.ammoniaCoverage) parts.push(`Ammonia > ${graphNode.reqs.ammoniaCoverage}%`);
                if (graphNode.reqs.methaneCoverage) parts.push(`Methane > ${graphNode.reqs.methaneCoverage}%`);
                if (graphNode.reqs.tempRange) parts.push(`Temp ${graphNode.reqs.tempRange[0]} to ${graphNode.reqs.tempRange[1]}°C`);
                if (graphNode.reqs.minTemp) parts.push(`Temp >= ${graphNode.reqs.minTemp}°C`);
                if (graphNode.reqs.maxTemp) parts.push(`Temp <= ${graphNode.reqs.maxTemp}°C`);
                if (graphNode.reqs.minO2) parts.push(`O₂ >= ${graphNode.reqs.minO2}%`);
                if (graphNode.reqs.ozone) parts.push(`Ozone >= ${(graphNode.reqs.ozone * 100).toFixed(0)}%`);
                if (graphNode.reqs.magnetosphere) parts.push('Magnetosphere');
                if (graphNode.reqs.solarRadiance) parts.push(`Solar Rad >= ${graphNode.reqs.solarRadiance}`);
                if (graphNode.reqs.oecGate) parts.push('OEC Stability');
                
                if (graphNode.reqs.popThreshold) {
                    for (const [pId, val] of Object.entries(graphNode.reqs.popThreshold)) {
                        const parentNode = graphNodes[pId];
                        parts.push(`${parentNode ? parentNode.name : pId} > ${val}`);
                    }
                }
                if (graphNode.reqs.synapsidOrSauropsidThreshold) parts.push(`Synapsids/Sauropsids >= ${graphNode.reqs.synapsidOrSauropsidThreshold}`);
                if (graphNode.reqs.aiOrCyborgThreshold) parts.push(`AI/Cyborg >= ${graphNode.reqs.aiOrCyborgThreshold}`);
                if (graphNode.reqs.cyborgOrMossesThreshold) parts.push('Cyborg > 45 OR Mosses > 60');
                
                reqText = parts.join(', ');
            }
            if (!reqText) reqText = 'None';
            
            let popVal = getNodeBiomass(biology, graphNode);
            let capVal = graphNode.cap || 100.0;
            if (id === 'eukaryotes') {
                capVal = biology.unlockedSexualReproduction ? 180.0 : 120.0;
            }

            nodes.push({
                id: id,
                name: graphNode.name,
                pop: popVal,
                cap: capVal,
                unit: graphNode.unit || 'Idx',
                req: reqText,
                nudgeId: graphNode.nudge ? graphNode.nudge.id : null,
                nudgeName: graphNode.nudge ? graphNode.nudge.name : '',
                cost: graphNode.nudge ? graphNode.nudge.cost : 0,
                isDeadEnd: graphNode.isDeadEnd
            });
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
        
        let comparisonHTML = "";
        const earthAge = getEvolutionNode(node.id)?.earthAge ?? null;

        if (earthAge !== null) {
            let unlockAge = biology.unlockAges ? biology.unlockAges[node.id] : null;

            if (unlockAge !== undefined && unlockAge !== null) {
                const diff = earthAge - unlockAge;
                if (Math.abs(diff) < 15.0) {
                    comparisonHTML = `
                        <div class="earth-comparison simultaneous">
                            🌍 <strong>Earth Pacing Match</strong>: Unlocked at <strong>${unlockAge.toFixed(1)} Myr</strong> (simultaneous with Earth's equivalent at ${earthAge} Myr).
                        </div>
                    `;
                } else if (diff > 0) {
                    comparisonHTML = `
                        <div class="earth-comparison earlier">
                            🌍 <strong>Earth Pacing</strong>: Unlocked at <strong>${unlockAge.toFixed(1)} Myr</strong> (evolved <span style="color: var(--accent-cyan); font-weight: bold;">${diff.toFixed(1)} Myr EARLIER</span> than Earth's equivalent at ${earthAge} Myr).
                        </div>
                    `;
                } else {
                    comparisonHTML = `
                        <div class="earth-comparison later">
                            🌍 <strong>Earth Pacing</strong>: Unlocked at <strong>${unlockAge.toFixed(1)} Myr</strong> (evolved <span style="color: var(--accent-amber); font-weight: bold;">${Math.abs(diff).toFixed(1)} Myr LATER</span> than Earth's equivalent at ${earthAge} Myr).
                        </div>
                    `;
                }
            } else {
                comparisonHTML = `
                    <div class="earth-comparison pending">
                        🌍 <strong>Earth Pacing Target</strong>: Typically reached at <strong>${earthAge} Myr</strong> on Earth (not yet reached on this planet).
                    </div>
                `;
            }
        }

        const speciesCount = biology.biodiversityMap[node.id] || 0;
        
        this.nodeDetailsText.innerHTML = `
            <strong>Milestone Requirements:</strong> ${node.req}<br>
            <strong>Current Population/Biomass:</strong> ${node.pop.toFixed(2)} / ${node.cap.toFixed(0)} ${node.unit}<br>
            <strong>Active Species Count:</strong> <span style="color: var(--accent-cyan); font-weight: bold;">${Math.floor(speciesCount).toLocaleString()}</span> species<br>
            ${node.isDeadEnd ? '<span style="color: #ef4444; font-weight: bold;">⚠️ Evolutionary Dead-End Trap: Capped at 100 species.</span><br>' : ''}
            ${node.nudgeId ? `<strong>Gene Upgrade Nudge:</strong> ${node.nudgeName} (Allows unlocking or speeds up development).` : 'No manual gene upgrades for this branch.'}
            <div style="margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                ${comparisonHTML}
            </div>
        `;

        const mutagen = (this.currentEventSystem && typeof this.currentEventSystem.tokensBlue === 'number') ? this.currentEventSystem.tokensBlue : 0;
        
        // Nudge boost check
        const hasBoost = biology.pendingNudges[node.id] || (node.nudgeId && biology.pendingNudges[node.nudgeId]);
        const remaining = hasBoost ? (biology.pendingNudges[node.id]?.remainingMyr || biology.pendingNudges[node.nudgeId]?.remainingMyr || 0.0) : 0.0;

        if (node.nudgeId) {
            this.btnNudgeEvolution.style.display = 'block';
            
            if (hasBoost) {
                this.btnNudgeEvolution.textContent = `⚡ BOOST ACTIVE (${remaining.toFixed(1)} Myr)`;
                this.btnNudgeEvolution.disabled = true;
                this.btnNudgeEvolution.classList.remove('disabled');
            } else {
                const isUnlocked = biology.unlockedMap[node.id];
                const cost = node.cost;
                const canAfford = mutagen >= cost;
                this.btnNudgeEvolution.disabled = !canAfford;
                this.btnNudgeEvolution.classList.toggle('disabled', !canAfford);
                
                if (isUnlocked) {
                    this.btnNudgeEvolution.textContent = `🚀 Boost Speciation [${cost}🔹]`;
                } else {
                    this.btnNudgeEvolution.textContent = `🧬 Nudge Adaptation [${cost}🔹]`;
                }
            }
            this.btnNudgeEvolution.setAttribute('data-nudge', node.id); 
            this.btnNudgeEvolution.setAttribute('data-cost', node.cost);
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
        if (this.currentEventSystem) {
            if (this.tokenBalanceBlue) this.tokenBalanceBlue.textContent = Math.floor(this.currentEventSystem.tokensBlue);
            if (this.tokenBalanceSilver) this.tokenBalanceSilver.textContent = Math.floor(this.currentEventSystem.tokensSilver);
            if (this.tokenBalanceGold) this.tokenBalanceGold.textContent = Math.floor(this.currentEventSystem.tokensGold);
        }
        
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

        const hasSentient = getEvolutionNodes(planet.activeSolvent).some(node => (
            (node.clade === 'Intelligence' || node.clade === 'Technological') &&
            (isNodeUnlocked(biology, node) || getNodeBiomass(biology, node) > 0.0)
        ));
        this.bioLegend5.style.display = hasSentient ? 'inline-flex' : 'none';
        
        // Shield, Ozone, Star, and Moon telemetry — sync left panel cards + strip Planet Info tab
        const shieldText = `${planet.magneticStrength.toFixed(0)}%`;
        const ozoneText = `${(planet.ozone * 100).toFixed(0)}%`;
        const starText = `${planet.starLuminosity.toFixed(2)}x`;
        this.magnetShield.textContent = shieldText;
        this.ozoneLayer.textContent = ozoneText;
        this.starLuminosity.textContent = starText;
        if (this.stripMagnetShield) this.stripMagnetShield.textContent = shieldText;
        if (this.stripOzoneLayer) this.stripOzoneLayer.textContent = ozoneText;
        if (this.stripStarLuminosity) this.stripStarLuminosity.textContent = starText;
        this.moonIndicator.style.display = planet.hasMoon ? 'flex' : 'none';


        // Update atmospheric graph bars
        this.barCo2.style.width = `${planet.co2}%`;
        this.gasCo2Val.textContent = `${planet.co2.toFixed(1)}%`;
        this.barN2.style.width = `${planet.n2}%`;
        this.gasN2Val.textContent = `${planet.n2.toFixed(1)}%`;
        this.barO2.style.width = `${planet.o2}%`;
        this.gasO2Val.textContent = `${planet.o2.toFixed(1)}%`;

        // Show/hide metric group categories based on active solvent
        if (this.waterMetrics) this.waterMetrics.style.display = planet.activeSolvent === 'water' ? 'block' : 'none';
        if (this.ammoniaMetrics) this.ammoniaMetrics.style.display = planet.activeSolvent === 'ammonia' ? 'block' : 'none';
        if (this.methaneMetrics) this.methaneMetrics.style.display = planet.activeSolvent === 'methane' ? 'block' : 'none';

        // Hide all cards of other solvents
        for (const solvent in EVOLUTION_GRAPH) {
            if (solvent !== planet.activeSolvent) {
                for (const nodeId in EVOLUTION_GRAPH[solvent]) {
                    const card = document.getElementById(`${nodeId}-card`);
                    if (card) card.style.display = 'none';
                }
            }
        }

        // Update cards of the active solvent dynamically
        const activeNodes = EVOLUTION_GRAPH[planet.activeSolvent];
        for (const nodeId in activeNodes) {
            const node = activeNodes[nodeId];

            // Skip evolutionary advances — only show actual biomass populations
            if (node.monitorable === false) {
                const existingCard = document.getElementById(`${nodeId}-card`);
                if (existingCard) existingCard.style.display = 'none';
                continue;
            }

            const isUnlocked = biology.unlockedMap[nodeId];
            const biomass = biology.biomassMap[nodeId] || 0.0;
            const speciesCount = biology.biodiversityMap[nodeId] || 0;
            
            // Get or create card element
            let card = document.getElementById(`${nodeId}-card`);
            if (!card) {
                const parentContainer = document.getElementById(`${planet.activeSolvent}-metrics`);
                if (parentContainer) {
                    card = document.createElement('div');
                    card.className = 'metric-card';
                    card.id = `${nodeId}-card`;
                    card.innerHTML = `
                        <div class="metric-header">
                            <span class="metric-name">${node.name}</span>
                            <span class="metric-value" id="${nodeId}-density">0.00 ${node.unit}</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar ${node.clade.toLowerCase()}" id="${nodeId}-progress" style="width: 0%"></div>
                        </div>
                        <div class="metric-species-row" id="${nodeId}-species-row">
                            <span class="boost-indicator" id="${nodeId}-boost-indicator">⚡ BOOSTED</span>
                            <span>Species: <strong id="${nodeId}-species-val">0</strong></span>
                        </div>
                    `;
                    parentContainer.appendChild(card);
                }
            }

            // Bind click handler once, covering both pre-existing and newly created cards
            if (card && !card._clickBound) {
                card.addEventListener('click', () => {
                    this.openBiomassModal(nodeId, node, planet, biology);
                });
                card._clickBound = true;
            }

            if (card) {
                card.style.display = isUnlocked ? 'flex' : 'none';

                if (isUnlocked) {
                    const densitySpan = document.getElementById(`${nodeId}-density`);
                    const progressBar = document.getElementById(`${nodeId}-progress`);
                    const speciesVal = document.getElementById(`${nodeId}-species-val`);
                    const boostIndicator = document.getElementById(`${nodeId}-boost-indicator`);

                    if (densitySpan) {
                        densitySpan.textContent = `${biomass.toFixed(2)} ${node.unit}`;
                    }
                    if (progressBar) {
                        // Apply custom carrying capacity bounds
                        let cap = node.cap;
                        if (nodeId === 'eukaryotes') {
                            cap = biology.unlockedSexualReproduction ? 180 : 120;
                        }
                        const percent = Math.min(100, (biomass / cap) * 100);
                        progressBar.style.width = `${percent}%`;

                        // Check if mutagen boost is active on this node
                        const hasBoost = biology.pendingNudges[nodeId] || (node.nudge && biology.pendingNudges[node.nudge.id]);
                        if (hasBoost) {
                            progressBar.style.boxShadow = '0 0 10px var(--accent-cyan)';
                            progressBar.style.background = 'linear-gradient(90deg, var(--accent-cyan), #6366f1)';
                            if (boostIndicator) {
                                const remaining = (biology.pendingNudges[nodeId]?.remainingMyr || biology.pendingNudges[node.nudge?.id]?.remainingMyr || 0);
                                boostIndicator.textContent = `⚡ BOOSTED (${remaining.toFixed(1)}M)`;
                                boostIndicator.classList.add('active');
                            }
                        } else {
                            progressBar.style.boxShadow = 'none';
                            progressBar.style.background = ''; // reset to CSS class styling
                            if (boostIndicator) boostIndicator.classList.remove('active');
                        }
                    }
                    if (speciesVal) {
                        speciesVal.textContent = Math.floor(speciesCount).toLocaleString();
                    }
                }
            }
        }

        // 1. Update OEC stability gate countdown
        const showGate = (
            planet.activeSolvent === 'water' &&
            biology.unlockedAnoxygenicPhoto &&
            !biology.unlockedPhotosynthetic
        );
        if (showGate) {
            this.pacingGateWrapper.style.display = 'block';
            this.pacingGateTimer.textContent = `${Math.max(0.0, biology.oecStabilityTimer).toFixed(1)} / 100.0 Myr`;
            
            const effRad = planet.getEffectiveRadiation() * Math.max(0.2, 1.0 - (biology.radiationDefenseLevel || 0) * 0.15);
            const isStable = (
                planet.temperature >= 15.0 && planet.temperature <= 55.0 &&
                planet.waterCoverage >= 20.0 &&
                effRad <= 3.0
            );
            if (isStable) {
                this.pacingGateTimer.style.color = '#00f2fe';
                this.pacingGateWrapper.style.animation = 'pulse-light 2s infinite';
            } else {
                this.pacingGateTimer.style.color = '#ef4444';
                this.pacingGateWrapper.style.animation = 'none';
            }
        } else {
            this.pacingGateWrapper.style.display = 'none';
        }

        // 2. Update Genetic Tuning panel values and buttons
        if (this.tabContentTuning && this.tabContentTuning.classList.contains('active')) {
            const silver = (this.currentEventSystem && typeof this.currentEventSystem.tokensSilver === 'number') ? this.currentEventSystem.tokensSilver : 0;

            // Thermal Resilience
            const thermalLvl = biology.thermalResilienceLevel || 0;
            this.thermalResilienceLevelVal.textContent = `Lvl ${thermalLvl} / 5`;
            this.thermalResilienceEffectVal.textContent = `±${thermalLvl * 2}°C`;
            if (thermalLvl >= 5) {
                this.btnUpgradeThermal.textContent = "MAX UPGRADE";
                this.btnUpgradeThermal.disabled = true;
                this.btnUpgradeThermal.classList.remove('disabled');
            } else {
                const cost = Math.round(5 * Math.pow(2.2, thermalLvl));
                const canAfford = silver >= cost;
                this.btnUpgradeThermal.textContent = `Upgrade: ${cost} 🥈`;
                this.btnUpgradeThermal.disabled = !canAfford;
                if (canAfford) this.btnUpgradeThermal.classList.remove('disabled');
                else this.btnUpgradeThermal.classList.add('disabled');
            }

            // Radiation Shielding
            const radLvl = biology.radiationDefenseLevel || 0;
            this.radiationDefenseLevelVal.textContent = `Lvl ${radLvl} / 5`;
            this.radiationDefenseEffectVal.textContent = `-${radLvl * 15}%`;
            if (radLvl >= 5) {
                this.btnUpgradeRadiation.textContent = "MAX UPGRADE";
                this.btnUpgradeRadiation.disabled = true;
                this.btnUpgradeRadiation.classList.remove('disabled');
            } else {
                const cost = Math.round(5 * Math.pow(2.2, radLvl));
                const canAfford = silver >= cost;
                this.btnUpgradeRadiation.textContent = `Upgrade: ${cost} 🥈`;
                this.btnUpgradeRadiation.disabled = !canAfford;
                if (canAfford) this.btnUpgradeRadiation.classList.remove('disabled');
                else this.btnUpgradeRadiation.classList.add('disabled');
            }

            // Metabolic Efficiency
            const metabLvl = biology.metabolicEfficiencyLevel || 0;
            this.metabolicEfficiencyLevelVal.textContent = `Lvl ${metabLvl} / 5`;
            this.metabolicEfficiencyEffectVal.textContent = `-${metabLvl * 15}%`;
            if (metabLvl >= 5) {
                this.btnUpgradeMetabolic.textContent = "MAX UPGRADE";
                this.btnUpgradeMetabolic.disabled = true;
                this.btnUpgradeMetabolic.classList.remove('disabled');
            } else {
                const cost = Math.round(5 * Math.pow(2.2, metabLvl));
                const canAfford = silver >= cost;
                this.btnUpgradeMetabolic.textContent = `Upgrade: ${cost} 🥈`;
                this.btnUpgradeMetabolic.disabled = !canAfford;
                if (canAfford) this.btnUpgradeMetabolic.classList.remove('disabled');
                else this.btnUpgradeMetabolic.classList.add('disabled');
            }
        }

        // 3. Update Token Exchange panel buttons
        if (this.tabContentExchange && this.tabContentExchange.classList.contains('active')) {
            const mutagen = (this.currentEventSystem && typeof this.currentEventSystem.tokensBlue === 'number') ? this.currentEventSystem.tokensBlue : 0;
            const silver = (this.currentEventSystem && typeof this.currentEventSystem.tokensSilver === 'number') ? this.currentEventSystem.tokensSilver : 0;

            if (this.btnConvertBlueSilver) {
                const canConvert = mutagen >= 50.0;
                this.btnConvertBlueSilver.disabled = !canConvert;
                if (canConvert) {
                    this.btnConvertBlueSilver.classList.remove('disabled');
                } else {
                    this.btnConvertBlueSilver.classList.add('disabled');
                }
            }

            if (this.btnConvertSilverGold) {
                const canConvert = silver >= 50.0;
                this.btnConvertSilverGold.disabled = !canConvert;
                if (canConvert) {
                    this.btnConvertSilverGold.classList.remove('disabled');
                } else {
                    this.btnConvertSilverGold.classList.add('disabled');
                }
            }
        }

        // Update biomass details modal if open
        if (this.biomassModal && this.biomassModal.style.display === 'flex' && this.activeBiomassNodeId) {
            const nodeId = this.activeBiomassNodeId;
            const node = EVOLUTION_GRAPH[planet.activeSolvent][nodeId];
            if (node) {
                const biomass = biology.biomassMap[nodeId] || 0.0;
                let cap = node.cap;
                if (nodeId === 'eukaryotes') {
                    cap = biology.unlockedSexualReproduction ? 180 : 120;
                }
                if (this.biomassModalPop) this.biomassModalPop.textContent = biomass.toFixed(2);
                if (this.biomassModalCap) this.biomassModalCap.textContent = cap.toFixed(2);
                if (this.biomassModalSpecies) this.biomassModalSpecies.textContent = Math.floor(biology.biodiversityMap[nodeId] || 0).toLocaleString();

                const rate = biology.popChangeRates[nodeId] || 0.0;
                if (this.biomassModalTrend) {
                    if (rate > 0.005) {
                        this.biomassModalTrend.textContent = `▲ +${rate.toFixed(2)} ${node.unit}/Myr`;
                        this.biomassModalTrend.style.color = 'var(--accent-green)';
                    } else if (rate < -0.005) {
                        this.biomassModalTrend.textContent = `▼ ${rate.toFixed(2)} ${node.unit}/Myr`;
                        this.biomassModalTrend.style.color = 'var(--accent-red)';
                    } else {
                        this.biomassModalTrend.textContent = `■ 0.00 ${node.unit}/Myr`;
                        this.biomassModalTrend.style.color = 'var(--text-secondary)';
                    }
                }

                // Recalculate viability factors
                const factors = biology.getViabilityFactors(nodeId, planet);
                let factorsHTML = "";
                if (factors && factors.length > 0) {
                    factors.forEach(factor => {
                        const percent = Math.round(factor.value * 100);
                        let barColor = "var(--accent-green)";
                        if (percent < 30) {
                            barColor = "var(--accent-red)";
                        } else if (percent < 70) {
                            barColor = "var(--accent-amber)";
                        }
                        
                        factorsHTML += `
                            <div class="viability-factor-row">
                                <div class="factor-meta">
                                    <span class="factor-name">${factor.name}</span>
                                    <span class="factor-pct" style="color: ${barColor};">${percent}%</span>
                                </div>
                                <div class="factor-bar-container">
                                    <div class="factor-bar-fill" style="width: ${percent}%; background: ${barColor}; box-shadow: 0 0 6px ${barColor}55;"></div>
                                </div>
                                <div class="factor-details">${factor.details}</div>
                            </div>
                        `;
                    });
                } else {
                    factorsHTML = `<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; text-align: left;">No active limiting environmental factors. Growth is unconstrained.</div>`;
                }
                if (this.biomassModalFactors) this.biomassModalFactors.innerHTML = factorsHTML;
                this.updateGenotypeSection(nodeId, planet, biology);
            }
        }

        // Render Evolution Tree nodes dynamically
        this.renderEvolutionTree(planet, biology);

        // Update the always-visible pacing timeline
        this.updatePacingTimeline(planet, biology);
    }

    /**
     * Update the always-visible planetary pacing timeline comparison card.
     */
    updatePacingTimeline(planet, biology) {
        const solvent = planet.activeSolvent;

        const milestones = Object.keys(EVOLUTION_GRAPH[solvent] || {});
        let latestUnlocked = null;
        let latestUnlockAge = null;

        const getUnlockAge = (nodeId) => {
            if (!biology.unlockAges) return null;
            return biology.unlockAges[nodeId];
        };

        // Find the last unlocked milestone in sequence
        for (let i = milestones.length - 1; i >= 0; i--) {
            const mId = milestones[i];
            const age = getUnlockAge(mId);
            if (age !== null && age !== undefined) {
                latestUnlocked = mId;
                latestUnlockAge = age;
                break;
            }
        }

        // Determine pacing state
        let statusText = "PRIMORDIAL";
        let statusClass = "primordial";
        let milestoneName = "Prebiotic Stage";

        if (latestUnlocked) {
            const latestNode = EVOLUTION_GRAPH[solvent]?.[latestUnlocked];
            milestoneName = latestNode ? latestNode.name : latestUnlocked;
            const earthAge = getEvolutionNode(latestUnlocked)?.earthAge ?? null;

            if (earthAge !== null) {
                const diff = earthAge - latestUnlockAge;
                if (Math.abs(diff) < 15.0) {
                    statusText = "ON TRACK";
                    statusClass = "on-track";
                } else if (diff >= 15.0) {
                    statusText = `AHEAD (+${diff.toFixed(0)}M)`;
                    statusClass = "ahead";
                } else {
                    statusText = `BEHIND (${Math.abs(diff).toFixed(0)}M)`;
                    statusClass = "behind";
                }
            } else {
                statusText = "ON TRACK";
                statusClass = "on-track";
            }
        }

        // Update DOM Elements
        if (this.pacingStatus) {
            this.pacingStatus.className = `pacing-status-badge ${statusClass}`;
            this.pacingStatus.textContent = statusText;
        }

        // Update fill bar progress based on planet age relative to 4540 Myr target
        const maxAgeTarget = 4540.0;
        const progressPct = Math.min(100, Math.max(0, (planet.age / maxAgeTarget) * 100));
        if (this.pacingPlayerFill) {
            this.pacingPlayerFill.style.width = `${progressPct}%`;
        }

        if (this.pacingText) {
            this.pacingText.textContent = `Age: ${planet.age.toFixed(1)} / ${maxAgeTarget.toFixed(0)} Myr (${milestoneName})`;
        }
    }

    /**
     * Shows a temporary, non-blocking toast notification on screen.
     */
    showToast(message, type = 'success') {
        this._toastView.showToast(message, type);
    }

    /**
     * Show a richer floating toast specifically for evolution boost activations.
     * Does NOT pause the game — auto-dismisses after 5 seconds.
     */
    showBoostToast(nodeLabel, durationMyr, multiplier) {
        this._toastView.showBoostToast(nodeLabel, durationMyr, multiplier);
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
        const tokens = eventSystem.tokensSilver;

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
            cost.textContent = `${event.cost} 🥈`;

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
                btn.textContent = `NEED ${event.cost} SILVER (HAVE ${Math.floor(tokens)})`;
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

    drawCladogramSVG(planet, biology, handlers) {
        const svg = document.getElementById('cladogram-svg');
        const connGroup = document.getElementById('cladogram-connections-group');
        const nodeGroup = document.getElementById('cladogram-nodes-group');
        if (!svg || !connGroup || !nodeGroup) return;

        // Clear existing drawing
        connGroup.innerHTML = '';
        nodeGroup.innerHTML = '';

        const solvent = planet.activeSolvent;
        const graphNodes = EVOLUTION_GRAPH[solvent] || {};

        // 1. Compute node depths
        const depths = {};
        function getDepth(nodeId) {
            if (depths[nodeId] !== undefined) return depths[nodeId];
            const node = graphNodes[nodeId];
            if (!node || !node.parents || node.parents.length === 0) {
                depths[nodeId] = 0;
                return 0;
            }
            let maxParentDepth = -1;
            for (const pId of node.parents) {
                maxParentDepth = Math.max(maxParentDepth, getDepth(pId));
            }
            depths[nodeId] = maxParentDepth + 1;
            return depths[nodeId];
        }
        for (const nodeId in graphNodes) {
            getDepth(nodeId);
        }

        // 2. Group nodes by column (depth)
        const columnNodes = {};
        for (const nodeId in graphNodes) {
            const depth = depths[nodeId];
            if (!columnNodes[depth]) columnNodes[depth] = [];
            columnNodes[depth].push(nodeId);
        }

        // 3. Compute static layout positions centered vertically
        const positions = {};
        const colWidth = 240;
        const rowHeight = 90;
        const baseCenterY = 320;

        for (const depth in columnNodes) {
            const colNodes = columnNodes[depth];
            const totalHeight = (colNodes.length - 1) * rowHeight;
            const startY = baseCenterY - totalHeight / 2;
            colNodes.forEach((nodeId, idx) => {
                positions[nodeId] = {
                    x: 100 + depth * colWidth,
                    y: startY + idx * rowHeight
                };
            });
        }

        // 4. Draw curved connection lines
        for (const nodeId in graphNodes) {
            const node = graphNodes[nodeId];
            const pos = positions[nodeId];
            const isChildUnlocked = biology.unlockedMap[nodeId];

            if (node.parents && node.parents.length > 0) {
                node.parents.forEach(pId => {
                    const pPos = positions[pId];
                    if (!pPos) return;

                    const isParentUnlocked = biology.unlockedMap[pId];
                    
                    // Curved bezier connector path
                    const cx1 = pPos.x + (pos.x - pPos.x) / 2;
                    const cy1 = pPos.y;
                    const cx2 = pPos.x + (pos.x - pPos.x) / 2;
                    const cy2 = pos.y;
                    const pathData = `M ${pPos.x} ${pPos.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pos.x} ${pos.y}`;

                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    path.setAttribute('d', pathData);
                    path.setAttribute('fill', 'none');

                    // Connection styling based on unlock status
                    if (isParentUnlocked && isChildUnlocked) {
                        path.setAttribute('stroke', 'var(--accent-cyan)');
                        path.setAttribute('stroke-width', '3.0');
                        path.setAttribute('filter', 'drop-shadow(0 0 3px var(--accent-cyan))');
                        path.style.opacity = '0.85';
                    } else if (isParentUnlocked) {
                        path.setAttribute('stroke', 'rgba(255, 255, 255, 0.25)');
                        path.setAttribute('stroke-width', '2.0');
                        path.setAttribute('stroke-dasharray', '5,5');
                        path.style.opacity = '0.5';
                    } else {
                        path.setAttribute('stroke', 'rgba(255, 255, 255, 0.08)');
                        path.setAttribute('stroke-width', '1.5');
                        path.style.opacity = '0.3';
                    }

                    // If it is a merger event, color it with purple highlight
                    if (node.parents.length > 1) {
                        if (isParentUnlocked && isChildUnlocked) {
                            path.setAttribute('stroke', 'rgba(168, 85, 247, 0.85)'); // purple for mergers
                            path.setAttribute('filter', 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.85))');
                        }
                    }

                    connGroup.appendChild(path);
                });
            }
        }

        // 5. Draw node pills
        for (const id in graphNodes) {
            const node = graphNodes[id];
            const pos = positions[id];
            const isUnlocked = biology.unlockedMap[id];
            const biomass = biology.biomassMap[id] || 0.0;
            const speciesCount = biology.biodiversityMap[id] || 0;

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'cladogram-node-element');
            g.setAttribute('transform', `translate(${pos.x - 90}, ${pos.y - 25})`);
            g.style.cursor = 'pointer';

            // Rect shape
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('width', '180');
            rect.setAttribute('height', '50');
            rect.setAttribute('rx', '8');
            rect.setAttribute('ry', '8');
            rect.setAttribute('fill', 'rgba(18, 22, 35, 0.9)');

            // Node border and text styling based on status
            let strokeColor = 'rgba(255, 255, 255, 0.15)';
            let titleColor = 'rgba(255, 255, 255, 0.4)';
            let popColor = 'rgba(255, 255, 255, 0.2)';
            let specColor = 'rgba(255, 255, 255, 0.15)';
            
            if (isUnlocked) {
                if (biomass < 0.05 && node.isDeadEnd) {
                    strokeColor = '#6b7280'; // Stagnant dead-end
                    titleColor = '#9ca3af';
                    popColor = '#6b7280';
                    specColor = '#4b5563';
                } else if (biomass < 0.05) {
                    strokeColor = '#ef4444'; // Extinct
                    titleColor = '#ef4444';
                    popColor = 'rgba(239, 68, 68, 0.5)';
                    specColor = 'rgba(239, 68, 68, 0.3)';
                } else {
                    strokeColor = 'var(--accent-cyan)';
                    titleColor = 'var(--text-primary)';
                    popColor = 'var(--text-secondary)';
                    specColor = 'var(--accent-cyan)';
                }
            }

            if (this.selectedNodeId === id) {
                strokeColor = '#ec4899'; // Selected pink highlight
                rect.setAttribute('stroke-width', '2.5');
                rect.setAttribute('filter', 'drop-shadow(0 0 5px #ec4899)');
            } else {
                rect.setAttribute('stroke-width', '1.5');
                if (isUnlocked && biomass >= 0.05 && !node.isDeadEnd) {
                    rect.setAttribute('filter', 'drop-shadow(0 0 3px var(--accent-cyan))');
                }
            }

            rect.setAttribute('stroke', strokeColor);
            g.appendChild(rect);

            // Title
            const textTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textTitle.setAttribute('x', '10');
            textTitle.setAttribute('y', '18');
            textTitle.setAttribute('fill', titleColor);
            textTitle.setAttribute('font-size', '10.5');
            textTitle.setAttribute('font-weight', 'bold');
            textTitle.setAttribute('font-family', 'var(--font-sans)');
            textTitle.textContent = node.name;
            g.appendChild(textTitle);

            // Population/Biomass density
            const textPop = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textPop.setAttribute('x', '10');
            textPop.setAttribute('y', '32');
            textPop.setAttribute('fill', popColor);
            textPop.setAttribute('font-size', '9');
            textPop.setAttribute('font-family', 'var(--font-mono)');
            textPop.textContent = `${biomass.toFixed(2)} ${node.unit || 'Idx'}`;
            g.appendChild(textPop);

            // Species Count (Biodiversity)
            const textSpec = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textSpec.setAttribute('x', '10');
            textSpec.setAttribute('y', '43');
            textSpec.setAttribute('fill', specColor);
            textSpec.setAttribute('font-size', '8.5');
            textSpec.setAttribute('font-family', 'var(--font-mono)');
            textSpec.textContent = isUnlocked ? `S: ${Math.floor(speciesCount).toLocaleString()} species` : 'S: 0 species';
            g.appendChild(textSpec);

            // Click interaction
            g.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Format requirements text
                let reqText = '';
                if (node.reqs) {
                    const parts = [];
                    if (node.reqs.waterCoverage) parts.push(`Water > ${node.reqs.waterCoverage}%`);
                    if (node.reqs.ammoniaCoverage) parts.push(`Ammonia > ${node.reqs.ammoniaCoverage}%`);
                    if (node.reqs.methaneCoverage) parts.push(`Methane > ${node.reqs.methaneCoverage}%`);
                    if (node.reqs.tempRange) parts.push(`Temp ${node.reqs.tempRange[0]} to ${node.reqs.tempRange[1]}°C`);
                    if (node.reqs.minTemp) parts.push(`Temp >= ${node.reqs.minTemp}°C`);
                    if (node.reqs.maxTemp) parts.push(`Temp <= ${node.reqs.maxTemp}°C`);
                    if (node.reqs.minO2) parts.push(`O₂ >= ${node.reqs.minO2}%`);
                    if (node.reqs.ozone) parts.push(`Ozone >= ${(node.reqs.ozone * 100).toFixed(0)}%`);
                    if (node.reqs.magnetosphere) parts.push('Magnetosphere');
                    if (node.reqs.solarRadiance) parts.push(`Solar Rad >= ${node.reqs.solarRadiance}`);
                    if (node.reqs.oecGate) parts.push('OEC Stability');
                    
                    if (node.reqs.popThreshold) {
                        for (const [pId, val] of Object.entries(node.reqs.popThreshold)) {
                            const parentNode = graphNodes[pId];
                            parts.push(`${parentNode ? parentNode.name : pId} > ${val}`);
                        }
                    }
                    if (node.reqs.synapsidOrSauropsidThreshold) parts.push(`Synapsids/Sauropsids >= ${node.reqs.synapsidOrSauropsidThreshold}`);
                    if (node.reqs.aiOrCyborgThreshold) parts.push(`AI/Cyborg >= ${node.reqs.aiOrCyborgThreshold}`);
                    if (node.reqs.cyborgOrMossesThreshold) parts.push('Cyborg > 45 OR Mosses > 60');
                    
                    reqText = parts.join(', ');
                }
                if (!reqText) reqText = 'None';

                let capVal = node.cap || 100.0;
                if (id === 'eukaryotes') {
                    capVal = biology.unlockedSexualReproduction ? 180.0 : 120.0;
                }

                const uiNode = {
                    id: id,
                    name: node.name,
                    pop: biomass,
                    cap: capVal,
                    unit: node.unit || 'Idx',
                    req: reqText,
                    nudgeId: node.nudge ? node.nudge.id : null,
                    nudgeName: node.nudge ? node.nudge.name : '',
                    cost: node.nudge ? node.nudge.cost : 0,
                    isDeadEnd: node.isDeadEnd
                };

                this.selectedNodeId = id;
                this.renderSelectedNodeDetails(uiNode, biology);
                
                // Redraw cladogram to show selection border
                this.drawCladogramSVG(planet, biology, handlers);
            });

            nodeGroup.appendChild(g);
        }

        // Setup pan & zoom listeners if not already bound
        if (!this.cladogramZoomBound) {
            this.cladogramZoomBound = true;
            this.setupCladogramPanZoom();
        }
    }

    setupCladogramPanZoom() {
        const svg = document.getElementById('cladogram-svg');
        const zoomGroup = document.getElementById('cladogram-zoom-group');
        if (!svg || !zoomGroup) return;

        let scale = 0.85;
        let translateX = 40;
        let translateY = 100;
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        function updateTransform() {
            zoomGroup.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
        }

        // Apply initial transform
        updateTransform();

        // Drag to pan
        svg.addEventListener('mousedown', (e) => {
            if (e.target.closest('.cladogram-node-element')) return;
            isDragging = true;
            svg.style.cursor = 'grabbing';
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                svg.style.cursor = 'grab';
            }
        });

        // Scroll to zoom
        svg.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = 1.1;
            const mouseX = e.clientX - svg.getBoundingClientRect().left;
            const mouseY = e.clientY - svg.getBoundingClientRect().top;
            
            const zoomGroupX = (mouseX - translateX) / scale;
            const zoomGroupY = (mouseY - translateY) / scale;
            
            if (e.deltaY < 0) {
                scale = Math.min(3.0, scale * zoomFactor);
            } else {
                scale = Math.max(0.4, scale / zoomFactor);
            }
            
            translateX = mouseX - zoomGroupX * scale;
            translateY = mouseY - zoomGroupY * scale;
            updateTransform();
        }, { passive: false });

        // Controls button zoom
        document.getElementById('cladogram-zoom-in')?.addEventListener('click', () => {
            scale = Math.min(3.0, scale * 1.25);
            updateTransform();
        });

        document.getElementById('cladogram-zoom-out')?.addEventListener('click', () => {
            scale = Math.max(0.4, scale / 1.25);
            updateTransform();
        });

        document.getElementById('cladogram-zoom-reset')?.addEventListener('click', () => {
            scale = 0.85;
            translateX = 40;
            translateY = 100;
            updateTransform();
        });
    }
}
