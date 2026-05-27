import { getEvolutionNodes, getNodeBiomass } from './evolutionData.js';

/**
 * HistoryRecorder
 *
 * Fixed-capacity ring buffers of planet/biology metrics plus event markers.
 * Sampled on a real-time cadence (default 0.5 s) so the buffer captures
 * ~5 minutes of history at capacity 600. Pause freezes recording because
 * the caller (game.js) only ticks the recorder while isPlaying is true.
 */

const SERIES_KEYS = [
    'temperature',
    'waterCoverage',
    'radiation',
    'effectiveRadiation',
    'habitability',
    'co2',
    'n2',
    'o2',
    'anaerobic',
    'photosynthetic',
    'multicellular',
    'complex',
    'sentient'
];

export class HistoryRecorder {
    constructor({ capacity = 600, sampleIntervalSec = 0.5, markerCapacity = 256 } = {}) {
        this.capacity = capacity;
        this.sampleIntervalSec = sampleIntervalSec;

        this.series = {};
        this.simAges = new Float32Array(capacity);
        for (const key of SERIES_KEYS) {
            this.series[key] = new Float32Array(capacity);
        }

        this.writeIndex = 0;
        this.count = 0;
        this.accumulator = 0;

        this.markerCapacity = markerCapacity;
        this.markers = new Array(markerCapacity);
        this.markerWrite = 0;
        this.markerCount = 0;

        this.firstSimAgeMyr = 0;
        this.latestSimAgeMyr = 0;
        this.latestActiveSolvent = 'water';
    }

    reset() {
        this.writeIndex = 0;
        this.count = 0;
        this.accumulator = 0;
        this.markerWrite = 0;
        this.markerCount = 0;
        this.firstSimAgeMyr = 0;
        this.latestSimAgeMyr = 0;
        this.latestActiveSolvent = 'water';
        this.simAges.fill(0);
        for (const key of SERIES_KEYS) {
            this.series[key].fill(0);
        }
    }

    tick(realDtSec, planet, biology) {
        if (!(realDtSec > 0) || !planet || !biology) return;
        this.accumulator += realDtSec;
        if (this.accumulator < this.sampleIntervalSec) return;
        this.accumulator -= this.sampleIntervalSec;
        this._writeSample(planet, biology);
    }

    _writeSample(planet, biology) {
        const i = this.writeIndex;
        this.simAges[i] = planet.age;
        this.series.temperature[i] = planet.temperature;
        this.series.waterCoverage[i] = planet.waterCoverage;
        this.series.radiation[i] = planet.radiation;
        this.series.effectiveRadiation[i] = planet.getEffectiveRadiation();
        this.series.habitability[i] = planet.getHabitabilityScore();
        this.series.co2[i] = planet.co2;
        this.series.n2[i] = planet.n2;
        this.series.o2[i] = planet.o2;
        this.latestActiveSolvent = planet.activeSolvent;

        const biomassBuckets = this._getBiomassBuckets(planet.activeSolvent, biology);
        const anaerobicVal = biomassBuckets.anaerobic;
        const photosyntheticVal = biomassBuckets.photosynthetic;
        const multicellularVal = biomassBuckets.multicellular;
        const complexVal = biomassBuckets.complex;
        const sentientVal = biomassBuckets.sentient;

        this.series.anaerobic[i] = anaerobicVal;
        this.series.photosynthetic[i] = photosyntheticVal;
        this.series.multicellular[i] = multicellularVal;
        this.series.complex[i] = complexVal;
        this.series.sentient[i] = sentientVal;

        this.writeIndex = (i + 1) % this.capacity;
        if (this.count < this.capacity) this.count++;

        this.latestSimAgeMyr = planet.age;
        if (this.count === 1) this.firstSimAgeMyr = planet.age;
        else {
            // First sample still in the ring is the one at writeIndex when count === capacity,
            // or at 0 while ramping up.
            const oldestIdx = this.count < this.capacity ? 0 : this.writeIndex;
            this.firstSimAgeMyr = this.simAges[oldestIdx];
        }
    }

    _getBiomassBuckets(solvent, biology) {
        const buckets = {
            anaerobic: 0.0,
            photosynthetic: 0.0,
            multicellular: 0.0,
            complex: 0.0,
            sentient: 0.0
        };

        for (const node of getEvolutionNodes(solvent)) {
            const biomass = getNodeBiomass(biology, node);
            if (biomass <= 0) continue;

            if (node.clade === 'Intelligence' || node.clade === 'Technological') {
                buckets.sentient += biomass;
            } else if (['Chordata', 'Tetrapoda', 'Diapsida', 'Synapsida', 'Arthropoda', 'Fauna'].includes(node.clade)) {
                buckets.complex += biomass;
            } else if (node.clade === 'Metazoa' || node.clade === 'Eukaryota') {
                buckets.multicellular += biomass;
            } else if (node.clade === 'Flora' || node.id === 'photosynthetic' || node.id === 'anoxygenic_photo') {
                buckets.photosynthetic += biomass;
            } else if (node.clade === 'Prokaryota') {
                buckets.anaerobic += biomass;
            }
        }

        return buckets;
    }

    recordEvent(eventObj, simAgeMyr) {
        if (!eventObj) return;
        const category = this._classifyEvent(eventObj);
        const slot = this.markerWrite;
        this.markers[slot] = {
            simAgeMyr,
            label: eventObj.title || '',
            category,
            type: eventObj.type || 'system'
        };
        this.markerWrite = (slot + 1) % this.markerCapacity;
        if (this.markerCount < this.markerCapacity) this.markerCount++;
    }

    _classifyEvent(evt) {
        if (evt.tier) return evt.tier;
        const t = (evt.type || '').toLowerCase();
        if (t === 'success') return 'milestone';
        if (t === 'hazard') return 'hazard';
        if (t === 'alert') return 'alert';
        return 'system';
    }

    getSeries(key) {
        return {
            values: this.series[key],
            count: this.count,
            capacity: this.capacity,
            writeIndex: this.writeIndex
        };
    }

    getSimAges() {
        return {
            values: this.simAges,
            count: this.count,
            capacity: this.capacity,
            writeIndex: this.writeIndex
        };
    }

    getMarkers() {
        const out = [];
        for (let i = 0; i < this.markerCount; i++) {
            const idx = this.markerCount < this.markerCapacity
                ? i
                : (this.markerWrite + i) % this.markerCapacity;
            out.push(this.markers[idx]);
        }
        return out;
    }

    getAxisDomain() {
        return {
            startMyr: this.firstSimAgeMyr,
            endMyr: this.latestSimAgeMyr
        };
    }
}

export const HISTORY_SERIES_KEYS = SERIES_KEYS;
