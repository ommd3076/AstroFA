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

// Map 3-letter Bayer abbreviations to Greek characters
const BAYER_GREEK: Record<string, string> = {
  Alp: 'α',
  Bet: 'β',
  Gam: 'γ',
  Del: 'δ',
  Eps: 'ε',
  Zet: 'ζ',
  Eta: 'η',
  The: 'θ',
  Iot: 'ι',
  Kap: 'κ',
  Lam: 'λ',
  Mu: 'μ',
  Nu: 'ν',
  Xi: 'ξ',
  Omi: 'ο',
  Pi: 'π',
  Rho: 'ρ',
  Sig: 'σ',
  Tau: 'τ',
  Ups: 'υ',
  Phi: 'φ',
  Chi: 'χ',
  Psi: 'ψ',
  Ome: 'ω',
};

// Compass heading resolver for Azimuth angle
function getAzimuthDirection(az: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const normalized = ((az % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

export const StarInspector: React.FC = () => {
  const {
    selectedStarId,
    setSelectedStarId,
    focusedConstellationId,
    setFocusedConstellationId,
    focusOnConstellation,
    observer,
    observationDate,
    isTraceMode,
    setIsTraceMode,
    addTracedStar,
    loadPresetTrace,
    setActiveView,
  } = useAstroStore();

  const [isDismissed, setIsDismissed] = useState(false);

  // Determine current constellation (defaults to 'ORI' for reference parity if none is selected)
  const activeConstellationId = focusedConstellationId || (selectedStarId ? null : 'ORI');
  const currentConstellation = activeConstellationId ? CONSTELLATION_BY_ID.get(activeConstellationId) || null : null;

  // Selected Star (if explicit star selection is active)
  const selectedStar: Star | null = selectedStarId !== null ? STAR_BY_ID.get(selectedStarId) || null : null;
  const starHorizontal = selectedStar
    ? getHorizontalCoordinates(selectedStar.ra, selectedStar.dec, observer, observationDate)
    : null;
  const starConstellation = selectedStar?.con ? CONSTELLATION_BY_ID.get(selectedStar.con) || null : null;
  const starColorHex = selectedStar ? bvToColorHex(selectedStar.ci) : '#FFFFFF';
  const distLy = selectedStar?.dist ? (selectedStar.dist * 3.26156).toFixed(1) : null;

  // Constellation Horizontal coordinates & viewing window
  const conHorizontal = useMemo(() => {
    if (!currentConstellation) return null;
    return getHorizontalCoordinates(
      currentConstellation.raCenter,
      currentConstellation.decCenter,
      observer,
      observationDate
    );
  }, [currentConstellation, observer, observationDate]);

  // Notable Stars for Constellation (top 3 brightest stars)
  const notableStars = useMemo(() => {
    if (!currentConstellation) return [];
    return currentConstellation.starIds
      .map(id => STAR_BY_ID.get(id))
      .filter((s): s is Star => Boolean(s))
      .sort((a, b) => a.mag - b.mag)
      .slice(0, 3);
  }, [currentConstellation]);

  // Best viewing time window calculated from culmination
  const viewingTimeData = useMemo(() => {
    if (!currentConstellation) return null;
    const culmination = getMeridianCulmination(
      currentConstellation.raCenter,
      currentConstellation.decCenter,
      observer,
      observationDate
    );
    const formatTime = (d: Date) => {
      const h = d.getUTCHours().toString().padStart(2, '0');
      const m = d.getUTCMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    };
    return {
      windowStr: `${formatTime(culmination.optimalWindowStart)} – ${formatTime(culmination.optimalWindowEnd)}`,
      transitStr: formatTime(culmination.transitDate),
      maxAlt: culmination.maxAltitude.toFixed(1),
    };
  }, [currentConstellation, observer, observationDate]);

  // Constellation Cycling Handlers
  const handlePrevConstellation = () => {
    const curId = currentConstellation?.id || 'ORI';
    const idx = CONSTELLATIONS.findIndex(c => c.id === curId);
    const prevIdx = (idx - 1 + CONSTELLATIONS.length) % CONSTELLATIONS.length;
    setSelectedStarId(null);
    focusOnConstellation(CONSTELLATIONS[prevIdx].id);
  };

  const handleNextConstellation = () => {
    const curId = currentConstellation?.id || 'ORI';
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

  // If user dismissed the inspector, provide a minimal tactile pill to re-open
  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="hud-reticle absolute top-4 right-4 z-20 px-3 py-1.5 bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[8px] text-[11px] font-mono font-semibold text-[var(--signal-cobalt)] hover:bg-white cursor-pointer uppercase tracking-wider flex items-center gap-1.5 shadow-none"
        title="Open Inspector"
      >
        <span>🔭</span>
        <span>INSPECTOR</span>
      </button>
    );
  }

  // --- RENDERING VARIANT 1: STAR SELECTED ---
  if (selectedStar && starHorizontal) {
    return (
      <div className="hud-reticle-4corner absolute top-4 right-4 z-20 w-[358px] max-w-[calc(100%-2rem)] bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[12px] p-4 text-xs font-mono space-y-3 shadow-none">
        {/* Header Row */}
        <div className="flex items-start justify-between border-b border-[#E2E5EC] pb-2.5">
          <div>
            <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.08em] font-semibold mb-0.5">
              SELECTED OBJECT
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                style={{ backgroundColor: starColorHex }}
                title={`Star Color (B-V: ${selectedStar.ci ?? 'N/A'})`}
              />
              <h2 className="font-dot text-xl font-bold text-[var(--ink-primary)] uppercase tracking-wide">
                {selectedStar.proper || selectedStar.name}
              </h2>
            </div>
            {selectedStar.proper && selectedStar.name !== selectedStar.proper && (
              <div className="text-[10px] text-[var(--ink-muted)] font-mono tracking-[0.08em] uppercase mt-0.5">
                CATALOG ID: {selectedStar.name}
              </div>
            )}
          </div>
          <button
            onClick={() => setSelectedStarId(null)}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-transparent hover:border-[#D8DCE5] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer text-xs font-bold"
            title="Return to Constellation"
          >
            ✕
          </button>
        </div>

        {/* Observational Visibility Status */}
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between py-1 border-b border-[#F0F2F6]">
            <span className="text-[var(--ink-muted)] uppercase tracking-[0.08em] font-medium text-[10px]">TYPE</span>
            <span className="font-semibold text-[var(--ink-primary)] uppercase tracking-wider text-[11px]">STAR</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#F0F2F6]">
            <span className="text-[var(--ink-muted)] uppercase tracking-[0.08em] font-medium text-[10px]">VISIBILITY</span>
            <span
              className={`font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${
                starHorizontal.isAboveHorizon ? 'text-[var(--signal-cobalt)]' : 'text-[#DC2626]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  starHorizontal.isAboveHorizon ? 'bg-[var(--signal-cobalt)]' : 'bg-[#DC2626]'
                }`}
              />
              {starHorizontal.isAboveHorizon ? 'VISIBLE' : 'BELOW HORIZON'}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#F0F2F6]">
            <span className="text-[var(--ink-muted)] uppercase tracking-[0.08em] font-medium text-[10px]">ALTITUDE</span>
            <span className="font-semibold text-[var(--ink-primary)] text-[11px]">
              {starHorizontal.altitude.toFixed(1)}°
            </span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[var(--ink-muted)] uppercase tracking-[0.08em] font-medium text-[10px]">AZIMUTH</span>
            <span className="font-semibold text-[var(--ink-primary)] text-[11px]">
              {starHorizontal.azimuth.toFixed(1)}° ({getAzimuthDirection(starHorizontal.azimuth)})
            </span>
          </div>
        </div>

        {/* Stellar Physics */}
        <div className="border-t border-[#E2E5EC] pt-2.5 space-y-1 text-xs font-mono">
          <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.08em] font-semibold mb-1">
            STELLAR PROPERTIES
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[6px]">
              <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] font-semibold">MAGNITUDE</div>
              <div className="font-dot text-base text-[var(--signal-cobalt)] font-bold mt-0.5">
                {selectedStar.mag.toFixed(2)}
              </div>
            </div>
            <div className="p-2 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[6px]">
              <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] font-semibold">B−V INDEX</div>
              <div className="font-mono text-xs font-bold text-[var(--ink-primary)] mt-1">
                {selectedStar.ci ?? 'N/A'}
              </div>
            </div>
          </div>
          <div className="p-2 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[6px] space-y-1 text-[10px] mt-1">
            {distLy && (
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">DISTANCE:</span>
                <span className="text-[var(--ink-primary)] font-semibold">{distLy} LY</span>
              </div>
            )}
            {selectedStar.spect && (
              <div className="flex justify-between">
                <span className="text-[var(--ink-muted)]">SPECTRAL CLASS:</span>
                <span className="text-[var(--signal-cobalt)] font-bold">{selectedStar.spect}</span>
              </div>
            )}
            {starConstellation && (
              <div className="flex justify-between pt-1 border-t border-[#D8DCE5]">
                <span className="text-[var(--ink-muted)]">CONSTELLATION:</span>
                <button
                  onClick={() => {
                    setSelectedStarId(null);
                    setFocusedConstellationId(starConstellation.id);
                  }}
                  className="text-[var(--signal-cobalt)] hover:underline cursor-pointer font-bold uppercase"
                >
                  {starConstellation.name} ({starConstellation.id})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E2E5EC]">
          <button
            onClick={() => {
              if (!isTraceMode) setIsTraceMode(true);
              addTracedStar(selectedStar);
            }}
            className="flex-1 py-2.5 px-3 bg-[var(--signal-cobalt)] hover:bg-[#1644C5] text-white rounded-[8px] font-mono font-semibold text-xs uppercase tracking-[0.08em] flex items-center justify-center gap-1.5 border border-[#1644C5] cursor-pointer"
          >
            <span>✍️</span>
            <span>TRACE FROM STAR</span>
          </button>
          <button
            onClick={() => setSelectedStarId(null)}
            className="py-2.5 px-3 bg-[var(--bg-card)] hover:bg-white text-[var(--ink-primary)] rounded-[8px] font-mono font-semibold text-xs uppercase tracking-[0.08em] flex items-center justify-center gap-1 border border-[#D8DCE5] cursor-pointer"
          >
            <span>BACK</span>
          </button>
        </div>
      </div>
    );
  }

  // --- RENDERING VARIANT 2: CONSTELLATION INSPECTOR (FRAME 2 & 4 DESIGN TRUTH) ---
  return (
    <div className="hud-reticle-4corner absolute top-4 right-4 z-20 w-[358px] max-w-[calc(100%-2rem)] bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[12px] p-4 text-xs font-mono space-y-3 shadow-none">
      {/* Header Row with Title & Prev/Next Chevrons */}
      <div className="flex items-center justify-between border-b border-[#E2E5EC] pb-2.5">
        <div>
          <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.08em] font-semibold mb-0.5">
            SELECTED OBJECT
          </div>
          <h2 className="font-dot text-2xl font-bold text-[var(--ink-primary)] uppercase tracking-wide">
            {currentConstellation?.name || 'ORION'}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevConstellation}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-[#D8DCE5] bg-[var(--bg-tray)] hover:bg-white text-[var(--ink-primary)] cursor-pointer text-xs font-bold"
            title="Previous Constellation"
          >
            ‹
          </button>
          <button
            onClick={handleNextConstellation}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-[#D8DCE5] bg-[var(--bg-tray)] hover:bg-white text-[var(--ink-primary)] cursor-pointer text-xs font-bold"
            title="Next Constellation"
          >
            ›
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] border border-transparent hover:border-[#D8DCE5] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer text-xs font-bold ml-1"
            title="Close Inspector"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Primary Metadata Table (2-Column Aligned) */}
      <div className="space-y-1.5 text-xs font-mono">
        <div className="flex items-center justify-between py-1 border-b border-[#F0F2F6]">
          <span className="text-[var(--ink-muted)] uppercase tracking-[0.08em] font-medium text-[10px]">TYPE</span>
          <span className="font-semibold text-[var(--ink-primary)] uppercase tracking-wider text-[11px]">CONSTELLATION</span>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-[#F0F2F6]">
          <span className="text-[var(--ink-muted)] uppercase tracking-[0.08em] font-medium text-[10px]">VISIBILITY</span>
          <span
            className={`font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${
              conHorizontal?.isAboveHorizon ? 'text-[var(--signal-cobalt)]' : 'text-[#DC2626]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                conHorizontal?.isAboveHorizon ? 'bg-[var(--signal-cobalt)]' : 'bg-[#DC2626]'
              }`}
            />
            {conHorizontal?.isAboveHorizon ? 'VISIBLE' : 'BELOW HORIZON'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1 border-b border-[#F0F2F6]">
          <span className="text-[var(--ink-muted)] uppercase tracking-[0.08em] font-medium text-[10px]">ALTITUDE</span>
          <span className="font-semibold text-[var(--ink-primary)] text-[11px]">
            {conHorizontal ? `${conHorizontal.altitude.toFixed(1)}°` : 'N/A'}
          </span>
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-[var(--ink-muted)] uppercase tracking-[0.08em] font-medium text-[10px]">AZIMUTH</span>
          <span className="font-semibold text-[var(--ink-primary)] text-[11px]">
            {conHorizontal ? `${conHorizontal.azimuth.toFixed(1)}° (${getAzimuthDirection(conHorizontal.azimuth)})` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Notable Stars List */}
      <div className="space-y-2 border-t border-[#E2E5EC] pt-2.5">
        <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.08em] font-semibold flex items-center justify-between">
          <span>NOTABLE STARS ({notableStars.length})</span>
          <span className="text-[9px] text-[var(--ink-muted)] font-normal">CLICK TO INSPECT</span>
        </div>
        <div className="space-y-1">
          {notableStars.map(star => {
            const bayerGreek = star.bayer && BAYER_GREEK[star.bayer]
              ? `${BAYER_GREEK[star.bayer]} ${currentConstellation?.id}`
              : (star.bayer ? `${star.bayer} ${currentConstellation?.id}` : null);
            return (
              <div
                key={star.id}
                onClick={() => setSelectedStarId(star.id)}
                className="flex items-center justify-between py-1.5 px-2 rounded-[6px] bg-[var(--bg-tray)]/50 hover:bg-[var(--bg-tray)] cursor-pointer text-xs font-mono"
                title={`Select ${star.proper || star.name}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt)] shrink-0" />
                  <span className="font-bold text-[var(--ink-primary)] uppercase text-[11px]">
                    {star.proper || star.name}
                  </span>
                  {bayerGreek && (
                    <span className="text-[10px] text-[var(--ink-muted)] font-medium">
                      {bayerGreek}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-[var(--ink-secondary)]">
                  <span className="text-[var(--ink-muted)] mr-1">MAG</span>
                  <strong className="text-[var(--ink-primary)]">{star.mag.toFixed(2)}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best Viewing Time */}
      {viewingTimeData && (
        <div className="space-y-1.5 border-t border-[#E2E5EC] pt-2.5">
          <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-[0.08em] font-semibold">
            BEST VIEWING TIME
          </div>
          <div className="flex items-center justify-between">
            <span className="font-dot text-base font-bold text-[var(--ink-primary)] tracking-wide">
              {viewingTimeData.windowStr}
            </span>
            <span className="text-[10px] font-mono text-[var(--signal-cobalt)] bg-[var(--bg-pill-active)] px-2 py-0.5 rounded-[4px] border border-[var(--signal-surface)] font-semibold uppercase tracking-wider">
              ALT &gt; 30°
            </span>
          </div>
        </div>
      )}

      {/* Quick Actions (Dual Button Strip) */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#E2E5EC]">
        <button
          onClick={handleStartTrace}
          className="flex-1 py-2.5 px-3 bg-[var(--signal-cobalt)] hover:bg-[#1644C5] text-white rounded-[8px] font-mono font-semibold text-xs uppercase tracking-[0.08em] flex items-center justify-center gap-1.5 border border-[#1644C5] cursor-pointer"
        >
          <span>✍️</span>
          <span>START TRACE</span>
        </button>
        <button
          onClick={handleOpenDetails}
          className="flex-1 py-2.5 px-3 bg-[var(--bg-card)] hover:bg-white text-[var(--signal-cobalt)] rounded-[8px] font-mono font-semibold text-xs uppercase tracking-[0.08em] flex items-center justify-center gap-1.5 border border-[var(--signal-surface)] cursor-pointer"
        >
          <span>OPEN DETAILS</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
};
