import React, { useEffect, useRef } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATION_BY_ID } from '../../data/astroData';
import { SkyCanvas } from '../../sky/SkyCanvas';
import { TraceHud } from '../traceMode/TraceHud';
import { Button } from '../../components/ui/board/base/buttons/button';
import { Chip } from '../../components/ui/board/base/badges/chip';
import './huntMode.css';

export const HuntMode: React.FC = () => {
  const huntEntryState = useRef<{
    isTraceMode: boolean;
    showConstellationLines: boolean;
    showTraceHints: boolean;
    tracedStarIds: number[];
    tracedPoints: { x: number; y: number }[];
    recognitionReport: ReturnType<typeof useAstroStore.getState>['recognitionReport'];
    backendRecognition: ReturnType<typeof useAstroStore.getState>['backendRecognition'];
    focusedConstellationId: string | null;
    targetFocusCoords: ReturnType<typeof useAstroStore.getState>['targetFocusCoords'];
  } | null>(null);
  const {
    huntTarget,
    startNewHunt,
    huntHintLevel,
    setHuntHintLevel,
    recognitionReport,
    backendRecognition,
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
        backendRecognition: state.backendRecognition,
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
              backendRecognition: entry.backendRecognition,
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

  const isSuccess = backendRecognition?.state === 'available' &&
    backendRecognition.result.status === 'FULL_MATCH' &&
    backendRecognition.result.bestMatch?.constellationId === huntTarget?.constellationId;

  return (
    <div className="hunt-console relative w-full h-full flex flex-col bg-[var(--bg-viewport)] overflow-hidden font-sans">
      {/* Slim mission & hint strip anchored above the live sky stage */}
      <div className="shrink-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-tray)] px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[var(--ink-primary)]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-mid)]" aria-hidden="true" />
              Constellation hunt
            </span>
            <span className="text-[var(--border-hairline)]" aria-hidden="true">|</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--ink-secondary)]">Target:</span>
              <strong className="font-sans text-sm sm:text-base font-semibold text-[var(--ink-primary)]">
                {huntTarget?.name}
              </strong>
              <span className="px-1.5 py-0.5 bg-[var(--bg-pill-active)] border border-[var(--signal-surface)] text-[var(--signal-mid)] rounded text-[10px] font-mono font-semibold uppercase">
                {huntTarget?.constellationId}
              </span>
              <span className="font-mono tabular-nums text-[11px] text-[var(--ink-secondary)]">
                · {huntTarget?.orderedStarIds.length ?? 0} reference stars
              </span>
            </div>
            {huntTarget?.description && (
              <p className="hidden xl:block text-[11px] text-[var(--ink-muted)] truncate max-w-md">
                {huntTarget.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="font-mono text-[11px] text-[var(--ink-muted)]" aria-live="polite">
              {backendRecognition?.state === 'pending' ? 'Server shape check pending'
                : backendRecognition?.state === 'unavailable' ? `Server unavailable · ${backendRecognition.error}`
                : backendRecognition?.state === 'available' ? `Server result · ${backendRecognition.result.status}${backendRecognition.result.status === 'AMBIGUOUS' ? ' · refine trace' : ''}`
                : 'Trace >= 3 stars'}
            </span>
            {huntHintLevel < 2 && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setHuntHintLevel(huntHintLevel + 1)}
                aria-label={`Show hint ${huntHintLevel + 1} of 2`}
                className="text-[11px] font-semibold text-[var(--signal-mid)] border-[var(--signal-surface)] bg-[var(--bg-pill-active)]"
              >
                Hint ({huntHintLevel + 1}/2)
              </Button>
            )}
            <Button
              variant="secondary"
              size="xs"
              onClick={() => startNewHunt()}
              aria-label="Start next hunt target"
              className="text-[11px] font-semibold"
            >
              Next target ↗
            </Button>
          </div>
        </div>

        {(huntHintLevel >= 1 || huntHintLevel >= 2) && huntTarget && (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--border-subtle)] pt-1.5 text-[11px] font-mono text-[var(--signal-mid)]" aria-live="polite">
            {huntHintLevel >= 1 && (
              <span>
                Hint 1 · Region RA {((CONSTELLATION_BY_ID.get(huntTarget.constellationId)?.raCenter || 0) / 15).toFixed(1)}h, Dec {(CONSTELLATION_BY_ID.get(huntTarget.constellationId)?.decCenter || 0).toFixed(0)}°
              </span>
            )}
            {huntHintLevel >= 2 && (
              <span>
                Hint 2 · Starting star: {huntTarget.starNames[0]}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Real 3D Sky Canvas Viewport & Trace HUD */}
      <div className="relative flex-1 min-h-0">
        <SkyCanvas />
        <TraceHud />

        {/* Verdict Surface */}
        {isSuccess && (
          <div className="absolute inset-0 z-40 bg-[#070709]/80 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto">
            <div className="hunt-verdict atlas-surface border-[var(--signal-surface)] max-w-md w-full p-6 text-left gap-4 shadow-2xl">
              <div className="space-y-1 border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)]">Hunt result</span>
                  <span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" aria-hidden="true" />
                </div>
                <div className="font-sans text-2xl font-semibold text-[var(--signal-mid)] pt-1">
                  Matched
                </div>
                <div className="text-xs font-medium text-[var(--ink-secondary)]">
                  Target recognized
                </div>
              </div>

              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                You traced <strong className="text-[var(--ink-primary)] font-semibold">{huntTarget?.name}</strong>. The symbol sequence and Procrustes geometry match.
              </p>

              <dl className="atlas-surface-subtle rounded-lg p-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <dt className="text-[10px] text-[var(--ink-muted)] uppercase">Target</dt>
                  <dd className="text-[var(--ink-primary)] font-semibold">{huntTarget?.name} ({huntTarget?.constellationId})</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-[10px] text-[var(--ink-muted)] uppercase">DFA state</dt>
                  <dd className="text-[var(--signal-mid)] font-semibold">{recognitionReport?.finalState} ∈ F</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-[10px] text-[var(--ink-muted)] uppercase">Residual</dt>
                  <dd className="flex items-center gap-1.5 tabular-nums">
                    <span className="text-[var(--signal-mid)] font-semibold">{backendRecognition?.state === 'available' ? backendRecognition.result.bestMatch?.residual : '—'}</span>
                    <span className="text-[10px] text-[var(--ink-muted)]">(&le; 0.32 tolerance)</span>
                  </dd>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-[var(--border-subtle)]">
                  <dt className="text-[10px] text-[var(--ink-muted)] uppercase">Status</dt>
                    <dd><Chip variant="caption" color="cyan">Server full match</Chip></dd>
                </div>
              </dl>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    if (recognitionReport?.inputSymbols) {
                      setSimulatorSymbols(recognitionReport.inputSymbols);
                    }
                    setAutomataTab('simulator');
                    setActiveView('automataLab');
                  }}
                  className="flex-1 text-xs font-semibold"
                >
                  Inspect in Automata Lab ↗
                </Button>
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => startNewHunt()}
                  className="flex-1 text-xs font-semibold"
                >
                  Play another hunt
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
