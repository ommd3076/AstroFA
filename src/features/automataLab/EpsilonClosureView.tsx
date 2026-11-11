import React, { useState, useMemo } from 'react';
import { NFA_MACHINE } from '../../data/astroData';
import { computeEpsilonClosure } from '../../automata/epsilonClosure';
import type { StateId } from '../../automata/types';

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
    <div className="w-full h-full flex flex-col gap-[6px] font-mono select-none overflow-y-auto pr-0.5">
      {/* Overview Banner — Module Card */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] space-y-1.5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
            <h3 className="font-bold text-[var(--ink-primary,#181A20)] text-[11px] uppercase tracking-wider">
              ε-Closure Computation Engine
            </h3>
            <span className="hud-reticle px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--signal-cobalt,#1D55F5)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              BFS TRAVERSAL ON (Q, ε)
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary,#525866)] font-mono tracking-wider">
            ε-closure(S) = S ∪ {'{ q\' | ∃ q ∈ ε-closure(S) s.t. (q, ε, q\') ∈ δ }'}
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-secondary,#525866)] leading-relaxed uppercase tracking-wider">
          The ε-closure contains all states reachable from subset S through zero or more ε-transitions.
          Calculates the primary seed set for deterministic macro-state creation in Subset Construction.
        </p>
      </div>

      {/* Interactive Selection & Result Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[6px]">
        {/* State Selector Card */}
        <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] space-y-2.5 flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-[var(--ink-primary,#181A20)] uppercase tracking-wider flex items-center gap-1.5">
              <span>SELECT INITIAL STATE(S) S:</span>
              <span className="text-[10px] text-[var(--ink-muted,#8C93A0)] font-normal">
                ({selectedStates.length} ACTIVE)
              </span>
            </label>
            <button
              onClick={() => setSelectedStates(['q0'])}
              className="hud-reticle px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[var(--bg-pill-active,#E0E8F9)] text-[var(--signal-cobalt,#1D55F5)] text-[10px] uppercase font-mono font-semibold tracking-wider transition-colors cursor-pointer"
            >
              RESET TO q₀
            </button>
          </div>

          <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto p-2 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)]">
            {NFA_MACHINE.states.slice(0, 48).map(s => {
              const isSelected = selectedStates.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleState(s.id)}
                  className={`hud-reticle ${isSelected ? 'active' : ''} px-2 py-0.5 rounded-[4px] text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer font-semibold ${
                    isSelected
                      ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white border border-[var(--signal-mid,#6892F6)] shadow-none'
                      : 'bg-[var(--bg-card,#F5F6F8)] text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)] hover:bg-[#EAECEF] border border-[rgba(0,0,0,0.08)]'
                  }`}
                >
                  {s.id}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-[var(--ink-muted,#8C93A0)] uppercase tracking-wider">
            Toggle multiple states to observe collective subset closure expansion.
          </div>
        </div>

        {/* Computed Result Card */}
        <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] space-y-2.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--ink-primary,#181A20)] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
                <span>COMPUTED RESULT: ε-CLOSURE(S)</span>
              </span>
              <span className="hud-reticle px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-active,#E0E8F9)] text-[var(--signal-cobalt,#1D55F5)] text-[10px] font-bold uppercase tracking-wider">
                {closure.length} STATES REACHABLE
              </span>
            </div>

            {/* Recessed cavity for results */}
            <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider">
                <span>INPUT SET S:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedStates.map(sid => (
                    <span
                      key={sid}
                      className="px-1.5 py-0.5 rounded-[3px] bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.12)] text-[var(--ink-primary,#181A20)] font-bold text-[10px]"
                    >
                      {sid}
                    </span>
                  ))}
                </div>
              </div>

              {/* Discrete hardware token pills */}
              <div className="pt-1">
                <div className="text-[10px] text-[var(--ink-muted,#8C93A0)] uppercase tracking-wider mb-1 font-semibold">
                  CLOSURE SET TOKENS:
                </div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1.5 bg-[var(--bg-card,#F5F6F8)] rounded-[6px] border border-[rgba(0,0,0,0.06)]">
                  {closure.map(sid => (
                    <span
                      key={sid}
                      className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-pill-active,#E0E8F9)] border border-[var(--signal-surface,#C7D5EC)] text-[var(--signal-cobalt,#1D55F5)] font-mono text-[10px] font-bold tracking-wider"
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
            <div className="p-2.5 bg-[var(--bg-pill-active,#E0E8F9)] border border-[var(--signal-surface,#C7D5EC)] rounded-[8px] text-[10px] text-[var(--ink-primary,#181A20)] leading-relaxed uppercase tracking-wider">
              <span className="font-bold text-[var(--signal-cobalt,#1D55F5)]">TELEMETRY NOTE: </span>
              From initial state <strong className="font-bold">q₀</strong>, the ε-closure spans q₀ plus initial states of all 24 pattern branches.
              This deterministic set forms the initial macro-state <strong className="font-bold">D₀</strong> in Subset Construction.
            </div>
          )}
        </div>
      </div>

      {/* Precomputed Reference Table — Recessed Matrix List */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3.5 space-y-2 flex-1 flex flex-col">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-[var(--ink-primary,#181A20)] uppercase tracking-wider">
            Precomputed ε-Closure Reference Matrix
          </h4>
          <span className="text-[10px] text-[var(--ink-muted,#8C93A0)] font-mono uppercase tracking-wider">
            {allClosures.length} NFA STATES INDEXED
          </span>
        </div>

        <div className="flex-1 overflow-auto border border-[var(--bg-tray,#E2E5EC)] rounded-[8px] max-h-80 bg-[var(--bg-card,#F5F6F8)]">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead className="bg-[var(--bg-tray,#E2E5EC)] text-[var(--ink-secondary,#525866)] uppercase text-[10px] sticky top-0 border-b border-[rgba(0,0,0,0.08)] font-semibold tracking-wider">
              <tr>
                <th className="p-2.5">STATE ID</th>
                <th className="p-2.5">PATTERN / LABEL</th>
                <th className="p-2.5">ε-CLOSURE TOKENS</th>
                <th className="p-2.5 text-right">SIZE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bg-tray,#E2E5EC)] text-[11px]">
              {allClosures.map(row => (
                <tr key={row.stateId} className="hover:bg-[var(--bg-pill-neutral,#E6E9EF)] transition-colors">
                  <td className="p-2.5 text-[var(--signal-cobalt,#1D55F5)] font-bold">{row.stateId}</td>
                  <td className="p-2.5 text-[var(--ink-secondary,#525866)] font-mono text-[10px] uppercase">
                    {row.stateName}
                  </td>
                  <td className="p-2.5">
                    <div className="flex flex-wrap gap-1 max-w-xl">
                      {row.closure.map(cid => (
                        <span
                          key={cid}
                          className="px-1 py-0.2 rounded-[3px] bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-primary,#181A20)] text-[9px] font-mono border border-[rgba(0,0,0,0.06)]"
                        >
                          {cid}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-bold text-[var(--ink-primary,#181A20)]">
                    {row.closure.length}
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
