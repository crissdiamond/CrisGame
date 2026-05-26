/**
 * Manages UI interactions, DOM updates, tab switches, threat alerts,
 * and the interactive evolution tree rendering.
 */
// Geological Earth ages (in Myr from planet formation) for singular biological milestones.
const earthTimeline = {
    // Water Line
    'soup': { age: 600.0, name: "Prebiotic Soup" },
    'membrane': { age: 700.0, name: "Membranes" },
    'bacteria': { age: 800.0, name: "First Prokaryotes" },
    'anaerobic': { age: 1000.0, name: "Anoxygenic Chemotrophs" },
    'anoxygenic_photo': { age: 1200.0, name: "Anoxygenic Photosynthesizers" },
    'photosynthetic': { age: 1500.0, name: "Cyanobacteria" },
    'nucleus': { age: 2100.0, name: "Cellular Nucleus" },
    'mitochondria': { age: 2500.0, name: "Mitochondria Symbiosis" },
    'eukaryotes': { age: 2700.0, name: "Eukaryotic Cells" },
    'sexual': { age: 3300.0, name: "Sexual Reproduction" },
    'multicellular': { age: 3700.0, name: "Multicellularity" },
    'sponges': { age: 3900.0, name: "Marine Sponges" },
    'meduses': { age: 3950.0, name: "Jellyfish & Meduses" },
    'worms': { age: 3980.0, name: "Bilateral Worms" },
    'fish': { age: 4000.0, name: "Early Vertebrate Fish" },
    'mosses': { age: 4100.0, name: "Non-Vascular Mosses" },
    'ferns': { age: 4150.0, name: "Vascular Ferns" },
    'conifers': { age: 4250.0, name: "Gymnosperms" },
    'angiosperms': { age: 4400.0, name: "Flowering Plants" },
    'cambrian': { age: 4000.0, name: "Cambrian Explosion" },
    'insects': { age: 4120.0, name: "Land Insects" },
    'tetrapods': { age: 4180.0, name: "Tetrapods" },
    'sauropsids': { age: 4300.0, name: "Dinosaurs/Sauropsids" },
    'synapsids': { age: 4320.0, name: "Mammals/Synapsids" },
    'cognitive': { age: 4540.0, name: "Sentient/Cognitive Life" },
    'ai': { age: 4540.0, name: "Post-Biological AI" },
    'cyborg': { age: 4540.0, name: "Cyborg Hybrids" },
    'noosphere': { age: 4540.0, name: "Planetary AI Noosphere" },
    'gaia_hivemind': { age: 4540.0, name: "Gaia Hivemind" },
    
    // Ammonia Line
    'ammonic_soup': { age: 600.0, name: "Prebiotic Chemistry" },
    'ammonic_proto': { age: 800.0, name: "Simple Prokaryotes" },
    'ammonic_multi': { age: 3700.0, name: "Multicellularity" },
    'silico_flora': { age: 4100.0, name: "Photosynthetic Flora" },
    'cryo_fauna': { age: 4000.0, name: "Fauna Colonization" },
    'crystalline_cognitive': { age: 4540.0, name: "Cognitive Species" },
    'quantum_lattices': { age: 4540.0, name: "Advanced Computing Systems" },
    'cryo_hivemind': { age: 4540.0, name: "Global Hivemind Network" },

    // Methane Line
    'methane_soup': { age: 600.0, name: "Prebiotic Chemistry" },
    'methane_proto': { age: 800.0, name: "Simple Prokaryotes" },
    'methane_multi': { age: 3700.0, name: "Multicellularity" },
    'cryo_organisms': { age: 4000.0, name: "Fauna Colonization" },
    'cryo_polymer_network': { age: 4100.0, name: "Flora Colonization" },
    'thinking_ocean': { age: 4540.0, name: "Global Hivemind Network" },
    'cryo_colloid': { age: 4540.0, name: "Cognitive Species" }
};

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
        this.anoxygenicPhotoCard = document.getElementById('anoxygenic-photo-card');
        this.anoxygenicPhotoPop = document.getElementById('anoxygenic-photo-pop');
        this.anoxygenicPhotoProgress = document.getElementById('anoxygenic-photo-progress');

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
        if (solvent === 'ammonia') {
            if (biology.unlockedCryoHivemind) {
                return {
                    name: "Ammonic Cryo-Hivemind",
                    details: "A stabilized network of cryogenic life coordinated via low-latency nitrogenous channels. Operating at sub-zero temperatures, it establishes global homeostatic feedback loops."
                };
            }
            if (biology.unlockedQuantumLattice) {
                return {
                    name: "Coherent Quantum Lattice",
                    details: "At temperatures below -50°C, biological semiconductor systems achieve stable quantum coherence. This lattice processes environmental calculations at massive parallel scales."
                };
            }
            if (biology.unlockedCrystallineCognitive) {
                return {
                    name: "Crystalline Piezo-Cognitive",
                    details: "Fauna utilizing piezoelectric silicon-oxygen structures to transmit and receive electrical signals. They achieve complex resonance patterns across frozen ammonia lakes."
                };
            }
            if (biology.unlockedCryoFauna) {
                return {
                    name: "Ammonic Cryo-Fauna",
                    details: "Speculative mobile fauna that circulate liquid ammonia instead of water. They utilize specialized catalyst enzymes to drive cryogenic metabolism and nitrogen excretion."
                };
            }
            if (biology.unlockedSilicoFlora) {
                return {
                    name: "Glacial Silico-Flora",
                    details: "Crystalline plants constructed with silicon-oxygen chains that remain fluid and flexible in extreme cold. They metabolize geothermal hydrogen sulfide and starlight."
                };
            }
            if (biology.unlockedAmmonicMulti) {
                return {
                    name: "Ammonic Multicellular",
                    details: "Coordinated aggregates of cryogenic prokaryotic cells. They leverage high-efficiency enzymes to overcome kinetic constraints on chemical reactions in sub-freezing conditions."
                };
            }
            if (biology.unlockedAmmonicProto) {
                return {
                    name: "Ammonic Prokaryotes",
                    details: "Unicellular life relying on liquid ammonia as their primary intracellular solvent. Their membranes incorporate lipids that remain active and fluid at -50°C."
                };
            }
            if (biology.unlockedAmmonicSoup) {
                return {
                    name: "Ammonic Organic Soup",
                    details: "Concentrated prebiotic compounds (amino acids and nitrogenous precursors) dissolved in liquid ammonia pools, serving as raw materials for cryo-biochemistry."
                };
            }
            return {
                name: "Prebiotic Ammonia Vents",
                details: "Cryogenic chemical systems beginning to organize volatile nitrogen-based molecules around hydrothermal crust cracks."
            };
        } else if (solvent === 'methane') {
            if (biology.unlockedCryoColloid) {
                return {
                    name: "Megastructure Cryo-Colloids",
                    details: "Massive colloidal clusters of cryogenic organisms. Lacking warm blood, they coordinate respiration and energy sharing via convection currents."
                };
            }
            if (biology.unlockedThinkingOcean) {
                return {
                    name: "Thinking Methane Oceans",
                    details: "Organic sheets dissolved in liquid methane basins that function as wave-driven mechanical logic gates, turning entire oceans into slow cognitive media."
                };
            }
            if (biology.unlockedCryoPolymerNetwork) {
                return {
                    name: "Polymer-Chain Networks",
                    details: "Interconnected organic sheets that grow over tholin sand dunes, utilizing ambient electrical currents and wind vibration to transmit signals."
                };
            }
            if (biology.unlockedCryoOrganisms) {
                return {
                    name: "Cyto-Beasts (Cryo-Organisms)",
                    details: "Mobile organisms that graze on surface tholin deposits. They utilize high-energy acetylene as a metabolic fuel source, processed via cold-active enzymes."
                };
            }
            if (biology.unlockedMethaneMulti) {
                return {
                    name: "Polymer-Chain Multicellular",
                    details: "Chains of azotosome vesicles that have self-assembled into early macroscopic structures. They absorb dissolved atmospheric tholins across high surface areas."
                };
            }
            if (biology.unlockedMethaneProto) {
                return {
                    name: "Azotosome Prokaryotes",
                    details: "Unicellular life using nitrogen-based azotosome membranes that remain stable and flexible at 90 Kelvin, feeding on molecular hydrogen."
                };
            }
            if (biology.unlockedMethaneSoup) {
                return {
                    name: "Methane Tholin Soup",
                    details: "Prebiotic photolysis products (tholins, acetylene) deposited from the upper atmosphere into non-polar liquid methane basins, seeding hydrophobic vesicle assembly."
                };
            }
            return {
                name: "Hydrocarbon Basin Prebiotics",
                details: "Photolytic tholin deposits accumulating in non-polar liquid methane, waiting for azotosome membrane assembly."
            };
        } else { // water
            if (biology.unlockedGaiaHivemind) {
                return {
                    name: "Gaia Biosphere Hivemind",
                    details: "A feedback-stabilized system of chemical signaling, mycelial networks, and atmospheric regulation. The global biomass actively optimizes planetary climate."
                };
            }
            if (biology.unlockedNoosphere) {
                return {
                    name: "Planetary Noosphere",
                    details: "A global thinking sphere integrating biological minds, digital grids, and silicon networks into a unified planet-scale cognitive system."
                };
            }
            if (biology.unlockedCyborg) {
                return {
                    name: "Cyborg Hybrids",
                    details: "Cybernetic integration linking silicon-neural interfaces directly to nerve fibers, bypassing slow biological Darwinian evolutionary bottlenecks."
                };
            }
            if (biology.unlockedTechnologicalAI) {
                return {
                    name: "Technological AI",
                    details: "Autonomous silicon-substrate neural architectures that mimic biological synapses but run at clock-rates 10,000 times faster, decoupling intelligence from carbon."
                };
            }
            if (biology.unlockedCognitive) {
                return {
                    name: "Cognitive Species",
                    details: "Extreme encephalization and neocortex enlargement support symbolic reasoning, language syntax, and manual tool usage to modify their own niche."
                };
            }
            if (biology.unlockedSynapsid) {
                return {
                    name: "Synapsida (Mammals)",
                    details: "Endothermic, highly active organisms with insulating hair and sweat glands. This constant thermal state enables rapid activity and mammalian brain expansion."
                };
            }
            if (biology.unlockedSauropsid) {
                return {
                    name: "Sauropsida (Dinosaurs)",
                    details: "Terrestrial vertebrates with dry, keratinous scales to shield moisture loss and water-efficient uric acid excretion, highly resilient to warm, arid climates."
                };
            }
            if (biology.unlockedArthropod) {
                return {
                    name: "Terrestrial Arthropods",
                    details: "Invertebrates with chitinous exoskeletons to prevent desiccation and tracheal tube networks to directly oxygenate tissues, enabling land gigantism."
                };
            }
            if (biology.unlockedAngiosperms) {
                return {
                    name: "Angiosperms (Flowers)",
                    details: "Enclosed seeds and petals that recruit insects for pollination and birds/mammals for seed dispersal, triggering explosive terrestrial biodiversity."
                };
            }
            if (biology.unlockedConifers) {
                return {
                    name: "Gymnosperms (Conifers)",
                    details: "Vascular plants bearing seeds locked in protective cones. They rely on wind-pollination, allowing them to populate cold, arid continental interiors."
                };
            }
            if (biology.unlockedFerns) {
                return {
                    name: "Vascular Ferns",
                    details: "Vascular tissue networks (xylem/phloem) that transport water vertically. They synthesize rigid lignin in cell walls, locking carbon into coal beds."
                };
            }
            if (biology.unlockedMosses) {
                return {
                    name: "Non-Vascular Mosses",
                    details: "Early land bryophytes with simple protective cuticles. Lacking vascular plumbing, they stay small and require thin water films for reproduction."
                };
            }
            if (biology.unlockedFish) {
                return {
                    name: "Early Chordates & Fish",
                    details: "Vascular chordates with jaw mechanics, bony/cartilaginous spines, and respiratory gills, dominating predatory cycles in the marine ecosystem."
                };
            }
            if (biology.unlockedWorms) {
                return {
                    name: "Bilateral Water Worms",
                    details: "Worms with cephalization (a defined head with sensory clusters) and triploblastic layers, enabling active, directed locomotion and burrowing."
                };
            }
            if (biology.unlockedMeduses) {
                return {
                    name: "Cnidarians (Jellyfish)",
                    details: "Organisms with radial symmetry, defined tissue layers, simple nerve nets, and stinging cells (nematocysts) to capture prey, initiating active macropredation."
                };
            }
            if (biology.unlockedSponges) {
                return {
                    name: "Marine Sponges",
                    details: "The earliest animal lineage. Lacking defined organs, they rely on flagellated choanocyte cells to pump and filter water for organic nutrients."
                };
            }
            if (biology.unlockedMulticellular) {
                return {
                    name: "Multicellular Organisms",
                    details: "Cellular aggregates utilizing cadherin adhesion proteins and chemical signaling to coordinate cell division of labor into distinct somatic tissues."
                };
            }
            if (biology.unlockedEukaryotic) {
                return {
                    name: "Complex Eukaryotes",
                    details: "Cells containing internal nuclei and endosymbiotic mitochondria that perform oxidative phosphorylation, generating 15x more ATP."
                };
            }
            if (biology.unlockedPhotosynthetic) {
                return {
                    name: "Cyanobacteria",
                    details: "Prokaryotes utilizing photosystem II and the oxygen-evolving complex to split water, releasing O2 gas as a byproduct and venting it to the atmosphere."
                };
            }
            if (biology.unlockedAnaerobic) {
                return {
                    name: "Anaerobic Chemotrophs",
                    details: "Prokaryotic unicells relying on simple anaerobic pathways in deep hydrothermal basins, consuming prebiotic organic soup."
                };
            }
            if (biology.unlockedMembrane) {
                return {
                    name: "External Membranes",
                    details: "Fatty acid vesicles that self-assemble into lipid bilayers, establishing protocells that isolate early replication loops from entropy."
                };
            }
            if (biology.unlockedSoup) {
                return {
                    name: "Primordial Soup",
                    details: "Accumulated amino acids, lipids, and nucleotide precursors synthesized via mineral catalysis and stellar UV radiolysis in warm water basins."
                };
            }
            return {
                name: "Prebiotic Basins",
                details: "A warm water-rich world waiting for prebiotic chemical reactions to synthesize early organic soup compounds."
            };
        }
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
        if (solvent === 'water') {
            nodes = [
                { id: 'soup', name: 'Prebiotic Soup', pop: biology.organicSoup, cap: 100.0, unit: 'ppm', req: 'Water > 10%, Temp 10-90°C', nudgeId: null, cost: 0 },
                { id: 'membrane', name: 'External Membrane', pop: biology.unlockedMembrane ? 100.0 : 0.0, cap: 100.0, unit: 'Idx', req: 'Organic Soup > 8 ppm', nudgeId: null, cost: 0 },
                { id: 'bacteria', name: 'Prokaryotes (Bacteria)', pop: biology.unlockedBacteria ? 100.0 : 0.0, cap: 100.0, unit: 'Idx', req: 'Membrane & Soup > 15 ppm', nudgeId: null, cost: 0 },
                { id: 'anaerobic', name: 'Anoxygenic Chemotrophs', pop: biology.anaerobicPop, cap: 150.0, unit: 'M/mL', req: 'Bacterial emergence', nudgeId: null, cost: 0 },
                { id: 'anoxygenic_photo', name: 'Anoxygenic Photosynthesizers', pop: biology.anoxygenicPhotoPop, cap: 180.0, unit: 'M/mL', req: 'Chemotrophs > 20 M/mL & Solar Radiance', nudgeId: null, cost: 0 },
                { id: 'photosynthetic', name: 'Cyanobacteria', pop: biology.photosyntheticPop, cap: 200.0, unit: 'M/mL', req: 'Anoxygenic Photo > 15 M/mL & 100 Myr OEC Stability', nudgeId: null, cost: 0 },
                { id: 'nucleus', name: 'Cellular Nucleus', pop: biology.unlockedNucleus ? 100.0 : 0.0, cap: 100.0, unit: 'Idx', req: 'Cyanobacteria > 15 M/mL', nudgeId: null, cost: 0 },
                { id: 'mitochondria', name: 'Mitochondria Symbiosis', pop: biology.unlockedMitochondria ? 100.0 : 0.0, cap: 100.0, unit: 'Idx', req: 'Nucleus & O₂ > 1.2% OR Nudge', nudgeId: 'endosymbiosis', nudgeName: 'Promote Endosymbiosis', cost: 60 },
                { id: 'eukaryotes', name: 'Eukaryotic Cells', pop: biology.eukaryoticPop, cap: biology.unlockedSexualReproduction ? 180.0 : 120.0, unit: 'M/mL', req: 'Mitochondria Symbiosis', nudgeId: null, cost: 0 },
                { id: 'sexual', name: 'Sexual Reproduction', pop: biology.unlockedSexualReproduction ? 100.0 : 0.0, cap: 100.0, unit: 'Idx', req: 'Eukaryotes > 20 M/mL', nudgeId: null, cost: 0 },
                { id: 'multicellular', name: 'Multicellularity', pop: biology.multicellularPop, cap: 100.0, unit: 'Idx', req: 'Sexual Reprod & Eukaryotes > 45 M/mL', nudgeId: null, cost: 0 },
                
                // New water animals
                { id: 'sponges', name: 'Marine Sponges', pop: biology.spongesPop, cap: 100.0, unit: 'Idx', req: 'Multicellularity > 20, O₂ > 10%', nudgeId: null, cost: 0 },
                { id: 'meduses', name: 'Jellyfish & Meduses', pop: biology.medusesPop, cap: 100.0, unit: 'Idx', req: 'Sponges > 25, O₂ > 12%', nudgeId: null, cost: 0 },
                { id: 'worms', name: 'Bilateral Water Worms', pop: biology.wormsPop, cap: 100.0, unit: 'Idx', req: 'Meduses > 30, O₂ > 14%', nudgeId: null, cost: 0 },
                { id: 'fish', name: 'Early Vertebrate Fish', pop: biology.fishPop, cap: 100.0, unit: 'Idx', req: 'Worms > 30, O₂ > 15%', nudgeId: null, cost: 0 },
                
                // New soil plants vegetable line
                { id: 'mosses', name: 'Non-Vascular Mosses', pop: biology.mossesPop, cap: 100.0, unit: 'Idx', req: 'Fish > 25, Magnetosphere & Ozone OR Nudge', nudgeId: 'vascular_tissue', nudgeName: 'Develop Vascular Tissue', cost: 75 },
                { id: 'ferns', name: 'Vascular Ferns', pop: biology.fernsPop, cap: 100.0, unit: 'Idx', req: 'Mosses > 30, O₂ > 16%', nudgeId: null, cost: 0 },
                { id: 'conifers', name: 'Gymnosperms (Conifers)', pop: biology.conifersPop, cap: 100.0, unit: 'Idx', req: 'Ferns > 30 OR Nudge', nudgeId: 'seed_evolution', nudgeName: 'Develop Seed Protection', cost: 90 },
                { id: 'angiosperms', name: 'Flowering Plants', pop: biology.angiospermsPop, cap: 100.0, unit: 'Idx', req: 'Conifers > 30, O₂ > 18%', nudgeId: null, cost: 0 },
                
                { id: 'cambrian', name: 'Cambrian Marine Life', pop: biology.cambrianPop, cap: 100.0, unit: 'Idx', req: 'Worms > 20, O₂ > 15%', nudgeId: null, cost: 0 },
                { id: 'insects', name: 'Land Insects', pop: biology.arthropodPop, cap: 100.0, unit: 'Idx', req: 'Mosses > 25%', nudgeId: null, cost: 0 },
                { id: 'tetrapods', name: 'Tetrapods (Amphibia)', pop: biology.tetrapodPop, cap: 100.0, unit: 'Idx', req: 'Fish > 30, Mosses > 30', nudgeId: 'amniotic_egg', nudgeName: 'Synthesize Amniotic Egg', cost: 90 },
                { id: 'sauropsids', name: 'Sauropsida (Dinosaurs)', pop: biology.sauropsidPop, cap: 100.0, unit: 'Idx', req: 'Tetrapods > 30, Temp > 28°C OR Nudge', nudgeId: 'scales', nudgeName: 'Nudge Scale Shielding', cost: 90 },
                { id: 'synapsids', name: 'Synapsida (Mammals)', pop: biology.synapsidPop, cap: 100.0, unit: 'Idx', req: 'Tetrapods > 30, O₂ > 20% OR Nudge', nudgeId: 'endthermy', nudgeName: 'Nudge Endothermy (Hair)', cost: 110 },
                { id: 'cognitive', name: 'Cognitive Species', pop: biology.cognitiveSpeciesPop, cap: 100.0, unit: 'Idx', req: 'Mammal/Dino > 45, O₂ > 19% OR Nudge', nudgeId: 'cognitive', nudgeName: 'Nudge Neural Networking', cost: 110 },
                { id: 'ai', name: 'Post-Biological AI', pop: biology.technologicalAIPop, cap: 100.0, unit: 'Idx', req: 'Cognitive > 35, Magnetosphere OR Nudge', nudgeId: 'ai', nudgeName: 'Buy Singularity core', cost: 110 },
                { id: 'cyborg', name: 'Cyborg Hybrids', pop: biology.cyborgPop, cap: 100.0, unit: 'Idx', req: 'Cognitive > 40, O₂ > 18% OR Nudge', nudgeId: 'cybernetic_implants', nudgeName: 'Promote Cybernetic Implants', cost: 130 },
                { id: 'noosphere', name: 'Planetary Noosphere', pop: biology.noospherePop, cap: 100.0, unit: 'Idx', req: 'AI/Cyborg > 45, Magnetosphere OR Nudge', nudgeId: 'global_consciousness', nudgeName: 'Sync Planetary Cloud', cost: 150 },
                { id: 'gaia_hivemind', name: 'Gaia Biosphere Hivemind', pop: biology.gaiaHivemindPop, cap: 100.0, unit: 'Idx', req: 'Cyborg > 45 OR Mosses > 60, O₂ > 20% OR Nudge', nudgeId: 'ecological_integration', nudgeName: 'Weave Mycelium Synapses', cost: 150 }
            ];
        } else if (solvent === 'ammonia') {
            nodes = [
                { id: 'ammonic_soup', name: 'Ammonic Soup', pop: biology.ammonicSoup, cap: 100.0, unit: 'ppm', req: 'Ammonia > 10%, Temp -80 to -30°C', nudgeId: null, cost: 0 },
                { id: 'ammonic_proto', name: 'Ammonic Prokaryotes', pop: biology.ammonicProtoPop, cap: 120.0, unit: 'M/mL', req: 'Ammonic Soup > 10 ppm', nudgeId: null, cost: 0 },
                { id: 'ammonic_multi', name: 'Ammonic Multicells', pop: biology.ammonicMultiPop, cap: 100.0, unit: 'Idx', req: 'Ammonic Proto > 35 M/mL', nudgeId: null, cost: 0 },
                { id: 'silico_flora', name: 'Silico-Flora', pop: biology.silicoFloraPop, cap: 100.0, unit: 'Idx', req: 'Temp < -45°C OR Nudge', nudgeId: 'silicon_chains', nudgeName: 'Promote Silicon Chains', cost: 90 },
                { id: 'cryo_fauna', name: 'Ammonic Megafauna', pop: biology.cryoFaunaPop, cap: 100.0, unit: 'Idx', req: 'Silico-Flora > 30', nudgeId: null, cost: 0 },
                { id: 'crystalline_cognitive', name: 'Crystalline Cognitive Swarms', pop: biology.crystallineCognitivePop, cap: 80.0, unit: 'Idx', req: 'Megafauna > 35, Temp < -40°C OR Nudge', nudgeId: 'crystalline_cognitive', nudgeName: 'Ignite Crystalline Collective', cost: 110 },
                { id: 'quantum_lattices', name: 'Quantum Lattices', pop: biology.quantumLatticePop, cap: 100.0, unit: 'Idx', req: 'Crystalline > 40, Temp < -50°C OR Nudge', nudgeId: 'quantum_alignment', nudgeName: 'Align Quantum Crystals', cost: 130 },
                { id: 'cryo_hivemind', name: 'Cryo-Biosphere Hivemind', pop: biology.cryoHivemindPop, cap: 100.0, unit: 'Idx', req: 'Crystalline > 40, Silico-Flora > 45 OR Nudge', nudgeId: 'cryo_neural_webs', nudgeName: 'Glacier Neural Synapses', cost: 130 }
            ];
        } else if (solvent === 'methane') {
            nodes = [
                { id: 'methane_soup', name: 'Hydrocarbon Soup', pop: biology.methaneSoup, cap: 100.0, unit: 'ppm', req: 'Methane > 10%, Temp -185 to -135°C', nudgeId: null, cost: 0 },
                { id: 'methane_proto', name: 'Cryo-Methanogen Prokaryotes', pop: biology.methaneProtoPop, cap: 100.0, unit: 'M/mL', req: 'Hydrocarbon Soup > 10 ppm', nudgeId: null, cost: 0 },
                { id: 'methane_multi', name: 'Cryo-Multicells', pop: biology.methaneMultiPop, cap: 80.0, unit: 'Idx', req: 'Methanogens > 30 M/mL', nudgeId: null, cost: 0 },
                { id: 'cryo_beasts', name: 'Cyto-Beasts', pop: biology.cryoOrganismsPop, cap: 70.0, unit: 'Idx', req: 'Stability OR Nudge', nudgeId: 'cryo_polymers', nudgeName: 'Synthesize Cryo-Polymers', cost: 90 },
                { id: 'cryo_polymer_network', name: 'Cryo-Polymer Networks', pop: biology.cryoPolymerNetworkPop, cap: 60.0, unit: 'Idx', req: 'Cyto-beasts > 30, Stability OR Nudge', nudgeId: 'cryo_polymer_network', nudgeName: 'Boot Cryo-Singularity Lattices', cost: 110 },
                { id: 'thinking_ocean', name: 'Thinking Methane Oceans', pop: biology.thinkingOceanPop, cap: 100.0, unit: 'Idx', req: 'Polymer Net > 40, Methane > 40% OR Nudge', nudgeId: 'colloidal_solids', nudgeName: 'Dissolve Computing Polymers', cost: 130 },
                { id: 'cryo_colloids', name: 'Megastructure Cryo-Colloids', pop: biology.cryoColloidPop, cap: 100.0, unit: 'Idx', req: 'Polymer Net > 40, Beasts > 45 OR Nudge', nudgeId: 'macromolecular_assembly', nudgeName: 'Assemble Colloidal structures', cost: 130 }
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
        
        let comparisonHTML = "";
        let earthMilestone = earthTimeline[node.id];
        if (!earthMilestone) {
            if (node.id === 'cryo_beasts') earthMilestone = earthTimeline['cryo_organisms'];
            if (node.id === 'cryo_colloids') earthMilestone = earthTimeline['cryo_colloid'];
        }

        if (earthMilestone) {
            const earthAge = earthMilestone.age;
            let unlockAge = biology.unlockAges ? biology.unlockAges[node.id] : null;
            if (unlockAge === undefined || unlockAge === null) {
                if (node.id === 'cryo_beasts') unlockAge = biology.unlockAges['cryo_organisms'];
                if (node.id === 'cryo_colloids') unlockAge = biology.unlockAges['cryo_colloid'];
            }
            
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

        this.nodeDetailsText.innerHTML = `
            <strong>Milestone Requirements:</strong> ${node.req}<br>
            <strong>Current Population:</strong> ${node.pop.toFixed(2)} / ${node.cap.toFixed(0)}<br>
            ${node.nudgeId ? `<strong>Gene Upgrade Nudge:</strong> ${node.nudgeName} (Allows unlocking or speeds up development).` : 'No manual gene upgrades for this branch.'}
            <div style="margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
                ${comparisonHTML}
            </div>
        `;

        const mutagen = (this.currentEventSystem && typeof this.currentEventSystem.tokensBlue === 'number') ? this.currentEventSystem.tokensBlue : 0;
        if (node.nudgeId && !biology.activeAdaptations.has(node.nudgeId)) {
            this.btnNudgeEvolution.style.display = 'block';
            const canAfford = mutagen >= node.cost;
            this.btnNudgeEvolution.disabled = !canAfford;
            if (canAfford) {
                this.btnNudgeEvolution.textContent = `🧬 Nudge Adaptations [${node.cost}🔹]`;
                this.btnNudgeEvolution.classList.remove('disabled');
            } else {
                this.btnNudgeEvolution.textContent = `🧬 Nudge Adaptations [${node.cost}🔹] (Need Mutagen)`;
                this.btnNudgeEvolution.classList.add('disabled');
            }
            this.btnNudgeEvolution.setAttribute('data-nudge', node.nudgeId);
            this.btnNudgeEvolution.setAttribute('data-cost', node.cost);
        } else if (node.nudgeId && biology.activeAdaptations.has(node.nudgeId)) {
            this.btnNudgeEvolution.style.display = 'block';
            this.btnNudgeEvolution.textContent = "✅ ADAPTATION ACTIVE";
            this.btnNudgeEvolution.disabled = true;
            this.btnNudgeEvolution.classList.remove('disabled');
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

        const hasSentient = biology.unlockedCognitive || biology.unlockedCrystallineCognitive || biology.unlockedThinkingOcean || 
                            biology.cognitiveSpeciesPop > 0.0 || biology.crystallineCognitivePop > 0.0 || biology.thinkingOceanPop > 0.0;
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
            const eukaryotesCap = biology.unlockedSexualReproduction ? 180 : 120;
            this.eukaryoticPop.textContent = `${biology.eukaryoticPop.toFixed(2)} M/mL`;
            this.eukaryoticProgress.style.width = `${(biology.eukaryoticPop / eukaryotesCap) * 100}%`;
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
        
        // Define sequence of milestones by solvent
        const solventMilestones = {
            water: [
                'soup', 'membrane', 'bacteria', 'anaerobic', 'anoxygenic_photo', 'photosynthetic', 'nucleus', 'mitochondria', 
                'eukaryotes', 'sexual', 'multicellular', 'sponges', 'meduses', 'worms', 'fish', 
                'mosses', 'ferns', 'conifers', 'angiosperms', 'cambrian', 'insects', 'tetrapods', 
                'sauropsids', 'synapsids', 'cognitive', 'ai', 'cyborg', 'noosphere', 'gaia_hivemind'
            ],
            ammonia: [
                'ammonic_soup', 'ammonic_proto', 'ammonic_multi', 'silico_flora', 'cryo_fauna', 
                'crystalline_cognitive', 'quantum_lattices', 'cryo_hivemind'
            ],
            methane: [
                'methane_soup', 'methane_proto', 'methane_multi', 'cryo_beasts', 'cryo_polymer_network', 
                'thinking_ocean', 'cryo_colloids'
            ]
        };

        const milestones = solventMilestones[solvent] || [];
        let latestUnlocked = null;
        let latestUnlockAge = null;

        // Helper to check unlock status with key fallbacks
        const getUnlockAge = (nodeId) => {
            if (!biology.unlockAges) return null;
            let age = biology.unlockAges[nodeId];
            if (age === undefined || age === null) {
                // Methane line naming fallbacks
                if (nodeId === 'cryo_beasts') age = biology.unlockAges['cryo_organisms'];
                if (nodeId === 'cryo_colloids') age = biology.unlockAges['cryo_colloid'];
            }
            return age;
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
            let earthMilestone = earthTimeline[latestUnlocked];
            // Fallbacks for earthTimeline lookup
            if (!earthMilestone) {
                if (latestUnlocked === 'cryo_beasts') earthMilestone = earthTimeline['cryo_organisms'];
                if (latestUnlocked === 'cryo_colloids') earthMilestone = earthTimeline['cryo_colloid'];
            }

            milestoneName = earthMilestone ? earthMilestone.name : latestUnlocked;
            
            if (earthMilestone) {
                const earthAge = earthMilestone.age;
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
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.bottom = '24px';
            container.style.right = '24px';
            container.style.zIndex = '10000';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '12px';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        
        toast.style.background = 'rgba(15, 23, 42, 0.9)';
        toast.style.backdropFilter = 'blur(8px)';
        toast.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        toast.style.color = 'var(--text-primary)';
        toast.style.padding = '0.75rem 1.25rem';
        toast.style.borderRadius = '8px';
        toast.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
        toast.style.fontSize = '0.85rem';
        toast.style.fontFamily = 'var(--font-sans)';
        toast.style.fontWeight = '600';
        toast.style.display = 'flex';
        toast.style.alignItems = 'center';
        toast.style.gap = '10px';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(15px)';
        toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

        let icon = '🎉';
        if (type === 'success') {
            toast.style.borderLeft = '4px solid var(--accent-green)';
            icon = '💾';
        } else if (type === 'hazard' || type === 'error') {
            toast.style.borderLeft = '4px solid var(--accent-red)';
            icon = '⚠️';
        } else if (type === 'info') {
            toast.style.borderLeft = '4px solid var(--accent-cyan)';
            icon = 'ℹ️';
        }

        toast.innerHTML = `<span style="font-size: 1.1rem; display: flex; align-items: center;">${icon}</span> <span>${message}</span>`;
        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 20);

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-15px)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
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
}
