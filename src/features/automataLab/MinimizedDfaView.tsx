import React, { useState } from 'react';
import { MINIMIZATION_RESULT, MINIMIZED_DFA_MACHINE, DFA_MACHINE } from '../../data/astroData';
import type { StateId } from '../../automata/types';

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
    <div className="w-full h-full flex flex-col gap-[6px] font-mono select-none overflow-y-auto pr-0.5">
      {/* Top Telemetry Header & 4 KPI Module Cards */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
            <h3 className="font-bold text-[var(--ink-primary,#181A20)] text-[11px] uppercase tracking-wider">
              DFA Minimization via Partition Refinement
            </h3>
            <span className="hud-reticle px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--signal-cobalt,#1D55F5)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              HOPCROFT PARTITION ALGORITHM
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary,#525866)] font-mono tracking-wider">
            REDUCTION: {originalStateCount} ➔ {minimizedStateCount} ({reductionPercent}% COMPRESSED)
          </span>
        </div>

        {/* 4 Elevated #F5F6F8 KPI Module Cards with Tier 2 High-Scale Monospace */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
          {/* Card 1: Original States */}
          <div className="p-3 bg-[var(--bg-card,#F5F6F8)] rounded-[12px] border border-[rgba(0,0,0,0.12)] relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase font-semibold tracking-wider">
                ORIGINAL DFA
              </span>
              <span className="text-[var(--ink-muted,#8C93A0)] text-[11px] leading-none">↗</span>
            </div>
            <div className="text-3xl sm:text-[36px] font-mono font-normal text-[var(--ink-primary,#181A20)] leading-none my-1.5">
              {originalStateCount}
              <sup className="text-[10px] uppercase font-semibold text-[var(--ink-muted,#8C93A0)] ml-0.5 align-super">
                STATES
              </sup>
            </div>
            <div className="text-[10px] text-[var(--ink-muted,#8C93A0)] uppercase tracking-wider">
              {origTransCount} TRANSITIONS
            </div>
          </div>

          {/* Card 2: Minimized States */}
          <div className="p-3 bg-[var(--bg-card,#F5F6F8)] rounded-[12px] border border-[rgba(0,0,0,0.12)] relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase font-semibold tracking-wider">
                MINIMIZED DFA
              </span>
              <span className="text-[var(--signal-cobalt,#1D55F5)] text-[11px] leading-none">↗</span>
            </div>
            <div className="text-3xl sm:text-[36px] font-mono font-normal text-[var(--ink-primary,#181A20)] leading-none my-1.5">
              {minimizedStateCount}
              <sup className="text-[10px] uppercase font-semibold text-[var(--signal-cobalt,#1D55F5)] ml-0.5 align-super">
                STATES
              </sup>
            </div>
            <div className="text-[10px] text-[var(--signal-cobalt,#1D55F5)] font-semibold uppercase tracking-wider">
              {minTransCount} TRANSITIONS
            </div>
          </div>

          {/* Card 3: Redundancy Eliminated */}
          <div className="p-3 bg-[var(--bg-card,#F5F6F8)] rounded-[12px] border border-[rgba(0,0,0,0.12)] relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase font-semibold tracking-wider">
                PRUNED DELTA
              </span>
              <span className="text-[var(--ink-muted,#8C93A0)] text-[11px] leading-none">↗</span>
            </div>
            <div className="text-3xl sm:text-[36px] font-mono font-normal text-[var(--ink-primary,#181A20)] leading-none my-1.5">
              -{statesReduced}
              <sup className="text-[10px] uppercase font-semibold text-[var(--ink-muted,#8C93A0)] ml-0.5 align-super">
                STATES
              </sup>
            </div>
            <div className="text-[10px] text-[var(--ink-muted,#8C93A0)] uppercase tracking-wider">
              -{transReduced} TRANS (-{reductionPercent}%)
            </div>
          </div>

          {/* Card 4: Pattern Preservation */}
          <div className="p-3 bg-[var(--bg-card,#F5F6F8)] rounded-[12px] border border-[rgba(0,0,0,0.12)] relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase font-semibold tracking-wider">
                PRESERVATION
              </span>
              <span className="text-[var(--signal-cobalt,#1D55F5)] text-[11px] leading-none">↗</span>
            </div>
            <div className="text-3xl sm:text-[36px] font-mono font-normal text-[var(--signal-cobalt,#1D55F5)] leading-none my-1.5">
              100
              <sup className="text-[10px] uppercase font-semibold text-[var(--signal-cobalt,#1D55F5)] ml-0.5 align-super">
                %
              </sup>
            </div>
            <div className="text-[10px] text-[var(--signal-cobalt,#1D55F5)] font-semibold uppercase tracking-wider">
              MULTI-LABEL F INVARIANT
            </div>
          </div>
        </div>

        {/* Navigation Tabs — Hardware Rocker Switch Pills */}
        <div className="flex items-center gap-1.5 border-t border-[var(--bg-tray,#E2E5EC)] pt-2.5 text-xs">
          <button
            onClick={() => setActiveTab('partitions')}
            className={`hud-reticle ${activeTab === 'partitions' ? 'active' : ''} px-3 py-1 rounded-[6px] font-mono text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-all ${
              activeTab === 'partitions'
                ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white'
                : 'bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)]'
            }`}
          >
            EQUIVALENCE PARTITIONS ({partitions.length})
          </button>
          <button
            onClick={() => setActiveTab('sideBySide')}
            className={`hud-reticle ${activeTab === 'sideBySide' ? 'active' : ''} px-3 py-1 rounded-[6px] font-mono text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-all ${
              activeTab === 'sideBySide'
                ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white'
                : 'bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)]'
            }`}
          >
            SIDE-BY-SIDE EQUIVALENCE
          </button>
          <button
            onClick={() => setActiveTab('proof')}
            className={`hud-reticle ${activeTab === 'proof' ? 'active' : ''} px-3 py-1 rounded-[6px] font-mono text-[10px] font-semibold uppercase tracking-wider cursor-pointer transition-all ${
              activeTab === 'proof'
                ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white'
                : 'bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)]'
            }`}
          >
            THEOREM &amp; PROOF
          </button>
        </div>
      </div>

      {/* TAB 1: Equivalence Partitions Inspector */}
      {activeTab === 'partitions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[6px] flex-1">
          {/* Equivalence Partitions List */}
          <div className="lg:col-span-2 bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-[var(--ink-primary,#181A20)] uppercase tracking-wider">
                Partition Refinement Blocks ({partitions.length} Blocks)
              </h4>
              <span className="text-[10px] font-mono text-[var(--signal-cobalt,#1D55F5)] uppercase tracking-wider font-semibold">
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
                  <div
                    key={idx}
                    onClick={() => handleSelectMinState(minId)}
                    className={`hud-reticle ${isSelected ? 'active' : ''} p-2.5 rounded-[8px] border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[var(--signal-cobalt,#1D55F5)] border-[var(--signal-mid,#6892F6)] text-white shadow-none'
                        : hasMerger
                          ? 'bg-[var(--bg-pill-active,#E0E8F9)] border-[var(--signal-surface,#C7D5EC)] text-[var(--ink-primary,#181A20)] hover:bg-[#D5E0F7]'
                          : 'bg-[var(--bg-tray,#E2E5EC)] border-[rgba(0,0,0,0.06)] hover:bg-[#D9DDE6] text-[var(--ink-primary,#181A20)]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <strong className={`font-['Doto',monospace] text-xs font-bold ${isSelected ? 'text-white' : 'text-[var(--signal-cobalt,#1D55F5)]'}`}>
                          {minId}
                        </strong>
                        {hasMerger && (
                          <span className={`px-1.5 py-0.2 rounded-[3px] text-[9px] font-bold uppercase ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-card,#F5F6F8)] text-[var(--signal-cobalt,#1D55F5)] border border-[var(--signal-surface,#C7D5EC)]'
                          }`}>
                            MERGED {block.length} STATES
                          </span>
                        )}
                        {repState?.isAccepting && (
                          <span className={`px-1.5 py-0.2 rounded-[3px] text-[9px] font-bold uppercase ${
                            isSelected ? 'bg-white text-[var(--signal-cobalt,#1D55F5)]' : 'bg-[var(--signal-cobalt,#1D55F5)] text-white'
                          }`}>
                            {repState.acceptingLabels.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-white/80' : 'text-[var(--ink-muted,#8C93A0)]'}`}>
                        {block.length === 1 ? 'SINGLE STATE' : `${block.length} STATES EQUIVALENT`}
                      </span>
                    </div>

                    <div className={`text-[10px] font-mono mt-1 break-words ${isSelected ? 'text-white/90' : 'text-[var(--ink-secondary,#525866)]'}`}>
                      Original States: {'{ ' + block.join(', ') + ' }'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Minimized State Inspector */}
          {selectedState && (
            <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3.5 flex flex-col space-y-3">
              <div className="border-b border-[var(--bg-tray,#E2E5EC)] pb-2">
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
              </div>

              {/* Outgoing Transitions */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-[var(--ink-secondary,#525866)] tracking-wider">
                  Active Outgoing Transitions ({outgoingTransitions.length})
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1 font-mono text-xs">
                  {outgoingTransitions.length > 0 ? (
                    outgoingTransitions.map((t, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectMinState(t.to)}
                        className="p-1.5 bg-[var(--bg-tray,#E2E5EC)] hover:bg-[#D9DDE6] rounded-[6px] border border-[rgba(0,0,0,0.06)] cursor-pointer flex items-center justify-between transition-colors"
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
                      Terminal / accepting state
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] space-y-1 text-[10px] font-mono">
                <div className="text-[var(--ink-secondary,#525866)] font-bold uppercase tracking-wider">
                  Equivalence Invariant:
                </div>
                <p className="text-[10px] text-[var(--ink-primary,#181A20)] leading-relaxed">
                  ∀w ∈ Σ*, δ*(s₁, w) ∈ F ⇔ δ*(s₂, w) ∈ F with identical constellation target labels preserved across all runs.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Side-by-Side Comparison */}
      {activeTab === 'sideBySide' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[6px] flex-1">
          {/* Left: Original Unminimized DFA */}
          <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3.5 flex flex-col space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-[11px] font-bold text-[var(--ink-primary,#181A20)] uppercase tracking-wider">
                  Original Powerset DFA ({originalStateCount} States)
                </h4>
                <p className="text-[10px] text-[var(--ink-muted,#8C93A0)] uppercase tracking-wider">
                  Click any state to highlight minimized target
                </p>
              </div>
              <div className="hud-reticle">
                <input
                  type="text"
                  placeholder="SEARCH..."
                  value={origSearch}
                  onChange={e => setOrigSearch(e.target.value)}
                  className="bg-[var(--bg-card,#F5F6F8)] border border-[var(--bg-tray,#E2E5EC)] rounded-[6px] px-2 py-0.5 text-[10px] text-[var(--ink-primary,#181A20)] font-mono uppercase tracking-wider w-24"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[460px]">
              {filteredOrigStates.map(state => {
                const targetMinId = partitionMap[state.id];
                const isSelected = selectedOrigStateId === state.id;
                const isTargetMinSelected = selectedMinStateId === targetMinId;

                return (
                  <div
                    key={state.id}
                    onClick={() => handleSelectOrigState(state.id)}
                    className={`hud-reticle ${isSelected ? 'active' : ''} p-2 rounded-[6px] border cursor-pointer transition-all font-mono text-xs ${
                      isSelected
                        ? 'bg-[var(--signal-cobalt,#1D55F5)] border-[var(--signal-mid,#6892F6)] text-white shadow-none'
                        : isTargetMinSelected
                          ? 'bg-[var(--bg-pill-active,#E0E8F9)] border-[var(--signal-surface,#C7D5EC)] text-[var(--signal-cobalt,#1D55F5)]'
                          : 'bg-[var(--bg-tray,#E2E5EC)] border-[rgba(0,0,0,0.06)] hover:bg-[#D9DDE6] text-[var(--ink-primary,#181A20)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-['Doto',monospace] font-bold">{state.id}</span>
                        {state.isAccepting && (
                          <span className={`px-1 py-0.2 text-[9px] rounded font-bold uppercase ${
                            isSelected ? 'bg-white text-[var(--signal-cobalt,#1D55F5)]' : 'bg-[var(--signal-cobalt,#1D55F5)] text-white'
                          }`}>
                            {state.acceptingLabels.join(', ')}
                          </span>
                        )}
                        {state.isDead && (
                          <span className="px-1 py-0.2 bg-[#8C93A0] text-white text-[9px] rounded font-bold uppercase">
                            DEAD
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] uppercase font-semibold">
                        <span className={isSelected ? 'text-white/80' : 'text-[var(--ink-muted,#8C93A0)]'}>MAPS TO:</span>
                        <span className={`font-bold font-['Doto',monospace] px-1 py-0.2 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-card,#F5F6F8)] text-[var(--signal-cobalt,#1D55F5)]'
                        }`}>
                          {targetMinId || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Minimized DFA Partitions */}
          <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3.5 flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[11px] font-bold text-[var(--signal-cobalt,#1D55F5)] uppercase tracking-wider">
                  Minimized Partitions ({minimizedStateCount} States)
                </h4>
                <p className="text-[10px] text-[var(--ink-muted,#8C93A0)] uppercase tracking-wider">
                  Click partition to view equivalence class members
                </p>
              </div>
              <span className="text-[10px] font-mono text-[var(--signal-cobalt,#1D55F5)] uppercase font-semibold">
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
                  <div
                    key={idx}
                    onClick={() => handleSelectMinState(minId)}
                    className={`hud-reticle ${isSelected ? 'active' : ''} p-2 rounded-[6px] border cursor-pointer transition-all font-mono text-xs ${
                      isSelected
                        ? 'bg-[var(--signal-cobalt,#1D55F5)] border-[var(--signal-mid,#6892F6)] text-white shadow-none'
                        : hasMerger
                          ? 'bg-[var(--bg-pill-active,#E0E8F9)] border-[var(--signal-surface,#C7D5EC)] text-[var(--signal-cobalt,#1D55F5)] hover:bg-[#D5E0F7]'
                          : 'bg-[var(--bg-tray,#E2E5EC)] border-[rgba(0,0,0,0.06)] hover:bg-[#D9DDE6] text-[var(--ink-primary,#181A20)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <strong className="font-['Doto',monospace] font-bold">{minId}</strong>
                        {hasMerger && (
                          <span className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-card,#F5F6F8)] text-[var(--signal-cobalt,#1D55F5)]'
                          }`}>
                            {block.length} STATES
                          </span>
                        )}
                        {repState?.isAccepting && (
                          <span className={`px-1 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isSelected ? 'bg-white text-[var(--signal-cobalt,#1D55F5)]' : 'bg-[var(--signal-cobalt,#1D55F5)] text-white'
                          }`}>
                            {repState.acceptingLabels.join(', ')}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] uppercase font-semibold ${isSelected ? 'text-white/80' : 'text-[var(--ink-muted,#8C93A0)]'}`}>
                        BLOCK #{idx}
                      </span>
                    </div>

                    <div className={`mt-1 text-[10px] break-words ${isSelected ? 'text-white/90' : 'text-[var(--ink-secondary,#525866)]'}`}>
                      Original: {'{ ' + block.join(', ') + ' }'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Academic Proof & Algorithm Details */}
      {activeTab === 'proof' && (
        <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-4 space-y-3 text-[11px] text-[var(--ink-primary,#181A20)] leading-relaxed font-mono">
          <h4 className="text-[12px] font-bold text-[var(--ink-primary,#181A20)] flex items-center gap-2 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
            <span>Partition Refinement &amp; Myhill-Nerode Invariance</span>
          </h4>

          <div className="space-y-2">
            <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)]">
              <h5 className="font-bold text-[var(--signal-cobalt,#1D55F5)] uppercase tracking-wider mb-1">
                1. Standard Hopcroft Partition Refinement
              </h5>
              <p className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider leading-relaxed">
                Initializes partition P₀ = {'{F, Q \\ F}'}. For each block B and input symbol a ∈ Σ, computes transition signature
                sig(s) = (a ➔ targetBlockIdx). If states in B diverge in signatures, B is split.
                Terminates when ΔP = ∅, achieving minimal canonical state space.
              </p>
            </div>

            <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)]">
              <h5 className="font-bold text-[var(--signal-cobalt,#1D55F5)] uppercase tracking-wider mb-1">
                2. Costellar Multi-Pattern Constraint (Label Preservation)
              </h5>
              <p className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider leading-relaxed">
                Classical minimization merges all accepting states without distinction. In astronomical pattern recognition,
                each accepting state identifies a distinct asterism. P₀ partitions accepting states strictly by their sorted
                labels (Labels(p) = Labels(q)). Conflation of constellation identities is mathematically barred.
              </p>
            </div>

            <div className="p-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)]">
              <h5 className="font-bold text-[var(--signal-cobalt,#1D55F5)] uppercase tracking-wider mb-1">
                3. Dead State Pruning &amp; Total Function Completeness
              </h5>
              <p className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider leading-relaxed">
                Explicit dead state q_dead routes all undefined (q, a) pairs with self-loops.
                Ensures total transition function δ: Q × Σ ➔ Q required for partition refinement without bloating active paths.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
