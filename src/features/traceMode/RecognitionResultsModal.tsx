import React from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { REFERENCE_PATTERNS } from '../../data/astroData';

interface RecognitionResultsModalProps { onClose: () => void }

export const RecognitionResultsModal: React.FC<RecognitionResultsModalProps> = ({ onClose }) => {
  const { recognitionReport: report, tracedStarIds, tracedPoints, setSimulatorSymbols, setAutomataTab, setActiveView, loadPresetTrace, setIsTraceMode } = useAstroStore();
  const handoff = () => {
    if (report?.inputSymbols.length) setSimulatorSymbols(report.inputSymbols);
    setAutomataTab('simulator'); setActiveView('automataLab');
  };
  const openSampleTrace = () => { loadPresetTrace(REFERENCE_PATTERNS[0]); setIsTraceMode(true); setActiveView('sky'); onClose(); };
  const exportReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify({ timestamp: new Date().toISOString(), tracedStarIds, tracedPoints, recognitionReport: report }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `costellar-recognition-${Date.now()}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const match = report?.bestMatch;
  const pattern = match && REFERENCE_PATTERNS.find(item => item.id === match.patternId);
  const points = tracedPoints.length ? tracedPoints : (pattern?.referencePoints ?? []);
  const normalized = (() => {
    if (!points.length) return [];
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const scale = Math.min(250 / Math.max(1, maxX - minX), 140 / Math.max(1, maxY - minY));
    return points.map(p => ({ x: 150 + (p.x - (minX + maxX) / 2) * scale, y: 90 + (p.y - (minY + maxY) / 2) * scale }));
  })();
  const residual = match?.residual;
  const statusLabel = report?.status === 'FULL_MATCH' ? 'Pattern accepted' : report?.status === 'VALID_PREFIX' ? 'Valid prefix' : report?.status === 'GEOMETRIC_REJECT' ? 'Geometry rejected' : report?.status === 'SYMBOLIC_REJECT' ? 'Sequence rejected' : 'No recognition report';
  const surface = 'rounded-xl border border-[#dedfdf] bg-[#f6f6f5] p-4 sm:p-5';
  return <div className="w-full min-w-0 font-mono text-[#18191b]"><div className="mx-auto w-full max-w-6xl space-y-4 p-3 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[#dedfdf] pb-4"><div><p className="text-[10px] uppercase tracking-widest text-[#565b64]">Trace workspace / report</p><h1 id="recognition-results-title" className="mt-1 text-xl font-normal sm:text-2xl">Recognition result</h1><p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#565b64]">{report?.explanation ?? 'Run recognition on a trace to produce a report.'}</p></div><button onClick={onClose} className="rounded-md border border-[#dedfdf] px-3 py-2 text-xs hover:bg-white" aria-label="Close recognition results">Close</button></header>
      {!report ? <section className={surface}><h2 className="text-sm">No report available</h2><p className="mt-2 text-xs text-[#565b64]">Add at least two points and run recognition. No sample result is substituted for your trace.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={onClose} className="rounded-md border border-[#dedfdf] px-4 py-2 text-xs">Return to trace</button><button onClick={openSampleTrace} className="rounded-md bg-[#064bdc] px-4 py-2 text-xs text-white">Load sample trace</button></div></section> : <>
        <section className="grid gap-3 lg:grid-cols-[1.3fr_1fr]">
          <div className={surface}><p className="text-[10px] uppercase tracking-wider text-[#565b64]">Recognition state</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl sm:text-3xl">{match?.constellationId ?? statusLabel}</h2>{match && <p className="mt-1 text-xs text-[#565b64]">{match.patternName} · {match.patternId}</p>}</div>{residual !== undefined && <div><p className="text-[10px] text-[#565b64]">GEOMETRIC RESIDUAL</p><p className="text-2xl">{residual.toFixed(4)}</p></div>}</div><p className="mt-4 border-t border-[#dedfdf] pt-3 text-xs">{statusLabel} <span className="px-2 text-[#565b64]">·</span> DFA {report.dfaAccepted ? 'accepted' : 'rejected'} <span className="px-2 text-[#565b64]">·</span> {report.inputSymbols.length} symbols</p></div>
          <div className={`${surface} flex min-h-44 items-center justify-center overflow-hidden bg-[#18191b]`}><svg viewBox="0 0 300 180" className="h-full max-h-52 w-full" role="img" aria-label="Trace geometry preview"><defs><pattern id="result-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#565b64" /></pattern></defs><rect width="300" height="180" fill="url(#result-dots)"/>{normalized.length > 1 && <><polyline points={normalized.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#4e83ff" strokeWidth="2" strokeLinejoin="round"/>{normalized.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill="#fff" />)}</>}</svg></div>
        </section>
        <section className={surface}><div className="flex items-center justify-between gap-2"><h2 className="text-sm">Candidate patterns</h2><span className="text-[10px] text-[#565b64]">Residual is lower for closer geometric fit</span></div>{report.geometricScores.length ? <div className="mt-3 divide-y divide-[#dedfdf]">{report.geometricScores.slice(0,5).map((candidate,index)=><div key={candidate.patternId} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3 text-xs"><span className="text-[#565b64]">{String(index+1).padStart(2,'0')}</span><span>{candidate.patternName}<span className="ml-2 text-[#565b64]">{candidate.constellationId}</span>{candidate.isVerified && <span className="ml-2 text-[#565b64]">· verified reference</span>}</span><span className="tabular-nums">{candidate.residual.toFixed(4)}</span></div>)}</div> : <p className="mt-3 text-xs text-[#565b64]">No geometric candidates were returned.</p>}</section>
        <section className={`${surface} flex flex-wrap items-center justify-between gap-3`}><div><h2 className="text-sm">Automata input</h2><p className="mt-1 text-xs text-[#565b64]">{report.inputSymbols.length ? report.inputSymbols.join(' · ') : 'This report contains no symbols to simulate.'}</p></div><div className="flex flex-wrap gap-2"><button onClick={exportReport} className="rounded-md border border-[#dedfdf] px-4 py-2 text-xs hover:bg-white">Export JSON</button><button onClick={handoff} disabled={!report.inputSymbols.length} className="rounded-md bg-[#064bdc] px-4 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40">Open in Automata Lab</button></div></section>
      </>}
    </div></div>;
};
