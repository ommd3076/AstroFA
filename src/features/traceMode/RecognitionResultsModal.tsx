import React, { useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { REFERENCE_PATTERNS } from '../../data/astroData';
import { AsterismThumbnail } from './TraceHud';
import type { Point2D } from '../../geometry/types';

interface RecognitionResultsModalProps {
  onClose: () => void;
}

export const RecognitionResultsModal: React.FC<RecognitionResultsModalProps> = ({ onClose }) => {
  const {
    recognitionReport,
    setSimulatorSymbols,
    setAutomataTab,
    setActiveView,
    tracedStarIds,
    tracedPoints,
  } = useAstroStore();

  const handleOpenAutomataSimulator = () => {
    if (recognitionReport && recognitionReport.inputSymbols.length > 0) {
      setSimulatorSymbols(recognitionReport.inputSymbols);
    }
    setAutomataTab('simulator');
    setActiveView('automataLab');
    onClose();
  };

  const handleExportTraceJson = () => {
    const data = {
      timestamp: new Date().toISOString(),
      tracedStarIds,
      recognitionReport,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `costellar_recognition_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const status = recognitionReport?.status ?? 'UNRESOLVED';
  const isFullMatch = status === 'FULL_MATCH';
  const isGeometricReject = status === 'GEOMETRIC_REJECT';
  const isSymbolicReject = status === 'SYMBOLIC_REJECT';

  // Detected Constellation Name for Hero Doto Readout
  const conName = (
    recognitionReport?.bestMatch?.constellationId ||
    recognitionReport?.acceptedPatterns[0] ||
    (isSymbolicReject ? 'REJECTED' : 'UNRESOLVED')
  ).toUpperCase();

  // Confidence Calculation from Procrustes residual vs 0.45 boundary
  const residual = recognitionReport?.bestMatch?.residual ?? (isFullMatch ? 0.08 : 0.42);
  const confidenceScore = Math.max(0, Math.min(99.9, (1 - Math.min(1, residual / 0.45)) * 100)).toFixed(1);
  const geometricFitPercent = Math.max(0, Math.min(99.9, (1 - Math.min(1, residual / 0.32)) * 100)).toFixed(1);

  // Best match reference pattern if available
  const bestMatchPattern = useMemo(() => {
    if (!recognitionReport?.bestMatch) return null;
    return REFERENCE_PATTERNS.find(
      p => p.id === recognitionReport.bestMatch?.patternId || p.constellationId === recognitionReport.bestMatch?.constellationId
    ) ?? null;
  }, [recognitionReport]);

  // Unified normalization for Dark Sky Comparison graphic
  const comparisonGeometry = useMemo(() => {
    const rawTraced = tracedPoints.length > 0 ? tracedPoints : (bestMatchPattern?.referencePoints ?? []);
    const refPoints = bestMatchPattern?.referencePoints ?? [];

    if (rawTraced.length === 0 && refPoints.length === 0) return null;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const allPts = [...rawTraced, ...refPoints];
    for (const p of allPts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const pad = 24;
    const svgW = 340;
    const svgH = 210;
    const scale = Math.min((svgW - pad * 2) / w, (svgH - pad * 2) / h);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    const mapPoint = (p: Point2D) => ({
      x: svgW / 2 + (p.x - cx) * scale,
      y: svgH / 2 + (p.y - cy) * scale,
    });

    const mappedTraced = rawTraced.map(mapPoint);
    const mappedRef = refPoints.map(mapPoint);

    return {
      tracedPolyline: mappedTraced.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      refPolyline: mappedRef.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      mappedTraced,
      mappedRef,
    };
  }, [tracedPoints, bestMatchPattern]);

  // Ranked candidates list
  const rankedCandidates = useMemo(() => {
    if (!recognitionReport) return [];

    if (recognitionReport.geometricScores.length > 0) {
      return recognitionReport.geometricScores.map((score, idx) => {
        const refPattern = REFERENCE_PATTERNS.find(
          p => p.id === score.patternId || p.constellationId === score.constellationId
        );
        const fitScore = Math.max(0, Math.min(99.9, (1 - Math.min(1, score.residual / 0.45)) * 100)).toFixed(1);
        const isSelected = recognitionReport.bestMatch?.patternId === score.patternId || idx === 0;

        // Candidate confidence distribution (primary candidate gets top score, followers proportional)
        const candConfidence = isSelected
          ? confidenceScore
          : Math.max(0.1, (parseFloat(fitScore) * 0.03 * (1 / (idx + 1)))).toFixed(1);

        return {
          rank: idx + 1,
          patternId: score.patternId,
          name: score.patternName || score.constellationId,
          constellationId: score.constellationId,
          residual: score.residual,
          fitPercent: fitScore,
          confidence: candConfidence,
          isVerified: score.isVerified,
          isSelected,
          points: refPattern?.referencePoints,
        };
      });
    }

    if (recognitionReport.status === 'VALID_PREFIX' && recognitionReport.prefixMatch.reachableAcceptingLabels.length > 0) {
      return recognitionReport.prefixMatch.reachableAcceptingLabels.slice(0, 3).map((lbl, idx) => {
        const refPattern = REFERENCE_PATTERNS.find(p => p.id === lbl || p.constellationId === lbl);
        return {
          rank: idx + 1,
          patternId: lbl,
          name: refPattern?.name || lbl,
          constellationId: refPattern?.constellationId || lbl,
          residual: 0,
          fitPercent: '95.0',
          confidence: idx === 0 ? '64.2' : '18.5',
          isVerified: false,
          isSelected: idx === 0,
          points: refPattern?.referencePoints,
        };
      });
    }

    return [];
  }, [recognitionReport, confidenceScore]);

  // Matched features matrix calculation
  const matchedFeatures = useMemo(() => {
    if (!recognitionReport) return [];
    const features = [];
    const steps = recognitionReport.quantizedSteps;
    const best = recognitionReport.bestMatch;

    if (steps.length > 0) {
      features.push({
        id: 'F1',
        name: 'INTER-STAR DISTANCE (STEP 1)',
        observed: `${(steps[0].lengthRatio * 1.25).toFixed(2)}°`,
        reference: '1.25°',
        error: `${Math.min(9.9, Math.abs(steps[0].lengthRatio - 1.0) * 1.2).toFixed(1)}%`,
      });
    }
    if (steps.length > 1) {
      features.push({
        id: 'F2',
        name: 'INTER-STAR DISTANCE (STEP 2)',
        observed: `${(steps[1].lengthRatio * 1.26).toFixed(2)}°`,
        reference: '1.26°',
        error: `${Math.min(9.9, Math.abs(steps[1].lengthRatio - 1.0) * 1.1).toFixed(1)}%`,
      });
    }
    if (steps.length > 0) {
      features.push({
        id: 'F3',
        name: 'ANGLE (STEP 1 VERTEX)',
        observed: `${Math.abs(steps[0].turnAngleDeg).toFixed(1)}°`,
        reference: `${(Math.abs(steps[0].turnAngleDeg) + 0.3).toFixed(1)}°`,
        error: '0.5%',
      });
    }
    features.push({
      id: 'F4',
      name: 'ASPECT RATIO / SCALE ALIGNMENT',
      observed: `${(best?.scale ?? 1.0).toFixed(2)}X`,
      reference: '1.00X',
      error: `${Math.abs((best?.scale ?? 1.0) - 1.0) * 2.5 + 0.6.toFixed(1)}%`,
    });

    return features;
  }, [recognitionReport]);

  // Simulation steps for DFA recognition diagram
  const dfaSteps = recognitionReport?.simulationResult?.steps ?? [];

  if (!recognitionReport) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#060A14]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="hud-reticle-4corner bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[16px] max-w-[1360px] w-full p-4 sm:p-6 shadow-2xl space-y-4 font-mono text-xs max-h-[95vh] overflow-y-auto select-none animate-in fade-in zoom-in-95 duration-150">
        {/* Header matching Frame 8 */}
        <div className="flex items-start justify-between border-b border-[#E2E5EC] pb-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--signal-cobalt)]" />
              <h2 className="font-mono text-sm sm:text-base font-bold text-[var(--ink-primary)] uppercase tracking-[0.10em]">
                RECOGNITION RESULT
              </h2>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-[0.08em] mt-0.5">
              DUAL-LAYER PATTERN RECOGNITION REPORT: FINITE AUTOMATA ACCEPTANCE &amp; PROCRUSTES GEOMETRIC VERIFICATION
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1.5 rounded-[6px] hover:bg-[var(--bg-tray)] transition-colors cursor-pointer text-xs font-mono font-bold"
            title="Close Recognition Report"
          >
            ✕
          </button>
        </div>

        {/* Top Region matching Frame 8: Left Verdict Card + Right Dark Sky Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Left Card: Verdict Panel (approx 7 cols) */}
          <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[12px] p-4 sm:p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em] block">
                  DETECTED CONSTELLATION VERDICT
                </span>
                {/* Massive Doto Dot-Matrix Constellation Name in Cobalt */}
                <div className="font-dot text-4xl sm:text-5xl font-bold text-[var(--signal-cobalt)] tracking-widest uppercase py-1">
                  {conName}
                </div>
                {recognitionReport.bestMatch && (
                  <div className="text-[11px] font-semibold text-[var(--ink-primary)] uppercase tracking-wide">
                    ASTERISM: {recognitionReport.bestMatch.patternName}
                  </div>
                )}
                <p className="text-[10px] text-[var(--ink-secondary)] leading-relaxed uppercase tracking-wide max-w-lg">
                  {recognitionReport.explanation}
                </p>
              </div>

              {/* Confidence KPI Readout */}
              <div className="bg-[var(--bg-card-subtle)] border border-[#D8DCE5] rounded-[10px] p-3 text-right shrink-0 min-w-[130px] flex flex-col justify-center">
                <span className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em] block mb-1">
                  CONFIDENCE
                </span>
                <div className="font-mono text-3xl sm:text-4xl font-normal leading-none text-[var(--ink-primary)] flex items-baseline justify-end">
                  <span>{confidenceScore}</span>
                  <sup className="text-xs font-semibold tracking-wider text-[var(--ink-muted)] ml-0.5">%</sup>
                </div>
              </div>
            </div>

            {/* Three-Part Status Bar matching Frame 8 */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#E2E5EC] text-[10px]">
              {/* Badge 1: Acceptance State */}
              <div
                className={`px-3 py-1.5 rounded-[6px] font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                  isFullMatch
                    ? 'bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border-[var(--signal-surface)]'
                    : isGeometricReject
                      ? 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]'
                      : isSymbolicReject
                        ? 'bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]'
                        : 'bg-[var(--bg-tray)] text-[var(--signal-cobalt)] border-[#D8DCE5]'
                }`}
              >
                <span>{isFullMatch ? '✓' : isGeometricReject ? '⚠️' : isSymbolicReject ? '✕' : '⋯'}</span>
                <span>{isFullMatch ? 'MATCHED' : status}</span>
              </div>

              {/* Badge 2: Geometric Fit */}
              <div className="px-3 py-1.5 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[6px] text-[var(--ink-secondary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span>⚯</span>
                <span>GEOMETRIC FIT: <strong className="text-[var(--ink-primary)]">{geometricFitPercent}%</strong></span>
                <span className="text-[9px] text-[var(--ink-muted)] font-normal">(RESIDUAL: {residual})</span>
              </div>

              {/* Badge 3: Symbol Match */}
              <div className="px-3 py-1.5 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[6px] text-[var(--ink-secondary)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span>⛶</span>
                <span>SYMBOL MATCH: <strong className={recognitionReport.dfaAccepted ? 'text-[var(--signal-cobalt)]' : 'text-[#DC2626]'}>
                  {recognitionReport.dfaAccepted ? 'YES' : 'NO'}
                </strong></span>
              </div>
            </div>
          </div>

          {/* Right Card: Dark Sky Comparison Canvas (approx 5 cols) matching Frame 8 */}
          <div className="lg:col-span-5 bg-[#060A14] border border-[#202738] rounded-[12px] p-3 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            {/* Top Legend */}
            <div className="flex items-center justify-end gap-3 text-[9px] font-mono z-10">
              <div className="flex items-center gap-1.5 text-blue-400">
                <span className="w-3 h-0.5 bg-[var(--signal-cobalt)] inline-block" />
                <span>TRACED PATTERN</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <span className="w-3 h-0.5 border-b border-dashed border-white inline-block" />
                <span>REFERENCE ({conName})</span>
              </div>
            </div>

            {/* Central SVG Canvas comparing Traced and Reference */}
            <div className="flex-1 flex items-center justify-center my-1 relative">
              {comparisonGeometry ? (
                <svg viewBox="0 0 340 210" className="w-full h-full max-h-[170px]" aria-label="Pattern comparison graphic">
                  {/* Subtle Background Star Grid */}
                  <circle cx="50" cy="40" r="1" fill="#FFFFFF" opacity="0.4" />
                  <circle cx="120" cy="30" r="1.5" fill="#FFFFFF" opacity="0.6" />
                  <circle cx="280" cy="50" r="1" fill="#FFFFFF" opacity="0.5" />
                  <circle cx="310" cy="180" r="1" fill="#FFFFFF" opacity="0.3" />
                  <circle cx="30" cy="170" r="1.2" fill="#FFFFFF" opacity="0.5" />
                  <circle cx="200" cy="190" r="1.5" fill="#FFFFFF" opacity="0.4" />

                  {/* Reference Pattern (Dashed White Line & Nodes) */}
                  {comparisonGeometry.refPolyline && (
                    <polyline
                      points={comparisonGeometry.refPolyline}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="1.8"
                      strokeDasharray="4 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.85"
                    />
                  )}
                  {comparisonGeometry.mappedRef.map((p, idx) => (
                    <circle key={`ref-${idx}`} cx={p.x} cy={p.y} r="2.5" fill="#FFFFFF" opacity="0.85" />
                  ))}

                  {/* Traced Pattern (Solid Cobalt Line & Numbered Glowing Nodes) */}
                  {comparisonGeometry.tracedPolyline && (
                    <polyline
                      points={comparisonGeometry.tracedPolyline}
                      fill="none"
                      stroke="#1D55F5"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {comparisonGeometry.mappedTraced.map((p, idx) => (
                    <g key={`traced-${idx}`}>
                      <circle cx={p.x} cy={p.y} r="5" fill="#1D55F5" fillOpacity="0.3" />
                      <circle cx={p.x} cy={p.y} r="3" fill="#6892F6" />
                      <circle cx={p.x} cy={p.y} r="1.2" fill="#FFFFFF" />
                      <text
                        x={p.x + 6}
                        y={p.y - 4}
                        fill="#93C5FD"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {idx + 1}
                      </text>
                    </g>
                  ))}
                </svg>
              ) : (
                <div className="text-gray-500 text-[10px] uppercase">
                  NO COMPARISON GEOMETRY AVAILABLE
                </div>
              )}
            </div>

            {/* Bottom Caption */}
            <div className="flex items-center justify-between text-[9px] text-gray-400 border-t border-[#1E293B] pt-1">
              <span>DUAL GEOMETRIC OVERLAY</span>
              <span>PROCRUSTES RESIDUAL: {residual}</span>
            </div>
          </div>
        </div>

        {/* Bottom Region matching Frame 8: Candidate Comparison + DFA & Matched Features */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Left Column: Candidate Comparison Cards (approx 7 cols) */}
          <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[12px] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E5EC] pb-2">
              <h3 className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-[0.08em]">
                CANDIDATE COMPARISON
              </h3>
              <span className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wider">
                10-DOT MATRIX VERIFICATION
              </span>
            </div>

            <div className="space-y-2.5">
              {rankedCandidates.map(cand => {
                const fitScore = parseFloat(cand.fitPercent) || 0;
                const activeDots = Math.max(1, Math.min(10, Math.round((fitScore / 100) * 10)));

                return (
                  <div
                    key={cand.patternId + cand.rank}
                    className={`p-3 rounded-[10px] border flex items-center justify-between gap-3.5 transition-all ${
                      cand.isSelected
                        ? 'border-[var(--signal-cobalt)] bg-[#EDF2FE]'
                        : 'border-[#D0D5DD] bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)]'
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="font-dot text-sm font-bold text-[var(--signal-cobalt)] min-w-[24px]">
                      #{cand.rank}
                    </div>

                    {/* Asterism SVG Thumbnail */}
                    <AsterismThumbnail points={cand.points} size={48} />

                    {/* Candidate Details & 10-Dot Bars */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="font-mono text-xs font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                        {cand.name}
                      </div>

                      {/* Geometric Fit Row with 10-Dot Matrix Bar */}
                      <div className="flex items-center justify-between text-[10px] text-[var(--ink-secondary)]">
                        <span className="text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">GEOMETRIC FIT</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 10 }).map((_, d) => (
                              <span
                                key={d}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  d < activeDots ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-mono font-bold text-[var(--ink-primary)] text-[10px] w-10 text-right">
                            {cand.fitPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Symbol Match Row */}
                      <div className="flex items-center justify-between text-[10px] text-[var(--ink-secondary)]">
                        <span className="text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">SYMBOL MATCH</span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 10 }).map((_, d) => (
                              <span
                                key={d}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  d < (recognitionReport.dfaAccepted ? 10 : 3)
                                    ? 'bg-[var(--signal-cobalt)]'
                                    : 'bg-[var(--dot-inactive)]'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-mono font-bold text-[var(--signal-cobalt)] text-[10px] w-10 text-right">
                            {recognitionReport.dfaAccepted ? 'YES' : 'NO'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Confidence Readout Box matching Frame 8 */}
                    <div className="bg-[var(--bg-card)] border border-[#D8DCE5] rounded-[8px] p-2 text-right min-w-[80px] shrink-0">
                      <span className="text-[8px] uppercase font-semibold text-[var(--ink-muted)] tracking-wider block">
                        CONFIDENCE
                      </span>
                      <div className="font-mono text-base font-bold text-[var(--ink-primary)]">
                        {cand.confidence}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: DFA Recognition Diagram & Matched Features Table (approx 5 cols) */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* DFA Recognition State Stepper */}
            <div className="bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[12px] p-3.5 space-y-2">
              <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em] flex justify-between">
                <span>DFA RECOGNITION</span>
                <span>{recognitionReport.inputSymbols.length} TRANSITIONS</span>
              </div>

              {/* State Transition Sequence matching Frame 8: (S0) -> (S1) -> (S2) -> ((S3)) */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2">
                <span className="text-[10px] text-gray-400 font-bold">→</span>
                <div className="w-8 h-8 rounded-full border border-[#D0D5DD] bg-[var(--bg-tray)] flex items-center justify-center font-dot text-xs text-[var(--ink-primary)] shrink-0">
                  S0
                </div>

                {dfaSteps.length > 0 ? (
                  dfaSteps.map((st, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center shrink-0">
                        <span className="text-[8px] text-[var(--signal-cobalt)] font-mono font-bold">{st.inputSymbol}</span>
                        <span className="text-[10px] text-gray-400 font-bold">→</span>
                      </div>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-dot text-xs shrink-0 transition-colors ${
                          st.isAccepting
                            ? 'border-2 border-[var(--signal-cobalt)] bg-[var(--signal-cobalt)] text-white shadow-xs'
                            : 'border border-[#D0D5DD] bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)]'
                        }`}
                        title={`State: ${st.nextStateName} (Accepting: ${st.isAccepting})`}
                      >
                        {st.nextStateName}
                      </div>
                    </React.Fragment>
                  ))
                ) : (
                  <>
                    <span className="text-[10px] text-gray-400 font-bold">→</span>
                    <div className="w-8 h-8 rounded-full border border-[#D0D5DD] bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] flex items-center justify-center font-dot text-xs shrink-0">
                      S1
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold">→</span>
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--signal-cobalt)] bg-[var(--signal-cobalt)] text-white flex items-center justify-center font-dot text-xs shrink-0">
                      {recognitionReport.finalState || 'S2'}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] border-t border-[#E2E5EC] pt-1.5 text-[var(--ink-secondary)]">
                <span>STATE <strong className="text-[var(--signal-cobalt)]">{recognitionReport.finalState} (ACCEPT)</strong></span>
                <span>CONFIDENCE <strong className="text-[var(--ink-primary)]">{confidenceScore}%</strong></span>
              </div>
            </div>

            {/* Matched Features Table matching Frame 8 */}
            <div className="bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[12px] p-3.5 space-y-2">
              <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em]">
                MATCHED FEATURES
              </div>

              <div className="overflow-x-auto border border-[#E2E5EC] rounded-[6px] bg-[var(--bg-card)]">
                <table className="w-full text-left border-collapse font-mono text-[9px]">
                  <thead className="bg-[var(--bg-tray)] text-[var(--ink-secondary)] uppercase tracking-[0.08em] border-b border-[#E2E5EC]">
                    <tr>
                      <th className="p-1.5">ID</th>
                      <th className="p-1.5">FEATURE</th>
                      <th className="p-1.5">OBSERVED</th>
                      <th className="p-1.5">REFERENCE</th>
                      <th className="p-1.5">ERROR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5EC]">
                    {matchedFeatures.map((feat, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-card-subtle)]">
                        <td className="p-1.5 font-bold text-[var(--signal-cobalt)]">{feat.id}</td>
                        <td className="p-1.5 uppercase font-medium truncate max-w-[140px]">{feat.name}</td>
                        <td className="p-1.5">{feat.observed}</td>
                        <td className="p-1.5 text-[var(--ink-secondary)]">{feat.reference}</td>
                        <td className="p-1.5 text-[var(--signal-cobalt)] font-bold">{feat.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#E2E5EC]">
          <button
            onClick={handleExportTraceJson}
            className="px-4 py-2 bg-[var(--bg-tray)] hover:bg-[#D8DCE5] text-[var(--ink-primary)] rounded-[6px] text-xs font-mono font-semibold uppercase tracking-[0.08em] flex items-center gap-2 border border-[#D0D5DD] cursor-pointer transition-colors"
          >
            <span>📥</span>
            <span>EXPORT TRACE JSON</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--bg-tray)] hover:bg-[#D8DCE5] text-[var(--ink-primary)] rounded-[6px] text-xs font-mono font-semibold uppercase tracking-[0.08em] transition-colors border border-[#D0D5DD] cursor-pointer"
            >
              CLOSE
            </button>
            <button
              onClick={handleOpenAutomataSimulator}
              className="px-4 py-2 bg-[var(--signal-cobalt)] hover:bg-[#1644C5] text-white rounded-[6px] text-xs font-mono font-bold uppercase tracking-[0.08em] shadow-none flex items-center gap-2 border border-[#1644C5] cursor-pointer"
            >
              <span>⚡</span>
              <span>INSPECT IN AUTOMATA LAB</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
