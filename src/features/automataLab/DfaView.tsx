import React, { useState, useMemo } from 'react';
import { DFA_MACHINE } from '../../data/astroData';
import type { StateId } from '../../automata/types';
import { Button, Card, Input } from './boardPrimitives';

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
    <div className="w-full h-full flex flex-col gap-3 font-mono overflow-y-auto pr-0.5">
      {/* Overview Banner */}
      <Card className="atlas-surface p-3.5 rounded-xl gap-1.5 shrink-0 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" aria-hidden="true" />
            <h3 className="font-bold text-[var(--ink-primary)] text-[11px] uppercase tracking-wider">
              Determinized Finite Automaton (DFA)
            </h3>
            <span className="px-2 py-0.5 rounded bg-[var(--bg-pill-neutral)] text-[var(--signal-mid)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              {DFA_MACHINE.states.length} STATES / {DFA_MACHINE.transitions.length} TRANSITIONS / |Σ|={DFA_MACHINE.alphabet.length}
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary)] font-mono tracking-wider">
            DETERMINISTIC: |δ(q, a)| &le; 1 FOR ALL q ∈ Q, a ∈ Σ
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed uppercase tracking-wider">
          Single-path transition system over NFA power subsets. Guarantees deterministic recognition time O(n)
          proportional strictly to the length of the traced star pattern.
        </p>
      </Card>

      {/* Main Grid: Layered State Navigator & State Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1">
        {/* Layered State Navigator Module Card */}
        <Card className="lg:col-span-2 atlas-surface p-3.5 rounded-xl flex flex-col gap-3 shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <span>Topological State Layers</span>
              <span className="text-[10px] text-[var(--ink-muted)] font-normal">(LEVELS 0..5)</span>
            </h4>
            <Input
              type="text"
              size="sm"
              placeholder="SEARCH STATE / PATTERN..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              onKeyDown={e => e.stopPropagation()}
              aria-label="Search DFA states and accepting patterns"
              className="w-48 sm:w-56 text-[11px] font-mono uppercase tracking-wider"
            />
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
                  <div key={depth} className="space-y-1.5 p-2.5 bg-[var(--bg-viewport)] rounded-lg border border-[var(--border-subtle)]">
                    <div className="text-[10px] font-mono text-[var(--ink-secondary)] uppercase tracking-wider font-semibold flex items-center justify-between">
                      <span>LAYER {depth} {depth === 0 ? '(INITIAL SEED)' : `(${filtered.length} NODES)`}</span>
                      <span className="text-[9px] text-[var(--ink-muted)]">DEPTH LEVEL {depth}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {filtered.map(s => {
                        const isSelected = s.id === selectedStateId;
                        return (
                          <Button
                            key={s.id}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedStateId(s.id)}
                            aria-pressed={isSelected}
                            className={`h-auto px-2.5 py-1.5 flex-col items-start text-[11px] font-mono text-left ${
                              !isSelected && s.isAccepting
                                ? 'bg-[var(--bg-pill-active)] border-[var(--signal-mid)] text-[var(--signal-mid)]'
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="font-mono tabular-nums text-xs">{s.id}</span>
                              {s.isInitial && (
                                <span className={`text-[9px] font-semibold ${isSelected ? 'text-primary-foreground' : 'text-[var(--signal-mid)]'}`}>
                                  [START]
                                </span>
                              )}
                              {s.isAccepting && (
                                <span className={`text-[9px] font-semibold ${isSelected ? 'text-primary-foreground' : 'text-[var(--signal-mid)]'}`}>
                                  [ACCEPT]
                                </span>
                              )}
                            </div>
                            {s.acceptingLabels.length > 0 && (
                              <div className={`text-[9px] font-semibold truncate mt-0.5 ${isSelected ? 'text-primary-foreground/80' : 'text-[var(--signal-mid)]'}`}>
                                {s.acceptingLabels.join(', ')}
                              </div>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>

        {/* Selected State Inspector Module Card */}
        {selectedState && (
          <Card className="atlas-surface rounded-xl p-3.5 flex flex-col gap-3 shadow-none">
            <div className="border-b border-[var(--border-subtle)] pb-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-mono text-[var(--ink-primary)] flex items-center gap-1.5">
                  <span className="font-mono tabular-nums text-base text-[var(--signal-mid)]">
                    {selectedState.id}
                  </span>
                  <span className="text-[10px] text-[var(--ink-muted)] uppercase">
                    ({selectedState.name})
                  </span>
                </span>
                {selectedState.isAccepting ? (
                  <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                    ACCEPTING
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] rounded text-[9px] font-mono uppercase tracking-wider">
                    TRANSIT
                  </span>
                )}
              </div>
              {selectedState.acceptingLabels.length > 0 && (
                <div className="text-[10px] text-[var(--signal-mid)] font-bold mt-1 uppercase tracking-wider">
                  Recognizes: {selectedState.acceptingLabels.join(', ')}
                </div>
              )}
            </div>

            {/* Outgoing Transitions */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[var(--ink-secondary)] tracking-wider">
                Outgoing Transitions ({outgoingTransitions.length})
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {outgoingTransitions.length > 0 ? (
                  outgoingTransitions.map((t, idx) => (
                    <Button
                      variant="outline"
                      key={idx}
                      onClick={() => setSelectedStateId(t.to)}
                      className="h-auto w-full p-1.5 bg-[var(--bg-tray)] hover:bg-[var(--bg-pill-active)] rounded-[6px] border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono font-normal"
                      aria-label={`Go to state ${t.to} on symbol ${t.symbol}`}
                    >
                      <span className="text-[var(--signal-mid)] font-bold px-1.5 py-0.2 bg-[var(--bg-card)] border border-[var(--signal-surface)] rounded-[4px] text-[10px]">
                        {t.symbol}
                      </span>
                      <span className="text-[var(--ink-muted)]">➔</span>
                      <span className="text-[var(--ink-primary)] font-bold font-mono tabular-nums">
                        {t.to}
                      </span>
                    </Button>
                  ))
                ) : (
                  <div className="text-[10px] text-[var(--ink-muted)] uppercase p-2">
                    Terminal / accepting state — zero outgoing edges.
                  </div>
                )}
              </div>
            </div>

            {/* Incoming Transitions */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-[var(--ink-secondary)] tracking-wider">
                Incoming Transitions ({incomingTransitions.length})
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {incomingTransitions.map((t, idx) => (
                  <Button
                    variant="outline"
                    key={idx}
                    onClick={() => setSelectedStateId(t.from)}
                    className="h-auto w-full p-1.5 bg-[var(--bg-tray)] hover:bg-[var(--bg-pill-active)] rounded-[6px] border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono font-normal"
                    aria-label={`Go to source state ${t.from} on symbol ${t.symbol}`}
                  >
                    <span className="text-[var(--ink-primary)] font-bold font-mono tabular-nums">{t.from}</span>
                    <span className="text-[10px] text-[var(--ink-muted)]">on '{t.symbol}' ➔</span>
                    <span className="text-[var(--signal-mid)] font-bold font-mono tabular-nums">{t.to}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* NFA Subset details */}
            <div className="p-2.5 bg-[var(--bg-tray)] rounded-[8px] border border-[var(--border-subtle)] space-y-1 text-[10px] font-mono">
              <div className="text-[var(--ink-secondary)] font-bold uppercase tracking-wider">
                NFA Subset: {selectedState.nfaSubset.length} states
              </div>
              <div className="text-[var(--ink-primary)] break-words max-h-20 overflow-y-auto">
                {'{ ' + selectedState.nfaSubset.join(', ') + ' }'}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
