import React, { useState, useEffect } from 'react';
import { DETERMINIZATION_RESULT, DFA_MACHINE } from '../../data/astroData';

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
    <div className="w-full h-full flex flex-col gap-[6px] font-mono select-none overflow-y-auto pr-0.5">
      {/* Overview Banner — Bento Module Card */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] space-y-1.5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
            <h3 className="font-bold text-[var(--ink-primary,#181A20)] text-[11px] uppercase tracking-wider">
              Subset (Powerset) Construction Visualizer
            </h3>
            <span className="hud-reticle px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--signal-cobalt,#1D55F5)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              NFA ({DETERMINIZATION_RESULT.dfa.states[0]?.nfaSubset.length || 25} BRANCHES) ➔ DFA ({DFA_MACHINE.states.length} STATES)
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary,#525866)] font-mono tracking-wider">
            STEP {currentStepIdx + 1} / {steps.length}
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-secondary,#525866)] leading-relaxed uppercase tracking-wider">
          Systematically determinizes NFA by tracking simultaneous state occupancy subsets.
          Computes move(S, a) and expands with ε-closure to build deterministic power states.
        </p>
      </div>

      {/* Stepper Controls & Quantized LED Stepping Array */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3 rounded-[12px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        {/* Hardware Step Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => { setCurrentStepIdx(0); setIsPlaying(false); }}
            disabled={currentStepIdx === 0}
            className="hud-reticle px-2.5 py-1 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] disabled:opacity-40 text-[var(--ink-primary,#181A20)] text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            |◀ FIRST
          </button>
          <button
            onClick={() => { setCurrentStepIdx(prev => Math.max(0, prev - 1)); setIsPlaying(false); }}
            disabled={currentStepIdx === 0}
            className="hud-reticle px-2.5 py-1 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] disabled:opacity-40 text-[var(--ink-primary,#181A20)] text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            - STEP
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`hud-reticle active px-3 py-1 rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
              isPlaying
                ? 'bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--signal-cobalt,#1D55F5)] border border-[var(--signal-mid,#6892F6)]'
                : 'bg-[var(--signal-cobalt,#1D55F5)] text-white'
            }`}
          >
            <span>{isPlaying ? '⏸ PAUSE' : '▶ RUN'}</span>
          </button>
          <button
            onClick={() => { setCurrentStepIdx(prev => Math.min(steps.length - 1, prev + 1)); setIsPlaying(false); }}
            disabled={currentStepIdx === steps.length - 1}
            className="hud-reticle px-2.5 py-1 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] disabled:opacity-40 text-[var(--ink-primary,#181A20)] text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            + STEP
          </button>
          <button
            onClick={() => { setCurrentStepIdx(steps.length - 1); setIsPlaying(false); }}
            disabled={currentStepIdx === steps.length - 1}
            className="hud-reticle px-2.5 py-1 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] disabled:opacity-40 text-[var(--ink-primary,#181A20)] text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            LAST ▶|
          </button>
        </div>

        {/* Quantized LED Stepping Array (Zero Continuous Slider) */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-[2px] p-1.5 bg-[var(--bg-tray,#E2E5EC)] rounded-[6px] border border-[rgba(0,0,0,0.06)] overflow-x-auto">
            {steps.map((_, idx) => {
              const isActive = idx === currentStepIdx;
              const isPassed = idx < currentStepIdx;
              return (
                <button
                  key={idx}
                  onClick={() => { setCurrentStepIdx(idx); setIsPlaying(false); }}
                  title={`Step ${idx + 1}`}
                  className={`h-4 min-w-[5px] flex-1 rounded-[1px] transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[var(--signal-cobalt,#1D55F5)]'
                      : isPassed
                        ? 'bg-[var(--signal-mid,#6892F6)] opacity-70 hover:opacity-100'
                        : 'bg-[var(--dot-inactive,#C8CCD4)] hover:bg-[#B0B5C0]'
                  }`}
                />
              );
            })}
          </div>
          <div className="hud-reticle px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--signal-cobalt,#1D55F5)] font-mono text-[10px] font-bold shrink-0">
            {Math.round(((currentStepIdx + 1) / steps.length) * 100)}%
          </div>
        </div>
      </div>

      {/* Current Step Detailed Breakdown Card */}
      {step && (
        <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3.5 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between border-b border-[var(--bg-tray,#E2E5EC)] pb-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="hud-reticle active px-2 py-0.5 bg-[var(--signal-cobalt,#1D55F5)] text-white rounded-[4px] font-mono font-bold text-[10px] uppercase">
                STEP #{step.step}
              </span>
              <span className="text-[11px] font-semibold text-[var(--ink-primary,#181A20)] uppercase tracking-wider">
                EVALUATING TRANSITION FROM {step.dfaStateId} ON SYMBOL [{step.symbol}]
              </span>
            </div>
            {step.isNewDfaState ? (
              <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-active,#E0E8F9)] border border-[var(--signal-mid,#6892F6)] text-[var(--signal-cobalt,#1D55F5)] rounded-[4px] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span>★ DISCOVERED NEW STATE: {step.targetDfaStateId}</span>
              </span>
            ) : (
              <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-secondary,#525866)] rounded-[4px] text-[10px] font-mono uppercase tracking-wider">
                REUSED EXISTING STATE {step.targetDfaStateId}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-xs">
            {/* 1. Source Subset */}
            <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[var(--ink-secondary,#525866)] tracking-wider">
                1. CURRENT DFA STATE: {step.dfaStateId}
              </div>
              <div className="text-[10px] text-[var(--ink-primary,#181A20)] break-words leading-relaxed max-h-20 overflow-y-auto">
                {'{ ' + step.nfaSubset.join(', ') + ' }'}
              </div>
              <div className="text-[9px] text-[var(--ink-muted,#8C93A0)] uppercase">
                SUBSET SIZE: {step.nfaSubset.length} STATES
              </div>
            </div>

            {/* 2. Direct Transition on Symbol */}
            <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[var(--signal-cobalt,#1D55F5)] tracking-wider">
                2. MOVE(S, {step.symbol})
              </div>
              <div className="text-[10px] text-[var(--ink-primary,#181A20)] break-words leading-relaxed max-h-20 overflow-y-auto">
                {'{ ' + (step.reachableNfaStates.length > 0 ? step.reachableNfaStates.join(', ') : '∅ (DEAD)') + ' }'}
              </div>
              <div className="text-[9px] text-[var(--ink-muted,#8C93A0)] uppercase">
                REACHABLE: {step.reachableNfaStates.length} STATES
              </div>
            </div>

            {/* 3. Epsilon Closure Target Subset */}
            <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[var(--ink-primary,#181A20)] tracking-wider">
                3. TARGET STATE: {step.targetDfaStateId}
              </div>
              <div className="text-[10px] text-[var(--ink-primary,#181A20)] break-words leading-relaxed max-h-20 overflow-y-auto">
                {'{ ' + (step.epsilonClosureStates.length > 0 ? step.epsilonClosureStates.join(', ') : '∅') + ' }'}
              </div>
              <div className="text-[9px] text-[var(--ink-muted,#8C93A0)] uppercase">
                CLOSURE: {step.epsilonClosureStates.length} STATES
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discovered DFA States Table — Recessed Matrix List */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3.5 space-y-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-[var(--ink-primary,#181A20)] uppercase tracking-wider">
            Complete Discovered DFA Powerset Matrix ({DFA_MACHINE.states.length} States)
          </h4>
          <span className="text-[10px] text-[var(--ink-muted,#8C93A0)] font-mono uppercase tracking-wider">
            DETERMINISTIC EXPANSION
          </span>
        </div>

        <div className="flex-1 overflow-auto border border-[var(--bg-tray,#E2E5EC)] rounded-[8px] max-h-72 bg-[var(--bg-card,#F5F6F8)]">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-[var(--bg-tray,#E2E5EC)] text-[var(--ink-secondary,#525866)] uppercase text-[10px] sticky top-0 border-b border-[rgba(0,0,0,0.08)] font-semibold tracking-wider">
              <tr>
                <th className="p-2.5">DFA STATE</th>
                <th className="p-2.5">FLAG</th>
                <th className="p-2.5">NFA STATE SUBSET</th>
                <th className="p-2.5">RECOGNITION LABELS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg-tray,#E2E5EC)] text-[11px]">
              {DFA_MACHINE.states.map(s => (
                <tr key={s.id} className="hover:bg-[var(--bg-pill-neutral,#E6E9EF)] transition-colors">
                  <td className="p-2.5 font-bold text-[var(--signal-cobalt,#1D55F5)]">
                    <span className="font-['Doto',monospace] text-xs">{s.id}</span>
                  </td>
                  <td className="p-2.5">
                    {s.isInitial && (
                      <span className="hud-reticle px-1.5 py-0.2 rounded-[3px] bg-[var(--bg-pill-active,#E0E8F9)] text-[var(--signal-cobalt,#1D55F5)] text-[9px] font-bold mr-1">
                        START
                      </span>
                    )}
                    {s.isAccepting && (
                      <span className="hud-reticle active px-1.5 py-0.2 rounded-[3px] bg-[var(--signal-cobalt,#1D55F5)] text-white text-[9px] font-bold">
                        ACCEPT
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-[var(--ink-secondary,#525866)] break-words max-w-lg text-[10px]">
                    {'{ ' + s.nfaSubset.join(', ') + ' }'}
                  </td>
                  <td className="p-2.5 text-[var(--signal-cobalt,#1D55F5)] font-bold text-[10px] uppercase">
                    {s.acceptingLabels.join(', ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
