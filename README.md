# AstroFA: Interactive Constellation Recognition & Automata-Based Pattern Analysis

> **Explore the sky. Understand the pattern.**
>
> A Theory of Computation & Computational Astronomy web application connecting real celestial datasets with a custom finite-state pattern recognition engine.

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com)
[![Tests](https://img.shields.io/badge/Tests-26%2F26%20Passing-emerald)](https://github.com)
[![License](https://img.shields.io/badge/License-MIT%20%2F%20CC%20BY--SA%204.0-blue)](https://github.com)

---

## 🌟 Overview

AstroFA demonstrates how abstract **Theory of Computation** concepts—Deterministic Finite Automata (DFA), Nondeterministic Finite Automata (NFA), $\varepsilon$-closure, subset powerset construction, and partition-refinement minimization—power real-world geometric pattern recognition across the celestial sphere.

Users can explore an authentic 3D night sky renderer with **8,921 real stars** from the **HYG Star Database**, trace star asterisms in sequence, watch the geometry convert into a finite alphabet string $\Sigma^*$, and observe the state machine transition in real time to classify constellations.

---

## 🚀 Key Features

1. **Interactive 3D Celestial Sphere (Three.js WebGL):**
   - 8,921 real stars from the HYG database (magnitudes $V \le 6.5$ plus all constellation stars).
   - Real star visual magnitudes and B−V color index rendering (stellar temperature ramp).
   - Raycasted star inspector displaying catalog coordinates (RA/Dec J2000), local Horizontal coordinates (Altitude/Azimuth), distance, proper motion, and spectral type.
   - Real-time or simulated observer mode (custom latitude/longitude, global observatories, GPS geolocation, and time travel slider).

2. **Signature Capability: Trace-to-Recognize:**
   - Click stars in sequence on the sky to establish vector trajectories.
   - Translation-, uniform-scale-, and rotation-invariant geometric normalization.
   - Quantization into a 15-symbol feature alphabet $\Sigma$.
   - Live DFA prefix matching and full match recognition.
   - Dual-layer verification: Layer 1 (Automata acceptance) + Layer 2 (2D Procrustes shape residual check).

3. **Dedicated Automata Theory Lab:**
   - **ε-NFA Diagram:** Interactive vector diagram showing initial state $q_0$, $\varepsilon$-transitions, parallel constellation branches, and accepting states.
   - **ε-Closure Explorer:** Select any state or state subset to inspect its reachable $\varepsilon$-closure.
   - **Subset Construction Visualizer:** Step-by-step interactive trace of the powerset construction algorithm converting the NFA to a DFA.
   - **Determinized DFA:** Interactive topological layer graph of the DFA.
   - **Minimized DFA:** Side-by-side comparison of original DFA (75 states) vs minimized DFA (63 states, 16% reduction) with proof of label preservation.
   - **Step-by-Step String Simulator:** Input custom symbol sequences or load constellation presets with step back/forward, play/pause, and active state pulsing.
   - **Formal Definition Viewer:** Mathematical 5-tuple $M = (Q, \Sigma, \delta, q_0, F)$ populated dynamically from the active machine.
   - **Transition Table:** Searchable State $\times$ Alphabet transition matrix.
   - **Export Suite:** Export vector SVG diagrams, CSV transition tables, and JSON state machine specifications.

4. **Premium Science Modes:**
   - **Sky Tonight:** Computes all constellations currently above the horizon for the observer's location and timestamp.
   - **Constellation Explorer:** Complete catalog of all 88 official IAU constellations with asterism line figures and astronomical metadata.
   - **Constellation Hunt:** Educational challenge mode presenting target constellations, hiding figure lines, and scoring user traces.
   - **Image Lab:** Upload local night sky photography (JPG/PNG), apply automated 2D local-intensity star centroid detection, trace star paths on the photo, and run the recognition DFA client-side.
   - **Academic Demonstration (Viva Mode):** 11-step walkthrough built specifically for college viva and academic evaluations.
   - **Data Sources & Licensing:** Dedicated attribution page preserving CC BY-SA 4.0, CC BY 4.0, and MIT licenses.

---

## 📐 Formal Automata Specification

The pattern recognition engine models asterism recognition via the DFA:

$$M = (Q, \Sigma, \delta, q_0, F)$$

- **$Q$:** 63 minimized states (derived from 75 original states via Hopcroft partition refinement).
- **$\Sigma$:** 15 discrete geometric feature symbols:
  $$\Sigma = \{ \text{LL:S}, \text{LL:M}, \text{LL:G}, \text{L:S}, \text{L:M}, \text{L:G}, \text{S:S}, \text{S:M}, \text{S:G}, \text{R:S}, \text{R:M}, \text{R:G}, \text{RR:S}, \text{RR:M}, \text{RR:G} \}$$
  representing 5 turning angle categories ($\text{LL}, \text{L}, \text{S}, \text{R}, \text{RR}$) combined with 3 edge length ratios ($\text{S}, \text{M}, \text{G}$).
- **$q_0$:** Initial state representing $\varepsilon\text{-closure}(q_{0,\text{NFA}})$.
- **$F$:** Accepting states labeled with recognized constellation identities. States with distinct constellation labels are strictly preserved during minimization.
- **$\delta$:** Total transition function $\delta : Q \times \Sigma \to Q$ completed with a sink dead state $q_{\text{dead}}$.

---

## 🛠️ Technology Stack

- **Framework:** React 19 + TypeScript (Strict Mode)
- **Build Tool:** Vite 8
- **3D Graphics:** Three.js (WebGL Celestial Sphere, Instanced Points, Raycasting)
- **Astronomy Calculations:** Astronomy Engine (`astronomy-engine`)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Testing:** Vitest (26 unit tests covering automata, geometry, astronomy, and recognition)
- **Hosting Target:** Cloudflare Pages (Static SPA)

---

## 📦 Getting Started

### Prerequisites

- Node.js $\ge 18$
- npm $\ge 9$

### Installation

```bash
# Clone the repository
git clone https://github.com/example/astrofa.git
cd astrofa

# Install dependencies
npm install
```

### Running Locally

```bash
# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Running Test Suite

```bash
# Run all unit tests with Vitest
npm test
```

### Building for Production

```bash
# Type check and build static production bundle
npm run build

# Preview production build locally
npm run preview
```

The production output is emitted to the `dist/` directory.

---

## ☁️ Deployment (Cloudflare Pages)

AstroFA is a 100% static client-side web application and requires no custom backend or server-side database.

### Cloudflare Pages Build Settings:

- **Framework preset:** None (or Vite)
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Environment variables:** None required (no API keys needed)

For Single Page App (SPA) routing, Cloudflare Pages serves `dist/index.html` for all paths automatically.

---

## 📚 Documentation Links

- [Automata Theory Foundations](docs/AUTOMATA_THEORY.md)
- [System Architecture](docs/ARCHITECTURE.md)
- [Computational Algorithms](docs/ALGORITHMS.md)
- [Data Sources & Provenance](docs/DATA_SOURCES.md)
- [Test Execution Report](docs/TEST_REPORT.md)

---

## ⚖️ License & Attribution

- **AstroFA Codebase:** MIT License
- **HYG Star Database (v3.8):** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by David Nash / Astronexus.
- **Constellation Lines Dataset:** Creative Commons Attribution 4.0 International (CC BY 4.0) by Marc van der Sluys.
- **Astronomy Engine:** MIT License (c) 2019-2024 Don Cross.
