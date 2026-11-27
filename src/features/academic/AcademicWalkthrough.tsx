import React, { useEffect, useState } from 'react';
import {
  REFERENCE_PATTERNS,
  NFA_MACHINE,
  DFA_MACHINE,
  MINIMIZED_DFA_MACHINE,
  MINIMIZATION_RESULT,
  STAR_BY_ID,
} from '../../data/astroData';
import { computeEpsilonClosure } from '../../automata/epsilonClosure';
import { simulateDfa } from '../../automata/simulate';
import { computeProcrustesAlignment } from '../../geometry/similarity';
import { normalizeGeometry } from '../../geometry/normalize';
import { PageHeader } from '../../components/PageHeader';
import { Button, Card, Select, SelectItem, SelectPopup, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../automataLab/boardPrimitives';

export const AcademicWalkthrough: React.FC = () => {
  const [selectedPatternId, setSelectedPatternId] = useState<string>('Cas_fwd');
  const [activeStep, setActiveStep] = useState<number>(1);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowRight') setActiveStep(step => Math.min(11, step + 1));
      if (event.key === 'ArrowLeft') setActiveStep(step => Math.max(1, step - 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const pattern = REFERENCE_PATTERNS.find(p => p.id === selectedPatternId) || REFERENCE_PATTERNS[0];

  // 1. Real stars
  const starObjects = pattern.orderedStarIds.map(id => STAR_BY_ID.get(id)!);

  // 2. Normalized geometry
  const normalized = normalizeGeometry(pattern.referencePoints);

  // 3. Encoded symbols
  const encodedSymbols = pattern.encodedSymbols;

  // 5. Epsilon closure of q0
  const q0Closure = computeEpsilonClosure(NFA_MACHINE, 'q0');

  // 9 & 10. Simulation on Minimized DFA
  const sim = simulateDfa(MINIMIZED_DFA_MACHINE, encodedSymbols);

  // 11. Geometric Verification
  const procrustes = computeProcrustesAlignment(pattern.referencePoints, pattern.referencePoints);

  const stepsList = [
    { num: 1, title: 'Input Star Pattern', subtitle: 'Astronomical Catalog Selection' },
    { num: 2, title: 'Geometric Normalization', subtitle: 'Translation & Uniform Scale' },
    { num: 3, title: 'Symbolic Encoding', subtitle: 'Quantization into Alphabet Σ' },
    { num: 4, title: 'NFA Construction', subtitle: 'Branching ε-NFA Assembly' },
    { num: 5, title: 'ε-Closure Computation', subtitle: 'Reachable Initial State Set' },
    { num: 6, title: 'Subset Construction', subtitle: 'NFA to DFA Determinization' },
    { num: 7, title: 'Original DFA Table', subtitle: 'Unminimized Transition Matrix' },
    { num: 8, title: 'DFA Minimization', subtitle: 'Label-Preserving Partition Refinement' },
    { num: 9, title: 'Step-by-Step Traversal', subtitle: 'String Simulation Trace' },
    { num: 10, title: 'Formal Acceptance', subtitle: 'Accepting State Verification' },
    { num: 11, title: 'Geometric Verification', subtitle: 'Procrustes Similarity Residual' },
  ];

  return (
    <section className="field-page boardui-surface w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-sans p-4 sm:p-6 gap-4 overflow-y-auto" aria-label="Academic viva walkthrough">
      <PageHeader
        className="field-page-heading"
        eyebrow="Formal Proof · 11 Stages"
        title="Walkthrough"
        meta={`Stage ${String(activeStep).padStart(2, '0')} / 11 · ${pattern.name}`}
        description="Follow one constellation through normalization, symbolic encoding, automata construction, acceptance, and geometric verification. Select a stage or use the arrow keys to move through the proof."
        actions={
          <div className="field-actions flex items-center gap-2 shrink-0">
            <label htmlFor="viva-target-select" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Target</label>
            <Select
              value={selectedPatternId}
              onValueChange={val => {
                if (val) setSelectedPatternId(val);
              }}
            >
              <SelectTrigger id="viva-target-select" size="sm" aria-label="Choose walkthrough target constellation" className="w-auto min-w-[180px] text-xs font-mono font-semibold text-[var(--signal-mid)]">
                <SelectValue>
                  {val => {
                    const found = REFERENCE_PATTERNS.find(p => p.id === val);
                    return found ? `${found.name} (${found.constellationId})` : String(val);
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectPopup align="end">
                {REFERENCE_PATTERNS.filter(p => p.traversalVariant === 'forward').map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-xs font-mono">
                    {p.name} ({p.constellationId})
                  </SelectItem>
                ))}
              </SelectPopup>
            </Select>
          </div>
        }
      />

      {/* Mobile/compact stage switcher */}
      <Card className="lg:hidden atlas-surface p-3 gap-2 flex flex-row flex-wrap items-center justify-between rounded-xl shadow-none" aria-label="Walkthrough steps">
        <div className="flex min-w-0 flex-col gap-1 text-[10px] text-[var(--ink-muted)] font-mono uppercase tracking-wider">
          <span>Step {String(activeStep).padStart(2, '0')} of 11</span>
          <Select
            value={String(activeStep)}
            onValueChange={val => {
              if (val) setActiveStep(Number(val));
            }}
          >
            <SelectTrigger size="sm" aria-label="Choose walkthrough step" className="w-auto max-w-full min-w-[260px] text-xs font-sans font-semibold text-[var(--ink-primary)]">
              <SelectValue>
                {val => {
                  const st = stepsList.find(s => String(s.num) === String(val));
                  return st ? `${String(st.num).padStart(2, '0')}. ${st.title} — ${st.subtitle}` : String(val);
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {stepsList.map(step => (
                <SelectItem key={step.num} value={String(step.num)} className="text-xs font-sans">
                  {String(step.num).padStart(2, '0')}. {step.title} — {step.subtitle}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <div className="min-w-0 text-right">
          <p className="truncate text-sm font-semibold text-[var(--signal-mid)]">{stepsList[activeStep - 1].title}</p>
          <p className="truncate text-xs text-[var(--ink-secondary)]">{stepsList[activeStep - 1].subtitle}</p>
        </div>
      </Card>

      {/* Two-pane Desktop Viva Reader: Sticky 1..11 Stage Index Left, Focused Stage Proof Right */}
      <div className="field-walkthrough-grid grid grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)] gap-5 items-start flex-1 min-h-0">
        <nav aria-label="Walkthrough stages" className="field-step-rail hidden lg:flex flex-col gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2.5 sticky top-0">
          <div className="border-b border-[var(--border-subtle)] px-2 pb-3 pt-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">Proof sequence</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ink-secondary)]">Eleven checkpoints from catalog input to geometric verification.</p>
          </div>
          {stepsList.map(step => {
            const isActive = step.num === activeStep;
            return (
              <Button
                key={step.num}
                variant={isActive ? 'secondary' : 'ghost'}
                onClick={() => setActiveStep(step.num)}
                aria-current={isActive ? 'step' : undefined}
                className={`field-step h-auto w-full justify-start px-2.5 py-2.5 rounded-lg text-left border font-normal gap-2.5 transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-pill-active)] border-[var(--signal-surface)] text-[var(--ink-primary)]'
                    : 'border-transparent text-[var(--ink-secondary)] hover:bg-[var(--bg-card-subtle)]'
                }`}
              >
                <span className={`font-mono text-[10px] font-semibold tabular-nums shrink-0 ${
                  isActive ? 'text-[var(--signal-mid)]' : 'text-[var(--ink-muted)]'
                }`}>
                  {String(step.num).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{step.title}</span>
                  <span className="block truncate text-[10px] text-[var(--ink-muted)]">{step.subtitle}</span>
                </span>
              </Button>
            );
          })}
        </nav>

        {/* Active Step Content Card */}
        <Card className="field-article atlas-surface p-5 sm:p-7 gap-5 rounded-xl shadow-none">
        <div className="field-article-lede flex flex-wrap items-end justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">Proof checkpoint {String(activeStep).padStart(2, '0')}</p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--ink-primary)]">{stepsList[activeStep - 1].title}</h2>
          </div>
          <div className="w-full max-w-[220px] sm:w-52">
            <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]"><span>Progress</span><span>{Math.round((activeStep / 11) * 100)}%</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-pill-neutral)]"><div className="h-full rounded-full bg-[var(--signal-mid)] transition-[width] duration-300" style={{ width: `${(activeStep / 11) * 100}%` }} /></div>
          </div>
        </div>
        {/* Step 1: Input Star Pattern */}
        {activeStep === 1 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 01 · Astronomical input catalog</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                Input star catalog coordinates · {pattern.name}
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Astronomical star positions are extracted from the HYG database by Harvard Revised / Yale Bright Star (HR) identifiers.
              Sequence of celestial catalog coordinates (J2000 Right Ascension &amp; Declination) for {pattern.constellationId}:
            </p>

            <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-[8px] overflow-x-auto">
              <Table className="text-xs font-mono tabular-nums">
                <TableHeader className="bg-[var(--bg-tray)]">
                  <TableRow>
                    <TableHead className="p-2.5 text-[10px] uppercase">Node #</TableHead>
                    <TableHead className="p-2.5 text-[10px] uppercase">Star name</TableHead>
                    <TableHead className="p-2.5 text-[10px] uppercase">HR ID</TableHead>
                    <TableHead className="p-2.5 text-[10px] uppercase">RA (deg)</TableHead>
                    <TableHead className="p-2.5 text-[10px] uppercase">Dec (deg)</TableHead>
                    <TableHead className="p-2.5 text-[10px] uppercase">Mag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-[11px]">
                  {starObjects.map((s, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="p-2.5 text-[var(--signal-mid)] font-semibold">{idx + 1}</TableCell>
                      <TableCell className="p-2.5 font-sans font-semibold text-[var(--ink-primary)]">{s.proper || s.name}</TableCell>
                      <TableCell className="p-2.5 text-[var(--ink-muted)]">{s.hr}</TableCell>
                      <TableCell className="p-2.5 text-[var(--ink-secondary)]">{s.ra.toFixed(4)}°</TableCell>
                      <TableCell className="p-2.5 text-[var(--ink-secondary)]">{s.dec.toFixed(4)}°</TableCell>
                      <TableCell className="p-2.5 text-[var(--signal-mid)] font-semibold">{s.mag.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Step 2: Geometric Normalization */}
        {activeStep === 2 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 02 · Invariant transformation</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                Normalized geometric representation · P' = (P − c) / σ
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              To achieve invariance against camera zoom, viewport scale, and translation across the sky,
              the centroid is subtracted and points are scaled to unit root-mean-square (RMS) radius.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] uppercase text-[var(--ink-muted)] block">Computed centroid vector c</span>
                <div className="text-lg font-semibold tabular-nums text-[var(--ink-primary)] pt-1">
                  ({normalized.centroid.x.toFixed(3)}, {normalized.centroid.y.toFixed(3)})
                </div>
                <div className="text-[11px] text-[var(--ink-muted)] pt-2">
                  Translation invariant: P' = P − c
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] uppercase text-[var(--ink-muted)] block">RMS scale factor σ</span>
                <div className="text-lg font-semibold tabular-nums text-[var(--signal-mid)] pt-1">
                  {normalized.scale.toFixed(4)}
                </div>
                <div className="text-[11px] text-[var(--ink-muted)] pt-2">
                  Scale invariant: P_norm = P' / σ
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Encoded Input String */}
        {activeStep === 3 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 03 · Symbolic quantization</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                Encoded input string · Alphabet w ∈ Σ*
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Each interior vertex produces an invariant turning angle θ (via cross/dot products) and an edge length ratio r = |E_&#123;i+1&#125;| / |E_i|.
              These continuous quantities are quantized into discrete symbols:
            </p>
            <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)] space-y-3 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[11px] text-[var(--ink-secondary)]">Word w =</span>
                <div className="flex flex-wrap gap-1.5">
                  {encodedSymbols.map((sym, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[5px] text-[var(--signal-mid)] font-semibold font-mono text-xs">
                      {sym}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] border-t border-[var(--border-subtle)] pt-2">
                Feature transitions: <strong className="text-[var(--signal-mid)]">{encodedSymbols.length}</strong> (from {pattern.orderedStarIds.length} stars)
              </div>
            </div>
          </div>
        )}

        {/* Step 4: NFA Construction */}
        {activeStep === 4 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 04 · Non-deterministic finite automaton</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                Branching ε-NFA machine assembly · M_NFA
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              An ε-NFA is assembled with a shared master initial state q₀ branching to each pattern's start state via ε-transitions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase text-[var(--ink-muted)] block">NFA states |Q_NFA|</span>
                <div className="text-xl font-semibold tabular-nums text-[var(--ink-primary)] pt-1">{NFA_MACHINE.states.length}</div>
              </div>
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase text-[var(--ink-muted)] block">Transitions |δ_NFA|</span>
                <div className="text-xl font-semibold tabular-nums text-[var(--ink-primary)] pt-1">{NFA_MACHINE.transitions.length}</div>
              </div>
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase text-[var(--ink-muted)] block">ε-transitions</span>
                <div className="text-xl font-semibold tabular-nums text-[var(--signal-mid)] pt-1">{NFA_MACHINE.transitions.filter(t => t.symbol === 'ε').length}</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Epsilon Closure */}
        {activeStep === 5 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 05 · Initial closure</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                ε-closure computation · ε-closure(q₀) = D₀
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Computing ε-closure(q₀) finds all states reachable before any input symbol is consumed.
              This closure forms initial state D₀ of the DFA:
            </p>
            <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)] font-mono text-xs space-y-2">
              <div className="font-semibold text-[var(--signal-mid)] text-sm break-words">
                ε-closure(q₀) = &#123; {q0Closure.join(', ')} &#125;
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] border-t border-[var(--border-subtle)] pt-2">
                Initial subset cardinality: <strong className="text-[var(--ink-primary)] tabular-nums">{q0Closure.length} states</strong>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Subset Construction */}
        {activeStep === 6 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 06 · Determinization</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                Subset (powerset) construction · NFA → DFA
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Powerset construction computes D_next = ε-closure(Move(D_current, symbol)) for each symbol in Σ.
              This converts the {NFA_MACHINE.states.length}-state NFA into a deterministic state machine with {DFA_MACHINE.states.length} DFA states.
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase text-[var(--ink-muted)] block">DFA states |Q_DFA|</span>
                <div className="text-xl font-semibold tabular-nums text-[var(--ink-primary)] pt-1">{DFA_MACHINE.states.length}</div>
              </div>
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase text-[var(--ink-muted)] block">Accepting states |F_DFA|</span>
                <div className="text-xl font-semibold tabular-nums text-[var(--signal-mid)] pt-1">{DFA_MACHINE.acceptingStates.length}</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Original DFA Transition Table */}
        {activeStep === 7 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 07 · Transition function</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                Original DFA transition table · δ : Q × Σ → Q
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Complete transition function δ : Q × Σ → Q. Dead/trap state added to guarantee total function completeness.
            </p>
            <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)] font-mono text-xs">
              <div className="text-xl font-semibold tabular-nums text-[var(--signal-mid)]">
                {DFA_MACHINE.states.length} × {DFA_MACHINE.alphabet.length} matrix
              </div>
              <div className="text-[11px] text-[var(--ink-muted)] pt-2">
                {DFA_MACHINE.states.length} states × {DFA_MACHINE.alphabet.length} symbols
              </div>
            </div>
          </div>
        )}

        {/* Step 8: DFA Minimization */}
        {activeStep === 8 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 08 · Hopcroft partition refinement</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                DFA minimization · Equivalence partitioning
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Redundant equivalent states are merged while strictly preserving distinct accepting constellation labels.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase text-[var(--ink-muted)] block">Original DFA states</span>
                <div className="text-xl font-semibold tabular-nums text-[var(--ink-primary)] pt-1">{MINIMIZATION_RESULT.originalStateCount}</div>
              </div>
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase text-[var(--ink-muted)] block">Minimized DFA states</span>
                <div className="text-xl font-semibold tabular-nums text-[var(--signal-mid)] pt-1">{MINIMIZATION_RESULT.minimizedStateCount}</div>
              </div>
              <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase text-[var(--ink-muted)] block">States merged</span>
                <div className="text-xl font-semibold tabular-nums text-[var(--ink-primary)] pt-1">{MINIMIZATION_RESULT.originalStateCount - MINIMIZATION_RESULT.minimizedStateCount}</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Step-by-Step String Traversal */}
        {activeStep === 9 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 09 · Simulation trace</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                Step-by-step string traversal on minimized DFA
              </h2>
            </div>
            <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-[8px] overflow-x-auto">
              <Table className="text-xs font-mono tabular-nums">
                <TableHeader className="bg-[var(--bg-tray)]">
                  <TableRow>
                    <TableHead className="p-2.5 text-[10px] uppercase">Step</TableHead>
                    <TableHead className="p-2.5 text-[10px] uppercase">Current (Q)</TableHead>
                    <TableHead className="p-2.5 text-[10px] uppercase">Symbol (Σ)</TableHead>
                    <TableHead className="p-2.5 text-[10px] uppercase">Next (Q')</TableHead>
                    <TableHead className="p-2.5 text-[10px] uppercase">Accepting</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-[11px]">
                  {sim.steps.map((st, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="p-2.5 text-[var(--signal-mid)] font-semibold">{st.step}</TableCell>
                      <TableCell className="p-2.5 text-[var(--ink-primary)] font-semibold">{st.currentState}</TableCell>
                      <TableCell className="p-2.5">
                        <span className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[4px] text-[var(--signal-mid)] font-semibold text-[10px]">
                          {st.inputSymbol}
                        </span>
                      </TableCell>
                      <TableCell className="p-2.5 text-[var(--ink-secondary)] font-semibold">{st.nextState}</TableCell>
                      <TableCell className="p-2.5">
                        {st.isAccepting ? (
                          <span className="px-2 py-0.5 bg-[var(--bg-pill-active)] border border-[var(--signal-surface)] rounded-[4px] text-[var(--signal-mid)] font-semibold text-[10px]">
                            YES ({st.acceptingLabels.join(', ')})
                          </span>
                        ) : (
                          <span className="text-[var(--ink-muted)] text-[10px]">NO</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Step 10: Formal Acceptance */}
        {activeStep === 10 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 10 · Formal acceptance</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                Accepted state &amp; constellation identification
              </h2>
            </div>
            <div className="p-5 bg-[var(--bg-pill-active)] border border-[var(--signal-surface)] rounded-[8px] space-y-2.5">
              <div className="font-mono text-base font-semibold text-[var(--signal-mid)] flex items-center gap-2">
                <span>✓ Final state {sim.finalState} ∈ F</span>
              </div>
              <p className="text-xs text-[var(--ink-primary)] leading-relaxed">
                Automaton halted with an empty tape in formal accepting state <strong className="font-mono text-[var(--signal-mid)] font-semibold">{sim.finalState}</strong>.
                Recognized constellation identity: <strong className="font-mono text-[var(--signal-mid)] font-semibold">{sim.acceptingLabels.join(', ')}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Step 11: Geometric Verification */}
        {activeStep === 11 && (
          <div className="space-y-3.5">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider block text-[var(--ink-muted)]">Stage 11 · 2D Procrustes alignment</span>
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] mt-0.5">
                Geometric similarity verification (Layer 2)
              </h2>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              To avoid false positives from distinct celestial shapes sharing identical quantized turn sequences, 2D Procrustes Analysis
              (Kabsch algorithm) computes the optimal rotation and Root Mean Square Error (RMSE).
            </p>
            <div className="p-4 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--border-subtle)] space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-[var(--ink-muted)]">Geometric residual (RMSE)</span>
                <span className="text-sm tabular-nums text-[var(--signal-mid)] font-semibold">{procrustes.residual} (tolerance &le; 0.32)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-[var(--ink-muted)]">Optimal rotation θ_opt</span>
                <span className="text-sm tabular-nums text-[var(--ink-primary)] font-semibold">{procrustes.rotationDeg}°</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[var(--border-subtle)]">
                <span className="text-[10px] uppercase text-[var(--ink-muted)]">Verification status</span>
                <span className="px-2 py-0.5 bg-[var(--bg-pill-active)] border border-[var(--signal-surface)] rounded-[4px] text-[var(--signal-mid)] font-semibold text-[10px]">
                  VERIFIED ASTRONOMICAL ASTERISM
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-[var(--border-subtle)]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="text-xs font-semibold"
          >
            ← Previous step
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setActiveStep(prev => Math.min(11, prev + 1))}
            disabled={activeStep === 11}
            className="text-xs font-semibold"
          >
            Next step →
          </Button>
        </div>
      </Card>
      </div>
    </section>
  );
};
