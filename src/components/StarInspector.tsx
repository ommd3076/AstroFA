import React, { useMemo, useState } from 'react';
import { useAstroStore } from '../stores/useAstroStore';
import {
  STAR_BY_ID,
  CONSTELLATION_BY_ID,
  CONSTELLATIONS,
  REFERENCE_PATTERNS,
} from '../data/astroData';
import {
  getHorizontalCoordinates,
  bvToColorHex,
  getMeridianCulmination,
} from '../astronomy/coordinates';
import type { Star } from '../types/astronomy';
import { Button } from './ui/board/base/buttons/button';
import { Chip } from './ui/board/base/badges/chip';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from './ui/board/base/table/table';

// Map 3-letter Bayer abbreviations to Greek characters
const BAYER_GREEK: Record<string, string> = {
  Alp: 'α', Bet: 'β', Gam: 'γ', Del: 'δ', Eps: 'ε', Zet: 'ζ',
  Eta: 'η', The: 'θ', Iot: 'ι', Kap: 'κ', Lam: 'λ', Mu: 'μ',
  Nu: 'ν', Xi: 'ξ', Omi: 'ο', Pi: 'π', Rho: 'ρ', Sig: 'σ',
  Tau: 'τ', Ups: 'υ', Phi: 'φ', Chi: 'χ', Psi: 'ψ', Ome: 'ω',
};

function getAzimuthDirection(az: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const normalized = ((az % 360) + 360) % 360;
  return directions[Math.round(normalized / 22.5) % 16];
}

