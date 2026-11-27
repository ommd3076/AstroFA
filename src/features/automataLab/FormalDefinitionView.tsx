import React from 'react';
import { MINIMIZED_DFA_MACHINE, DFA_MACHINE, NFA_MACHINE } from '../../data/astroData';
import { Card } from './boardPrimitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './boardPrimitives';

export const FormalDefinitionView: React.FC = () => {
  const dfa = MINIMIZED_DFA_MACHINE;

  const Q = dfa.states.map(s => s.id);
  const Sigma = dfa.alphabet;
  const q0 = dfa.initialState;
  const F = dfa.acceptingStates;

  return (
    <div className="w-full h-full flex flex-col gap-3 font-mono overflow-y-auto pr-0.5">
      {/* Overview Banner */}
      <Card className="atlas-surface p-3.5 rounded-xl gap-1.5 shrink-0 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" aria-hidden="true" />
            <h3 className="font-bold text-[var(--ink-primary)] text-[11px] uppercase tracking-wider">
              Mathematical Model: Formal 5-Tuple Definition
            </h3>
            <span className="px-2 py-0.5 rounded bg-[var(--bg-pill-active)] border border-[var(--signal-surface)] text-[var(--signal-mid)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              THEORY OF COMPUTATION SPECIFICATION
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary)] font-mono tracking-wider">
            CANONICAL REGULAR LANGUAGE MACHINE
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed uppercase tracking-wider">
          Rigorous academic specification of the constellation asterism recognition automaton.
          Complies with canonical Myhill-Nerode regular grammar definitions.
        </p>
      </Card>

      {/* Formal Definition Hero Display */}
      <Card className="atlas-surface p-4 rounded-xl gap-3 shadow-none">
        <div className="text-center py-3 bg-[var(--bg-viewport)] rounded-lg border border-[var(--border-subtle)]">
          <div className="text-xl sm:text-2xl font-mono font-normal text-[var(--ink-primary)] tracking-widest uppercase">
            M = ( Q, Σ, δ, q₀, F )
          </div>
          <div className="text-[10px] font-mono text-[var(--ink-secondary)] uppercase tracking-wider mt-1 font-semibold">
            DETERMINISTIC FINITE AUTOMATON FOR CONSTELLATION ASTERISM RECOGNITION
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-xs">
          {/* Q: States */}
          <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--signal-mid)] text-[11px] uppercase tracking-wider">
                Q (FINITE SET OF STATES)
              </span>
              <span className="text-[10px] text-[var(--ink-muted)] font-semibold">|Q| = {Q.length}</span>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider leading-relaxed">
              Equivalence classes of NFA state subsets produced by partition-refinement minimization.
            </p>
            <div className="text-[10px] text-[var(--ink-primary)] break-words max-h-20 overflow-y-auto p-2 bg-[var(--bg-viewport)] rounded border border-[var(--border-subtle)]">
              {'{ ' + Q.join(', ') + ' }'}
            </div>
          </div>

          {/* Sigma: Alphabet */}
          <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--signal-mid)] text-[11px] uppercase tracking-wider">
                Σ (FINITE FEATURE ALPHABET)
              </span>
              <span className="text-[10px] text-[var(--ink-muted)] font-semibold">|Σ| = {Sigma.length}</span>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider leading-relaxed">
              Quantized pairs of relative turning category {'{LL, L, S, R, RR}'} and edge length ratio {'{S, M, G}'}.
            </p>
            <div className="text-[10px] text-[var(--ink-primary)] break-words p-2 bg-[var(--bg-viewport)] rounded border border-[var(--border-subtle)]">
              {'{ ' + Sigma.join(', ') + ' }'}
            </div>
          </div>

          {/* q0: Initial State */}
          <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--signal-mid)] text-[11px] uppercase tracking-wider">
                q₀ (INITIAL START STATE)
              </span>
              <span className="text-[10px] text-[var(--ink-muted)] font-semibold">q₀ ∈ Q</span>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider leading-relaxed">
              Corresponds to ε-closure(q₀, NFA), the unified entry macro-state before input consumption.
            </p>
            <div className="text-[11px] text-[var(--signal-mid)] font-bold p-2 bg-[var(--bg-viewport)] rounded border border-[var(--border-subtle)] font-mono tabular-nums">
              q₀ = {q0}
            </div>
          </div>

          {/* F: Accepting States */}
          <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--signal-mid)] text-[11px] uppercase tracking-wider">
                F (SET OF ACCEPTING STATES)
              </span>
              <span className="text-[10px] text-[var(--ink-muted)] font-semibold">|F| = {F.length} STATES</span>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider leading-relaxed">
              Terminal acceptance states with constellation asterism label annotations:
            </p>
            <div className="text-[10px] text-[var(--ink-primary)] break-words max-h-20 overflow-y-auto p-2 bg-[var(--bg-viewport)] rounded border border-[var(--border-subtle)] space-y-0.5">
              {F.map(fid => {
                const s = dfa.states.find(state => state.id === fid);
                return (
                  <div key={fid} className="flex items-center gap-1.5">
                    <strong className="text-[var(--signal-mid)] font-mono tabular-nums">{fid}:</strong>
                    <span className="uppercase text-[9px] text-[var(--ink-secondary)]">[{s?.acceptingLabels.join(', ')}]</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Transition Function delta */}
        <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] space-y-1 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--signal-mid)] text-[11px] uppercase tracking-wider">
              δ (TRANSITION FUNCTION)
            </span>
            <span className="text-[10px] text-[var(--ink-muted)] font-semibold">δ : Q × Σ ➔ Q</span>
          </div>
          <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider leading-relaxed">
            Deterministic total mapping. Total transitions defined: <strong className="text-[var(--ink-primary)]">{dfa.transitions.length}</strong> (including explicit dead state transitions guaranteeing total function completeness).
          </p>
        </div>
      </Card>

      {/* Model Hierarchy Comparison Table */}
      <Card className="atlas-surface rounded-xl p-3.5 gap-2 flex-1 flex flex-col shadow-none">
        <h4 className="text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
          Automata Hierarchy in Costellar Pipeline
        </h4>
        <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-viewport)]">
          <Table className="text-xs font-mono">
            <TableHeader className="bg-[var(--bg-card-subtle)]">
              <TableRow>
                <TableHead className="p-2.5 uppercase text-[10px]">MACHINE MODEL</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">TYPE</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">STATES |Q|</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">TRANSITIONS |δ|</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">DETERMINISM</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">LANGUAGE L(M)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[11px]">
              <TableRow>
                <TableCell className="p-2.5 font-bold text-[var(--signal-mid)]">NFA MACHINE</TableCell>
                <TableCell className="p-2.5 text-[var(--ink-secondary)] uppercase text-[10px]">ε-NFA LINEAR CHAINS</TableCell>
                <TableCell className="p-2.5 text-[var(--ink-primary)] font-bold">{NFA_MACHINE.states.length}</TableCell>
                <TableCell className="p-2.5 text-[var(--ink-primary)] font-bold">{NFA_MACHINE.transitions.length}</TableCell>
                <TableCell className="p-2.5 text-[var(--ink-secondary)] uppercase text-[10px]">NONDETERMINISTIC</TableCell>
                <TableCell className="p-2.5 text-[var(--signal-mid)] font-bold text-[10px]">L(COSTELLAR)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2.5 font-bold text-[var(--signal-mid)]">DFA MACHINE</TableCell>
                <TableCell className="p-2.5 text-[var(--ink-secondary)] uppercase text-[10px]">SUBSET POWERSET DFA</TableCell>
                <TableCell className="p-2.5 text-[var(--ink-primary)] font-bold">{DFA_MACHINE.states.length}</TableCell>
                <TableCell className="p-2.5 text-[var(--ink-primary)] font-bold">{DFA_MACHINE.transitions.length}</TableCell>
                <TableCell className="p-2.5 text-[var(--signal-mid)] uppercase text-[10px] font-bold">DETERMINISTIC</TableCell>
                <TableCell className="p-2.5 text-[var(--signal-mid)] font-bold text-[10px]">L(COSTELLAR) IDENTICAL</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="p-2.5 font-bold text-[var(--signal-mid)]">MINIMIZED DFA</TableCell>
                <TableCell className="p-2.5 text-[var(--ink-secondary)] uppercase text-[10px]">HOPCROFT MINIMIZED</TableCell>
                <TableCell className="p-2.5 text-[var(--signal-mid)] font-bold">{MINIMIZED_DFA_MACHINE.states.length}</TableCell>
                <TableCell className="p-2.5 text-[var(--signal-mid)] font-bold">{MINIMIZED_DFA_MACHINE.transitions.length}</TableCell>
                <TableCell className="p-2.5 text-[var(--signal-mid)] uppercase text-[10px] font-bold">CANONICAL MINIMAL</TableCell>
                <TableCell className="p-2.5 text-[var(--signal-mid)] font-bold text-[10px]">L(COSTELLAR) ISOMORPHIC</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
