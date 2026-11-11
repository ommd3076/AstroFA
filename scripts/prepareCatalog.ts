import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import * as readline from 'node:readline';
import type { Star } from '../src/types/astronomy';

const SOURCE_DIR = path.resolve('public/data/source');
const HYG_GZ = path.join(SOURCE_DIR, 'hyg_v38.csv.gz');
const CONST_LINES_CSV = path.join(SOURCE_DIR, 'ConstellationLines.csv');
const OUTPUT_PUBLIC = path.resolve('public/data/stars.json');
const OUTPUT_SRC = path.resolve('src/data/stars.json');

async function main() {
  console.log('Reading ConstellationLines.csv to extract required HR IDs...');
  const constCsvText = fs.readFileSync(CONST_LINES_CSV, 'utf-8');
  const constLines = constCsvText.trim().split('\n');
  const requiredHrSet = new Set<number>();

  for (let i = 1; i < constLines.length; i++) {
    const parts = constLines[i].split(',').map(s => s.trim());
    if (parts.length < 2) continue;
    const nr = parseInt(parts[1], 10);
    for (let j = 0; j < nr; j++) {
      const hr = parseInt(parts[2 + j], 10);
      if (!isNaN(hr)) {
        requiredHrSet.add(hr);
      }
    }
  }

  console.log(`Found ${requiredHrSet.size} unique HR stars required by constellation lines.`);

  console.log('Streaming and decompressing hyg_v38.csv.gz...');
  const fileStream = fs.createReadStream(HYG_GZ);
  const gunzip = zlib.createGunzip();
  const rl = readline.createInterface({
    input: fileStream.pipe(gunzip),
    crlfDelay: Infinity,
  });

  let isHeader = true;
  let colMap: Record<string, number> = {};
  const stars: Star[] = [];
  const foundHrSet = new Set<number>();

  for await (const rawLine of rl) {
    if (!rawLine.trim()) continue;
    if (isHeader) {
      isHeader = false;
      const headers = rawLine.split(',').map(h => h.replace(/^"|"$/g, '').trim());
      headers.forEach((h, idx) => {
        colMap[h] = idx;
      });
      continue;
    }

    // CSV line parse handling quoted strings
    const cols = parseCsvLine(rawLine);
    const id = parseInt(cols[colMap['id']], 10);
    if (isNaN(id) || id === 0) {
      // id 0 is Sol (the Sun)
      continue;
    }

    const hrRaw = cols[colMap['hr']];
    const hr = hrRaw ? parseInt(hrRaw, 10) : null;
    if (hr !== null && !isNaN(hr)) {
      foundHrSet.add(hr);
    }

    const magRaw = cols[colMap['mag']];
    const mag = parseFloat(magRaw);
    if (isNaN(mag)) continue;

    const isRequiredByConstellation = hr !== null && requiredHrSet.has(hr);
    const isBrightNakedEye = mag <= 6.5;

    // Include if either required by constellation or naked-eye visible
    if (!isRequiredByConstellation && !isBrightNakedEye) {
      continue;
    }

    const hipRaw = cols[colMap['hip']];
    const hip = hipRaw ? parseInt(hipRaw, 10) : null;

    const hdRaw = cols[colMap['hd']];
    const hd = hdRaw ? parseInt(hdRaw, 10) : null;

    const properRaw = cols[colMap['proper']];
    const proper = properRaw && properRaw.trim().length > 0 ? properRaw.trim() : null;

    const bayerRaw = cols[colMap['bayer']];
    const bayer = bayerRaw && bayerRaw.trim().length > 0 ? bayerRaw.trim() : null;

    const flamRaw = cols[colMap['flam']];
    const flam = flamRaw ? parseInt(flamRaw, 10) : null;

    const conRaw = cols[colMap['con']];
    const con = conRaw && conRaw.trim().length > 0 ? conRaw.trim() : null;

    // RA in HYG is in decimal hours (0 to 24). Convert to degrees [0, 360).
    const raHours = parseFloat(cols[colMap['ra']]);
    const raDegrees = (raHours * 15.0) % 360.0;

    // Dec in HYG is in degrees (-90 to +90).
    const decDegrees = parseFloat(cols[colMap['dec']]);

    const ciRaw = cols[colMap['ci']];
    const ci = ciRaw && ciRaw.trim().length > 0 ? parseFloat(ciRaw) : null;

    const distRaw = cols[colMap['dist']];
    const dist = distRaw && distRaw.trim().length > 0 ? parseFloat(distRaw) : null;

    const pmraRaw = cols[colMap['pmra']];
    const pmra = pmraRaw && pmraRaw.trim().length > 0 ? parseFloat(pmraRaw) : null;

    const pmdecRaw = cols[colMap['pmdec']];
    const pmdec = pmdecRaw && pmdecRaw.trim().length > 0 ? parseFloat(pmdecRaw) : null;

    const spectRaw = cols[colMap['spect']];
    const spect = spectRaw && spectRaw.trim().length > 0 ? spectRaw.trim() : null;

    // Build user-friendly display name
    let displayName = proper;
    if (!displayName) {
      if (bayer && con) {
        displayName = `${bayer} ${con}`;
      } else if (flam && con) {
        displayName = `${flam} ${con}`;
      } else if (hr) {
        displayName = `HR ${hr}`;
      } else if (hip) {
        displayName = `HIP ${hip}`;
      } else {
        displayName = `Star #${id}`;
      }
    }

    stars.push({
      id,
      hip: isNaN(hip as number) ? null : hip,
      hd: isNaN(hd as number) ? null : hd,
      hr: isNaN(hr as number) ? null : hr,
      name: displayName,
      proper,
      bayer,
      flam: isNaN(flam as number) ? null : flam,
      con,
      ra: Number(raDegrees.toFixed(5)),
      dec: Number(decDegrees.toFixed(5)),
      mag: Number(mag.toFixed(3)),
      ci: ci !== null && !isNaN(ci) ? Number(ci.toFixed(3)) : null,
      dist: dist !== null && !isNaN(dist) ? Number(dist.toFixed(2)) : null,
      pmra: pmra !== null && !isNaN(pmra) ? Number(pmra.toFixed(2)) : null,
      pmdec: pmdec !== null && !isNaN(pmdec) ? Number(pmdec.toFixed(2)) : null,
      spect,
    });
  }

  // Sort by magnitude ascending (brightest stars first)
  stars.sort((a, b) => a.mag - b.mag);

  console.log(`Extracted ${stars.length} stars (mag <= 6.5 + all constellation stars).`);
  const missingHr = [...requiredHrSet].filter(hr => !foundHrSet.has(hr));
  if (missingHr.length > 0) {
    console.warn(`Warning: ${missingHr.length} required HR IDs were not found in HYG:`, missingHr);
  } else {
    console.log(`Success: All ${requiredHrSet.size} constellation HR stars resolved in HYG catalog!`);
  }

  fs.mkdirSync(path.dirname(OUTPUT_PUBLIC), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_SRC), { recursive: true });

  const jsonStr = JSON.stringify(stars);
  fs.writeFileSync(OUTPUT_PUBLIC, jsonStr, 'utf-8');
  fs.writeFileSync(OUTPUT_SRC, jsonStr, 'utf-8');
  console.log(`Saved stars.json: ${(jsonStr.length / 1024 / 1024).toFixed(2)} MB (${stars.length} stars)`);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

main().catch(err => {
  console.error('Error preparing star catalog:', err);
  process.exit(1);
});
