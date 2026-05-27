// Seeded deterministic random number generator for debug / reproducible testing.
// When no seed is active, random() delegates to Math.random().

let _seed = null;

export function setDebugSeed(seed) {
    _seed = (seed >>> 0) || 1;
}

export function clearDebugSeed() {
    _seed = null;
}

export function isDebugSeedActive() {
    return _seed !== null;
}

// LCG — Numerical Recipes constants, period 2^32
export function random() {
    if (_seed === null) return Math.random();
    _seed = (Math.imul(1664525, _seed) + 1013904223) >>> 0;
    return _seed / 0x100000000;
}
