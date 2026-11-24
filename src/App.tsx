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

export const App: React.FC = () => {
  const { activeView, setActiveView } = useAstroStore();

  return (
    <div className="bento-shell">
      {/* Persistent Left Rail Navigation (w-[232px]) */}
      <HeaderNav />

      {/* Main View Area framed in recessed Bento Tray */}
      <main className="bento-tray">
        {/* View 0: Overview Analytics Dashboard */}
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

        {/* View 9: Dedicated Recognition Results Page (Frame 8) */}
        {activeView === 'results' && (
          <RecognitionResultsModal onClose={() => setActiveView('sky')} />
        )}

        {/* View 10: Dedicated Pattern Analysis Page (Frame 9) */}
        {activeView === 'patterns' && (
          <PatternAnalysisModal onClose={() => setActiveView('sky')} />
        )}
      </main>
    </div>
  );
};

export default App;
