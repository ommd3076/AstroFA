# Costellar

Costellar is an interactive astronomy and computation project. It combines a real star catalog and constellation figures with a trace-recognition experience and visual automata learning tools.

## Implementation plan

1. Replace the old trace path with a custom C++ matcher over a curated catalog of 12 constellations and 24 traversal variants. Recognition scope stays explicit; this is not blind image plate solving and does not recognize all 88 constellations.
2. Add a same-origin Node service for trace recognition and Open-Meteo observing-condition forecasts. Trace confirmation sends ordered 2D points to Costellar; forecast requests use the selected UTC date and observer coordinates rounded to 0.01°.
3. Connect the interface, document the data flow and privacy boundary, and verify the startup and API contract against the implementation.

## Current project

The app includes an interactive star-sky explorer, an 88-entry IAU constellation catalog, a curated trace exercise, astronomy tools, and an automata lab. The 88-entry catalog is for exploration; recognition is limited to the curated trace patterns above. Photo pixels are processed in the browser; no image upload is part of the backend contract.

## Run locally

See [Backend contract and runbook](docs/BACKEND.md) for prerequisites, build, development, and production startup.

## Project references

- [Original request](ORIGINAL_REQUEST.md)
- [Data sources and provenance](docs/DATA_SOURCES.md)
- [Automata theory](docs/AUTOMATA_THEORY.md)
- [Algorithms](docs/ALGORITHMS.md)
- [Earlier test report](docs/TEST_REPORT.md) — historical report; confirm against the current checkout before relying on it.

## Data and attribution

Catalog source files and licensing notes are in [Data sources and provenance](docs/DATA_SOURCES.md). Astronomy Engine is MIT licensed. The source files retain attribution for the HYG star database and constellation line dataset.
