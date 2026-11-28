import React, { useState, useEffect } from 'react';
import { DETERMINIZATION_RESULT, DFA_MACHINE } from '../../data/astroData';
import { Button } from '../../components/ui/space/button';
import { Card } from '../../components/ui/space/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/space/table';

export const SubsetConstructionView: React.FC = () => {
  const steps = DETERMINIZATION_RESULT.steps;
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const step = steps[currentStepIdx] || steps[0];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIdx(prev => {
        if (prev < steps.length - 1) return prev + 1;
        setIsPlaying(false);
        return prev;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  return (
    <div className="w-full h-full flex flex-col gap-3 font-mono overflow-y-auto pr-0.5">
      {/* Overview Banner */}
      <Card className="atlas-surface p-3.5 rounded-xl gap-1.5 shrink-0 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" />
            <h3 className="font-bold text-[var(--ink-primary)] text-[11px] uppercase tracking-wider">
              Subset (Powerset) Construction Visualizer
            </h3>
            <span className="px-2 py-0.5 rounded bg-[var(--bg-pill-neutral)] text-[var(--signal-mid)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              NFA ({DETERMINIZATION_RESULT.dfa.states[0]?.nfaSubset.length || 25} BRANCHES) ➔ DFA ({DFA_MACHINE.states.length} STATES)
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary)] font-mono tracking-wider">
            STEP {currentStepIdx + 1} / {steps.length}
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed uppercase tracking-wider">
          Systematically determinizes NFA by tracking simultaneous state occupancy subsets.
          Computes move(S, a) and expands with ε-closure to build deterministic power states.
        </p>
      </Card>

      {/* Stepper Controls & Quantized LED Stepping Array */}
      <Card className="atlas-surface p-3 rounded-xl flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 shadow-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="xs"
            onClick={() => { setCurrentStepIdx(0); setIsPlaying(false); }}
            disabled={currentStepIdx === 0}
            className="text-[10px] font-mono font-semibold uppercase tracking-wider"
          >
            |◀ FIRST
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => { setCurrentStepIdx(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
            disabled={currentStepIdx === 0}
            className="text-[10px] font-mono font-semibold uppercase tracking-wider"
          >
            - STEP
          </Button>
          <Button
            variant={isPlaying ? 'outline' : 'default'}
            size="xs"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-[10px] font-mono font-semibold uppercase tracking-wider"
          >
            <span>{isPlaying ? '⏸ PAUSE' : '▶ RUN'}</span>
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => { setCurrentStepIdx(prev => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }}
            disabled={currentStepIdx === steps.length - 1}
            className="text-[10px] font-mono font-semibold uppercase tracking-wider"
          >
            + STEP
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => { setCurrentStepIdx(steps.length - 1); setIsPlaying(false); }}
            disabled={currentStepIdx === steps.length - 1}
            className="text-[10px] font-mono font-semibold uppercase tracking-wider"
          >
            LAST ▶|
          </Button>
        </div>

        {/* Quantized LED Stepping Array */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-[2px] p-1.5 bg-[var(--bg-tray)] rounded-[6px] border border-[var(--border-subtle)] overflow-x-auto">
            {steps.map((_, idx) => {
              const isActive = idx === currentStepIdx;
              const isPassed = idx < currentStepIdx;
              return (
                <Button
                  key={idx}
                  variant="ghost"
                  size="xs"
                  onClick={() => { setCurrentStepIdx(idx); setIsPlaying(false); }}
                  title={`Step ${idx + 1}`}
                  aria-label={`Jump to construction step ${idx + 1}`}
                  className={`h-4 sm:h-4 min-w-[5px] w-auto flex-1 shrink gap-0 rounded-[1px] border-0 p-0 transition-colors ${
                    isActive
                      ? 'bg-[var(--signal-cobalt)] hover:bg-[var(--signal-cobalt)]'
                      : isPassed
                        ? 'bg-[var(--signal-mid)] opacity-70 hover:bg-[var(--signal-mid)] hover:opacity-100'
                        : 'bg-[var(--dot-inactive)] hover:bg-[var(--bg-pill-active)]'
                  }`}
                />
              );
            })}
          </div>
          <div className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral)] text-[var(--signal-mid)] font-mono text-[10px] font-bold shrink-0">
            {Math.round(((currentStepIdx + 1) / steps.length) * 100)}%
          </div>
        </div>
      </Card>

      {/* Current Step Detailed Breakdown Card */}
      {step && (
        <Card className="atlas-surface rounded-xl p-3.5 gap-3 shrink-0 shadow-none">
          <div className="flex flex-wrap items-center justify-between border-b border-[var(--border-subtle)] pb-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded font-mono font-bold text-[10px] uppercase">
                STEP #{step.step}
              </span>
              <span className="text-[11px] font-semibold text-[var(--ink-primary)] uppercase tracking-wider">
                EVALUATING TRANSITION FROM {step.dfaStateId} ON SYMBOL [{step.symbol}]
              </span>
            </div>
            {step.isNewDfaState ? (
              <span className="px-2 py-0.5 bg-[var(--bg-pill-active)] border border-[var(--signal-surface)] text-[var(--signal-mid)] rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span>★ DISCOVERED NEW STATE: {step.targetDfaStateId}</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] rounded text-[10px] font-mono uppercase tracking-wider">
                REUSED EXISTING STATE {step.targetDfaStateId}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-xs">
            {/* 1. Source Subset */}
            <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[var(--ink-secondary)] tracking-wider">
                1. CURRENT DFA STATE: {step.dfaStateId}
              </div>
              <div className="text-[10px] text-[var(--ink-primary)] break-words leading-relaxed max-h-20 overflow-y-auto">
                {'{ ' + step.nfaSubset.join(', ') + ' }'}
              </div>
              <div className="text-[9px] text-[var(--ink-muted)] uppercase">
                SUBSET SIZE: {step.nfaSubset.length} STATES
              </div>
            </div>

            {/* 2. Direct Transition on Symbol */}
            <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[var(--signal-mid)] tracking-wider">
                2. MOVE(S, {step.symbol})
              </div>
              <div className="text-[10px] text-[var(--ink-primary)] break-words leading-relaxed max-h-20 overflow-y-auto">
                {'{ ' + (step.reachableNfaStates.length > 0 ? step.reachableNfaStates.join(', ') : '∅ (DEAD)') + ' }'}
              </div>
              <div className="text-[9px] text-[var(--ink-muted)] uppercase">
                REACHABLE: {step.reachableNfaStates.length} STATES
              </div>
            </div>

            {/* 3. Epsilon Closure Target Subset */}
            <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[var(--ink-primary)] tracking-wider">
                3. TARGET STATE: {step.targetDfaStateId}
              </div>
              <div className="text-[10px] text-[var(--ink-primary)] break-words leading-relaxed max-h-20 overflow-y-auto">
                {'{ ' + (step.epsilonClosureStates.length > 0 ? step.epsilonClosureStates.join(', ') : '∅') + ' }'}
              </div>
              <div className="text-[9px] text-[var(--ink-muted)] uppercase">
                CLOSURE: {step.epsilonClosureStates.length} STATES
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Discovered DFA States Table */}
      <Card className="atlas-surface rounded-xl p-3.5 gap-2 flex-1 flex flex-col shadow-none">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
            Complete Discovered DFA Powerset Matrix ({DFA_MACHINE.states.length} States)
          </h4>
          <span className="text-[10px] text-[var(--ink-muted)] font-mono uppercase tracking-wider">
            DETERMINISTIC EXPANSION
          </span>
        </div>

        <div className="flex-1 overflow-auto border border-[var(--border-subtle)] rounded-lg max-h-72 bg-[var(--bg-viewport)]">
          <Table className="text-xs font-mono">
            <TableHeader className="bg-[var(--bg-card-subtle)] sticky top-0 z-10">
              <TableRow>
                <TableHead className="p-2.5 uppercase text-[10px]">DFA STATE</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">FLAG</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">NFA STATE SUBSET</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">RECOGNITION LABELS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[11px]">
              {DFA_MACHINE.states.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="p-2.5 font-bold text-[var(--signal-mid)]">
                    <span className="font-mono tabular-nums text-xs">{s.id}</span>
                  </TableCell>
                  <TableCell className="p-2.5">
                    {s.isInitial && (
                      <span className="px-1.5 py-0.2 rounded bg-[var(--bg-pill-active)] text-[var(--signal-mid)] text-[9px] font-bold mr-1">
                        START
                      </span>
                    )}
                    {s.isAccepting && (
                      <span className="px-1.5 py-0.2 rounded bg-primary text-primary-foreground text-[9px] font-bold">
                        ACCEPT
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="p-2.5 text-[var(--ink-secondary)] whitespace-normal break-words max-w-lg text-[10px]">
                    {'{ ' + s.nfaSubset.join(', ') + ' }'}
                  </TableCell>
                  <TableCell className="p-2.5 text-[var(--signal-mid)] font-bold text-[10px] uppercase">
                    {s.acceptingLabels.join(', ') || '—'}
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
