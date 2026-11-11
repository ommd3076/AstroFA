import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Star, IAUConstellation, ConstellationLineSegment } from '../src/types/astronomy';

const CONST_LINES_CSV = path.resolve('public/data/source/ConstellationLines.csv');
const STARS_JSON = path.resolve('public/data/stars.json');
const OUTPUT_PUBLIC = path.resolve('public/data/constellations.json');
const OUTPUT_SRC = path.resolve('src/data/constellations.json');

// Authoritative IAU 88 Constellations Table
interface IAUInfo {
  id: string; // 3-letter IAU code
  name: string;
  genitive: string;
  english: string;
  area: number; // sq deg
  raCenter: number; // hours
  decCenter: number; // degrees
  family: string;
}

const IAU_DATA: IAUInfo[] = [
  { id: 'And', name: 'Andromeda', genitive: 'Andromedae', english: 'Chained Maiden', area: 722, raCenter: 0.8, decCenter: 37.5, family: 'Perseus' },
  { id: 'Ant', name: 'Antlia', genitive: 'Antliae', english: 'Air Pump', area: 239, raCenter: 10.0, decCenter: -32.5, family: 'La Caille' },
  { id: 'Aps', name: 'Apus', genitive: 'Apodis', english: 'Bird of Paradise', area: 206, raCenter: 16.1, decCenter: -75.3, family: 'Bayer' },
  { id: 'Aqr', name: 'Aquarius', genitive: 'Aquarii', english: 'Water Bearer', area: 980, raCenter: 22.3, decCenter: -10.8, family: 'Zodiacal' },
  { id: 'Aql', name: 'Aquila', genitive: 'Aquilae', english: 'Eagle', area: 652, raCenter: 19.7, decCenter: 3.4, family: 'Hercules' },
  { id: 'Ara', name: 'Ara', genitive: 'Arae', english: 'Altar', area: 237, raCenter: 17.4, decCenter: -56.6, family: 'Hercules' },
  { id: 'Ari', name: 'Aries', genitive: 'Arietis', english: 'Ram', area: 441, raCenter: 2.6, decCenter: 20.8, family: 'Zodiacal' },
  { id: 'Aur', name: 'Auriga', genitive: 'Aurigae', english: 'Charioteer', area: 657, raCenter: 6.0, decCenter: 42.0, family: 'Perseus' },
  { id: 'Boo', name: 'Boötes', genitive: 'Boötis', english: 'Herdsman', area: 907, raCenter: 14.7, decCenter: 31.2, family: 'Ursa Major' },
  { id: 'Cae', name: 'Caelum', genitive: 'Caeli', english: 'Chisel', area: 125, raCenter: 4.7, decCenter: -37.9, family: 'La Caille' },
  { id: 'Cam', name: 'Camelopardalis', genitive: 'Camelopardalis', english: 'Giraffe', area: 757, raCenter: 6.0, decCenter: 70.0, family: 'Ursa Major' },
  { id: 'Cnc', name: 'Cancer', genitive: 'Cancri', english: 'Crab', area: 506, raCenter: 8.6, decCenter: 19.8, family: 'Zodiacal' },
  { id: 'CVn', name: 'Canes Venatici', genitive: 'Canum Venaticorum', english: 'Hunting Dogs', area: 465, raCenter: 13.1, decCenter: 40.1, family: 'Ursa Major' },
  { id: 'CMa', name: 'Canis Major', genitive: 'Canis Majoris', english: 'Great Dog', area: 380, raCenter: 6.8, decCenter: -22.1, family: 'Orion' },
  { id: 'CMi', name: 'Canis Minor', genitive: 'Canis Minoris', english: 'Lesser Dog', area: 183, raCenter: 7.7, decCenter: 6.4, family: 'Orion' },
  { id: 'Cap', name: 'Capricornus', genitive: 'Capricorni', english: 'Sea Goat', area: 414, raCenter: 21.0, decCenter: -18.0, family: 'Zodiacal' },
  { id: 'Car', name: 'Carina', genitive: 'Carinae', english: 'Keel', area: 494, raCenter: 8.7, decCenter: -63.2, family: 'Heavenly Waters' },
  { id: 'Cas', name: 'Cassiopeia', genitive: 'Cassiopeiae', english: 'Queen', area: 598, raCenter: 1.3, decCenter: 62.2, family: 'Perseus' },
  { id: 'Cen', name: 'Centaurus', genitive: 'Centauri', english: 'Centaur', area: 1060, raCenter: 13.1, decCenter: -47.3, family: 'Hercules' },
  { id: 'Cep', name: 'Cepheus', genitive: 'Cephei', english: 'King', area: 588, raCenter: 22.0, decCenter: 71.0, family: 'Perseus' },
  { id: 'Cet', name: 'Cetus', genitive: 'Ceti', english: 'Sea Monster', area: 1231, raCenter: 1.7, decCenter: -7.2, family: 'Heavenly Waters' },
  { id: 'Cha', name: 'Chamaeleon', genitive: 'Chamaeleontis', english: 'Chameleon', area: 132, raCenter: 11.1, decCenter: -79.2, family: 'Bayer' },
  { id: 'Cir', name: 'Circinus', genitive: 'Circini', english: 'Compasses', area: 93, raCenter: 15.3, decCenter: -63.1, family: 'La Caille' },
  { id: 'Col', name: 'Columba', genitive: 'Columbae', english: 'Dove', area: 270, raCenter: 5.9, decCenter: -35.1, family: 'Heavenly Waters' },
  { id: 'Com', name: 'Coma Berenices', genitive: 'Comae Berenices', english: "Berenice's Hair", area: 386, raCenter: 12.8, decCenter: 23.3, family: 'Ursa Major' },
  { id: 'CrA', name: 'Corona Australis', genitive: 'Coronae Australis', english: 'Southern Crown', area: 128, raCenter: 19.3, decCenter: -40.1, family: 'Hercules' },
  { id: 'CrB', name: 'Corona Borealis', genitive: 'Coronae Borealis', english: 'Northern Crown', area: 179, raCenter: 15.8, decCenter: 32.6, family: 'Ursa Major' },
  { id: 'Crv', name: 'Corvus', genitive: 'Corvi', english: 'Crow', area: 184, raCenter: 12.4, decCenter: -18.4, family: 'Hercules' },
  { id: 'Crt', name: 'Crater', genitive: 'Crateris', english: 'Cup', area: 282, raCenter: 11.4, decCenter: -15.9, family: 'Hercules' },
  { id: 'Cru', name: 'Crux', genitive: 'Crucis', english: 'Southern Cross', area: 68, raCenter: 12.4, decCenter: -60.2, family: 'Hercules' },
  { id: 'Cyg', name: 'Cygnus', genitive: 'Cygni', english: 'Swan', area: 804, raCenter: 20.6, decCenter: 44.5, family: 'Hercules' },
  { id: 'Del', name: 'Delphinus', genitive: 'Delphini', english: 'Dolphin', area: 189, raCenter: 20.7, decCenter: 11.7, family: 'Heavenly Waters' },
  { id: 'Dor', name: 'Dorado', genitive: 'Doradus', english: 'Dolphinfish', area: 179, raCenter: 5.2, decCenter: -59.3, family: 'Bayer' },
  { id: 'Dra', name: 'Draco', genitive: 'Draconis', english: 'Dragon', area: 1083, raCenter: 17.1, decCenter: 65.8, family: 'Ursa Major' },
  { id: 'Equ', name: 'Equuleus', genitive: 'Equulei', english: 'Pony', area: 72, raCenter: 21.3, decCenter: 7.8, family: 'Heavenly Waters' },
  { id: 'Eri', name: 'Eridanus', genitive: 'Eridani', english: 'River', area: 1138, raCenter: 3.3, decCenter: -28.8, family: 'Heavenly Waters' },
  { id: 'For', name: 'Fornax', genitive: 'Fornacis', english: 'Furnace', area: 398, raCenter: 2.8, decCenter: -31.6, family: 'La Caille' },
  { id: 'Gem', name: 'Gemini', genitive: 'Geminorum', english: 'Twins', area: 514, raCenter: 7.1, decCenter: 22.6, family: 'Zodiacal' },
  { id: 'Gru', name: 'Grus', genitive: 'Gruis', english: 'Crane', area: 366, raCenter: 22.5, decCenter: -46.4, family: 'Bayer' },
  { id: 'Her', name: 'Hercules', genitive: 'Herculis', english: 'Strongman', area: 1225, raCenter: 17.4, decCenter: 27.5, family: 'Hercules' },
  { id: 'Hor', name: 'Horologium', genitive: 'Horologii', english: 'Clock', area: 249, raCenter: 3.3, decCenter: -53.6, family: 'La Caille' },
  { id: 'Hya', name: 'Hydra', genitive: 'Hydrae', english: 'Female Water Snake', area: 1303, raCenter: 11.6, decCenter: -14.5, family: 'Hercules' },
  { id: 'Hyi', name: 'Hydrus', genitive: 'Hydri', english: 'Male Water Snake', area: 243, raCenter: 2.3, decCenter: -69.9, family: 'Bayer' },
  { id: 'Ind', name: 'Indus', genitive: 'Indi', english: 'Indian', area: 294, raCenter: 21.6, decCenter: -56.7, family: 'Bayer' },
  { id: 'Lac', name: 'Lacerta', genitive: 'Lacertae', english: 'Lizard', area: 201, raCenter: 22.5, decCenter: 46.0, family: 'Perseus' },
  { id: 'Leo', name: 'Leo', genitive: 'Leonis', english: 'Lion', area: 947, raCenter: 10.7, decCenter: 13.1, family: 'Zodiacal' },
  { id: 'LMi', name: 'Leo Minor', genitive: 'Leonis Minoris', english: 'Lesser Lion', area: 232, raCenter: 10.2, decCenter: 33.5, family: 'Ursa Major' },
  { id: 'Lep', name: 'Lepus', genitive: 'Leporis', english: 'Hare', area: 290, raCenter: 5.6, decCenter: -19.0, family: 'Orion' },
  { id: 'Lib', name: 'Libra', genitive: 'Librae', english: 'Scales', area: 538, raCenter: 15.2, decCenter: -15.6, family: 'Zodiacal' },
  { id: 'Lup', name: 'Lupus', genitive: 'Lupi', english: 'Wolf', area: 334, raCenter: 15.2, decCenter: -42.8, family: 'Hercules' },
  { id: 'Lyn', name: 'Lynx', genitive: 'Lyncis', english: 'Lynx', area: 545, raCenter: 8.0, decCenter: 44.8, family: 'Ursa Major' },
  { id: 'Lyr', name: 'Lyra', genitive: 'Lyrae', english: 'Lyre', area: 286, raCenter: 18.9, decCenter: 36.7, family: 'Hercules' },
  { id: 'Men', name: 'Mensa', genitive: 'Mensae', english: 'Table Mountain', area: 153, raCenter: 5.4, decCenter: -77.5, family: 'La Caille' },
  { id: 'Mic', name: 'Microscopium', genitive: 'Microscopii', english: 'Microscope', area: 210, raCenter: 20.9, decCenter: -36.3, family: 'La Caille' },
  { id: 'Mon', name: 'Monoceros', genitive: 'Monocerotis', english: 'Unicorn', area: 482, raCenter: 7.1, decCenter: -3.3, family: 'Orion' },
  { id: 'Mus', name: 'Musca', genitive: 'Muscae', english: 'Fly', area: 138, raCenter: 12.6, decCenter: -70.2, family: 'Bayer' },
  { id: 'Nor', name: 'Norma', genitive: 'Normae', english: 'Carpenter Level', area: 165, raCenter: 15.9, decCenter: -51.9, family: 'La Caille' },
  { id: 'Oct', name: 'Octans', genitive: 'Octantis', english: 'Octant', area: 291, raCenter: 23.0, decCenter: -82.2, family: 'La Caille' },
  { id: 'Oph', name: 'Ophiuchus', genitive: 'Ophiuchi', english: 'Serpent Bearer', area: 948, raCenter: 17.4, decCenter: -4.2, family: 'Hercules' },
  { id: 'Ori', name: 'Orion', genitive: 'Orionis', english: 'Hunter', area: 594, raCenter: 5.6, decCenter: 1.4, family: 'Orion' },
  { id: 'Pav', name: 'Pavo', genitive: 'Pavonis', english: 'Peacock', area: 378, raCenter: 19.6, decCenter: -65.8, family: 'Bayer' },
  { id: 'Peg', name: 'Pegasus', genitive: 'Pegasi', english: 'Winged Horse', area: 1121, raCenter: 22.7, decCenter: 19.5, family: 'Perseus' },
  { id: 'Per', name: 'Perseus', genitive: 'Persei', english: 'Hero', area: 615, raCenter: 3.2, decCenter: 42.5, family: 'Perseus' },
  { id: 'Phe', name: 'Phoenix', genitive: 'Phoenicis', english: 'Phoenix', area: 469, raCenter: 0.4, decCenter: -42.3, family: 'Bayer' },
  { id: 'Pic', name: 'Pictor', genitive: 'Pictoris', english: 'Easel', area: 247, raCenter: 5.7, decCenter: -53.5, family: 'La Caille' },
  { id: 'Psc', name: 'Pisces', genitive: 'Piscium', english: 'Fishes', area: 889, raCenter: 0.5, decCenter: 13.7, family: 'Zodiacal' },
  { id: 'PsA', name: 'Piscis Austrinus', genitive: 'Piscis Austrini', english: 'Southern Fish', area: 245, raCenter: 22.3, decCenter: -30.6, family: 'Heavenly Waters' },
  { id: 'Pup', name: 'Puppis', genitive: 'Puppis', english: 'Stern', area: 673, raCenter: 7.3, decCenter: -31.2, family: 'Heavenly Waters' },
  { id: 'Pyx', name: 'Pyxis', genitive: 'Pyxidis', english: 'Mariner Compass', area: 221, raCenter: 8.9, decCenter: -27.4, family: 'Heavenly Waters' },
  { id: 'Ret', name: 'Reticulum', genitive: 'Reticuli', english: 'Reticle', area: 114, raCenter: 3.9, decCenter: -59.9, family: 'La Caille' },
  { id: 'Sge', name: 'Sagitta', genitive: 'Sagittae', english: 'Arrow', area: 80, raCenter: 19.7, decCenter: 18.9, family: 'Hercules' },
  { id: 'Sgr', name: 'Sagittarius', genitive: 'Sagittarii', english: 'Archer', area: 867, raCenter: 19.1, decCenter: -28.5, family: 'Zodiacal' },
  { id: 'Sco', name: 'Scorpius', genitive: 'Scorpii', english: 'Scorpion', area: 497, raCenter: 16.9, decCenter: -30.7, family: 'Zodiacal' },
  { id: 'Scl', name: 'Sculptor', genitive: 'Sculptoris', english: 'Sculptor', area: 475, raCenter: 0.4, decCenter: -32.1, family: 'La Caille' },
  { id: 'Sct', name: 'Scutum', genitive: 'Scuti', english: 'Shield', area: 109, raCenter: 18.7, decCenter: -9.9, family: 'Hercules' },
  { id: 'Ser', name: 'Serpens', genitive: 'Serpentis', english: 'Serpent', area: 637, raCenter: 17.0, decCenter: 6.0, family: 'Hercules' },
  { id: 'Sex', name: 'Sextans', genitive: 'Sextantis', english: 'Sextant', area: 314, raCenter: 10.3, decCenter: -1.6, family: 'Hercules' },
  { id: 'Tau', name: 'Taurus', genitive: 'Tauri', english: 'Bull', area: 797, raCenter: 4.7, decCenter: 16.0, family: 'Zodiacal' },
  { id: 'Tel', name: 'Telescopium', genitive: 'Telescopii', english: 'Telescope', area: 252, raCenter: 19.3, decCenter: -51.0, family: 'La Caille' },
  { id: 'Tri', name: 'Triangulum', genitive: 'Trianguli', english: 'Triangle', area: 132, raCenter: 2.2, decCenter: 31.5, family: 'Perseus' },
  { id: 'TrA', name: 'Triangulum Australe', genitive: 'Trianguli Australis', english: 'Southern Triangle', area: 110, raCenter: 16.1, decCenter: -65.4, family: 'Hercules' },
  { id: 'Tuc', name: 'Tucana', genitive: 'Tucanae', english: 'Toucan', area: 295, raCenter: 23.8, decCenter: -65.8, family: 'Bayer' },
  { id: 'UMa', name: 'Ursa Major', genitive: 'Ursae Majoris', english: 'Great Bear', area: 1280, raCenter: 10.7, decCenter: 55.4, family: 'Ursa Major' },
  { id: 'UMi', name: 'Ursa Minor', genitive: 'Ursae Minoris', english: 'Lesser Bear', area: 256, raCenter: 15.0, decCenter: 77.8, family: 'Ursa Major' },
  { id: 'Vel', name: 'Vela', genitive: 'Velorum', english: 'Sails', area: 500, raCenter: 9.6, decCenter: -47.2, family: 'Heavenly Waters' },
  { id: 'Vir', name: 'Virgo', genitive: 'Virginis', english: 'Maiden', area: 1294, raCenter: 13.4, decCenter: -4.2, family: 'Zodiacal' },
  { id: 'Vol', name: 'Volans', genitive: 'Volantis', english: 'Flying Fish', area: 141, raCenter: 7.8, decCenter: -69.8, family: 'Bayer' },
  { id: 'Vul', name: 'Vulpecula', genitive: 'Vulpeculae', english: 'Fox', area: 268, raCenter: 20.2, decCenter: 24.5, family: 'Hercules' },
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
  console.log(`Indexed ${hrToStar.size} HR stars from stars catalog.`);

  console.log('Reading ConstellationLines.csv...');
  const constCsvText = fs.readFileSync(CONST_LINES_CSV, 'utf-8');
  const constLines = constCsvText.trim().split('\n');

  // abr -> polylines (each is array of Star IDs)
  const polylinesByAbr = new Map<string, number[][]>();
  const lineSegmentsByAbr = new Map<string, ConstellationLineSegment[]>();
  let unmappedCount = 0;

  for (let i = 1; i < constLines.length; i++) {
    const parts = constLines[i].split(',').map(s => s.trim());
    if (parts.length < 2) continue;
    const abr = parts[0];
    const nr = parseInt(parts[1], 10);
    const starPath: number[] = [];
    const hrPath: number[] = [];

    for (let j = 0; j < nr; j++) {
      const hr = parseInt(parts[2 + j], 10);
      if (isNaN(hr)) continue;
      const star = hrToStar.get(hr);
      if (star) {
        starPath.push(star.id);
        hrPath.push(hr);
      } else {
        unmappedCount++;
        console.warn(`Unresolved HR reference in ${abr}: HR ${hr}`);
      }
    }

    if (starPath.length >= 2) {
      if (!polylinesByAbr.has(abr)) {
        polylinesByAbr.set(abr, []);
        lineSegmentsByAbr.set(abr, []);
      }
      polylinesByAbr.get(abr)!.push(starPath);

      const segments = lineSegmentsByAbr.get(abr)!;
      for (let k = 0; k < starPath.length - 1; k++) {
        segments.push({
          starId1: starPath[k],
          starId2: starPath[k + 1],
          hr1: hrPath[k],
          hr2: hrPath[k + 1],
        });
      }
    }
  }

  console.log(`Processed constellation line records. Total unmapped HR entries: ${unmappedCount}`);

  // Build IAU Constellation objects
  const constellations: IAUConstellation[] = [];

  for (const info of IAU_DATA) {
    const polylines = polylinesByAbr.get(info.id) || [];
    const lineSegments = lineSegmentsByAbr.get(info.id) || [];
    const starIdSet = new Set<number>();
    polylines.forEach(poly => poly.forEach(id => starIdSet.add(id)));
    const starIds = Array.from(starIdSet);

    // Find brightest star in this constellation
    let brightest = 'Unknown';
    let brightestMag = 999;
    for (const sid of starIds) {
      const star = stars.find(s => s.id === sid);
      if (star && star.mag < brightestMag) {
        brightestMag = star.mag;
        brightest = star.proper || star.name;
      }
    }

    constellations.push({
      id: info.id,
      name: info.name,
      genitive: info.genitive,
      englishName: info.english,
      area: info.area,
      raCenter: Number((info.raCenter * 15.0).toFixed(2)), // convert hours to degrees
      decCenter: info.decCenter,
      brightestStar: brightest,
      family: info.family,
      polylines,
      starIds,
      lineSegments,
    });
  }

  console.log(`Prepared ${constellations.length} IAU constellations.`);
  const withLines = constellations.filter(c => c.lineSegments.length > 0);
  console.log(`${withLines.length} constellations have active figure lines.`);

  const jsonStr = JSON.stringify(constellations, null, 2);
  fs.writeFileSync(OUTPUT_PUBLIC, jsonStr, 'utf-8');
  fs.writeFileSync(OUTPUT_SRC, jsonStr, 'utf-8');
  console.log(`Saved constellations.json to ${OUTPUT_PUBLIC} and ${OUTPUT_SRC}`);
}

main().catch(err => {
  console.error('Error preparing constellations:', err);
  process.exit(1);
});
