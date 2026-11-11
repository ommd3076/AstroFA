import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Star } from '../src/types/astronomy';
import type { ReferencePattern } from '../src/recognition/types';
import { projectRaDecToTangentPlane } from '../src/geometry/projection';
import { encodeGeometry } from '../src/geometry/quantize';

const STARS_JSON = path.resolve('src/data/stars.json');
const OUTPUT_PUBLIC = path.resolve('public/data/referencePatterns.json');
const OUTPUT_SRC = path.resolve('src/data/referencePatterns.json');

interface RawPatternDef {
  constellationId: string;
  name: string;
  description: string;
  forwardHrs: number[];
  includeReverse?: boolean;
}

const RAW_PATTERNS: RawPatternDef[] = [
  {
    constellationId: 'Ori',
    name: 'Orion (Hourglass)',
    description: 'Betelgeuse to Bellatrix across to Rigel, Saiph and returning to Betelgeuse',
    forwardHrs: [2061, 1790, 1713, 2004, 2061],
    includeReverse: true,
  },
  {
    constellationId: 'UMa',
    name: 'Ursa Major (Big Dipper)',
    description: 'The 7 prominent stars of the Big Dipper / Plough from handle Alkaid to pointer Dubhe',
    forwardHrs: [5191, 5054, 4905, 4660, 4554, 4295, 4301],
    includeReverse: true,
  },
  {
    constellationId: 'UMi',
    name: 'Ursa Minor (Little Dipper)',
    description: 'From North Star Polaris through handle to bowl stars Kochab and Pherkad',
    forwardHrs: [424, 6789, 6322, 5903, 5563, 5735],
    includeReverse: true,
  },
  {
    constellationId: 'Cas',
    name: 'Cassiopeia (The W)',
    description: 'The iconic 5-star W-asterism from Caph to Segin',
    forwardHrs: [21, 168, 264, 403, 542],
    includeReverse: true,
  },
  {
    constellationId: 'Cyg',
    name: 'Cygnus (Northern Cross)',
    description: 'The Northern Cross backbone from Albireo to Sadr and Deneb, crossed with Aljanah and Fawaris',
    forwardHrs: [7417, 7796, 7924, 7949, 7528],
    includeReverse: true,
  },
  {
    constellationId: 'Sco',
    name: 'Scorpius (Scorpion)',
    description: 'Curved path from head stars through red supergiant Antares to the stinger Shaula and Lesath',
    forwardHrs: [5984, 5953, 6134, 6241, 6553, 6527],
    includeReverse: true,
  },
  {
    constellationId: 'Leo',
    name: 'Leo (Sickle & Triangle)',
    description: 'The sickle of Leo from Regulus up through Algieba and Rasalas to tail star Denebola',
    forwardHrs: [3982, 4057, 4031, 3905, 4357, 4534],
    includeReverse: true,
  },
  {
    constellationId: 'Gem',
    name: 'Gemini (Twins)',
    description: 'The parallel path connecting twin heads Castor and Pollux down to Alhena',
    forwardHrs: [2891, 2990, 2777, 2650, 2421],
    includeReverse: true,
  },
  {
    constellationId: 'Tau',
    name: 'Taurus (Bull V-Shape)',
    description: 'The horns and head of Taurus through Elnath, Aldebaran, and the Hyades V',
    forwardHrs: [1791, 1910, 1457, 1409, 1373],
    includeReverse: true,
  },
  {
    constellationId: 'CMa',
    name: 'Canis Major (Great Dog)',
    description: 'Path from brightest star Sirius through Mirzam, Muliphein, Wezen to Adhara and Aludra',
    forwardHrs: [2491, 2294, 2657, 2693, 2618, 2827],
    includeReverse: true,
  },
  {
    constellationId: 'Lyr',
    name: 'Lyra (The Harp)',
    description: 'From brilliant Vega through Epsilon and Zeta Lyrae to parallelogram base stars Sheliak and Sulafat',
    forwardHrs: [7001, 7063, 7178, 7106, 7298],
    includeReverse: true,
  },
  {
    constellationId: 'Cru',
    name: 'Crux (Southern Cross)',
    description: 'The four pointer stars of the Southern Cross: Acrux, Mimosa, Gacrux, and Imai',
    forwardHrs: [4730, 4853, 4763, 4656],
    includeReverse: true,
  },
];

async function main() {
  console.log('Loading stars.json...');
  const stars: Star[] = JSON.parse(fs.readFileSync(STARS_JSON, 'utf-8'));
  const hrToStar = new Map<number, Star>();
  for (const s of stars) {
    if (s.hr !== null) {
      hrToStar.set(s.hr, s);
    }
  }

  const referencePatterns: ReferencePattern[] = [];

  for (const raw of RAW_PATTERNS) {
    // Process forward variant
    const fwdPattern = createPattern(raw, raw.forwardHrs, 'forward', hrToStar);
    referencePatterns.push(fwdPattern);
    console.log(`[Pattern] ${fwdPattern.id} (${fwdPattern.name}): ${fwdPattern.encodedSymbols.join(' ')}`);

    // Process reverse variant if requested
    if (raw.includeReverse) {
      const revHrs = [...raw.forwardHrs].reverse();
      const revPattern = createPattern(raw, revHrs, 'reverse', hrToStar);
      referencePatterns.push(revPattern);
      console.log(`[Pattern] ${revPattern.id} (Reverse): ${revPattern.encodedSymbols.join(' ')}`);
    }
  }

  console.log(`Generated ${referencePatterns.length} total reference pattern traversals across 12 constellations.`);

  const jsonStr = JSON.stringify(referencePatterns, null, 2);
  fs.writeFileSync(OUTPUT_PUBLIC, jsonStr, 'utf-8');
  fs.writeFileSync(OUTPUT_SRC, jsonStr, 'utf-8');
  console.log(`Saved referencePatterns.json to ${OUTPUT_PUBLIC} and ${OUTPUT_SRC}`);
}

function createPattern(
  raw: RawPatternDef,
  hrList: number[],
  variant: 'forward' | 'reverse',
  hrMap: Map<number, Star>
): ReferencePattern {
  const starList: Star[] = [];
  for (const hr of hrList) {
    const star = hrMap.get(hr);
    if (!star) {
      throw new Error(`Missing HR ${hr} in star catalog for pattern ${raw.constellationId}`);
    }
    starList.push(star);
  }

  const coords = starList.map(s => ({ ra: s.ra, dec: s.dec }));
  const points = projectRaDecToTangentPlane(coords);
  const encoded = encodeGeometry(points);

  const starNames = starList.map(s => s.proper || s.name);
  const suffix = variant === 'forward' ? 'fwd' : 'rev';
  const patternId = `${raw.constellationId}_${suffix}`;

  return {
    id: patternId,
    constellationId: raw.constellationId,
    name: `${raw.name} (${variant === 'forward' ? 'Normal' : 'Reversed'})`,
    description: raw.description,
    orderedStarIds: starList.map(s => s.id),
    orderedHrIds: hrList,
    starNames,
    referenceCoordsRaDec: coords,
    referencePoints: points,
    encodedSymbols: encoded.symbols,
    toleranceAlternates: encoded.toleranceAlternates,
    traversalVariant: variant,
  };
}

main().catch(err => {
  console.error('Error building reference patterns:', err);
  process.exit(1);
});
