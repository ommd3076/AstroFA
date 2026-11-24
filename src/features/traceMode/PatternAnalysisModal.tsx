import React from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { encodeGeometry } from '../../geometry/quantize';
import { normalizeGeometry } from '../../geometry/normalize';
import { REFERENCE_PATTERNS } from '../../data/astroData';

interface PatternAnalysisModalProps { onClose: () => void }

export const PatternAnalysisModal: React.FC<PatternAnalysisModalProps> = ({ onClose }) => {
  const { tracedPoints, recognitionReport, setSimulatorSymbols, setAutomataTab, setActiveView, loadPresetTrace, setIsTraceMode } = useAstroStore();
  const hasTrace = tracedPoints.length >= 2;
  const encoded = hasTrace ? encodeGeometry(tracedPoints) : null;
  const normalized = hasTrace ? normalizeGeometry(tracedPoints) : null;
  const meanEdge = normalized?.edgeLengths.length ? normalized.edgeLengths.reduce((sum, value) => sum + value, 0) / normalized.edgeLengths.length : null;
  const points = normalized?.normalizedPoints ?? [];
  const bounds = points.length ? { minX: Math.min(...points.map(p=>p.x)), maxX: Math.max(...points.map(p=>p.x)), minY: Math.min(...points.map(p=>p.y)), maxY: Math.max(...points.map(p=>p.y)) } : null;
  const plotScale = bounds ? Math.min(100 / Math.max(.1,bounds.maxX-bounds.minX), 70 / Math.max(.1,bounds.maxY-bounds.minY)) : 1;
  const plot = bounds ? points.map(p=>({ x: 150 + (p.x - (bounds.minX+bounds.maxX)/2) * plotScale, y: 82 + (p.y - (bounds.minY+bounds.maxY)/2) * plotScale })) : [];
  const angleBins = Array.from({length:6},()=>0);
  encoded?.steps.forEach(step=>{ const angle=(step.turnAngleDeg+360)%360; angleBins[Math.min(5,Math.floor(angle/60))]++; });
  const lengthBins = Array.from({length:5},()=>0);
  normalized?.edgeLengths.forEach(length=>{ lengthBins[Math.min(4,Math.floor(length/.2))]++; });
  const handoff = () => { if (encoded?.symbols.length) setSimulatorSymbols(encoded.symbols); setAutomataTab('simulator'); setActiveView('automataLab'); };
  const openTraceWorkspace = () => { setIsTraceMode(true); setActiveView('sky'); };
  const openSampleTrace = () => { loadPresetTrace(REFERENCE_PATTERNS[0]); openTraceWorkspace(); };
  const matchName = recognitionReport?.bestMatch?.constellationId;
  const pattern = recognitionReport?.bestMatch && REFERENCE_PATTERNS.find(item=>item.id===recognitionReport.bestMatch?.patternId);
  const surface = 'rounded-xl border border-[var(--border-subtle,#dedfdf)] bg-[var(--bg-card,#f6f6f5)] p-4 sm:p-5';
  const histogram = (values: number[], labels: string[]) => (
    <div className="mt-4">
      <div className="flex h-28 items-end gap-2 border-b border-[var(--border-subtle,#dedfdf)] px-1">
        {values.map((count, index) => (
          <div key={index} className="flex h-full flex-1 flex-col justify-end gap-1" title={`${labels[index]}: ${count}`} aria-label={`${labels[index]}: ${count}`}>
            <span className="text-center text-[9px] tabular-nums text-[var(--ink-secondary,#565b64)]">{count}</span>
            <div className="mx-auto flex flex-col-reverse gap-1">
              {Array.from({ length: Math.min(count, 10) }, (_, dot) => <i key={dot} className="block h-1.5 w-1.5 rounded-full bg-[var(--signal-cobalt,#064bdc)]" />)}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-1 text-[9px] text-[var(--ink-secondary,#565b64)]">{labels.map(label => <span key={label}>{label}</span>)}</div>
      <p className="mt-2 text-[9px] text-[var(--ink-secondary,#565b64)]">Counts are shown above; dot stacks cap at 10.</p>
    </div>
  );
  return <div className="w-full min-w-0 font-mono text-[var(--ink-primary,#18191b)]"><div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle,#dedfdf)] pb-4"><div><p className="text-[10px] uppercase tracking-widest text-[var(--ink-secondary,#565b64)]">Trace workspace / geometry</p><h1 id="pattern-analysis-title" className="mt-1 text-xl font-normal sm:text-2xl">Pattern analysis</h1><p className="mt-1 text-xs text-[var(--ink-secondary,#565b64)]">Measures below describe the current trace geometry. They are not recognition accuracy scores.</p></div><button onClick={onClose} className="rounded-md border border-[var(--border-subtle,#dedfdf)] px-3 py-2 text-xs hover:bg-white" aria-label="Close pattern analysis">Close</button></header>
      {!hasTrace || !encoded || !normalized ? <section className={surface}><h2 className="text-sm">A trace is needed</h2><p className="mt-2 text-xs text-[var(--ink-secondary,#565b64)]">Select at least two points to calculate normalized geometry and encoded turns.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={openTraceWorkspace} className="rounded-md border border-[var(--border-subtle,#dedfdf)] px-4 py-2 text-xs">Open trace workspace</button><button onClick={openSampleTrace} className="rounded-md bg-[var(--signal-cobalt,#064bdc)] px-4 py-2 text-xs text-white">Load sample trace</button></div></section> : <>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><article className={surface}><p className="text-[10px] text-[#565b64]">TRACE POINTS</p><p className="mt-3 text-3xl tabular-nums">{tracedPoints.length}</p></article><article className={surface}><p className="text-[10px] text-[#565b64]">ENCODED SYMBOLS</p><p className="mt-3 text-3xl tabular-nums">{encoded.symbols.length}</p></article><article className={surface}><p className="text-[10px] text-[#565b64]">MEAN NORMALIZED EDGE</p><p className="mt-3 text-3xl tabular-nums">{meanEdge?.toFixed(3) ?? '—'}</p></article><article className={surface}><p className="text-[10px] text-[#565b64]">GEOMETRIC RESIDUAL</p><p className="mt-3 text-3xl tabular-nums">{recognitionReport?.bestMatch?.residual.toFixed(4) ?? '—'}</p><p className="mt-1 text-[10px] text-[#565b64]">{matchName ?? 'No recognized candidate'}</p></article></section>
        <section className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
          <article className={surface}>
            <h2 className="text-sm">Normalized trace</h2>
            <p className="mt-1 text-[10px] text-[#565b64]">Scale and translation removed for shape comparison</p>
            <div className="mt-3 overflow-hidden rounded-lg bg-[#18191b] p-2">
              <svg viewBox="0 0 300 164" className="w-full" role="img" aria-label="Normalized current trace">
                <defs><pattern id="analysis-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#565b64" /></pattern></defs>
                <rect width="300" height="164" fill="url(#analysis-dots)" />
                {plot.length > 1 && <>
                  <polyline points={plot.map(point => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#4e83ff" strokeWidth="2" strokeLinejoin="round" />
                  {plot.map((point, index) => <circle key={index} cx={point.x} cy={point.y} r="3" fill="white" />)}
                </>}
              </svg>
            </div>
            {pattern && <p className="mt-2 text-xs text-[#565b64]">Compared candidate: {pattern.name} ({pattern.id})</p>}
          </article>
          <article className={surface}>
            <h2 className="text-sm">Turn angle distribution</h2>
            <p className="mt-1 text-[10px] text-[#565b64]">60° bins · {encoded.steps.length} turns</p>
            {histogram(angleBins, ['0°', '60°', '120°', '180°', '240°', '300°'])}
            <h3 className="mt-6 text-sm">Normalized edge lengths</h3>
            {histogram(lengthBins, ['0–.2', '.2–.4', '.4–.6', '.6–.8', '≥0.8'])}
          </article>
        </section>
        <section className={surface}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm">Candidate patterns</h2>
            <span className="text-[10px] text-[var(--ink-secondary,#565b64)]">Lower geometric residual indicates closer fit</span>
          </div>
          {recognitionReport?.geometricScores.length ? (
            <div className="mt-3 divide-y divide-[var(--border-subtle,#dedfdf)]">
              {recognitionReport.geometricScores.slice(0, 5).map((candidate, index) => (
                <div key={candidate.patternId} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3 text-xs">
                  <span className="text-[var(--ink-secondary,#565b64)]">{String(index + 1).padStart(2, '0')}</span>
                  <span>{candidate.patternName}<span className="ml-2 text-[var(--ink-secondary,#565b64)]">{candidate.constellationId}</span>{candidate.isVerified && <span className="ml-2 text-[var(--ink-secondary,#565b64)]">· verified</span>}</span>
                  <span className="tabular-nums">{candidate.residual.toFixed(4)}</span>
                </div>
              ))}
            </div>
          ) : <p className="mt-3 text-xs text-[var(--ink-secondary,#565b64)]">No geometric candidate scores are available for this trace.</p>}
        </section>
        <section className={surface}><h2 className="text-sm">Encoded sequence</h2><p className="mt-1 text-[10px] text-[#565b64]">Turn and distance categories from the current point order</p><div className="mt-3 flex flex-wrap gap-2">{encoded.steps.map((step,index)=><span key={index} className="rounded-md border border-[#dedfdf] bg-white px-2.5 py-2 text-xs"><span className="text-[#064bdc]">{step.turnCategory}</span><span className="px-2 text-[#565b64]">/</span>{step.distanceCategory}</span>)}</div>{!encoded.steps.length&&<p className="mt-2 text-xs text-[#565b64]">No encoded steps are available for this trace.</p>}<div className="mt-4 flex justify-end"><button onClick={handoff} disabled={!encoded.symbols.length} className="rounded-md bg-[#064bdc] px-4 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40">Open sequence in Automata Lab</button></div></section>
      </>}
    </div></div>;
};
