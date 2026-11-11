import React, { useState, useEffect, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS } from '../../data/astroData';
import { simulateDfa } from '../../automata/simulate';

export const SimulatorView: React.FC = () => {
  const {
    simulatorSymbols,
    setSimulatorSymbols,
    simulatorStep,
    setSimulatorStep,
    simulatorIsPlaying,
    setSimulatorIsPlaying,
  } = useAstroStore();

  const [inputStringRaw, setInputStringRaw] = useState<string>(simulatorSymbols.join(' '));
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(750);

  // Parse raw text into symbol array
  const handleApplyInput = () => {
    const parsed = inputStringRaw
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    setSimulatorSymbols(parsed);
  };

  // Run full simulation
  const simResult = useMemo(() => {
    return simulateDfa(MINIMIZED_DFA_MACHINE, simulatorSymbols);
  }, [simulatorSymbols]);

  const totalSteps = simResult.steps.length;
  const currentStep = simulatorStep > 0 && simulatorStep <= totalSteps ? simResult.steps[simulatorStep - 1] : null;

  // Active state at current step
  const activeStateId = currentStep ? currentStep.nextState : MINIMIZED_DFA_MACHINE.initialState;
  const activeState = MINIMIZED_DFA_MACHINE.states.find(s => s.id === activeStateId);

  // Playback timer
  useEffect(() => {
    if (!simulatorIsPlaying) return;
    const interval = setInterval(() => {
      setSimulatorStep(prev => {
        if (prev < totalSteps) {
          return prev + 1;
        } else {
          setSimulatorIsPlaying(false);
          return prev;
        }
      });
    }, playbackSpeedMs);
    return () => clearInterval(interval);
  }, [simulatorIsPlaying, totalSteps, playbackSpeedMs, setSimulatorStep, setSimulatorIsPlaying]);

  const isFinalStep = simulatorStep === totalSteps;

  return (
    <div className="w-full h-full flex flex-col gap-[6px] font-mono select-none overflow-y-auto pr-0.5">
      {/* Overview Banner — Module Card */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] space-y-1.5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
            <h3 className="font-bold text-[var(--ink-primary,#181A20)] text-[11px] uppercase tracking-wider">
              DFA Step-by-Step String Simulator
            </h3>
            <span className="hud-reticle px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--signal-cobalt,#1D55F5)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              MACHINE: MINIMIZED DFA ({MINIMIZED_DFA_MACHINE.states.length} STATES)
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary,#525866)] font-mono tracking-wider">
            TAPE HEAD: {simulatorStep} / {totalSteps} SYMBOLS
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-secondary,#525866)] leading-relaxed uppercase tracking-wider">
          Single-step execution over formal transition function δ. Inspects discrete tape consumption,
          active state transitions, and deterministic acceptance criteria.
        </p>
      </div>

      {/* String Input & Preset Toolbar */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3 rounded-[12px] space-y-2.5 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 flex gap-2">
            <div className="hud-reticle flex-1">
              <input
                type="text"
                value={inputStringRaw}
                onChange={e => setInputStringRaw(e.target.value)}
                placeholder="E.G. LL:M RR:M L:M OR S:S R:G"
                className="w-full bg-[var(--bg-card,#F5F6F8)] border border-[var(--bg-tray,#E2E5EC)] rounded-[6px] px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--ink-primary,#181A20)] placeholder:text-[var(--ink-muted,#8C93A0)]"
              />
            </div>
            <button
              onClick={handleApplyInput}
              className="hud-reticle active px-3.5 py-1.5 bg-[var(--signal-cobalt,#1D55F5)] text-white rounded-[6px] text-[10px] font-mono uppercase tracking-wider font-semibold cursor-pointer shrink-0"
            >
              LOAD STRING
            </button>
          </div>

          {/* Quick presets */}
          <div className="hud-reticle">
            <select
              onChange={e => {
                const pat = REFERENCE_PATTERNS.find(p => p.id === e.target.value);
                if (pat) {
                  setInputStringRaw(pat.encodedSymbols.join(' '));
                  setSimulatorSymbols(pat.encodedSymbols);
                }
              }}
              defaultValue=""
              className="bg-[var(--bg-card,#F5F6F8)] border border-[var(--bg-tray,#E2E5EC)] rounded-[6px] px-2.5 py-1.5 text-[10px] text-[var(--ink-primary,#181A20)] font-mono uppercase tracking-wider cursor-pointer"
            >
              <option value="" disabled>-- PRESET PATTERNS --</option>
              {REFERENCE_PATTERNS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name.toUpperCase()} [{p.encodedSymbols.join(' ')}]
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick-insert alphabet symbol buttons */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[var(--bg-tray,#E2E5EC)]">
          <span className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase font-semibold mr-1">
            ALPHABET Σ:
          </span>
          {MINIMIZED_DFA_MACHINE.alphabet.map((sym, idx) => (
            <button
              key={idx}
              onClick={() => {
                const nextStr = inputStringRaw ? `${inputStringRaw} ${sym}` : sym;
                setInputStringRaw(nextStr);
                setSimulatorSymbols(nextStr.split(/\s+/));
              }}
              className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[var(--bg-pill-active,#E0E8F9)] text-[var(--ink-primary,#181A20)] rounded-[4px] text-[10px] font-mono border border-[rgba(0,0,0,0.06)] transition-colors cursor-pointer"
            >
              +{sym}
            </button>
          ))}
        </div>
      </div>

      {/* Stepper Controls */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-2.5 rounded-[12px] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setSimulatorStep(0); setSimulatorIsPlaying(false); }}
            disabled={simulatorStep === 0}
            className="hud-reticle px-2.5 py-1 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] disabled:opacity-40 text-[var(--ink-primary,#181A20)] text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            |◀ RESET
          </button>
          <button
            onClick={() => { setSimulatorStep(prev => Math.max(0, prev - 1)); setSimulatorIsPlaying(false); }}
            disabled={simulatorStep === 0}
            className="hud-reticle px-2.5 py-1 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] disabled:opacity-40 text-[var(--ink-primary,#181A20)] text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            - STEP
          </button>
          <button
            onClick={() => setSimulatorIsPlaying(!simulatorIsPlaying)}
            className={`hud-reticle active px-3 py-1 rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
              simulatorIsPlaying
                ? 'bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--signal-cobalt,#1D55F5)] border border-[var(--signal-mid,#6892F6)]'
                : 'bg-[var(--signal-cobalt,#1D55F5)] text-white'
            }`}
          >
            <span>{simulatorIsPlaying ? '⏸ PAUSE' : '▶ RUN'}</span>
          </button>
          <button
            onClick={() => { setSimulatorStep(prev => Math.min(totalSteps, prev + 1)); setSimulatorIsPlaying(false); }}
            disabled={simulatorStep === totalSteps}
            className="hud-reticle px-2.5 py-1 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] disabled:opacity-40 text-[var(--ink-primary,#181A20)] text-[10px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            + STEP
          </button>
        </div>

        {/* Playback speed selector */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase font-semibold">
            SPEED:
          </label>
          <div className="hud-reticle">
            <select
              value={playbackSpeedMs}
              onChange={e => setPlaybackSpeedMs(Number(e.target.value))}
              className="bg-[var(--bg-card,#F5F6F8)] border border-[var(--bg-tray,#E2E5EC)] rounded-[6px] px-2 py-0.5 text-[10px] text-[var(--ink-primary,#181A20)] font-mono uppercase cursor-pointer"
            >
              <option value={1200}>0.5X SLOW (1.2S)</option>
              <option value={750}>1.0X NORMAL (750MS)</option>
              <option value={350}>2.0X FAST (350MS)</option>
              <option value={150}>5.0X TURBO (150MS)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interactive Active State & Tape HUD Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[6px]">
        {/* Active State Card */}
        <div className="p-3.5 bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--ink-secondary,#525866)] tracking-wider">
              ACTIVE TELEMETRY STATE
            </span>
            {activeState?.isAccepting ? (
              <span className="hud-reticle active px-2 py-0.5 bg-[var(--signal-cobalt,#1D55F5)] text-white rounded-[4px] text-[9px] font-bold font-mono uppercase tracking-wider">
                ACCEPTING STATE
              </span>
            ) : activeState?.isDead ? (
              <span className="hud-reticle px-2 py-0.5 bg-[#8C93A0] text-white rounded-[4px] text-[9px] font-bold font-mono uppercase tracking-wider">
                DEAD / TRAP STATE
              </span>
            ) : (
              <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-secondary,#525866)] rounded-[4px] text-[9px] font-mono uppercase tracking-wider">
                TRANSIT STATE
              </span>
            )}
          </div>

          {/* Recessed HUD reticle cavity and Doto LED active state readout */}
          <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] flex items-center gap-3">
            <div className="w-14 h-14 rounded-[8px] bg-[var(--bg-card,#F5F6F8)] border border-[var(--reticle-tick,#8FA4C4)] flex items-center justify-center font-['Doto',monospace] font-bold text-[var(--signal-cobalt,#1D55F5)] text-xl hud-reticle active shrink-0">
              {activeStateId}
            </div>
            <div className="space-y-0.5 overflow-hidden">
              <div className="text-[11px] font-bold text-[var(--ink-primary,#181A20)] truncate uppercase">
                {activeState?.name}
              </div>
              {activeState?.acceptingLabels && activeState.acceptingLabels.length > 0 && (
                <div className="text-[10px] font-mono text-[var(--signal-cobalt,#1D55F5)] font-bold uppercase tracking-wider">
                  RECOGNIZES: {activeState.acceptingLabels.join(', ')}
                </div>
              )}
            </div>
          </div>

          {currentStep && (
            <div className="text-[10px] font-mono text-[var(--ink-primary,#181A20)] bg-[var(--bg-tray,#E2E5EC)] p-2 rounded-[6px] border border-[rgba(0,0,0,0.06)] uppercase tracking-wider">
              TRANSITION: <strong className="text-[var(--signal-cobalt,#1D55F5)] font-['Doto',monospace]">{currentStep.currentState}</strong> ──[<span className="text-[var(--signal-cobalt,#1D55F5)] font-bold">{currentStep.inputSymbol}</span>]──➔ <strong className="text-[var(--signal-cobalt,#1D55F5)] font-['Doto',monospace]">{currentStep.nextState}</strong>
            </div>
          )}
        </div>

        {/* Input Symbol Tape & Acceptance Outcome Card */}
        <div className="p-3.5 bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-[var(--ink-secondary,#525866)] tracking-wider">
            INPUT SYMBOL TAPE (Σ*)
          </div>

          {/* Discrete Mechanical Tape Cells */}
          <div className="p-2.5 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] flex items-center gap-1.5 overflow-x-auto min-h-[48px]">
            {simulatorSymbols.map((sym, idx) => {
              const isConsumed = idx < simulatorStep;
              const isCurrent = idx === simulatorStep - 1;
              return (
                <div
                  key={idx}
                  className={`px-2.5 py-1.5 rounded-[4px] text-[10px] font-mono font-bold border transition-colors shrink-0 ${
                    isCurrent
                      ? 'bg-[var(--signal-cobalt,#1D55F5)] border-[var(--signal-mid,#6892F6)] text-white shadow-none hud-reticle active'
                      : isConsumed
                        ? 'bg-[var(--bg-pill-neutral,#E6E9EF)] border-[rgba(0,0,0,0.08)] text-[var(--ink-muted,#8C93A0)]'
                        : 'bg-[var(--bg-card,#F5F6F8)] border-[rgba(0,0,0,0.12)] text-[var(--ink-primary,#181A20)]'
                  }`}
                >
                  {sym}
                </div>
              );
            })}
          </div>

          {/* Outcome Badge at End of Tape */}
          {isFinalStep && (
            <div
              className={`p-3 rounded-[8px] border text-[11px] font-mono space-y-1 ${
                simResult.accepted
                  ? 'bg-[var(--bg-pill-active,#E0E8F9)] border-[var(--signal-mid,#6892F6)] text-[var(--signal-cobalt,#1D55F5)]'
                  : 'bg-[var(--bg-pill-neutral,#E6E9EF)] border-[rgba(0,0,0,0.12)] text-[var(--ink-primary,#181A20)]'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <span>{simResult.accepted ? '✓ STRING ACCEPTED BY DFA' : '✕ STRING REJECTED'}</span>
              </div>
              <p className="text-[10px] leading-relaxed uppercase tracking-wider">
                {simResult.accepted
                  ? `Automaton halted in accepting state ${simResult.finalState}. Successfully recognized pattern: ${simResult.acceptingLabels.join(', ')}.`
                  : simResult.failureReason || `Halted in non-accepting state ${simResult.finalState}.`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step Execution Trace Table — Recessed Matrix List */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3.5 space-y-2 flex-1 flex flex-col">
        <h4 className="text-[11px] font-bold text-[var(--ink-primary,#181A20)] uppercase tracking-wider">
          Step-by-Step Simulation Trace Matrix ({simResult.steps.length} Steps)
        </h4>
        <div className="flex-1 overflow-auto border border-[var(--bg-tray,#E2E5EC)] rounded-[8px] max-h-72 bg-[var(--bg-card,#F5F6F8)]">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-[var(--bg-tray,#E2E5EC)] text-[var(--ink-secondary,#525866)] uppercase text-[10px] sticky top-0 border-b border-[rgba(0,0,0,0.08)] font-semibold tracking-wider">
              <tr>
                <th className="p-2.5">STEP</th>
                <th className="p-2.5">CURRENT STATE q</th>
                <th className="p-2.5">SYMBOL a</th>
                <th className="p-2.5">NEXT STATE δ(q, a)</th>
                <th className="p-2.5">REMAINING TAPE</th>
                <th className="p-2.5">ACCEPTING STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg-tray,#E2E5EC)] text-[11px]">
              {simResult.steps.map((st, idx) => {
                const isCurrentActive = idx + 1 === simulatorStep;
                return (
                  <tr
                    key={idx}
                    onClick={() => { setSimulatorStep(idx + 1); setSimulatorIsPlaying(false); }}
                    className={`cursor-pointer transition-colors ${
                      isCurrentActive
                        ? 'bg-[var(--bg-pill-active,#E0E8F9)] text-[var(--signal-cobalt,#1D55F5)] font-bold'
                        : 'hover:bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-primary,#181A20)]'
                    }`}
                  >
                    <td className="p-2.5 text-[var(--ink-muted,#8C93A0)]">{st.step}</td>
                    <td className="p-2.5 font-['Doto',monospace] font-bold text-[var(--signal-cobalt,#1D55F5)]">{st.currentState}</td>
                    <td className="p-2.5 font-bold">{st.inputSymbol}</td>
                    <td className="p-2.5 font-['Doto',monospace] font-bold text-[var(--signal-cobalt,#1D55F5)]">{st.nextState}</td>
                    <td className="p-2.5 text-[var(--ink-muted,#8C93A0)] text-[10px]">{st.remainingSymbols.join(' ') || 'ε (EMPTY)'}</td>
                    <td className="p-2.5">
                      {st.isAccepting ? (
                        <span className="hud-reticle active px-1.5 py-0.2 rounded bg-[var(--signal-cobalt,#1D55F5)] text-white text-[9px] font-bold uppercase">
                          ACCEPT ({st.acceptingLabels.join(', ')})
                        </span>
                      ) : (
                        <span className="text-[var(--ink-muted,#8C93A0)] text-[10px] uppercase">NON-ACCEPTING</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
