import React from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { encodeGeometry } from '../../geometry/quantize';
import { normalizeGeometry } from '../../geometry/normalize';
import { REFERENCE_PATTERNS } from '../../data/astroData';
import { PageHeader } from '../../components/PageHeader';
import { Button as BoardButton } from '../../components/ui/board/base/buttons/button';
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '../../components/ui/board/base/table/table';
import { Chip } from '../../components/ui/board/base/badges/chip';

const Button: React.FC<any> = ({ variant = 'default', size = 'sm', children, ...props }) => (
  <BoardButton
    {...props}
    variant={variant === 'default' ? 'primary' : variant === 'outline' ? 'secondary' : variant}
    size={size === 'icon-xs' ? 'xs' : size === 'sm' ? 'small' : size}
  >
    {children}
  </BoardButton>
);

const Card: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className = '', children, ...props }) => (
  <section {...props} className={`atlas-surface flex flex-col ${className}`}>{children}</section>
);
const Empty: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div {...props} className={`flex flex-col items-center justify-center gap-3 text-center ${className}`}>{children}</div>
);
const EmptyHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div {...props} className={`flex flex-col items-center gap-1.5 ${className}`}>{children}</div>
);
const EmptyContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', children, ...props }) => (
  <div {...props} className={`flex items-center justify-center gap-2 ${className}`}>{children}</div>
);
const EmptyTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', children, ...props }) => (
  <h3 {...props} className={`font-medium text-[var(--ink-primary)] ${className}`}>{children}</h3>
);
const EmptyDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', children, ...props }) => (
  <p {...props} className={`text-[var(--ink-secondary)] ${className}`}>{children}</p>
);

interface PatternAnalysisModalProps {
  onClose: () => void;
}

