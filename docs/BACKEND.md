# Backend contract and runbook

## Implementation plan

The backend has two responsibilities: pass ordered trace points to a local C++ pattern matcher, and request daily observing-condition forecasts from Open-Meteo. It serves the built frontend and APIs from the same origin. Astronomy catalog browsing and photo pixel processing remain in the browser.

## API contract

### `POST /api/recognize`

Request JSON:

```json
{"points":[{"x":0.1,"y":0.2},{"x":0.4,"y":0.6},{"x":0.8,"y":0.3}]}
```

The request must contain 3–128 points. Every `x` and `y` must be finite and within ±1,000,000. The JSON body limit is 32 KiB. Invalid JSON returns 400, oversized bodies 413, invalid point sets 422, and unavailable worker errors 503.

Success returns `{ "status", "candidates", "bestMatch" }`. `status` is `FULL_MATCH`, `AMBIGUOUS`, or `NO_MATCH`; candidates include pattern/constellation identifiers, name, normalized residual, verification flag, rotation, and scale. `bestMatch` is a candidate or `null`.

The native worker compares only patterns with the same number of points. Its orientation-preserving Procrustes shape residual is combined with normalized path-segment and signed-turn residuals: `sqrt(0.80·shape² + 0.10·segment² + 0.10·turn²)`. Reflection is not allowed. Scores ≤0.18 are accepted; this threshold is fixture-informed and has not been calibrated against observed user traces. The catalog uses y-up coordinates. Traversals are deduplicated by constellation; the result is `AMBIGUOUS` when the top distinct-constellation scores differ by ≤0.015. The matcher embeds the 24 traversals from `src/data/referencePatterns.json`, covering 12 named constellations. A rejection means no curated trace met these criteria, not that the scene contains no constellation.

### `GET /api/observing-conditions?date=YYYY-MM-DD&lat=...&lon=...`

`date` must be a calendar date from 92 days before today through 16 days ahead. Latitude and longitude must be finite decimal degrees within ±90° and ±180°; the service rounds both to two decimals and requests UTC data from Open-Meteo's [Forecast API](https://open-meteo.com/en/docs). It returns `{date, coordinates, modelGrid, timeZone, timeScale, solar, conditions, hours, source, sourceUrl, attribution, licenseUrl}`. `solar` contains sunrise, sunset, sunshine duration, and daylight duration. `conditions` contains daily min/max temperature, mean cloud cover, precipitation and its maximum probability, maximum wind speed, and maximum UV index. `hours` contains 24 UTC records with temperature, total cloud cover, precipitation probability and amount, wind speed, and UV index. Numeric values and solar times may be `null` when unavailable; weather values are forecast-model output and can be revised as model runs update.

The endpoint selects the provider's automatic model blend, rather than a single fixed weather model. Open-Meteo documents a default seven-day forecast and up to 16 forecast days; it also exposes past forecast/observation ranges, but availability can vary by date and field. Sunrise and sunset are astronomical calculations supplied with the weather API. These are forecasts and computed solar times, not live weather-station observations and not a guarantee of clear or safe viewing conditions.

Invalid parameters return 400; upstream timeout, network, or schema errors return 503. The service bounds upstream JSON to 1 MiB, permits at most eight outstanding observing-condition requests, serializes upstream calls, and caches responses for 10 minutes by date and rounded coordinates (maximum 256 cached entries).

Open-Meteo publishes API data under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Its [licensing page](https://open-meteo.com/en/license) requires suitable credit and a link to [Open-Meteo.com](https://open-meteo.com/) near displayed data. The forecast display provides that link and identifies the fields as reformatted by Costellar. The free hosted API is for **non-commercial use**; commercial use requires an applicable paid API plan under [Open-Meteo's terms](https://open-meteo.com/en/terms). Current deployment/use classification has not been verified here. The documentation describes a blend of national weather-service models, selected by location and available variable. Open-Meteo does not warrant the accuracy, completeness, or reliability of its service.

USNO was explored as a daily Sun/Moon source, but its upstream connection reset in this environment; it is not part of the current observing-conditions UI or API contract.

## Data flow and privacy

- Sky Trace and Image Lab confirmation send only the selected ordered 2D points to the same-origin Costellar API. The API passes them to a local native process. Image Lab decodes and detects points in the browser, converts image y-down coordinates into the matcher’s y-up convention, and never uploads the photo. No observer location is part of trace recognition.
- Constellation Hunt success is based on a native `FULL_MATCH` for the target. The local DFA remains a diagnostic view. Preset and academic-demo traces are local educational reports and do not call the recognition API.
- Observing-condition lookup sends the selected UTC date and observer latitude/longitude to the Costellar service; the service rounds them to 0.01° and forwards the rounded location and date to Open-Meteo. Location is therefore disclosed to both Costellar hosting and Open-Meteo for this feature.
- The API sends `Cache-Control: no-store` on JSON responses. Hosting, reverse-proxy, or access logs are deployment-specific and are not configured or verified here.

## Startup

Prerequisites: Node.js 24, npm, and a C++17-capable toolchain. Windows builds use Zig 0.17+ (`zig.exe` on `PATH`, or a local cached copy under `native/.build/toolchain`) to compile `native/recognizer.cpp` to `native/.build/recognizer.wasm`. A fresh checkout does not include the ignored toolchain cache, so install Zig or place it on `PATH`. Unix-like builds use `g++` or the compiler named in `CXX` to build `native/.build/recognizer`. No additional npm runtime dependencies or API keys are required.

```powershell
npm install
npm run build
npm run dev
```

`npm run build` generates the catalog header, compiles the matcher for the current platform, type-checks the app, and writes the frontend to `dist/`. The Vite server serves the UI and same-origin API middleware at the URL it prints (normally `http://localhost:5173`). Rebuild after changing the curated pattern catalog. For production-style local serving, run:

```powershell
npm start
```

`npm start` serves `dist/` and the APIs from one Node HTTP server at `127.0.0.1:4173` by default; set `PORT` to change the port and `HOST` to change the bind address (for example, `HOST=0.0.0.0` behind a proxy). Run `npm run build` first. No runtime selector is currently exposed: Windows launches the WASI worker, while Unix-like systems launch the native executable. `npm run preview` is Vite's static preview and does not provide the API.

On Windows, the API starts `node native/runner.mjs` as a separate process. That runner loads `recognizer.wasm` with Node's `node:wasi` Preview 1 API, passes standard input/output through, and gives the module empty environment variables and no preopened directories. Node currently labels `node:wasi` experimental and states that it does not provide comprehensive secure filesystem sandboxing; Costellar uses it to run its trusted project module, not as a security boundary for untrusted code. See the [Node.js WASI documentation](https://nodejs.org/api/wasi.html). This WASI path avoids launching the unsigned Windows PE executable blocked by the current host Application Control policy; it does not change that host policy.

Available implementation checks include `npm run test:server` and `npm run verify:native`. The native fixture harness uses the platform's configured worker: WASI on Windows and the native executable on Unix-like systems.

## Verification boundary

The endpoint schema and matcher behavior are derived from the current source. Open-Meteo returned HTTP 200 in a direct environment request, but that does not verify the complete Costellar integration or future availability. No calibrated real-sky image evaluation dataset is documented here, and the 0.18 matcher threshold has not been measured against observed user traces. The historical test summary in `docs/TEST_REPORT.md` should not be treated as verification of this backend.
