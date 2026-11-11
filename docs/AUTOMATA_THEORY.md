# Costellar: Automata Theory & Formal Language Foundations

Costellar implements a deterministic finite-state pattern recognition engine that converts celestial star asterisms into symbolic sequences over a finite geometric feature alphabet $\Sigma$, classifies them via a minimized DFA $M$, and validates shape geometry using similarity transformations.

---

## 1. Problem Definition

In computational astronomy, identifying constellations from user-traced stars is traditionally treated as a combinatorial graph matching or astrometric plate-solving problem. However, from the perspective of the **Theory of Computation**, an ordered trace of celestial bodies can be modeled as a string in a formal language:

$$w = a_1 a_2 \dots a_k \in \Sigma^*$$

where each symbol $a_i$ encodes the invariant geometric change in trajectory (turning angle and distance ratio) between successive star vectors. The recognition problem is to decide membership in the regular language:

$$L(\text{Costellar}) = \bigcup_{i=1}^P L(C_i)$$

where each $L(C_i)$ is the regular language of valid representations of constellation $C_i$.

---

## 2. Geometric Encoding: From Stars to Finite Alphabet $\Sigma$

Given an ordered sequence of $N \ge 3$ star positions $P_0, P_1, \dots, P_{N-1}$:

1. **Tangent-Plane Projection:** Celestial coordinates $(\alpha_i, \delta_i)$ in J2000 are projected to local tangent-plane Cartesian coordinates $(x_i, y_i)$ via Gnomonic projection centered at the pattern's spherical centroid.
2. **Translation & Uniform Scale Normalization:**
   $$\bar{P} = \frac{1}{N}\sum_{i=0}^{N-1} P_i, \quad S = \sqrt{\frac{1}{N}\sum_{i=0}^{N-1} |P_i - \bar{P}|^2}$$
   $$P'_i = \frac{P_i - \bar{P}}{S}$$
3. **Edge Vectors:** $E_i = P'_{i+1} - P'_i$ for $i = 0, \dots, N-2$.
4. **Relative Turning Angle $\theta_i$:**
   $$\theta_i = \text{atan2}(E_{i-1,x} E_{i,y} - E_{i-1,y} E_{i,x}, \; E_{i-1} \cdot E_i) \in [-180^\circ, +180^\circ]$$
5. **Edge Length Ratio $r_i$:**
   $$r_i = \frac{|E_i|}{|E_{i-1}|}$$

### Quantization Categories & Alphabet $\Sigma$

- **Turning Angle Bins:**
  - $\text{LL}$ (Sharp Left): $\theta \ge 65^\circ$
  - $\text{L}$ (Left): $20^\circ \le \theta < 65^\circ$
  - $\text{S}$ (Straight): $-20^\circ \le \theta < 20^\circ$
  - $\text{R}$ (Right): $-65^\circ \le \theta < -20^\circ$
  - $\text{RR}$ (Sharp Right): $\theta < -65^\circ$

- **Distance Ratio Bins:**
  - $\text{S}$ (Short): $r < 0.75$
  - $\text{M}$ (Medium): $0.75 \le r \le 1.35$
  - $\text{G}$ (Long / Grand): $r > 1.35$

The finite alphabet $\Sigma$ consists of the 15 combined symbols:
$$\Sigma = \{ \text{LL:S}, \text{LL:M}, \text{LL:G}, \text{L:S}, \text{L:M}, \text{L:G}, \text{S:S}, \text{S:M}, \text{S:G}, \text{R:S}, \text{R:M}, \text{R:G}, \text{RR:S}, \text{RR:M}, \text{RR:G} \}$$

---

## 3. Formal Definition of the ε-NFA

The nondeterministic finite automaton is defined as:

$$M_{\text{NFA}} = (Q_{\text{NFA}}, \Sigma, \delta_{\text{NFA}}, q_0, F_{\text{NFA}})$$

Where:
- $q_0 \in Q_{\text{NFA}}$ is the master initial state.
- For each reference pattern $p_k$ with symbol sequence $s_{k,1} s_{k,2} \dots s_{k,m}$:
  - An entry state $q_{k,0}$ is created with transition $(q_0, \varepsilon, q_{k,0}) \in \delta_{\text{NFA}}$.
  - States $q_{k,1}, \dots, q_{k,m}$ are connected linearly: $\delta_{\text{NFA}}(q_{k, j-1}, s_{k,j}) = \{ q_{k,j} \}$.
  - State $q_{k,m} \in F_{\text{NFA}}$ is accepting with label $\text{constellationId}(p_k)$.
- Bounded tolerance: If a feature is within $\pm 7.5^\circ$ or $\pm 0.12$ of a bin boundary, non-deterministic branches on the alternate symbol are added.

In Costellar:
- $|Q_{\text{NFA}}| = 107$ states
- $|\delta_{\text{NFA}}| = 142$ transitions
- $|\Sigma| = 15$ symbols

---

## 4. ε-Closure Algorithm

The $\varepsilon$-closure of a state subset $S \subseteq Q_{\text{NFA}}$ is defined as:

$$\varepsilon\text{-closure}(S) = S \cup \{ q' \in Q_{\text{NFA}} \mid \exists q \in \varepsilon\text{-closure}(S) \text{ such that } (q, \varepsilon, q') \in \delta_{\text{NFA}} \}$$

