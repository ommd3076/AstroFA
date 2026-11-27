import React from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { REFERENCE_PATTERNS } from '../../data/astroData';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/space/button';
import { Card } from '../../components/ui/space/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '../../components/ui/space/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/space/table';

interface RecognitionResultsModalProps {
  onClose: () => void;
}

export const RecognitionResultsModal: React.FC<RecognitionResultsModalProps> = ({ onClose }) => {
  const report = useAstroStore(state => state.recognitionReport);
  const backendRecognition = useAstroStore(state => state.backendRecognition);
  const tracedStarIds = useAstroStore(state => state.tracedStarIds);
  const tracedPoints = useAstroStore(state => state.tracedPoints);
  const setSimulatorSymbols = useAstroStore(state => state.setSimulatorSymbols);
  const setAutomataTab = useAstroStore(state => state.setAutomataTab);
  const setActiveView = useAstroStore(state => state.setActiveView);
  const loadPresetTrace = useAstroStore(state => state.loadPresetTrace);
  const setIsTraceMode = useAstroStore(state => state.setIsTraceMode);

  const handoff = () => {
    if (report?.inputSymbols.length) setSimulatorSymbols(report.inputSymbols);
    setAutomataTab('simulator');
    setActiveView('automataLab');
  };

  const openSampleTrace = () => {
    loadPresetTrace(REFERENCE_PATTERNS[0]);
    setIsTraceMode(true);
    setActiveView('sky');
    onClose();
  };

  const exportReport = () => {
    if (!report) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            tracedStarIds,
            tracedPoints,
            recognitionReport: report,
            backendRecognition,
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `costellar-recognition-${Date.now()}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const match =
    backendRecognition?.state === 'available'
      ? backendRecognition.result.bestMatch
      : report?.bestMatch;
  const pattern = match && REFERENCE_PATTERNS.find(item => item.id === match.patternId);
  const points = tracedPoints.length ? tracedPoints : (pattern?.referencePoints ?? []);
  const normalized = (() => {
    if (!points.length) return [];
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const scale = Math.min(250 / Math.max(1, maxX - minX), 140 / Math.max(1, maxY - minY));
    return points.map(p => ({
      x: 150 + (p.x - (minX + maxX) / 2) * scale,
      y: 90 + (p.y - (minY + maxY) / 2) * scale,
    }));
  })();
  const residual = match?.residual;
  const statusLabel =
    backendRecognition?.state === 'pending'
      ? 'Server shape check pending'
      : backendRecognition?.state === 'unavailable'
        ? `Server unavailable: ${backendRecognition.error}`
        : backendRecognition?.state === 'available'
          ? `Server ${backendRecognition.result.status}`
          : backendRecognition?.state === 'not-requested' && backendRecognition.reason === 'educational-demo'
            ? `Educational local report · ${report?.status ?? 'No result'}`
            : report?.status === 'VALID_PREFIX'
              ? 'Local valid prefix'
              : report?.status === 'GEOMETRIC_REJECT'
                ? 'Local geometry diagnostic'
                : report?.status === 'SYMBOLIC_REJECT'
                  ? 'Local sequence diagnostic'
                  : 'No server confirmation';
  const candidates =
    backendRecognition?.state === 'available'
      ? backendRecognition.result.candidates
      : (report?.geometricScores ?? []);

  const surface = 'atlas-surface rounded-xl p-4 sm:p-5 gap-0 shadow-none';

  return (
    <div className="w-full min-w-0 font-sans text-[var(--ink-primary)]">
      <div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:p-5">
        <PageHeader
          eyebrow="Trace workspace / report"
          title="Recognition result"
          titleId="recognition-results-title"
          meta={report ? `${report.inputSymbols.length} symbols · DFA ${report.dfaAccepted ? 'accepted' : 'rejected'}` : undefined}
          description={
            report
              ? `Local DFA diagnostic: ${report.explanation}`
              : 'Run recognition on a trace to produce a report.'
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {report && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportReport}
                    className="text-xs font-semibold"
                  >
                    Export JSON
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handoff}
                    disabled={!report.inputSymbols.length}
                    className="text-xs font-semibold"
                  >
                    Open in Automata Lab
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs font-semibold"
                aria-label="Close recognition results"
              >
                Close
              </Button>
            </div>
          }
        />

        {!report ? (
          <Card className={surface}>
            <Empty className="border-0 p-4">
              <EmptyHeader>
                <EmptyTitle className="text-sm">No report available</EmptyTitle>
                <EmptyDescription className="text-xs">
                  Add at least two points and run recognition. No sample result is substituted for your trace.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="flex-row flex-wrap justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-xs font-semibold"
                >
                  Return to trace
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
            <section className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
              <Card className={`${surface} flex flex-col justify-between`}>
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--ink-muted)]">
                    Recognition verdict
                  </p>
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)]">
                        {backendRecognition?.state === 'pending' || backendRecognition?.state === 'unavailable'
                          ? statusLabel
                          : match?.constellationId ?? statusLabel}
                      </h2>
                      {match && (
                        <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                          {match.patternName} · <span className="font-mono">{match.patternId}</span>
                        </p>
                      )}
                    </div>
                    {residual !== undefined && (
                      <div className="text-right">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
                          {backendRecognition?.state === 'available' ? 'SERVER RESIDUAL' : 'LOCAL DIAGNOSTIC RESIDUAL'}
                        </p>
                        <p className="text-2xl font-mono tabular-nums font-semibold text-[var(--signal-mid)]">
                          {residual.toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <dl className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--border-subtle)] pt-3 text-xs text-[var(--ink-secondary)]">
                  <div className="flex items-center gap-1.5">
                    <dt className="sr-only">Status</dt>
                    <dd className="font-medium text-[var(--ink-primary)]">{statusLabel}</dd>
                  </div>
                  <span className="text-[var(--ink-muted)]" aria-hidden="true">·</span>
                  <div>
                    <dt className="sr-only">Local DFA</dt>
                    <dd>Local DFA {report.dfaAccepted ? 'accepted' : 'rejected'}</dd>
                  </div>
                  <span className="text-[var(--ink-muted)]" aria-hidden="true">·</span>
                  <div>
                    <dt className="sr-only">Symbols</dt>
                    <dd className="font-mono tabular-nums">{report.inputSymbols.length} symbols</dd>
                  </div>
                </dl>
              </Card>

              <Card className={`${surface} flex min-h-44 items-center justify-center overflow-hidden bg-[var(--bg-viewport)]`}>
                <svg viewBox="0 0 300 180" className="h-full max-h-52 w-full" role="img" aria-label="Trace geometry preview">
                  <defs>
                    <pattern id="result-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                      <circle cx="1" cy="1" r=".8" fill="#2A2A32" />
                    </pattern>
                  </defs>
                  <rect width="300" height="180" fill="url(#result-dots)" />
                  {normalized.length > 1 && (
                    <>
                      <polyline
                        points={normalized.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#8FA3FF"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      {normalized.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#F3F1EB" />
                      ))}
                    </>
                  )}
                </svg>
              </Card>
            </section>

            <Card className={surface}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[var(--ink-primary)]">
                  {backendRecognition?.state === 'available' ? 'Server candidates' : 'Local diagnostic candidates'}
                </h2>
                <span className="text-[11px] text-[var(--ink-muted)]">
                  Residual is lower for closer geometric fit
                </span>
              </div>
              {candidates.length ? (
                <div className="mt-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 font-mono text-[10px] uppercase">#</TableHead>
                        <TableHead className="text-[10px] uppercase">Candidate</TableHead>
                        <TableHead className="text-right text-[10px] uppercase">Norm. RMSE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {candidates.slice(0, 5).map((candidate, index) => (
                        <TableRow key={candidate.patternId}>
                          <TableCell className="font-mono tabular-nums text-xs text-[var(--ink-muted)]">
                            {String(index + 1).padStart(2, '0')}
                          </TableCell>
                          <TableCell className="text-xs font-medium text-[var(--ink-primary)]">
                            {candidate.patternName}
                            <span className="ml-2 font-mono text-[var(--ink-secondary)]">{candidate.constellationId}</span>
                            {candidate.isVerified && (
                              <span className="ml-2 text-[var(--signal-mid)]">· verified reference</span>
                            )}
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
                <p className="mt-3 text-xs text-[var(--ink-secondary)]">No geometric candidates were returned.</p>
              )}
            </Card>

            <Card className={`${surface} flex flex-row flex-wrap items-center justify-between gap-3`}>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[var(--ink-primary)]">Automata input</h2>
                <p className="mt-1 font-mono text-xs text-[var(--ink-secondary)] break-words">
                  {report.inputSymbols.length
                    ? report.inputSymbols.join(' · ')
                    : 'This report contains no symbols to simulate.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportReport}
                  className="text-xs font-semibold"
                >
                  Export JSON
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handoff}
                  disabled={!report.inputSymbols.length}
                  className="text-xs font-semibold"
                >
                  Open in Automata Lab
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};
