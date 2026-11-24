import React, { useEffect, useRef } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATION_BY_ID } from '../../data/astroData';
import { SkyCanvas } from '../../sky/SkyCanvas';
import { TraceHud } from '../traceMode/TraceHud';

export const HuntMode: React.FC = () => {
  const huntEntryState = useRef<{
    isTraceMode: boolean;
    showConstellationLines: boolean;
    showTraceHints: boolean;
    tracedStarIds: number[];
    tracedPoints: { x: number; y: number }[];
    recognitionReport: ReturnType<typeof useAstroStore.getState>['recognitionReport'];
    focusedConstellationId: string | null;
    targetFocusCoords: ReturnType<typeof useAstroStore.getState>['targetFocusCoords'];
  } | null>(null);
  const {
    huntTarget,
    startNewHunt,
    huntHintLevel,
    setHuntHintLevel,
    recognitionReport,
    setActiveView,
    setAutomataTab,
    setSimulatorSymbols,
  } = useAstroStore();

  useEffect(() => {
    const state = useAstroStore.getState();
    if (!huntEntryState.current) {
      huntEntryState.current = {
        isTraceMode: state.isTraceMode,
        showConstellationLines: state.showConstellationLines,
        showTraceHints: state.showTraceHints,
        tracedStarIds: state.tracedStarIds,
        tracedPoints: state.tracedPoints,
        recognitionReport: state.recognitionReport,
        focusedConstellationId: state.focusedConstellationId,
        targetFocusCoords: state.targetFocusCoords,
      };
    }
    const unsubscribe = useAstroStore.subscribe((next, previous) => {
      if (previous.activeView === 'hunt' && next.activeView !== 'hunt' && next.huntTarget) {
        const entry = huntEntryState.current;
        if (entry) {
          const keepTraceForResult = next.activeView === 'results' || next.activeView === 'patterns';
          const returningToTraceSky = next.activeView === 'sky' && next.isTraceMode;
          useAstroStore.setState({
            huntTarget: null,
            huntHintLevel: 0,
            ...((keepTraceForResult || returningToTraceSky) ? {} : {
              isTraceMode: entry.isTraceMode,
              showConstellationLines: entry.showConstellationLines,
              showTraceHints: entry.showTraceHints,
              tracedStarIds: entry.tracedStarIds,
              tracedPoints: entry.tracedPoints,
              recognitionReport: entry.recognitionReport,
              focusedConstellationId: entry.focusedConstellationId,
              targetFocusCoords: entry.targetFocusCoords,
            }),
          });
        }
      }
    });
    if (!huntTarget) {
      startNewHunt();
    }
    return unsubscribe;
  }, [huntTarget, startNewHunt]);

  const isSuccess = recognitionReport?.status === 'FULL_MATCH' &&
    recognitionReport.bestMatch?.isVerified === true &&
    recognitionReport.bestMatch.constellationId === huntTarget?.constellationId;

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--bg-shell)] overflow-hidden font-mono">
      {/* Challenge controls occupy their own strip so the tracing HUD stays unobscured. */}
      <div className="shrink-0 px-2 pt-2 font-mono">
          <div className="bento-card p-3 shadow-none border border-[var(--card-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[var(--ink-primary)]">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--signal-cobalt)]" />
                <span className="telemetry-label text-[11px]">CONSTELLATION HUNT</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="text-[11px] text-[var(--ink-muted)] uppercase">TARGET:</span>
                <span className="font-dot text-base text-[var(--signal-cobalt)] font-bold tracking-wider">
                  {huntTarget?.name.toUpperCase()}
                </span>
                <span className="hud-reticle px-1.5 py-0.2 bg-[var(--bg-pill-neutral)] text-[var(--signal-cobalt)] text-[9px] font-bold uppercase font-dot">
                  {huntTarget?.constellationId}
                </span>
              </div>
              <p className="text-[10px] text-[var(--ink-secondary)]">
                LOCATE &amp; TRACE THE <strong className="font-dot text-[var(--signal-cobalt)] font-bold">{huntTarget?.orderedStarIds.length}</strong> REFERENCE STARS IN THE LIVE SKY CANVAS.
              </p>
              {huntTarget?.description && (
                <p className="max-w-2xl text-[10px] leading-relaxed text-[var(--ink-muted)]">{huntTarget.description}</p>
              )}
              {huntHintLevel >= 1 && huntTarget && (
                <p className="text-[10px] font-semibold text-[var(--signal-cobalt)]" aria-live="polite">
                  HINT 1 · REGION RA {((CONSTELLATION_BY_ID.get(huntTarget.constellationId)?.raCenter || 0) / 15).toFixed(1)}H, DEC {(CONSTELLATION_BY_ID.get(huntTarget.constellationId)?.decCenter || 0).toFixed(0)}°
                </p>
              )}
              {huntHintLevel >= 2 && huntTarget && (
                <p className="text-[10px] font-semibold text-[var(--signal-cobalt)]" aria-live="polite">
                  HINT 2 · INITIAL STAR: {huntTarget.starNames[0]}
                </p>
              )}
            </div>

            {/* Hint Stepper & Target Stepper Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {huntHintLevel < 2 && (
                <button
                  onClick={() => setHuntHintLevel(huntHintLevel + 1)}
                  aria-label={`Show hint ${huntHintLevel + 1} of 2`}
                  className="tactile-pill bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-surface)] text-[10px] py-2 px-3 font-bold uppercase tracking-wider cursor-pointer"
                >
                  HINT ({huntHintLevel + 1}/2)
                </button>
              )}
              <button
                onClick={() => startNewHunt()}
                aria-label="Start next hunt target"
                className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1.5 px-2.5 font-bold uppercase tracking-wider cursor-pointer"
              >
                NEXT TARGET ↗
              </button>
            </div>
          </div>
      </div>

      {/* Real 3D Sky Canvas Viewport & Trace HUD */}
      <div className="relative flex-1 min-h-0">
        <SkyCanvas />
        <TraceHud />

        {/* Tactical Telemetry Verdict Dialog (Costellar Hardware Verdict) */}
        {isSuccess && (
          <div className="absolute inset-0 z-40 bg-[#060A14]/70 backdrop-blur-[2px] flex items-center justify-center p-4 font-mono pointer-events-auto">
            <div className="bento-card border-2 border-[var(--signal-cobalt)] max-w-md w-full p-6 text-left space-y-4 shadow-none hud-reticle-4corner animate-in zoom-in-95 duration-150">
              {/* Verdict Header with Tier 1 Doto READOUT */}
              <div className="space-y-1 border-b border-[var(--card-border-subtle)] pb-3">
                <div className="flex items-center justify-between">
                  <span className="telemetry-label text-[10px]">HUNT RESULT</span>
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--signal-cobalt)]" />
                </div>
                <div className="font-dot text-3xl font-bold tracking-wider text-[var(--signal-cobalt)] pt-1">
                  MATCHED
                </div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-[var(--ink-secondary)]">
                  TARGET RECOGNIZED
                </div>
              </div>

              {/* Explanation Text */}
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                You traced <strong className="text-[var(--ink-primary)] font-bold">{huntTarget?.name.toUpperCase()}</strong>. The pattern and its geometry match.
              </p>

              {/* Telemetry Breakdown Box */}
              <div className="p-3 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] space-y-2 text-[11px] font-mono">
                <div className="flex justify-between items-center">
                  <span className="telemetry-label text-[9px]">TARGET ASTERISM:</span>
                  <span className="font-dot text-[var(--ink-primary)] font-bold">{huntTarget?.name} ({huntTarget?.constellationId})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="telemetry-label text-[9px]">DFA FINAL STATE:</span>
                  <span className="font-dot text-[var(--signal-cobalt)] font-bold">{recognitionReport?.finalState} ∈ F</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="telemetry-label text-[9px]">PROCRUSTES RESIDUAL:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-dot text-[var(--signal-cobalt)] font-bold">{recognitionReport?.bestMatch?.residual}</span>
                    <span className="text-[10px] text-[var(--ink-muted)]">(&le; 0.32 TOLERANCE)</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[var(--bg-tray)]">
                  <span className="telemetry-label text-[9px]">VERDICT STATUS:</span>
                  <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] text-[9px] font-bold uppercase font-dot">
                    FULL MATCH ACCEPTED
                  </span>
                </div>
              </div>

              {/* Tactile Hardware Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  onClick={() => {
                    if (recognitionReport?.inputSymbols) {
                      setSimulatorSymbols(recognitionReport.inputSymbols);
                    }
                    setAutomataTab('simulator');
                    setActiveView('automataLab');
                  }}
                  className="tactile-button bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-surface)] py-2.5 px-3 rounded-[6px] text-xs font-semibold uppercase tracking-wider flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>INSPECT IN AUTOMATA LAB ↗</span>
                </button>
                <button
                  onClick={() => startNewHunt()}
                  className="tactile-button bg-[var(--signal-cobalt)] hover:bg-[var(--signal-mid)] text-white border border-[var(--signal-mid)] py-2.5 px-3 rounded-[6px] text-xs font-semibold uppercase tracking-wider flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>PLAY ANOTHER HUNT</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
