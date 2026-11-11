import React, { useState, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATIONS, REFERENCE_PATTERNS, STAR_BY_ID } from '../../data/astroData';
import { getHorizontalCoordinates, getMeridianCulmination } from '../../astronomy/coordinates';
import type { IAUConstellation, Star } from '../../types/astronomy';

// Compass direction lookup from azimuth degrees
const getAzimuthDirection = (az: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round((((az % 360) + 360) % 360) / 45) % 8;
  return dirs[idx];
};

// Formats stellar spectral classification into human-readable astronomical types
const formatSpectralType = (spect: string | null): string => {
  if (!spect) return 'STAR';
  const s = spect.trim().toUpperCase();
  if (s.startsWith('M')) {
    if (s.includes('I')) return 'RED SUPERGIANT';
    if (s.includes('III')) return 'RED GIANT';
    return 'RED STAR';
  }
  if (s.startsWith('B')) {
    if (s.includes('IA') || s.includes('IB') || s.includes('I')) return 'BLUE SUPERGIANT';
    if (s.includes('III')) return 'B-TYPE GIANT';
    return 'B-TYPE STAR';
  }
  if (s.startsWith('O')) {
    if (s.includes('I')) return 'O-TYPE SUPERGIANT';
    return 'O-TYPE BLUE';
  }
  if (s.startsWith('A')) {
    if (s.includes('I')) return 'WHITE SUPERGIANT';
    if (s.includes('III')) return 'A-TYPE GIANT';
    return 'WHITE STAR';
  }
  if (s.startsWith('F')) {
    if (s.includes('I')) return 'YELLOW-WHITE SUPERGIANT';
    if (s.includes('III')) return 'F-TYPE GIANT';
    return 'F-TYPE STAR';
  }
  if (s.startsWith('G')) {
    if (s.includes('I')) return 'YELLOW SUPERGIANT';
    if (s.includes('III')) return 'YELLOW GIANT';
    return 'G-TYPE STAR';
  }
  if (s.startsWith('K')) {
    if (s.includes('I')) return 'ORANGE SUPERGIANT';
    if (s.includes('III')) return 'ORANGE GIANT';
    return 'ORANGE STAR';
  }
  return spect;
};

// Compute season for each constellation based on transit Right Ascension
const getConstellationSeason = (raCenter: number): 'Spring' | 'Summer' | 'Autumn' | 'Winter' => {
  const raHours = (raCenter / 15.0) % 24.0;
  if (raHours >= 3 && raHours < 9) return 'Winter';
  if (raHours >= 9 && raHours < 15) return 'Spring';
  if (raHours >= 15 && raHours < 21) return 'Summer';
  return 'Autumn';
};

// Computes the 4 best viewing months (opposition to the Sun)
const getBestViewingMonths = (raCenter: number): string[] => {
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const conRaHours = (raCenter / 15.0) % 24.0;
  const scoredMonths: { name: string; diff: number; idx: number }[] = [];

  for (let m = 0; m < 12; m++) {
    // Sun RA at month m: Sun is at 0h around March 21 (m ≈ 2.7)
    const sunRa = ((m - 2.7) * 2 + 24) % 24;
    // Opposition (midnight transit) is 12h away from Sun RA
    const midnightRa = (sunRa + 12) % 24;
    let diff = Math.abs(conRaHours - midnightRa);
    if (diff > 12) diff = 24 - diff;
    scoredMonths.push({ name: monthNames[m], diff, idx: m });
  }

  scoredMonths.sort((a, b) => a.diff - b.diff);
  const top4 = scoredMonths.slice(0, 4);

  // Keep in natural calendar order, handling year-end wraparound
  const indices = top4.map(t => t.idx);
  const minIdx = Math.min(...indices);
  const maxIdx = Math.max(...indices);
  if (maxIdx - minIdx > 5) {
    top4.sort((a, b) => ((a.idx + 6) % 12) - ((b.idx + 6) % 12));
  } else {
    top4.sort((a, b) => a.idx - b.idx);
  }

  return top4.map(t => t.name);
};

// Precompute deterministic 1..88 rank for all constellations by area descending (with id tie-breaker)
const CONSTELLATION_RANKS = new Map<string, number>();
const sortedByArea = [...CONSTELLATIONS].sort((a, b) => b.area - a.area || a.id.localeCompare(b.id));
sortedByArea.forEach((c, idx) => CONSTELLATION_RANKS.set(c.id, idx + 1));

