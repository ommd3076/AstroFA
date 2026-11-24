import React, { useState, useEffect, useRef } from 'react';
import { useAstroStore, type AutomataTab } from '../../stores/useAstroStore';
import { AutomataInstrumentPanel } from './AutomataInstrumentPanel';
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
  const { automataTab, setAutomataTab } = useAstroStore();
  // `nfa` is the store's default. A non-default tab means another feature
  // intentionally handed a string or state inspection into the lab.
  const [isInstrumentPanel, setIsInstrumentPanel] = useState<boolean>(automataTab === 'nfa');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Synchronize when automataTab is changed externally (e.g., from Trace mode handoff)
  const initialTabRef = useRef(automataTab);
  useEffect(() => {
    if (automataTab !== initialTabRef.current) {
      initialTabRef.current = automataTab;
      setIsInstrumentPanel(false);
    }
  }, [automataTab]);

  const tabs: Array<{ id: AutomataTab; index: string; label: string }> = [
    { id: 'nfa', index: '01', label: 'ε-NFA' },
    { id: 'closure', index: '02', label: 'ε-CLOSURE' },
    { id: 'subset', index: '03', label: 'SUBSET CONSTR' },
    { id: 'dfa', index: '04', label: 'DFA STATES' },
    { id: 'minimized', index: '05', label: 'MIN-DFA' },
    { id: 'simulator', index: '06', label: 'SIMULATOR' },
    { id: 'formal', index: '07', label: 'FORMAL 5-TUPLE' },
    { id: 'table', index: '08', label: 'TRANS TABLE' },
  ];

  const handleSelectTab = (tabId: AutomataTab) => {
    setAutomataTab(tabId);
    setIsInstrumentPanel(false);
  };

  const handleSelectInstrumentPanel = () => {
    setIsInstrumentPanel(true);
  };

  return (
    <div
      className="flex-1 min-h-0 flex flex-col bg-[var(--bg-shell,#eeeeed)] text-[var(--ink-primary,#18191b)] font-mono overflow-hidden"
      style={{
        '--bg-shell': '#eeeeed',
        '--bg-tray': '#dedfdf',
        '--bg-card': '#f6f6f5',
        '--ink-primary': '#18191b',
        '--ink-secondary': '#565b64',
        '--ink-muted': '#777d85',
        '--bg-pill-neutral': '#e5e6e5',
        '--bg-pill-active': '#e5edff',
        '--signal-cobalt': '#064bdc',
        '--signal-mid': '#8aa9ef',
      } as React.CSSProperties}
    >
      {/* Sub-header navigation strip — Hardware Machined Console with Discrete Tabs */}
      <div className="min-h-11 border-b border-[var(--bg-tray)] bg-[var(--bg-card)] px-2 sm:px-3.5 py-1.5 flex flex-wrap items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Hardware Instrument Panel Primary View Selector (Matches Frame 10 Visual Truth) */}
          <button
            onClick={handleSelectInstrumentPanel}
            className={`hud-reticle ${isInstrumentPanel ? 'active' : ''} px-3 py-1 rounded-[6px] text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              isInstrumentPanel
                ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white border border-[var(--signal-mid,#6892F6)] shadow-none'
                : 'bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)] hover:bg-[#DCE0E8] border border-transparent'
            }`}
            title="Frame 10 Tactile Hardware Instrument Panel"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)] inline-block mr-0.5" />
            <span>INSTRUMENT PANEL</span>
            <span className="hidden sm:inline text-[9px] text-white/70 font-semibold">LIVE + DEMO</span>
          </button>
        </div>

        {/* Retained 8 Educational Detailed Teaching Tabs */}
        <nav aria-label="Automata lessons" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto no-scrollbar py-0.5 sm:justify-center">
          {tabs.map(tab => {
            const isActive = !isInstrumentPanel && automataTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                title={tab.label}
                className={`hud-reticle ${isActive ? 'active' : ''} px-2 py-1 rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white border border-[var(--signal-mid,#6892F6)] shadow-none'
                    : 'bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)] hover:bg-[#DCE0E8] border border-transparent'
                }`}
              >
                <span className="sr-only">{tab.index} </span>
                <span>{tab.id === 'subset' ? 'SUBSET' : tab.id === 'formal' ? '5-TUPLE' : tab.id === 'table' ? 'TABLE' : tab.id === 'minimized' ? 'MIN-DFA' : tab.id === 'closure' ? 'CLOSURE' : tab.id === 'simulator' ? 'SIMULATOR' : tab.id === 'dfa' ? 'DFA STATES' : 'ε-NFA'}</span>
              </button>
            );
          })}
        </nav>

        {/* Export Suite Button */}
        <button
          onClick={() => setIsExportOpen(true)}
          className="hud-reticle px-3 py-1 bg-[var(--bg-card,#F5F6F8)] hover:bg-[var(--bg-pill-active,#E0E8F9)] border border-[var(--signal-mid,#6892F6)] rounded-[6px] text-[10px] font-mono uppercase tracking-wider font-semibold text-[var(--signal-cobalt,#1D55F5)] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <span>EXPORT SUITE</span>
          <span className="text-[11px] leading-none">↗</span>
        </button>
      </div>

      {/* Main Content Surface */}
      <div className="flex-1 min-h-0 bg-[var(--bg-shell)] overflow-hidden relative flex flex-col">
        {isInstrumentPanel ? (
          <AutomataInstrumentPanel
            onOpenTab={handleSelectTab}
            onOpenExport={() => setIsExportOpen(true)}
          />
        ) : (
          <div className="flex-1 min-h-0 p-1.5 sm:p-2 bg-[var(--bg-tray)] overflow-hidden relative flex flex-col gap-1.5 sm:gap-2">
            {automataTab === 'nfa' && <NfaView />}
            {automataTab === 'closure' && <EpsilonClosureView />}
            {automataTab === 'subset' && <SubsetConstructionView />}
            {automataTab === 'dfa' && <DfaView />}
            {automataTab === 'minimized' && <MinimizedDfaView />}
            {automataTab === 'simulator' && <SimulatorView />}
            {automataTab === 'formal' && <FormalDefinitionView />}
            {automataTab === 'table' && <TransitionTableView />}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {isExportOpen && <ExportModal onClose={() => setIsExportOpen(false)} />}
    </div>
  );
};
