import { useEffect } from 'react';
import { useAstroStore } from '../stores/useAstroStore';
import { FieldSky } from './FieldSky';

export function FieldHunt() {
  useEffect(() => {
    const {
      isTraceMode, showConstellationLines, showTraceHints, tracedStarIds, tracedPoints,
      recognitionReport, backendRecognition, focusedConstellationId, targetFocusCoords,
    } = useAstroStore.getState();
    const prior = {
      isTraceMode, showConstellationLines, showTraceHints, tracedStarIds, tracedPoints,
      recognitionReport, backendRecognition, focusedConstellationId, targetFocusCoords,
    };

    const unsubscribe = useAstroStore.subscribe((next, previous) => {
      if (previous.activeView !== 'hunt' || next.activeView === 'hunt' || !next.huntTarget) return;
      const keepTrace = next.activeView === 'results' || next.activeView === 'patterns' ||
        (next.activeView === 'sky' && next.isTraceMode);
      useAstroStore.setState({ huntTarget: null, huntHintLevel: 0, ...(keepTrace ? {} : prior) });
    });

    if (!useAstroStore.getState().huntTarget) useAstroStore.getState().startNewHunt();
    return unsubscribe;
  }, []);

  return <FieldSky hunt />;
}
