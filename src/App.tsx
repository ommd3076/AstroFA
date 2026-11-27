import { lazy, Suspense, useLayoutEffect } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { FieldHome } from './field/FieldHome';
import { FieldNavigation, fieldRoutes } from './field/FieldNavigation';
import { useAstroStore } from './stores/useAstroStore';
import type { ActiveView } from './stores/useAstroStore';

const FieldSky = lazy(() => import('./field/FieldSky').then(module => ({ default: module.FieldSky })));
const FieldCatalog = lazy(() => import('./field/FieldCatalog').then(module => ({ default: module.FieldCatalog })));
const FieldTonight = lazy(() => import('./field/FieldTonight').then(module => ({ default: module.FieldTonight })));
const FieldHunt = lazy(() => import('./field/FieldHunt').then(module => ({ default: module.FieldHunt })));
const ImageLab = lazy(() => import('./features/imageLab/ImageLab').then(module => ({ default: module.ImageLab })));
const AutomataLab = lazy(() => import('./features/automataLab/AutomataLab').then(module => ({ default: module.AutomataLab })));
const Walkthrough = lazy(() => import('./features/academic/AcademicWalkthrough').then(module => ({ default: module.AcademicWalkthrough })));
const Sources = lazy(() => import('./components/CreditsModal').then(module => ({ default: module.CreditsModal })));
const Results = lazy(() => import('./features/traceMode/RecognitionResultsModal').then(module => ({ default: module.RecognitionResultsModal })));
const Geometry = lazy(() => import('./features/traceMode/PatternAnalysisModal').then(module => ({ default: module.PatternAnalysisModal })));

function navigate(view: ActiveView) {
  if (view === 'sky' || view === 'overview') useAstroStore.setState({ isTraceMode: false });
  useAstroStore.getState().setActiveView(view);
}

export function App() {
  const view = useAstroStore(state => state.activeView);
  const closeReport = () => useAstroStore.getState().setActiveView('sky');

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    const route = fieldRoutes.find(item => item.id === view);
    document.title = route ? `${route.name} · Costellar` : 'Costellar';
  }, [view]);

  const screen = {
    overview: <FieldHome onObserve={() => navigate('sky')} />,
    sky: <FieldSky />,
    tonight: <FieldTonight />,
    constellations: <FieldCatalog />,
    hunt: <FieldHunt />,
    imageLab: <ImageLab />,
    automataLab: <AutomataLab />,
    academic: <Walkthrough />,
    credits: <Sources />,
    results: <Results onClose={closeReport} />,
    patterns: <Geometry onClose={closeReport} />,
  }[view];

  return (
    <div className="field-app boardui-surface">
      <a className="field-skip" href="#main-content">Skip to content</a>
      <FieldNavigation view={view} navigate={navigate} />
      <main id="main-content" className="field-main" data-view={view} tabIndex={-1}>
        <Suspense fallback={<p role="status" className="field-loading">Loading view…</p>}>{screen}</Suspense>
      </main>
      <footer className="field-footer">
        <div className="field-footer-inner">
          <strong>Costellar</strong>
          <nav aria-label="Reference and diagnostics">
            {fieldRoutes.slice(7).map(item => <button key={item.id} aria-current={view === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>{item.name}<ArrowUpRight size={12} aria-hidden /></button>)}
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default App;
