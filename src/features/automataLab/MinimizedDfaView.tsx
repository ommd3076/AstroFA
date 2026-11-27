import React, { useState } from 'react';
import { MINIMIZATION_RESULT, MINIMIZED_DFA_MACHINE, DFA_MACHINE } from '../../data/astroData';
import type { StateId } from '../../automata/types';
import { Button, Card, Input } from './boardPrimitives';
import { ToggleGroup, ToggleGroupItem } from './boardPrimitives';

export const MinimizedDfaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'partitions' | 'sideBySide' | 'proof'>('partitions');
  const [selectedMinStateId, setSelectedMinStateId] = useState<StateId>(MINIMIZED_DFA_MACHINE.initialState);
  const [selectedOrigStateId, setSelectedOrigStateId] = useState<StateId | null>(null);
  const [origSearch, setOrigSearch] = useState('');

  const {
    originalStateCount,
    minimizedStateCount,
    partitions,
    partitionMap,
  } = MINIMIZATION_RESULT;

  const statesReduced = originalStateCount - minimizedStateCount;
  const reductionPercent = ((statesReduced / originalStateCount) * 100).toFixed(1);

  const origTransCount = DFA_MACHINE.transitions.length;
  const minTransCount = MINIMIZED_DFA_MACHINE.transitions.length;
  const transReduced = origTransCount - minTransCount;

  // Find merged partitions (partitions with > 1 original state)
  const mergedPartitions = partitions.filter(p => p.length > 1);

  const selectedState = MINIMIZED_DFA_MACHINE.states.find(s => s.id === selectedMinStateId);
  const outgoingTransitions = MINIMIZED_DFA_MACHINE.transitions.filter(
    t => t.from === selectedMinStateId && !MINIMIZED_DFA_MACHINE.states.find(s => s.id === t.to)?.isDead
  );

  // When an original state is clicked in side-by-side mode
  const handleSelectOrigState = (origId: StateId) => {
    setSelectedOrigStateId(origId);
    const targetMinId = partitionMap[origId];
    if (targetMinId) {
      setSelectedMinStateId(targetMinId);
    }
  };

  // When a minimized state is clicked
  const handleSelectMinState = (minId: StateId) => {
    setSelectedMinStateId(minId);
    const blockIndex = parseInt(minId.replace('m', ''), 10);
    const block = partitions[blockIndex];
    if (block && block.length > 0) {
      setSelectedOrigStateId(block[0]);
    }
  };

  // Filtered original states for side-by-side
  const filteredOrigStates = DFA_MACHINE.states.filter(s => {
    if (!origSearch) return true;
    const q = origSearch.toLowerCase();
    return s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.acceptingLabels.some(l => l.toLowerCase().includes(q));
  });

  return (
    <div className="w-full h-full flex flex-col gap-3 font-mono overflow-y-auto pr-0.5">
      {/* Top Telemetry Header & Inline Metrics */}
      <Card className="atlas-surface p-3.5 rounded-xl gap-3 shrink-0 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" aria-hidden="true" />
            <h3 className="font-bold text-[var(--ink-primary)] text-[11px] uppercase tracking-wider">
              DFA Minimization via Partition Refinement
            </h3>
            <span className="px-2 py-0.5 rounded bg-[var(--bg-pill-neutral)] text-[var(--signal-mid)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              HOPCROFT PARTITION ALGORITHM
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary)] font-mono tracking-wider">
            REDUCTION: {originalStateCount} ➔ {minimizedStateCount} ({reductionPercent}% COMPRESSED)
          </span>
        </div>

        {/* Inline 4-Metric Summary Strip */}
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-[var(--border-subtle)] py-2.5 font-mono">
          <div>
            <dt className="text-[10px] text-[var(--ink-secondary)] uppercase font-semibold tracking-wider">ORIGINAL DFA</dt>
            <dd className="mt-1 flex items-baseline gap-1.5">
              <strong className="text-2xl font-semibold text-[var(--ink-primary)] tabular-nums">{originalStateCount}</strong>
              <span className="text-[10px] text-[var(--ink-muted)] uppercase">states · {origTransCount} trans</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-[var(--ink-secondary)] uppercase font-semibold tracking-wider">MINIMIZED DFA</dt>
            <dd className="mt-1 flex items-baseline gap-1.5">
              <strong className="text-2xl font-semibold text-[var(--signal-mid)] tabular-nums">{minimizedStateCount}</strong>
              <span className="text-[10px] text-[var(--ink-muted)] uppercase">states · {minTransCount} trans</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-[var(--ink-secondary)] uppercase font-semibold tracking-wider">PRUNED DELTA</dt>
            <dd className="mt-1 flex items-baseline gap-1.5">
              <strong className="text-2xl font-semibold text-[var(--ink-primary)] tabular-nums">-{statesReduced}</strong>
              <span className="text-[10px] text-[var(--ink-muted)] uppercase">-{transReduced} ({reductionPercent}%)</span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-[var(--ink-secondary)] uppercase font-semibold tracking-wider">PRESERVATION</dt>
            <dd className="mt-1 flex items-baseline gap-1.5">
              <strong className="text-2xl font-semibold text-[var(--signal-mid)] tabular-nums">100%</strong>
              <span className="text-[10px] text-[var(--ink-muted)] uppercase">multi-label invariant</span>
            </dd>
          </div>
        </dl>

        {/* Navigation Tabs */}
        <div>
          <ToggleGroup
            aria-label="Minimization analysis sections"
            size="sm"
            value={[activeTab]}
            onValueChange={vals => {
              const next = vals.find(v => v !== activeTab) ?? vals[0];
              if (next) setActiveTab(next as typeof activeTab);
            }}
            className="bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] p-0.5 rounded-lg gap-0.5 flex-wrap"
          >
            <ToggleGroupItem
              value="partitions"
              className="font-mono text-[10px] font-semibold uppercase tracking-wider data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              EQUIVALENCE PARTITIONS ({partitions.length})
            </ToggleGroupItem>
            <ToggleGroupItem
              value="sideBySide"
              className="font-mono text-[10px] font-semibold uppercase tracking-wider data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              SIDE-BY-SIDE EQUIVALENCE
            </ToggleGroupItem>
            <ToggleGroupItem
              value="proof"
              className="font-mono text-[10px] font-semibold uppercase tracking-wider data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              THEOREM &amp; PROOF
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Card>

      {/* TAB 1: Equivalence Partitions Inspector */}
      {activeTab === 'partitions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1">
          {/* Equivalence Partitions List */}
          <Card className="lg:col-span-2 atlas-surface p-3.5 rounded-xl flex flex-col gap-2.5 shadow-none">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                Partition Refinement Blocks ({partitions.length} Blocks)
              </h4>
              <span className="text-[10px] font-mono text-[var(--signal-mid)] uppercase tracking-wider font-semibold">
                {mergedPartitions.length} BLOCKS CONTAIN EQUIVALENT MERGERS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[480px]">
              {partitions.map((block, idx) => {
                const minId = `m${idx}`;
                const isSelected = selectedMinStateId === minId;
                const hasMerger = block.length > 1;
                const repState = DFA_MACHINE.states.find(s => s.id === block[0]);

                return (
                  <Button
                    key={idx}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleSelectMinState(minId)}
                    aria-pressed={isSelected}
                    className={`h-auto w-full p-2.5 rounded-lg border flex-col items-stretch text-left font-normal transition-colors ${
                      isSelected
                        ? 'bg-primary border-[var(--signal-mid)] text-primary-foreground shadow-none'
                        : hasMerger
                          ? 'bg-[var(--bg-pill-active)] border-[var(--signal-surface)] text-[var(--ink-primary)] hover:border-[var(--signal-mid)]'
                          : 'bg-[var(--bg-viewport)] border-[var(--border-subtle)] hover:bg-[var(--bg-pill-active)] text-[var(--ink-primary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs w-full">
                      <div className="flex items-center gap-2">
                        <strong className={`font-mono tabular-nums text-xs font-bold ${isSelected ? 'text-primary-foreground' : 'text-[var(--signal-mid)]'}`}>
                          {minId}
                        </strong>
                        {hasMerger && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isSelected ? 'bg-black/15 text-primary-foreground' : 'bg-[var(--bg-card)] text-[var(--signal-mid)] border border-[var(--signal-surface)]'
                          }`}>
                            MERGED {block.length} STATES
                          </span>
                        )}
                        {repState?.isAccepting && (
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isSelected ? 'bg-black/20 text-primary-foreground' : 'bg-primary text-primary-foreground'
                          }`}>
                            {repState.acceptingLabels.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-primary-foreground/80' : 'text-[var(--ink-muted)]'}`}>
                        {block.length === 1 ? 'SINGLE STATE' : `${block.length} STATES EQUIVALENT`}
                      </span>
                    </div>

                    <div className={`text-[10px] font-mono mt-1 break-words ${isSelected ? 'text-primary-foreground/90' : 'text-[var(--ink-secondary)]'}`}>
                      Original States: {'{ ' + block.join(', ') + ' }'}
                    </div>
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Selected Minimized State Inspector */}
          {selectedState && (
            <Card className="atlas-surface rounded-xl p-3.5 flex flex-col gap-3 shadow-none">
              <div className="border-b border-[var(--border-subtle)] pb-2">
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
              </div>

              {/* Outgoing Transitions */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-[var(--ink-secondary)] tracking-wider">
                  Active Outgoing Transitions ({outgoingTransitions.length})
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1 font-mono text-xs">
                  {outgoingTransitions.length > 0 ? (
                    outgoingTransitions.map((t, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        onClick={() => handleSelectMinState(t.to)}
                        className="h-auto w-full p-1.5 bg-[var(--bg-viewport)] hover:bg-[var(--bg-pill-active)] rounded-md border-[var(--border-subtle)] flex items-center justify-between font-mono text-xs font-normal"
                      >
                        <span className="text-[var(--signal-mid)] font-bold px-1.5 py-0.2 bg-[var(--bg-card)] border border-[var(--signal-surface)] rounded text-[10px]">
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
                      Terminal / accepting state
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] space-y-1 text-[10px] font-mono">
                <div className="text-[var(--ink-secondary)] font-bold uppercase tracking-wider">
                  Equivalence Invariant:
                </div>
                <p className="text-[10px] text-[var(--ink-primary)] leading-relaxed">
                  ∀w ∈ Σ*, δ*(s₁, w) ∈ F ⇔ δ*(s₂, w) ∈ F with identical constellation target labels preserved across all runs.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: Side-by-Side Comparison */}
      {activeTab === 'sideBySide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          {/* Left: Original Unminimized DFA */}
          <Card className="atlas-surface rounded-xl p-3.5 flex flex-col gap-2.5 shadow-none">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                  Original Powerset DFA ({originalStateCount} States)
                </h4>
                <p className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">
                  Click any state to highlight minimized target
                </p>
              </div>
              <Input
                type="text"
                size="sm"
                placeholder="SEARCH..."
                aria-label="Search original DFA states"
                value={origSearch}
                onChange={e => setOrigSearch(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                className="w-28 text-[10px] font-mono uppercase tracking-wider"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[460px]">
              {filteredOrigStates.map(state => {
                const targetMinId = partitionMap[state.id];
                const isSelected = selectedOrigStateId === state.id;
                const isTargetMinSelected = selectedMinStateId === targetMinId;

                return (
                  <Button
                    key={state.id}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleSelectOrigState(state.id)}
                    aria-pressed={isSelected}
                    className={`h-auto w-full p-2 rounded-md border flex items-center justify-between font-mono text-xs font-normal ${
                      isSelected
                        ? 'bg-primary border-[var(--signal-mid)] text-primary-foreground shadow-none'
                        : isTargetMinSelected
                          ? 'bg-[var(--bg-pill-active)] border-[var(--signal-surface)] text-[var(--signal-mid)]'
                          : 'bg-[var(--bg-viewport)] border-[var(--border-subtle)] hover:bg-[var(--bg-pill-active)] text-[var(--ink-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono tabular-nums font-bold">{state.id}</span>
                      {state.isAccepting && (
                        <span className={`px-1 py-0.2 text-[9px] rounded font-bold uppercase ${
                          isSelected ? 'bg-black/20 text-primary-foreground' : 'bg-primary text-primary-foreground'
                        }`}>
                          {state.acceptingLabels.join(', ')}
                        </span>
                      )}
                      {state.isDead && (
                        <span className="px-1 py-0.2 bg-[var(--ink-muted)] text-[var(--bg-shell)] text-[9px] rounded font-bold uppercase">
                          DEAD
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] uppercase font-semibold">
                      <span className={isSelected ? 'text-primary-foreground/80' : 'text-[var(--ink-muted)]'}>MAPS TO:</span>
                      <span className={`font-bold font-mono tabular-nums px-1 py-0.2 rounded ${
                        isSelected ? 'bg-black/15 text-primary-foreground' : 'bg-[var(--bg-card)] text-[var(--signal-mid)]'
                      }`}>
                        {targetMinId || '—'}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </Card>

          {/* Right: Minimized DFA Partitions */}
          <Card className="atlas-surface rounded-xl p-3.5 flex flex-col gap-2.5 shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[11px] font-bold text-[var(--signal-mid)] uppercase tracking-wider">
                  Minimized Partitions ({minimizedStateCount} States)
                </h4>
                <p className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">
                  Click partition to view equivalence class members
                </p>
              </div>
              <span className="text-[10px] font-mono text-[var(--signal-mid)] uppercase font-semibold">
                {mergedPartitions.length} MERGED CLASSES
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[460px]">
              {partitions.map((block, idx) => {
                const minId = `m${idx}`;
                const isSelected = selectedMinStateId === minId;
                const hasMerger = block.length > 1;
                const repState = DFA_MACHINE.states.find(s => s.id === block[0]);

                return (
                  <Button
                    key={idx}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleSelectMinState(minId)}
                    aria-pressed={isSelected}
                    className={`h-auto w-full p-2 rounded-md border flex-col items-stretch text-left font-mono text-xs font-normal ${
                      isSelected
                        ? 'bg-primary border-[var(--signal-mid)] text-primary-foreground shadow-none'
                        : hasMerger
                          ? 'bg-[var(--bg-pill-active)] border-[var(--signal-surface)] text-[var(--ink-primary)]'
                          : 'bg-[var(--bg-viewport)] border-[var(--border-subtle)] hover:bg-[var(--bg-pill-active)] text-[var(--ink-primary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5">
                        <strong className="font-mono tabular-nums font-bold">{minId}</strong>
                        {hasMerger && (
                          <span className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isSelected ? 'bg-black/15 text-primary-foreground' : 'bg-[var(--bg-card)] text-[var(--signal-mid)]'
                          }`}>
                            {block.length} STATES
                          </span>
                        )}
                        {repState?.isAccepting && (
                          <span className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isSelected ? 'bg-black/20 text-primary-foreground' : 'bg-primary text-primary-foreground'
                          }`}>
                            {repState.acceptingLabels.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-primary-foreground/80' : 'text-[var(--ink-muted)]'}`}>
                        BLOCK #{idx}
                      </span>
                    </div>

                    <div className={`mt-1 text-[10px] break-words ${isSelected ? 'text-primary-foreground/90' : 'text-[var(--ink-secondary)]'}`}>
                      Original: {'{ ' + block.join(', ') + ' }'}
                    </div>
                  </Button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Academic Proof & Algorithm Details */}
      {activeTab === 'proof' && (
        <Card className="atlas-surface rounded-xl p-4 gap-3 text-[11px] text-[var(--ink-primary)] leading-relaxed font-mono shadow-none">
          <h4 className="text-xs font-bold text-[var(--ink-primary)] flex items-center gap-2 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" aria-hidden="true" />
            <span>Partition Refinement &amp; Myhill-Nerode Invariance</span>
          </h4>

          <div className="space-y-2.5">
            <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)]">
              <h5 className="font-bold text-[var(--signal-mid)] uppercase tracking-wider mb-1">
                1. Standard Hopcroft Partition Refinement
              </h5>
              <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider leading-relaxed">
                Initializes partition P₀ = {'{F, Q \\ F}'}. For each block B and input symbol a ∈ Σ, computes transition signature
                sig(s) = (a ➔ targetBlockIdx). If states in B diverge in signatures, B is split.
                Terminates when ΔP = ∅, achieving minimal canonical state space.
              </p>
            </div>

            <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)]">
              <h5 className="font-bold text-[var(--signal-mid)] uppercase tracking-wider mb-1">
                2. Costellar Multi-Pattern Constraint (Label Preservation)
              </h5>
              <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider leading-relaxed">
                Classical minimization merges all accepting states without distinction. In astronomical pattern recognition,
                each accepting state identifies a distinct asterism. P₀ partitions accepting states strictly by their sorted
                labels (Labels(p) = Labels(q)). Conflation of constellation identities is mathematically barred.
              </p>
            </div>

            <div className="p-3 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)]">
              <h5 className="font-bold text-[var(--signal-mid)] uppercase tracking-wider mb-1">
                3. Dead State Pruning &amp; Total Function Completeness
              </h5>
              <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider leading-relaxed">
                Explicit dead state q_dead routes all undefined (q, a) pairs with self-loops.
                Ensures total transition function δ: Q × Σ ➔ Q required for partition refinement without bloating active paths.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
