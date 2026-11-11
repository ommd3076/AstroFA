import React from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { REFERENCE_PATTERNS, STAR_BY_ID } from '../../data/astroData';
import { RecognitionResultsModal } from './RecognitionResultsModal';
import { PatternAnalysisModal } from './PatternAnalysisModal';

export const TraceHud: React.FC = () => {
  const {
    isTraceMode,
    setIsTraceMode,
    showTraceHints,
    setShowTraceHints,
    showPatternAnalysisModal,
    setShowPatternAnalysisModal,
    showRecognitionResultsModal,
    setShowRecognitionResultsModal,
    tracedStarIds,
    tracedPoints,
    recognitionReport,
    undoLastTracePoint,
    clearTrace,
    loadPresetTrace,
    addTracedCustomPoint,
    setActiveView,
    setAutomataTab,
    setSimulatorSymbols,
  } = useAstroStore();

  if (!isTraceMode) return null;

  const handleOpenAutomataLab = () => {
    if (recognitionReport && recognitionReport.inputSymbols.length > 0) {
      setSimulatorSymbols(recognitionReport.inputSymbols);
    }
    setAutomataTab('simulator');
    setActiveView('automataLab');
  };

  const pointCount = tracedStarIds.length > 0 ? tracedStarIds.length : tracedPoints.length;

  // Handle Preset Dropdown Selection including Demo cases (Rejection & Invariance)
  const handlePresetSelect = (val: string) => {
    if (!val) return;

    if (val === 'DEMO_SYMBOLIC_REJECT') {
      // Zigzag points that do not match any constellation prefix
      clearTrace();
      const zigzagPoints = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 100 },
        { x: 200, y: 100 },
        { x: 200, y: 5 },
      ];
      for (const p of zigzagPoints) {
        addTracedCustomPoint(p);
      }
      return;
    }

    if (val === 'DEMO_GEOMETRIC_REJECT') {
      // Points whose turning angles and ratios quantize to Ori_fwd symbols ["LL:G", "LL:S", "LL:G"],
      // but whose geometric coordinates diverge from Orion's actual constellation figure (residual > 0.32)
      clearTrace();
      const p0 = { x: 0, y: 0 };
      const p1 = { x: 100, y: 0 };
      const a1 = (140 * Math.PI) / 180;
      const p2 = { x: p1.x + 300 * Math.cos(a1), y: p1.y + 300 * Math.sin(a1) };
      const a2 = a1 + (66 * Math.PI) / 180;
      const p3 = { x: p2.x + 60 * Math.cos(a2), y: p2.y + 60 * Math.sin(a2) };
      const a3 = a2 + (155 * Math.PI) / 180;
      const p4 = { x: p3.x + 240 * Math.cos(a3), y: p3.y + 240 * Math.sin(a3) };

      const distortedPoints = [p0, p1, p2, p3, p4];
      for (const p of distortedPoints) {
        addTracedCustomPoint(p);
      }
      return;
    }

    if (val === 'DEMO_INVARIANCE') {
      // Rotated (137.5 deg) and Scaled (4.2x) Cassiopeia asterism
      clearTrace();
      const cas = REFERENCE_PATTERNS.find(p => p.id === 'Cas_fwd')!;
      const angle = (137.5 * Math.PI) / 180;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const scale = 4.2;

      const rotatedPoints = cas.referencePoints.map(pt => ({
        x: scale * (pt.x * cosA - pt.y * sinA) + 800,
        y: scale * (pt.x * sinA + pt.y * cosA) - 300,
      }));
      for (const p of rotatedPoints) {
        addTracedCustomPoint(p);
      }
      return;
    }

    const pat = REFERENCE_PATTERNS.find(p => p.id === val);
    if (pat) loadPresetTrace(pat);
  };

  return (
    <>
      <div className="hud-reticle-4corner absolute top-4 left-4 z-20 w-96 bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[12px] p-4 text-xs font-mono space-y-3.5 shadow-none animate-in fade-in slide-in-from-left-4 duration-200">
        {/* Title & 4-Dot LED Indicator */}
        <div className="flex items-center justify-between border-b border-[#E2E5EC] pb-2.5">
          <div className="flex items-center gap-2.5">
            {/* 4-Dot LED Activity Indicator */}
            <div className="flex items-center gap-1" title="Trace Telemetry LED Activity">
              {[0, 1, 2, 3].map(i => {
                const isLit = i < (pointCount >= 4 ? 4 : pointCount >= 2 ? 3 : pointCount >= 1 ? 2 : 1);
                return (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isLit ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                    }`}
                  />
                );
              })}
            </div>
            <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-[0.08em]">
              TRACE-TO-RECOGNIZE
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[var(--ink-secondary)] uppercase tracking-[0.08em] px-2 py-0.5 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[4px] font-semibold">
              {pointCount} {pointCount === 1 ? 'STAR' : 'STARS'}
            </span>
            <button
              onClick={() => setIsTraceMode(false)}
              className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 rounded-[4px] hover:bg-[var(--bg-tray)] transition-colors cursor-pointer text-xs font-mono font-bold"
              title="Exit Trace Mode"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Hints Toggle & Quick Controls */}
        <div className="flex items-center justify-between bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px] p-2 text-[10px]">
          <span className="text-[var(--ink-secondary)] font-mono uppercase tracking-[0.08em] font-semibold">
            CONSTELLATION GUIDE HINTS:
          </span>
          <button
            onClick={() => setShowTraceHints(!showTraceHints)}
            className={`px-2.5 py-1 rounded-[6px] text-[10px] font-mono uppercase tracking-[0.08em] font-semibold cursor-pointer transition-colors border ${
              showTraceHints
                ? 'bg-[var(--signal-cobalt)] text-white border-[var(--signal-mid)]'
                : 'bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] border-[#D8DCE5] hover:text-[var(--ink-primary)]'
            }`}
          >
            {showTraceHints ? 'HINTS: ACTIVE' : 'HINTS: OFF'}
          </button>
        </div>

        {/* Recognition Outcome Badge (Costellar HUD Reticle & Doto Font) */}
        {recognitionReport ? (
          <div className="space-y-2">
            {recognitionReport.status === 'FULL_MATCH' && (
              <div className="hud-reticle p-3 bg-[var(--bg-pill-active)] border border-[var(--signal-surface)] rounded-[8px] space-y-1.5 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-dot text-sm font-bold text-[var(--signal-cobalt)] tracking-wider flex items-center gap-1.5">
                    ✓ FULL_MATCH RECOGNIZED
                  </span>
                  <span className="px-2 py-0.5 bg-[var(--signal-cobalt)] text-white rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider">
                    {recognitionReport.bestMatch?.constellationId}
                  </span>
                </div>
                <div className="text-[var(--ink-primary)] text-[11px] font-semibold tracking-wide uppercase">
                  {recognitionReport.bestMatch?.patternName}
                </div>
                <div className="text-[10px] text-[var(--ink-secondary)] font-mono">
                  RESIDUAL: <strong className="text-[var(--signal-cobalt)]">{recognitionReport.bestMatch?.residual}</strong> (&le; 0.32 TOLERANCE)
                </div>
              </div>
            )}

            {recognitionReport.status === 'VALID_PREFIX' && (
              <div className="hud-reticle p-3 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px] space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-dot text-sm font-bold text-[var(--ink-primary)] tracking-wider">
                    ⋯ VALID_PREFIX
                  </span>
                  <span className="text-[10px] text-[var(--signal-cobalt)] font-mono font-semibold uppercase tracking-wider">
                    {recognitionReport.prefixMatch.reachableAcceptingLabels.length} CANDIDATES
                  </span>
                </div>
                {/* Segmented Pill Barcode (5 discrete segments) */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }).map((_, idx) => {
                      const activeSegments = Math.min(5, Math.max(1, Math.ceil((recognitionReport.prefixMatch.reachableAcceptingLabels.length / 10) * 5)));
                      const isFilled = idx < activeSegments;
                      return (
                        <span
                          key={idx}
                          className={`flex-1 h-1.5 rounded-[1px] transition-colors ${
                            isFilled ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[9px] text-[var(--ink-muted)] uppercase tracking-wider">
                    <span>PREFIX MATCH CONFIDENCE</span>
                    <span>SEGMENTED BARCODE</span>
                  </div>
                </div>
                <div className="text-[var(--ink-secondary)] text-[10px] uppercase tracking-wider truncate">
                  CANDIDATES: {recognitionReport.prefixMatch.reachableAcceptingLabels.slice(0, 5).join(', ')}
                  {recognitionReport.prefixMatch.reachableAcceptingLabels.length > 5 && '...'}
                </div>
              </div>
            )}

            {recognitionReport.status === 'GEOMETRIC_REJECT' && (
              <div className="hud-reticle p-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-[8px] space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-dot text-sm font-bold text-[#D97706] tracking-wider">
                    ⚠️ GEOMETRIC_REJECT
                  </span>
                  <span className="text-[10px] font-mono text-[#B45309] font-bold">
                    RESIDUAL {recognitionReport.bestMatch?.residual}
                  </span>
                </div>
                <p className="text-[#92400E] text-[10px] leading-relaxed uppercase tracking-wider">
                  DFA ACCEPTED SYMBOLS, BUT PROCRUSTES RESIDUAL EXCEEDS 0.32 THRESHOLD.
                </p>
              </div>
            )}

            {recognitionReport.status === 'SYMBOLIC_REJECT' && (
              <div className="hud-reticle p-3 bg-[#FEE2E2] border border-[#FCA5A5] rounded-[8px] space-y-1 w-full">
                <span className="font-dot text-sm font-bold text-[#DC2626] tracking-wider block">
                  ✕ SYMBOLIC_REJECT
                </span>
                <p className="text-[#991B1B] text-[10px] leading-relaxed uppercase tracking-wider">
                  {recognitionReport.explanation.toUpperCase()}
                </p>
              </div>
            )}

            {/* Encoded Symbolic Sequence Styled as Hardware Micro-Chips */}
            {recognitionReport.inputSymbols.length > 0 && (
              <div className="p-2.5 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px] space-y-1.5">
                <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em]">
                  ENCODED SYMBOLIC STRING (W &isin; &Sigma;*)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recognitionReport.inputSymbols.map((sym, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#181A20] border-l-2 border-l-[var(--signal-cobalt)] border-t border-r border-b border-[#2E333D] rounded-[3px] text-[10px] font-mono text-[#6892F6] font-bold tracking-wider inline-flex items-center gap-1 shadow-none"
                    >
                      {sym}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px] text-[var(--ink-muted)] text-[10px] uppercase tracking-[0.08em] leading-relaxed">
            CLICK STARS IN SEQUENCE ON THE SKY TO ESTABLISH VECTORS, CALCULATE RELATIVE TURN ANGLES AND LENGTH RATIOS, AND RUN THE PATTERN RECOGNITION DFA.
          </div>
        )}

        {/* Traced Star Sequence List */}
        {tracedStarIds.length > 0 && (
          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
            <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em]">
              SELECTED STAR PATH:
            </div>
            <div className="flex flex-wrap gap-1">
              {tracedStarIds.map((sid, idx) => {
                const star = STAR_BY_ID.get(sid);
                return (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[4px] text-[10px] text-[var(--ink-primary)] font-mono flex items-center gap-1 uppercase tracking-wider"
                  >
                    <strong className="text-[var(--signal-cobalt)]">{idx + 1}.</strong>
                    {star?.proper || star?.name || `ID ${sid}`}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Tactile Hardware Action Buttons */}
        <div className="space-y-2 pt-1 border-t border-[#E2E5EC]">
          <div className="flex gap-2">
            <button
              onClick={undoLastTracePoint}
              disabled={pointCount === 0}
              className="flex-1 py-2 bg-[var(--bg-tray)] hover:bg-[#D8DCE5] disabled:opacity-40 text-[var(--ink-primary)] rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-colors border border-[#D0D5DD] cursor-pointer"
            >
              ↩ UNDO STAR
            </button>
            <button
              onClick={clearTrace}
              disabled={pointCount === 0}
              className="flex-1 py-2 bg-[var(--bg-tray)] hover:bg-[#D8DCE5] disabled:opacity-40 text-[var(--ink-primary)] rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-colors border border-[#D0D5DD] cursor-pointer"
            >
              CLEAR PATH
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowRecognitionResultsModal(true)}
              disabled={!recognitionReport}
              className="flex-1 py-2 bg-[var(--signal-cobalt)] hover:bg-[#1644C5] disabled:opacity-40 text-white rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-colors border border-[#1644C5] cursor-pointer shadow-none"
            >
              📊 COMPLETE TRACE
            </button>
            <button
              onClick={() => setShowPatternAnalysisModal(true)}
              disabled={pointCount < 2}
              className="flex-1 py-2 bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] disabled:opacity-40 text-[var(--ink-primary)] rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-colors border border-[#D0D5DD] cursor-pointer"
            >
              📐 GEOMETRY
            </button>
          </div>

          {/* Test Presets Dropdown */}
          <div>
            <label className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] block mb-1 tracking-[0.08em]">
              CURATED PATTERNS &amp; ACADEMIC DEMOS:
            </label>
            <select
              onChange={e => handlePresetSelect(e.target.value)}
              defaultValue=""
              className="w-full bg-[var(--bg-tray)] border border-[#D0D5DD] rounded-[6px] px-2.5 py-1.5 text-[11px] font-mono text-[var(--ink-primary)] cursor-pointer uppercase tracking-wider"
            >
              <option value="" disabled>-- SELECT PATTERN OR ACADEMIC DEMO --</option>
              <optgroup label="Real Constellation References">
                {REFERENCE_PATTERNS.filter(p => p.traversalVariant === 'forward').map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name.toUpperCase()} ({p.orderedStarIds.length} STARS)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Academic Demonstrations">
                <option value="DEMO_SYMBOLIC_REJECT">DEMO: SYMBOLIC REJECTION (ZIGZAG PATH)</option>
                <option value="DEMO_GEOMETRIC_REJECT">DEMO: GEOMETRIC REJECTION (DISTORTED SHAPE)</option>
                <option value="DEMO_INVARIANCE">DEMO: INVARIANCE (ROTATED 137° &amp; 4.2X SCALE)</option>
              </optgroup>
            </select>
          </div>

          {/* Automata Lab Drilldown Button */}
          {recognitionReport && (
            <button
              onClick={handleOpenAutomataLab}
              className="w-full py-2.5 bg-[var(--signal-cobalt)] hover:bg-[#1644C5] text-white rounded-[8px] font-mono font-bold text-xs uppercase tracking-[0.08em] flex items-center justify-center gap-2 transition-colors border border-[#1644C5] cursor-pointer shadow-none"
            >
              <span>⚡</span>
              <span>INSPECT DFA IN AUTOMATA LAB</span>
            </button>
          )}
        </div>
      </div>

      {/* Recognition Results Modal */}
      {showRecognitionResultsModal && (
        <RecognitionResultsModal onClose={() => setShowRecognitionResultsModal(false)} />
      )}

      {/* Pattern Geometry Analysis Modal */}
      {showPatternAnalysisModal && (
        <PatternAnalysisModal onClose={() => setShowPatternAnalysisModal(false)} />
      )}
    </>
  );
};