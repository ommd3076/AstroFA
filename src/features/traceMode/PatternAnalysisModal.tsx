import React from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { encodeGeometry, ANGLE_THRESHOLDS, RATIO_THRESHOLDS } from '../../geometry/quantize';
import { normalizeGeometry } from '../../geometry/normalize';
import { STAR_BY_ID } from '../../data/astroData';

interface PatternAnalysisModalProps {
  onClose: () => void;
}

export const PatternAnalysisModal: React.FC<PatternAnalysisModalProps> = ({ onClose }) => {
  const { tracedPoints, tracedStarIds, setSimulatorSymbols, setAutomataTab, setActiveView } = useAstroStore();

  const points = tracedPoints;
  const normalized = normalizeGeometry(points);
  const encoded = encodeGeometry(points);

  const handleOpenAutomataSimulator = () => {
    if (encoded.symbols.length > 0) {
      setSimulatorSymbols(encoded.symbols);
    }
    setAutomataTab('simulator');
    setActiveView('automataLab');
    onClose();
  };

  // Calculate 3x10 Quantized Dot-Matrix Distributions
  const totalSteps = encoded.steps.length;
  const leftCount = encoded.steps.filter(s => s.turnCategory.includes('L')).length;
  const straightCount = encoded.steps.filter(s => s.turnCategory === 'S').length;
  const rightCount = encoded.steps.filter(s => s.turnCategory.includes('R')).length;

  const leftDots = Math.min(10, Math.round((leftCount / Math.max(1, totalSteps)) * 10));
  const straightDots = Math.min(10, Math.round((straightCount / Math.max(1, totalSteps)) * 10));
  const rightDots = Math.min(10, Math.round((rightCount / Math.max(1, totalSteps)) * 10));

  const shortCount = encoded.steps.filter(s => s.distanceCategory === 'S').length;
  const mediumCount = encoded.steps.filter(s => s.distanceCategory === 'M').length;
  const longCount = encoded.steps.filter(s => s.distanceCategory === 'G').length;

  const shortDots = Math.min(10, Math.round((shortCount / Math.max(1, totalSteps)) * 10));
  const mediumDots = Math.min(10, Math.round((mediumCount / Math.max(1, totalSteps)) * 10));
  const longDots = Math.min(10, Math.round((longCount / Math.max(1, totalSteps)) * 10));

  return (
    <div className="fixed inset-0 z-50 bg-[#060A14]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="hud-reticle-4corner bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[12px] max-w-4xl w-full p-6 shadow-none space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-xs font-mono">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E2E5EC] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📐</span>
              <h3 className="font-mono text-sm font-bold text-[var(--ink-primary)] uppercase tracking-[0.08em]">
                GEOMETRIC PATTERN ANALYSIS &amp; FEATURE EXTRACTION
              </h3>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-[0.08em] mt-0.5">
              INVARIANT REDUCTION FROM CONTINUOUS 2D COORDINATES TO DISCRETE FINITE ALPHABET SYMBOLS &Sigma;*
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 rounded-[4px] hover:bg-[var(--bg-tray)] transition-colors cursor-pointer text-xs font-mono font-bold"
            title="Close Modal"
          >
            ✕
          </button>
        </div>

        {points.length >= 3 ? (
          <>
            {/* 1. Normalization Invariants */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[var(--bg-tray)] rounded-[8px] border border-[#D8DCE5] space-y-1">
                <span className="text-[9px] text-[var(--ink-muted)] uppercase font-semibold tracking-[0.08em] block">
                  1. CENTROID (TRANSLATION INVARIANT)
                </span>
                <span className="font-dot text-sm font-bold text-[var(--signal-cobalt)] block">
                  ({normalized.centroid.x.toFixed(2)}, {normalized.centroid.y.toFixed(2)})
                </span>
                <span className="text-[9px] text-[var(--ink-secondary)] uppercase tracking-wider block">
                  Subtracted from all coordinates
                </span>
              </div>

              <div className="p-3 bg-[var(--bg-tray)] rounded-[8px] border border-[#D8DCE5] space-y-1">
                <span className="text-[9px] text-[var(--ink-muted)] uppercase font-semibold tracking-[0.08em] block">
                  2. SCALE FACTOR (SCALE INVARIANT)
                </span>
                <span className="font-mono text-sm font-bold text-[var(--ink-primary)] flex items-baseline gap-1">
                  <span>{normalized.scale.toFixed(3)}</span>
                  <sup className="text-[9px] text-[var(--ink-muted)] uppercase">UNITS</sup>
                </span>
                <span className="text-[9px] text-[var(--ink-secondary)] uppercase tracking-wider block">
                  RMS distance normalized to 1.0
                </span>
              </div>

              <div className="p-3 bg-[var(--bg-tray)] rounded-[8px] border border-[#D8DCE5] space-y-1">
                <span className="text-[9px] text-[var(--ink-muted)] uppercase font-semibold tracking-[0.08em] block">
                  3. SEQUENCE LENGTH
                </span>
                <span className="font-mono text-sm font-bold text-[var(--signal-cobalt)] block">
                  {points.length} POINTS &rarr; {encoded.symbols.length} SYMBOLS
                </span>
                <span className="text-[9px] text-[var(--ink-secondary)] uppercase tracking-wider block">
                  Interior vertices evaluated
                </span>
              </div>
            </div>

            {/* 2. Quantized Feature Distributions (3x10 Dot-Matrix Columns) */}
            <div className="p-3 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px] space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--ink-secondary)] font-semibold border-b border-[#D8DCE5] pb-1.5">
                <span>QUANTIZED FEATURE DISTRIBUTIONS (3&times;10 DOT-MATRIX COLUMNS)</span>
                <span className="text-[var(--signal-cobalt)]">TOLERANCE: &plusmn;{ANGLE_THRESHOLDS.TOLERANCE_DEG}&deg; / &plusmn;{RATIO_THRESHOLDS.TOLERANCE_RATIO}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Turning Angle 3x10 Column */}
                <div className="space-y-1.5 bg-[var(--bg-card)] p-3 rounded-[6px] border border-[#D8DCE5]">
                  <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] font-semibold text-center">
                    TURNING ANGLE DISTRIBUTION (&theta;)
                  </div>
                  <div className="flex justify-center items-end gap-6 py-2">
                    {/* Left Column */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex flex-col-reverse gap-1">
                        {Array.from({ length: 10 }).map((_, r) => (
                          <span
                            key={r}
                            className={`w-2.5 h-2.5 rounded-full ${
                              r < leftDots ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-[var(--ink-secondary)] font-bold mt-1">LEFT</span>
                      <span className="text-[8px] text-[var(--ink-muted)]">({leftCount})</span>
                    </div>

                    {/* Straight Column */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex flex-col-reverse gap-1">
                        {Array.from({ length: 10 }).map((_, r) => (
                          <span
                            key={r}
                            className={`w-2.5 h-2.5 rounded-full ${
                              r < straightDots ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-[var(--ink-secondary)] font-bold mt-1">STR</span>
                      <span className="text-[8px] text-[var(--ink-muted)]">({straightCount})</span>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex flex-col-reverse gap-1">
                        {Array.from({ length: 10 }).map((_, r) => (
                          <span
                            key={r}
                            className={`w-2.5 h-2.5 rounded-full ${
                              r < rightDots ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-[var(--ink-secondary)] font-bold mt-1">RIGHT</span>
                      <span className="text-[8px] text-[var(--ink-muted)]">({rightCount})</span>
                    </div>
                  </div>
                </div>

                {/* Length Ratio 3x10 Column */}
                <div className="space-y-1.5 bg-[var(--bg-card)] p-3 rounded-[6px] border border-[#D8DCE5]">
                  <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] font-semibold text-center">
                    LENGTH RATIO DISTRIBUTION (r)
                  </div>
                  <div className="flex justify-center items-end gap-6 py-2">
                    {/* Short Column */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex flex-col-reverse gap-1">
                        {Array.from({ length: 10 }).map((_, r) => (
                          <span
                            key={r}
                            className={`w-2.5 h-2.5 rounded-full ${
                              r < shortDots ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-[var(--ink-secondary)] font-bold mt-1">SHORT</span>
                      <span className="text-[8px] text-[var(--ink-muted)]">({shortCount})</span>
                    </div>

                    {/* Medium Column */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex flex-col-reverse gap-1">
                        {Array.from({ length: 10 }).map((_, r) => (
                          <span
                            key={r}
                            className={`w-2.5 h-2.5 rounded-full ${
                              r < mediumDots ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-[var(--ink-secondary)] font-bold mt-1">MED</span>
                      <span className="text-[8px] text-[var(--ink-muted)]">({mediumCount})</span>
                    </div>

                    {/* Long Column */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex flex-col-reverse gap-1">
                        {Array.from({ length: 10 }).map((_, r) => (
                          <span
                            key={r}
                            className={`w-2.5 h-2.5 rounded-full ${
                              r < longDots ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] text-[var(--ink-secondary)] font-bold mt-1">LONG</span>
                      <span className="text-[8px] text-[var(--ink-muted)]">({longCount})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Recessed Matrix List for Feature Quantization */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-[var(--ink-primary)] uppercase tracking-[0.08em] text-[10px]">
                  STEP-BY-STEP FEATURE QUANTIZATION MATRIX
                </h4>
                <span className="text-[var(--ink-muted)] font-mono text-[10px] uppercase">
                  ANGLE &plusmn;{ANGLE_THRESHOLDS.TOLERANCE_DEG}&deg; | RATIO &plusmn;{RATIO_THRESHOLDS.TOLERANCE_RATIO}
                </span>
              </div>

              <div className="overflow-x-auto border border-[#D0D5DD] rounded-[8px] bg-[var(--bg-card)]">
                <table className="w-full text-left border-collapse font-mono">
                  <thead className="bg-[var(--bg-tray)] text-[var(--ink-secondary)] uppercase text-[9px] tracking-[0.08em] border-b border-[#D0D5DD]">
                    <tr>
                      <th className="p-2.5">STEP</th>
                      <th className="p-2.5">STAR / VERTEX</th>
                      <th className="p-2.5">TURN &theta;</th>
                      <th className="p-2.5">TURN CAT</th>
                      <th className="p-2.5">RATIO r</th>
                      <th className="p-2.5">DIST CAT</th>
                      <th className="p-2.5">PRIMARY SYMBOL</th>
                      <th className="p-2.5">TOLERANCE STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5EC] text-[10px] uppercase tracking-wide">
                    {encoded.steps.map((st, idx) => {
                      const sid = tracedStarIds[idx + 1];
                      const star = sid ? STAR_BY_ID.get(sid) : null;

                      return (
                        <tr key={idx} className="hover:bg-[var(--bg-card-subtle)] transition-colors">
                          <td className="p-2.5">
                            <span className="font-dot text-xs text-[var(--signal-cobalt)] font-bold">
                              {idx + 2}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-[var(--ink-primary)]">
                            {star?.proper || star?.name || `POINT ${idx + 2}`}
                          </td>
                          <td className="p-2.5">
                            <span className="font-dot text-xs text-[var(--ink-primary)]">
                              {st.turnAngleDeg > 0 ? `+${st.turnAngleDeg}°` : `${st.turnAngleDeg}°`}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-[var(--signal-cobalt)]">
                            {st.turnCategory}
                          </td>
                          <td className="p-2.5 text-[var(--ink-secondary)]">
                            {st.lengthRatio}X
                          </td>
                          <td className="p-2.5 font-bold text-[var(--ink-primary)]">
                            {st.distanceCategory}
                          </td>
                          <td className="p-2.5">
                            <span className="hud-reticle px-2 py-0.5 bg-[#181A20] border-l-2 border-l-[var(--signal-cobalt)] border-[#2E333D] rounded-[3px] text-[10px] font-mono text-[#6892F6] font-bold tracking-wider inline-flex">
                              {st.symbol}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {st.alternateSymbols && st.alternateSymbols.length > 0 ? (
                              <span className="hud-reticle px-1.5 py-0.5 bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D] rounded-[3px] text-[9px] font-mono uppercase font-bold inline-flex">
                                ALT: {st.alternateSymbols.join(', ')}
                              </span>
                            ) : (
                              <span className="text-[9px] text-[var(--ink-muted)]">
                                STABLE
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Encoded String Banner */}
            <div className="p-3 bg-[var(--bg-tray)] rounded-[8px] border border-[#D8DCE5] space-y-1.5">
              <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em]">
                GENERATED INPUT SEQUENCE FOR AUTOMATON (W &isin; &Sigma;*):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {encoded.symbols.map((sym, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#181A20] border-l-2 border-l-[var(--signal-cobalt)] border-[#2E333D] rounded-[4px] text-[#6892F6] font-mono font-bold text-xs inline-flex items-center"
                  >
                    {sym}
                  </span>
                ))}
              </div>
            </div>

            {/* 5. Action Buttons */}
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#E2E5EC]">
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
                <span>TRACE THIS STRING IN AUTOMATA LAB</span>
              </button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-[var(--ink-muted)] space-y-2 font-mono">
            <div className="text-3xl">📐</div>
            <p className="font-semibold text-[var(--ink-primary)] uppercase tracking-wider text-xs">
              NEED AT LEAST 3 POINTS TO COMPUTE TURNING ANGLES AND DISTANCE RATIOS.
            </p>
            <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wide">
              Click more stars on the sky or image to establish vertices for mathematical feature extraction.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};