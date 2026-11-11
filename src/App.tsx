import React from 'react';
import './App.css';
import { useAstroStore } from './stores/useAstroStore';
import { HeaderNav } from './components/HeaderNav';
import { SkyCanvas } from './sky/SkyCanvas';
import { TimelineBar } from './components/TimelineBar';
import { StarInspector } from './components/StarInspector';
import { TraceHud } from './features/traceMode/TraceHud';
import { SkyTonight } from './features/skyTonight/SkyTonight';
import { ConstellationExplorer } from './features/constellationExplorer/ConstellationExplorer';
import { AutomataLab } from './features/automataLab/AutomataLab';
import { HuntMode } from './features/huntMode/HuntMode';
import { ImageLab } from './features/imageLab/ImageLab';
import { AcademicWalkthrough } from './features/academic/AcademicWalkthrough';
import { CreditsModal } from './components/CreditsModal';
import { Overview } from './features/overview/Overview';

export const App: React.FC = () => {
  const { activeView } = useAstroStore();

  return (
    <div className="bento-shell select-none">
      {/* Persistent Left Rail Navigation (w-[232px]) */}
      <HeaderNav />

      {/* Main View Area framed in recessed Bento Tray */}
      <main className="bento-tray">
        {/* View 0: Overview Analytics Dashboard */}
        {activeView === 'overview' && <Overview />}

        {/* View 1: Live Interactive Sky Canvas */}
        {activeView === 'sky' && (
          <div className="relative w-full h-full flex flex-col rounded-[12px] overflow-hidden bento-card p-0 border border-white/60 bg-[var(--bg-viewport)] min-h-0">
            <div className="flex-1 relative overflow-hidden min-h-0">
              <SkyCanvas />
              <TraceHud />
              <StarInspector />
            </div>
            <TimelineBar />
          </div>
        )}

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
      </main>
    </div>
  );
};

export default App;
