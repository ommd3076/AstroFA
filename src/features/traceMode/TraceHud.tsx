import React, { useState, useEffect, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { REFERENCE_PATTERNS, STAR_BY_ID } from '../../data/astroData';
import { PROCRUSTES_RESIDUAL_THRESHOLD } from '../../geometry/similarity';
import { Button as BoardButton } from '../../components/ui/board/base/buttons/button';

type TraceButtonProps = Omit<React.ComponentProps<typeof BoardButton>, 'variant' | 'size'> & { variant?: 'default' | 'outline' | 'secondary' | 'ghost'; size?: 'xs' | 'sm' | 'icon-xs' };
const Button: React.FC<TraceButtonProps> = ({ variant = 'default', size = 'xs', children, ...props }) => <BoardButton {...props} variant={(variant === 'default' ? 'primary' : variant === 'outline' ? 'secondary' : variant) as 'primary' | 'secondary' | 'ghost'} size={size === 'sm' ? 'small' : 'xs'}>{children}</BoardButton>;
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => <div {...props} className={className}>{children}</div>;
const Alert: React.FC<React.HTMLAttributes<HTMLDivElement> & { variant?: string }> = ({ className, children, ...props }) => <div {...props} className={`rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] ${className ?? ''}`}>{children}</div>;
const AlertDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => <p {...props} className={className}>{children}</p>;
const AlertTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => <h3 {...props} className={className}>{children}</h3>;
const Empty: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => <div {...props} className={`flex flex-col items-center justify-center ${className ?? ''}`}>{children}</div>;
const EmptyHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => <div {...props} className={className}>{children}</div>;
const EmptyMedia: React.FC<React.HTMLAttributes<HTMLDivElement> & { variant?: string }> = ({ className, children, ...props }) => <div {...props} className={className}>{children}</div>;
const EmptyTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => <h3 {...props} className={className}>{children}</h3>;
const EmptyDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => <p {...props} className={className}>{children}</p>;
const Toolbar: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => <div role="toolbar" {...props} className={`flex items-center ${className ?? ''}`} />;
const ToolbarGroup: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => <div {...props} className={`flex items-center ${className ?? ''}`} />;
const ToolbarSeparator: React.FC<{ className?: string; orientation?: string }> = ({ className }) => <span aria-hidden="true" className={`w-px bg-[var(--border-subtle)] ${className ?? ''}`} />;
const ToolbarButton: React.FC<{ render: React.ReactElement; onClick?: () => void; disabled?: boolean; focusableWhenDisabled?: boolean; children?: React.ReactNode }> = ({ render, onClick, disabled, children }) => React.cloneElement(render, { onClick, disabled, children } as never);
const SelectItem: React.FC<{ value?: string; id?: string; children?: React.ReactNode; className?: string }> = ({ value, id, children }) => <option value={value ?? id}>{children}</option>;
const SelectGroup: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>{children}</>;
const SelectGroupLabel: React.FC<{ children?: React.ReactNode }> = () => null;
const SelectSeparator: React.FC = () => null;
const SelectTrigger: React.FC<{ children?: React.ReactNode; size?: string; className?: string; ['aria-label']?: string; title?: string }> = () => null;
const SelectValue: React.FC<{ children?: React.ReactNode | ((value: unknown) => React.ReactNode); placeholder?: string }> = () => null;
const SelectPopup: React.FC<{ children?: React.ReactNode; align?: string }> = ({ children }) => <>{children}</>;
const Select: React.FC<{ value: string; onValueChange: (value: string) => void; children?: React.ReactNode; size?: string; className?: string; ['aria-label']?: string; title?: string }> = ({ value, onValueChange, children, size: _size, ...props }) => <select {...props} value={value} onChange={event => onValueChange(event.target.value)} className="h-7 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] px-2 font-mono text-[11px] text-[var(--ink-primary)]">{children}</select>;

// Mini SVG Thumbnail renderer for constellation asterisms
export const AsterismThumbnail: React.FC<{
  points?: { x: number; y: number }[];
  size?: number;
  className?: string;
}> = ({ points, size = 40, className = '' }) => {
  if (!points || points.length === 0) {
    return (
      <span
        style={{ width: size, height: size }}
        className={`bg-[var(--bg-viewport)] rounded-md border border-[var(--border-subtle)] flex items-center justify-center text-[10px] text-[var(--ink-muted)] shrink-0 ${className}`}
      >
        ✦
      </span>
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
      className={`bg-[var(--bg-viewport)] rounded-md border border-[var(--border-subtle)] shrink-0 ${className}`}
      aria-hidden="true"
    >
      {polylineStr && (
        <polyline
          points={polylineStr}
          fill="none"
          stroke="var(--signal-cobalt)"
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
          fill={idx === mapped.length - 1 ? 'var(--signal-mid)' : '#F3F1EB'}
        />
      ))}
    </svg>
  );
};

export const TraceHud: React.FC = () => {
  const isTraceMode = useAstroStore(state => state.isTraceMode);
  const setIsTraceMode = useAstroStore(state => state.setIsTraceMode);
  const showTraceHints = useAstroStore(state => state.showTraceHints);
  const setShowTraceHints = useAstroStore(state => state.setShowTraceHints);
  const setShowPatternAnalysisModal = useAstroStore(state => state.setShowPatternAnalysisModal);
  const setShowRecognitionResultsModal = useAstroStore(state => state.setShowRecognitionResultsModal);
  const tracedStarIds = useAstroStore(state => state.tracedStarIds);
  const tracedPoints = useAstroStore(state => state.tracedPoints);
  const recognitionReport = useAstroStore(state => state.recognitionReport);
  const backendRecognition = useAstroStore(state => state.backendRecognition);
  const undoLastTracePoint = useAstroStore(state => state.undoLastTracePoint);
  const clearTrace = useAstroStore(state => state.clearTrace);
  const loadPresetTrace = useAstroStore(state => state.loadPresetTrace);
  const addTracedCustomPoint = useAstroStore(state => state.addTracedCustomPoint);
  const setActiveView = useAstroStore(state => state.setActiveView);
  const setAutomataTab = useAstroStore(state => state.setAutomataTab);
  const setSimulatorSymbols = useAstroStore(state => state.setSimulatorSymbols);

  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [showMobileCandidates, setShowMobileCandidates] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string>('');

  // Guarded Undo shortcut (Z): never fires when typing in inputs/selects/contentEditable or when a modal dialog is open.
  useEffect(() => {
    if (!isTraceMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (document.querySelector('[role="dialog"]')) return;
      if ((e.key === 'z' || e.key === 'Z') && !e.metaKey && !e.ctrlKey && !e.altKey) {
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

  const handleOpenResults = () => {
    setShowRecognitionResultsModal(false);
    setActiveView('results');
  };

  const handleOpenPatternAnalysis = () => {
    setShowPatternAnalysisModal(false);
    setActiveView('patterns');
  };

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

      for (const p of [p0, p1, p2, p3, p4]) {
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

  const candidatesList = useMemo(() => {
    if (backendRecognition?.state === 'available') {
      return backendRecognition.result.candidates.map(score => {
        const refPattern = REFERENCE_PATTERNS.find(p => p.id === score.patternId);
        return {
          id: score.patternId,
          name: score.patternName,
          constellationId: score.constellationId,
          residual: score.residual,
          isVerified: score.isVerified,
          isBestMatch: backendRecognition.result.bestMatch?.patternId === score.patternId,
          points: refPattern?.referencePoints,
        };
      });
    }
    if (recognitionReport && recognitionReport.geometricScores.length > 0) {
      return recognitionReport.geometricScores.map(score => {
        const refPattern = REFERENCE_PATTERNS.find(p => p.id === score.patternId || p.constellationId === score.constellationId);
        const isBestMatch = recognitionReport.bestMatch?.patternId === score.patternId;
        return {
          id: score.patternId,
          name: score.patternName || score.constellationId,
          constellationId: score.constellationId,
          residual: score.residual,
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
          residual: null,
          isVerified: false,
          isBestMatch: false,
          points: refPattern?.referencePoints,
        };
      });
    }

    return [];
  }, [recognitionReport, backendRecognition]);

  const displayedCandidates = showAllCandidates ? candidatesList : candidatesList.slice(0, 4);

  const activeCandidatesDisplay = useMemo(() => {
    if (backendRecognition?.state === 'pending') return 'Checking server...';
    if (backendRecognition?.state === 'unavailable') return 'Server unavailable';
    if (backendRecognition?.state === 'available') {
      const matchName = backendRecognition.result.bestMatch?.patternName;
      return backendRecognition.result.status === 'AMBIGUOUS'
        ? `Ambiguous${matchName ? ` · ${matchName}` : ''}`
        : matchName ?? backendRecognition.result.status.replace('_', ' ');
    }
    if (backendRecognition?.state === 'not-requested' && backendRecognition.reason === 'educational-demo') return 'Educational demo · Local DFA';
    if (!recognitionReport) return 'Select stars to trace';
    if (recognitionReport.status === 'FULL_MATCH') {
      return recognitionReport.bestMatch?.patternName || recognitionReport.bestMatch?.constellationId || 'Match found';
    }
    if (recognitionReport.status === 'VALID_PREFIX') {
      const labels = recognitionReport.prefixMatch.reachableAcceptingLabels;
      return labels.length > 0 ? labels.slice(0, 3).join(', ') : 'Valid prefix...';
    }
    if (recognitionReport.status === 'GEOMETRIC_REJECT') return 'Geometric reject';
    if (recognitionReport.status === 'SYMBOLIC_REJECT') return 'Symbolic reject';
    return 'Analyzing...';
  }, [recognitionReport, backendRecognition]);

  if (!isTraceMode) return null;

  return (
    <div className="absolute inset-0 z-20 h-full min-h-0 overflow-hidden pointer-events-none flex flex-col justify-between gap-2 p-2 sm:p-2.5 font-sans text-xs select-none">
      {/* Slim Top Telemetry Strip (stage-first; no 4-box telemetry wall) */}
      <div className="pointer-events-auto shrink-0 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)]/90 px-3 py-1.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt)] shrink-0" aria-hidden="true" />
            <h1 className="font-sans text-xs font-semibold text-[var(--ink-primary)] tracking-tight">
              Trace-to-Recognize
            </h1>
          </div>

          <dl className="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-[11px] font-mono tabular-nums">
            <div className="flex items-baseline gap-1.5">
              <dt className="text-[var(--ink-muted)]">Pts</dt>
              <dd className="font-semibold text-[var(--ink-primary)]">{pointCount}</dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="text-[var(--ink-muted)]">Sym</dt>
              <dd className="font-semibold text-[var(--ink-primary)]">{symbolCount}</dd>
            </div>
            <div className="flex items-baseline gap-1.5 min-w-0">
              <dt className="text-[var(--ink-muted)]">Match</dt>
              <dd className="font-semibold text-[var(--signal-mid)] truncate max-w-[180px]" title={activeCandidatesDisplay}>
                {activeCandidatesDisplay}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowMobileCandidates(value => !value)}
            aria-expanded={showMobileCandidates}
            aria-controls="trace-candidate-panel"
            className="sm:hidden text-[11px] font-semibold"
          >
            {showMobileCandidates ? 'Hide' : `Matches (${candidatesList.length})`}
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="size-6 p-0 font-mono font-bold"
            onClick={() => document.querySelector('canvas')?.dispatchEvent(new WheelEvent('wheel', { deltaY: -120 }))}
            title="Zoom In"
            aria-label="Zoom in on sky"
          >
            +
          </Button>
          <Button
            variant="outline"
            size="xs"
            className="size-6 p-0 font-mono font-bold"
            onClick={() => document.querySelector('canvas')?.dispatchEvent(new WheelEvent('wheel', { deltaY: 120 }))}
            title="Zoom Out"
            aria-label="Zoom out on sky"
          >
            −
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsTraceMode(false)}
            className="text-[11px] font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
            title="Exit Trace Mode"
          >
            ✕ Exit
          </Button>
        </div>
      </div>

      {/* Middle Region: Maximum Open Sky Reticle + Bounded Candidate Column */}
      <div className="flex-1 relative flex gap-2.5 min-h-0 pointer-events-none items-stretch overflow-hidden">
        <div className="flex-1 min-w-0 min-h-0 relative pointer-events-none flex flex-col justify-end p-1">
          {pointCount > 0 && (
            <div className="pointer-events-auto self-start bg-[var(--bg-card)]/90 backdrop-blur-sm border border-[var(--border-subtle)] rounded-md px-2.5 py-1 text-[10px] font-mono text-[var(--ink-secondary)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-cobalt)]" aria-hidden="true" />
              <span className="tabular-nums text-[var(--ink-primary)]">
                {pointCount} {pointCount === 1 ? 'point' : 'points'}
              </span>
              {tracedStarIds.length > 0 && (
                <span className="text-[var(--ink-muted)] border-l border-[var(--border-subtle)] pl-2">
                  Last: {STAR_BY_ID.get(tracedStarIds[tracedStarIds.length - 1])?.name || `ID ${tracedStarIds[tracedStarIds.length - 1]}`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bounded Scrollable Candidate Panel */}
        <Card
          id="trace-candidate-panel"
          className={`${showMobileCandidates ? 'flex' : 'hidden'} sm:flex w-[min(100%,336px)] sm:w-[300px] lg:w-[336px] max-h-[42vh] sm:max-h-full min-h-0 absolute bottom-0 left-0 sm:static pointer-events-auto bg-[var(--bg-card)]/94 backdrop-blur-md border-[var(--border-subtle)] rounded-[10px] p-3 gap-0 flex-col overflow-hidden shadow-none`}
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-2 shrink-0 gap-2">
            <h3 className="font-sans text-xs font-semibold text-[var(--ink-primary)] truncate">
              {backendRecognition?.state === 'available' ? 'Server candidates' : 'Local candidates'}
            </h3>
            <span className="text-[10px] text-[var(--ink-muted)] font-mono tabular-nums shrink-0" aria-live="polite">
              {candidatesList.length} matches
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-1.5">
            {displayedCandidates.length > 0 ? (
              displayedCandidates.map((cand, idx) => {
                const isSelected = cand.isBestMatch || idx === 0;
                return (
                  <Button
                    variant={isSelected ? 'secondary' : 'outline'}
                    key={cand.id + idx}
                    aria-label={`Open recognition details for ${cand.name}${cand.residual === null ? ', prefix candidate' : `, geometric residual ${cand.residual.toFixed(4)}`}`}
                    className={`h-auto w-full p-2 rounded-lg flex items-center justify-between gap-2.5 text-left font-normal ${
                      isSelected
                        ? 'border-[var(--signal-cobalt)] bg-[var(--bg-pill-active)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] hover:border-[var(--signal-surface)]'
                    }`}
                    onClick={handleOpenResults}
                  >
                    <AsterismThumbnail points={cand.points} size={40} />

                    <span className="flex-1 min-w-0 space-y-0.5">
                      <span className="block font-sans text-xs font-semibold text-[var(--ink-primary)] truncate">
                        {cand.name}
                      </span>
                      <span className="flex items-center justify-between text-[10px] text-[var(--ink-secondary)]">
                        <span className="text-[var(--ink-muted)]">
                          {cand.residual === null ? 'Prefix match' : 'Residual RMSE'}
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-[var(--signal-mid)]">
                          {cand.residual === null ? 'PREFIX' : cand.residual.toFixed(4)}
                        </span>
                      </span>
                    </span>

                    <span className="text-[var(--ink-muted)] text-sm font-mono pl-1" aria-hidden="true">›</span>
                  </Button>
                );
              })
            ) : (
              <Empty className="bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-lg p-4 gap-2">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="text-[var(--signal-mid)] font-mono">
                    ✦
                  </EmptyMedia>
                  <EmptyTitle className="text-xs">Stage ready</EmptyTitle>
                  <EmptyDescription className="text-[11px]">
                    Click catalog stars in sequence on the sky dome to evaluate DFA prefix paths.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}

            {candidatesList.length > 4 && (
              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowAllCandidates(!showAllCandidates)}
                aria-expanded={showAllCandidates}
                aria-label={showAllCandidates ? 'Show top candidates' : `Show all ${candidatesList.length} candidates`}
                className="w-full text-[11px] font-sans font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
              >
                <span>{showAllCandidates ? 'Show fewer' : `Show all (${candidatesList.length})`}</span>
              </Button>
            )}

            {recognitionReport && (
              <Alert
                variant={
                  recognitionReport.status === 'FULL_MATCH'
                    ? 'info'
                    : recognitionReport.status === 'VALID_PREFIX'
                      ? 'default'
                      : recognitionReport.status === 'GEOMETRIC_REJECT'
                        ? 'warning'
                        : 'error'
                }
                className="p-2.5 text-[10px]"
              >
                <AlertTitle className="font-mono text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between gap-2">
                  <span>{recognitionReport.status.replace('_', ' ')}</span>
                  <span className="text-[9px]">DFA: {recognitionReport.dfaAccepted ? 'YES' : 'NO'}</span>
                </AlertTitle>
                <AlertDescription className="space-y-1 text-[10px]">
                  <p className="leading-snug text-[var(--ink-secondary)]">
                    {recognitionReport.explanation}
                  </p>
                  <p className="text-[9px] font-mono leading-tight uppercase tracking-wide text-[var(--signal-mid)]" aria-live="polite">
                    {backendRecognition?.state === 'pending'
                      ? 'Server shape check pending'
                      : backendRecognition?.state === 'unavailable'
                        ? `Server unavailable · ${backendRecognition.error}`
                        : backendRecognition?.state === 'available'
                          ? `Server shape: ${backendRecognition.result.status}`
                          : backendRecognition?.state === 'not-requested' && backendRecognition.reason === 'educational-demo'
                            ? 'Local educational report · server not queried'
                            : `Local provisional · RMSE ≤ ${PROCRUSTES_RESIDUAL_THRESHOLD}`}
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Compact Space UI Toolbar Dock */}
      <Toolbar
        aria-label="Trace workspace actions"
        onKeyDown={e => e.stopPropagation()}
        className="pointer-events-auto shrink-0 bg-[var(--bg-card)]/95 backdrop-blur-md border-[var(--border-subtle)] rounded-[10px] p-1.5 flex-wrap items-center justify-between gap-2"
      >
        <ToolbarGroup aria-label="Primary trace controls" className="flex-wrap gap-1.5">
          <ToolbarButton
            disabled={pointCount === 0}
            focusableWhenDisabled={false}
            render={
              <Button
                variant="outline"
                size="xs"
                className="h-7 text-[11px] font-semibold"
                title="Undo Last Star (Shortcut: Z)"
              />
            }
            onClick={undoLastTracePoint}
          >
            <span className="font-mono" aria-hidden="true">↩</span>
            <span>Undo (Z)</span>
          </ToolbarButton>

          <ToolbarButton
            disabled={pointCount === 0}
            focusableWhenDisabled={false}
            render={
              <Button
                variant="outline"
                size="xs"
                className="h-7 text-[11px] font-semibold"
                title="Clear Current Traced Path"
              />
            }
            onClick={clearTrace}
          >
            <span>Clear</span>
          </ToolbarButton>

          <ToolbarButton
            render={
              <Button
                variant={showTraceHints ? 'default' : 'outline'}
                size="xs"
                aria-pressed={showTraceHints}
                className="h-7 text-[11px] font-semibold"
                title="Toggle Constellation Guide Hint Lines"
              />
            }
            onClick={() => setShowTraceHints(!showTraceHints)}
          >
            <span>{showTraceHints ? 'Hints: On' : 'Hints'}</span>
          </ToolbarButton>

          <ToolbarButton
            disabled={!recognitionReport}
            focusableWhenDisabled={false}
            render={
              <Button
                variant="default"
                size="xs"
                className="h-7 text-[11px] font-semibold"
                title="Open Constellation Recognition Result Report"
              />
            }
            onClick={handleOpenResults}
          >
            <span>Complete report ↗</span>
          </ToolbarButton>
        </ToolbarGroup>

        <ToolbarSeparator orientation="vertical" className="hidden lg:block h-4" />

        <ToolbarGroup aria-label="Trace analysis and presets" className="flex-wrap gap-1.5">
          <ToolbarButton
            disabled={pointCount < 2}
            focusableWhenDisabled={false}
            render={
              <Button
                variant="outline"
                size="xs"
                className="h-7 text-[11px] font-semibold"
                title="Inspect Normalized Geometry & Turn Angle Distributions"
              />
            }
            onClick={handleOpenPatternAnalysis}
          >
            <span>Geometry</span>
          </ToolbarButton>

          <Select
            value={selectedSample}
            onValueChange={val => {
              if (!val) return;
              setSelectedSample(val);
              handlePresetSelect(val);
            }}
          >
            <SelectTrigger
              size="sm"
              aria-label="Load a reference trace sample or academic demo"
              title="Load a reference trace sample or academic demo"
              className="w-auto min-w-[170px] max-w-[210px] h-7 font-mono text-[11px]"
            >
              <SelectValue placeholder="Sample traces / demos">
                {val => {
                  if (!val) return 'Sample traces / demos';
                  if (val === 'DEMO_SYMBOLIC_REJECT') return 'DEMO: SYMBOLIC REJECT';
                  if (val === 'DEMO_GEOMETRIC_REJECT') return 'DEMO: GEOMETRIC REJECT';
                  if (val === 'DEMO_INVARIANCE') return 'DEMO: INVARIANCE (137°)';
                  const found = REFERENCE_PATTERNS.find(p => p.id === val);
                  return found ? `${found.name} (${found.orderedStarIds.length})` : String(val);
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup align="end">
              <SelectGroup>
                <SelectGroupLabel>Reference Constellations</SelectGroupLabel>
                {REFERENCE_PATTERNS.filter(p => p.traversalVariant === 'forward').map(p => (
                  <SelectItem key={p.id} value={p.id} className="font-mono text-xs">
                    {p.name.toUpperCase()} ({p.orderedStarIds.length} STARS)
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectGroupLabel>Academic Demonstrations</SelectGroupLabel>
                <SelectItem value="DEMO_SYMBOLIC_REJECT" className="font-mono text-xs">
                  DEMO: SYMBOLIC REJECT
                </SelectItem>
                <SelectItem value="DEMO_GEOMETRIC_REJECT" className="font-mono text-xs">
                  DEMO: GEOMETRIC REJECT
                </SelectItem>
                <SelectItem value="DEMO_INVARIANCE" className="font-mono text-xs">
                  DEMO: INVARIANCE (ROT 137°)
                </SelectItem>
              </SelectGroup>
            </SelectPopup>
          </Select>

          {recognitionReport && (
            <ToolbarButton
              render={
                <Button
                  variant="secondary"
                  size="xs"
                  className="h-7 text-[11px] font-semibold text-[var(--signal-mid)]"
                  title="Send Input Symbols directly to Automata Simulator"
                />
              }
              onClick={handleOpenAutomataLab}
            >
              <span>Inspect DFA →</span>
            </ToolbarButton>
          )}
        </ToolbarGroup>
      </Toolbar>
    </div>
  );
};
