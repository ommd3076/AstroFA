import React, { useState, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATIONS, REFERENCE_PATTERNS, STAR_BY_ID } from '../../data/astroData';
import { getHorizontalCoordinates } from '../../astronomy/coordinates';
import type { IAUConstellation, Star } from '../../types/astronomy';

const getAzimuthDirection = (az: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(((az % 360) + 360) % 360 / 45) % 8;
  return dirs[idx];
};

// Mini Asterism Vector Graphic on subtle dot grid
const MiniAsterismPreview: React.FC<{ con: IAUConstellation }> = React.memo(({ con }) => {
  const rad = Math.PI / 180;
  const cosDec = Math.cos(con.decCenter * rad);
  const coords = useMemo(() => {
    return con.starIds.map(sid => {
      const star = STAR_BY_ID.get(sid);
      if (!star) return null;
      let dRa = star.ra - con.raCenter;
      while (dRa > 180) dRa -= 360;
      while (dRa < -180) dRa += 360;
      const x = -dRa * cosDec;
      const y = -(star.dec - con.decCenter);
      return { sid, x, y };
    }).filter((s): s is NonNullable<typeof s> => s !== null);
  }, [con, cosDec]);

  if (coords.length === 0) {
    return (
      <div className="w-full h-20 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] flex items-center justify-center text-[10px] text-[var(--ink-muted)]">
        NO ASTERISM GEOMETRY
      </div>
    );
  }

  const minX = Math.min(...coords.map(c => c.x));
  const maxX = Math.max(...coords.map(c => c.x));
  const minY = Math.min(...coords.map(c => c.y));
  const maxY = Math.max(...coords.map(c => c.y));
  const spanX = Math.max(maxX - minX, 0.5);
  const spanY = Math.max(maxY - minY, 0.5);
  const width = 160;
  const height = 80;
  const pad = 10;
  const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const starMap = new Map(
    coords.map(c => [
      c.sid,
      { x: width / 2 + (c.x - midX) * scale, y: height / 2 + (c.y - midY) * scale }
    ])
  );

  return (
    <div className="relative w-full h-20 bg-[var(--bg-viewport)] rounded-[8px] overflow-hidden border border-[var(--bg-tray)] flex items-center justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <pattern id={`dg-${con.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="#334155" opacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dg-${con.id})`} />
        {con.lineSegments.map((seg, idx) => {
          const p1 = starMap.get(seg.starId1);
          const p2 = starMap.get(seg.starId2);
          if (!p1 || !p2) return null;
          return (
            <line
              key={idx}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#6892F6"
              strokeWidth="1.2"
              strokeOpacity="0.85"
            />
          );
        })}
        {coords.map((c, idx) => {
          const pos = starMap.get(c.sid);
          if (!pos) return null;
          return (
            <circle
              key={idx}
              cx={pos.x}
              cy={pos.y}
              r="2"
              fill="#FFFFFF"
              stroke="#1D55F5"
              strokeWidth="0.8"
            />
          );
        })}
      </svg>
    </div>
  );
});

