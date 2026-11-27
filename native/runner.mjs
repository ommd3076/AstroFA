import { readFile } from 'node:fs/promises';
import { WASI } from 'node:wasi';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const wasmPath = path.join(here, '.build', 'recognizer.wasm');
const wasm = await WebAssembly.compile(await readFile(wasmPath));
const wasi = new WASI({ version: 'preview1', args: process.argv.slice(2), env: {}, preopens: {} });
const instance = await WebAssembly.instantiate(wasm, { wasi_snapshot_preview1: wasi.wasiImport });
wasi.start(instance);
