# AstroFA: System Architecture

AstroFA is architected as a modular, purely client-side static web application designed for deployment to static hosting platforms such as Cloudflare Pages.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          AstroFA Frontend                              │
│                                                                        │
│   ┌─────────────────────┐   ┌──────────────────────────────────────┐   │
│   │   Interactive Sky   │   │            Automata Lab              │   │
│   │     (Three.js)      │   │  - NFA / DFA Graphs (SVG)            │   │
│   │ - Celestial Sphere  │   │  - Subset Construction Visualizer    │   │
│   │ - Observer Alt/Az   │   │  - Hopcroft Minimization             │   │
│   │ - Star Raycasting   │   │  - String Stepper Simulator          │   │
│   └──────────┬──────────┘   └──────────────────┬───────────────────┘   │
│              │                                 │                       │
│              ▼                                 ▼                       │
│   ┌─────────────────────┐           ┌──────────────────────┐           │
│   │  Geometric Normal-  │           │   Automata Engine    │           │
│   │  ization & Encoder  │──────────▶│ - ε-Closure BFS      │           │
│   │  (Turning & Ratios) │           │ - Powerset DFA       │           │
│   └──────────┬──────────┘           │ - Hopcroft Min DFA   │           │
│              │                      └──────────┬───────────┘           │
│              ▼                                 │                       │
│   ┌─────────────────────┐                      │                       │
│   │ Procrustes 2D Align │◀─────────────────────┘                       │
│   │ (Residual & Verify) │                                              │
│   └─────────────────────┘                                              │
└────────────────────────────────────────────────────────────────────────┘
```

## Key Layers

1. **Astronomical Data Layer:**
   - 8,921 stars from HYG Database v3.8 (proper name, HR, HIP, HD, RA/Dec J2000, apparent magnitude, B-V color index, distance, spectral type).
   - 88 official IAU constellations with line segments mapped to Yale Bright Star numbers.
   - 24 reference pattern traversals across 12 prominent constellations.

2. **Astronomical Computation Layer:**
   - Powered by `astronomy-engine` for topocentric horizon conversions, precession, observer latitude/longitude coordinates, and simulated time flow.

3. **Three.js WebGL Rendering Engine:**
   - Instanced Points rendering on celestial sphere ($R = 500$).
   - Dynamic stellar point radial gradient texture.
   - Screen-space picking threshold raycaster for instantaneous star inspection.
   - Real observer horizontal frame rotation matrix applied directly to celestial sphere.

4. **Automata & Recognition Core (Pure TypeScript):**
   - Completely independent of React or Three.js.
   - Algorithmic implementation of $\varepsilon$-NFA, $\varepsilon$-closure, subset construction, complete DFA with dead trap state, and Hopcroft partition-refinement minimization.
   - Dual-layer recognition pipeline: Layer 1 (Automata acceptance & prefix checking) + Layer 2 (Geometric Procrustes shape alignment).

5. **State Management:**
   - Lightweight Zustand store coordinating observer position, simulation date, active views, trace state, and simulation steps.
