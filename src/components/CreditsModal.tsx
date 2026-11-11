import React from 'react';
import { useAstroStore } from '../stores/useAstroStore';

export const CreditsModal: React.FC = () => {
  const { setActiveView } = useAstroStore();

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-mono p-1.5 sm:p-2 gap-1.5 overflow-y-auto">
      {/* Top Header Bento Card */}
      <div className="bento-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--signal-cobalt)]" />
            <span className="telemetry-label text-xs">[ ℹ️ DATA PROVENANCE // SCIENTIFIC CITATIONS &amp; LICENSES ]</span>
          </div>
          <p className="text-[11px] text-[var(--ink-secondary)] mt-1">
            AstroFA is built strictly on open scientific datasets and verifiable astronomical computations.
          </p>
        </div>
        <button
          onClick={() => setActiveView('sky')}
          className="tactile-pill hud-reticle bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] text-[var(--ink-primary)] hover:text-[var(--signal-cobalt)] border border-[var(--bg-tray)] text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          RETURN TO SKY CANVAS ↗
        </button>
      </div>

      {/* 3-Column Bento Citations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5">
        {/* HYG Star Database */}
        <div className="bento-card p-4 flex flex-col justify-between gap-3 group">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="telemetry-label text-xs text-[var(--ink-primary)] group-hover:text-[var(--signal-cobalt)] transition-colors">
                HYG STAR DATABASE (v3.8)
              </h3>
              <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-neutral)] text-[var(--signal-cobalt)] text-[10px] font-bold font-mono">
                CC BY-SA 4.0
              </span>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Primary astronomical catalog combining Hipparcos, Yale Bright Star Catalogue (BSC5), and Henry Draper catalogs. Curated by David Nash / Astronexus.
            </p>
          </div>
          <div className="p-2.5 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] text-[11px] font-mono space-y-1 text-[var(--ink-muted)]">
            <div>SOURCE: <span className="text-[var(--signal-cobalt)] font-semibold">codeberg.org/astronexus/hyg</span></div>
            <div>INGESTION: <strong className="text-[var(--ink-primary)] font-dot">8,921 STARS</strong> (mag &le; 6.5)</div>
            <div>COORDINATES: J2000 RIGHT ASCENSION &amp; DECLINATION</div>
          </div>
        </div>

        {/* Constellation Lines Dataset */}
        <div className="bento-card p-4 flex flex-col justify-between gap-3 group">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="telemetry-label text-xs text-[var(--ink-primary)] group-hover:text-[var(--signal-cobalt)] transition-colors">
                CONSTELLATION LINES DATASET
              </h3>
              <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-neutral)] text-[var(--signal-cobalt)] text-[10px] font-bold font-mono">
                CC BY 4.0
              </span>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              Standard traditional connecting-line figures for all 88 official constellations. Curated by Marc van der Sluys. Identifies star vertices by Yale Bright Star (HR) identifiers.
            </p>
          </div>
          <div className="p-2.5 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] text-[11px] font-mono space-y-1 text-[var(--ink-muted)]">
            <div>SOURCE: <span className="text-[var(--signal-cobalt)] font-semibold">github.com/MarcvdSluys/ConstellationLines</span></div>
            <div>RELATION: <strong className="text-[var(--ink-primary)]">YALE BRIGHT STAR (HR) IDS</strong></div>
            <div>RESOLVED: <span className="font-dot text-[var(--signal-cobalt)] font-bold">88 IAU CONSTELLATIONS</span></div>
          </div>
        </div>

        {/* Astronomy Engine */}
        <div className="bento-card p-4 flex flex-col justify-between gap-3 group">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="telemetry-label text-xs text-[var(--ink-primary)] group-hover:text-[var(--signal-cobalt)] transition-colors">
                ASTRONOMY ENGINE
              </h3>
              <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-neutral)] text-[var(--signal-cobalt)] text-[10px] font-bold font-mono">
                MIT LICENSE
              </span>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              High-precision astronomical ephemerides, topocentric coordinate transformations, precession, sidereal time, and horizon calculations. Created by Don Cross.
            </p>
          </div>
          <div className="p-2.5 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] text-[11px] font-mono space-y-1 text-[var(--ink-muted)]">
            <div>SOURCE: <span className="text-[var(--signal-cobalt)] font-semibold">github.com/cosinekitty/astronomy</span></div>
            <div>TRANSFORMS: <strong className="text-[var(--ink-primary)]">EQJ TO HORIZONTAL (ALT/AZ)</strong></div>
            <div>COPYRIGHT: MIT LICENSE (c) 2019-2024 DON CROSS</div>
          </div>
        </div>
      </div>

      {/* IAU Distinction Section Bento Card */}
      <div className="bento-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-[2px] bg-[var(--signal-cobalt)]" />
          <h3 className="telemetry-label text-xs text-[var(--ink-primary)]">
            SCIENTIFIC DISTINCTION: IAU CONSTELLATIONS VS. ILLUSTRATIVE ASTERISMS
          </h3>
        </div>
        <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
          The <strong>International Astronomical Union (IAU)</strong> officially defines constellations as 88 contiguous regions dividing the entire celestial sphere,
          bounded by lines of right ascension and declination adopted in 1928 by Eugène Delporte.
          The familiar connecting lines (such as the Big Dipper or Orion's hourglass) are historical and cultural <em>asterisms</em>.
          AstroFA respects this distinction by modeling IAU boundary metadata alongside traditional asterism figure graphs.
        </p>
      </div>

      {/* Privacy Statement Bento Card */}
      <div className="bento-card p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-[2px] bg-[var(--signal-cobalt)]" />
          <h3 className="telemetry-label text-xs text-[var(--ink-primary)]">
            LOCAL COMPUTATION GUARANTEE &amp; PRIVACY INTEGRITY
          </h3>
        </div>
        <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
          AstroFA runs <strong>100% locally in your client web browser</strong>. No star trace coordinates, uploaded sky photographs,
          or simulation traces are ever sent to remote servers or third-party tracking APIs.
          Zero accounts, zero trackers, zero secret keys.
        </p>
      </div>
    </div>
  );
};