export const StarInspector: React.FC = () => {
  const selectedStarId = useAstroStore(state => state.selectedStarId);
  const setSelectedStarId = useAstroStore(state => state.setSelectedStarId);
  const focusedConstellationId = useAstroStore(state => state.focusedConstellationId);
  const setFocusedConstellationId = useAstroStore(state => state.setFocusedConstellationId);
  const focusOnConstellation = useAstroStore(state => state.focusOnConstellation);
  const observer = useAstroStore(state => state.observer);
  const observationDate = useAstroStore(state => state.observationDate);
  const isTraceMode = useAstroStore(state => state.isTraceMode);
  const setIsTraceMode = useAstroStore(state => state.setIsTraceMode);
  const addTracedStar = useAstroStore(state => state.addTracedStar);
  const loadPresetTrace = useAstroStore(state => state.loadPresetTrace);
  const setActiveView = useAstroStore(state => state.setActiveView);

  const [isDismissed, setIsDismissed] = useState(false);

  const activeConstellationId = focusedConstellationId || (selectedStarId ? null : 'Ori');
  const currentConstellation = activeConstellationId ? CONSTELLATION_BY_ID.get(activeConstellationId) || null : null;

  const selectedStar: Star | null = selectedStarId !== null ? STAR_BY_ID.get(selectedStarId) || null : null;
  const starHorizontal = selectedStar
    ? getHorizontalCoordinates(selectedStar.ra, selectedStar.dec, observer, observationDate)
    : null;
  const starConstellation = selectedStar?.con ? CONSTELLATION_BY_ID.get(selectedStar.con) || null : null;
  const starColorHex = selectedStar ? bvToColorHex(selectedStar.ci) : '#F3F1EB';
  const distLy = selectedStar?.dist ? (selectedStar.dist * 3.26156).toFixed(1) : null;

  const conHorizontal = useMemo(() => {
    if (!currentConstellation) return null;
    return getHorizontalCoordinates(
      currentConstellation.raCenter,
      currentConstellation.decCenter,
      observer,
      observationDate
    );
  }, [currentConstellation, observer, observationDate]);

  const notableStars = useMemo(() => {
    if (!currentConstellation) return [];
    return currentConstellation.starIds
      .map(id => STAR_BY_ID.get(id))
      .filter((s): s is Star => Boolean(s))
      .sort((a, b) => a.mag - b.mag)
      .slice(0, 4);
  }, [currentConstellation]);

  const viewingTimeData = useMemo(() => {
    if (!currentConstellation) return null;
    const culmination = getMeridianCulmination(
      currentConstellation.raCenter,
      currentConstellation.decCenter,
      observer,
      observationDate
    );
    const formatTime = (d: Date) =>
      `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
    return {
      windowStr: `${formatTime(culmination.optimalWindowStart)} – ${formatTime(culmination.optimalWindowEnd)}`,
      transitStr: formatTime(culmination.transitDate),
      maxAlt: culmination.maxAltitude.toFixed(1),
    };
  }, [currentConstellation, observer, observationDate]);

  const handlePrevConstellation = () => {
    const curId = currentConstellation?.id || 'Ori';
    const idx = CONSTELLATIONS.findIndex(c => c.id === curId);
    const prevIdx = (idx - 1 + CONSTELLATIONS.length) % CONSTELLATIONS.length;
    setSelectedStarId(null);
    focusOnConstellation(CONSTELLATIONS[prevIdx].id);
  };

  const handleNextConstellation = () => {
    const curId = currentConstellation?.id || 'Ori';
    const idx = CONSTELLATIONS.findIndex(c => c.id === curId);
    const nextIdx = (idx + 1) % CONSTELLATIONS.length;
    setSelectedStarId(null);
    focusOnConstellation(CONSTELLATIONS[nextIdx].id);
  };

  const handleStartTrace = () => {
    if (!isTraceMode) setIsTraceMode(true);
    const conId = currentConstellation?.id;
    const pattern = REFERENCE_PATTERNS.find(p => p.constellationId === conId);
    if (pattern) {
      loadPresetTrace(pattern);
    } else if (currentConstellation) {
      focusOnConstellation(currentConstellation.id);
    }
  };

  const handleOpenDetails = () => {
    setActiveView('constellations');
  };

  if (isDismissed) {
    return (
      <div className="w-full h-full flex items-start justify-end p-1">
        <Button
          onClick={() => setIsDismissed(false)}
          variant="secondary"
          size="small"
          aria-label="Reopen object inspector"
          className="text-xs font-semibold text-[var(--signal-mid)] bg-[var(--bg-card)] border-[var(--border-subtle)]"
          title="Open Inspector"
        >
          <span>Inspector ↗</span>
        </Button>
      </div>
    );
  }

  // --- VARIANT 1: SELECTED STAR ---
  if (selectedStar && starHorizontal) {
    return (
      <div className="boardui-surface w-full h-full bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[10px] p-3.5 gap-0 text-xs font-sans flex flex-col min-h-0 overflow-hidden shadow-none">
        <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-2.5 shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-[var(--ink-muted)] uppercase tracking-wider mb-0.5">
              Star target
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/25 shrink-0"
                style={{ backgroundColor: starColorHex }}
                title={`Color index B-V: ${selectedStar.ci ?? 'N/A'}`}
              />
              <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] tracking-tight truncate">
                {selectedStar.proper || selectedStar.name}
              </h2>
            </div>
            {selectedStar.proper && selectedStar.name !== selectedStar.proper && (
              <div className="text-[10px] text-[var(--ink-muted)] font-mono mt-0.5">
                {selectedStar.name}
              </div>
            )}
          </div>
          <Button
            onClick={() => setSelectedStarId(null)}
            variant="ghost"
            size="xs"
            aria-label="Return to constellation details"
            className="size-6 p-0 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] font-mono shrink-0"
            title="Back to Constellation"
          >
            ✕
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-3 pr-0.5">
          <div className="flex items-center justify-between py-1">
            <span className="text-[var(--ink-muted)]">Horizon state</span>
            <Chip variant="caption" color={starHorizontal.isAboveHorizon ? 'blue' : 'rose'}>
              {starHorizontal.isAboveHorizon ? 'Above horizon' : 'Below horizon'}
            </Chip>
          </div>

          <dl className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)] text-xs">
            <div className="flex items-center justify-between py-1.5">
              <dt className="text-[var(--ink-muted)]">Altitude</dt>
              <dd className="font-mono tabular-nums font-medium text-[var(--ink-primary)]">{starHorizontal.altitude.toFixed(1)}°</dd>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <dt className="text-[var(--ink-muted)]">Azimuth</dt>
              <dd className="font-mono tabular-nums font-medium text-[var(--ink-primary)]">
                {starHorizontal.azimuth.toFixed(1)}° ({getAzimuthDirection(starHorizontal.azimuth)})
              </dd>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <dt className="text-[var(--ink-muted)]">Magnitude</dt>
              <dd className="font-mono tabular-nums font-semibold text-[var(--signal-mid)]">{selectedStar.mag.toFixed(2)}m</dd>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <dt className="text-[var(--ink-muted)]">B−V / Spectral</dt>
              <dd className="font-mono tabular-nums text-[var(--ink-primary)]">
                {selectedStar.ci ?? '—'} {selectedStar.spect ? `· ${selectedStar.spect}` : ''}
              </dd>
            </div>
            {distLy && (
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-[var(--ink-muted)]">Distance</dt>
                <dd className="font-mono tabular-nums text-[var(--ink-primary)]">{distLy} ly</dd>
              </div>
            )}
            {starConstellation && (
              <div className="flex items-center justify-between py-1.5">
                <dt className="text-[var(--ink-muted)]">Parent constellation</dt>
                <dd>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setSelectedStarId(null);
                      setFocusedConstellationId(starConstellation.id);
                    }}
                    className="h-auto p-0 text-xs text-[var(--signal-mid)] font-semibold"
                  >
                    {starConstellation.name} ({starConstellation.id})
                  </Button>
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex items-center gap-2 pt-2.5 border-t border-[var(--border-subtle)] shrink-0">
          <Button
            onClick={() => {
              if (!isTraceMode) setIsTraceMode(true);
              addTracedStar(selectedStar);
            }}
            variant="primary"
            size="small"
            className="flex-1"
          >
            Trace from star
          </Button>
          <Button
            onClick={() => setSelectedStarId(null)}
            variant="secondary"
            size="small"
            className="text-xs font-semibold"
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  // --- VARIANT 2: SELECTED CONSTELLATION ---
  return (
    <div className="boardui-surface w-full h-full bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[10px] p-3.5 gap-0 text-xs font-sans flex flex-col min-h-0 overflow-hidden shadow-none">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5 shrink-0">
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-[var(--ink-muted)] uppercase tracking-wider mb-0.5">
            {currentConstellation?.id || 'Ori'} · IAU Region
          </div>
          <h2 className="font-sans text-lg font-semibold text-[var(--ink-primary)] tracking-tight truncate">
            {currentConstellation?.name || 'Orion'}
          </h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            onClick={handlePrevConstellation}
            variant="secondary"
            size="xs"
            className="size-6 p-0 font-mono"
            title="Previous Constellation"
            aria-label="Previous constellation"
          >
            ‹
          </Button>
          <Button
            onClick={handleNextConstellation}
            variant="secondary"
            size="xs"
            className="size-6 p-0 font-mono"
            title="Next Constellation"
            aria-label="Next constellation"
          >
            ›
          </Button>
          <Button
            onClick={() => setIsDismissed(true)}
            variant="ghost"
            size="xs"
            className="size-6 p-0 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] font-mono ml-0.5"
            title="Close Inspector"
            aria-label="Close inspector"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-2.5 space-y-3.5 pr-0.5">
        <dl className="divide-y divide-[var(--border-subtle)] text-xs">
          <div className="flex items-center justify-between py-1.5">
            <dt className="text-[var(--ink-muted)]">Visibility</dt>
            <dd>
              <Chip variant="caption" color={conHorizontal?.isAboveHorizon ? 'blue' : 'rose'}>
                {conHorizontal?.isAboveHorizon ? 'Above horizon' : 'Below horizon'}
              </Chip>
            </dd>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <dt className="text-[var(--ink-muted)]">Altitude / Azimuth</dt>
            <dd className="font-mono tabular-nums font-medium text-[var(--ink-primary)]">
              {conHorizontal ? `${conHorizontal.altitude.toFixed(1)}° · ${conHorizontal.azimuth.toFixed(0)}° ${getAzimuthDirection(conHorizontal.azimuth)}` : 'N/A'}
            </dd>
          </div>
          {viewingTimeData && (
            <div className="flex items-center justify-between py-1.5">
              <dt className="text-[var(--ink-muted)]">Optimal window</dt>
              <dd className="font-mono tabular-nums text-[var(--ink-primary)]">
                {viewingTimeData.windowStr} <span className="text-[10px] text-[var(--ink-muted)]">UTC</span>
              </dd>
            </div>
          )}
        </dl>

        {/* Notable stars */}
        <div className="space-y-1.5 border-t border-[var(--border-subtle)] pt-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ink-secondary)]">
            <span>Brightest stars</span>
            <span className="text-[10px] font-normal text-[var(--ink-muted)]">Select a star for details</span>
          </div>
          <Table
            size="sm"
            aria-label={`Brightest stars in ${currentConstellation?.name || 'Orion'}`}
            selectionMode="none"
            onRowAction={key => setSelectedStarId(Number(key))}
          >
            <TableHeader>
              <TableColumn isRowHeader>Star</TableColumn>
              <TableColumn>Magnitude</TableColumn>
            </TableHeader>
            <TableBody>
            {notableStars.map(star => {
              const bayerGreek = star.bayer && BAYER_GREEK[star.bayer]
                ? `${BAYER_GREEK[star.bayer]} ${currentConstellation?.id}`
                : (star.bayer ? `${star.bayer} ${currentConstellation?.id}` : null);
              return (
                <TableRow
                  key={star.id}
                  id={String(star.id)}
                  textValue={`${star.proper || star.name}, magnitude ${star.mag.toFixed(2)}`}
                >
                  <TableCell>
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{star.proper || star.name}</span>
                      {bayerGreek && <span className="shrink-0 text-xs text-[var(--ink-muted)]">{bayerGreek}</span>}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono tabular-nums text-[var(--signal-mid)]">{star.mag.toFixed(2)}m</span>
                  </TableCell>
                </TableRow>
              );
            })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center gap-2 shrink-0">
        <Button
          onClick={handleStartTrace}
          variant="primary"
          size="small"
          className="flex-1"
        >
          Start trace
        </Button>
        <Button
          onClick={handleOpenDetails}
          variant="secondary"
          size="small"
          className="flex-1"
        >
          <span>Full entry</span>
        </Button>
      </div>
    </div>
  );
};
