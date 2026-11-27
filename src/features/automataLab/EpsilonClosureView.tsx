import React, { useState, useMemo } from 'react';
import { NFA_MACHINE } from '../../data/astroData';
import { computeEpsilonClosure } from '../../automata/epsilonClosure';
import type { StateId } from '../../automata/types';
import { Alert, AlertDescription, Button, Card } from './boardPrimitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './boardPrimitives';

export const EpsilonClosureView: React.FC = () => {
  const [selectedStates, setSelectedStates] = useState<StateId[]>(['q0']);

  // Compute closure for selected states
  const closure = useMemo(() => {
    return computeEpsilonClosure(NFA_MACHINE, selectedStates);
  }, [selectedStates]);

  // Compute closure for all states in NFA for quick table reference
  const allClosures = useMemo(() => {
    return NFA_MACHINE.states.map(s => ({
      stateId: s.id,
      stateName: s.name,
      closure: computeEpsilonClosure(NFA_MACHINE, s.id),
    }));
  }, []);

  const toggleState = (sid: StateId) => {
    if (selectedStates.includes(sid)) {
      if (selectedStates.length > 1) {
        setSelectedStates(selectedStates.filter(s => s !== sid));
      }
    } else {
      setSelectedStates([...selectedStates, sid]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col gap-3 font-mono overflow-y-auto pr-0.5">
      {/* Overview Banner */}
      <Card className="atlas-surface p-3.5 rounded-xl gap-1.5 shrink-0 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" />
            <h3 className="font-bold text-[var(--ink-primary)] text-[11px] uppercase tracking-wider">
              ε-Closure Computation Engine
            </h3>
            <span className="px-2 py-0.5 rounded bg-[var(--bg-pill-neutral)] text-[var(--signal-mid)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              BFS TRAVERSAL ON (Q, ε)
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary)] font-mono tracking-wider">
            ε-closure(S) = S ∪ {'{ q\' | ∃ q ∈ ε-closure(S) s.t. (q, ε, q\') ∈ δ }'}
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed uppercase tracking-wider">
          The ε-closure contains all states reachable from subset S through zero or more ε-transitions.
          Calculates the primary seed set for deterministic macro-state creation in Subset Construction.
        </p>
      </Card>

      {/* Interactive Selection & Result Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* State Selector Card */}
        <Card className="atlas-surface p-3.5 rounded-xl gap-2.5 flex flex-col shadow-none">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[var(--ink-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <span>SELECT INITIAL STATE(S) S:</span>
              <span className="text-[10px] text-[var(--ink-muted)] font-normal">
                ({selectedStates.length} ACTIVE)
              </span>
            </label>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setSelectedStates(['q0'])}
              className="text-[var(--signal-mid)] text-[10px] uppercase font-mono font-semibold tracking-wider"
            >
              RESET TO q₀
            </Button>
          </div>

          <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto p-2 bg-[var(--bg-viewport)] rounded-lg border border-[var(--border-subtle)]">
            {NFA_MACHINE.states.slice(0, 48).map(s => {
              const isSelected = selectedStates.includes(s.id);
              return (
                <Button
                  key={s.id}
                  variant={isSelected ? 'default' : 'outline'}
                  size="xs"
                  onClick={() => toggleState(s.id)}
                  aria-pressed={isSelected}
                  className="h-6 px-2 text-[10px] font-mono uppercase tracking-wider font-semibold"
                >
                  {s.id}
                </Button>
              );
            })}
          </div>
          <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">
            Toggle multiple states to observe collective subset closure expansion.
          </div>
        </Card>

        {/* Computed Result Card */}
        <Card className="atlas-surface p-3.5 rounded-xl gap-2.5 flex flex-col justify-between shadow-none">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--ink-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-mid)]" />
                <span>COMPUTED RESULT: ε-CLOSURE(S)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-[var(--bg-pill-active)] text-[var(--signal-mid)] text-[10px] font-bold uppercase tracking-wider">
                {closure.length} STATES REACHABLE
              </span>
            </div>

            {/* Recessed cavity for results */}
            <div className="p-3 bg-[var(--bg-viewport)] rounded-lg border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider">
                <span>INPUT SET S:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedStates.map(sid => (
                    <span
                      key={sid}
                      className="px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-[10px]"
                    >
                      {sid}
                    </span>
                  ))}
                </div>
              </div>

              {/* Discrete hardware token pills */}
              <div className="pt-1">
                <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider mb-1 font-semibold">
                  CLOSURE SET TOKENS:
                </div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1.5 bg-[var(--bg-card)] rounded-[6px] border border-[var(--border-subtle)]">
                  {closure.map(sid => (
                    <span
                      key={sid}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-pill-active)] border border-[var(--signal-surface)] text-[var(--signal-mid)] font-mono text-[10px] font-bold tracking-wider"
                    >
                      {sid}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Explanation if q0 selected */}
          {selectedStates.includes('q0') && (
            <Alert variant="info" className="p-2.5 text-[10px] uppercase tracking-wider">
              <AlertDescription className="text-[10px] leading-relaxed">
                <span className="font-bold text-[var(--signal-mid)]">TELEMETRY NOTE: </span>
                From initial state <strong className="font-bold">q₀</strong>, the ε-closure spans q₀ plus initial states of all 24 pattern branches.
                This deterministic set forms the initial macro-state <strong className="font-bold">D₀</strong> in Subset Construction.
              </AlertDescription>
            </Alert>
          )}
        </Card>
      </div>

      {/* Precomputed Reference Table */}
      <Card className="bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[12px] p-3.5 gap-2 flex-1 flex flex-col shadow-none">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
            Precomputed ε-Closure Reference Matrix
          </h4>
          <span className="text-[10px] text-[var(--ink-muted)] font-mono uppercase tracking-wider">
            {allClosures.length} NFA STATES INDEXED
          </span>
        </div>

        <div className="flex-1 overflow-auto border border-[var(--border-subtle)] rounded-[8px] max-h-80 bg-[var(--bg-card)]">
          <Table className="text-xs font-mono">
            <TableHeader className="bg-[var(--bg-card-subtle)] sticky top-0 z-10">
              <TableRow>
                <TableHead className="p-2.5 uppercase text-[10px]">STATE ID</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">PATTERN / LABEL</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">ε-CLOSURE TOKENS</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px] text-right">SIZE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[11px]">
              {allClosures.map(row => (
                <TableRow key={row.stateId}>
                  <TableCell className="p-2.5 text-[var(--signal-mid)] font-bold">{row.stateId}</TableCell>
                  <TableCell className="p-2.5 text-[var(--ink-secondary)] font-mono text-[10px] uppercase">
                    {row.stateName}
                  </TableCell>
                  <TableCell className="p-2.5 whitespace-normal">
                    <div className="flex flex-wrap gap-1 max-w-xl">
                      {row.closure.map(cid => (
                        <span
                          key={cid}
                          className="px-1 py-0.2 rounded-[3px] bg-[var(--bg-pill-neutral)] text-[var(--ink-primary)] text-[9px] font-mono border border-[var(--border-subtle)]"
                        >
                          {cid}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="p-2.5 text-right font-bold text-[var(--ink-primary)]">
                    {row.closure.length}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
