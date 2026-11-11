import React, { useEffect } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { SkyCanvas } from '../../sky/SkyCanvas';
import { TraceHud } from '../traceMode/TraceHud';

export const HuntMode: React.FC = () => {
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
    if (!huntTarget) {
      startNewHunt();
    }
  }, [huntTarget, startNewHunt]);

  const isSuccess = recognitionReport?.status === 'FULL_MATCH' &&
    recognitionReport.acceptedPatterns.includes(huntTarget?.constellationId || '');

  return (
    <div className="relative w-full h-full flex flex-col bg-[var(--bg-viewport)] overflow-hidden font-mono">
      {/* Real 3D Sky Canvas Viewport & Trace HUD */}
      <div className="flex-1 relative">
        <SkyCanvas />
        <TraceHud />

        {/* Hunt Challenge Header Banner with HUD Reticle & Monospace Micro-labels */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 max-w-xl w-[calc(100%-24px)] mx-auto font-mono pointer-events-auto">
          <div className="bento-card hud-reticle-4corner p-3.5 shadow-none border border-[var(--signal-surface)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[var(--ink-primary)]">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--signal-cobalt)]" />
                <span className="telemetry-label text-[11px]">[ 🎯 HUNT TELEMETRY // TARGET IDENTIFICATION ]</span>
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
            </div>

            {/* Hint Stepper & Target Stepper Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {huntHintLevel < 2 && (
                <button
                  onClick={() => setHuntHintLevel(huntHintLevel + 1)}
                  className="tactile-pill hud-reticle bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-surface)] text-[10px] py-1.5 px-2.5 font-bold uppercase tracking-wider cursor-pointer"
                >
                  💡 HINT ({huntHintLevel + 1}/2)
                </button>
              )}
              <button
                onClick={() => startNewHunt()}
                className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1.5 px-2.5 font-bold uppercase tracking-wider cursor-pointer"
              >
                NEXT TARGET ↗
              </button>
            </div>
          </div>
        </div>

        {/* Tactical Telemetry Verdict Dialog (PaceOS Hardware Verdict) */}
        {isSuccess && (
          <div className="absolute inset-0 z-40 bg-[#060A14]/70 backdrop-blur-[2px] flex items-center justify-center p-4 font-mono pointer-events-auto">
            <div className="bento-card border-2 border-[var(--signal-cobalt)] max-w-md w-full p-6 text-left space-y-4 shadow-none hud-reticle-4corner animate-in zoom-in-95 duration-150">
              {/* Verdict Header with Tier 1 Doto READOUT */}
              <div className="space-y-1 border-b border-[var(--card-border-subtle)] pb-3">
                <div className="flex items-center justify-between">
                  <span className="telemetry-label text-[10px]">[ VERDICT TELEMETRY // ASTROFA ENGINE ]</span>
                  <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--signal-cobalt)]" />
                </div>
                <div className="font-dot text-3xl font-bold tracking-wider text-[var(--signal-cobalt)] pt-1">
                  [ VERIFIED ]
                </div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-[var(--ink-secondary)]">
                  CELESTIAL PATTERN ACCEPTED &amp; CONFIRMED
                </div>
              </div>

              {/* Explanation Text */}
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
                You successfully located and traced <strong className="text-[var(--ink-primary)] font-bold">{huntTarget?.name.toUpperCase()}</strong>.
                The formal finite state automaton recognized the symbolic turn and distance sequence, and 2D Procrustes alignment confirmed the celestial asterism geometry.
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
                  <span>⚡</span>
                  <span>INSPECT IN AUTOMATA LAB ↗</span>
                </button>
                <button
                  onClick={() => startNewHunt()}
                  className="tactile-button bg-[var(--signal-cobalt)] hover:bg-[var(--signal-mid)] text-white border border-[var(--signal-mid)] py-2.5 px-3 rounded-[6px] text-xs font-semibold uppercase tracking-wider flex-1 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>🎯</span>
                  <span>PLAY ANOTHER HUNT ↗</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
