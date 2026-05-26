import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);

const requiredFiles = [
  'index.html',
  'server.py',
  'css/style.css',
  'js/game.js',
  'js/planet.js',
  'js/simulation.js',
  'js/events.js',
  'js/evolutionData.js',
  'js/ui.js',
  'js/visualization.js',
  'js/history.js',
  'js/historyView.js',
];

const errors = [];

function fail(message) {
  errors.push(message);
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

for (const file of requiredFiles) {
  if (!exists(file)) {
    fail(`Missing required file: ${file}`);
  }
}

const indexHtml = readFile('index.html');
const assetPattern = /\b(?:href|src)=["']([^"']+)["']/g;
const moduleEntrypoints = [];

for (const match of indexHtml.matchAll(assetPattern)) {
  const asset = match[1];

  if (/^(?:https?:)?\/\//.test(asset) || asset.startsWith('data:') || asset.startsWith('#')) {
    continue;
  }

  if (!exists(asset)) {
    fail(`index.html references missing asset: ${asset}`);
  }

  if (asset.endsWith('.js')) {
    moduleEntrypoints.push(asset);
  }
}

const visitedModules = new Set();
const moduleImportPattern = /import\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g;

function validateModule(relativePath) {
  if (visitedModules.has(relativePath)) {
    return;
  }
  visitedModules.add(relativePath);

  const moduleSource = readFile(relativePath);
  const moduleDir = path.dirname(relativePath);

  for (const match of moduleSource.matchAll(moduleImportPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) {
      continue;
    }

    const resolved = path.normalize(path.join(moduleDir, specifier));
    if (!exists(resolved)) {
      fail(`${relativePath} imports missing module: ${specifier}`);
      continue;
    }

    validateModule(resolved);
  }
}

for (const entrypoint of moduleEntrypoints) {
  validateModule(entrypoint);
}

if (errors.length > 0) {
  console.error('Project structure validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Project structure validation passed.');
console.log(`Checked ${requiredFiles.length} required files and ${visitedModules.size} JS modules.`);
