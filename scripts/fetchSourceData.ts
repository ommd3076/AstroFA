import * as fs from 'node:fs';
import * as path from 'node:path';

const HYG_URL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/master/hyg/v3/hyg_v38.csv.gz';
const CONSTELLATION_LINES_URL = 'https://raw.githubusercontent.com/MarcvdSluys/ConstellationLines/master/ConstellationLines.csv';

const SOURCE_DIR = path.resolve('public/data/source');

async function downloadFile(url: string, destPath: string): Promise<void> {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
    console.log(`[Cache Hit] ${destPath} already exists (${(fs.statSync(destPath).size / 1024).toFixed(1)} KB)`);
    return;
  }
  console.log(`Downloading ${url} -> ${destPath}...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  console.log(`Saved ${(buffer.length / 1024 / 1024).toFixed(2)} MB to ${destPath}`);
}

async function main() {
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  await downloadFile(HYG_URL, path.join(SOURCE_DIR, 'hyg_v38.csv.gz'));
  await downloadFile(CONSTELLATION_LINES_URL, path.join(SOURCE_DIR, 'ConstellationLines.csv'));
  console.log('Source data successfully fetched.');
}

main().catch(err => {
  console.error('Error fetching source data:', err);
  process.exit(1);
});
