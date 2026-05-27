/**
 * validate_evolution_graph.mjs
 *
 * Lightweight development-time integrity checker for EVOLUTION_GRAPH in
 * js/evolutionData.js.  Run with:
 *
 *   node scripts/validate_evolution_graph.mjs
 *
 * Checks:
 *   1. Required fields present on every node (id, name, clade, parents, popKey,
 *      cap, unit, reqs, details).
 *   2. node.id matches the object key it lives under.
 *   3. Every parent ID exists somewhere in the graph.
 *   4. No cycles in the DAG (depth-first topological sort).
 *   5. All nudge IDs referenced by nodes exist in TRANSITION_TO_NODE_ID and are
 *      unique across the whole graph.
 *   6. Every popKey maps correctly – i.e. appears in the known popMappings table
 *      derived from simulation.js (encoded below for portability).
 *   7. Every popKey → nodeId mapping actually resolves back to the node whose
 *      id is the graph key, not to a different node.
 */

import { EVOLUTION_GRAPH, TRANSITION_TO_NODE_ID } from '../js/evolutionData.js';

// ---------------------------------------------------------------------------
// Known popKey → nodeId mappings (mirrored from simulation.js popMappings).
// Keep this in sync when adding new nodes.
// ---------------------------------------------------------------------------
const KNOWN_POP_KEYS = new Map([
    // Water line
    ['organicSoup',           'soup'],
    ['membranePop',           'membrane'],
    ['bacteriaPop',           'bacteria'],
    ['anaerobicPop',          'anaerobic'],
    ['anoxygenicPhotoPop',    'anoxygenic_photo'],
    ['photosyntheticPop',     'photosynthetic'],
    ['nucleusPop',            'nucleus'],
    ['mitochondriaPop',       'mitochondria'],
    ['eukaryoticPop',         'eukaryotes'],
    ['sexualPop',             'sexual'],
    ['multicellularPop',      'multicellular'],
    ['algaePop',              'algae'],
    ['spongesPop',            'sponges'],
    ['medusesPop',            'meduses'],
    ['wormsPop',              'worms'],
    ['fishPop',               'fish'],
    ['cambrianPop',           'cambrian'],
    ['mossesPop',             'mosses'],
    ['fernsPop',              'ferns'],
    ['conifersPop',           'conifers'],
    ['angiospermsPop',        'angiosperms'],
    ['arthropodPop',          'insects'],
    ['tetrapodPop',           'tetrapods'],
    ['sauropsidPop',          'sauropsids'],
    ['synapsidPop',           'synapsids'],
    ['cognitiveSpeciesPop',   'cognitive'],
    ['cyborgPop',             'cyborg'],
    ['technologicalAIPop',    'ai'],
    ['noospherePop',          'noosphere'],
    ['gaiaHivemindPop',       'gaia_hivemind'],
    // Ammonia line
    ['ammonicSoup',           'ammonic_soup'],
    ['ammonicProtoPop',       'ammonic_proto'],
    ['ammonicMultiPop',       'ammonic_multi'],
    ['silicoFloraPop',        'silico_flora'],
    ['cryoFaunaPop',          'cryo_fauna'],
    ['crystallineCognitivePop','crystalline_cognitive'],
    ['quantumLatticePop',     'quantum_lattices'],
    ['cryoHivemindPop',       'cryo_hivemind'],
    // Methane line
    ['methaneSoup',           'methane_soup'],
    ['methaneProtoPop',       'methane_proto'],
    ['methaneMultiPop',       'methane_multi'],
    ['cryoOrganismsPop',      'cryo_organisms'],
    ['cryoPolymerNetworkPop', 'cryo_polymer_network'],
    ['thinkingOceanPop',      'thinking_ocean'],
    ['cryoColloidPop',        'cryo_colloid'],
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const errors   = [];
const warnings = [];

function fail(msg)  { errors.push(msg); }
function warn(msg)  { warnings.push(msg); }

// Build a flat map: nodeId → { node, solvent }
const allNodes = new Map(); // nodeId → { node, solvent }

for (const [solvent, nodes] of Object.entries(EVOLUTION_GRAPH)) {
    for (const [key, node] of Object.entries(nodes)) {
        if (allNodes.has(key)) {
            fail(`[DUPLICATE] Node key "${key}" appears in both "${allNodes.get(key).solvent}" and "${solvent}".`);
        } else {
            allNodes.set(key, { node, solvent });
        }
    }
}

// ---------------------------------------------------------------------------
// Check 1 – Required fields
// ---------------------------------------------------------------------------
const REQUIRED_FIELDS = ['id', 'name', 'clade', 'parents', 'popKey', 'cap', 'unit', 'reqs', 'details'];

for (const [key, { node, solvent }] of allNodes) {
    for (const field of REQUIRED_FIELDS) {
        if (!(field in node)) {
            fail(`[MISSING FIELD] Node "${key}" (${solvent}) is missing required field "${field}".`);
        }
    }

    // details sub-fields
    if (node.details) {
        for (const sub of ['desc', 'scientific']) {
            if (!(sub in node.details)) {
                fail(`[MISSING FIELD] Node "${key}" (${solvent}).details is missing "${sub}".`);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Check 2 – node.id matches its graph key
// ---------------------------------------------------------------------------
for (const [key, { node, solvent }] of allNodes) {
    if (node.id !== key) {
        fail(`[ID MISMATCH] Node key "${key}" (${solvent}) has node.id = "${node.id}". They must match.`);
    }
}

// ---------------------------------------------------------------------------
// Check 3 – Every parent ID exists in the graph
// ---------------------------------------------------------------------------
for (const [key, { node, solvent }] of allNodes) {
    if (!Array.isArray(node.parents)) {
        fail(`[BAD PARENTS] Node "${key}" (${solvent}) has non-array parents.`);
        continue;
    }
    for (const parentId of node.parents) {
        if (!allNodes.has(parentId)) {
            fail(`[MISSING PARENT] Node "${key}" (${solvent}) references parent "${parentId}" which does not exist in any solvent line.`);
        }
    }
}

// ---------------------------------------------------------------------------
// Check 4 – No cycles (Kahn's algorithm / BFS topological sort)
// ---------------------------------------------------------------------------
{
    const inDegree = new Map();
    const children = new Map(); // parentId → [childId]

    for (const [key] of allNodes) {
        inDegree.set(key, 0);
        children.set(key, []);
    }

    for (const [key, { node }] of allNodes) {
        for (const parentId of (node.parents || [])) {
            if (allNodes.has(parentId)) {
                inDegree.set(key, (inDegree.get(key) || 0) + 1);
                children.get(parentId).push(key);
            }
        }
    }

    const queue = [];
    for (const [key, deg] of inDegree) {
        if (deg === 0) queue.push(key);
    }

    let visited = 0;
    while (queue.length > 0) {
        const node = queue.shift();
        visited++;
        for (const child of children.get(node) || []) {
            const newDeg = inDegree.get(child) - 1;
            inDegree.set(child, newDeg);
            if (newDeg === 0) queue.push(child);
        }
    }

    if (visited < allNodes.size) {
        const cycleNodes = [...allNodes.keys()].filter(k => inDegree.get(k) > 0);
        fail(`[CYCLE DETECTED] The following nodes are part of a cycle: ${cycleNodes.join(', ')}.`);
    }
}

// ---------------------------------------------------------------------------
// Check 5 – Nudge IDs: exist in TRANSITION_TO_NODE_ID and are unique
// ---------------------------------------------------------------------------
{
    const nudgeIdsSeen  = new Map(); // nudgeId → nodeKey
    const validNudgeIds = new Set(Object.keys(TRANSITION_TO_NODE_ID));

    for (const [key, { node, solvent }] of allNodes) {
        if (!node.nudge) continue;

        const nudgeId = node.nudge.id;

        if (!nudgeId) {
            fail(`[NUDGE] Node "${key}" (${solvent}) has a nudge object but nudge.id is missing or falsy.`);
            continue;
        }

        if (!validNudgeIds.has(nudgeId)) {
            fail(`[NUDGE] Node "${key}" (${solvent}) nudge.id "${nudgeId}" does not appear in TRANSITION_TO_NODE_ID.`);
        }

        if (nudgeIdsSeen.has(nudgeId)) {
            fail(`[NUDGE DUPLICATE] nudge.id "${nudgeId}" is used by both "${nudgeIdsSeen.get(nudgeId)}" and "${key}".`);
        } else {
            nudgeIdsSeen.set(nudgeId, key);
        }

        if (!node.nudge.name) {
            warn(`[NUDGE] Node "${key}" (${solvent}) nudge.id "${nudgeId}" has no nudge.name.`);
        }

        if (typeof node.nudge.cost !== 'number') {
            fail(`[NUDGE] Node "${key}" (${solvent}) nudge.id "${nudgeId}" has a non-numeric cost.`);
        }
    }

    // Also check that every TRANSITION_TO_NODE_ID target resolves to a known node
    for (const [transKey, targetNodeId] of Object.entries(TRANSITION_TO_NODE_ID)) {
        if (!allNodes.has(targetNodeId)) {
            fail(`[TRANSITION MAP] TRANSITION_TO_NODE_ID["${transKey}"] = "${targetNodeId}" but no node with that id exists.`);
        }
    }
}

// ---------------------------------------------------------------------------
// Check 6 – Every popKey is in KNOWN_POP_KEYS
// ---------------------------------------------------------------------------
for (const [key, { node, solvent }] of allNodes) {
    if (!node.popKey) continue;

    if (!KNOWN_POP_KEYS.has(node.popKey)) {
        fail(`[POP KEY] Node "${key}" (${solvent}) uses popKey "${node.popKey}" which is not registered in simulation.js popMappings.`);
    }
}

// ---------------------------------------------------------------------------
// Check 7 – popKey → nodeId must resolve back to THIS node's id
// ---------------------------------------------------------------------------
for (const [key, { node, solvent }] of allNodes) {
    if (!node.popKey) continue;

    const expectedNodeId = KNOWN_POP_KEYS.get(node.popKey);
    if (expectedNodeId !== undefined && expectedNodeId !== key) {
        fail(`[POP KEY MISMATCH] Node "${key}" (${solvent}) uses popKey "${node.popKey}" which maps to nodeId "${expectedNodeId}", not "${key}".`);
    }
}

// ---------------------------------------------------------------------------
// Check 8 – Numeric sanity: cap > 0
// ---------------------------------------------------------------------------
for (const [key, { node, solvent }] of allNodes) {
    if (node.cap !== undefined && (typeof node.cap !== 'number' || node.cap <= 0)) {
        fail(`[CAP] Node "${key}" (${solvent}) has an invalid cap value: ${node.cap}. Must be a positive number.`);
    }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
console.log('\n── Evolution Graph Validation ──────────────────────────────────────');
console.log(`  Solvents checked : ${Object.keys(EVOLUTION_GRAPH).join(', ')}`);
console.log(`  Total nodes      : ${allNodes.size}`);
console.log(`  Known popKeys    : ${KNOWN_POP_KEYS.size}`);
console.log(`  Transition keys  : ${Object.keys(TRANSITION_TO_NODE_ID).length}`);
console.log('────────────────────────────────────────────────────────────────────\n');

if (warnings.length > 0) {
    console.warn(`Warnings (${warnings.length}):`);
    for (const w of warnings) console.warn(`  ⚠  ${w}`);
    console.log();
}

if (errors.length > 0) {
    console.error(`Errors (${errors.length}):`);
    for (const e of errors) console.error(`  ✗  ${e}`);
    console.log();
    console.error('Evolution graph validation FAILED.\n');
    process.exit(1);
}

console.log('✓ Evolution graph validation passed. No integrity errors found.\n');