Costellar implements this via Breadth-First Search using a `Set<StateId>` visited tracker, ensuring cycle freedom and multi-hop chain correctness.

---

## 5. Subset Construction (NFA to DFA Determinization)

To eliminate nondeterminism, we apply the classic Rabin-Scott Powerset Construction:

1. **Initial DFA State:**
   $$D_0 = \varepsilon\text{-closure}(q_0)$$
2. **State Subsets:** Each DFA state represents a distinct subset $U \subseteq Q_{\text{NFA}}$.
3. **Transition Function:** For a DFA state $D = \{q_1, \dots, q_k\}$ and symbol $a \in \Sigma$:
   $$\text{Move}(D, a) = \bigcup_{q \in D} \delta_{\text{NFA}}(q, a)$$
   $$\delta_{\text{DFA}}(D, a) = \varepsilon\text{-closure}(\text{Move}(D, a))$$
4. **Acceptance:** $D \in F_{\text{DFA}}$ iff $D \cap F_{\text{NFA}} \neq \emptyset$.
   $$\text{labels}(D) = \bigcup_{q \in D \cap F_{\text{NFA}}} \text{labels}(q)$$

Costellar determinization result:
- Original DFA states: 74 active states + 1 dead trap state = 75 states.

---

## 6. DFA Minimization via Partition Refinement

Costellar implements Hopcroft-style partition refinement with a **strict academic constraint**:

### Label Preservation Invariant
> Accepting states with distinct constellation labels **must never be merged**, even if they exhibit identical future transitions. Merging them would destroy pattern identification.

### Initial Partition $P_0$:
$$P_0 = \{ Q_{\text{non-accepting}}, Q_{\text{dead}} \} \cup \left\{ Q_{L} \mid L \text{ is a unique set of accepting labels} \right\}$$

### Refinement Step:
A partition block $B \in P$ is split if two states $s_1, s_2 \in B$ transition into different blocks on any symbol $a \in \Sigma$:
$$\exists a \in \Sigma \text{ s.t. } \text{block}(\delta(s_1, a)) \neq \text{block}(\delta(s_2, a))$$

Costellar minimization result:
- Original States: 75
- Minimized States: 63 (12 redundant equivalent states merged, 16% reduction)
- Equivalence Classes preserved: 100% verified.

---

## 7. Worked Example: Recognizing Cassiopeia (W)

- **Input Stars:** Segin $\to$ Ruchbah $\to$ Cih ($\gamma$ Cas) $\to$ Schedar $\to$ Caph (HR 542, 403, 264, 168, 21).
- **Geometry:** 4 segments, 3 turns:
  1. Turn 1: $+72.4^\circ$ (LL), Ratio: 0.94 (M) $\implies$ `LL:M`
  2. Turn 2: $-68.1^\circ$ (RR), Ratio: 1.12 (M) $\implies$ `RR:M`
  3. Turn 3: $+43.6^\circ$ (L), Ratio: 0.88 (M) $\implies$ `L:M`
- **Input String:** $w = \text{["LL:M", "RR:M", "L:M"]}$
- **Trace through Minimized DFA:**
  - $\delta(m_0, \text{"LL:M"}) \to m_4$
  - $\delta(m_4, \text{"RR:M"}) \to m_{19}$
  - $\delta(m_{19}, \text{"L:M"}) \to m_{38} \in F$
- **State $m_{38}$:** Accepting state labeled `['Cas']`.
- **String Accepted!**

---

## 8. String Rejection: Symbolic vs. Geometric

Costellar distinctly separates:
1. **Symbolic Rejection:** The input string cannot be formed or reaches the dead/trap state $q_{\text{dead}}$. The automaton halts with $q \notin F$.
2. **Geometric Rejection:** The symbolic string is accepted by the DFA (e.g. coincidental zig-zag), but Layer 2 **Procrustes Analysis** reveals that the root-mean-square residual error exceeds the tolerance threshold:
   $$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^N |P_{\text{norm}, i} - R_{\text{rot}, i}|^2} > 0.32$$
   The application explicitly flags: *"DFA accepted symbolic pattern, but shape geometry was rejected."*

---

## 9. Algorithmic Complexity

| Phase | Time Complexity | Space Complexity |
|---|---|---|
| Gnomonic Projection | $O(N)$ | $O(N)$ |
| Geometric Normalization | $O(N)$ | $O(N)$ |
| Quantization | $O(N)$ | $O(N)$ |
| NFA Construction | $O(P \cdot L)$ | $O(P \cdot L)$ |
| $\varepsilon$-Closure BFS | $O(|V| + |E|)$ | $O(|V|)$ |
| Subset Construction | $O(2^{|Q_{\text{NFA}}|} \cdot |\Sigma|)$ worst-case; $O(|Q_{\text{DFA}}| \cdot |\Sigma|)$ practical | $O(|Q_{\text{DFA}}|)$ |
| DFA Minimization | $O(|\Sigma| \cdot |Q| \log |Q|)$ | $O(|Q|)$ |
| Simulation per string $w$ | $O(\|w\|)$ | $O(1)$ |
| 2D Procrustes Alignment | $O(N)$ | $O(N)$ |
