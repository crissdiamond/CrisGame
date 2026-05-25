# Plan 02 — Life Timeline Rework: Rarity Tiers, Stochastic Breakthroughs, Solvent-Specific Bottlenecks

**Goal:** Replace deterministic stage unlocks with scientifically calibrated stochastic breakthroughs. Each transition gets a rarity tier (Common / Notable / Major / Singular), a base Poisson firing rate while its gate is satisfied, a token reward proportional to that rarity, and per-solvent slowdown multipliers (ammonia chemistry slower, methane chemistry much slower).

**Design decisions confirmed with user:**
- **Pace:** Singular events fire at ~0.3/Myr (avg ~33 s real-time once gated; worst case ~100 s).
- **Nudges buy odds, not outcomes.** Spending nudge tokens applies a ×20 rate multiplier for 5 Myr; the gate roll still has to land. Re-buyable.
- **UI:** Tier-tagged feed entries (`[SINGULAR +25T]`), Major/Singular fire the existing milestone popup, sparkline markers vary by tier.

**Why it matters (vision alignment):** Per AGENT.md §2, "evolution timelines should respect the broad order and dependency structure understood from Earth history and astrobiology." Today the code treats endosymbiosis (a likely-singular event in Earth's 4.5 Gyr history) identically to a fern's appearance after mosses (which followed quickly). That contradicts the vision. This plan fixes the gradient without making the game unplayable.

**Out of scope:**
- Adding entirely new life stages (e.g. a "frog" between tetrapod and amniote). The current 41 stages are kept; only their tier + stochasticity changes. New stages can come in a follow-on plan.
- Rebalancing intervention/deflection costs. Only token *awards* change.
- Persistence between sessions. Tier metadata is in-code only.

---

## Phase 0 — Audit findings (DONE)

### Current state (from completed audit)

**Stage count:** 41 transitions across 3 solvents — Water 26, Ammonia 8, Methane 7. All defined in `js/simulation.js:140-1230`.

**Determinism:** All 41 transitions except photosynthesis (`simulation.js:212-213`) are purely deterministic gate-flips. They fire on the first tick the gate is satisfied. Most "adaptation OR age > X" gates degrade to deterministic given enough sim time.

**Token model:** Flat `+5.0` per milestone (`events.js:626-637`), capped at 99. Starting balance 15. Nudge costs 8–20. Intervention costs 6–15. Threat deflection 3–30. Award is silent — no popup, no toast.

**Solvent coverage:** Three branches (`waterCoverage`, `ammoniaCoverage`, `methaneCoverage` on planet) with their own progression chains. Today they share identical structural pacing; only thresholds and event copy differ.

### Anti-patterns the new code must avoid

- **Don't break savefile shape** — there is no save system, but `biology` is reconstructed on `onLaunch` (`game.js:59`). The new fields must initialize cleanly in the constructor.
- **Don't allocate per-tick.** The rate-multiplier table is on `biology`; updates mutate it in place.
- **Don't introduce per-frame `Math.random()` for stages still gated off.** Roll only when the gate condition holds.
- **Don't bypass the existing `events`/`outputLogs` pipeline.** The new tier and token-amount fields ride on those same payload objects so `game.js` doesn't need to learn a new fan-out.
- **Don't double-award.** The current `prevUnlocks` reward loop in `events.js` must be the single source of truth for token awards on unlock; the tier amount is looked up there.

---

## Phase 1 — Rarity infrastructure in `simulation.js`

### What to build (in `js/simulation.js`)

A small infrastructure block at the top of the module:

```js
export const RARITY = Object.freeze({
    COMMON:    { name: 'COMMON',    rate: 10.0, award: 2  },
    NOTABLE:   { name: 'NOTABLE',   rate: 2.0,  award: 5  },
    MAJOR:     { name: 'MAJOR',     rate: 0.7,  award: 12 },
    SINGULAR:  { name: 'SINGULAR',  rate: 0.3,  award: 25 }
});
```

- `rate` is **Poisson rate per Myr** while the gate is satisfied. Expected wait once gated ≈ 1/rate Myr.
- `award` is the token bounty on fire.

### Solvent slowdown

Different chemistries have different kinetics. Apply a multiplier on the effective rate, not on the gate:

```js
const SOLVENT_RATE_FACTOR = { water: 1.0, ammonia: 0.7, methane: 0.5 };
```

Rationale (anchor in AGENT.md vision):
- **Water:** Earth baseline. ×1.0.
- **Ammonia:** Lower freezing/working temps → slower reaction kinetics, weaker H-bonding → ×0.7.
- **Methane:** Apolar solvent, no proton chemistry, azotosome membranes hypothetical → ×0.5. (Eukaryote-analogue here is therefore much rarer in wall-clock — by design.)

### Condition-richness bonus

A breakthrough fires faster when its gate is well-exceeded, not just barely satisfied. Each transition gets an optional `conditionScore(planet, biology) -> [1.0 ... 4.0]` function returning a multiplier on the rate. Where omitted, defaults to 1.0.

Example (eukaryogenesis):
```js
conditionScore(planet, biology) {
    // O2 well above the 1.2 threshold and a thick nucleated population both matter
    const o2Score = clamp((planet.o2 - 1.2) / 5.0, 0, 1);    // 0..1 as O2 climbs to ~6%
    const popScore = clamp(biology.anaerobicPop / 60, 0, 1); // ample host population
    return 1.0 + 3.0 * (0.6 * o2Score + 0.4 * popScore);     // 1.0..4.0
}
```

### Pending-nudge rate multipliers (the "buy odds" lever)

A map on `BiologySimulation`:
```js
this.pendingNudges = {}; // { 'endosymbiosis': { multiplier: 20, remainingMyr: 5.0 } }
```

Tick decay (called from `biology.update`):
```js
_decayPendingNudges(tickRate) {
    for (const id in this.pendingNudges) {
        this.pendingNudges[id].remainingMyr -= tickRate;
        if (this.pendingNudges[id].remainingMyr <= 0) delete this.pendingNudges[id];
    }
}
```

### The roll helper

A single method on `BiologySimulation`:
```js
tryFire(transitionKey, baseRarity, conditionMult, tickRate, planet) {
    const solventMult = SOLVENT_RATE_FACTOR[planet.activeSolvent] ?? 1.0;
    const nudgeMult = this.pendingNudges[transitionKey]?.multiplier ?? 1.0;
    const lambda = baseRarity.rate * solventMult * conditionMult * nudgeMult;
    // Per-tick fire probability for a Poisson process: 1 - exp(-lambda * tickRate)
    const p = 1 - Math.exp(-lambda * tickRate);
    return Math.random() < p;
}
```

Why Poisson and not "raw probability ≥ threshold": Poisson is correct for an event with constant hazard rate sampled at varying `tickRate`. The `1 - exp(-λΔt)` form is numerically stable at small and large `λΔt` and time-step-invariant — speeding up `timeScale` shortens wall-clock but does not bias the math.

### Verification (Phase 1 only)

- `node --check js/simulation.js` passes.
- Open devtools, run: `game.biology.tryFire('test', { rate: 1.0 }, 1, 0.001, game.planet)` 10,000 times in a tight loop. Empirical hit rate should be ≈ `1 - exp(-1.0 × 0.001)` ≈ 0.001. (Sanity check that the math is wired.)
- `game.biology.pendingNudges` exists and is empty.

### Anti-patterns

- Don't bake solvent multiplier into the gate condition. Keep gate = "is this even possible right now," rate = "how fast given it's possible."
- Don't cache `Math.random()`'s prior values for "fairness." Players who never see a Singular get unlucky; that's the design.

---

## Phase 2 — Retier the 41 transitions

This phase rewrites the unlock blocks in `simulation.js` to call `tryFire(...)` and assigns a tier per transition. The gate condition itself stays the same in almost every case — only the unlock side changes from `if (gate) { unlock }` to `if (gate && this.tryFire(key, RARITY.X, conditionScore, tickRate, planet)) { unlock }`.

### Tier assignment (with scientific rationale)

#### Water line (26 transitions)

| Stage | Tier | Rationale |
|---|---|---|
| Primordial soup | **COMMON** | Miller-Urey-type chemistry runs readily in a wet, warm planet. |
| Membrane | **COMMON** | Lipid bilayers self-assemble spontaneously above CMC. |
| Anaerobic bacteria | **NOTABLE** | Abiogenesis-equivalent. We don't know if it's hard, but the *only* hard step we can reason about astrobiologically is metabolism→heredity coupling. Notable, not Major. |
| Photosynthesis (oxygenic) | **MAJOR** | Evolved once on Earth, ~2.7 Gya. Light-harvesting via water-splitting required two photosystems in series. |
| Cellular nucleus | **NOTABLE** | Membrane invagination; plausible without endosymbiosis. |
| **Mitochondria / Eukaryotic cell** | **SINGULAR** | Single most likely singular event in Earth history. Two prokaryotes had to merge stably *once*. All eukaryotes descend from that event. |
| Sexual reproduction | **MAJOR** | Once in eukaryote stem; never reinvented. Requires meiosis machinery. |
| Multicellularity | **NOTABLE** | Evolved ≥25 independent times on Earth (plants, animals, fungi, several algae). Common given eukaryotes. |
| Sponges | **NOTABLE** | First animal grade; appears once but quickly once multicellular animals exist. |
| Meduses (jellyfish) | **COMMON** | Quickly follows sponges given oxygenation. |
| Worms (bilateral) | **NOTABLE** | Bilateria itself is a clade radiation; once is enough. |
| Fish (vertebrates) | **NOTABLE** | Notochord lineage is one of many bilaterian body plans. |
| Cambrian explosion | **NOTABLE** | An ecological radiation, not a single event — but distinctly fast and unusual. |
| Mosses | **NOTABLE** | Terrestrialization of plants happened once but quickly given UV shielding. |
| Ferns | **COMMON** | Vascular elaboration is a gradient. |
| Conifers (gymnosperms) | **COMMON** | Seed evolution is a gradient given vascular plants. |
| Angiosperms | **NOTABLE** | Flower/fruit syndrome once on Earth, but evolved fast in mid-Mesozoic. |
| Arthropods | **NOTABLE** | Exoskeleton + jointed limbs is one of several body plans. |
| **Tetrapods (limbed land animals)** | **MAJOR** | Sarcopterygian → land happened essentially once. The wrist/finger/lung combo. |
| Sauropsids (reptile branch) | **NOTABLE** | Crown group radiation after amniote split. |
| Synapsids (mammal branch) | **NOTABLE** | Same — crown group radiation. |
| **Cognitive species** | **MAJOR** | Tool-using vertebrate-grade cognition. Earth has multiple cognitive lineages (corvids, cetaceans, primates), so Major not Singular. |
| Technological AI | **MAJOR** | Equivalent to industrial-singularity transition. |
| Cyborg integration | **NOTABLE** | A continuation of technological lineage; less of a phase shift. |
| Noosphere | **MAJOR** | Planet-wide cognitive integration is a phase change. |
| Gaia hivemind | **SINGULAR** | A coupled bio-tech-planet superorganism. Singular by definition. |

#### Ammonia line (8 transitions) — all rates × 0.7 via solvent factor

| Stage | Tier |
|---|---|
| Ammonic soup | COMMON |
| Ammonic prokaryotes | NOTABLE |
| Ammonic multicellular | **MAJOR** (no oxygen analogue to drive complex biochem) |
| Silico-flora | NOTABLE |
| Cryo-fauna | NOTABLE |
| Crystalline cognitive | **MAJOR** |
| Quantum lattices | **SINGULAR** |
| Cryo-hivemind | **SINGULAR** |

#### Methane line (7 transitions) — all rates × 0.5 via solvent factor

| Stage | Tier |
|---|---|
| Hydrocarbon soup | COMMON |
| Methanotrophic prokaryotes | **MAJOR** (azotosome stability hypothetical) |
| Methane multicellular | **SINGULAR** |
| Cryo-organisms | **MAJOR** |
| Cryo-polymer networks | **MAJOR** |
| Thinking oceans | **SINGULAR** |
| Cryo-colloids | **SINGULAR** |

### Implementation pattern (copy this exact shape per unlock block)

**Before** (e.g. mitochondria, current `simulation.js:262-273`):
```js
if ((this.unlockedNucleus && (planet.o2 > 1.2 || this.activeAdaptations.has('endosymbiosis'))) && !this.unlockedMitochondria) {
    this.unlockedMitochondria = true;
    this.unlockedEukaryotic = true;
    this.eukaryoticPop = 1.0;
    events.push({ title: "⚡ MITOCHONDRIA ENDOSYMBIOSIS", desc: "...", type: "success" });
}
```

**After:**
```js
const eukaryoteGate =
    this.unlockedNucleus &&
    planet.o2 > 1.2 &&                       // gate is the *condition*, not the nudge
    !this.unlockedMitochondria;

if (eukaryoteGate) {
    const condMult = 1.0
        + 3.0 * Math.min(1, (planet.o2 - 1.2) / 5.0) * 0.6
        + 3.0 * Math.min(1, this.anaerobicPop / 60) * 0.4;

    if (this.tryFire('endosymbiosis', RARITY.SINGULAR, condMult, tickRate, planet)) {
        this.unlockedMitochondria = true;
        this.unlockedEukaryotic = true;
        this.eukaryoticPop = 1.0;
        events.push({
            title: "⚡ MITOCHONDRIA ENDOSYMBIOSIS",
            desc: "...",                     // keep existing flavor
            type: "success",
            tier: RARITY.SINGULAR.name,      // NEW
            tokens: RARITY.SINGULAR.award,   // NEW
            unlockKey: 'unlockedMitochondria' // NEW — matches prevUnlocks key
        });
    }
}
```

Notes:
- The old `activeAdaptations.has('endosymbiosis')` OR-fallback is removed. Nudges no longer bypass the roll — they live in `pendingNudges` and multiply the rate. (See Phase 3.)
- Time-fallback gates like `planet.age > 30` are also removed where they were the *only* way for stochasticity to be skipped. For some Common-tier transitions where the original code's age-fallback was the only path (because no Math.random branch existed), removing it is fine: the new Common rate of 10/Myr fires in ~0.1 Myr anyway.
- Keep all event copy strings byte-identical (preserves the "ANGIOSEPRM" typo — fix separately if desired).
- The `unlockKey` field on the event makes the token-award lookup in Phase 4 trivial; it directly matches the `prevUnlocks` map key in `events.js:626-637`.

### Verification (Phase 2)

- `node --check js/simulation.js` passes.
- Launch a water-solvent default planet; let it run 5 minutes. Open devtools:
  - `game.biology.unlockedSoup` becomes true within seconds.
  - `game.biology.unlockedMitochondria` is NOT true at minute 1 even when O₂ > 1.2 — expect to wait. (This is the whole point.)
  - `game.history.getMarkers().filter(m => m.label.includes('MITOCHONDRIA'))` should be empty most of the time and non-empty by minute ~4-6.
- Spam the same planet 5 times: distribution of "time to eukaryogenesis" should vary widely — that's stochasticity working.

### Anti-patterns

- Don't move the gate logic into `tryFire`. Gate is the *necessary condition*; rate is the *sufficient luck*. They are different concerns.
- Don't accumulate condMult across ticks. Compute fresh each tick.
- Don't double-roll: only fire `tryFire` when the gate is true.

---

## Phase 3 — Wire nudges to rate boosts in `events.js`

### What to change in `js/events.js`

`nudgeEvolution(adaptationId, cost, biology)` currently calls `biology.applyAdaptation(adaptationId)` which mutates `activeAdaptations`. That bypass is gone per Phase 2's pattern. Replace with:

```js
nudgeEvolution(adaptationId, cost, biology) {
    if (this.tokens < cost) {
        return { success: false, msg: `Insufficient tokens (need ${cost}).` };
    }
    this.tokens -= cost;
    biology.applyAdaptation(adaptationId); // keep — some downstream gates still consult it
    biology.pendingNudges[adaptationId] = {
        multiplier: 20,
        remainingMyr: 5.0
    };
    return {
        success: true,
        msg: `Selection pressure applied: ${adaptationId.replace('_', ' ')} — breakthrough odds boosted ×20 for next 5 Myr.`
    };
}
```

Why keep `applyAdaptation()` too: some Phase 2 condition functions can read `activeAdaptations` to bump condMult further. The adaptation flag is "this species line has the trait" and is independent of "we are in a windowed lucky streak."

### Decay tick

In `BiologySimulation.update(tickRate, planet)`, add `this._decayPendingNudges(tickRate)` at the very top. That ensures expired boosts are removed before the rolls run.

### Verification (Phase 3)

- Open devtools, run `game.eventSystem.nudgeEvolution('endosymbiosis', 8, game.biology)`. Check:
  - `game.biology.pendingNudges.endosymbiosis.multiplier === 20`
  - `game.biology.pendingNudges.endosymbiosis.remainingMyr` is 5.0 immediately, decreasing over time.
- After ~50 sec real time at default speed (≈ 5 Myr), the key is removed from `pendingNudges`.
- With the nudge active and gate satisfied, the unlock should fire within ~1-3 Myr on average (rate × 20 = 6/Myr for Singular → wait ≈ 0.17 Myr ≈ 1.7 sec real). Confirm via repeated runs.

### Anti-patterns

- Don't stack multipliers infinitely if the player re-buys before expiry. Replace the entry, don't multiply on top.
- Don't refund tokens if the boost window expires without firing. Player paid for odds, odds expired. (This was the explicit design choice — "buy odds, not outcomes.")

---

## Phase 4 — Tier-aware token awards in `events.js`

### What to change

The current reward loop:
```js
for (const k in this.prevUnlocks) {
    if (biology[k] && !this.prevUnlocks[k]) {
        this.prevUnlocks[k] = true;
        this.tokens = Math.min(99.0, this.tokens + 5.0);
        outputLogs.push({ title: "🎁 MILESTONE UNLOCKED (+5 tokens)", ... });
    }
}
```

Now the event objects carry their own `tokens` field (from Phase 2). Move award logic out of this poll-style loop and into the explicit `events.push` site in `simulation.js`. The bio events flow through `game.js:147` and already get passed to `ui.logEvent`. Add one line in `game.js` to credit tokens from `evt.tokens` when present.

**In `game.js` event fan-out (after `bioUpdate.events.forEach`):**
```js
bioUpdate.events.forEach(evt => {
    if (typeof evt.tokens === 'number') {
        this.eventSystem.tokens = Math.min(99.0, this.eventSystem.tokens + evt.tokens);
    }
    this.history.recordEvent(evt, this.planet.age);
    this.ui.logEvent(evt.title, evt.desc, evt.type, { tier: evt.tier, tokens: evt.tokens });
    if (evt.tier === 'MAJOR' || evt.tier === 'SINGULAR') {
        this.ui.showMilestonePopup(evt.title, evt.desc, evt.scientificDetails);
    } else if (evt.type === 'success' && !evt.tier) {
        // Pre-tier system events (intervention success, etc.) — keep existing popup behavior
        this.ui.showMilestonePopup(evt.title, evt.desc, evt.scientificDetails);
    }
});
```

The `prevUnlocks` loop in `events.js` can stay as a safety net for any unlock that fires *without* going through the events pipeline (e.g. solvent-line unlocks that weren't refactored in Phase 2 because of time), but mark it explicitly:

```js
// Fallback for unlocks not yet migrated to tier-aware emission
for (const k in this.prevUnlocks) {
    if (biology[k] && !this.prevUnlocks[k]) {
        this.prevUnlocks[k] = true;
        // No token award here — events.push site is responsible.
        // This loop only updates the seen-set so we don't double-fire on stale flag flips.
    }
}
```

### Verification (Phase 4)

- Trigger an early Common unlock (soup). Confirm `game.eventSystem.tokens` increases by 2.
- Trigger a Singular unlock (mitochondria). Confirm balance increases by 25.
- Confirm balance still caps at 99.

### Anti-patterns

- Don't award tokens twice (once in `events.push` site, once in `prevUnlocks` loop). The loop must be neutered for migrated unlocks.
- Don't award negative tokens for "missed rolls." Misses are silent.

---

## Phase 5 — Tier-aware UI in `ui.js` and `historyView.js`

### `ui.logEvent` signature update

```js
logEvent(title, desc, type = 'system', meta = null) {
    const tierPrefix = meta?.tier ? `[${meta.tier} +${meta.tokens}T] ` : '';
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}${meta?.tier ? ' tier-' + meta.tier.toLowerCase() : ''}`;
    const timestamp = ...;
    entry.innerHTML = `<span>[${timestamp}]</span> <strong>${tierPrefix}${title}:</strong> ${desc}`;
    this.scienceLog.appendChild(entry);
    this.scienceLog.scrollTop = this.scienceLog.scrollHeight;
}
```

### CSS additions in `css/style.css` (after existing `.log-entry` rules)

```css
.log-entry.tier-common   { border-left: 2px solid rgba(148,163,184,0.4); padding-left: 0.5rem; }
.log-entry.tier-notable  { border-left: 2px solid var(--accent-cyan); padding-left: 0.5rem; }
.log-entry.tier-major    { border-left: 3px solid var(--accent-purple); padding-left: 0.5rem; }
.log-entry.tier-singular { border-left: 3px solid var(--accent-amber); padding-left: 0.5rem; background: rgba(245,158,11,0.05); }
```

### Sparkline marker tiers in `historyView.js`

`recorder.recordEvent` currently classifies by `evt.type`. Add a `tier` pass-through and use it in `MARKER_COLOR`:

```js
const MARKER_COLOR = {
    SINGULAR: 'rgba(245, 158, 11, 0.85)',
    MAJOR:    'rgba(168, 85, 247, 0.70)',
    NOTABLE:  'rgba(0, 242, 254, 0.55)',
    COMMON:   'rgba(148, 163, 184, 0.30)',
    // fallbacks for non-tiered events:
    milestone: 'rgba(0, 242, 254, 0.55)',
    hazard:    'rgba(239, 68, 68, 0.55)',
    alert:     'rgba(245, 158, 11, 0.5)',
    system:    'rgba(148, 163, 184, 0.35)'
};
```

`history.js`'s `recordEvent` writes `category = evt.tier ?? this._classifyEvent(evt)`. Marker line width can scale by tier too (singular = 2 px, major = 1.5, others = 1).

### Verification (Phase 5)

- Common unlocks log with a thin grey left border.
- Major unlocks log with a thick purple border AND trigger the milestone popup.
- Singular unlocks log with a thick amber border, faint amber tint, AND trigger the popup.
- Sparkline markers visually rank singular > major > notable > common in color brightness and line thickness.
- Resize browser: markers still align with the correct x positions.

### Anti-patterns

- Don't render the tier prefix on entries that lack a tier (non-stage events like impactors). The `tierPrefix` empty-string fallback handles that.
- Don't compute the marker color from `getComputedStyle` per frame — palette is in a module-scope const, that's correct.

---

## Phase 6 — Verification

End-to-end checks after all phases land.

### Functional
1. Default water planet, 10 minutes wall clock:
   - At least one Singular unlock visible (mitochondria or sexual reproduction) **most runs**, but not every run. A run with no Singular is a valid outcome.
   - Token balance shows real swings: low after the Common-tier opener, climbing meaningfully when a Major or Singular fires.
2. Nudge windows:
   - Pre-nudge: count how many ticks pass between gate-open and unlock. Should be ≥ ~3-30 sec for Major.
   - With ×20 nudge bought: should fire within ~1-2 sec on average. Visible difference.
   - Unspent nudge: window expires, key removed from `pendingNudges`. No refund.
3. Solvent slowdown:
   - Ammonia-default planet: Major-tier ammonic events should take noticeably longer than water Majors. Methane more so.

### Numerical sanity
- Run `for (let i=0;i<100000;i++) game.biology.tryFire('k', { rate: 1 }, 1, 0.01, game.planet)` in console; count `true`. Should be close to `100000 * (1 - exp(-0.01))` ≈ 995. (Within 3σ ≈ 31 of expected.)
- `game.biology.pendingNudges` correctly decays. Watch `remainingMyr` decrease in real time.

### Grep guards
- `grep -nE "planet\.age > [0-9]+\.0" js/simulation.js | grep -E "unlocked"` — any age-fallback gates remaining on transitions that should be stochastic? Should be empty (or only on stages we intentionally left as time-gated).
- `grep -n "Math.random" js/simulation.js` — should mostly appear via `tryFire`; the legacy photosynthesis Math.random block should be retired in favor of `tryFire`.
- `grep -n "tokens + 5.0" js/events.js` — the legacy flat-5 reward should be gone (or commented neutered as in Phase 4).
- `grep -n "tier:" js/simulation.js | wc -l` — should be roughly 41 (one per migrated transition).

### Vision check (AGENT.md alignment)
- Open the source for 3 random transitions. Each should have: (a) a gate that reflects astrobiological prerequisites, (b) a tier reflecting empirical Earth rarity, (c) a condition score that rewards well-tuned planets. If any one of these is missing for a transition, it was not fully migrated.

### Browser smoke
- `python3 server.py`, open `http://localhost:8080`, confirm no console errors during a 5-minute run including at least one nudge purchase.

---

## Follow-on plans this unblocks

- **Plan 03 — Sustained-condition timers.** Add "X must hold for N Myr" gates (e.g. ozone ≥ 0.4 sustained for 50 Myr before tetrapods become *gated*). Currently sustain is implicit in the Poisson wait; explicit sustain windows give the player a clearer mental model.
- **Plan 04 — Amphibian-style intermediate stages.** Once the tier infrastructure exists, splitting tetrapod into early-tetrapod and amniote (with the amphibian-grade between) is a 30-line addition: two new flags, two new events, two tier assignments.
- **Plan 05 — Rarity-aware Objectives.** A win condition like "achieve at least one Singular breakthrough" or "score X tokens from breakthroughs in one run" is now a one-line read from the new event payload.
- **Plan 06 — Run statistics dashboard.** Histograms of "how long did Singular take this run?" become possible because the system has explicit per-transition timings.