export const PatternAnalysisModal: React.FC<PatternAnalysisModalProps> = ({ onClose }) => {
  const tracedPoints = useAstroStore(state => state.tracedPoints);
  const recognitionReport = useAstroStore(state => state.recognitionReport);
  const setSimulatorSymbols = useAstroStore(state => state.setSimulatorSymbols);
  const setAutomataTab = useAstroStore(state => state.setAutomataTab);
  const setActiveView = useAstroStore(state => state.setActiveView);
  const loadPresetTrace = useAstroStore(state => state.loadPresetTrace);
  const setIsTraceMode = useAstroStore(state => state.setIsTraceMode);

  const hasTrace = tracedPoints.length >= 2;
  const encoded = hasTrace ? encodeGeometry(tracedPoints) : null;
  const normalized = hasTrace ? normalizeGeometry(tracedPoints) : null;
  const meanEdge = normalized?.edgeLengths.length
    ? normalized.edgeLengths.reduce((sum, value) => sum + value, 0) / normalized.edgeLengths.length
    : null;
  const points = normalized?.normalizedPoints ?? [];
  const bounds = points.length
    ? {
        minX: Math.min(...points.map(p => p.x)),
        maxX: Math.max(...points.map(p => p.x)),
        minY: Math.min(...points.map(p => p.y)),
        maxY: Math.max(...points.map(p => p.y)),
      }
    : null;
  const plotScale = bounds
    ? Math.min(100 / Math.max(0.1, bounds.maxX - bounds.minX), 70 / Math.max(0.1, bounds.maxY - bounds.minY))
    : 1;
  const plot = bounds
    ? points.map(p => ({
        x: 150 + (p.x - (bounds.minX + bounds.maxX) / 2) * plotScale,
        y: 82 + (p.y - (bounds.minY + bounds.maxY) / 2) * plotScale,
      }))
    : [];
  const angleBins = Array.from({ length: 6 }, () => 0);
  encoded?.steps.forEach(step => {
    const angle = (step.turnAngleDeg + 360) % 360;
    angleBins[Math.min(5, Math.floor(angle / 60))]++;
  });
  const lengthBins = Array.from({ length: 5 }, () => 0);
  normalized?.edgeLengths.forEach(length => {
    lengthBins[Math.min(4, Math.floor(length / 0.2))]++;
  });

  const handoff = () => {
    if (encoded?.symbols.length) setSimulatorSymbols(encoded.symbols);
    setAutomataTab('simulator');
    setActiveView('automataLab');
  };
  const openTraceWorkspace = () => {
    setIsTraceMode(true);
    setActiveView('sky');
  };
  const openSampleTrace = () => {
    loadPresetTrace(REFERENCE_PATTERNS[0]);
    openTraceWorkspace();
  };

  const matchName = recognitionReport?.bestMatch?.constellationId;
  const pattern =
    recognitionReport?.bestMatch &&
    REFERENCE_PATTERNS.find(item => item.id === recognitionReport.bestMatch?.patternId);

  const surface = 'atlas-surface rounded-xl p-4 sm:p-5 gap-0 shadow-none';

  const histogram = (values: number[], labels: string[]) => (
    <div className="mt-4">
      <div className="flex h-24 items-end gap-2 border-b border-[var(--border-subtle)] px-1">
        {values.map((count, index) => (
          <div
            key={index}
            className="flex h-full flex-1 flex-col justify-end gap-1"
            title={`${labels[index]}: ${count}`}
            aria-label={`${labels[index]}: ${count}`}
          >
            <span className="text-center font-mono text-[10px] tabular-nums text-[var(--ink-secondary)]">
              {count}
            </span>
            <div className="mx-auto flex flex-col-reverse gap-1">
              {Array.from({ length: Math.min(count, 10) }, (_, dot) => (
                <i key={dot} className="block h-1.5 w-1.5 rounded-full bg-[var(--signal-mid)]" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-1 font-mono text-[10px] text-[var(--ink-muted)]">
        {labels.map(label => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-[var(--ink-muted)]">Counts are shown above; dot stacks cap at 10.</p>
    </div>
  );

  return (
    <div className="boardui-surface w-full min-w-0 font-sans text-[var(--ink-primary)]">
      <div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:p-5">
        <PageHeader
          eyebrow="Trace workspace / geometry"
          title="Pattern analysis"
          titleId="pattern-analysis-title"
          description="Measures below describe the current trace geometry. They are not recognition accuracy scores."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {hasTrace && encoded && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handoff}
                  disabled={!encoded.symbols.length}
                  className="text-xs font-semibold"
                >
                  Open sequence in Automata Lab
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-semibold"
                aria-label="Close pattern analysis"
              >
                Close
              </Button>
            </div>
          }
        >
          {hasTrace && encoded && normalized && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-y border-[var(--border-subtle)] py-2.5 sm:grid-cols-4">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Trace points</dt>
                <dd className="mt-0.5 font-mono text-xl tabular-nums font-medium text-[var(--ink-primary)]">
                  {tracedPoints.length}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Encoded symbols</dt>
                <dd className="mt-0.5 font-mono text-xl tabular-nums font-medium text-[var(--ink-primary)]">
                  {encoded.symbols.length}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Mean normalized edge</dt>
                <dd className="mt-0.5 font-mono text-xl tabular-nums font-medium text-[var(--ink-primary)]">
                  {meanEdge?.toFixed(3) ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">Geometric residual</dt>
                <dd className="mt-0.5 font-mono text-xl tabular-nums font-medium text-[var(--signal-mid)]">
                  {recognitionReport?.bestMatch?.residual.toFixed(4) ?? '—'}
                  {matchName && (
                    <span className="ml-2 text-xs font-normal text-[var(--ink-secondary)]">({matchName})</span>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </PageHeader>

        {!hasTrace || !encoded || !normalized ? (
          <Card className={surface}>
            <Empty className="border-0 p-4">
              <EmptyHeader>
                <EmptyTitle className="text-sm">A trace is needed</EmptyTitle>
                <EmptyDescription className="text-xs">
                  Select at least two points to calculate normalized geometry and encoded turns.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex-row flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openTraceWorkspace}
                  className="text-xs font-semibold"
                >
                  Open trace workspace
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={openSampleTrace}
                  className="text-xs font-semibold"
                >
                  Load sample trace
                </Button>
              </EmptyContent>
            </Empty>
          </Card>
        ) : (
          <>
            <section className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
              <Card className={surface}>
                <h2 className="text-sm font-semibold text-[var(--ink-primary)]">Normalized trace</h2>
                <p className="mt-1 text-[11px] text-[var(--ink-secondary)]">
                  Scale and translation removed for shape comparison
                </p>
                <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-viewport)] p-2">
                  <svg viewBox="0 0 300 164" className="w-full" role="img" aria-label="Normalized current trace">
                    <defs>
                      <pattern id="analysis-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r=".8" fill="#2A2A32" />
                      </pattern>
                    </defs>
                    <rect width="300" height="164" fill="url(#analysis-dots)" />
                    {plot.length > 1 && (
                      <>
                        <polyline
                          points={plot.map(point => `${point.x},${point.y}`).join(' ')}
                          fill="none"
                          stroke="#8FA3FF"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                        {plot.map((point, index) => (
                          <circle key={index} cx={point.x} cy={point.y} r="3" fill="#F3F1EB" />
                        ))}
                      </>
                    )}
                  </svg>
                </div>
                {pattern && (
                  <p className="mt-2 text-xs text-[var(--ink-secondary)]">
                    Compared candidate: {pattern.name} (<span className="font-mono">{pattern.id}</span>)
                  </p>
                )}
              </Card>

              <Card className={surface}>
                <h2 className="text-sm font-semibold text-[var(--ink-primary)]">Turn angle distribution</h2>
                <p className="mt-1 font-mono text-[11px] text-[var(--ink-secondary)]">
                  60° bins · {encoded.steps.length} turns
                </p>
                {histogram(angleBins, ['0°', '60°', '120°', '180°', '240°', '300°'])}
                <h3 className="mt-6 text-sm font-semibold text-[var(--ink-primary)]">Normalized edge lengths</h3>
                {histogram(lengthBins, ['0–.2', '.2–.4', '.4–.6', '.6–.8', '≥0.8'])}
              </Card>
            </section>

            <Card className={surface}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-sm font-semibold text-[var(--ink-primary)]">Candidate patterns</h2>
                <span className="text-[11px] text-[var(--ink-muted)]">Lower geometric residual indicates closer fit</span>
              </div>
              {recognitionReport?.geometricScores.length ? (
                <div className="mt-3">
                  <Table aria-label="Geometric candidate patterns" size="sm" selectionMode="none">
                    <TableHeader>
                      <TableColumn id="rank" className="w-12 font-mono text-[10px] uppercase">#</TableColumn>
                      <TableColumn id="pattern" className="text-[10px] uppercase">Pattern</TableColumn>
                      <TableColumn id="residual" className="text-right font-mono text-[10px] uppercase">Norm. RMSE</TableColumn>
                    </TableHeader>
                    <TableBody items={recognitionReport.geometricScores.slice(0, 5)}>
                      {recognitionReport.geometricScores.slice(0, 5).map((candidate, index) => (
                        <TableRow key={candidate.patternId} id={candidate.patternId} textValue={`${candidate.patternName} ${candidate.constellationId}`}>
                          <TableCell className="font-mono tabular-nums text-xs text-[var(--ink-muted)]">
                            {String(index + 1).padStart(2, '0')}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-[var(--ink-primary)]">
                            {candidate.patternName}
                            <span className="ml-2 font-mono text-[var(--ink-secondary)]">{candidate.constellationId}</span>
                            {candidate.isVerified && <Chip className="ml-2" variant="caption" color="cyan">verified</Chip>}
                          </TableCell>
                          <TableCell className="text-right font-mono tabular-nums text-xs font-semibold text-[var(--ink-primary)]">
                            {candidate.residual.toFixed(4)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--ink-secondary)]">
                  No geometric candidate scores are available for this trace.
                </p>
              )}
            </Card>

            <Card className={surface}>
              <h2 className="text-sm font-semibold text-[var(--ink-primary)]">Encoded sequence</h2>
              <p className="mt-1 text-[11px] text-[var(--ink-secondary)]">
                Turn and distance categories from the current point order
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {encoded.steps.map((step, index) => (
                  <span
                    key={index}
                    className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] px-2.5 py-1.5 font-mono text-xs text-[var(--ink-primary)]"
                  >
                    <span className="text-[var(--signal-mid)]">{step.turnCategory}</span>
                    <span className="px-2 text-[var(--ink-muted)]">/</span>
                    {step.distanceCategory}
                  </span>
                ))}
              </div>
              {!encoded.steps.length && (
                <p className="mt-2 text-xs text-[var(--ink-secondary)]">
                  No encoded steps are available for this trace.
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handoff}
                  disabled={!encoded.symbols.length}
                  className="text-xs font-semibold"
                >
                  Open sequence in Automata Lab
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