// Mini Asterism Vector Graphic on subtle dot grid for catalog cards
const MiniAsterismPreview: React.FC<{ con: IAUConstellation }> = React.memo(({ con }) => {
  const rad = Math.PI / 180;
  const cosDec = Math.cos(con.decCenter * rad);
  const coords = useMemo(() => {
    return con.starIds
      .map(sid => {
        const star = STAR_BY_ID.get(sid);
        if (!star) return null;
        let dRa = star.ra - con.raCenter;
        while (dRa > 180) dRa -= 360;
        while (dRa < -180) dRa += 360;
        const x = -dRa * cosDec;
        const y = -(star.dec - con.decCenter);
        return { sid, x, y };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [con, cosDec]);

  if (coords.length === 0) {
    return (
      <div className="w-full h-24 bg-[#F8FAFC] border border-[var(--bg-tray)] rounded-[8px] flex items-center justify-center text-[10px] text-[var(--ink-muted)]">
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
  const width = 180;
  const height = 90;
  const pad = 12;
  const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const starMap = new Map(
    coords.map(c => [
      c.sid,
      { x: width / 2 + (c.x - midX) * scale, y: height / 2 + (c.y - midY) * scale },
    ])
  );

  return (
    <div className="relative w-full h-24 bg-[#F8FAFC] rounded-[8px] overflow-hidden border border-[var(--bg-tray)] flex items-center justify-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <pattern id={`mini-dg-${con.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="#94A3B8" opacity="0.45" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#mini-dg-${con.id})`} />
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
              stroke="#1D55F5"
              strokeWidth="1.2"
              strokeOpacity="0.8"
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
              r="2.2"
              fill="#1D55F5"
              stroke="#FFFFFF"
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
    focusedConstellationId,
    setFocusedConstellationId,
    loadPresetTrace,
    setAutomataTab,
    setSimulatorSymbols,
    focusOnConstellation,
  } = useAstroStore();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ZODIAC' | 'SEASONAL' | 'NORTHERN' | 'SOUTHERN' | 'FAVORITES'>('ALL');
  const [selectedFamily, setSelectedFamily] = useState('ALL');
  const [recognitionOnly, setRecognitionOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(['Ori']));
  const [selectedConstellation, setSelectedConstellation] = useState<IAUConstellation | null>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('constellation');
      if (p) {
        return CONSTELLATIONS.find(c => c.id.toLowerCase() === p.toLowerCase() || c.name.toLowerCase() === p.toLowerCase()) || null;
      }
    }
    return null;
  });
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);

  // Available families from catalog
  const families = useMemo(() => {
    const set = new Set(CONSTELLATIONS.map(c => c.family));
    return ['ALL', ...Array.from(set).sort()];
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter constellations conjunctively
  const filtered = useMemo(() => {
    return CONSTELLATIONS.filter(c => {
      // Pill filter
      if (activeFilter === 'ZODIAC' && c.family !== 'Zodiacal') return false;
      if (activeFilter === 'SEASONAL') {
        const currentSeason = getConstellationSeason((observationDate.getMonth() / 12) * 360);
        if (getConstellationSeason(c.raCenter) !== currentSeason) return false;
      }
      if (activeFilter === 'NORTHERN' && c.decCenter < 0) return false;
      if (activeFilter === 'SOUTHERN' && c.decCenter >= 0) return false;
      if (activeFilter === 'FAVORITES' && !favorites.has(c.id)) return false;

      // Family dropdown
      if (selectedFamily !== 'ALL' && c.family !== selectedFamily) return false;

      // DFA Recognition toggle
      if (recognitionOnly && !REFERENCE_PATTERNS.some(p => p.constellationId === c.id)) return false;

      // Text search
      if (!search) return true;
      const term = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.englishName.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term) ||
        c.brightestStar.toLowerCase().includes(term)
      );
    });
  }, [search, activeFilter, selectedFamily, recognitionOnly, favorites, observationDate]);

  // Action handlers
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

  // Precomputed notable stars for the selected constellation
  const selectedStars = useMemo(() => {
    if (!selectedConstellation) return [];
    return selectedConstellation.starIds
      .map(sid => STAR_BY_ID.get(sid))
      .filter((s): s is Star => s !== undefined)
      .sort((a, b) => a.mag - b.mag);
  }, [selectedConstellation]);

  // Magnitude range for the selected constellation
  const magRange = useMemo(() => {
    if (selectedStars.length === 0) return '—';
    const minMag = selectedStars[0].mag;
    const maxMag = selectedStars[selectedStars.length - 1].mag;
    return `${minMag >= 0 ? '+' : ''}${minMag.toFixed(1)} – ${maxMag >= 0 ? '+' : ''}${maxMag.toFixed(1)}`;
  }, [selectedStars]);

  // 2D Projection for the interactive SVG Asterism Diagram in the detail view
  const asterismDiagramData = useMemo(() => {
    if (!selectedConstellation) return null;
    const rad = Math.PI / 180;
    const cosDecCenter = Math.cos(selectedConstellation.decCenter * rad);

    const rawCoords = selectedConstellation.starIds
      .map(sid => {
        const star = STAR_BY_ID.get(sid);
        if (!star) return null;
        let dRa = star.ra - selectedConstellation.raCenter;
        while (dRa > 180) dRa -= 360;
        while (dRa < -180) dRa += 360;
        const x = -dRa * cosDecCenter;
        const y = -(star.dec - selectedConstellation.decCenter);
        return { sid, star, x, y };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    if (rawCoords.length === 0) return null;

    const minX = Math.min(...rawCoords.map(c => c.x));
    const maxX = Math.max(...rawCoords.map(c => c.x));
    const minY = Math.min(...rawCoords.map(c => c.y));
    const maxY = Math.max(...rawCoords.map(c => c.y));

    const spanX = Math.max(maxX - minX, 0.5);
    const spanY = Math.max(maxY - minY, 0.5);

    const svgWidth = 460;
    const svgHeight = 280;
    const pad = 42;

    const scale = Math.min((svgWidth - 2 * pad) / spanX, (svgHeight - 2 * pad) / spanY);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const refPattern = REFERENCE_PATTERNS.find(
      p => p.constellationId === selectedConstellation.id && p.traversalVariant === 'forward'
    );

    // Identify top 2 notable stars to label prominently with reticles
    const top2StarIds = new Set(selectedStars.slice(0, 2).map(s => s.id));

    const positionedStars = rawCoords.map(c => {
      const px = svgWidth / 2 + (c.x - midX) * scale;
      const py = svgHeight / 2 + (c.y - midY) * scale;
      const seqIndex = refPattern ? refPattern.orderedStarIds.indexOf(c.sid) : -1;
      const isNotableReticle = top2StarIds.has(c.sid);
      return {
        sid: c.sid,
        star: c.star,
        px,
        py,
        seqIndex: seqIndex >= 0 ? seqIndex + 1 : null,
        isNotableReticle,
      };
    });

    const starPosMap = new Map(positionedStars.map(p => [p.sid, p]));

    const segments = selectedConstellation.lineSegments
      .map(seg => {
        const p1 = starPosMap.get(seg.starId1);
        const p2 = starPosMap.get(seg.starId2);
        if (!p1 || !p2) return null;
        return { x1: p1.px, y1: p1.py, x2: p2.px, y2: p2.py };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    return {
      svgWidth,
      svgHeight,
      stars: positionedStars,
      segments,
      refPattern,
    };
  }, [selectedConstellation, selectedStars]);

  // Hourly Night Altitude Sampling (18:00 to 04:00, 31 points)
  const nightVisibility = useMemo(() => {
    if (!selectedConstellation) return null;

    const nightStart = new Date(observationDate);
    nightStart.setHours(18, 0, 0, 0);

    const sampleCount = 31;
    const stepMinutes = 20;
    const samples: { timeStr: string; altitude: number; pct: number; isAboveHorizon: boolean }[] = [];

    let peakAlt = -90;
    let peakTimeStr = '';
    let aboveHorizonStart: string | null = null;
    let aboveHorizonEnd: string | null = null;

    for (let i = 0; i < sampleCount; i++) {
      const t = new Date(nightStart.getTime() + i * stepMinutes * 60 * 1000);
      const hor = getHorizontalCoordinates(selectedConstellation.raCenter, selectedConstellation.decCenter, observer, t);
      const alt = hor.altitude;

      if (alt > peakAlt) {
        peakAlt = alt;
        peakTimeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }

      const pct = alt > 0 ? Math.min(100, Math.round((alt / 90) * 100)) : 0;
      const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      if (hor.isAboveHorizon) {
        if (!aboveHorizonStart) aboveHorizonStart = timeStr;
        aboveHorizonEnd = timeStr;
      }

      samples.push({
        timeStr,
        altitude: alt,
        pct,
        isAboveHorizon: hor.isAboveHorizon,
      });
    }

    let nextWindow = 'BELOW HORIZON';
    if (peakAlt > 0) {
      if (aboveHorizonStart && aboveHorizonEnd && aboveHorizonStart !== aboveHorizonEnd) {
        nextWindow = `${aboveHorizonStart} – ${aboveHorizonEnd}`;
      } else {
        nextWindow = `PEAK ~${peakTimeStr}`;
      }
    }

    return { samples, peakAlt, nextWindow };
  }, [selectedConstellation, observer, observationDate]);

  // Seasonal visibility dot matrix: 8 samples across each season at 22:00
  const seasonalMatrix = useMemo(() => {
    if (!selectedConstellation) return [];

    const baseYear = observationDate.getFullYear();
    const seasonsDef = [
      { id: 'SPR', name: 'Spring', start: new Date(baseYear, 2, 21) },
      { id: 'SUM', name: 'Summer', start: new Date(baseYear, 5, 21) },
      { id: 'AUT', name: 'Autumn', start: new Date(baseYear, 8, 21) },
      { id: 'WIN', name: 'Winter', start: new Date(baseYear, 11, 21) },
    ];

    return seasonsDef.map(season => {
      const dots: boolean[] = [];
      for (let i = 0; i < 8; i++) {
        const d = new Date(season.start.getTime() + i * (90 / 8) * 86400000);
        d.setHours(22, 0, 0, 0);
        const hor = getHorizontalCoordinates(selectedConstellation.raCenter, selectedConstellation.decCenter, observer, d);
        dots.push(hor.altitude > 10);
      }
      return { id: season.id, name: season.name, dots };
    });
  }, [selectedConstellation, observer, observationDate]);

  // Current real-time coordinates
  const currentHor = useMemo(() => {
    if (!selectedConstellation) return null;
    return getHorizontalCoordinates(selectedConstellation.raCenter, selectedConstellation.decCenter, observer, observationDate);
  }, [selectedConstellation, observer, observationDate]);

  // Current meridian culmination info
  const meridian = useMemo(() => {
    if (!selectedConstellation) return null;
    return getMeridianCulmination(selectedConstellation.raCenter, selectedConstellation.decCenter, observer, observationDate);
  }, [selectedConstellation, observer, observationDate]);

  // =========================================================================
  // VIEW 1: FULL IN-APP DETAIL VIEW (Frame 12)
  // =========================================================================
  if (selectedConstellation) {
    const rank = CONSTELLATION_RANKS.get(selectedConstellation.id) || '—';
    const bestMonths = getBestViewingMonths(selectedConstellation.raCenter);

    // Visibility level description
    let visibilityCategory = 'BELOW HORIZON';
    if (currentHor && currentHor.altitude >= 40) visibilityCategory = 'HIGH';
    else if (currentHor && currentHor.altitude >= 20) visibilityCategory = 'MODERATE';
    else if (currentHor && currentHor.altitude > 0) visibilityCategory = 'LOW';

    return (
      <div className="w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-mono p-3 gap-3 overflow-y-auto">
        {/* Top Header Row with Back Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedConstellation(null)}
            className="tactile-pill hud-reticle px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer bg-white border border-[var(--bg-tray)] hover:border-[var(--signal-cobalt)] hover:text-[var(--signal-cobalt)]"
          >
            <span className="font-bold text-sm">←</span>
            <span>CONSTELLATION DETAILS</span>
          </button>
        </div>

        {/* Top Summary Bento Card matching Frame 12 */}
        <div className="bento-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[var(--bg-tray)] bg-white rounded-[12px]">
          <div className="flex flex-wrap items-baseline gap-6">
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-bold font-mono tracking-wider text-[var(--ink-primary)]">
                  {selectedConstellation.name.toUpperCase()}
                </h1>
                <span className="text-xs font-mono font-semibold text-[var(--ink-muted)]">
                  {selectedConstellation.id}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="micro-label block">TYPE</span>
                <span className="font-semibold text-[var(--ink-primary)] tracking-wide">CONSTELLATION</span>
              </div>
              <div className="h-6 w-px bg-[var(--bg-tray)]" />
              <div>
                <span className="micro-label block">AREA</span>
                <span className="font-bold font-dot text-sm text-[var(--ink-primary)]">
                  {selectedConstellation.area} <span className="text-[10px] text-[var(--ink-muted)] font-mono">SQ DEG</span>
                </span>
              </div>
              <div className="h-6 w-px bg-[var(--bg-tray)]" />
              <div>
                <span className="micro-label block">RANK</span>
                <span className="font-bold font-dot text-sm text-[var(--ink-primary)]">
                  {rank} <span className="text-[10px] text-[var(--ink-muted)] font-mono">/ 88</span>
                </span>
              </div>
              <div className="h-6 w-px bg-[var(--bg-tray)]" />
              <div>
                <span className="micro-label block">MAG RANGE</span>
                <span className="font-mono font-semibold text-xs text-[var(--ink-primary)]">
                  {magRange}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Open in Sky, Start Trace, Inspect Automaton */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleFocusSky(selectedConstellation)}
              className="tactile-button bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--bg-tray)] px-3 py-2 text-xs flex items-center gap-1.5"
            >
              <span>OPEN IN SKY</span>
              <span>↗</span>
            </button>
            <button
              onClick={() => handleStartTrace(selectedConstellation)}
              className="tactile-button bg-[var(--signal-cobalt)] hover:bg-[#1545CC] text-white border border-[var(--signal-cobalt)] px-3.5 py-2 text-xs flex items-center gap-1.5 font-bold"
            >
              <span>START TRACE</span>
              <span>▷</span>
            </button>
            <button
              onClick={() => handleInspectAutomaton(selectedConstellation)}
              className="tactile-button bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] text-[var(--ink-secondary)] hover:text-[var(--signal-cobalt)] border border-[var(--bg-tray)] px-2.5 py-2 text-xs flex items-center gap-1"
              title="Inspect in Automata Lab"
            >
              <span>⚡</span>
            </button>
          </div>
        </div>

        {/* Main 3-Column Content Layout (matching Frame 12) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* COLUMN 1: Constellation Diagram + Metadata */}
          <div className="flex flex-col gap-3">
            {/* Constellation Diagram Card */}
            <div className="bento-card p-3.5 bg-white border border-[var(--bg-tray)] rounded-[12px] flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--bg-tray)]">
                <span className="telemetry-label text-[11px] font-bold">CONSTELLATION DIAGRAM</span>
                {asterismDiagramData?.refPattern && (
                  <span className="text-[10px] text-[var(--signal-cobalt)] bg-[var(--bg-pill-active)] px-1.5 py-0.5 rounded-[4px] font-bold">
                    DFA RECOGNIZABLE
                  </span>
                )}
              </div>

              {asterismDiagramData && (
                <div className="relative w-full h-[280px] bg-[#F8FAFC] rounded-[8px] overflow-hidden border border-[var(--bg-tray)] flex items-center justify-center">
                  <svg
                    viewBox={`0 0 ${asterismDiagramData.svgWidth} ${asterismDiagramData.svgHeight}`}
                    className="w-full h-full"
                  >
                    <defs>
                      <pattern id="detail-dot-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                        <circle cx="3" cy="3" r="0.75" fill="#94A3B8" opacity="0.4" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#detail-dot-grid)" />

                    {/* Connecting constellation lines */}
                    {asterismDiagramData.segments.map((seg, idx) => (
                      <line
                        key={idx}
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke="#6892F6"
                        strokeWidth="1.5"
                        strokeOpacity="0.85"
                      />
                    ))}

                    {/* Star nodes */}
                    {asterismDiagramData.stars.map((s, idx) => {
                      const radius = s.isNotableReticle ? 4.5 : Math.max(2.5, 5 - s.star.mag * 0.6);
                      const starName = s.star.proper || s.star.name;

                      return (
                        <g
                          key={idx}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredStar(s.star)}
                          onMouseLeave={() => setHoveredStar(null)}
                        >
                          {/* Concentric reticle ring for prominent notable stars (matching Betelgeuse & Rigel in Frame 12) */}
                          {s.isNotableReticle && (
                            <circle
                              cx={s.px}
                              cy={s.py}
                              r={radius + 4.5}
                              fill="none"
                              stroke="#1D55F5"
                              strokeWidth="1.2"
                              opacity="0.85"
                            />
                          )}

                          {/* Main star circle */}
                          <circle
                            cx={s.px}
                            cy={s.py}
                            r={radius}
                            fill="#1D55F5"
                            stroke="#FFFFFF"
                            strokeWidth="1.2"
                          />

                          {/* Prominent label beside notable stars (Frame 12 Betelgeuse / Rigel style) */}
                          {s.isNotableReticle && starName && (
                            <text
                              x={s.px < asterismDiagramData.svgWidth / 2 ? s.px - radius - 6 : s.px + radius + 6}
                              y={s.py + 4}
                              fill="#181A20"
                              fontSize="10"
                              fontFamily="IBM Plex Mono, monospace"
                              fontWeight="bold"
                              textAnchor={s.px < asterismDiagramData.svgWidth / 2 ? 'end' : 'start'}
                            >
                              {starName.toUpperCase()}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {/* Star details tooltip on hover */}
                  {hoveredStar && (
                    <div className="absolute bottom-2 left-2 right-2 bg-white/95 border border-[var(--signal-cobalt)] p-2 rounded-[6px] text-xs font-mono text-[var(--ink-primary)] flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--signal-cobalt)]">{hoveredStar.proper || hoveredStar.name}</span>
                        {hoveredStar.bayer && <span className="text-[var(--ink-muted)]">({hoveredStar.bayer})</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--ink-secondary)]">
                        <span>MAG: <strong className="text-[var(--signal-cobalt)]">{hoveredStar.mag.toFixed(2)}</strong></span>
                        <span>SPECT: {hoveredStar.spect || '—'}</span>
                        {hoveredStar.dist && <span>DIST: {Math.round(hoveredStar.dist)} PC</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metadata Card */}
            <div className="bento-card p-3.5 bg-white border border-[var(--bg-tray)] rounded-[12px] space-y-2">
              <span className="telemetry-label text-[11px] font-bold block pb-1 border-b border-[var(--bg-tray)]">
                METADATA
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-muted)] uppercase">NAME</span>
                  <span className="font-semibold text-[var(--ink-primary)]">{selectedConstellation.name.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-muted)] uppercase">ABBREVIATION</span>
                  <span className="font-semibold text-[var(--ink-primary)]">{selectedConstellation.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-muted)] uppercase">AREA</span>
                  <span className="font-semibold text-[var(--ink-primary)]">{selectedConstellation.area} SQ DEG</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-muted)] uppercase">RANK</span>
                  <span className="font-semibold text-[var(--ink-primary)]">{rank} / 88</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-muted)] uppercase">FAMILY</span>
                  <span className="font-semibold text-[var(--ink-primary)]">{selectedConstellation.family.toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-muted)] uppercase">CENTER</span>
                  <span className="font-semibold text-[var(--ink-primary)]">
                    RA {(selectedConstellation.raCenter / 15).toFixed(1)}H // DEC {selectedConstellation.decCenter.toFixed(1)}°
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--ink-muted)] uppercase">BRIGHTEST STAR</span>
                  <span className="font-semibold text-[var(--signal-cobalt)]">{selectedConstellation.brightestStar}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: Notable Stars + Seasonal Visibility */}
          <div className="flex flex-col gap-3">
            {/* Notable Stars Table Card */}
            <div className="bento-card p-3.5 bg-white border border-[var(--bg-tray)] rounded-[12px] space-y-2 flex-1">
              <span className="telemetry-label text-[11px] font-bold block pb-1 border-b border-[var(--bg-tray)]">
                NOTABLE STARS
              </span>

              <div className="w-full text-xs font-mono">
                <div className="grid grid-cols-12 text-[10px] text-[var(--ink-muted)] uppercase font-semibold pb-1.5 border-b border-[var(--bg-tray)]">
                  <span className="col-span-5">STAR</span>
                  <span className="col-span-4">TYPE</span>
                  <span className="col-span-3 text-right">MAG</span>
                </div>

                <div className="divide-y divide-[var(--bg-tray)]">
                  {selectedStars.slice(0, 6).map(star => {
                    const starTitle = star.proper || star.name;
                    const spectStr = formatSpectralType(star.spect);
                    const magStr = (star.mag >= 0 ? '+' : '') + star.mag.toFixed(2);

                    return (
                      <div key={star.id} className="grid grid-cols-12 py-2 items-center hover:bg-[#F8FAFC]">
                        <div className="col-span-5 flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-cobalt)] shrink-0" />
                          <span className="font-bold text-[var(--ink-primary)] uppercase truncate">{starTitle}</span>
                        </div>
                        <div className="col-span-4 text-[11px] text-[var(--ink-secondary)] truncate">
                          {spectStr}
                        </div>
                        <div className="col-span-3 text-right font-mono font-semibold text-[var(--ink-primary)]">
                          {magStr}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Seasonal Visibility Dot Matrix Card */}
            <div className="bento-card p-3.5 bg-white border border-[var(--bg-tray)] rounded-[12px] space-y-2.5">
              <span className="telemetry-label text-[11px] font-bold block pb-1 border-b border-[var(--bg-tray)]">
                SEASONAL VISIBILITY
              </span>

              <div className="space-y-2">
                {seasonalMatrix.map(season => (
                  <div key={season.id} className="flex items-center justify-between text-xs font-mono">
                    <span className="w-10 text-[10px] font-bold uppercase text-[var(--ink-secondary)]">
                      {season.id}
                    </span>
                    <div className="flex items-center gap-2">
                      {season.dots.map((active, idx) => (
                        <span
                          key={idx}
                          className={`w-2.5 h-2.5 rounded-full ${
                            active ? 'bg-[var(--signal-cobalt)]' : 'bg-[#E2E5EC]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLUMN 3: Sky Preview + Best Months + Visibility Curve */}
          <div className="flex flex-col gap-3">
            {/* Sky Preview Card (Schematic Night Sky) */}
            <div className="bento-card p-3.5 bg-white border border-[var(--bg-tray)] rounded-[12px] space-y-2">
              <span className="telemetry-label text-[11px] font-bold block pb-1 border-b border-[var(--bg-tray)]">
                SKY PREVIEW
              </span>

              {asterismDiagramData && (
                <div className="relative w-full h-[140px] bg-[#070B16] rounded-[8px] overflow-hidden border border-[#1E293B] flex items-center justify-center">
                  <svg
                    viewBox={`0 0 ${asterismDiagramData.svgWidth} ${asterismDiagramData.svgHeight}`}
                    className="w-full h-full"
                  >
                    {/* Background star sprinkles */}
                    {Array.from({ length: 40 }).map((_, i) => (
                      <circle
                        key={i}
                        cx={(i * 37) % asterismDiagramData.svgWidth}
                        cy={(i * 59) % asterismDiagramData.svgHeight}
                        r={(i % 3) * 0.4 + 0.5}
                        fill="#FFFFFF"
                        opacity={(i % 5) * 0.15 + 0.25}
                      />
                    ))}

                    {/* Glowing constellation segments */}
                    {asterismDiagramData.segments.map((seg, idx) => (
                      <line
                        key={idx}
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke="#60A5FA"
                        strokeWidth="1.6"
                        strokeOpacity="0.8"
                      />
                    ))}

                    {/* Constellation stars with warm/blue colors */}
                    {asterismDiagramData.stars.map((s, idx) => {
                      const isWarm = s.star.proper === 'Betelgeuse' || (s.star.spect && s.star.spect.startsWith('M'));
                      const starColor = isWarm ? '#FF9E42' : '#93C5FD';
                      const radius = s.isNotableReticle ? 4.5 : Math.max(2, 4.5 - s.star.mag * 0.5);

                      return (
                        <circle
                          key={idx}
                          cx={s.px}
                          cy={s.py}
                          r={radius}
                          fill={starColor}
                          stroke="#FFFFFF"
                          strokeWidth="0.8"
                        />
                      );
                    })}
                  </svg>
                  <span className="absolute bottom-1 right-2 text-[8px] text-white/40 tracking-wider">
                    SCHEMATIC SKY VIEW
                  </span>
                </div>
              )}
            </div>

            {/* Best Viewing Months Card */}
            <div className="bento-card p-3.5 bg-white border border-[var(--bg-tray)] rounded-[12px] space-y-1.5">
              <span className="telemetry-label text-[11px] font-bold block">BEST VIEWING MONTHS</span>
              <div className="flex items-center gap-4 text-base font-bold font-mono text-[var(--signal-cobalt)] tracking-widest pt-0.5">
                {bestMonths.map(m => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>

            {/* Visibility Through The Night Curve Chart */}
            <div className="bento-card p-3.5 bg-white border border-[var(--bg-tray)] rounded-[12px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="telemetry-label text-[11px] font-bold">VISIBILITY THROUGH THE NIGHT</span>
                <span className="text-[9px] text-[var(--ink-muted)]">HORIZON SAMPLING</span>
              </div>

              {nightVisibility && (
                <div className="relative w-full h-[120px] bg-[#F8FAFC] rounded-[8px] border border-[var(--bg-tray)] p-2 flex flex-col justify-between">
                  <svg viewBox="0 0 340 85" className="w-full h-[65px] overflow-visible">
                    {/* Horizontal percentage grid lines (0%, 25%, 50%, 75%, 100%) */}
                    {[0, 25, 50, 75, 100].map(pct => {
                      const y = 65 - (pct / 100) * 55;
                      return (
                        <line
                          key={pct}
                          x1="30"
                          y1={y}
                          x2="330"
                          y2={y}
                          stroke="#E2E5EC"
                          strokeWidth="0.8"
                          strokeDasharray="2 2"
                        />
                      );
                    })}

                    {/* Percentage Y-axis labels */}
                    {[100, 50, 0].map(pct => {
                      const y = 65 - (pct / 100) * 55 + 3;
                      return (
                        <text
                          key={pct}
                          x="2"
                          y={y}
                          fill="#8C93A0"
                          fontSize="7"
                          fontFamily="IBM Plex Mono, monospace"
                        >
                          {pct}%
                        </text>
                      );
                    })}

                    {/* Sample dots along the night curve */}
                    {nightVisibility.samples.map((s, idx) => {
                      const x = 32 + (idx / 30) * 295;
                      const y = 65 - (s.pct / 100) * 55;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={s.isAboveHorizon ? '1.8' : '1.2'}
                          fill={s.isAboveHorizon ? '#1D55F5' : '#CBD5E1'}
                        />
                      );
                    })}
                  </svg>

                  {/* Hour labels along the bottom */}
                  <div className="flex justify-between text-[8px] text-[var(--ink-muted)] font-mono pl-7 pr-1 pt-1 border-t border-[var(--bg-tray)]">
                    <span>18:00</span>
                    <span>20:00</span>
                    <span>22:00</span>
                    <span>00:00</span>
                    <span>02:00</span>
                    <span>04:00</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Observation Summary (spanning col 2 & 3 style) */}
        <div className="bento-card p-4 bg-white border border-[var(--bg-tray)] rounded-[12px]">
          <span className="telemetry-label text-[11px] font-bold block pb-2 mb-2 border-b border-[var(--bg-tray)]">
            OBSERVATION SUMMARY
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            <div>
              <span className="micro-label block text-[10px]">CURRENT VISIBILITY</span>
              <span className="font-bold font-mono text-xl tracking-wide text-[var(--ink-primary)] block pt-0.5">
                {visibilityCategory}
              </span>
              <span className="text-[10px] text-[var(--ink-secondary)]">
                {currentHor ? `ALT ${currentHor.altitude.toFixed(1)}° (${getAzimuthDirection(currentHor.azimuth)})` : 'NO DATA'}
              </span>
            </div>

            <div className="border-l border-[var(--bg-tray)] pl-4">
              <span className="micro-label block text-[10px]">NEXT BEST WINDOW</span>
              <span className="font-bold font-dot text-lg text-[var(--signal-cobalt)] block pt-0.5">
                {nightVisibility ? nightVisibility.nextWindow : '—'}
              </span>
              <span className="text-[10px] text-[var(--ink-muted)]">
                OBSERVER: {observer.name.toUpperCase()}
              </span>
            </div>

            <div className="border-l border-[var(--bg-tray)] pl-4">
              <span className="micro-label block text-[10px]">PEAK ALTITUDE</span>
              <span className="font-bold font-dot text-xl text-[var(--signal-cobalt)] block pt-0.5">
                {nightVisibility ? `${nightVisibility.peakAlt.toFixed(0)}°` : '—'}
              </span>
              <span className="text-[10px] text-[var(--ink-muted)]">
                {meridian ? `TRANSIT ~${meridian.transitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'MAX TONIGHT'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CATALOG LIBRARY GRID (Frame 6)
  // =========================================================================
  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-mono p-3 gap-3 overflow-y-auto">
      {/* Top Header Row matching Frame 6 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-mono uppercase tracking-wider text-[var(--ink-primary)]">
            CONSTELLATION LIBRARY
          </h1>
        </div>

        {/* Search Omnibar in Bracket Reticle */}
        <div className="hud-reticle">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[var(--ink-muted)] text-xs">🔍</span>
            <input
              type="text"
              placeholder="SEARCH CONSTELLATIONS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white border border-[var(--bg-tray)] rounded-[8px] pl-8 pr-4 py-1.5 text-xs text-[var(--ink-primary)] font-mono uppercase tracking-wider w-72 focus:outline-none focus:border-[var(--signal-cobalt)] placeholder:text-[var(--ink-muted)]"
            />
          </div>
        </div>
      </div>

      {/* Filter Toolbar matching Frame 6 pills */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Frame 6 Filter Pills */}
          {(['ALL', 'ZODIAC', 'SEASONAL', 'NORTHERN', 'SOUTHERN', 'FAVORITES'] as const).map(f => {
            const isActive = activeFilter === f;
            const label = f === 'FAVORITES' ? '☆ FAVORITES' : f;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`tactile-pill text-[11px] uppercase tracking-wider ${
                  isActive ? 'active' : 'bg-white border-[var(--bg-tray)] text-[var(--ink-secondary)]'
                }`}
              >
                {label}
              </button>
            );
          })}

          <div className="h-4 w-px bg-[var(--bg-tray)] mx-1" />

          {/* Family Filter Pills */}
          <div className="hud-reticle">
            <select
              value={selectedFamily}
              onChange={e => setSelectedFamily(e.target.value)}
              className="bg-white border border-[var(--bg-tray)] rounded-[6px] px-2 py-1 text-[10px] text-[var(--ink-secondary)] font-mono uppercase tracking-wider cursor-pointer focus:outline-none focus:border-[var(--signal-cobalt)]"
            >
              {families.map(f => (
                <option key={f} value={f}>
                  {f === 'ALL' ? 'ALL FAMILIES' : `${f.toUpperCase()} FAMILY`}
                </option>
              ))}
            </select>
          </div>

          {/* Recognition Only Badge */}
          <button
            onClick={() => setRecognitionOnly(!recognitionOnly)}
            className={`tactile-pill text-[10px] uppercase tracking-wider font-bold ${
              recognitionOnly ? 'active' : 'bg-white border-[var(--bg-tray)] text-[var(--ink-secondary)]'
            }`}
          >
            {recognitionOnly ? '✓ DFA READY (12)' : 'SHOW ALL ASTERISMS'}
          </button>
        </div>

        <div className="text-[11px] font-mono text-[var(--ink-muted)] flex items-center gap-1.5 shrink-0">
          <span>CATALOG:</span>
          <span className="font-dot text-[var(--signal-cobalt)] font-bold text-xs">{filtered.length}</span>
          <span>/ 88 MODULES</span>
        </div>
      </div>

      {/* 4-Column Bento Grid with 12px Radius Cards matching Frame 6 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 flex-1 min-h-0">
        {filtered.map(con => {
          const isFav = favorites.has(con.id);
          const hasPattern = REFERENCE_PATTERNS.some(p => p.constellationId === con.id);
          const season = getConstellationSeason(con.raCenter);
          const stars = con.starIds.map(sid => STAR_BY_ID.get(sid)).filter(Boolean) as Star[];
          stars.sort((a, b) => a.mag - b.mag);
          const brightestMag = stars.length > 0 ? (stars[0].mag >= 0 ? '+' : '') + stars[0].mag.toFixed(1) : '—';
          const isSelected = focusedConstellationId === con.id || con.id === 'Ori';

          return (
            <div
              key={con.id}
              onClick={() => setSelectedConstellation(con)}
              className={`bento-card rounded-[12px] p-3.5 bg-white border cursor-pointer flex flex-col justify-between gap-2.5 relative hover:border-[var(--signal-cobalt)] ${
                isSelected ? 'border-[var(--signal-cobalt)] bg-[#F0F4FF]' : 'border-[#E2E5EC]'
              }`}
            >
              {/* Card Header with Name & Favorite Toggle */}
              <div>
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--ink-primary)]">
                      {con.name}
                    </h3>
                    <span className="text-[10px] text-[var(--ink-muted)] uppercase">
                      {con.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {hasPattern && (
                      <span className="px-1 py-0.2 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] text-[8px] font-bold uppercase rounded-[3px]">
                        DFA
                      </span>
                    )}
                    <button
                      onClick={e => toggleFavorite(con.id, e)}
                      className={`text-sm leading-none p-0.5 hover:scale-110 cursor-pointer ${
                        isFav ? 'text-[var(--signal-cobalt)]' : 'text-[#CBD5E1] hover:text-[var(--signal-cobalt)]'
                      }`}
                      title={isFav ? 'Remove favorite' : 'Add to favorites'}
                    >
                      {isFav ? '★' : '☆'}
                    </button>
                  </div>
                </div>

                {/* Asterism Preview Canvas */}
                <MiniAsterismPreview con={con} />

                {/* Info Rows */}
                <div className="mt-3 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[var(--ink-muted)] uppercase">BEST SEASON</span>
                    <span className="font-semibold text-[var(--ink-primary)] uppercase">{season}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[var(--ink-muted)] uppercase">KEY STARS</span>
                    <span className="font-semibold text-[var(--ink-primary)]">{con.starIds.length}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer with Mag Badge & Arrow Button */}
              <div className="pt-2 border-t border-[var(--bg-tray)] flex items-center justify-between text-[10px]">
                <span className="px-1.5 py-0.5 bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] text-[var(--ink-secondary)] font-mono text-[9px] font-semibold rounded-[4px]">
                  MAG {brightestMag}
                </span>
                <span className="text-[var(--signal-cobalt)] font-bold text-xs flex items-center gap-1">
                  <span>→</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
