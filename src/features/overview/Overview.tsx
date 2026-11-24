import React, { useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATIONS, CONSTELLATION_BY_ID, REFERENCE_PATTERNS, STAR_BY_ID } from '../../data/astroData';
import { getHorizontalCoordinates } from '../../astronomy/coordinates';

const HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2];
const HOUR_LABELS = ['18', '19', '20', '21', '22', '23', '00', '01', '02'];
const FEATURED = [
  { id: 'Ori', name: 'Orion' }, { id: 'UMa', name: 'Ursa Major' },
  { id: 'Cas', name: 'Cassiopeia' }, { id: 'Cyg', name: 'Cygnus' },
  { id: 'Sco', name: 'Scorpius' },
];
const SAMPLE_IDS = ['Ori_fwd', 'UMa_dipper', 'Cas_fwd', 'Cyg_fwd', 'Sco_fwd'];

const PatternPreview: React.FC<{ id: string; name: string; onSelect: (id: string) => void }> = ({ id, name, onSelect }) => {
  const constellation = CONSTELLATION_BY_ID.get(id);
  const nodes = useMemo(() => {
    if (!constellation) return [];
    const cosDec = Math.cos(constellation.decCenter * Math.PI / 180);
    const coords = constellation.starIds.flatMap(starId => {
      const star = STAR_BY_ID.get(starId);
      if (!star) return [];
      let deltaRa = star.ra - constellation.raCenter;
      while (deltaRa > 180) deltaRa -= 360;
      while (deltaRa < -180) deltaRa += 360;
      return [{ starId, x: -deltaRa * cosDec, y: -(star.dec - constellation.decCenter) }];
    });
    if (!coords.length) return [];
    const minX = Math.min(...coords.map(point => point.x));
    const maxX = Math.max(...coords.map(point => point.x));
    const minY = Math.min(...coords.map(point => point.y));
    const maxY = Math.max(...coords.map(point => point.y));
    const scale = Math.min(34 / Math.max(maxX - minX, 0.5), 30 / Math.max(maxY - minY, 0.5));
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    return coords.map(point => ({ ...point, x: 40 + (point.x - midX) * scale, y: 24 + (point.y - midY) * scale }));
  }, [constellation]);
  const nodeById = new Map(nodes.map(node => [node.starId, node]));
  return <button onClick={() => onSelect(id)} className="flex min-w-0 flex-col rounded-md border border-[var(--bg-tray)] p-2 text-left hover:border-[var(--signal-cobalt)]" aria-label={`Focus ${name} in sky`}>
    <svg viewBox="0 0 80 48" className="h-12 w-full" aria-hidden="true">
      {constellation?.lineSegments.map((segment, index) => {
        const a = nodeById.get(segment.starId1); const b = nodeById.get(segment.starId2);
        return a && b ? <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--signal-cobalt)" strokeWidth="1.1" opacity=".75" /> : null;
      })}
      {nodes.map(node => <circle key={node.starId} cx={node.x} cy={node.y} r="1.6" fill="var(--signal-cobalt)" />)}
    </svg>
    <span className="truncate text-[9px] text-[var(--ink-secondary)]">{name}</span>
  </button>;
};

const DotPlot: React.FC<{ values: number[]; labels: string[]; max: number; active: number }> = ({ values, labels, max, active }) => (
  <div className="flex min-h-[170px] flex-1 items-end justify-around gap-2 border-b border-[var(--bg-tray)] px-1 pb-2 pt-3">
    {values.map((value, col) => <div key={labels[col]} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
      <div className="flex min-h-0 flex-1 flex-col-reverse justify-start gap-[3px]" role="img" aria-label={`${labels[col]} UTC: ${value} constellation centers above the horizon`}>
        {Array.from({ length: Math.ceil(Math.min(value, max) / 5) }, (_, level) => <span key={level} className="grid grid-cols-5 gap-[3px]">
          {Array.from({ length: 5 }, (_, dot) => <span key={dot} className={`h-[4px] w-[4px] rounded-full ${col === active ? 'bg-[var(--signal-cobalt)]' : 'bg-[#c9cdd4]'}`} />)}
        </span>)}
      </div>
      <span className="text-[9px] tracking-wide text-[var(--ink-muted)]">{labels[col]}</span>
    </div>)}
  </div>
);

