import React, { useState, useEffect, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { REFERENCE_PATTERNS, STAR_BY_ID } from '../../data/astroData';
import { RecognitionResultsModal } from './RecognitionResultsModal';
import { PatternAnalysisModal } from './PatternAnalysisModal';

// Mini SVG Thumbnail renderer for constellation asterisms
export const AsterismThumbnail: React.FC<{
  points?: { x: number; y: number }[];
  size?: number;
  className?: string;
}> = ({ points, size = 44, className = '' }) => {
  if (!points || points.length === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-[#0A0F1D] rounded-[6px] border border-[#202738] flex items-center justify-center text-[10px] text-gray-400 shrink-0 ${className}`}
      >
        ✦
      </div>
    );
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX || 1;
  const h = maxY - minY || 1;
  const pad = 7;
  const vSize = 50;
  const scale = (vSize - pad * 2) / Math.max(w, h);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const mapped = points.map(p => ({
    x: vSize / 2 + (p.x - cx) * scale,
    y: vSize / 2 + (p.y - cy) * scale,
  }));

  const polylineStr = mapped.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vSize} ${vSize}`}
      className={`bg-[#0A0F1D] rounded-[6px] border border-[#202738] shrink-0 ${className}`}
      aria-hidden="true"
    >
      {polylineStr && (
        <polyline
          points={polylineStr}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {mapped.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x}
          cy={p.y}
          r={idx === 0 || idx === mapped.length - 1 ? '2.5' : '1.8'}
          fill={idx === mapped.length - 1 ? '#60A5FA' : '#93C5FD'}
        />
      ))}
    </svg>
  );
};

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

  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Live session timer in trace mode
  useEffect(() => {
    if (!isTraceMode) return;
    const interval = setInterval(() => {
      setSessionSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTraceMode]);

  // Format MM MIN SS SEC
  const mins = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
  const secs = String(sessionSeconds % 60).padStart(2, '0');
  const elapsedDisplay = `${mins} MIN ${secs} SEC`;

  // Global keydown shortcut for Undo (Z)
  useEffect(() => {
    if (!isTraceMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if ((e.key === 'z' || e.key === 'Z') && !e.metaKey && !e.ctrlKey) {
        if (tracedStarIds.length > 0 || tracedPoints.length > 0) {
          undoLastTracePoint();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTraceMode, tracedStarIds.length, tracedPoints.length, undoLastTracePoint]);

  const pointCount = tracedStarIds.length > 0 ? tracedStarIds.length : tracedPoints.length;
  const symbolCount = recognitionReport ? recognitionReport.inputSymbols.length : pointCount >= 2 ? pointCount - 1 : 0;

  const handleOpenAutomataLab = () => {
    if (recognitionReport && recognitionReport.inputSymbols.length > 0) {
      setSimulatorSymbols(recognitionReport.inputSymbols);
    }
    setAutomataTab('simulator');
    setActiveView('automataLab');
  };

  // Handle Preset Dropdown Selection including Demo cases (Rejection & Invariance)
  const handlePresetSelect = (val: string) => {
    if (!val) return;

    if (val === 'DEMO_SYMBOLIC_REJECT') {
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

  // Derive candidate matches list
  const candidatesList = useMemo(() => {
    if (recognitionReport && recognitionReport.geometricScores.length > 0) {
      return recognitionReport.geometricScores.map(score => {
        const refPattern = REFERENCE_PATTERNS.find(p => p.id === score.patternId || p.constellationId === score.constellationId);
        // Normalized score from residual vs 0.45 tolerance
        const fitScorePercent = Math.max(0, Math.min(99.9, (1 - Math.min(1, score.residual / 0.45)) * 100)).toFixed(1);
        const isBestMatch = recognitionReport.bestMatch?.patternId === score.patternId;
        return {
          id: score.patternId,
          name: score.patternName || score.constellationId,
          constellationId: score.constellationId,
          residual: score.residual,
          fitScorePercent,
          isVerified: score.isVerified,
          isBestMatch,
          points: refPattern?.referencePoints,
        };
      });
    }

    if (recognitionReport?.status === 'VALID_PREFIX' && recognitionReport.prefixMatch.reachableAcceptingLabels.length > 0) {
      return recognitionReport.prefixMatch.reachableAcceptingLabels.map(label => {
        const refPattern = REFERENCE_PATTERNS.find(p => p.id === label || p.constellationId === label);
        return {
          id: label,
          name: refPattern?.name || label,
          constellationId: refPattern?.constellationId || label,
          residual: 0,
          fitScorePercent: 'PREFIX',
          isVerified: false,
          isBestMatch: false,
          points: refPattern?.referencePoints,
        };
      });
    }

    return [];
  }, [recognitionReport]);

  const displayedCandidates = showAllCandidates ? candidatesList : candidatesList.slice(0, 3);

  // Active candidates text for top metric tile
  const activeCandidatesDisplay = useMemo(() => {
    if (!recognitionReport) return 'CLICK STARS TO DISCOVER CANDIDATES';
    if (recognitionReport.status === 'FULL_MATCH') {
      return (
        recognitionReport.bestMatch?.patternName?.toUpperCase() ||
        recognitionReport.bestMatch?.constellationId?.toUpperCase() ||
        'ORION, CYGNUS, CASSIOPEIA'
      );
    }
    if (recognitionReport.status === 'VALID_PREFIX') {
      const labels = recognitionReport.prefixMatch.reachableAcceptingLabels;
      return labels.length > 0 ? labels.slice(0, 4).join(', ').toUpperCase() : 'SEARCHING PREFIX TREE...';
    }
    if (recognitionReport.status === 'GEOMETRIC_REJECT') {
      return 'GEOMETRIC REJECT (RESIDUAL > 0.32)';
    }
    if (recognitionReport.status === 'SYMBOLIC_REJECT') {
      return 'SYMBOLIC REJECT (NO ACCEPTING DFA STATE)';
    }
    return 'ANALYZING PATH...';
  }, [recognitionReport]);

  if (!isTraceMode) return null;

  return (
    <>
      {/* Frame 7 Hardware Reticle Workspace Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3.5 sm:p-4 font-mono text-xs select-none">
        {/* Top Region: Header and Metric Stats Band (Frame 7) */}
        <div className="pointer-events-auto space-y-2.5">
          {/* Main Title & Exit Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-sm sm:text-base font-bold text-[var(--ink-primary)] uppercase tracking-[0.10em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt)]" />
                TRACE-TO-RECOGNIZE
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[4px] text-[10px] text-[var(--ink-secondary)] tracking-wider">
                HARDWARE RETICLE OVERLAY
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTraceMode(false)}
                className="px-2.5 py-1 bg-[var(--bg-card)] hover:bg-[var(--bg-tray)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[#D0D5DD] rounded-[6px] text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Exit Trace Mode"
              >
                <span>✕</span>
                <span>EXIT TRACE</span>
              </button>
            </div>
          </div>

          {/* Top 4 Metric Bento Cards matching Frame 7 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* 1. Selected Stars */}
            <div className="hud-reticle-4corner bg-[var(--bg-card)]/95 backdrop-blur-sm border border-[#D0D5DD] rounded-[10px] p-3 space-y-1">
              <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em]">
                SELECTED STARS
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-dot text-2xl font-bold text-[var(--signal-cobalt)]">
                  {pointCount}
                </span>
                <span className="text-[11px] font-mono text-[var(--ink-secondary)] uppercase">
                  / 88
                </span>
              </div>
            </div>

            {/* 2. Symbol Sequence Length */}
            <div className="hud-reticle-4corner bg-[var(--bg-card)]/95 backdrop-blur-sm border border-[#D0D5DD] rounded-[10px] p-3 space-y-1">
              <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em]">
                SYMBOL SEQUENCE LENGTH
              </div>
              <div className="font-dot text-2xl font-bold text-[var(--signal-cobalt)]">
                {symbolCount}
              </div>
            </div>

            {/* 3. Active Candidates */}
            <div className="hud-reticle-4corner bg-[var(--bg-card)]/95 backdrop-blur-sm border border-[#D0D5DD] rounded-[10px] p-3 space-y-1 overflow-hidden">
              <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em]">
                ACTIVE CANDIDATES
              </div>
              <div
                className="font-mono text-xs font-bold text-[var(--ink-primary)] truncate uppercase"
                title={activeCandidatesDisplay}
              >
                {activeCandidatesDisplay}
              </div>
            </div>

            {/* 4. Trace Session & Live Elapsed Timer */}
            <div className="hud-reticle-4corner bg-[var(--bg-card)]/95 backdrop-blur-sm border border-[#D0D5DD] rounded-[10px] p-3 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em]">
                  TRACE SESSION
                </div>
                <div className="font-dot text-sm font-bold text-[var(--signal-cobalt)] uppercase">
                  {pointCount > 0 ? 'TRACING' : 'STANDBY'}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em]">
                  ELAPSED
                </div>
                <div className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                  {elapsedDisplay}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Region: Center Sky Reticle & Right Candidate Matches Panel (Frame 7) */}
        <div className="flex-1 flex gap-3 min-h-0 my-3 pointer-events-none items-stretch">
          {/* Central Sky Reticle Viewport Overlay: Click pass-through to SkyCanvas */}
          <div className="flex-1 relative pointer-events-none flex flex-col justify-between p-2">
            {/* Top Corners of Sky Reticle */}
            <div className="flex items-center justify-between pointer-events-auto">
              <div
                className="w-7 h-7 rounded-[6px] bg-[#060A14]/70 border border-[#2B354C] flex items-center justify-center text-gray-300 text-xs cursor-default backdrop-blur-xs"
                title="Sky Reticle Active Viewport"
              >
                ⛶
              </div>
              <div className="flex items-center gap-1 bg-[#060A14]/70 border border-[#2B354C] rounded-[6px] p-0.5 backdrop-blur-xs">
                <button
                  onClick={() => {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }));
                    }
                  }}
                  className="w-6 h-6 flex items-center justify-center text-gray-200 hover:text-white rounded-[4px] hover:bg-[#1E293B] cursor-pointer text-xs font-bold"
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }));
                    }
                  }}
                  className="w-6 h-6 flex items-center justify-center text-gray-200 hover:text-white rounded-[4px] hover:bg-[#1E293B] cursor-pointer text-xs font-bold"
                  title="Zoom Out"
                >
                  −
                </button>
              </div>
            </div>

            {/* Bottom Status Ticker within Sky Reticle */}
            {pointCount > 0 && (
              <div className="pointer-events-auto self-start bg-[#060A14]/80 backdrop-blur-xs border border-[#2B354C] rounded-[6px] px-2.5 py-1 text-[10px] text-gray-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-cobalt)] animate-pulse" />
                <span>
                  {pointCount} {pointCount === 1 ? 'STAR' : 'STARS'} CONNECTED
                </span>
                {tracedStarIds.length > 0 && (
                  <span className="text-gray-400 border-l border-gray-700 pl-2">
                    LAST: {STAR_BY_ID.get(tracedStarIds[tracedStarIds.length - 1])?.name || `ID ${tracedStarIds[tracedStarIds.length - 1]}`}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Candidate Matches Panel matching Frame 7 */}
          <div className="w-[340px] lg:w-[380px] pointer-events-auto bg-[var(--bg-card)]/95 backdrop-blur-md border border-[#D0D5DD] rounded-[12px] p-3.5 flex flex-col max-h-full overflow-hidden shadow-none space-y-3">
            {/* Header: Candidate Matches + Updating 4-Dot LED */}
            <div className="flex items-center justify-between border-b border-[#E2E5EC] pb-2.5">
              <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-[0.08em]">
                CANDIDATE MATCHES
              </h3>
              <div className="flex items-center gap-1.5 text-[9px] text-[var(--ink-muted)] font-mono">
                <span>UPDATING</span>
                <div className="flex items-center gap-1" title="Matcher Telemetry Activity">
                  {[0, 1, 2, 3].map(i => {
                    const isLit = i < (pointCount >= 4 ? 4 : pointCount >= 2 ? 3 : pointCount >= 1 ? 2 : 1);
                    return (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          isLit ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Candidate Cards List matching Frame 7 */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {displayedCandidates.length > 0 ? (
                displayedCandidates.map((cand, idx) => {
                  const isSelected = cand.isBestMatch || idx === 0;
                  const scoreVal = parseFloat(cand.fitScorePercent) || 0;
                  // 5-Segment Pill Barcode
                  const activeSegments = Math.max(1, Math.min(5, Math.ceil((scoreVal / 100) * 5)));

                  return (
                    <div
                      key={cand.id + idx}
                      className={`p-2.5 rounded-[10px] border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[var(--signal-cobalt)] bg-[#EDF2FE]'
                          : 'border-[#D0D5DD] bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)]'
                      }`}
                      onClick={() => setShowRecognitionResultsModal(true)}
                    >
                      {/* Left: Asterism Topology Thumbnail */}
                      <AsterismThumbnail points={cand.points} size={48} />

                      {/* Middle: Name, Score & Segmented Bar */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wide truncate">
                          {cand.name}
                        </div>
                        <div className="text-[10px] text-[var(--ink-secondary)] flex items-center justify-between">
                          <span className="uppercase text-[9px] tracking-wider text-[var(--ink-muted)]">FIT SCORE</span>
                          <span className="font-mono font-bold text-[var(--ink-primary)]">
                            {cand.fitScorePercent === 'PREFIX' ? 'PREFIX' : `${cand.fitScorePercent}%`}
                          </span>
                        </div>

                        {/* 5-Segment Indicator Bar */}
                        <div className="flex items-center gap-1 pt-0.5">
                          {Array.from({ length: 5 }).map((_, segIdx) => (
                            <span
                              key={segIdx}
                              className={`flex-1 h-1 rounded-[1px] transition-colors ${
                                segIdx < activeSegments ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Right: Right Arrow */}
                      <span className="text-[var(--ink-muted)] text-sm font-bold pl-1">
                        ›
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px] text-[var(--ink-muted)] text-[10px] uppercase tracking-[0.08em] leading-relaxed text-center space-y-2">
                  <div className="text-xl">✨</div>
                  <p>CLICK STARS IN SEQUENCE ON THE SKY CANVAS TO INITIATE ASTERISM PATTERN RECOGNITION.</p>
                </div>
              )}
            </div>

            {/* Show All Candidates Action Button */}
            {candidatesList.length > 3 && (
              <button
                onClick={() => setShowAllCandidates(!showAllCandidates)}
                className="w-full py-1.5 bg-[var(--bg-tray)] hover:bg-[#D8DCE5] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-colors border border-[#D0D5DD] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{showAllCandidates ? 'SHOW TOP 3 CANDIDATES' : `SHOW ALL CANDIDATES (${candidatesList.length})`}</span>
                <span>→</span>
              </button>
            )}

            {/* Recognition Status Summary Card */}
            {recognitionReport && (
              <div
                className={`p-2.5 rounded-[8px] border text-[10px] space-y-1 ${
                  recognitionReport.status === 'FULL_MATCH'
                    ? 'bg-[#EBF3FF] border-[var(--signal-surface)] text-[var(--signal-cobalt)]'
                    : recognitionReport.status === 'VALID_PREFIX'
                      ? 'bg-[var(--bg-tray)] border-[#D8DCE5] text-[var(--ink-secondary)]'
                      : recognitionReport.status === 'GEOMETRIC_REJECT'
                        ? 'bg-[#FEF3C7] border-[#FCD34D] text-[#92400E]'
                        : 'bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                }`}
              >
                <div className="font-bold uppercase tracking-wider flex items-center justify-between">
                  <span>{recognitionReport.status}</span>
                  <span className="text-[9px]">DFA: {recognitionReport.dfaAccepted ? 'YES' : 'NO'}</span>
                </div>
                <p className="text-[9px] leading-tight uppercase tracking-wide truncate">
                  {recognitionReport.explanation}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Region: Hardware Control Action Bar (Frame 7) */}
        <div className="pointer-events-auto bg-[var(--bg-card)]/95 backdrop-blur-md border border-[#D0D5DD] rounded-[12px] p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-none">
          {/* Left Primary Action Group matching Frame 7 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Undo (Z) */}
            <button
              onClick={undoLastTracePoint}
              disabled={pointCount === 0}
              className="px-3.5 py-2 bg-[var(--bg-tray)] hover:bg-[#D8DCE5] disabled:opacity-40 text-[var(--ink-primary)] rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-colors border border-[#D0D5DD] cursor-pointer flex items-center gap-1.5"
              title="Undo Last Star (Shortcut: Z)"
            >
              <span>↩</span>
              <span>UNDO (Z)</span>
            </button>

            {/* 2. Clear Path */}
            <button
              onClick={clearTrace}
              disabled={pointCount === 0}
              className="px-3.5 py-2 bg-[var(--bg-tray)] hover:bg-[#D8DCE5] disabled:opacity-40 text-[var(--ink-primary)] rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-colors border border-[#D0D5DD] cursor-pointer flex items-center gap-1.5"
              title="Clear Current Traced Path"
            >
              <span>🗑</span>
              <span>CLEAR PATH</span>
            </button>

            {/* 3. Show Hints */}
            <button
              onClick={() => setShowTraceHints(!showTraceHints)}
              className={`px-3.5 py-2 rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-colors border cursor-pointer flex items-center gap-1.5 ${
                showTraceHints
                  ? 'bg-[var(--signal-cobalt)] text-white border-[var(--signal-mid)]'
                  : 'bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] border-[#D8DCE5] hover:text-[var(--ink-primary)]'
              }`}
              title="Toggle Constellation Guide Hint Lines"
            >
              <span>💡</span>
              <span>{showTraceHints ? 'HINTS: ON' : 'SHOW HINTS'}</span>
            </button>

            {/* 4. Complete Trace */}
            <button
              onClick={() => setShowRecognitionResultsModal(true)}
              disabled={!recognitionReport}
              className="px-4 py-2 bg-[var(--signal-cobalt)] hover:bg-[#1644C5] disabled:opacity-40 text-white rounded-[6px] text-[10px] font-mono font-bold uppercase tracking-[0.08em] transition-colors border border-[#1644C5] cursor-pointer shadow-none flex items-center gap-1.5"
              title="Open Constellation Recognition Result Report"
            >
              <span>✓</span>
              <span>COMPLETE TRACE</span>
            </button>
          </div>

          {/* Right Auxiliary Tools Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Geometry Analysis Button */}
            <button
              onClick={() => setShowPatternAnalysisModal(true)}
              disabled={pointCount < 2}
              className="px-3 py-2 bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] disabled:opacity-40 text-[var(--ink-primary)] rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-[0.08em] transition-colors border border-[#D0D5DD] cursor-pointer flex items-center gap-1.5"
              title="Inspect Normalized Geometry & Turn Angle Distributions"
            >
              <span>📐</span>
              <span>GEOMETRY</span>
            </button>

            {/* Presets & Demonstrations Dropdown */}
            <select
              onChange={e => handlePresetSelect(e.target.value)}
              defaultValue=""
              className="bg-[var(--bg-tray)] border border-[#D0D5DD] rounded-[6px] px-2.5 py-1.5 text-[10px] font-mono text-[var(--ink-primary)] cursor-pointer uppercase tracking-wider max-w-[200px]"
              title="Load Curated Constellation Preset or Academic Demo"
            >
              <option value="" disabled>-- PRESETS / DEMOS --</option>
              <optgroup label="Real Constellation References">
                {REFERENCE_PATTERNS.filter(p => p.traversalVariant === 'forward').map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name.toUpperCase()} ({p.orderedStarIds.length} STARS)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Academic Demonstrations">
                <option value="DEMO_SYMBOLIC_REJECT">DEMO: SYMBOLIC REJECT</option>
                <option value="DEMO_GEOMETRIC_REJECT">DEMO: GEOMETRIC REJECT</option>
                <option value="DEMO_INVARIANCE">DEMO: INVARIANCE (ROT 137°)</option>
              </optgroup>
            </select>

            {/* Automata Lab Drilldown */}
            {recognitionReport && (
              <button
                onClick={handleOpenAutomataLab}
                className="px-3 py-2 bg-[var(--signal-cobalt)] hover:bg-[#1644C5] text-white rounded-[6px] font-mono font-bold text-[10px] uppercase tracking-[0.08em] flex items-center gap-1.5 transition-colors border border-[#1644C5] cursor-pointer shadow-none"
                title="Send Input Symbols directly to Automata Simulator"
              >
                <span>⚡</span>
                <span>INSPECT DFA</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recognition Results Modal (Frame 8) */}
      {showRecognitionResultsModal && (
        <RecognitionResultsModal onClose={() => setShowRecognitionResultsModal(false)} />
      )}

      {/* Pattern Geometry Analysis Modal (Frame 9) */}
      {showPatternAnalysisModal && (
        <PatternAnalysisModal onClose={() => setShowPatternAnalysisModal(false)} />
      )}
    </>
  );
};
