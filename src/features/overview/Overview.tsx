import React, { useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATIONS, CONSTELLATION_BY_ID, REFERENCE_PATTERNS, STAR_BY_ID } from '../../data/astroData';
import { getHorizontalCoordinates } from '../../astronomy/coordinates';
import { Button } from '../../components/ui/space/button';
import { Button as BoardButton } from '../../components/ui/board/base/buttons/button';
import { Chip } from '../../components/ui/board/base/badges/chip';
import { PageHeader } from '../../components/PageHeader';

const HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2];
const HOUR_LABELS = ['18', '19', '20', '21', '22', '23', '00', '01', '02'];
const FEATURED = [
  { id: 'Ori', name: 'Orion' },
  { id: 'UMa', name: 'Ursa Major' },
  { id: 'Cas', name: 'Cassiopeia' },
  { id: 'Cyg', name: 'Cygnus' },
  { id: 'Sco', name: 'Scorpius' },
];
const SAMPLE_IDS = ['Ori_fwd', 'UMa_dipper', 'Cas_fwd', 'Cyg_fwd'];

const PatternPreview: React.FC<{ id: string; name: string; onSelect: (id: string) => void }> = ({ id, name, onSelect }) => {
  const constellation = CONSTELLATION_BY_ID.get(id);
  const nodes = useMemo(() => {
    if (!constellation) return [];
    const cosDec = Math.cos((constellation.decCenter * Math.PI) / 180);
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

  return (
    <BoardButton
      variant="ghost"
      onClick={() => onSelect(id)}
      className="h-auto min-h-[112px] w-full min-w-0 flex-col items-stretch rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-viewport)] p-2.5 text-left font-normal hover:border-[var(--signal-cobalt)]"
      aria-label={`Focus ${name} in sky`}
    >
      <span className="flex w-full flex-col items-stretch">
        <svg viewBox="0 0 80 48" className="h-16 w-full" aria-hidden="true">
          {constellation?.lineSegments.map((segment, index) => {
            const a = nodeById.get(segment.starId1);
            const b = nodeById.get(segment.starId2);
            return a && b ? <line key={index} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--signal-mid)" strokeWidth="1.2" opacity=".85" /> : null;
          })}
          {nodes.map(node => (
            <circle key={node.starId} cx={node.x} cy={node.y} r="1.6" fill="var(--ink-primary)" />
          ))}
        </svg>
        <span className="mt-1 flex items-baseline justify-between gap-1 text-[11px]">
          <span className="truncate font-medium text-[var(--ink-primary)]">{name}</span>
          <span className="font-mono text-[10px] text-[var(--ink-muted)] uppercase">{id}</span>
        </span>
      </span>
    </BoardButton>
  );
};

const DotPlot: React.FC<{ values: number[]; labels: string[]; max: number; active: number }> = ({ values, labels, max, active }) => (
  <div className="flex h-[116px] shrink-0 items-end justify-around gap-2 border-b border-[var(--border-subtle)] px-1 pb-2 pt-3">
    {values.map((value, col) => (
      <div key={labels[col]} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
        <span className="font-mono text-[9px] tabular-nums text-[var(--ink-muted)]">{value}</span>
        <div
          className="flex min-h-0 flex-1 flex-col-reverse justify-start gap-[3px]"
          role="img"
          aria-label={`${labels[col]} UTC: ${value} constellation centers above the horizon`}
        >
          {Array.from({ length: Math.ceil(Math.min(value, max) / 5) }, (_, level) => (
            <span key={level} className="grid grid-cols-5 gap-[3px]">
              {Array.from({ length: 5 }, (_, dot) => (
                <span
                  key={dot}
                  className={`h-[4px] w-[4px] rounded-full ${col === active ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'}`}
                />
              ))}
            </span>
          ))}
        </div>
        <span className="font-mono text-[10px] tracking-wide text-[var(--ink-secondary)]">{labels[col]}h</span>
      </div>
    ))}
  </div>
);

export const Overview: React.FC = () => {
  const observer = useAstroStore(state => state.observer);
  const observationDate = useAstroStore(state => state.observationDate);
  const setActiveView = useAstroStore(state => state.setActiveView);
  const focusOnConstellation = useAstroStore(state => state.focusOnConstellation);
  const recognitionReport = useAstroStore(state => state.recognitionReport);
  const loadPresetTrace = useAstroStore(state => state.loadPresetTrace);
  const tracedPoints = useAstroStore(state => state.tracedPoints);
  const setIsTraceMode = useAstroStore(state => state.setIsTraceMode);

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

  const visibility = useMemo(
    () =>
      eveningSamples.map(date =>
        CONSTELLATIONS.filter(con => getHorizontalCoordinates(con.raCenter, con.decCenter, observer, date).isAboveHorizon).length
      ),
    [observer, eveningSamples]
  );

  const visibleNow = useMemo(
    () => CONSTELLATIONS.filter(con => getHorizontalCoordinates(con.raCenter, con.decCenter, observer, observationDate).isAboveHorizon).length,
    [observer, observationDate]
  );

  const matrix = useMemo(
    () =>
      FEATURED.map(item => ({
        ...item,
        visible: eveningSamples.map(date => {
          const con = CONSTELLATION_BY_ID.get(item.id);
          if (!con) return false;
          return getHorizontalCoordinates(con.raCenter, con.decCenter, observer, date).isAboveHorizon;
        }),
      })),
    [observer, eveningSamples]
  );

  const samples = useMemo(
    () => SAMPLE_IDS.map(id => REFERENCE_PATTERNS.find(p => p.id === id)).filter((p): p is (typeof REFERENCE_PATTERNS)[number] => Boolean(p)),
    []
  );

  const maximum = Math.max(...visibility, 1);
  const status = recognitionReport
    ? ({
        FULL_MATCH: 'Full match',
        VALID_PREFIX: 'Valid prefix',
        SYMBOLIC_REJECT: 'DFA reject',
        GEOMETRIC_REJECT: 'Geometry reject',
      } as const)[recognitionReport.status]
    : 'Awaiting trace';
  const location = `${Math.abs(observer.latitude).toFixed(1)}° ${observer.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(observer.longitude).toFixed(1)}° ${observer.longitude >= 0 ? 'E' : 'W'}`;

  const goToConstellation = (id: string) => {
    focusOnConstellation(id);
    setActiveView('sky');
  };

  const loadSample = (patternId: string) => {
    const pattern = REFERENCE_PATTERNS.find(p => p.id === patternId);
    if (pattern) loadPresetTrace(pattern);
  };

  const openPlanetarium = () => {
    useAstroStore.setState({ isTraceMode: false });
    setActiveView('sky');
  };

  const openTrace = () => {
    setIsTraceMode(true);
    setActiveView('sky');
  };

  return (
    <div className="boardui-surface mx-auto flex w-full max-w-[1440px] flex-col gap-6 font-sans text-[var(--ink-primary)] select-none">
      {/* 1. Primary Observatory Landing Header */}
      <PageHeader
        eyebrow={`Observing site · ${observer.name}`}
        title="Tonight’s sky"
        meta={`${location} · ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(observationDate)} UTC`}
        description="Horizon positions are calculated for this observing site and the selected time. Choose a target to open it in the planetarium."
        actions={
          <>
            <BoardButton variant="primary" size="small" onClick={openPlanetarium}>
              Open planetarium
            </BoardButton>
            <BoardButton variant="secondary" size="small" onClick={openTrace}>
              Trace asterism
            </BoardButton>
          </>
        }
      >
        {/* Concise Inline Telemetry Strip (no repeated card boxes) */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 sm:grid-cols-4">
          <div className="flex flex-col">
            <dt className="text-[11px] text-[var(--ink-muted)]">Visible now</dt>
            <dd className="mt-0.5 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-xl font-semibold text-[var(--ink-primary)]">{visibleNow}</span>
              <span className="text-xs text-[var(--ink-muted)]">/ {CONSTELLATIONS.length} IAU</span>
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-[11px] text-[var(--ink-muted)]">Reference patterns</dt>
            <dd className="mt-0.5 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-xl font-semibold text-[var(--ink-primary)]">{REFERENCE_PATTERNS.length}</span>
              <span className="text-xs text-[var(--ink-muted)]">encoded DFAs</span>
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-[11px] text-[var(--ink-muted)]">Current trace</dt>
            <dd className="mt-0.5 flex items-baseline gap-1.5 font-mono tabular-nums">
              <span className="text-xl font-semibold text-[var(--ink-primary)]">{tracedPoints.length}</span>
              <span className="text-xs text-[var(--ink-muted)]">points</span>
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-[11px] text-[var(--ink-muted)]">Recognition state</dt>
            <dd className="mt-0.5 flex items-baseline gap-1.5 font-mono">
              <Chip
                variant="bold"
                color={!recognitionReport ? 'neutral' : recognitionReport.status === 'FULL_MATCH' ? 'blue' : recognitionReport.status === 'VALID_PREFIX' ? 'yellow' : 'rose'}
              >
                {status}
              </Chip>
            </dd>
          </div>
        </dl>
      </PageHeader>

      {/* 2. Dominant Atlas Composition: Tonight Featured Strip + Evening Peak Curve */}
      <section aria-label="Nightly visibility atlas" className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left: Dominant Tonight Target Matrix & Featured Asterisms */}
        <div className="atlas-surface flex flex-col justify-between p-4 sm:p-5 lg:col-span-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--ink-primary)]">Tonight visibility window</h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                Featured constellations from 18:00 to 02:00 UTC · click any constellation to focus on the sky stage
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="link" size="xs" onClick={() => setActiveView('tonight')} className="h-auto p-0 text-xs font-semibold text-[var(--signal-mid)]">
                Full 88 planner →
              </Button>
            </div>
          </div>

          {/* Hourly Featured Matrix */}
          <div className="mt-3 space-y-1">
            {matrix.map(row => (
              <Button
                variant="ghost"
                key={row.id}
                onClick={() => goToConstellation(row.id)}
                title={`Focus ${row.name} in the sky`}
                className="group h-auto w-full justify-start gap-3 rounded-md px-2 py-1.5 text-left font-normal hover:bg-[var(--bg-card-subtle)]"
              >
                <span className="grid w-[112px] shrink-0 grid-cols-[34px_1fr] items-center text-xs text-[var(--ink-secondary)]">
                  <b className="font-mono text-[11px] text-[var(--signal-mid)]">{row.id.toUpperCase()}</b>
                  <span className="truncate font-medium group-hover:text-[var(--ink-primary)]">{row.name}</span>
                </span>
                <span className="grid min-w-0 flex-1 grid-cols-9 justify-items-center" aria-label={`${row.name} hourly visibility`}>
                  {row.visible.map((on, i) => (
                    <span
                      key={i}
                      title={`${HOUR_LABELS[i]}:00 UTC · ${on ? 'above' : 'below'} horizon`}
                      className={`h-[7px] w-[7px] rounded-full ${on ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'}`}
                    />
                  ))}
                </span>
              </Button>
            ))}
          </div>

          <div className="mt-2 flex border-t border-[var(--border-subtle)] pt-2 font-mono text-[10px] text-[var(--ink-muted)]">
            <span className="w-[120px] shrink-0 pl-2">UTC HOUR</span>
            <span className="grid min-w-0 flex-1 grid-cols-9 justify-items-center">
              {HOUR_LABELS.map((h, i) => (
                <span key={i}>{h}</span>
              ))}
            </span>
          </div>

          {/* Quick Asterism Focus Previews */}
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ink-secondary)]">Featured asterism figures</span>
              <Button variant="link" size="xs" onClick={() => setActiveView('constellations')} className="h-auto p-0 text-xs text-[var(--signal-mid)]">
                Browse all {CONSTELLATIONS.length} →
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {FEATURED.slice(0, 3).map(item => (
                <PatternPreview key={item.id} id={item.id} name={item.name} onSelect={goToConstellation} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Hourly Horizon Density Distribution */}
        <div className="atlas-surface flex flex-col justify-between p-4 sm:p-5 lg:col-span-5">
          <div className="flex items-start justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--ink-primary)]">Constellations above horizon</h2>
              <p className="mt-0.5 text-xs text-[var(--ink-muted)]">Count of IAU constellation centers above 0° altitude</p>
            </div>
            <div className="text-right font-mono tabular-nums">
              <span className="text-2xl font-semibold text-[var(--signal-mid)]">{maximum}</span>
              <span className="block text-[10px] text-[var(--ink-muted)]">PEAK</span>
            </div>
          </div>

          <DotPlot values={visibility} labels={HOUR_LABELS} max={maximum} active={visibility.indexOf(maximum)} />

          <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-muted)]">
            <span>Highlighted bar marks tonight&apos;s peak hour</span>
            <Button variant="ghost" size="xs" onClick={() => window.dispatchEvent(new CustomEvent('costellar:open-observer'))} className="font-mono text-[11px] text-[var(--signal-mid)]">
              Change site
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Lower Editorial Split: Sample Traces & Automaton Verification State */}
      <section aria-label="Workflows and recognition state" className="grid grid-cols-1 gap-5 border-t border-[var(--border-subtle)] pt-5 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-6">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[var(--ink-primary)]">Quick reference traces</h2>
              <p className="text-xs text-[var(--ink-muted)]">Load a canonical star sequence directly into Trace Mode</p>
            </div>
            <Button variant="link" size="xs" onClick={() => setActiveView('imageLab')} className="h-auto p-0 text-xs text-[var(--signal-mid)]">
              Image Lab ↗
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {samples.map(pattern => (
              <Button
                variant="outline"
                key={pattern.id}
                onClick={() => loadSample(pattern.id)}
                className="h-auto justify-between rounded-lg border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2.5 text-left text-xs font-normal hover:border-[var(--signal-cobalt)]"
              >
                <span className="truncate font-medium text-[var(--ink-primary)]">{pattern.name}</span>
                <span className="ml-2 font-mono text-[10px] text-[var(--signal-mid)] uppercase">{pattern.constellationId}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="atlas-surface-subtle flex flex-col justify-between p-4 lg:col-span-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[var(--ink-primary)]">Trace verification</h2>
              <p className="text-xs text-[var(--ink-muted)]">Symbolic and geometric results from the latest trace</p>
            </div>
            <div className="flex items-center gap-2">
              {recognitionReport && (
                <Button variant="outline" size="xs" onClick={() => setActiveView('results')} className="text-xs">
                  Report ↗
                </Button>
              )}
              <Button variant="secondary" size="xs" onClick={() => setActiveView('automataLab')} className="text-xs text-[var(--signal-mid)]">
                Open Automata Lab →
              </Button>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-[var(--border-subtle)] pt-3 text-xs">
            <div>
              <dt className="font-mono text-[10px] uppercase text-[var(--ink-muted)]">Symbolic DFA</dt>
              <dd className="mt-1 font-mono font-semibold text-[var(--ink-primary)]">
                {recognitionReport ? (recognitionReport.dfaAccepted ? 'ACCEPT' : 'REJECT') : 'Not run'}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-[var(--ink-muted)]">Geometry</dt>
              <dd className="mt-1 font-mono font-semibold text-[var(--ink-primary)]">
                {recognitionReport ? (recognitionReport.status === 'GEOMETRIC_REJECT' ? 'REJECT' : recognitionReport.bestMatch?.isVerified ? 'MATCH' : 'PREFIX') : 'Not run'}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase text-[var(--ink-muted)]">Final state</dt>
              <dd className="mt-1 font-mono font-semibold text-[var(--signal-mid)]">
                {recognitionReport?.finalState ?? 'Not run'}
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
};
