/**
 * HistoryView — renders three stacked sparkline canvases (Environment,
 * Atmosphere, Biomass) from a HistoryRecorder and overlays event markers.
 *
 * Owns its own DPR-correct sizing — the main GameVisualizer does not use
 * devicePixelRatio, but small line charts need it to stay crisp.
 */

const PALETTE = {
    temperature: '#00f2fe',
    waterCoverage: '#10b981',
    radiation: '#f59e0b',
    habitability: '#a855f7',
    co2: '#ef4444',
    n2: '#94a3b8',
    o2: '#00f2fe',
    anaerobic: '#a855f7',
    photosynthetic: '#10b981',
    multicellular: '#f59e0b'
};

const MARKER_COLOR = {
    SINGULAR: 'rgba(245, 158, 11, 0.85)',
    MAJOR:    'rgba(168, 85, 247, 0.70)',
    NOTABLE:  'rgba(0, 242, 254, 0.55)',
    COMMON:   'rgba(148, 163, 184, 0.30)',
    milestone: 'rgba(0, 242, 254, 0.55)',
    hazard:    'rgba(239, 68, 68, 0.55)',
    alert:     'rgba(245, 158, 11, 0.5)',
    system:    'rgba(148, 163, 184, 0.35)'
};

const MARKER_WIDTH = {
    SINGULAR: 2,
    MAJOR: 1.5,
    NOTABLE: 1,
    COMMON: 1,
    milestone: 1,
    hazard: 1,
    alert: 1,
    system: 1
};

const GROUPS = {
    env: [
        { key: 'temperature', min: -100, max: 200 },
        { key: 'waterCoverage', min: 0, max: 100 },
        { key: 'radiation', min: 0, max: 10 },
        { key: 'habitability', min: 0, max: 100 }
    ],
    atm: [
        { key: 'co2', min: 0, max: 100 },
        { key: 'n2', min: 0, max: 100 },
        { key: 'o2', min: 0, max: 100 }
    ],
    bio: [
        { key: 'anaerobic', dynamicMax: 50 },
        { key: 'photosynthetic', dynamicMax: 50 },
        { key: 'multicellular', min: 0, max: 100 }
    ]
};

export class HistoryView {
    constructor({ envCanvasId, atmCanvasId, bioCanvasId, recorder }) {
        this.recorder = recorder;
        this.panels = [
            this._initPanel(envCanvasId, GROUPS.env),
            this._initPanel(atmCanvasId, GROUPS.atm),
            this._initPanel(bioCanvasId, GROUPS.bio)
        ];
        this._onResize = () => this._resizeAll();
        window.addEventListener('resize', this._onResize);
        this._resizeAll();
    }

    _initPanel(canvasId, series) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`HistoryView: missing canvas #${canvasId}`);
            return null;
        }
        return {
            canvas,
            ctx: canvas.getContext('2d'),
            series,
            cssWidth: 0,
            cssHeight: 0
        };
    }

    _resizeAll() {
        const dpr = window.devicePixelRatio || 1;
        for (const p of this.panels) {
            if (!p) continue;
            const rect = p.canvas.getBoundingClientRect();
            const w = Math.max(1, Math.floor(rect.width));
            const h = Math.max(1, Math.floor(rect.height));
            p.cssWidth = w;
            p.cssHeight = h;
            p.canvas.width = Math.floor(w * dpr);
            p.canvas.height = Math.floor(h * dpr);
            p.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
    }

    render() {
        const recorder = this.recorder;
        const domain = recorder.getAxisDomain();
        const ages = recorder.getSimAges();
        const markers = recorder.getMarkers();
        for (const panel of this.panels) {
            if (!panel) continue;
            this._renderPanel(panel, recorder, ages, domain, markers);
        }
    }

    _renderPanel(panel, recorder, ages, domain, markers) {
        const { ctx, cssWidth: w, cssHeight: h, series } = panel;
        ctx.clearRect(0, 0, w, h);

        this._drawGrid(ctx, w, h);

        const count = ages.count;
        if (count < 2) {
            this._drawEmptyHint(ctx, w, h);
            return;
        }

        // Walk chronological order from oldest to newest.
        const cap = ages.capacity;
        const writeIdx = ages.writeIndex;
        const startIdx = count < cap ? 0 : writeIdx;

        // X-axis domain: use sample index for stable spacing (avoids gaps
        // when sim age increments are uneven). Markers map via age below.
        const xStep = count > 1 ? w / (count - 1) : w;

        for (const spec of series) {
            const data = recorder.getSeries(spec.key);
            const values = data.values;
            const { min, max } = this._resolveDomain(spec, values, count, cap, startIdx);
            if (max <= min) continue;

            ctx.beginPath();
            ctx.lineWidth = 1.5;
            ctx.lineJoin = 'round';
            ctx.strokeStyle = PALETTE[spec.key] || '#fff';

            for (let i = 0; i < count; i++) {
                const idx = (startIdx + i) % cap;
                const v = values[idx];
                const clamped = Math.max(min, Math.min(max, v));
                const y = h - ((clamped - min) / (max - min)) * (h - 4) - 2;
                const x = i * xStep;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Event markers — map sim-age to chronological index using ages buffer.
        if (markers.length > 0 && domain.endMyr > domain.startMyr) {
            const span = domain.endMyr - domain.startMyr;
            for (const m of markers) {
                if (m.simAgeMyr < domain.startMyr || m.simAgeMyr > domain.endMyr) continue;
                const t = (m.simAgeMyr - domain.startMyr) / span;
                const x = t * w;
                ctx.beginPath();
                ctx.strokeStyle = MARKER_COLOR[m.category] || MARKER_COLOR.system;
                ctx.lineWidth = MARKER_WIDTH[m.category] || 1;
                ctx.moveTo(x + 0.5, 0);
                ctx.lineTo(x + 0.5, h);
                ctx.stroke();
            }
        }
    }

    _resolveDomain(spec, values, count, cap, startIdx) {
        if (typeof spec.min === 'number' && typeof spec.max === 'number') {
            return { min: spec.min, max: spec.max };
        }
        let max = spec.dynamicMax || 1;
        for (let i = 0; i < count; i++) {
            const idx = (startIdx + i) % cap;
            const v = values[idx];
            if (v > max) max = v;
        }
        return { min: 0, max };
    }

    _drawGrid(ctx, w, h) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Horizontal midline + quartiles
        for (let i = 1; i < 4; i++) {
            const y = Math.floor((h / 4) * i) + 0.5;
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }
        ctx.stroke();
    }

    _drawEmptyHint(ctx, w, h) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText('awaiting samples…', 8, h / 2);
    }

    destroy() {
        window.removeEventListener('resize', this._onResize);
    }
}
