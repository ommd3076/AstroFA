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
import { Tabs, TabList, TabPanel, Tab } from '../../components/ui/board/base/tabs/tabs';
import { Button as BoardButton } from '../../components/ui/board/base/buttons/button';

type LabTabValue = 'instrument' | AutomataTab;

export const AutomataLab: React.FC = () => {
  const automataTab = useAstroStore(state => state.automataTab);
  const setAutomataTab = useAstroStore(state => state.setAutomataTab);

  // `nfa` is the store's default. A non-default tab means another feature
  // intentionally handed a string or state inspection into the lab.
  const [isInstrumentPanel, setIsInstrumentPanel] = useState<boolean>(automataTab === 'nfa');
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const exportTriggerRef = useRef<HTMLButtonElement>(null);

  // Synchronize when automataTab is changed externally (e.g., from Trace mode handoff)
  const initialTabRef = useRef(automataTab);
  useEffect(() => {
    if (automataTab !== initialTabRef.current) {
      initialTabRef.current = automataTab;
      setIsInstrumentPanel(false);
    }
  }, [automataTab]);

  const tabs: Array<{ id: AutomataTab; index: string; shortLabel: string; label: string }> = [
    { id: 'nfa', index: '01', shortLabel: 'ε-NFA', label: 'ε-NFA' },
    { id: 'closure', index: '02', shortLabel: 'CLOSURE', label: 'ε-CLOSURE' },
    { id: 'subset', index: '03', shortLabel: 'SUBSET', label: 'SUBSET CONSTR' },
    { id: 'dfa', index: '04', shortLabel: 'DFA STATES', label: 'DFA STATES' },
    { id: 'minimized', index: '05', shortLabel: 'MIN-DFA', label: 'MIN-DFA' },
    { id: 'simulator', index: '06', shortLabel: 'SIMULATOR', label: 'SIMULATOR' },
    { id: 'formal', index: '07', shortLabel: '5-TUPLE', label: 'FORMAL 5-TUPLE' },
    { id: 'table', index: '08', shortLabel: 'TABLE', label: 'TRANS TABLE' },
  ];

  const handleSelectTab = (tabId: AutomataTab) => {
    initialTabRef.current = tabId;
    setAutomataTab(tabId);
    setIsInstrumentPanel(false);
  };

  const activeValue: LabTabValue = isInstrumentPanel ? 'instrument' : automataTab;

  const handleTabChange = (nextValue: LabTabValue) => {
    if (nextValue === 'instrument') {
      setIsInstrumentPanel(true);
      return;
    }
    handleSelectTab(nextValue);
  };

  return (
    <Tabs
      selectedKey={activeValue}
      onSelectionChange={value => handleTabChange(String(value) as LabTabValue)}
      className="boardui-surface flex-1 min-h-0 flex flex-col gap-0 bg-[var(--bg-shell)] text-[var(--ink-primary)] font-sans overflow-hidden"
    >
      {/* Board UI tabs preserve the lesson key navigation while exposing a clear selected state. */}
      <div className="min-h-11 border-b border-[var(--border-subtle)] bg-[var(--bg-tray)] px-2.5 sm:px-4 py-1.5 flex flex-wrap items-center justify-between shrink-0 gap-2">
        <TabList
          aria-label="Automata lessons"
          className="flex min-w-0 flex-1 items-center justify-start gap-1 overflow-x-auto bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]"
        >
          <Tab
            id="instrument"
            aria-label="Tactile Hardware Instrument Panel"
              className="font-mono text-[10px] uppercase tracking-wider px-2.5 data-selected:bg-[var(--signal-mid)] data-selected:text-[var(--bg-shell)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
            <span>INSTRUMENT PANEL</span>
            <span className="hidden sm:inline text-[9px] opacity-75 font-semibold">LIVE + DEMO</span>
          </Tab>

          {tabs.map(tab => (
            <Tab
              key={tab.id}
              id={tab.id}
              aria-label={tab.label}
              className="font-mono text-[10px] uppercase tracking-wider px-2 data-selected:bg-[var(--signal-mid)] data-selected:text-[var(--bg-shell)]"
            >
              <span className="sr-only">{tab.index} </span>
              <span>{tab.shortLabel}</span>
            </Tab>
          ))}
        </TabList>

        <BoardButton ref={exportTriggerRef} variant="secondary" size="small" onClick={() => setIsExportOpen(true)} className="font-mono text-[10px] uppercase tracking-wider text-[var(--signal-mid)] border-[var(--signal-surface)] shrink-0">
          <span>Export suite</span>
          <span className="text-[11px] leading-none" aria-hidden="true">↗</span>
        </BoardButton>
      </div>

      {/* Main Content Surface */}
      <TabPanel id={activeValue} className="flex-1 min-h-0 bg-[var(--bg-shell)] overflow-hidden relative flex flex-col">
        {isInstrumentPanel ? (
          <AutomataInstrumentPanel
            onOpenTab={handleSelectTab}
            onOpenExport={() => setIsExportOpen(true)}
          />
        ) : (
          <div className="flex-1 min-h-0 p-2 sm:p-3 bg-[var(--bg-shell)] overflow-hidden relative flex flex-col gap-2">
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
      </TabPanel>

      {/* Board UI export modal */}
      <ExportModal
        open={isExportOpen}
        onOpenChange={setIsExportOpen}
      />
    </Tabs>
  );
};
