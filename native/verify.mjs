import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = process.platform === 'win32' ? process.execPath : path.join(root, 'native', '.build', 'recognizer');
const args = process.platform === 'win32' ? [path.join(root, 'native', 'runner.mjs')] : [];
const patterns = JSON.parse(await readFile(path.join(root, 'src', 'data', 'referencePatterns.json'), 'utf8'));

function request(points) {
  const input = `${points.length}\n${points.map((p) => `${p.x} ${p.y}`).join('\n')}\n`;
  const result = spawnSync(command, args, { input, encoding: 'utf8', timeout: 5000 });
  assert.equal(result.status, 0, `recognizer exited with ${result.status ?? result.error?.message}: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function transformed(points, { angle = 0, scale = 1, tx = 0, ty = 0, noise = 0 } = {}) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000 * 2 - 1; };
  let seed = 0xC057E11;
  return points.map(({ x, y }) => ({
    x: scale * (x * cos - y * sin) + tx + noise * rng(),
    y: scale * (x * sin + y * cos) + ty + noise * rng(),
  }));
}

let exactPasses = 0;
for (const pattern of patterns) {
  const response = request(pattern.referencePoints);
  assert.notEqual(response.status, 'NO_MATCH', `${pattern.id} reference rejected`);
  assert.ok(response.candidates.some((candidate) => candidate.patternId === pattern.id), `${pattern.id} missing from candidates`);
  exactPasses++;
}
console.log(`PASS: ${exactPasses} exact curated traversals (12 constellations)`);

const base = patterns.find((p) => p.constellationId === 'Cas' && p.traversalVariant === 'forward');
assert.ok(base, 'Cassiopeia forward reference missing');
const radius = Math.sqrt(base.referencePoints.reduce((sum, p) => sum + p.x*p.x + p.y*p.y, 0) / base.referencePoints.length);
const noisy = request(transformed(base.referencePoints, { angle: 1.17, scale: 4.2, tx: 800, ty: -300, noise: radius * 0.01 }));
assert.notEqual(noisy.status, 'NO_MATCH', 'mildly noisy transformed Cassiopeia was rejected');
assert.ok(noisy.candidates.some((candidate) => candidate.constellationId === 'Cas'), 'Cassiopeia missing from noisy transformed candidates');
console.log('PASS: translated, rotated, scaled, mildly perturbed trace');

// A strong deformation changes one star while preserving every other ordered vertex.
const deformed = base.referencePoints.map((p) => ({ ...p }));
deformed[Math.floor(deformed.length / 2)].x += radius * 3.5;
const deformedResult = request(deformed);
assert.equal(deformedResult.status, 'NO_MATCH', `strong deformation unexpectedly matched ${deformedResult.bestMatch?.constellationId}`);
console.log('PASS: strong local deformation rejected by open-set threshold');

const reflected = request(base.referencePoints.map(({ x, y }) => ({ x: -x, y })));
assert.equal(reflected.status, 'NO_MATCH', `reflection unexpectedly matched ${reflected.bestMatch?.constellationId}`);
console.log('PASS: reflected asymmetric traversal rejected');

const reorderedPoints = base.referencePoints.map((p) => ({ ...p }));
[reorderedPoints[1], reorderedPoints[2]] = [reorderedPoints[2], reorderedPoints[1]];
const reordered = request(reorderedPoints);
assert.equal(reordered.status, 'NO_MATCH', `reordered traversal unexpectedly matched ${reordered.bestMatch?.constellationId}`);
console.log('PASS: wrong vertex order rejected');

// One input request per short-lived worker process verifies clean protocol startup/exit repeatedly.
const repeated = request(base.referencePoints);
assert.notEqual(repeated.status, 'NO_MATCH');
assert.ok(repeated.candidates.some((candidate) => candidate.constellationId === 'Cas'));
console.log('PASS: repeated process-per-request invocation');
