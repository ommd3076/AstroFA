# Costellar: Data Sources & Provenance

Costellar uses strictly authentic astronomical data from authoritative open scientific catalogs.

---

## 1. HYG Database v3.8

- **Primary Source:** [Codeberg Astronexus HYG](https://codeberg.org/astronexus/hyg)
- **Reference Mirror:** [GitHub astronexus/HYG-Database](https://github.com/astronexus/HYG-Database)
- **Release:** v3.8 (`hyg_v38.csv.gz`)
- **License:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- **Catalog Fields Ingested:**
  - `id`: Unique HYG identifier
  - `hip`: Hipparcos catalog ID
  - `hd`: Henry Draper catalog ID
  - `hr`: Harvard Revised / Yale Bright Star catalog ID
  - `proper`: Proper IAU name
  - `ra`, `dec`: J2000 celestial coordinates
  - `mag`: Visual magnitude ($V$)
  - `ci`: $B-V$ color index
  - `dist`: Distance in parsecs
  - `spect`: Spectral classification
  - `pmra`, `pmdec`: Proper motion in mas/yr
- **Ingestion Policy:** Preserve all naked-eye stars ($V \le 6.5$) and every star referenced by constellation line figures, then add the next brightest valid HYG records by apparent visual magnitude until the catalog contains at least **30,000 unique stars**. Ties are resolved by ascending HYG ID for reproducible output. Sol (ID 0), duplicate IDs, and records without finite in-range coordinates or a finite magnitude are excluded. The generated catalog contains 30,000 stars through magnitude **7.66**. Catalog magnitude describes source data and is not a promise that a star is visually observable: apparent visibility depends on sky conditions, optics, and display/rendering limits.

---

## 2. Constellation Lines Dataset

- **Primary Source:** [MarcvdSluys/ConstellationLines](https://github.com/MarcvdSluys/ConstellationLines)
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Citation:** Marc van der Sluys (2020)
- **Join Methodology:** Star vertices are mapped to HYG stars strictly via Yale Bright Star (`hr`) numbers. Unresolved references (e.g. historical omissions in secondary lists) are logged and reported.

---

## 3. IAU 88 Official Constellations

- **Primary Source:** International Astronomical Union (IAU) Constellation Register
- **Scope:** 88 official constellations, 3-letter IAU abbreviations, genitive names, English translations, and area in square degrees.
- **Scientific Principle:** Distinguishes IAU sky boundary regions from illustrative asterisms.

---

## 4. Astronomy Engine

- **Primary Source:** [cosinekitty/astronomy](https://github.com/cosinekitty/astronomy)
- **License:** MIT License (c) 2019-2024 Don Cross
- **Usage:** Topocentric coordinate transformations, horizontal coordinates (Altitude/Azimuth), Greenwich sidereal time, and precession matrix calculations.
