import React, { useState } from 'react';
import { useAstroStore, type AutomataTab } from '../../stores/useAstroStore';
import { NfaView } from './NfaView';
import { EpsilonClosureView } from './EpsilonClosureView';
import { SubsetConstructionView } from './SubsetConstructionView';
import { DfaView } from './DfaView';
import { MinimizedDfaView } from './MinimizedDfaView';
import { SimulatorView } from './SimulatorView';
import { FormalDefinitionView } from './FormalDefinitionView';
import { TransitionTableView } from './TransitionTableView';
import { ExportModal } from './ExportModal';

export const AutomataLab: React.FC = () => {
  const { automataTab, setAutomataTab, setActiveView } = useAstroStore();
  const [isExportOpen, setIsExportOpen] = useState(false);

  const tabs: Array<{ id: AutomataTab; index: string; label: string }> = [
    { id: 'nfa', index: '01', label: 'ε-NFA' },
    { id: 'closure', index: '02', label: 'ε-CLOSURE' },
    { id: 'subset', index: '03', label: 'SUBSET CONSTR' },
    { id: 'dfa', index: '04', label: 'DFA MATRIX' },
    { id: 'minimized', index: '05', label: 'MIN-DFA' },
    { id: 'simulator', index: '06', label: 'SIMULATOR' },
    { id: 'formal', index: '07', label: 'FORMAL 5-TUPLE' },
    { id: 'table', index: '08', label: 'TRANS TABLE' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-shell,#ECEEF2)] text-[var(--ink-primary,#181A20)] font-mono overflow-hidden select-none">
      {/* Sub-header navigation strip — Hardware Machined Console */}
      <div className="h-12 border-b border-[var(--bg-tray,#E2E5EC)] bg-[var(--bg-card,#F5F6F8)] px-3 flex items-center justify-between shrink-0 overflow-x-auto gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveView('sky')}
            className="hud-reticle px-2 py-1 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] border border-[rgba(0,0,0,0.08)] text-[var(--ink-primary,#181A20)] text-[10px] uppercase font-mono font-semibold tracking-wider transition-colors cursor-pointer flex items-center gap-1"
            title="Return to Sky Viewport"
          >
            <span>⟵</span>
            <span>SKY</span>
          </button>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[var(--bg-tray,#E2E5EC)] text-[var(--ink-primary,#181A20)] text-[11px] font-mono font-bold tracking-widest uppercase">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)] inline-block" />
            <span>LAB CONSOLE</span>
          </div>
        </div>

        {/* Tactile hardware rocker switch tab pills with HUD reticles */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {tabs.map(tab => {
            const isActive = automataTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAutomataTab(tab.id)}
                className={`hud-reticle ${isActive ? 'active' : ''} px-2.5 py-1 rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white border border-[var(--signal-mid,#6892F6)] shadow-none'
                    : 'bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)] hover:bg-[#DCE0E8] border border-transparent'
                }`}
              >
                <span className={`text-[9px] ${isActive ? 'text-white/80' : 'text-[var(--ink-muted,#8C93A0)]'}`}>
                  {tab.index}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Export Suite Button */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="hud-reticle px-3 py-1 bg-[var(--bg-card,#F5F6F8)] hover:bg-[var(--bg-pill-active,#E0E8F9)] border border-[var(--signal-mid,#6892F6)] rounded-[6px] text-[10px] font-mono uppercase tracking-wider font-semibold text-[var(--signal-cobalt,#1D55F5)] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span>EXPORT SUITE</span>
          <span className="text-[11px] leading-none">↗</span>
        </button>
      </div>

      {/* Main Tab Content — Framed in recessed bento tray with 6px gaps */}
      <div className="flex-1 p-[6px] bg-[var(--bg-tray,#E2E5EC)] overflow-hidden relative flex flex-col gap-[6px]">
        {automataTab === 'nfa' && <NfaView />}
        {automataTab === 'closure' && <EpsilonClosureView />}
        {automataTab === 'subset' && <SubsetConstructionView />}
        {automataTab === 'dfa' && <DfaView />}
        {automataTab === 'minimized' && <MinimizedDfaView />}
        {automataTab === 'simulator' && <SimulatorView />}
        {automataTab === 'formal' && <FormalDefinitionView />}
        {automataTab === 'table' && <TransitionTableView />}
      </div>

      {/* Export Modal */}
      {isExportOpen && <ExportModal onClose={() => setIsExportOpen(false)} />}
    </div>
  );
};
