# Costellar: Test Execution Report

Costellar includes an automated test suite executed via Vitest covering all core theoretical algorithms and astronomical calculations.

## Test Summary

```
 RUN  v5.1.0 C:/ommd3076/Proejcts/automata-theory

 ✓ tests/geometry.test.ts (7 tests)
 ✓ tests/astronomy.test.ts (5 tests)
 ✓ tests/automata.test.ts (10 tests)
 ✓ tests/recognition.test.ts (4 tests)

 Test Files  4 passed (4)
      Tests  26 passed (26)
   Duration  < 400ms
```

---

## 1. Theory of Computation: Automata Core Tests (`tests/automata.test.ts`)

- **Basic ε-Closure:** Verified for single states with no outgoing ε-transitions.
- **Multi-hop ε-chains:** Correctly follows $q_0 \xrightarrow{\varepsilon} q_1 \xrightarrow{\varepsilon} q_2$.
- **ε-Cycle Freedom:** Verified that cyclic transitions $q_0 \xrightarrow{\varepsilon} q_1 \xrightarrow{\varepsilon} q_0$ terminate safely without infinite loops.
- **Empty Reference Set:** Verified graceful initialization with empty inputs.
- **Single Pattern Construction:** Verified NFA construction, determinization, and simulation for single linear patterns.
- **Shared Prefix Handling:** Proven that overlapping prefixes (e.g. Orion vs Cassiopeia initial sequences) are determinized into shared DFA states without cross-contamination.
- **Accepting Label Preservation Invariant:** Verified that states with distinct constellation labels are **never merged** during partition-refinement minimization.
- **Exhaustive Language Equivalence:** Verified that for all strings of length 0 to 3 over the alphabet, the DFA and the Minimized DFA agree 100% on language acceptance and returned constellation labels.
- **Dead/Trap State Handling:** Verified that undefined transitions in partial DFAs are routed to the sink trap state $q_{\text{dead}}$ in complete DFAs.
- **Ambiguous Pattern Resolution:** Verified that if two patterns share an identical sequence of feature symbols, the accepting state retains and reports both constellation identities.

---

## 2. Geometric Encoding & Invariance Tests (`tests/geometry.test.ts`)

- **Translation Invariance:** Shifting star coordinates by arbitrary $(+\Delta x, -\Delta y)$ produces identical turning angles, length ratios, and symbols.
- **Uniform Scale Invariance:** Scaling coordinates by arbitrary factors ($5.82\times$) preserves identical symbolic strings.
- **2D Rotation Invariance:** Rotating points by $63.5^\circ$ yields identical quantized symbols $\Sigma^*$.
- **Degenerate Edge Handling:** Zero-length / duplicate star coordinates are safely handled without producing `NaN` or crashes.
- **Boundary Tolerance:** Points near bin boundaries ($\pm 7.5^\circ$ or $\pm 0.12$) successfully generate valid alternate candidate symbols.
- **Procrustes Shape Verification:** Rotated and scaled copies of valid patterns achieve near-zero RMSE residuals ($< 0.01$).
- **Geometric Rejection:** Significantly warped shapes produce high residuals ($> 0.32$) and are geometrically rejected even if symbolic turns match.

---

## 3. Astronomical Computation Tests (`tests/astronomy.test.ts`)

- **Polaris Horizon Altitude:** For an observer at Greenwich ($51.48^\circ\text{N}$), Polaris is computed at altitude $51.6^\circ$, correctly reflecting observer latitude.
- **Horizon Occlusion:** Southern celestial pole stars (e.g. Acrux, Dec $-63.1^\circ$) are calculated below horizon ($\text{Alt} < 0$) for Northern observers.
- **Rotation Matrix Orthonormality:** The 3x3 EQJ to Horizontal matrix $R$ is verified orthonormal ($|R_i| = 1.0$).
- **3D Cartesian Conversion:** J2000 RA/Dec coordinates convert to accurate celestial sphere unit radius vectors.
- **Stellar Temperature Color Ramp:** Hot blue stars ($B-V = -0.2$) and cool red supergiants ($B-V = 1.8$) map to accurate blackbody stellar colors.

---

## 4. End-to-End Recognition Tests (`tests/recognition.test.ts`)

- **Curated Constellations:** All 24 reference pattern traversals across all 12 key constellations (Orion, Ursa Major, Ursa Minor, Cassiopeia, Cygnus, Scorpius, Leo, Gemini, Taurus, Canis Major, Lyra, Crux) are recognized with `FULL_MATCH` and residual $< 0.01$.
- **Rotated/Scaled Sky Traces:** Arbitrarily rotated real star paths are correctly recognized.
- **Prefix Recognition:** Tracing incomplete subsets of stars correctly returns `VALID_PREFIX` and the list of reachable candidate constellations.
- **Symbolic Rejection:** Random or invalid star connection sequences are rejected by the DFA.
