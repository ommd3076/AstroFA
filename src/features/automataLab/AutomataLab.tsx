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
import { PageHeader } from '../../components/PageHeader';

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
    <section className="field-page flex h-full min-h-0 flex-col gap-4 overflow-hidden bg-[var(--bg-shell)] p-4 sm:p-6" aria-label="Automata laboratory">
      <PageHeader
        className="field-page-heading"
        eyebrow="Formal language · interactive instrument"
        title="Automata lab"
        meta="8 views · live machine state"
        description="Inspect the recognizer from ε-NFA to minimized DFA, then replay a real encoded constellation trace. Every panel below reads from the same machine and simulator state."
        actions={
          <div className="field-actions flex flex-wrap items-center gap-2">
            <span className="field-chip rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-secondary)]">keyboard: ← →</span>
            <BoardButton ref={exportTriggerRef} variant="secondary" size="small" onClick={() => setIsExportOpen(true)} className="font-mono text-[10px] uppercase tracking-wider text-[var(--signal-mid)]">
              Export suite ↗
            </BoardButton>
          </div>
        }
      />

      <Tabs
        selectedKey={activeValue}
        onSelectionChange={value => handleTabChange(String(value) as LabTabValue)}
        className="boardui-surface flex-1 min-h-0 flex flex-col gap-0 overflow-hidden bg-[var(--bg-card)] text-[var(--ink-primary)] font-sans"
      >
      <div className="field-lab-rail border-b border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-3 sm:px-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="field-instrument-heading font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-muted)]">Lesson index</p>
            <p className="text-xs text-[var(--ink-secondary)]">Choose a representation; the machine remains live between views.</p>
          </div>
          <span className="field-chip hidden rounded-full bg-[var(--bg-pill-active)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--signal-mid)] sm:inline-flex">{isInstrumentPanel ? 'instrument' : `${String(tabs.findIndex(tab => tab.id === automataTab) + 1).padStart(2, '0')} / ${tabs.length}`}</span>
        </div>
        <TabList
          aria-label="Automata lessons"
          className="flex min-w-0 items-stretch justify-start gap-1 overflow-x-auto"
        >
          <Tab
            id="instrument"
            aria-label="Tactile Hardware Instrument Panel"
              className="field-tab min-w-[132px] justify-start gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] px-2.5 py-2 text-left font-mono text-[10px] uppercase tracking-wider data-selected:border-[var(--signal-mid)] data-selected:bg-[var(--bg-pill-active)] data-selected:text-[var(--ink-primary)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
              <span className="flex flex-col"><span>Instrument</span><span className="text-[9px] opacity-70">live + demo</span></span>
          </Tab>

          {tabs.map(tab => (
            <Tab
              key={tab.id}
              id={tab.id}
              aria-label={tab.label}
              className="field-tab min-w-[104px] justify-start gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] px-2.5 py-2 text-left font-mono text-[10px] uppercase tracking-wider data-selected:border-[var(--signal-mid)] data-selected:bg-[var(--bg-pill-active)] data-selected:text-[var(--ink-primary)]"
            >
              <span className="text-[9px] text-[var(--ink-muted)]">{tab.index}</span>
              <span className="flex flex-col"><span>{tab.shortLabel}</span><span className="text-[9px] normal-case tracking-normal opacity-70">{tab.label}</span></span>
            </Tab>
          ))}
        </TabList>

      </div>

      {/* Main Content Surface */}
      <TabPanel id={activeValue} className="flex-1 min-h-0 bg-[var(--bg-shell)] overflow-hidden relative flex flex-col">
        {isInstrumentPanel ? (
          <AutomataInstrumentPanel
            onOpenTab={handleSelectTab}
            onOpenExport={() => setIsExportOpen(true)}
          />
        ) : (
          <div className="field-lab-stage flex-1 min-h-0 bg-[var(--bg-shell)] p-2 sm:p-4 overflow-hidden relative flex flex-col gap-2">
            <div className="field-note flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 text-[11px] text-[var(--ink-secondary)]">
              <span>Active lesson: <strong className="font-semibold text-[var(--ink-primary)]">{tabs.find(tab => tab.id === automataTab)?.label}</strong></span>
              <span className="hidden font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)] sm:inline">select a state to inspect its transitions</span>
            </div>
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
    </section>
  );
};
