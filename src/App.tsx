import React from 'react';
import './App.css';
import { useAstroStore } from './stores/useAstroStore';
import { HeaderNav } from './components/HeaderNav';
import { SkyExplorer } from './features/skyExplorer/SkyExplorer';
import { SkyTonight } from './features/skyTonight/SkyTonight';
import { ConstellationExplorer } from './features/constellationExplorer/ConstellationExplorer';
import { AutomataLab } from './features/automataLab/AutomataLab';
import { HuntMode } from './features/huntMode/HuntMode';
import { ImageLab } from './features/imageLab/ImageLab';
import { AcademicWalkthrough } from './features/academic/AcademicWalkthrough';
import { CreditsModal } from './components/CreditsModal';
import { Overview } from './features/overview/Overview';
import { RecognitionResultsModal } from './features/traceMode/RecognitionResultsModal';
import { PatternAnalysisModal } from './features/traceMode/PatternAnalysisModal';
import { TooltipProvider } from './components/ui/space/tooltip';
import { SidebarInset, SidebarProvider, SidebarTrigger } from './components/ui/space/sidebar';
import { Separator } from './components/ui/space/separator';
import { Button } from './components/ui/space/button';
import { Kbd } from './components/ui/space/kbd';
import { SearchIcon, CompassIcon } from 'lucide-react';

const VIEW_TITLES: Record<string, string> = {
  overview: 'Atlas Overview',
  sky: 'Sky Planetarium',
  tonight: 'Sky Tonight',
  constellations: 'Constellation Catalog',
  automataLab: 'Automata Lab',
  hunt: 'Constellation Hunt',
  imageLab: 'Image Lab',
  academic: 'Academic Walkthrough',
  credits: 'Sources & Credits',
  results: 'Recognition Report',
  patterns: 'Geometry Analysis',
};

export const App: React.FC = () => {
  const activeView = useAstroStore(state => state.activeView);
  const setActiveView = useAstroStore(state => state.setActiveView);
  const isTraceMode = useAstroStore(state => state.isTraceMode);
  const observer = useAstroStore(state => state.observer);

  const currentLabel =
    activeView === 'sky' && isTraceMode
      ? 'Sky Planetarium · Trace Mode'
      : VIEW_TITLES[activeView] || 'Costellar Atlas';

  const isStageRoute = activeView === 'sky' || activeView === 'hunt';

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh overflow-hidden bg-[var(--bg-shell)] text-[var(--ink-primary)]">
        {/* Space UI Collapsible Sidebar & Global Command Palette */}
        <HeaderNav />

        {/* Bounded Inset Workspace preserving WebGL canvas sizing */}
        <SidebarInset className="min-w-0 min-h-0 flex-1 overflow-hidden bg-[var(--bg-tray)] border border-[var(--border-subtle)]">
          {/* Compact Instrument Shell Header */}
          <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-shell)]/90 px-3">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger className="text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]" />
              <Separator orientation="vertical" className="h-4" />
              <span className="truncate text-xs font-semibold tracking-tight text-[var(--ink-primary)]">
                {currentLabel}
              </span>
              {activeView === 'sky' && isTraceMode && (
                <span className="hidden sm:inline-flex items-center rounded-[4px] border border-[var(--signal-surface)] bg-[var(--bg-pill-active)] px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-[var(--signal-mid)]">
                  Trace Active
                </span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('costellar:open-command'))}
                className="h-7 gap-2 border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 text-[11px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                aria-label="Open command search"
              >
                <SearchIcon className="size-3.5 text-[var(--ink-muted)]" aria-hidden="true" />
                <span className="hidden sm:inline">Find target or view...</span>
                <Kbd className="hidden md:inline-flex">Ctrl K</Kbd>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.dispatchEvent(new CustomEvent('costellar:open-observer'))}
                className="hidden sm:inline-flex h-7 gap-1.5 px-2 text-[11px] font-mono text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                title="Change observer location"
              >
                <CompassIcon className="size-3.5 text-[var(--signal-mid)]" aria-hidden="true" />
                <span className="max-w-[140px] truncate">{observer.name.split(',')[0]}</span>
              </Button>
            </div>
          </header>

          {/* Main View Area */}
          <div
            className={`atlas-workspace ${
              isStageRoute ? 'p-1.5 sm:p-2 overflow-hidden' : 'p-3 sm:p-5 lg:p-6'
            }`}
          >
            {/* View 0: Overview Atlas Landing */}
            {activeView === 'overview' && <Overview />}

            {/* View 1: Live Interactive Sky Explorer */}
            {activeView === 'sky' && <SkyExplorer />}

            {/* View 2: Sky Tonight (Above-horizon constellations) */}
            {activeView === 'tonight' && <SkyTonight />}

            {/* View 3: Constellation Explorer */}
            {activeView === 'constellations' && <ConstellationExplorer />}

            {/* View 4: Automata Theory Lab */}
            {activeView === 'automataLab' && <AutomataLab />}

            {/* View 5: Constellation Hunt Mode */}
            {activeView === 'hunt' && <HuntMode />}

            {/* View 6: Image Lab */}
            {activeView === 'imageLab' && <ImageLab />}

            {/* View 7: Academic Demonstration (Viva Mode) */}
            {activeView === 'academic' && <AcademicWalkthrough />}

            {/* View 8: Data Sources & Licensing Credits */}
            {activeView === 'credits' && <CreditsModal />}

            {/* View 9: Dedicated Recognition Results Page */}
            {activeView === 'results' && (
              <RecognitionResultsModal onClose={() => setActiveView('sky')} />
            )}

            {/* View 10: Dedicated Pattern Analysis Page */}
            {activeView === 'patterns' && (
              <PatternAnalysisModal onClose={() => setActiveView('sky')} />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default App;
