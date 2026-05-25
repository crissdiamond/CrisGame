# Plan 01 — Planet Health History Graphs

**Goal:** Add a time-series ring buffer over key planetary + biological metrics, render them as stacked sparklines in a new dashboard panel, and overlay vertical markers for major events (GOE, glaciation, impacts, life-stage milestones).

**Why this slice:** EvoPlanet currently shows present-tense state. Astrobiology stories — oxygenation lag, glaciation recovery, extinction arcs — only become legible across time. This unlocks Objectives (TODO #1) and Preset comparison (TODO #5) by giving them a substrate to read from.

**Out of scope:** Win/lose conditions, presets, exports, zoom/pan interactions. First pass shows the last ~5 minutes of real time on a fixed window.

---

## Phase 0 — Documentation Discovery (DONE — facts to use)

All subsequent phases must treat these as ground truth. Re-verify a line number if you edit nearby code first.

### Game loop facts (`js/game.js`)
- RAF loop entry: `game.js:130` (initial) and `game.js:192` (tail).
- Delta-time: `const dt = (timestamp - this.lastTime) / 1000.0;` (`game.js:136-139`).
- Time scale: `this.timeScale = 0.1` (`game.js:21`) → 1 real second ≈ 0.1 Myr sim-time.
- Tick variable consumed by sub-systems: `tickRate = dt * this.timeScale` (`game.js:144`).
- Per-tick update order (`game.js:147-189`, conditional on `isPlaying && dt > 0`):
  1. `this.biology.update(tickRate, this.planet)` — **returns `{ events, biologicalImpact }`** at `game.js:147`.
  2. `this.eventSystem.tick(this.planet, this.biology, tickRate)` — **returns `outputLogs[]`** at `game.js:160`.
  3. `this.planet.update(tickRate, bioUpdate.biologicalImpact)` at `game.js:173`.
  4. `this.visualizer.draw(this.planet, this.biology)` at `game.js:177`.
  5. `this.ui.updateDashboard(this.planet, this.biology)` at `game.js:180`.

### Sample sources (exact identifiers)
| Metric | Path | Defined |
|---|---|---|
| Temperature (current, °C) | `planet.temperature` | `planet.js:7` |
| Water coverage (%) | `planet.waterCoverage` | `planet.js:8` |
| Radiation (effective, shielded) | `planet.getEffectiveRadiation()` | `planet.js:378-384` |
| CO₂ % | `planet.co2` | `planet.js:21` |
| N₂ % | `planet.n2` | `planet.js:22` |
| O₂ % | `planet.o2` | `planet.js:23` |
| Anaerobic pop (M cells/mL) | `biology.anaerobicPop` | `simulation.js:11` |
| Photosynthetic pop | `biology.photosyntheticPop` | `simulation.js:12` |
| Multicellular complexity 0–100 | `biology.multicellularPop` | `simulation.js:14` |
| Habitability score 0–100 | `planet.getHabitabilityScore()` | `planet.js:319-376` |
| Sim age (Myr) | `planet.age` (incremented `planet.js:391`) | `planet.js:36` |

### Reset semantics
- No standalone reset. Re-init path is `onLaunch` (`game.js:57-63`) which calls `planet.initializeProtoplanet(config)` and re-news `BiologySimulation` + `EventSystem`. **The history module must clear its buffer in the same path.** It will set `planet.age = 0.0` at line 82 — use that as the "fresh start" signal.

### UI / CSS facts
- Panel markup pattern (`index.html:46-93`, CSS `style.css:159-176`):
  ```html
  <section class="panel glass-card" id="history-panel">
      <h2 class="panel-title">Planet Health History</h2>
      <!-- body -->
  </section>
  ```
- Dashboard grid (`style.css:143-149`): 3 cols (`320px minmax(0,1fr) 340px`), 2 rows. **A full-width second-row panel uses `grid-column: 1 / span 3;`** (precedent: `style.css:619`).
- CSS variables to reuse (`style.css:5-35`): `--accent-cyan #00f2fe`, `--accent-green #10b981`, `--accent-purple #a855f7`, `--accent-amber #f59e0b`, `--accent-red #ef4444`, `--text-muted #64748b`, `--font-mono 'JetBrains Mono'`.
- Telemetry label pattern for axis-style readouts (`style.css:436-449`, used at `index.html:112-124`): `.telemetry-item > .label` (0.65rem, mono, muted) and `.value` (0.95rem, bold).

### Canvas/visualization facts (`js/visualization.js`)
- `GameVisualizer` owns one canvas, resizes via `window.addEventListener('resize', ...)` at line 24 and a `resize()` method at line 38–46.
- **No DPR scaling currently** (`canvas.width = container.clientWidth`). The sparkline renderer **should add DPR** because text/lines at small sizes look bad without it — this is an additive improvement, not a refactor of the existing main canvas.
- Colors are hard-coded rgba/hex strings in JS, not pulled from CSS vars. Match that convention for the sparklines (define a local palette object that mirrors the CSS accent values).

### Event signaling facts (`js/events.js`, `js/ui.js`)
- Feed pipeline: `GameUI.logEvent(title, desc, type)` at `ui.js:479-488`. Currently wall-clock timestamp only.
- Two arrays of milestone/event objects flow through `game.js` each tick:
  - `bioUpdate.events` from `biology.update()` at `game.js:147` — milestone unlocks (anaerobic, photosynthetic, GOE, multicellular, etc.). See `simulation.js:155-311+` for emission sites and `simulation.js:240-248` for GOE specifically.
  - `eventOutput` from `eventSystem.tick()` at `game.js:160` — hazards/bonuses (impactor, glaciation, solar flare, GRB, etc.). Registry at `events.js:54-257`.
- **Recommended capture hook:** intercept both arrays in `game.js` after they are produced and before they are passed to `logEvent`. No refactor of emission sites needed. Stamp each captured event with `simAgeMyr: planet.age` at capture time.

### Anti-patterns to avoid
- Do **not** invent a global event bus or pub/sub system. The two return arrays in `game.js` are already a clean choke point.
- Do **not** sample inside `requestAnimationFrame` at 60 Hz; that fills the buffer with redundant data and risks GC churn. Use a sim-time-based throttle (see Phase 1).
- Do **not** mutate `planet` or `biology` from the history module — read-only.
- Do **not** rely on `setInterval` — drift desyncs from the paused-game state. Tick from inside `game.js`'s existing loop.

---

## Phase 1 — `js/history.js` ring-buffer module

**What to build (new file):** `js/history.js` exporting a `HistoryRecorder` class.

**Responsibilities (only these):**
1. Hold ring buffers for ~10 metric series.
2. Hold a separate ring buffer of event markers `{ simAgeMyr, label, category }`.
3. Provide `sample(planet, biology)` and `recordEvent(eventObj, simAgeMyr)` methods.
4. Provide `reset()` to clear all buffers.
5. Provide `getSeries(key)` and `getMarkers()` accessors that return read-only views (slice copies are fine — the data is small).

**Sizing math:** Sample once per 0.5 s of real time → 600 samples covers 5 minutes. Use a fixed-size `Float32Array(600)` per metric plus a `writeIndex` and `count`. The throttle lives inside `HistoryRecorder` (accumulate `dt` passed in by caller; emit one sample when accumulator ≥ 0.5).

**Metrics to record (exactly these series keys):**
- Environment group: `temperature`, `waterCoverage`, `radiation` (effective), `habitability`.
- Atmosphere group: `co2`, `n2`, `o2`.
- Biomass group: `anaerobic`, `photosynthetic`, `multicellular`.

**Public API shape (suggested, not prescriptive):**
```js
export class HistoryRecorder {
  constructor({ capacity = 600, sampleIntervalSec = 0.5 } = {}) { ... }
  tick(realDtSec, planet, biology) { /* throttled sample */ }
  recordEvent(event, simAgeMyr) { /* push to marker ring */ }
  reset() { /* zero all buffers, reset indices */ }
  getSeries(key) { /* returns { values: Float32Array, count, capacity } */ }
  getMarkers() { /* returns array view */ }
  getAxisDomain() { /* returns { startMyr, endMyr } for x-axis */ }
}
```

**Verification:**
- Open `http://localhost:8080`, launch a planet, let it run 30 s, open devtools console: `game.history.getSeries('temperature').count` should be ~60.
- Pause, wait 10 s, unpause — `count` should NOT have grown during the pause (because `game.js` skips the update block when `!isPlaying`).
- Reset planet via setup modal — `count` returns to 0.

**Anti-patterns:**
- No timers inside the module. Throttle by accumulating the `realDtSec` argument.
- Don't allocate inside `tick()` after construction. Pre-allocate Float32Arrays once.

---

## Phase 2 — Wire `HistoryRecorder` into `game.js`

**What to change in `js/game.js`:**
1. Import `HistoryRecorder` from `./history.js`.
2. Construct `this.history = new HistoryRecorder()` near where `this.biology` and `this.eventSystem` are constructed (`game.js:57-63`). Re-construct on `onLaunch` too, OR call `this.history.reset()` there — pick reset to preserve identity for the UI binding.
3. **Sampling call site:** inside the `isPlaying && dt > 0` block, **after** `planet.update()` runs (i.e. after `game.js:173`) so the sample reflects this tick's post-update state. Pass real-time `dt` (the unscaled one), not `tickRate`, so sampling cadence is independent of `timeScale`.
4. **Event capture call sites:**
   - Right after `game.js:147`, iterate `bioUpdate.events` and call `this.history.recordEvent(ev, this.planet.age)` for each.
   - Right after `game.js:160`, iterate `eventOutput` and do the same.
   - Do this **before** the existing `forEach(...) => this.ui.logEvent(...)` loops — order does not matter functionally, but grouping the capture next to the emission makes the intent obvious.

**Verification:**
- After launching and letting the simulation run, console-inspect `game.history.getMarkers()` — should contain at least one entry once any milestone or event has fired (e.g. "Prebiotic Soup Synthesized").

**Anti-patterns:**
- Don't sample in the `else` branch of the play check — pausing should freeze history.
- Don't sample before `planet.update()` runs — you'd record the previous tick's state.

---

## Phase 3 — Panel markup + canvases (`index.html`, `css/style.css`)

**What to add to `index.html`:** A new `<section class="panel glass-card" id="history-panel">` placed in the dashboard grid. **Use full-width row placement (`grid-column: 1 / span 3`)** — graphs need horizontal real estate, and the precedent for full-row panels already exists in `style.css:619`.

Panel body contains three `<canvas>` elements wrapped in containers, each with a label strip:

```html
<section class="panel glass-card" id="history-panel">
  <h2 class="panel-title">Planet Health History</h2>
  <div class="history-row">
    <div class="history-label-col">
      <span class="label">ENVIRONMENT</span>
      <span class="history-legend">
        <em class="dot env-temp"></em>Temp
        <em class="dot env-water"></em>Water
        <em class="dot env-rad"></em>Rad
        <em class="dot env-hab"></em>Habit.
      </span>
    </div>
    <canvas class="history-canvas" id="history-env"></canvas>
  </div>
  <div class="history-row">
    <div class="history-label-col">
      <span class="label">ATMOSPHERE</span>
      <span class="history-legend">
        <em class="dot atm-co2"></em>CO₂
        <em class="dot atm-n2"></em>N₂
        <em class="dot atm-o2"></em>O₂
      </span>
    </div>
    <canvas class="history-canvas" id="history-atm"></canvas>
  </div>
  <div class="history-row">
    <div class="history-label-col">
      <span class="label">BIOMASS</span>
      <span class="history-legend">
        <em class="dot bio-anaerobic"></em>Anaerobic
        <em class="dot bio-photo"></em>Photo.
        <em class="dot bio-multi"></em>Multi.
      </span>
    </div>
    <canvas class="history-canvas" id="history-bio"></canvas>
  </div>
</section>
```

**CSS to add in `css/style.css`** (keep all values consistent with existing tokens, see Phase 0 fact list):
- `#history-panel { grid-column: 1 / span 3; }` — full width, second row.
- `.history-row { display: grid; grid-template-columns: 130px 1fr; gap: 1rem; align-items: stretch; min-height: 110px; }`
- `.history-label-col` uses the existing `.label` 0.65rem mono muted style. Legend dots are 8px squares with `border-radius: 2px`.
- `.history-canvas { width: 100%; height: 110px; background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); border-radius: 8px; display: block; }`
- Legend dot colors map 1:1 to the JS palette in Phase 4 (so a future colorblind theme can edit both together). Reuse `--accent-cyan` (temp), `--accent-green` (water/photo/o2), `--accent-amber` (radiation/multi), `--accent-purple` (habitability), `--text-muted` (n2), `--accent-red` (co2), and pick reasonable accents for biomass.

**Verification:**
- Load page, panel renders below the existing dashboard row, spans full width, glass effect matches sibling panels.
- Three canvases visible, empty (black-ish), with labels and legend dots beside them.

**Anti-patterns:**
- Don't set `width`/`height` HTML attributes on the canvases — the renderer in Phase 4 sets backing-store size with DPR. CSS sizes them.
- Don't introduce new CSS variables; use the existing palette.

---

## Phase 4 — `js/historyView.js` sparkline renderer

**What to build (new file):** `js/historyView.js` exporting a `HistoryView` class.

**Responsibilities:**
1. Take `{ envCanvasId, atmCanvasId, bioCanvasId, recorder }` and cache 2D contexts.
2. Implement DPR-correct sizing: `canvas.width = clientWidth * dpr; canvas.height = clientHeight * dpr; ctx.scale(dpr, dpr);` — this is **new for this project**; do not change the main visualizer.
3. Listen to `window.resize` (debounce optional, not required for first pass).
4. Expose `render()` to be called once per frame from `game.js`.
5. Each call clears its canvases and re-draws polylines from `recorder.getSeries(key)` plus event marker vertical lines from `recorder.getMarkers()`.

**Rendering rules per panel:**
- X axis: index 0 → leftmost, latest → rightmost. No labels in first pass (the panel title and the trailing edge being "now" is sufficient).
- Y axis: per-series min/max picked from sensible domains so different units don't fight:
  - `temperature`: domain `[-100, 200]` °C (matches slider range).
  - `waterCoverage`, `co2`, `n2`, `o2`, `habitability`: `[0, 100]`.
  - `radiation`: `[0, 10]` rad/s (saturate above).
  - `anaerobic`, `photosynthetic`: `[0, max(50, observedMax)]` — log-ish is overkill; use observed-max with a floor.
  - `multicellular`: `[0, 100]` (it's already a 0–100 complexity index per `simulation.js:14`).
- Line width 1.5 px (post-DPR scale), no fill, anti-aliasing by default. Pick distinct stroke colors matching the legend dots.
- Event markers: a 1px vertical line spanning the panel height, color by category (hazard = red-amber, milestone = cyan-green). Map `simAgeMyr` to x using `recorder.getAxisDomain()`.
- If `series.count < 2`, skip drawing the polyline for that series (avoids degenerate paths).

**Wire-up in `game.js`:**
- Construct `this.historyView = new HistoryView({ envCanvasId: 'history-env', atmCanvasId: 'history-atm', bioCanvasId: 'history-bio', recorder: this.history })` after `this.ui` is constructed.
- Call `this.historyView.render()` once per frame, **after** `this.ui.updateDashboard(...)` (`game.js:180`). Render even when paused (so the panel doesn't go blank visually) — but since sampling is gated by `isPlaying`, the lines simply won't grow.

**Verification:**
- Launch planet, let run 30 s, three sparklines visibly trail across the panels.
- Trigger a milestone (e.g. wait for prebiotic soup): a vertical marker line appears on all three panels at the corresponding x position.
- Resize the browser window: canvases re-fit, lines remain crisp (no blur — confirms DPR scaling).
- Pause: render keeps drawing the existing trail, no new samples appear.

**Anti-patterns:**
- Don't redraw event markers as a separate canvas overlay — draw them onto each sparkline canvas in the same `render()` to keep alignment trivial.
- Don't `getComputedStyle` for colors every frame — define a `PALETTE` const at module scope.
- Don't allocate arrays inside `render()` — iterate the underlying Float32Array directly using `count` and `writeIndex` to walk in chronological order.

---

## Phase 5 — Verification

Run all of the following before declaring done.

1. **Server:** `python3 server.py`, open `http://localhost:8080`.
2. **Golden path:** Launch a default planet, let it run for ~2 minutes at default speed. Confirm:
   - Environment sparkline shows temperature settling and habitability rising.
   - Atmosphere sparkline shows N₂ baseline and CO₂/O₂ moving as biology kicks in.
   - Biomass sparkline shows anaerobic rising, photosynthetic appearing later.
   - At least 2 event markers visible (e.g. prebiotic soup unlock, first anaerobes).
3. **GOE check:** Increase radiation slightly to encourage photosynthetic mutation. When `o2` crosses 15% (`simulation.js:240-248` should log "GREAT OXIDATION EVENT"), a marker line should appear at that x position on all three panels simultaneously.
4. **Pause behavior:** Pause, wait 20 s, unpause. The trailing edge should NOT show a flat plateau for those 20 s; instead the new samples should continue from where they left off.
5. **Reset behavior:** Open setup modal and launch a new planet. All sparklines clear; markers clear.
6. **Resize:** Halve the browser width. Canvases re-fit. No visible blur on lines (DPR check).
7. **Console hygiene:** No errors in devtools console during any of the above. No new warnings.
8. **Grep checks (anti-pattern guards):**
   - `grep -n "setInterval" js/history.js js/historyView.js` → no matches.
   - `grep -n "getComputedStyle" js/historyView.js` → no matches inside a render hot path (constructor OK).
   - `grep -n "new Float32Array" js/history.js` → matches present (confirms pre-allocation).
   - `grep -n "new Array\|\.push(" js/historyView.js` inside `render()` body → no matches (no per-frame allocation).
9. **File sizes:** `wc -l js/history.js js/historyView.js` — both should be modest (history.js ~120 lines, historyView.js ~180 lines). If significantly larger, an abstraction has crept in — review.

---

## Follow-on plans this unblocks

- **Plan 02 — Objectives**: pick a win condition (e.g. "sustain `multicellular ≥ 50` for 120 real seconds") and use `recorder.getSeries('multicellular')` to drive a progress bar.
- **Plan 05 — Planet Presets**: with history graphs in place, A/B comparing presets becomes meaningful.
- **Plan 04 — Extinction & Recovery Arcs**: extinction severity is a function over the multicellular/photosynthetic series; the buffer is the natural input.
