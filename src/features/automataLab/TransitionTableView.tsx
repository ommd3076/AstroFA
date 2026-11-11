import React, { useState, useMemo } from 'react';
import { MINIMIZED_DFA_MACHINE, DFA_MACHINE } from '../../data/astroData';
import type { DFA, StateId } from '../../automata/types';

export const TransitionTableView: React.FC = () => {
  const [machineChoice, setMachineChoice] = useState<'minimized' | 'original'>('minimized');
  const [searchState, setSearchState] = useState('');
  const [filterSymbol, setFilterSymbol] = useState('ALL');

  const dfa: DFA = machineChoice === 'minimized' ? MINIMIZED_DFA_MACHINE : DFA_MACHINE;

  // Build matrix lookup: (stateId, symbol) -> targetStateId
  const matrix = useMemo(() => {
    const map = new Map<string, StateId>();
    for (const t of dfa.transitions) {
      map.set(`${t.from}:::${t.symbol}`, t.to);
    }
    return map;
  }, [dfa]);

  const filteredStates = useMemo(() => {
    return dfa.states.filter(s => {
      if (!searchState) return true;
      const term = searchState.toLowerCase();
      return (
        s.id.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        s.acceptingLabels.some(lbl => lbl.toLowerCase().includes(term))
      );
    });
  }, [dfa.states, searchState]);

  const activeAlphabet = useMemo(() => {
    if (filterSymbol === 'ALL') return dfa.alphabet;
    return [filterSymbol];
  }, [dfa.alphabet, filterSymbol]);

  return (
    <div className="w-full h-full flex flex-col gap-[6px] font-mono select-none overflow-hidden">
      {/* Control Banner — Elevated Bento Module Card */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3 rounded-[12px] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Machine Selection Rocker Switches */}
          <div className="flex bg-[var(--bg-tray,#E2E5EC)] rounded-[6px] p-0.5 border border-[rgba(0,0,0,0.06)]">
            <button
              onClick={() => setMachineChoice('minimized')}
              className={`hud-reticle ${machineChoice === 'minimized' ? 'active' : ''} px-3 py-1 rounded-[4px] text-[10px] font-mono font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                machineChoice === 'minimized'
                  ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white shadow-none'
                  : 'text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)]'
              }`}
            >
              MINIMIZED DFA ({MINIMIZED_DFA_MACHINE.states.length} STATES)
            </button>
            <button
              onClick={() => setMachineChoice('original')}
              className={`hud-reticle ${machineChoice === 'original' ? 'active' : ''} px-3 py-1 rounded-[4px] text-[10px] font-mono font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                machineChoice === 'original'
                  ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white shadow-none'
                  : 'text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)]'
              }`}
            >
              ORIGINAL DFA ({DFA_MACHINE.states.length} STATES)
            </button>
          </div>

          <span className="text-[10px] font-mono text-[var(--ink-secondary,#525866)] uppercase tracking-wider hidden sm:inline">
            CELL MATRIX: {dfa.states.length} × {dfa.alphabet.length} = {dfa.states.length * dfa.alphabet.length}
          </span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <div className="hud-reticle">
            <input
              type="text"
              placeholder="FILTER STATE / PATTERN..."
              value={searchState}
              onChange={e => setSearchState(e.target.value)}
              className="bg-[var(--bg-card,#F5F6F8)] border border-[var(--bg-tray,#E2E5EC)] rounded-[6px] px-2.5 py-1 text-[10px] text-[var(--ink-primary,#181A20)] font-mono uppercase tracking-wider placeholder:text-[var(--ink-muted,#8C93A0)]"
            />
          </div>
          <div className="hud-reticle">
            <select
              value={filterSymbol}
              onChange={e => setFilterSymbol(e.target.value)}
              className="bg-[var(--bg-card,#F5F6F8)] border border-[var(--bg-tray,#E2E5EC)] rounded-[6px] px-2 py-1 text-[10px] text-[var(--ink-primary,#181A20)] font-mono uppercase cursor-pointer"
            >
              <option value="ALL">ALL SYMBOLS Σ</option>
              {dfa.alphabet.map(sym => (
                <option key={sym} value={sym}>SYMBOL {sym}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recessed Transition Matrix Table with Sticky Light Headers */}
      <div className="flex-1 border border-[var(--bg-tray,#E2E5EC)] rounded-[12px] bg-[var(--bg-card,#F5F6F8)] overflow-auto relative shadow-none">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead className="bg-[var(--bg-tray,#E2E5EC)] text-[var(--ink-secondary,#525866)] uppercase text-[10px] sticky top-0 z-10 border-b border-[rgba(0,0,0,0.1)] font-semibold tracking-wider">
            <tr>
              <th className="p-2.5 sticky left-0 bg-[var(--bg-tray,#E2E5EC)] z-20 border-r border-[rgba(0,0,0,0.1)] min-w-[140px]">
                STATE q ∈ Q
              </th>
              {activeAlphabet.map(sym => (
                <th key={sym} className="p-2.5 text-center border-r border-[rgba(0,0,0,0.06)] min-w-[70px]">
                  <span className="text-[var(--signal-cobalt,#1D55F5)] font-bold">{sym}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--bg-tray,#E2E5EC)] text-[11px]">
            {filteredStates.map(state => {
              const isInitial = state.isInitial;
              const isAccepting = state.isAccepting;
              const isDead = state.isDead;

              return (
                <tr key={state.id} className="hover:bg-[var(--bg-pill-neutral,#E6E9EF)] transition-colors">
                  {/* Row Header (Sticky left) */}
                  <td className="p-2.5 sticky left-0 bg-[var(--bg-card,#F5F6F8)] border-r border-[rgba(0,0,0,0.1)] font-bold text-[var(--ink-primary,#181A20)] flex items-center justify-between gap-1 z-10">
                    <div className="flex items-center gap-1.5 truncate">
                      {isInitial && (
                        <span className="text-[var(--signal-cobalt,#1D55F5)] font-bold text-[10px]">
                          ➔
                        </span>
                      )}
                      {isAccepting && (
                        <span className="hud-reticle active px-1 py-0.2 rounded bg-[var(--signal-cobalt,#1D55F5)] text-white text-[9px] font-bold">
                          ◎
                        </span>
                      )}
                      <span className={`font-['Doto',monospace] text-xs ${
                        isAccepting ? 'text-[var(--signal-cobalt,#1D55F5)] font-bold' : isDead ? 'text-[var(--ink-muted,#8C93A0)]' : 'text-[var(--ink-primary,#181A20)]'
                      }`}>
                        {state.id}
                      </span>
                    </div>
                    {state.acceptingLabels.length > 0 && (
                      <span className="hud-reticle text-[9px] px-1 py-0.2 bg-[var(--bg-pill-active,#E0E8F9)] text-[var(--signal-cobalt,#1D55F5)] font-mono font-bold uppercase rounded">
                        {state.acceptingLabels[0]}
                      </span>
                    )}
                  </td>

                  {/* Transition cells */}
                  {activeAlphabet.map(sym => {
                    const targetId = matrix.get(`${state.id}:::${sym}`);
                    const targetState = targetId ? dfa.states.find(s => s.id === targetId) : undefined;
                    const isTargetDead = targetState?.isDead || targetId === dfa.deadStateId;

                    return (
                      <td
                        key={sym}
                        className={`p-2.5 text-center border-r border-[rgba(0,0,0,0.06)] ${
                          !targetId
                            ? 'text-[var(--ink-muted,#8C93A0)]'
                            : isTargetDead
                              ? 'text-[var(--ink-muted,#8C93A0)]'
                              : targetState?.isAccepting
                                ? 'bg-[var(--bg-pill-active,#E0E8F9)] text-[var(--signal-cobalt,#1D55F5)] font-bold font-["Doto",monospace]'
                                : 'text-[var(--ink-primary,#181A20)] font-["Doto",monospace]'
                        }`}
                      >
                        {targetId ? (
                          isTargetDead ? (
                            <span className="opacity-40 text-[10px] uppercase">trap</span>
                          ) : (
                            <span className="text-xs">{targetId}</span>
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
