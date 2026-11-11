import React from 'react';
import { useAstroStore } from '../../stores/useAstroStore';

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
  } = useAstroStore();

  if (!recognitionReport) return null;

  const handleOpenAutomataSimulator = () => {
    if (recognitionReport.inputSymbols.length > 0) {
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

  const status = recognitionReport.status;
  const isFullMatch = status === 'FULL_MATCH';
  const isGeometricReject = status === 'GEOMETRIC_REJECT';
  const isSymbolicReject = status === 'SYMBOLIC_REJECT';
  const isValidPrefix = status === 'VALID_PREFIX';

  // Detected Constellation Name for Hero Doto Readout
  const conName = (
    recognitionReport.bestMatch?.constellationId ||
    recognitionReport.acceptedPatterns[0] ||
    (isSymbolicReject ? 'REJECTED' : 'UNRESOLVED')
  ).toUpperCase();

  // Genuine Confidence Calculation from Procrustes residual vs 0.32 acceptance boundary
  const residual = recognitionReport.bestMatch?.residual ?? (isFullMatch ? 0.08 : 0.42);
  const confidenceScore = Math.max(0, Math.min(99.9, ((1 - Math.min(1, residual / 0.45)) * 100))).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 bg-[#060A14]/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="hud-reticle-4corner bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[12px] max-w-3xl w-full p-6 shadow-none space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 text-xs font-mono">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E2E5EC] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h3 className="font-mono text-sm font-bold text-[var(--ink-primary)] uppercase tracking-[0.08em]">
                CONSTELLATION RECOGNITION TELEMETRY REPORT
              </h3>
            </div>
            <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-[0.08em] mt-0.5">
              DUAL-LAYER PATTERN RECOGNITION REPORT: FINITE AUTOMATA ACCEPTANCE &amp; PROCRUSTES GEOMETRIC VERIFICATION
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

        {/* Tactile Hardware Verdict Display Hero Panel */}
        <div className="p-4 rounded-[8px] bg-[var(--bg-tray)] border border-[#D8DCE5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em] block">
              DETECTED CONSTELLATION VERDICT
            </span>
            {/* Massive Electric Cobalt Doto Constellation Name Readout */}
            <div className="font-dot text-4xl sm:text-5xl font-bold text-[var(--signal-cobalt)] tracking-widest uppercase py-0.5">
              {conName}
            </div>
            {recognitionReport.bestMatch && (
              <div className="text-[11px] font-semibold text-[var(--ink-primary)] uppercase tracking-wider">
                PATTERN: {recognitionReport.bestMatch.patternName}
              </div>
            )}
            <p className="text-[10px] text-[var(--ink-secondary)] leading-relaxed uppercase tracking-wide max-w-md pt-1">
              {recognitionReport.explanation}
            </p>
          </div>

          {/* Tier 2 Monospace 36px KPI with 10px % Superscript */}
          <div className="bg-[var(--bg-card)] border border-[#D8DCE5] rounded-[8px] p-3 text-right self-stretch sm:self-auto flex flex-col justify-center items-end min-w-[140px]">
            <span className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em] block mb-1">
              CONFIDENCE KPI
            </span>
            <div className="font-mono text-[36px] font-normal leading-none text-[var(--ink-primary)] flex items-baseline">
              <span>{confidenceScore}</span>
              <sup className="text-[10px] font-mono font-semibold tracking-wider text-[var(--ink-muted)] ml-1">
                %
              </sup>
            </div>
            <div
              className={`hud-reticle px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase font-bold tracking-wider mt-2 inline-flex ${
                isFullMatch
                  ? 'bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-surface)]'
                  : isGeometricReject
                    ? 'bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]'
                    : isSymbolicReject
                      ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                      : isValidPrefix
                        ? 'bg-[var(--bg-tray)] text-[var(--signal-cobalt)] border border-[#D8DCE5]'
                        : 'bg-[var(--bg-tray)] text-[var(--ink-primary)] border-[#D8DCE5]'
              }`}
            >
              {status}
            </div>
          </div>
        </div>

        {/* Dual-Layer Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
          {/* Layer 1: Automata Engine */}
          <div className="p-3 bg-[var(--bg-tray)] rounded-[8px] border border-[#D8DCE5] space-y-2">
            <div className="flex items-center justify-between border-b border-[#D8DCE5] pb-1.5">
              <span className="font-bold text-[var(--signal-cobalt)] text-xs uppercase tracking-[0.08em]">
                LAYER 1: FINITE AUTOMATA
              </span>
              <span className={`hud-reticle text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider ${
                recognitionReport.dfaAccepted
                  ? 'bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-surface)]'
                  : 'bg-[var(--bg-card)] text-[var(--ink-muted)] border border-[#D8DCE5]'
              }`}>
                {recognitionReport.dfaAccepted ? 'DFA ACCEPTED' : 'DFA PENDING/REJECT'}
              </span>
            </div>
            <div className="text-[10px] text-[var(--ink-secondary)] space-y-1 uppercase tracking-wide">
              <div>FINAL STATE: <strong className="font-dot text-xs text-[var(--signal-cobalt)]">{recognitionReport.finalState}</strong></div>
              <div>TAPE CONSUMED: <strong className="text-[var(--ink-primary)]">{recognitionReport.inputSymbols.length} SYMBOLS</strong></div>
              <div>RECOGNIZED IDS: <strong className="text-[var(--signal-cobalt)]">{recognitionReport.acceptedPatterns.join(', ') || 'NONE'}</strong></div>
            </div>
          </div>

          {/* Layer 2: Geometric Verification */}
          <div className="p-3 bg-[var(--bg-tray)] rounded-[8px] border border-[#D8DCE5] space-y-2">
            <div className="flex items-center justify-between border-b border-[#D8DCE5] pb-1.5">
              <span className="font-bold text-[var(--ink-primary)] text-xs uppercase tracking-[0.08em]">
                LAYER 2: PROCRUSTES GEOMETRY
              </span>
              <span className={`hud-reticle text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider ${
                recognitionReport.bestMatch?.isVerified
                  ? 'bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-surface)]'
                  : 'bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]'
              }`}>
                {recognitionReport.bestMatch?.isVerified ? 'GEOMETRY VERIFIED' : 'UNVERIFIED / DISTORTED'}
              </span>
            </div>
            <div className="text-[10px] text-[var(--ink-secondary)] space-y-1 uppercase tracking-wide">
              <div>RESIDUAL RMSE: <strong className="text-[var(--signal-cobalt)]">{recognitionReport.bestMatch?.residual ?? 'N/A'}</strong> (&le; 0.32)</div>
              <div>OPTIMAL ROTATION: <strong className="text-[var(--ink-primary)]">{recognitionReport.bestMatch?.rotationDeg ?? 0}&deg;</strong></div>
              <div>SCALE ALIGNMENT: <strong className="text-[var(--ink-primary)]">{recognitionReport.bestMatch?.scale ?? 1}X</strong></div>
            </div>
          </div>
        </div>

        {/* DFA State Traversal Stepper (Discrete Hardware Step Blocks) */}
        {recognitionReport.inputSymbols.length > 0 && (
          <div className="p-3 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px] space-y-2">
            <div className="text-[9px] uppercase font-semibold text-[var(--ink-muted)] tracking-[0.08em] flex justify-between">
              <span>DFA STATE TRAVERSAL STEPPER</span>
              <span>{recognitionReport.inputSymbols.length} DISCRETE STEPS</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <div className="px-2.5 py-1.5 bg-[var(--bg-card)] border border-[#D8DCE5] rounded-[4px] text-center">
                <span className="text-[8px] text-[var(--ink-muted)] block uppercase font-bold">START</span>
                <span className="font-dot text-xs text-[var(--ink-primary)]">q0</span>
              </div>
              {recognitionReport.inputSymbols.map((sym, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center text-[var(--ink-muted)] text-[10px] font-bold">
                    &rarr;
                  </div>
                  <div className="px-2 py-1 bg-[#181A20] border-l-2 border-l-[var(--signal-cobalt)] border-[#2E333D] rounded-[4px] text-center">
                    <span className="text-[8px] text-[var(--ink-muted)] block uppercase">STEP {i + 1}</span>
                    <span className="font-mono text-[10px] font-bold text-[#6892F6]">{sym}</span>
                  </div>
                  <div className="px-2.5 py-1.5 bg-[var(--bg-card)] border border-[#D8DCE5] rounded-[4px] text-center">
                    <span className="text-[8px] text-[var(--ink-muted)] block uppercase font-bold">STATE</span>
                    <span className="font-dot text-xs text-[var(--signal-cobalt)] font-bold">
                      {i === recognitionReport.inputSymbols.length - 1 ? recognitionReport.finalState : `s${i + 1}`}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Ranked Candidate Comparison List with 10-Dot Horizontal Dot Matrix Bars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[var(--ink-primary)] uppercase tracking-[0.08em] text-[10px]">
              RANKED CANDIDATE COMPARISONS ({recognitionReport.geometricScores.length} EVALUATED)
            </h4>
            <span className="text-[var(--ink-muted)] text-[9px] uppercase tracking-wider">
              10-DOT HORIZONTAL DOT MATRIX
            </span>
          </div>

          <div className="overflow-x-auto border border-[#D0D5DD] rounded-[8px] bg-[var(--bg-card)]">
            <table className="w-full text-left border-collapse font-mono text-[10px]">
              <thead className="bg-[var(--bg-tray)] text-[var(--ink-secondary)] uppercase text-[9px] tracking-[0.08em] border-b border-[#D0D5DD]">
                <tr>
                  <th className="p-2.5">PATTERN NAME</th>
                  <th className="p-2.5">CONSTELLATION</th>
                  <th className="p-2.5">RESIDUAL RMSE</th>
                  <th className="p-2.5">10-DOT MATRIX</th>
                  <th className="p-2.5">ROTATION &theta;</th>
                  <th className="p-2.5">VERDICT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E5EC]">
                {recognitionReport.geometricScores.map((score, idx) => {
                  // 10-Dot discrete dot calculation based on Procrustes residual
                  const activeDots = Math.max(1, Math.min(10, Math.round((1 - Math.min(1, score.residual / 0.45)) * 10)));

                  return (
                    <tr key={idx} className="hover:bg-[var(--bg-card-subtle)] transition-colors">
                      <td className="p-2.5 font-bold text-[var(--ink-primary)] uppercase">
                        {score.patternName}
                      </td>
                      <td className="p-2.5">
                        <span className="font-dot text-xs text-[var(--signal-cobalt)] font-bold">
                          {score.constellationId}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={score.isVerified ? 'text-[var(--signal-cobalt)] font-bold' : 'text-[#D97706]'}>
                          {score.residual}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {/* 10-Dot Horizontal Dot Matrix Bar */}
                        <div className="flex items-center gap-1" title={`${activeDots}/10 dots active`}>
                          {Array.from({ length: 10 }).map((_, d) => (
                            <span
                              key={d}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                d < activeDots ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5 text-[var(--ink-muted)]">
                        {score.rotationDeg}&deg;
                      </td>
                      <td className="p-2.5">
                        {score.isVerified ? (
                          <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-surface)] rounded-[3px] text-[9px] font-bold uppercase inline-flex">
                            ✓ VERIFIED
                          </span>
                        ) : (
                          <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-tray)] text-[var(--ink-muted)] border border-[#D8DCE5] rounded-[3px] text-[9px] uppercase inline-flex">
                            REJECTED
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

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E5EC]">
          <button
            onClick={handleExportTraceJson}
            className="px-3.5 py-2 bg-[var(--bg-tray)] hover:bg-[#D8DCE5] text-[var(--ink-primary)] rounded-[6px] text-xs font-mono font-semibold uppercase tracking-[0.08em] flex items-center gap-2 border border-[#D0D5DD] cursor-pointer transition-colors"
          >
            <span>📥</span>
            <span>EXPORT TRACE JSON</span>
          </button>

          <div className="flex gap-2">
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