export const ConstellationExplorer: React.FC = () => {
  const {
    observer,
    observationDate,
    setActiveView,
    setFocusedConstellationId,
    loadPresetTrace,
    setAutomataTab,
    setSimulatorSymbols,
    focusOnConstellation,
  } = useAstroStore();

  const [search, setSearch] = useState('');
  const [selectedFamily, setSelectedFamily] = useState('ALL');
  const [hemisphereFilter, setHemisphereFilter] = useState<'ALL' | 'NORTH' | 'SOUTH'>('ALL');
  const [seasonFilter, setSeasonFilter] = useState<'ALL' | 'Spring' | 'Summer' | 'Autumn' | 'Winter'>('ALL');
  const [recognitionOnly, setRecognitionOnly] = useState(false);
  const [selectedConstellation, setSelectedConstellation] = useState<IAUConstellation | null>(null);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);

  const families = useMemo(() => {
    const set = new Set(CONSTELLATIONS.map(c => c.family));
    return ['ALL', ...Array.from(set).sort()];
  }, []);

  // Compute season for each constellation based on transit Right Ascension
  const getConstellationSeason = (raCenter: number): 'Spring' | 'Summer' | 'Autumn' | 'Winter' => {
    const raHours = (raCenter / 15.0) % 24.0;
    if (raHours >= 3 && raHours < 9) return 'Winter';
    if (raHours >= 9 && raHours < 15) return 'Spring';
    if (raHours >= 15 && raHours < 21) return 'Summer';
    return 'Autumn';
  };

  const filtered = useMemo(() => {
    return CONSTELLATIONS.filter(c => {
      if (selectedFamily !== 'ALL' && c.family !== selectedFamily) return false;
      if (hemisphereFilter === 'NORTH' && c.decCenter < 0) return false;
      if (hemisphereFilter === 'SOUTH' && c.decCenter >= 0) return false;
      if (seasonFilter !== 'ALL' && getConstellationSeason(c.raCenter) !== seasonFilter) return false;
      if (recognitionOnly && !REFERENCE_PATTERNS.some(p => p.constellationId === c.id)) return false;

      if (!search) return true;
      const term = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.englishName.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term) ||
        c.brightestStar.toLowerCase().includes(term)
      );
    });
  }, [search, selectedFamily, hemisphereFilter, seasonFilter, recognitionOnly]);

  const handleStartTrace = (con: IAUConstellation) => {
    const pattern = REFERENCE_PATTERNS.find(p => p.constellationId === con.id && p.traversalVariant === 'forward');
    if (pattern) {
      loadPresetTrace(pattern);
    } else {
      setFocusedConstellationId(con.id);
      setActiveView('sky');
    }
  };

  const handleInspectAutomaton = (con: IAUConstellation) => {
    const pattern = REFERENCE_PATTERNS.find(p => p.constellationId === con.id && p.traversalVariant === 'forward');
    if (pattern) {
      setSimulatorSymbols(pattern.encodedSymbols);
    }
    setAutomataTab('dfa');
    setActiveView('automataLab');
  };

  const handleFocusSky = (con: IAUConstellation) => {
    focusOnConstellation(con.id);
  };

  // 2D Projection for the interactive SVG Asterism Diagram in the detail modal
  const asterismDiagramData = useMemo(() => {
    if (!selectedConstellation) return null;
    const rad = Math.PI / 180;
    const cosDecCenter = Math.cos(selectedConstellation.decCenter * rad);

    const rawCoords = selectedConstellation.starIds.map(sid => {
      const star = STAR_BY_ID.get(sid);
      if (!star) return null;
      let dRa = star.ra - selectedConstellation.raCenter;
      while (dRa > 180) dRa -= 360;
      while (dRa < -180) dRa += 360;
      const x = -dRa * cosDecCenter;
      const y = -(star.dec - selectedConstellation.decCenter);
      return { sid, star, x, y };
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    if (rawCoords.length === 0) return null;

    const minX = Math.min(...rawCoords.map(c => c.x));
    const maxX = Math.max(...rawCoords.map(c => c.x));
    const minY = Math.min(...rawCoords.map(c => c.y));
    const maxY = Math.max(...rawCoords.map(c => c.y));

    const spanX = Math.max(maxX - minX, 0.5);
    const spanY = Math.max(maxY - minY, 0.5);

    const svgWidth = 460;
    const svgHeight = 240;
    const pad = 36;

    const scale = Math.min((svgWidth - 2 * pad) / spanX, (svgHeight - 2 * pad) / spanY);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const refPattern = REFERENCE_PATTERNS.find(
      p => p.constellationId === selectedConstellation.id && p.traversalVariant === 'forward'
    );

    const positionedStars = rawCoords.map(c => {
      const px = svgWidth / 2 + (c.x - midX) * scale;
      const py = svgHeight / 2 + (c.y - midY) * scale;
      const seqIndex = refPattern ? refPattern.orderedStarIds.indexOf(c.sid) : -1;
      return {
        sid: c.sid,
        star: c.star,
        px,
        py,
        seqIndex: seqIndex >= 0 ? seqIndex + 1 : null,
      };
    });

    const starPosMap = new Map(positionedStars.map(p => [p.sid, p]));

    const segments = selectedConstellation.lineSegments.map(seg => {
      const p1 = starPosMap.get(seg.starId1);
      const p2 = starPosMap.get(seg.starId2);
      if (!p1 || !p2) return null;
      return { x1: p1.px, y1: p1.py, x2: p2.px, y2: p2.py };
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    return {
      svgWidth,
      svgHeight,
      stars: positionedStars,
      segments,
      refPattern,
    };
  }, [selectedConstellation]);

  const modalSeason = selectedConstellation ? getConstellationSeason(selectedConstellation.raCenter) : 'Spring';
  const modalHor = selectedConstellation ? getHorizontalCoordinates(selectedConstellation.raCenter, selectedConstellation.decCenter, observer, observationDate) : null;

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-mono p-1.5 sm:p-2 gap-1.5 overflow-y-auto">
      {/* Top Header Bento Card */}
      <div className="bento-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--signal-cobalt)]" />
            <span className="telemetry-label text-xs">[ 🧭 CONSTELLATION LIBRARY // IAU CATALOG ]</span>
          </div>
          <p className="text-[11px] text-[var(--ink-secondary)] mt-1">
            Authoritative International Astronomical Union (IAU) 88-constellation catalog. 12 reference asterisms supported by deterministic finite automata.
          </p>
        </div>

        {/* Search Omnibar wrapped in HUD Reticle */}
        <div className="flex items-center gap-3">
          <div className="hud-reticle">
            <input
              type="text"
              placeholder="SEARCH NAME, ENGLISH, OR STAR..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] rounded-[8px] px-3.5 py-1.5 text-xs text-[var(--ink-primary)] font-mono uppercase tracking-wider w-72 focus:outline-none focus:border-[var(--signal-cobalt)] placeholder:text-[var(--ink-muted)]"
            />
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Tactile Hardware Rockers wrapped in HUD Reticles */}
      <div className="bento-card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Family Filter Dropdown */}
          <div className="hud-reticle">
            <select
              value={selectedFamily}
              onChange={e => setSelectedFamily(e.target.value)}
              className="bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] rounded-[6px] px-2.5 py-1 text-[11px] text-[var(--ink-secondary)] font-mono uppercase tracking-wider cursor-pointer focus:outline-none focus:border-[var(--signal-cobalt)]"
            >
              {families.map(f => (
                <option key={f} value={f}>
                  {f === 'ALL' ? 'ALL ASTRONOMICAL FAMILIES' : `${f.toUpperCase()} FAMILY`}
                </option>
              ))}
            </select>
          </div>

          {/* Hemisphere Rocker Switch Pills */}
          <div className="tactile-rocker hud-reticle">
            {(['ALL', 'NORTH', 'SOUTH'] as const).map(hemi => (
              <button
                key={hemi}
                onClick={() => setHemisphereFilter(hemi)}
                className={`tactile-pill text-[10px] uppercase tracking-wider ${
                  hemisphereFilter === hemi ? 'active' : ''
                }`}
              >
                {hemi === 'ALL' ? 'ALL SKIES' : hemi === 'NORTH' ? 'NORTH DEC ≥ 0°' : 'SOUTH DEC < 0°'}
              </button>
            ))}
          </div>

          {/* Season Rocker Switch Pills */}
          <div className="tactile-rocker hud-reticle">
            {(['ALL', 'Spring', 'Summer', 'Autumn', 'Winter'] as const).map(season => (
              <button
                key={season}
                onClick={() => setSeasonFilter(season)}
                className={`tactile-pill text-[10px] uppercase tracking-wider ${
                  seasonFilter === season ? 'active' : ''
                }`}
              >
                {season === 'ALL' ? 'ALL SEASONS' : season.slice(0, 3).toUpperCase()}
              </button>
            ))}
          </div>

          {/* Recognition Only Badge Rocker */}
          <div className="hud-reticle">
            <button
              onClick={() => setRecognitionOnly(!recognitionOnly)}
              className={`tactile-pill text-[10px] uppercase tracking-wider font-bold ${
                recognitionOnly ? 'active' : ''
              }`}
            >
              {recognitionOnly ? '✓ DFA RECOGNIZABLE ONLY (12)' : 'SHOW ALL ASTERISMS'}
            </button>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[var(--ink-muted)] flex items-center gap-1.5">
          <span>CATALOG:</span>
          <span className="font-dot text-[var(--signal-cobalt)] font-bold text-xs">{filtered.length}</span>
          <span>/ 88 MODULES</span>
        </div>
      </div>

      {/* 4-Column Recessed Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 flex-1 min-h-0">
        {filtered.map(con => {
          const hasPattern = REFERENCE_PATTERNS.some(p => p.constellationId === con.id);
          const hor = getHorizontalCoordinates(con.raCenter, con.decCenter, observer, observationDate);
          const season = getConstellationSeason(con.raCenter);

          return (
            <div
              key={con.id}
              onClick={() => setSelectedConstellation(con)}
              className="bento-card p-3.5 cursor-pointer transition-all hover:border-[var(--signal-mid)] flex flex-col justify-between gap-2.5 group relative"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h3 className="font-bold text-[12px] uppercase tracking-wider text-[var(--ink-primary)] group-hover:text-[var(--signal-cobalt)] transition-colors">
                      {con.name}
                    </h3>
                    <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wide">
                      "{con.englishName}"
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="hud-reticle px-1.5 py-0.5 bg-[var(--bg-pill-neutral)] text-[var(--signal-cobalt)] font-dot text-[10px] font-bold uppercase">
                      {con.id}
                    </span>
                    {hasPattern && (
                      <span className="hud-reticle px-1 py-0.2 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] text-[8px] font-bold uppercase">
                        DFA READY
                      </span>
                    )}
                  </div>
                </div>

                {/* Vector Asterism Diagram on Subtle Dot Grid */}
                <div className="mt-2.5">
                  <MiniAsterismPreview con={con} />
                </div>

                {/* Recessed Matrix Telemetry List */}
                <div className="mt-2.5 p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] space-y-1 font-mono text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--ink-muted)] uppercase">FAMILY / SEASON:</span>
                    <span className="text-[var(--ink-secondary)] font-semibold">{con.family.toUpperCase()} ({season.slice(0, 3).toUpperCase()})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--ink-muted)] uppercase">FIGURE NODES:</span>
                    <span className="text-[var(--ink-secondary)] font-semibold">{con.starIds.length} STARS</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--ink-muted)] uppercase">HORIZON ALT:</span>
                    <span className={`font-dot font-bold ${hor.isAboveHorizon ? 'text-[var(--signal-cobalt)]' : 'text-[var(--ink-muted)]'}`}>
                      {hor.isAboveHorizon ? `ALT ${hor.altitude.toFixed(0)}°` : 'BELOW HORIZON'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-2 border-t border-[var(--card-border-subtle)] flex items-center justify-between text-[10px] text-[var(--ink-muted)] group-hover:text-[var(--signal-cobalt)] transition-colors">
                <span className="telemetry-label text-[9px]">INSPECT TELEMETRY</span>
                <span className="font-dot text-xs">↗</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Constellation Details Drawer / Modal with Asterism Diagram & Seasonal Dot Matrix */}
      {selectedConstellation && (
        <div className="fixed inset-0 z-50 bg-[#060A14]/65 backdrop-blur-[2px] flex items-center justify-center p-3">
          <div className="bento-card max-w-2xl w-full p-5 space-y-4 font-mono text-[var(--ink-primary)] border border-[var(--signal-surface)] animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            {/* Modal Title Bar */}
            <div className="flex items-start justify-between border-b border-[var(--card-border-subtle)] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-dot text-2xl font-bold tracking-wide text-[var(--ink-primary)]">
                    {selectedConstellation.name.toUpperCase()}
                  </h3>
                  <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] font-dot text-xs font-bold uppercase">
                    {selectedConstellation.id}
                  </span>
                  {REFERENCE_PATTERNS.some(p => p.constellationId === selectedConstellation.id) && (
                    <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-neutral)] text-[var(--signal-cobalt)] text-[9px] font-bold uppercase">
                      DFA RECOGNITION READY
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--ink-secondary)] uppercase tracking-wider mt-1">
                  GENITIVE: {selectedConstellation.genitive.toUpperCase()} // ENGLISH: "{selectedConstellation.englishName.toUpperCase()}" // FAMILY: {selectedConstellation.family.toUpperCase()}
                </div>
              </div>
              <button
                onClick={() => setSelectedConstellation(null)}
                className="tactile-pill hud-reticle px-2.5 py-1 text-xs font-bold cursor-pointer"
              >
                ✕ CLOSE
              </button>
            </div>

            {/* Interactive SVG Asterism Diagram with Dot Grid */}
            {asterismDiagramData && (
              <div className="p-3 bg-[var(--bg-card-subtle)] rounded-[10px] border border-[var(--card-border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="telemetry-label flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-[2px] bg-[var(--signal-cobalt)]" />
                    <span>TRADITIONAL ASTERISM FIGURE &amp; CONNECTING EDGES</span>
                  </span>
                  {asterismDiagramData.refPattern && (
                    <span className="hud-reticle px-2 py-0.5 text-[10px] font-mono text-[var(--signal-cobalt)] bg-[var(--bg-pill-active)] font-bold uppercase">
                      TRACE ORDER: #{asterismDiagramData.refPattern.orderedStarIds.length} NODES
                    </span>
                  )}
                </div>

                <div className="relative w-full h-[220px] bg-[var(--bg-viewport)] rounded-[8px] overflow-hidden border border-[var(--bg-tray)] flex items-center justify-center">
                  <svg
                    viewBox={`0 0 ${asterismDiagramData.svgWidth} ${asterismDiagramData.svgHeight}`}
                    className="w-full h-full"
                  >
                    <defs>
                      <pattern id="modal-dot-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                        <circle cx="3" cy="3" r="0.8" fill="#334155" opacity="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#modal-dot-grid)" />

                    {/* Connecting constellation lines */}
                    {asterismDiagramData.segments.map((seg, idx) => (
                      <line
                        key={idx}
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke="#6892F6"
                        strokeWidth="1.8"
                        strokeOpacity="0.85"
                      />
                    ))}

                    {/* Star nodes */}
                    {asterismDiagramData.stars.map((s, idx) => {
                      const radius = Math.max(3, 7 - s.star.mag * 0.75);
                      const isBright = s.star.mag < 2.5;

                      return (
                        <g
                          key={idx}
                          className="cursor-pointer group"
                          onMouseEnter={() => setHoveredStar(s.star)}
                          onMouseLeave={() => setHoveredStar(null)}
                        >
                          {/* Outer reticle ring */}
                          <circle
                            cx={s.px}
                            cy={s.py}
                            r={radius + 3.5}
                            fill="none"
                            stroke="#1D55F5"
                            strokeWidth="1"
                            strokeDasharray={isBright ? "none" : "2 2"}
                            opacity={isBright ? 0.8 : 0.4}
                          />
                          {/* Main star circle */}
                          <circle
                            cx={s.px}
                            cy={s.py}
                            r={radius}
                            fill={isBright ? '#FFFFFF' : '#C7D5EC'}
                            stroke="#1D55F5"
                            strokeWidth="1"
                          />
                          {/* Traversal sequence badge if recognized pattern */}
                          {s.seqIndex !== null && (
                            <text
                              x={s.px + 8}
                              y={s.py - 6}
                              fill="#1D55F5"
                              fontSize="11"
                              fontFamily="Doto, monospace"
                              fontWeight="bold"
                            >
                              {s.seqIndex}
                            </text>
                          )}
                          {/* Star name label */}
                          {(s.star.proper || s.star.bayer) && (
                            <text
                              x={s.px}
                              y={s.py + radius + 11}
                              fill="#8C93A0"
                              fontSize="9"
                              fontFamily="IBM Plex Mono, monospace"
                              textAnchor="middle"
                            >
                              {s.star.proper || s.star.bayer}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Star details telemetry bar on hover */}
                  {hoveredStar && (
                    <div className="absolute bottom-2 left-2 right-2 bg-[var(--bg-card)] border border-[var(--signal-mid)] p-2 rounded-[6px] text-xs font-mono text-[var(--ink-primary)] flex items-center justify-between pointer-events-none shadow-none">
                      <div className="flex items-center gap-2">
                        <span className="font-dot text-[var(--signal-cobalt)] font-bold">{hoveredStar.proper || hoveredStar.name}</span>
                        {hoveredStar.bayer && <span className="text-[var(--ink-muted)]">({hoveredStar.bayer})</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[var(--ink-secondary)] text-[11px]">
                        <span>MAG: <strong className="font-dot text-[var(--signal-cobalt)]">{hoveredStar.mag.toFixed(2)}</strong></span>
                        {hoveredStar.spect && <span>SPECTRAL: {hoveredStar.spect}</span>}
                        {hoveredStar.dist && <span>DIST: {Math.round(hoveredStar.dist)} PC</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seasonal Visibility Dot Matrix Rows (SPR, SUM, AUT, WIN) */}
            <div className="p-3 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="telemetry-label text-[10px]">SEASONAL VISIBILITY DOT MATRIX</span>
                <span className="text-[10px] text-[var(--ink-muted)] uppercase">
                  ACTIVE SEASON: <strong className="text-[var(--signal-cobalt)] font-dot">{modalSeason.toUpperCase()}</strong>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['Spring', 'Summer', 'Autumn', 'Winter'] as const).map(s => {
                  const isSeasonActive = modalSeason === s;
                  const abbr = s.slice(0, 3).toUpperCase();
                  return (
                    <div key={s} className="bg-[var(--bg-card)] border border-[var(--card-border-subtle)] rounded-[6px] p-2 flex flex-col items-center gap-1.5">
                      <span className={`text-[10px] font-bold ${isSeasonActive ? 'text-[var(--signal-cobalt)] font-dot' : 'text-[var(--ink-muted)]'}`}>
                        {abbr}
                      </span>
                      <div className="grid grid-cols-4 gap-[2.5px]">
                        {Array.from({ length: 8 }).map((_, dIdx) => (
                          <span
                            key={dIdx}
                            className={`w-[4px] h-[4px] rounded-full ${
                              isSeasonActive ? 'bg-[var(--dot-active)]' : 'bg-[var(--dot-inactive)]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scientific Details with Tier 1 Doto Font */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] space-y-0.5">
                <span className="telemetry-label text-[9px] block">CURRENT ALTITUDE</span>
                <span className="font-dot text-base text-[var(--signal-cobalt)] font-bold">
                  {modalHor ? `${modalHor.altitude.toFixed(1)}°` : '—'}
                </span>
              </div>
              <div className="p-2.5 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] space-y-0.5">
                <span className="telemetry-label text-[9px] block">CURRENT AZIMUTH</span>
                <span className="font-dot text-base text-[var(--signal-cobalt)] font-bold">
                  {modalHor ? `${modalHor.azimuth.toFixed(0)}° (${getAzimuthDirection(modalHor.azimuth)})` : '—'}
                </span>
              </div>
              <div className="p-2.5 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] space-y-0.5">
                <span className="telemetry-label text-[9px] block">CELESTIAL CENTER</span>
                <span className="font-dot text-xs text-[var(--ink-primary)] block pt-1">
                  RA {(selectedConstellation.raCenter / 15).toFixed(1)}H // DEC {selectedConstellation.decCenter.toFixed(1)}°
                </span>
              </div>
              <div className="p-2.5 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] space-y-0.5">
                <span className="telemetry-label text-[9px] block">SKY AREA</span>
                <span className="font-dot text-xs text-[var(--ink-primary)] block pt-1">
                  {selectedConstellation.area} SQ DEG
                </span>
              </div>
            </div>

            {/* Tactile Hardware Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  handleFocusSky(selectedConstellation);
                  setSelectedConstellation(null);
                }}
                className="tactile-button bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] text-[var(--ink-primary)] hover:text-[var(--signal-cobalt)] border border-[var(--bg-tray)] flex-1 py-2 px-3 text-center text-xs flex items-center justify-center gap-1.5"
              >
                <span>🔭</span>
                <span>FIND IN SKY CANVAS ↗</span>
              </button>
              <button
                onClick={() => {
                  handleStartTrace(selectedConstellation);
                  setSelectedConstellation(null);
                }}
                className="tactile-button bg-[var(--signal-cobalt)] hover:bg-[var(--signal-mid)] text-white border border-[var(--signal-mid)] flex-1 py-2 px-3 text-center text-xs flex items-center justify-center gap-1.5"
              >
                <span>✍️</span>
                <span>TRACE IN LIVE SKY ↗</span>
              </button>
              <button
                onClick={() => {
                  handleInspectAutomaton(selectedConstellation);
                  setSelectedConstellation(null);
                }}
                className="tactile-button bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-surface)] flex-1 py-2 px-3 text-center text-xs flex items-center justify-center gap-1.5"
              >
                <span>⚡</span>
                <span>INSPECT IN AUTOMATA LAB ↗</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
