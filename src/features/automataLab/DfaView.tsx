import React, { useState, useMemo } from 'react';
import { DFA_MACHINE } from '../../data/astroData';
import type { StateId } from '../../automata/types';

export const DfaView: React.FC = () => {
  const [selectedStateId, setSelectedStateId] = useState<StateId>(DFA_MACHINE.initialState);
  const [searchFilter, setSearchFilter] = useState('');

  // Partition states into topological layers (distance from initial state)
  const layeredStates = useMemo(() => {
    const depths = new Map<StateId, number>();
    depths.set(DFA_MACHINE.initialState, 0);

    const queue: StateId[] = [DFA_MACHINE.initialState];
    const adj = new Map<StateId, Array<{ to: StateId; symbol: string }>>();

    for (const t of DFA_MACHINE.transitions) {
      if (!adj.has(t.from)) adj.set(t.from, []);
      adj.get(t.from)!.push({ to: t.to, symbol: t.symbol });
    }

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const d = depths.get(curr)!;
      const neighbors = adj.get(curr) || [];
      for (const edge of neighbors) {
        if (!depths.has(edge.to)) {
          depths.set(edge.to, d + 1);
          queue.push(edge.to);
        }
      }
    }

    // Group states by depth layer
    const layers: Record<number, typeof DFA_MACHINE.states> = {};
    for (const s of DFA_MACHINE.states) {
      const d = depths.get(s.id) ?? 99;
      if (!layers[d]) layers[d] = [];
      layers[d].push(s);
    }

    return layers;
  }, []);

  const selectedState = useMemo(() => {
    return DFA_MACHINE.states.find(s => s.id === selectedStateId);
  }, [selectedStateId]);

  const outgoingTransitions = useMemo(() => {
    return DFA_MACHINE.transitions.filter(t => t.from === selectedStateId);
  }, [selectedStateId]);

  const incomingTransitions = useMemo(() => {
    return DFA_MACHINE.transitions.filter(t => t.to === selectedStateId);
  }, [selectedStateId]);

  return (
    <div className="w-full h-full flex flex-col gap-[6px] font-mono select-none overflow-y-auto pr-0.5">
      {/* Overview Banner — Elevated Bento Module Card */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] space-y-1.5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
            <h3 className="font-bold text-[var(--ink-primary,#181A20)] text-[11px] uppercase tracking-wider">
              Determinized Finite Automaton (DFA)
            </h3>
            <span className="hud-reticle px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--signal-cobalt,#1D55F5)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              {DFA_MACHINE.states.length} STATES / {DFA_MACHINE.transitions.length} TRANSITIONS / |Σ|={DFA_MACHINE.alphabet.length}
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary,#525866)] font-mono tracking-wider">
            DETERMINISTIC: |δ(q, a)| &le; 1 FOR ALL q ∈ Q, a ∈ Σ
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-secondary,#525866)] leading-relaxed uppercase tracking-wider">
          Single-path transition system over NFA power subsets. Guarantees deterministic recognition time O(n)
          proportional strictly to the length of the traced star pattern.
        </p>
      </div>

      {/* Main Grid: Layered State Navigator & State Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[6px] flex-1">
        {/* Layered State Navigator Module Card */}
        <div className="lg:col-span-2 bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] flex flex-col space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[11px] font-bold text-[var(--ink-primary,#181A20)] uppercase tracking-wider flex items-center gap-1.5">
              <span>Topological State Layers</span>
              <span className="text-[10px] text-[var(--ink-muted,#8C93A0)] font-normal">(LEVELS 0..5)</span>
            </h4>
            <div className="hud-reticle">
              <input
                type="text"
                placeholder="SEARCH STATE / PATTERN..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="bg-[var(--bg-card,#F5F6F8)] border border-[var(--bg-tray,#E2E5EC)] rounded-[6px] px-2.5 py-1 text-[11px] text-[var(--ink-primary,#181A20)] font-mono uppercase tracking-wider placeholder:text-[var(--ink-muted,#8C93A0)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
            {Object.keys(layeredStates)
              .map(Number)
              .sort((a, b) => a - b)
              .map(depth => {
                const layer = layeredStates[depth];
                const filtered = layer.filter(s => {
                  if (!searchFilter) return true;
                  const term = searchFilter.toLowerCase();
                  return (
                    s.id.toLowerCase().includes(term) ||
                    s.acceptingLabels.some(lbl => lbl.toLowerCase().includes(term))
                  );
                });

                if (filtered.length === 0) return null;

                return (
                  <div key={depth} className="space-y-1.5 p-2 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)]">
                    <div className="text-[10px] font-mono text-[var(--ink-secondary,#525866)] uppercase tracking-wider font-semibold flex items-center justify-between">
                      <span>LAYER {depth} {depth === 0 ? '(INITIAL SEED)' : `(${filtered.length} NODES)`}</span>
                      <span className="text-[9px] text-[var(--ink-muted,#8C93A0)]">DEPTH LEVEL {depth}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {filtered.map(s => {
                        const isSelected = s.id === selectedStateId;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedStateId(s.id)}
                            className={`hud-reticle ${isSelected ? 'active' : ''} px-2.5 py-1.5 rounded-[6px] border text-[11px] font-mono transition-colors text-left cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--signal-cobalt,#1D55F5)] border-[var(--signal-mid,#6892F6)] text-white shadow-none'
                                : s.isAccepting
                                  ? 'bg-[var(--bg-pill-active,#E0E8F9)] border-[var(--signal-mid,#6892F6)] text-[var(--signal-cobalt,#1D55F5)] hover:bg-[#D5E0F7]'
                                  : 'bg-[var(--bg-card,#F5F6F8)] border-[rgba(0,0,0,0.08)] text-[var(--ink-primary,#181A20)] hover:bg-[#EAECEF]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="font-['Doto',monospace] text-xs">{s.id}</span>
                              {s.isInitial && (
                                <span className={`text-[9px] font-semibold ${isSelected ? 'text-white' : 'text-[var(--signal-cobalt,#1D55F5)]'}`}>
                                  [START]
                                </span>
                              )}
                              {s.isAccepting && (
                                <span className={`text-[9px] font-semibold ${isSelected ? 'text-white' : 'text-[var(--signal-cobalt,#1D55F5)]'}`}>
                                  [ACCEPT]
                                </span>
                              )}
                            </div>
                            {s.acceptingLabels.length > 0 && (
                              <div className={`text-[9px] font-semibold truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-[var(--signal-cobalt,#1D55F5)]'}`}>
                                {s.acceptingLabels.join(', ')}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Selected State Inspector Module Card */}
        {selectedState && (
          <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3.5 flex flex-col space-y-3">
            <div className="border-b border-[var(--bg-tray,#E2E5EC)] pb-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-mono text-[var(--ink-primary,#181A20)] flex items-center gap-1.5">
                  <span className="font-['Doto',monospace] text-base text-[var(--signal-cobalt,#1D55F5)]">
                    {selectedState.id}
                  </span>
                  <span className="text-[10px] text-[var(--ink-muted,#8C93A0)] uppercase">
                    ({selectedState.name})
                  </span>
                </span>
                {selectedState.isAccepting ? (
                  <span className="hud-reticle active px-2 py-0.5 bg-[var(--signal-cobalt,#1D55F5)] text-white rounded-[4px] text-[9px] font-mono font-bold uppercase tracking-wider">
                    ACCEPTING
                  </span>
                ) : (
                  <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-secondary,#525866)] rounded-[4px] text-[9px] font-mono uppercase tracking-wider">
                    TRANSIT
                  </span>
                )}
              </div>
              {selectedState.acceptingLabels.length > 0 && (
                <div className="text-[10px] text-[var(--signal-cobalt,#1D55F5)] font-bold mt-1 uppercase tracking-wider">
                  Recognizes: {selectedState.acceptingLabels.join(', ')}
                </div>
              )}
            </div>

            {/* Outgoing Transitions */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[var(--ink-secondary,#525866)] tracking-wider">
                Outgoing Transitions ({outgoingTransitions.length})
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {outgoingTransitions.length > 0 ? (
                  outgoingTransitions.map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedStateId(t.to)}
                      className="p-1.5 bg-[var(--bg-tray,#E2E5EC)] hover:bg-[#D9DDE6] rounded-[6px] border border-[rgba(0,0,0,0.06)] cursor-pointer flex items-center justify-between text-[11px] font-mono transition-colors"
                    >
                      <span className="text-[var(--signal-cobalt,#1D55F5)] font-bold px-1.5 py-0.2 bg-[var(--bg-card,#F5F6F8)] border border-[var(--signal-surface,#C7D5EC)] rounded-[4px] text-[10px]">
                        {t.symbol}
                      </span>
                      <span className="text-[var(--ink-muted,#8C93A0)]">➔</span>
                      <span className="text-[var(--ink-primary,#181A20)] font-bold font-['Doto',monospace]">
                        {t.to}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-[var(--ink-muted,#8C93A0)] uppercase p-2">
                    Terminal / accepting state — zero outgoing edges.
                  </div>
                )}
              </div>
            </div>

            {/* Incoming Transitions */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[var(--ink-secondary,#525866)] tracking-wider">
                Incoming Transitions ({incomingTransitions.length})
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {incomingTransitions.map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedStateId(t.from)}
                    className="p-1.5 bg-[var(--bg-tray,#E2E5EC)] hover:bg-[#D9DDE6] rounded-[6px] border border-[rgba(0,0,0,0.06)] cursor-pointer flex items-center justify-between text-[11px] font-mono transition-colors"
                  >
                    <span className="text-[var(--ink-primary,#181A20)] font-bold font-['Doto',monospace]">{t.from}</span>
                    <span className="text-[10px] text-[var(--ink-muted,#8C93A0)]">on '{t.symbol}' ➔</span>
                    <span className="text-[var(--signal-cobalt,#1D55F5)] font-bold font-['Doto',monospace]">{t.to}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NFA Subset details */}
            <div className="p-2.5 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-1 text-[10px] font-mono">
              <div className="text-[var(--ink-secondary,#525866)] font-bold uppercase tracking-wider">
                NFA Subset: {selectedState.nfaSubset.length} states
              </div>
              <div className="text-[var(--ink-primary,#181A20)] break-words max-h-20 overflow-y-auto">
                {'{ ' + selectedState.nfaSubset.join(', ') + ' }'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
