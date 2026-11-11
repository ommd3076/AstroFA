import React from 'react';
import { useAstroStore } from '../stores/useAstroStore';
import { STAR_BY_ID, CONSTELLATION_BY_ID } from '../data/astroData';
import { getHorizontalCoordinates, bvToColorHex } from '../astronomy/coordinates';

export const StarInspector: React.FC = () => {
  const {
    selectedStarId,
    setSelectedStarId,
    observer,
    observationDate,
    isTraceMode,
    setIsTraceMode,
    addTracedStar,
    setFocusedConstellationId,
  } = useAstroStore();

  if (selectedStarId === null) return null;
  const star = STAR_BY_ID.get(selectedStarId);
  if (!star) return null;

  const horizontal = getHorizontalCoordinates(star.ra, star.dec, observer, observationDate);
  const constellation = star.con ? CONSTELLATION_BY_ID.get(star.con) : null;
  const colorHex = bvToColorHex(star.ci);

  // Convert distance in parsecs to light years (1 pc = 3.26156 ly)
  const distLy = star.dist ? (star.dist * 3.26156).toFixed(1) : null;

  return (
    <div className="hud-reticle-4corner absolute top-4 right-4 z-20 w-84 bg-[var(--bg-card)] border border-[#D0D5DD] rounded-[12px] p-4 text-xs font-mono space-y-3 shadow-none animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#E2E5EC] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: colorHex }}
              title={`Star Color (B-V: ${star.ci ?? 'N/A'})`}
            />
            <h2 className="font-dot text-base font-bold text-[var(--ink-primary)] uppercase tracking-wide">
              {star.proper || star.name}
            </h2>
          </div>
          {star.proper && star.name !== star.proper && (
            <div className="text-[10px] text-[var(--ink-muted)] font-mono tracking-[0.08em] uppercase mt-0.5">
              CATALOG ID: {star.name}
            </div>
          )}
        </div>
        <button
          onClick={() => setSelectedStarId(null)}
          className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 rounded-[4px] hover:bg-[var(--bg-tray)] transition-colors cursor-pointer text-xs font-mono font-bold"
          title="Close Inspector"
        >
          ✕
        </button>
      </div>

      {/* Observational Visibility Status Badge */}
      <div className="flex items-center justify-between p-2 rounded-[8px] bg-[var(--bg-tray)] border border-[#D8DCE5]">
        <span className="text-[10px] uppercase font-mono tracking-[0.08em] text-[var(--ink-secondary)] font-semibold">
          OBSERVER STATUS
        </span>
        <div
          className={`hud-reticle px-2 py-0.5 rounded-[4px] text-[10px] font-mono tracking-[0.08em] uppercase font-semibold flex items-center gap-1.5 ${
            horizontal.isAboveHorizon
              ? 'bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-surface)]'
              : 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${horizontal.isAboveHorizon ? 'bg-[var(--signal-cobalt)]' : 'bg-[#DC2626]'}`} />
          {horizontal.isAboveHorizon ? 'ABOVE HORIZON' : 'BELOW HORIZON'}
        </div>
      </div>

      {/* Alt/Az Telemetry (Tier 2 Monospace 32px with 10px Superscript) */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px]">
          <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] font-semibold mb-1">
            ALTITUDE
          </div>
          <div className="text-[32px] leading-none font-normal font-mono text-[var(--ink-primary)] flex items-baseline">
            <span>{horizontal.altitude.toFixed(1)}</span>
            <sup className="text-[10px] font-mono font-semibold tracking-wider text-[var(--ink-muted)] ml-0.5">
              DEG
            </sup>
          </div>
        </div>
        <div className="p-2.5 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px]">
          <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] font-semibold mb-1">
            AZIMUTH
          </div>
          <div className="text-[32px] leading-none font-normal font-mono text-[var(--ink-primary)] flex items-baseline">
            <span>{horizontal.azimuth.toFixed(1)}</span>
            <sup className="text-[10px] font-mono font-semibold tracking-wider text-[var(--ink-muted)] ml-0.5">
              DEG
            </sup>
          </div>
        </div>
      </div>

      {/* Apparent Mag & Color Index */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px]">
          <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] font-semibold mb-0.5">
            APPARENT MAG (V)
          </div>
          <div className="font-dot text-lg text-[var(--signal-cobalt)] font-bold">
            {star.mag.toFixed(2)}
          </div>
        </div>
        <div className="p-2 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px]">
          <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] font-semibold mb-0.5">
            B−V COLOR INDEX
          </div>
          <div className="font-mono text-sm font-semibold text-[var(--ink-primary)]">
            {star.ci ?? 'N/A'}
          </div>
        </div>
      </div>

      {/* Equatorial Coordinates RA/Dec */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px]">
          <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] font-semibold">
            RA (J2000)
          </div>
          <div className="text-xs font-mono font-semibold text-[var(--ink-primary)] flex items-baseline mt-0.5">
            <span>{(star.ra / 15).toFixed(3)}</span>
            <sup className="text-[9px] font-mono font-semibold text-[var(--ink-muted)] ml-0.5">H</sup>
          </div>
        </div>
        <div className="p-2 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px]">
          <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--ink-muted)] font-semibold">
            DEC (J2000)
          </div>
          <div className="text-xs font-mono font-semibold text-[var(--ink-primary)] flex items-baseline mt-0.5">
            <span>{star.dec > 0 ? `+${star.dec.toFixed(2)}` : star.dec.toFixed(2)}</span>
            <sup className="text-[9px] font-mono font-semibold text-[var(--ink-muted)] ml-0.5">DEG</sup>
          </div>
        </div>
      </div>

      {/* Stellar Physics & Identifiers */}
      <div className="p-2.5 bg-[var(--bg-tray)] border border-[#D8DCE5] rounded-[8px] space-y-1.5 font-mono text-[10px] uppercase tracking-[0.06em]">
        {distLy && (
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">DISTANCE:</span>
            <span className="text-[var(--ink-primary)] font-semibold">{distLy} LY ({star.dist?.toFixed(1)} PC)</span>
          </div>
        )}
        {star.spect && (
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">SPECTRAL CLASS:</span>
            <span className="text-[var(--signal-cobalt)] font-bold">{star.spect}</span>
          </div>
        )}
        {star.hr && (
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">HARVARD REVISED (HR):</span>
            <span className="text-[var(--ink-primary)] font-semibold">{star.hr}</span>
          </div>
        )}
        {star.hip && (
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">HIPPARCOS (HIP):</span>
            <span className="text-[var(--ink-primary)] font-semibold">{star.hip}</span>
          </div>
        )}
        {star.hd && (
          <div className="flex justify-between">
            <span className="text-[var(--ink-muted)]">HENRY DRAPER (HD):</span>
            <span className="text-[var(--ink-primary)] font-semibold">{star.hd}</span>
          </div>
        )}
        {constellation && (
          <div className="flex justify-between pt-1 border-t border-[#D8DCE5]">
            <span className="text-[var(--ink-muted)]">CONSTELLATION:</span>
            <button
              onClick={() => setFocusedConstellationId(constellation.id)}
              className="text-[var(--signal-cobalt)] hover:underline cursor-pointer font-bold"
            >
              {constellation.name.toUpperCase()} ({constellation.id})
            </button>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-0.5">
        <button
          onClick={() => {
            if (!isTraceMode) setIsTraceMode(true);
            addTracedStar(star);
          }}
          className="w-full py-2.5 bg-[var(--signal-cobalt)] hover:bg-[#1644C5] text-white rounded-[8px] font-mono font-semibold text-xs uppercase tracking-[0.08em] transition-colors flex items-center justify-center gap-2 border border-[#1644C5] cursor-pointer shadow-none"
        >
          <span>✍️</span>
          <span>TRACE FROM STAR</span>
        </button>
      </div>
    </div>
  );
};
