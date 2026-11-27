import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'native', '.build');
const source = path.join(root, 'native', 'recognizer.cpp');
const header = path.join(outDir, 'catalog.generated.hpp');
await mkdir(outDir, { recursive: true });

const patterns = JSON.parse(await readFile(path.join(root, 'src', 'data', 'referencePatterns.json'), 'utf8'));
const cppString = (value) => JSON.stringify(String(value));
const rows = patterns.map((p) => {
  const points = p.referencePoints.map(({ x, y }) => `{${Number(x)},${Number(y)}}`).join(',');
  return `  {${cppString(p.id)},${cppString(p.constellationId)},${cppString(p.name)},std::vector<Point>{${points}}}`;
}).join(',\n');
await writeFile(header, `// Generated from src/data/referencePatterns.json by scripts/build-native.mjs\n#pragma once\n#include <string>\n#include <vector>\nstruct Point { double x,y; };\nstruct Pattern { std::string id,constellationId,name; std::vector<Point> points; };\nstatic const std::vector<Pattern> kPatterns = {\n${rows}\n};\n`);

const isWindows = process.platform === 'win32';
const target = path.join(outDir, isWindows ? 'recognizer.wasm' : 'recognizer');
const run = (cmd, args, extraEnv = {}) => spawnSync(cmd, args, { cwd: root, encoding: 'utf8', stdio: 'inherit', env: { ...process.env, ...extraEnv } });
let result;
if (isWindows) {
  // The Windows app uses the WASI artifact through Node rather than launching an unsigned PE.
  const inPath = spawnSync('where.exe', ['zig.exe'], { encoding: 'utf8' });
  const zig = (inPath.status === 0 ? inPath.stdout.trim().split(/\r?\n/)[0] : '') || await findPortableZig();
  if (!zig) throw new Error('The Windows WASI build needs Zig 0.17+ on PATH or under native/.build/toolchain.');
  result = run(zig, ['c++', '-target', 'wasm32-wasi', '-std=c++17', '-O3', '-DNDEBUG', '-fno-exceptions', '-fno-rtti', `-I${path.dirname(header)}`, source, '-o', target], {
    ZIG_GLOBAL_CACHE_DIR: path.join(outDir, 'cache', 'global'),
    ZIG_LOCAL_CACHE_DIR: path.join(outDir, 'cache', 'local'),
  });
} else {
  const compiler = process.env.CXX || 'g++';
  result = run(compiler, ['-std=c++17', '-O3', '-DNDEBUG', `-I${path.dirname(header)}`, source, '-o', target]);
}
if (result.error || result.status !== 0) throw result.error ?? new Error(`Native compiler exited with ${result.status}`);
console.log(`Built ${target}`);

async function findPortableZig() {
  const toolchain = path.join(outDir, 'toolchain');
  const { readdir } = await import('node:fs/promises');
  try {
    const visit = async (dir) => {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const child = path.join(dir, entry.name);
        if (entry.isFile() && entry.name.toLowerCase() === 'zig.exe') return child;
        if (entry.isDirectory()) { const found = await visit(child); if (found) return found; }
      }
      return '';
    };
    return await visit(toolchain);
  } catch { return ''; }
}