export const Overview: React.FC = () => {
  const { observer, observationDate, setActiveView, focusOnConstellation, recognitionReport, loadPresetTrace, tracedPoints } = useAstroStore();

  const eveningSamples = useMemo(() => {
    const eveningStart = new Date(observationDate);
    eveningStart.setUTCHours(0, 0, 0, 0);
    if (observationDate.getUTCHours() < 5) eveningStart.setUTCDate(eveningStart.getUTCDate() - 1);
    return HOURS.map(hour => {
      const date = new Date(eveningStart);
      date.setUTCHours(hour, 0, 0, 0);
      if (hour < 18) date.setUTCDate(date.getUTCDate() + 1);
      return date;
    });
  }, [observationDate]);

  const visibility = useMemo(() => eveningSamples.map(date => {
    return CONSTELLATIONS.filter(con => getHorizontalCoordinates(con.raCenter, con.decCenter, observer, date).isAboveHorizon).length;
  }), [observer, eveningSamples]);
  const visibleNow = useMemo(() => CONSTELLATIONS.filter(con => getHorizontalCoordinates(con.raCenter, con.decCenter, observer, observationDate).isAboveHorizon).length, [observer, observationDate]);
  const matrix = useMemo(() => FEATURED.map(item => ({ ...item, visible: eveningSamples.map(date => {
    const con = CONSTELLATION_BY_ID.get(item.id);
    if (!con) return false;
    return getHorizontalCoordinates(con.raCenter, con.decCenter, observer, date).isAboveHorizon;
  }) })), [observer, eveningSamples]);
  const samples = useMemo(() => SAMPLE_IDS.map(id => REFERENCE_PATTERNS.find(p => p.id === id)).filter((p): p is (typeof REFERENCE_PATTERNS)[number] => Boolean(p)), []);
  const maximum = Math.max(...visibility, 1);
  const status = recognitionReport ? ({ FULL_MATCH: 'FULL MATCH', VALID_PREFIX: 'VALID PREFIX', SYMBOLIC_REJECT: 'DFA REJECT', GEOMETRIC_REJECT: 'GEOMETRY REJECT' } as const)[recognitionReport.status] : 'NO RESULT';
  const location = `${Math.abs(observer.latitude).toFixed(1)}° ${observer.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(observer.longitude).toFixed(1)}° ${observer.longitude >= 0 ? 'E' : 'W'}`;
  const goToConstellation = (id: string) => { focusOnConstellation(id); setActiveView('sky'); };
  const loadSample = (patternId: string) => { const pattern = REFERENCE_PATTERNS.find(p => p.id === patternId); if (pattern) loadPresetTrace(pattern); };
  const labelClass = 'text-[10px] font-semibold tracking-[0.12em] text-[var(--ink-secondary)]';
  const panelClass = 'bento-card min-w-0 rounded-[18px] bg-[var(--bg-card)] p-3 sm:p-3';

  return <div className="h-full w-full select-none overflow-y-auto bg-[var(--bg-tray)] p-3 text-[var(--ink-primary)] sm:p-4 lg:p-5">
    <div className="mx-auto flex min-h-full max-w-[1560px] flex-col gap-3 sm:gap-4">
      <section aria-label="Overview metrics" className="grid grid-cols-2 gap-3 xl:grid-cols-4 sm:gap-4">
        <button onClick={() => setActiveView('tonight')} className={`${panelClass} flex min-h-[112px] flex-col justify-between text-left transition-colors hover:border-[var(--signal-cobalt)]`}>
          <span className={labelClass}>VISIBLE CONSTELLATIONS</span>
          <span className="font-mono text-3xl font-normal tracking-tight sm:text-4xl">{visibleNow}<small className="ml-2 text-base text-[var(--ink-muted)]">/ {CONSTELLATIONS.length}</small></span>
          <span className="text-[9px] tracking-wide text-[var(--ink-muted)]">ABOVE HORIZON · {location}</span>
        </button>
        <button onClick={() => setActiveView('constellations')} className={`${panelClass} flex min-h-[112px] flex-col justify-between text-left transition-colors hover:border-[var(--signal-cobalt)]`}>
          <span className={labelClass}>REFERENCE PATTERNS</span>
          <span className="font-mono text-3xl font-normal tracking-tight sm:text-4xl">{REFERENCE_PATTERNS.length}</span>
          <span className="text-[9px] tracking-wide text-[var(--ink-muted)]">AVAILABLE IN THE LIBRARY</span>
        </button>
        <button onClick={() => setActiveView('results')} className={`${panelClass} flex min-h-[112px] flex-col justify-between text-left transition-colors hover:border-[var(--signal-cobalt)]`}>
          <span className={labelClass}>LATEST RECOGNITION</span>
          <span className="font-mono text-2xl font-normal tracking-tight text-[var(--signal-cobalt)] sm:text-3xl">{status}</span>
          <span className="truncate text-[9px] tracking-wide text-[var(--ink-muted)]">{recognitionReport?.bestMatch?.patternName ?? 'NO RECOGNITION RESULT'}</span>
        </button>
        <button onClick={() => setActiveView('sky')} className={`${panelClass} flex min-h-[112px] flex-col justify-between text-left transition-colors hover:border-[var(--signal-cobalt)]`}>
          <span className={labelClass}>CURRENT TRACE</span>
          <span className="font-mono text-3xl font-normal tracking-tight sm:text-4xl">{tracedPoints.length}<small className="ml-2 text-sm text-[var(--ink-muted)]">POINTS</small></span>
          <span className="text-[9px] tracking-wide text-[var(--ink-muted)]">{tracedPoints.length ? 'IN PROGRESS OR LAST TRACE' : 'NO POINTS RECORDED'}</span>
        </button>
      </section>

      <section aria-label="Sky visibility charts" className="grid grid-cols-1 gap-3 lg:grid-cols-2 sm:gap-4">
        <article className={`${panelClass} flex min-h-[350px] flex-col lg:h-[min(39vh,390px)]`}>
          <header className="flex items-start justify-between gap-3 border-b border-[var(--bg-tray)] pb-2">
            <div><h2 className={labelClass}>VISIBLE SKY THROUGH THE EVENING</h2><p className="mt-1 text-[10px] text-[var(--ink-muted)]">Constellation centers above the horizon · UTC</p></div>
            <span className="shrink-0 font-mono text-[10px] text-[var(--ink-secondary)]">{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(eveningSamples[0])}</span>
          </header>
          <div className="mt-3 flex items-baseline gap-2"><span className="font-mono text-3xl">{Math.max(...visibility)}</span><span className="text-[10px] text-[var(--ink-muted)]">PEAK OF {CONSTELLATIONS.length} AT SAMPLED HOURS</span></div>
          <DotPlot values={visibility} labels={HOUR_LABELS} max={CONSTELLATIONS.length} active={visibility.indexOf(maximum)} />
        </article>

        <article className={`${panelClass} flex min-h-[350px] flex-col lg:h-[min(39vh,390px)]`}>
          <header className="flex items-start justify-between gap-3 border-b border-[var(--bg-tray)] pb-2">
            <div><h2 className={labelClass}>TONIGHT VISIBILITY</h2><p className="mt-1 text-[10px] text-[var(--ink-muted)]">Featured constellations · {location}</p></div>
            <button onClick={() => setActiveView('tonight')} className="text-[10px] font-semibold tracking-wide text-[var(--signal-cobalt)] hover:underline">FULL VIEW ↗</button>
          </header>
          <div className="mt-3 flex items-baseline gap-2"><span className="font-mono text-3xl">{visibleNow}</span><span className="text-[10px] text-[var(--ink-muted)]">CONSTELLATIONS VISIBLE NOW</span></div>
          <div className="mt-2 flex flex-1 flex-col justify-center gap-1">
            {matrix.map(row => <button key={row.id} onClick={() => goToConstellation(row.id)} title={`Focus ${row.name} in the sky`} className="group flex items-center gap-3 rounded-md px-1 py-1 text-left hover:bg-[var(--bg-card-subtle)]">
              <span className="grid w-[90px] shrink-0 grid-cols-[32px_1fr] items-center text-[9px] text-[var(--ink-muted)]"><b className="font-mono text-[11px] text-[var(--ink-primary)] group-hover:text-[var(--signal-cobalt)]">{row.id.toUpperCase()}</b><span className="truncate">{row.name}</span></span>
              <span className="grid min-w-0 flex-1 grid-cols-9 justify-items-center" aria-label={`${row.name} hourly visibility`}>
                {row.visible.map((on, i) => <span key={i} title={`${HOUR_LABELS[i]}:00 UTC · ${on ? 'above' : 'below'} horizon`} className={`h-[6px] w-[6px] rounded-full sm:h-[7px] sm:w-[7px] ${on ? 'bg-[var(--signal-cobalt)]' : 'bg-[#c9cdd4]'}`} />)}
              </span>
            </button>)}
          </div>
          <div className="mt-2 flex border-t border-[var(--bg-tray)] pt-2 text-[8px] text-[var(--ink-muted)]"><span className="w-[90px] shrink-0"/><span className="grid min-w-0 flex-1 grid-cols-9 justify-items-center">{HOUR_LABELS.map((h, i) => <span key={i}>{i % 2 === 0 ? h : ''}</span>)}</span></div>
        </article>
      </section>

      <section aria-label="Quick access" className="grid grid-cols-1 gap-3 md:grid-cols-3 sm:gap-4">
        <article className={`${panelClass} flex min-h-[270px] flex-col`}>
          <div className="flex items-center justify-between"><h2 className={labelClass}>LOAD A REFERENCE TRACE</h2><button onClick={() => setActiveView('sky')} className="text-[10px] text-[var(--signal-cobalt)]">OPEN SKY ↗</button></div>
          <div className="mt-3 grid flex-1 grid-cols-2 gap-2">
            {samples.slice(0, 4).map(pattern => <button key={pattern.id} onClick={() => loadSample(pattern.id)} className="rounded-md border border-[var(--bg-tray)] px-2 py-2 text-left text-[10px] hover:border-[var(--signal-cobalt)] hover:text-[var(--signal-cobalt)]">{pattern.name}<span className="ml-1 text-[var(--ink-muted)]">{pattern.constellationId}</span></button>)}
          </div>
        </article>
        <article className={`${panelClass} flex min-h-[270px] flex-col`}>
          <div className="flex items-center justify-between"><h2 className={labelClass}>CONSTELLATION LIBRARY</h2><button onClick={() => setActiveView('constellations')} className="text-[10px] text-[var(--signal-cobalt)]">VIEW ALL ↗</button></div>
          <div className="mt-3 grid flex-1 grid-cols-3 gap-2">
            {FEATURED.slice(0, 3).map(item => <PatternPreview key={item.id} id={item.id} name={item.name} onSelect={goToConstellation} />)}
          </div>
        </article>
        <button onClick={() => setActiveView('automataLab')} className={`${panelClass} flex min-h-[270px] flex-col text-left hover:border-[var(--signal-cobalt)]`}>
          <div className="flex items-center justify-between"><h2 className={labelClass}>AUTOMATON RESULT</h2><span className="text-[10px] text-[var(--signal-cobalt)]">OPEN LAB ↗</span></div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-b border-[var(--bg-tray)] pb-3">
            <div><span className="block text-[9px] text-[var(--ink-muted)]">SYMBOLIC DFA</span><span className="font-mono text-sm">{recognitionReport ? (recognitionReport.dfaAccepted ? 'ACCEPT' : 'REJECT') : '—'}</span></div>
            <div><span className="block text-[9px] text-[var(--ink-muted)]">GEOMETRY</span><span className="font-mono text-sm">{recognitionReport ? (recognitionReport.status === 'GEOMETRIC_REJECT' ? 'REJECT' : recognitionReport.bestMatch?.isVerified ? 'MATCH' : 'N/A') : '—'}</span></div>
          </div>
          <div className="mt-2 flex items-end justify-between"><div><span className="block text-[9px] text-[var(--ink-muted)]">FINAL STATE</span><span className="font-mono text-2xl">{recognitionReport?.finalState ?? '—'}</span></div><span className="font-mono text-xs text-[var(--signal-cobalt)]">{status}</span></div>
          <span className="mt-auto pt-2 text-[9px] text-[var(--ink-muted)]">{recognitionReport ? `${recognitionReport.inputSymbols.length} INPUT SYMBOLS` : 'RUN A TRACE TO SEE ITS RESULT'}</span>
        </button>
      </section>
    </div>
  </div>;
};
