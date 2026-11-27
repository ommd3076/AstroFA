import React, { useState, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATIONS, REFERENCE_PATTERNS, STAR_BY_ID } from '../../data/astroData';
import { getHorizontalCoordinates, getMeridianCulmination } from '../../astronomy/coordinates';
import type { IAUConstellation, Star } from '../../types/astronomy';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/board/base/buttons/button';
import { SearchField } from '../../components/ui/board/base/search-field/search-field';
import { Select, SelectItem } from '../../components/ui/board/base/select/select';
import { Switch } from '../../components/ui/board/base/switch/switch';
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '../../components/ui/board/base/table/table';
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/board/base/segmented-control/segmented-control';
import './constellationExplorer.css';

// BoardUI has no card primitive; keep these surfaces semantic and local to the catalog.
const Card: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className, ...props }) => (
  <section className={className} {...props} />
);

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
const MiniAsterismPreview: React.FC<{ con: IAUConstellation; size?: 'card' | 'detail' }> = React.memo(({ con, size = 'card' }) => {
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
      <div className={`w-full ${size === 'detail' ? 'h-[250px]' : 'h-36'} bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-[8px] flex items-center justify-center text-[10px] text-[var(--ink-muted)]`}>
        No asterism geometry
      </div>
    );
  }

  const minX = Math.min(...coords.map(c => c.x));
  const maxX = Math.max(...coords.map(c => c.x));
  const minY = Math.min(...coords.map(c => c.y));
  const maxY = Math.max(...coords.map(c => c.y));
  const spanX = Math.max(maxX - minX, 0.5);
  const spanY = Math.max(maxY - minY, 0.5);
  const width = size === 'detail' ? 360 : 180;
  const height = size === 'detail' ? 260 : 132;
  const pad = size === 'detail' ? 32 : 12;
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
    <div className={`relative w-full shrink-0 ${size === 'detail' ? 'h-[240px]' : 'h-36'} bg-[var(--bg-viewport)] rounded-lg overflow-hidden border border-[var(--border-subtle)] flex items-center justify-center`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <defs>
          <pattern id={`mini-dg-${con.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="0.75" fill="#2A2A32" opacity="0.65" />
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
              stroke="#8FA3FF"
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
              r="2.2"
              fill="#F3F1EB"
              stroke="#8FA3FF"
              strokeWidth="0.9"
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
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());
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
  const [librarySelectionId, setLibrarySelectionId] = useState<string | null>(() => focusedConstellationId || null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const librarySelection = librarySelectionId ? CONSTELLATIONS.find(c => c.id === librarySelectionId) ?? null : null;

  // Available families from catalog
  const families = useMemo(() => {
    const set = new Set(CONSTELLATIONS.map(c => c.family));
    return ['ALL', ...Array.from(set).sort()];
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter constellations conjunctively
  const filtered = useMemo(() => {
    const list = CONSTELLATIONS.filter(c => {
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

    const featuredOrder = ['Ori', 'UMa', 'Cas', 'Cyg', 'Leo', 'Tau', 'Lyr', 'Sco'];
    return list.sort((a, b) => {
      const idxA = featuredOrder.indexOf(a.id);
      const idxB = featuredOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
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

    const svgWidth = 420;
    const svgHeight = 420;
    const pad = 48;

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
      <div className="constellation-catalog w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-sans gap-4 overflow-y-auto pr-0.5">
        <PageHeader
          eyebrow={`IAU Constellation · ${selectedConstellation.family}`}
          title={selectedConstellation.name}
          meta={`${selectedConstellation.id} · Rank ${rank} / 88 · ${selectedConstellation.area} sq deg · Mag ${magRange}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setSelectedConstellation(null)}
                className="text-xs font-semibold gap-1.5"
              >
                <span aria-hidden="true">←</span>
                <span>Back to catalog</span>
              </Button>
              <Button variant="secondary" size="small" onClick={() => handleFocusSky(selectedConstellation)} className="text-xs font-semibold">
                Open in Sky ↗
              </Button>
              <Button variant="primary" size="small" onClick={() => handleStartTrace(selectedConstellation)} className="text-xs font-semibold">
                Start trace ▷
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => handleInspectAutomaton(selectedConstellation)}
                className="text-xs font-semibold"
                title="Inspect in Automata Lab"
                aria-label="Inspect in Automata Lab"
              >
                DFA
              </Button>
            </div>
          }
        />

        {/* Primary Asymmetric Split: Diagram Left, Companion Analysis Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 shrink-0">
          <div className="lg:col-span-5 flex flex-col gap-3">
            <Card className="p-3.5 gap-2 bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[12px] flex flex-col shadow-none h-full">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-secondary)]">Constellation diagram</span>
                {asterismDiagramData?.refPattern && (
                  <span className="text-[10px] font-mono text-[var(--signal-mid)] bg-[var(--bg-pill-active)] px-1.5 py-0.5 rounded font-semibold uppercase">
                    DFA Ready
                  </span>
                )}
              </div>

              {asterismDiagramData && (
                <div className="relative w-full h-[320px] md:h-[380px] xl:h-[440px] bg-[var(--bg-viewport)] rounded-lg overflow-hidden border border-[var(--border-subtle)] flex items-center justify-center">
                  <svg
                    viewBox={`0 0 ${asterismDiagramData.svgWidth} ${asterismDiagramData.svgHeight}`}
                    className="w-full h-full"
                  >
                    <defs>
                      <pattern id="detail-dot-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                        <circle cx="3" cy="3" r="0.75" fill="#2A2A32" opacity="0.65" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#detail-dot-grid)" />

                    {asterismDiagramData.segments.map((seg, idx) => (
                      <line
                        key={idx}
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke="#8FA3FF"
                        strokeWidth="1.5"
                        strokeOpacity="0.85"
                      />
                    ))}

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
                          {s.isNotableReticle && (
                            <circle
                              cx={s.px}
                              cy={s.py}
                              r={radius + 4.5}
                              fill="none"
                              stroke="#8FA3FF"
                              strokeWidth="1.2"
                              opacity="0.85"
                            />
                          )}

                          <circle
                            cx={s.px}
                            cy={s.py}
                            r={radius}
                            fill="#F3F1EB"
                            stroke="#8FA3FF"
                            strokeWidth="1.2"
                          />

                          {s.isNotableReticle && starName && (
                            <text
                              x={s.px < asterismDiagramData.svgWidth / 2 ? s.px - radius - 6 : s.px + radius + 6}
                              y={s.py + 4}
                              fill="#F3F1EB"
                              fontSize="10"
                              fontFamily="IBM Plex Mono, monospace"
                              fontWeight="600"
                              textAnchor={s.px < asterismDiagramData.svgWidth / 2 ? 'end' : 'start'}
                            >
                              {starName}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>

                  {hoveredStar && (
                    <div className="absolute bottom-2 left-2 right-2 bg-[var(--bg-card)]/95 border border-[var(--signal-surface)] p-2 rounded-md text-xs font-mono text-[var(--ink-primary)] flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--signal-mid)]">{hoveredStar.proper || hoveredStar.name}</span>
                        {hoveredStar.bayer && <span className="text-[var(--ink-muted)]">({hoveredStar.bayer})</span>}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] tabular-nums text-[var(--ink-secondary)]">
                        <span>MAG <strong className="text-[var(--signal-mid)]">{hoveredStar.mag.toFixed(2)}</strong></span>
                        <span>SPECT {hoveredStar.spect || '—'}</span>
                        {hoveredStar.dist && <span>DIST {Math.round(hoveredStar.dist)} pc</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3">
            <Card className="p-3.5 gap-2 bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[12px] flex-1 shadow-none">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-secondary)] block pb-1.5 border-b border-[var(--border-subtle)]">
                Notable stars
              </span>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableColumn isRowHeader className="text-[10px] uppercase">Star</TableColumn>
                    <TableColumn className="text-[10px] uppercase">Type</TableColumn>
                    <TableColumn className="text-right text-[10px] uppercase">Mag</TableColumn>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedStars.slice(0, 6).map(star => {
                    const starTitle = star.proper || star.name;
                    const spectStr = formatSpectralType(star.spect);
                    const magStr = (star.mag >= 0 ? '+' : '') + star.mag.toFixed(2);

                    return (
                      <TableRow key={star.id}>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-mid)] shrink-0" />
                            <span className="font-semibold text-[var(--ink-primary)] truncate text-xs">{starTitle}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 font-mono text-[10px] text-[var(--ink-secondary)]">
                          {spectStr}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono tabular-nums font-semibold text-[var(--ink-primary)] text-xs">
                          {magStr}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>

            <Card className="p-3.5 gap-2.5 bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[12px] shadow-none">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-secondary)] block pb-1.5 border-b border-[var(--border-subtle)]">
                Seasonal visibility
              </span>

              <div className="space-y-2">
                {seasonalMatrix.map(season => (
                  <div key={season.id} className="flex items-center justify-between text-xs font-mono">
                    <span className="w-10 text-[10px] font-semibold uppercase text-[var(--ink-secondary)]">
                      {season.id}
                    </span>
                    <div className="flex items-center gap-2">
                      {season.dots.map((active, idx) => (
                        <span
                          key={idx}
                          className={`w-2.5 h-2.5 rounded-full ${
                            active ? 'bg-[var(--signal-mid)]' : 'bg-[var(--dot-inactive)]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-3">
            <Card className="p-3.5 gap-2 bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[12px] shadow-none">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-secondary)] block pb-1.5 border-b border-[var(--border-subtle)]">
                Sky preview
              </span>

              {asterismDiagramData && (
                <div className="relative w-full h-[140px] bg-[var(--bg-viewport)] rounded-lg overflow-hidden border border-[var(--border-subtle)] flex items-center justify-center">
                  <svg
                    viewBox={`0 0 ${asterismDiagramData.svgWidth} ${asterismDiagramData.svgHeight}`}
                    className="w-full h-full"
                  >
                    {Array.from({ length: 40 }).map((_, i) => (
                      <circle
                        key={i}
                        cx={(i * 37) % asterismDiagramData.svgWidth}
                        cy={(i * 59) % asterismDiagramData.svgHeight}
                        r={(i % 3) * 0.4 + 0.5}
                        fill="#F3F1EB"
                        opacity={(i % 5) * 0.14 + 0.2}
                      />
                    ))}

                    {asterismDiagramData.segments.map((seg, idx) => (
                      <line
                        key={idx}
                        x1={seg.x1}
                        y1={seg.y1}
                        x2={seg.x2}
                        y2={seg.y2}
                        stroke="#8FA3FF"
                        strokeWidth="1.6"
                        strokeOpacity="0.85"
                      />
                    ))}

                    {asterismDiagramData.stars.map((s, idx) => {
                      const isWarm = s.star.proper === 'Betelgeuse' || (s.star.spect && s.star.spect.startsWith('M'));
                      const starColor = isWarm ? '#F5A962' : '#A8B8FF';
                      const radius = s.isNotableReticle ? 4.5 : Math.max(2, 4.5 - s.star.mag * 0.5);

                      return (
                        <circle
                          key={idx}
                          cx={s.px}
                          cy={s.py}
                          r={radius}
                          fill={starColor}
                          stroke="#F3F1EB"
                          strokeWidth="0.8"
                        />
                      );
                    })}
                  </svg>
                  <span className="absolute bottom-1 right-2 text-[9px] font-mono text-[var(--ink-muted)] uppercase">
                    Schematic preview
                  </span>
                </div>
              )}
            </Card>

            <Card className="p-3.5 gap-1.5 bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[12px] shadow-none">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-secondary)] block">
                Best viewing months
              </span>
              <div className="flex items-center gap-4 text-sm font-semibold font-mono text-[var(--signal-mid)] tracking-widest pt-0.5">
                {bestMonths.map(m => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </Card>

            <Card className="p-3.5 gap-2 bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[12px] shadow-none">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-secondary)]">
                  Visibility tonight
                </span>
                <span className="text-[10px] font-mono text-[var(--ink-muted)]">Horizon curve</span>
              </div>

              {nightVisibility && (
                <div className="relative w-full h-[120px] bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] p-2 flex flex-col justify-between">
                  <svg viewBox="0 0 340 85" className="w-full h-[65px] overflow-visible">
                    {[0, 25, 50, 75, 100].map(pct => {
                      const y = 65 - (pct / 100) * 55;
                      return (
                        <line
                          key={pct}
                          x1="30"
                          y1={y}
                          x2="330"
                          y2={y}
                          stroke="#2A2A32"
                          strokeWidth="0.8"
                          strokeDasharray="2 2"
                        />
                      );
                    })}

                    {[100, 50, 0].map(pct => {
                      const y = 65 - (pct / 100) * 55 + 3;
                      return (
                        <text
                          key={pct}
                          x="2"
                          y={y}
                          fill="#7C7A72"
                          fontSize="7"
                          fontFamily="IBM Plex Mono, monospace"
                        >
                          {pct}%
                        </text>
                      );
                    })}

                    {nightVisibility.samples.map((s, idx) => {
                      const x = 32 + (idx / 30) * 295;
                      const y = 65 - (s.pct / 100) * 55;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={s.isAboveHorizon ? '1.8' : '1.2'}
                          fill={s.isAboveHorizon ? '#8FA3FF' : '#2A2A32'}
                        />
                      );
                    })}
                  </svg>

                  <div className="flex justify-between text-[9px] text-[var(--ink-muted)] font-mono pl-7 pr-1 pt-1 border-t border-[var(--border-subtle)]">
                    <span>18:00</span>
                    <span>20:00</span>
                    <span>22:00</span>
                    <span>00:00</span>
                    <span>02:00</span>
                    <span>04:00</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* BOTTOM ROW: Metadata and observation summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
          <Card className="p-3.5 gap-2 bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[12px] shadow-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-secondary)] block pb-1.5 border-b border-[var(--border-subtle)]">
              Metadata
            </span>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center"><dt className="text-[var(--ink-muted)]">Name</dt><dd className="font-mono font-semibold">{selectedConstellation.name}</dd></div>
              <div className="flex justify-between items-center"><dt className="text-[var(--ink-muted)]">Abbreviation</dt><dd className="font-mono font-semibold">{selectedConstellation.id}</dd></div>
              <div className="flex justify-between items-center"><dt className="text-[var(--ink-muted)]">Area</dt><dd className="font-mono tabular-nums font-semibold">{selectedConstellation.area} sq deg</dd></div>
              <div className="flex justify-between items-center"><dt className="text-[var(--ink-muted)]">Rank</dt><dd className="font-mono tabular-nums font-semibold">{rank} / 88</dd></div>
              <div className="flex justify-between items-center"><dt className="text-[var(--ink-muted)]">Family</dt><dd className="font-mono font-semibold">{selectedConstellation.family}</dd></div>
            </dl>
          </Card>

          <Card className="lg:col-span-2 p-4 gap-2 bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[12px] shadow-none">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-secondary)] block pb-2 border-b border-[var(--border-subtle)]">
              Observation summary
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)] block">Current visibility</span>
                <span className="font-mono font-semibold text-xl text-[var(--ink-primary)] block pt-0.5">
                  {visibilityCategory}
                </span>
                <span className="font-mono text-[11px] text-[var(--ink-secondary)]">
                  {currentHor ? `Alt ${currentHor.altitude.toFixed(1)}° (${getAzimuthDirection(currentHor.azimuth)})` : 'No data'}
                </span>
              </div>

              <div className="md:border-l border-[var(--border-subtle)] md:pl-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)] block">Next best window</span>
                <span className="font-mono tabular-nums font-semibold text-lg text-[var(--signal-mid)] block pt-0.5">
                  {nightVisibility ? nightVisibility.nextWindow : '—'}
                </span>
                <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                  Site: {observer.name}
                </span>
              </div>

              <div className="md:border-l border-[var(--border-subtle)] md:pl-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-muted)] block">Peak altitude</span>
                <span className="font-mono tabular-nums font-semibold text-xl text-[var(--signal-mid)] block pt-0.5">
                  {nightVisibility ? `${nightVisibility.peakAlt.toFixed(0)}°` : '—'}
                </span>
                <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                  {meridian ? `Transit ~${meridian.transitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Max tonight'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: CATALOG LIBRARY GRID
  // =========================================================================
  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-sans gap-4 overflow-hidden">
      <PageHeader
        eyebrow="IAU Regions · 88 Catalog Entries"
        title="Constellation library"
        meta={`Showing ${filtered.length} / ${CONSTELLATIONS.length}`}
        description="Inspect any of the 88 IAU constellations, preview asterisms, or open reference DFA sequences."
        actions={
          <div className="w-full md:w-72">
            <SearchField
              size="small"
              aria-label="SEARCH CONSTELLATIONS"
              placeholder="Search constellations..."
              value={search}
              onChange={value => setSearch(value)}
              onKeyDown={e => e.stopPropagation()}
              className="w-full text-xs"
              shape="rounded"
            />
          </div>
        }
      >
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedControl
              aria-label="Catalog filter tabs"
              selectedKeys={new Set([activeFilter])}
              onSelectionChange={keys => {
                const next = [...keys][0];
                if (next) setActiveFilter(next as typeof activeFilter);
              }}
              className="max-w-full flex-wrap"
            >
              {(['ALL', 'ZODIAC', 'SEASONAL', 'NORTHERN', 'SOUTHERN', 'FAVORITES'] as const).map(f => {
                const label = f === 'FAVORITES' ? `Favorites${favorites.size ? ` (${favorites.size})` : ''}` : f.charAt(0) + f.slice(1).toLowerCase();
                return (
                  <SegmentedControlItem
                    key={f}
                    id={f}
                    className="text-[11px] font-semibold"
                  >
                    {label}
                  </SegmentedControlItem>
                );
              })}
            </SegmentedControl>

            <Select
              selectedKey={selectedFamily}
              onSelectionChange={key => {
                if (key) setSelectedFamily(String(key));
              }}
              size="sm"
              aria-label="Filter by constellation family"
              className="w-auto min-w-[140px]"
            >
                {families.map(f => (
                  <SelectItem key={f} id={f}>
                    {f === 'ALL' ? 'All families' : `${f} family`}
                  </SelectItem>
                ))}
            </Select>

            <div className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 py-1">
              <Switch
                isSelected={recognitionOnly}
                onChange={setRecognitionOnly}
                aria-label="DFA ready filter"
                size="sm"
              >
                <span className="text-[11px] font-semibold text-[var(--ink-secondary)]">
                {recognitionOnly ? `DFA ready (${REFERENCE_PATTERNS.filter(p => p.traversalVariant === 'forward').length})` : 'DFA ready only'}
                </span>
              </Switch>
            </div>
          </div>

          {librarySelection && (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setMobileDetailsOpen(true)}
              className="xl:hidden w-full sm:w-auto justify-start text-xs font-semibold"
            >
              <span className="text-[var(--signal-mid)]">View details</span>
              <span className="ml-1 text-[var(--ink-secondary)] font-normal">{librarySelection.name} · {librarySelection.id}</span>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Library cards and selected constellation preview */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(340px,388px)] gap-4 flex-1 min-h-0 overflow-y-auto xl:overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[304px] content-start gap-3.5 min-h-0 xl:overflow-y-auto xl:pr-1">
          {filtered.length === 0 ? (
            <section aria-live="polite" className="col-span-full flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 text-center shadow-none">
              <h2 className="text-sm font-semibold text-[var(--ink-primary)]">No matching constellations</h2>
              <p className="mt-1 text-xs text-[var(--ink-muted)]">
                {activeFilter === 'FAVORITES' && favorites.size === 0
                  ? 'No favorites yet. Use the star on a constellation card to add one.'
                  : 'No constellations match these filters.'}
              </p>
            </section>
          ) : filtered.map(con => {
            const isFavorite = favorites.has(con.id);
            const hasPattern = REFERENCE_PATTERNS.some(p => p.constellationId === con.id);
            const season = getConstellationSeason(con.raCenter);
            const stars = con.starIds.map(sid => STAR_BY_ID.get(sid)).filter(Boolean) as Star[];
            stars.sort((a, b) => a.mag - b.mag);
            const brightestMag = stars.length > 0 ? (stars[0].mag >= 0 ? '+' : '') + stars[0].mag.toFixed(1) : '—';
            const isSelected = librarySelectionId === con.id;

            return (
              <Card
                key={con.id}
                className={`rounded-[12px] p-3 gap-2 flex flex-col relative h-full min-h-[304px] shadow-none transition-colors ${
                  isSelected
                    ? 'border-[var(--signal-mid)] bg-[var(--bg-pill-active)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--signal-surface)]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <Button variant="ghost" size="xs" onClick={() => setLibrarySelectionId(con.id)} aria-pressed={isSelected} className="h-auto px-1 py-0.5 min-w-0 flex items-baseline gap-1.5 rounded-sm text-left">
                    <span className="truncate font-semibold text-xs text-[var(--ink-primary)]">{con.name}</span>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--ink-muted)] uppercase">{con.id}</span>
                    <span className="sr-only">Select constellation</span>
                  </Button>
                  <div className="flex items-center gap-1.5">
                    {hasPattern && <span className="px-1.5 py-0.5 bg-[var(--bg-pill-active)] text-[var(--signal-mid)] font-mono text-[9px] font-semibold uppercase rounded">DFA</span>}
                    <Button
                      variant={isFavorite ? 'primary' : 'secondary'}
                      size="xs"
                      onClick={() => toggleFavorite(con.id)}
                      aria-label={isFavorite ? `Remove ${con.name} from favorites` : `Add ${con.name} to favorites`}
                      aria-pressed={isFavorite}
                      className="rounded-full text-xs leading-none"
                    >
                      {isFavorite ? '★' : '☆'}
                    </Button>
                  </div>
                </div>

                <Button variant="ghost" onClick={() => setLibrarySelectionId(con.id)} aria-pressed={isSelected} aria-label={`Select ${con.name} constellation and view preview`} className="h-auto p-0 flex min-h-0 flex-1 flex-col items-stretch gap-2 text-left rounded-sm font-normal hover:bg-transparent">
                  <MiniAsterismPreview con={con} />
                  <div className="mt-1 w-full space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-[11px]"><span className="text-[var(--ink-muted)]">Best season</span><span className="font-mono font-medium text-[var(--ink-primary)]">{season}</span></div>
                    <div className="flex justify-between items-center text-[11px]"><span className="text-[var(--ink-muted)]">Key stars</span><span className="font-mono tabular-nums font-medium text-[var(--ink-primary)]">{con.starIds.length}</span></div>
                  </div>
                </Button>

                <div className="shrink-0 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px]">
                  <span className="px-1.5 py-0.5 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--ink-secondary)] font-mono tabular-nums text-[10px] font-medium rounded">
                    mag {brightestMag}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={event => { event.stopPropagation(); setSelectedConstellation(con); }}
                    aria-label={`Open ${con.name} details`}
                    className="text-[var(--signal-mid)] font-semibold px-2"
                  >
                    Details →
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <div className={`${mobileDetailsOpen && librarySelection ? 'fixed inset-3 z-[100] block max-h-[calc(100dvh-24px)]' : 'hidden'} xl:static xl:z-auto xl:block xl:order-last`}>
          <Card aria-label={librarySelection ? `${librarySelection.name} constellation details` : 'Constellation details'} className={`${librarySelection ? 'min-h-[360px] xl:min-h-0 xl:h-full' : 'min-h-[96px] xl:min-h-0 xl:h-[112px] xl:self-start'} rounded-[12px] border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 xl:p-4 flex flex-col gap-3 xl:gap-4 overflow-y-auto shadow-none`}>
            {librarySelection ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-lg font-semibold text-[var(--ink-primary)]">{librarySelection.name}</h2>
                    <span className="text-xs font-mono text-[var(--signal-mid)] uppercase">{librarySelection.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Catalog entry</span>
                    <Button variant="secondary" size="xs" onClick={() => setMobileDetailsOpen(false)} className="xl:hidden" aria-label="Close constellation details">
                      Close
                    </Button>
                  </div>
                </div>

                <MiniAsterismPreview con={librarySelection} size="detail" />

                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-secondary)] pb-2 border-b border-[var(--border-subtle)]">
                    Notable stars
                  </h3>
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {librarySelection.starIds.map(id => STAR_BY_ID.get(id)).filter((star): star is Star => !!star).sort((a, b) => a.mag - b.mag).slice(0, 3).map(star => (
                      <div key={star.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                        <span className="flex items-center gap-2 min-w-0"><span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-mid)] shrink-0" /><span className="truncate font-medium">{star.proper || star.name}</span></span>
                        <span className="font-mono text-[var(--ink-muted)] shrink-0">{star.bayer || `+${star.mag.toFixed(2)}`}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-secondary)] pb-2 border-b border-[var(--border-subtle)]">
                    Catalog summary
                  </h3>
                  <dl className="grid grid-cols-3 gap-2 pt-3 text-center">
                    <div><dt className="text-[10px] text-[var(--ink-muted)] uppercase block">Season</dt><dd className="text-xs font-mono font-semibold">{getConstellationSeason(librarySelection.raCenter)}</dd></div>
                    <div className="border-l border-[var(--border-subtle)]"><dt className="text-[10px] text-[var(--ink-muted)] uppercase block">Key stars</dt><dd className="text-xs font-mono tabular-nums font-semibold">{librarySelection.starIds.length}</dd></div>
                    <div className="border-l border-[var(--border-subtle)]"><dt className="text-[10px] text-[var(--ink-muted)] uppercase block">Sky</dt><dd className="text-xs font-mono font-semibold">{librarySelection.decCenter >= 0 ? 'North' : 'South'}</dd></div>
                  </dl>
                </section>

                <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                  <Button variant="primary" size="small" onClick={() => setSelectedConstellation(librarySelection)} className="text-xs font-semibold">
                    View details →
                  </Button>
                  <Button variant="secondary" size="small" onClick={() => handleStartTrace(librarySelection)} className="text-xs font-semibold">
                    Start trace →
                  </Button>
                </div>
              </>
            ) : (
              <div className="m-auto max-w-[260px] text-center text-sm text-[var(--ink-muted)]">
                <h2 className="font-semibold text-[var(--ink-primary)]">Choose a constellation</h2>
                <p className="mt-1 text-xs leading-relaxed">Select a card to see its star geometry and actions.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
