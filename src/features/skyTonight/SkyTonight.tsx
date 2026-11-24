import React, { useState, useMemo, memo } from 'react';
import * as Astronomy from 'astronomy-engine';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATIONS, STAR_BY_ID, STARS } from '../../data/astroData';
import { getHorizontalCoordinates, getMeridianCulmination } from '../../astronomy/coordinates';
import type { IAUConstellation, ObserverLocation } from '../../types/astronomy';

// 11 distinct night hours matching Frame 5 (18:00 to 04:00 UTC)
const NIGHT_HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4] as const;
const QUANTA_MINUTES = [0, 15, 30, 45] as const;

// Treat observations between midnight and 04:59 UTC as the tail of the
// previous evening. From 05:00 onward, the displayed night starts today.
const getNightSampleDate = (baseDate: Date, hour: number, minute: number) => {
  const sample = new Date(baseDate);
  const baseHour = baseDate.getUTCHours();
  if (baseHour < 5) sample.setUTCDate(sample.getUTCDate() - 1);
  if (hour < 12) sample.setUTCDate(sample.getUTCDate() + 1);
  sample.setUTCHours(hour, minute, 0, 0);
  return sample;
};

/**
 * Renders an accurate Moon Phase Disc SVG based on phase fraction and angle.
 */
const MoonPhaseDisc: React.FC<{ fraction: number; phaseDeg: number }> = memo(({ fraction, phaseDeg }) => {
  const cx = 13;
  const cy = 13;
  const r = 11;
  const isWaxing = phaseDeg < 180;

  let pathD = '';
  if (fraction <= 0.02) {
    pathD = '';
  } else if (fraction >= 0.98) {
    pathD = `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 -${2 * r} 0`;
  } else {
    const sweep1 = isWaxing ? 1 : 0;
    const rX = Math.abs(r * (2 * fraction - 1));
    const sweep2 = fraction > 0.5 ? (isWaxing ? 1 : 0) : (isWaxing ? 0 : 1);
    pathD = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweep1} ${cx} ${cy + r} A ${rX.toFixed(2)} ${r} 0 0 ${sweep2} ${cx} ${cy - r}`;
  }

  return (
    <svg viewBox="0 0 26 26" className="w-7 h-7 shrink-0" aria-label={`Moon phase ${(fraction * 100).toFixed(0)}%`}>
      <circle cx={cx} cy={cy} r={r} fill="#262D3D" />
      {pathD && <path d={pathD} fill="#D4DCED" />}
    </svg>
  );
});

/**
 * Mini Asterism Vector Graphic rendering stick figure from actual star coordinates and line segments.
 */
interface MiniAsterismGlyphProps {
  con: IAUConstellation;
  width?: number;
  height?: number;
  strokeColor?: string;
  dotColor?: string;
}

const MiniAsterismGlyph: React.FC<MiniAsterismGlyphProps> = memo(({
  con,
  width = 36,
  height = 26,
  strokeColor = '#525866',
  dotColor = '#181A20',
}) => {
  const rad = Math.PI / 180;
  const cosDec = Math.cos(con.decCenter * rad);

  const points = useMemo(() => {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    const map = new Map<number, { x: number; y: number }>();

    for (const sid of con.starIds) {
      const star = STAR_BY_ID.get(sid);
      if (!star) continue;
      let dRa = star.ra - con.raCenter;
      while (dRa > 180) dRa -= 360;
      while (dRa < -180) dRa += 360;
      const x = -dRa * cosDec;
      const y = -(star.dec - con.decCenter);
      map.set(sid, { x, y });
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    if (map.size === 0) return { map: new Map<number, { x: number; y: number }>(), starPoints: [] };

    const spanX = Math.max(maxX - minX, 0.5);
    const spanY = Math.max(maxY - minY, 0.5);
    const pad = 3;
    const scale = Math.min((width - 2 * pad) / spanX, (height - 2 * pad) / spanY);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const screenMap = new Map<number, { x: number; y: number }>();
    const starPoints: Array<{ x: number; y: number }> = [];

    map.forEach((pt, sid) => {
      const sx = Number((width / 2 + (pt.x - midX) * scale).toFixed(1));
      const sy = Number((height / 2 + (pt.y - midY) * scale).toFixed(1));
      screenMap.set(sid, { x: sx, y: sy });
      starPoints.push({ x: sx, y: sy });
    });

    return { map: screenMap, starPoints };
  }, [con, cosDec, width, height]);

  if (points.starPoints.length === 0) {
    return <div style={{ width, height }} className="shrink-0" />;
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      {con.lineSegments.map((seg, idx) => {
        const p1 = points.map.get(seg.starId1);
        const p2 = points.map.get(seg.starId2);
        if (!p1 || !p2) return null;
        return (
          <line
            key={idx}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={strokeColor}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        );
      })}
      {points.starPoints.map((pt, idx) => (
        <circle key={idx} cx={pt.x} cy={pt.y} r="1.4" fill={dotColor} />
      ))}
    </svg>
  );
});

/**
 * Sky Preview component showing live starry night sky with top visible constellations,
 * line segments, and labels matching Frame 5.
 */
interface SkyPreviewProps {
  topCons: IAUConstellation[];
  observationDate: Date;
  observer: ObserverLocation;
  onSelectConstellation: (id: string) => void;
}

const SkyPreview: React.FC<SkyPreviewProps> = memo(({
  topCons,
  observationDate,
  observer,
  onSelectConstellation,
}) => {
  const width = 420;
  const height = 140;

  // Background static starry backdrop points for visual depth
  const backgroundStars = useMemo(() => {
    const pts: Array<{ x: number; y: number; r: number; opacity: number }> = [];
    const seed = 42;
    for (let i = 0; i < 40; i++) {
      const pseudoX = ((Math.sin(seed + i * 1.7) + 1) / 2) * width;
      const pseudoY = ((Math.cos(seed + i * 2.3) + 1) / 2) * height;
      const r = i % 4 === 0 ? 1.0 : 0.6;
      const opacity = 0.3 + (i % 5) * 0.12;
      pts.push({ x: Number(pseudoX.toFixed(1)), y: Number(pseudoY.toFixed(1)), r, opacity });
    }
    return pts;
  }, [width, height]);

  // Project top visible constellations into horizontal coordinates for the preview
  const renderedFigures = useMemo(() => {
    return topCons.slice(0, 5).map(con => {
      const starMap = new Map<number, { x: number; y: number }>();
      let sumX = 0;
      let sumY = 0;
      let count = 0;

      for (const sid of con.starIds) {
        const star = STAR_BY_ID.get(sid);
        if (!star) continue;
        const hor = getHorizontalCoordinates(star.ra, star.dec, observer, observationDate);
        if (hor.isAboveHorizon) {
          const sx = Number(((hor.azimuth / 360) * (width - 40) + 20).toFixed(1));
          const sy = Number(((1 - Math.max(5, hor.altitude) / 90) * (height - 30) + 15).toFixed(1));
          starMap.set(sid, { x: sx, y: sy });
          sumX += sx;
          sumY += sy;
          count++;
        }
      }

      const centroid = count > 0 ? { x: sumX / count, y: sumY / count } : null;

      return {
        con,
        starMap,
        centroid,
      };
    }).filter(f => f.centroid !== null);
  }, [topCons, observer, observationDate, width, height]);

  return (
    <div className="w-full h-[140px] bg-[#060A14] rounded-[10px] border border-[#1E293B] relative overflow-hidden flex items-center justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        role="img"
        aria-label="Night sky preview"
      >
        {/* Subtle background stars */}
        {backgroundStars.map((pt, idx) => (
          <circle key={idx} cx={pt.x} cy={pt.y} r={pt.r} fill="#A0AEC0" opacity={pt.opacity} />
        ))}

        {/* Constellations */}
        {renderedFigures.map(({ con, starMap, centroid }) => (
          <g
            key={con.id}
            className="cursor-pointer group"
            onClick={() => onSelectConstellation(con.id)}
          >
            {con.lineSegments.map((seg, idx) => {
              const p1 = starMap.get(seg.starId1);
              const p2 = starMap.get(seg.starId2);
              if (!p1 || !p2) return null;
              // Guard against wraparound artifacts across the preview
              if (Math.abs(p1.x - p2.x) > width / 2) return null;
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
            {Array.from(starMap.values()).map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="1.8"
                fill="#FFFFFF"
                stroke="#1D55F5"
                strokeWidth="0.8"
              />
            ))}
            {centroid && (
              <text
                x={centroid.x}
                y={Math.min(height - 8, centroid.y + 12)}
                fill="#FFFFFF"
                fontSize="8"
                fontFamily="'IBM Plex Mono', monospace"
                fontWeight="bold"
                letterSpacing="0.06em"
                textAnchor="middle"
                opacity="0.9"
              >
                {con.name.toUpperCase()}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
});

export const SkyTonight: React.FC = () => {
  const {
    observer,
    observationDate,
    setObservationDate,
    stepTime,
    focusOnConstellation,
    focusOnStar,
  } = useAstroStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [targetType, setTargetType] = useState<'constellations' | 'stars'>('constellations');
  const [timeMode, setTimeMode] = useState<'evening' | 'night' | 'full'>('full');
  const [horizonFilter, setHorizonFilter] = useState<'above' | 'all' | 'circumpolar'>('above');
  const [hemisphereFilter, setHemisphereFilter] = useState<'all' | 'north' | 'south'>('all');
  const [sortBy, setSortBy] = useState<'altitude' | 'transit' | 'name' | 'area'>('altitude');
  const [selectedConId, setSelectedConId] = useState<string | null>(null);

  // Precompute 44 sample dates across the 11-hour night (18:00 to 04:00 UTC, 4 per hour)
  // Ensures proper UTC date rollover when crossing midnight
  const nightQuantumDates = useMemo(() => {
    const dates: Array<{ hour: number; minute: number; date: Date }> = [];

    for (const h of NIGHT_HOURS) {
      for (const m of QUANTA_MINUTES) {
        const d = getNightSampleDate(observationDate, h, m);
        dates.push({ hour: h, minute: m, date: d });
      }
    }
    return dates;
  }, [observationDate]);

  // Compute live horizontal positions & meridian culmination for all constellations
  const constellationsData = useMemo(() => {
    return CONSTELLATIONS.map(con => {
      const hor = getHorizontalCoordinates(con.raCenter, con.decCenter, observer, observationDate);
      const culmination = getMeridianCulmination(con.raCenter, con.decCenter, observer, observationDate);

      // Find brightest star details
      let brightestStarName = con.brightestStar;
      let brightestMag = 99;
      for (const sid of con.starIds) {
        const star = STAR_BY_ID.get(sid);
        if (star && star.mag < brightestMag) {
          brightestMag = star.mag;
          brightestStarName = star.proper || star.name;
        }
      }

      // Format culmination & viewing window
      const formatTimeOnly = (d: Date) => {
        const h = d.getUTCHours().toString().padStart(2, '0');
        const m = d.getUTCMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
      };

      const transitTimeStr = formatTimeOnly(culmination.transitDate);
      const windowStr = `${formatTimeOnly(culmination.optimalWindowStart)} – ${formatTimeOnly(culmination.optimalWindowEnd)}`;

      // Calculate 44-dot visibility array across the 11 hours (4 dots/hour)
      const dotTrack = nightQuantumDates.map(q => {
        const sampleHor = getHorizontalCoordinates(con.raCenter, con.decCenter, observer, q.date);
        return sampleHor.isAboveHorizon;
      });

      const activeQuantaCount = dotTrack.filter(Boolean).length;
      const durationHours = Math.floor((activeQuantaCount * 15) / 60);
      const durationMinutes = (activeQuantaCount * 15) % 60;
      const durationStr = `${durationHours} HR ${durationMinutes.toString().padStart(2, '0')} MIN`;

      return {
        ...con,
        altitude: hor.altitude,
        azimuth: hor.azimuth,
        isAboveHorizon: hor.isAboveHorizon,
        brightestStarName,
        brightestMag: brightestMag < 90 ? brightestMag : null,
        culmination,
        transitTimeStr,
        windowStr,
        dotTrack,
        activeQuantaCount,
        durationStr,
      };
    });
  }, [observer, observationDate, nightQuantumDates]);

  // Compute live horizontal positions for topocentric bright stars (mag < 2.5)
  const brightStarsData = useMemo(() => {
    return STARS
      .filter(s => s.mag < 2.5)
      .map(star => {
        const hor = getHorizontalCoordinates(star.ra, star.dec, observer, observationDate);

        // 44-dot visibility for star
        const dotTrack = nightQuantumDates.map(q => {
          const sampleHor = getHorizontalCoordinates(star.ra, star.dec, observer, q.date);
          return sampleHor.isAboveHorizon;
        });

        return {
          ...star,
          altitude: hor.altitude,
          azimuth: hor.azimuth,
          isAboveHorizon: hor.isAboveHorizon,
          dotTrack,
        };
      })
      .sort((a, b) => a.mag - b.mag);
  }, [observer, observationDate, nightQuantumDates]);

  // Derive counts
  const aboveHorizonCount = constellationsData.filter(c => c.isAboveHorizon).length;
  const circumpolarCount = constellationsData.filter(c => c.culmination.isCircumpolar).length;
  const visibleBrightStars = brightStarsData.filter(s => s.isAboveHorizon);
  const visibleBrightStarsCount = visibleBrightStars.length;
  const visibleTargetCount = targetType === 'constellations' ? aboveHorizonCount : visibleBrightStarsCount;
  const visibleTargetDescription = targetType === 'constellations'
    ? 'ABOVE HORIZON · CONSTELLATIONS'
    : 'ABOVE HORIZON · BRIGHT STARS';

  // Derive honest top metrics
  const topMetrics = useMemo(() => {
    // 1. Date (YYYY-MM-DD)
    const dateStr = observationDate.toISOString().slice(0, 10);

    // 2. Observer Location
    const latDir = observer.latitude >= 0 ? 'N' : 'S';
    const lonDir = observer.longitude >= 0 ? 'E' : 'W';
    const latVal = Math.abs(observer.latitude).toFixed(2);
    const lonVal = Math.abs(observer.longitude).toFixed(2);

    // 3. Sunset Time from astronomy-engine
    let sunsetTimeStr = '--:--';
    try {
      const obs = new Astronomy.Observer(observer.latitude, observer.longitude, observer.elevation ?? 0);
      const noon = new Date(observationDate);
      noon.setUTCHours(12, 0, 0, 0);
      const setEvent = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, -1, noon, 1.0);
      if (setEvent) {
        const h = setEvent.date.getUTCHours().toString().padStart(2, '0');
        const m = setEvent.date.getUTCMinutes().toString().padStart(2, '0');
        sunsetTimeStr = `${h}:${m}`;
      }
    } catch {
      sunsetTimeStr = '--:--';
    }

    // 4. Moon Illumination
    let moonPercentStr = '0.0%';
    let moonFraction = 0;
    let moonPhaseDeg = 0;
    try {
      const illum = Astronomy.Illumination(Astronomy.Body.Moon, observationDate);
      moonFraction = illum.phase_fraction;
      moonPercentStr = `${(illum.phase_fraction * 100).toFixed(1)}%`;
      moonPhaseDeg = Astronomy.MoonPhase(observationDate);
    } catch {
      moonPercentStr = '--%';
    }

    return {
      dateStr,
      latVal,
      latDir,
      lonVal,
      lonDir,
      sunsetTimeStr,
      moonPercentStr,
      moonFraction,
      moonPhaseDeg,
    };
  }, [observer, observationDate]);

  // Filtering & Sorting for Constellations
  const filteredConstellations = useMemo(() => {
    return constellationsData
      .filter(c => {
        // Horizon filter
        if (horizonFilter === 'above' && !c.isAboveHorizon) return false;
        if (horizonFilter === 'circumpolar' && !c.culmination.isCircumpolar) return false;

        // Hemisphere filter
        if (hemisphereFilter === 'north' && c.decCenter < 0) return false;
        if (hemisphereFilter === 'south' && c.decCenter >= 0) return false;

        // Evening / Night / Full mode filter
        if (timeMode === 'evening') {
          // Dots 0..15 cover 18:00..21:45
          const eveningVisible = c.dotTrack.slice(0, 16).some(Boolean);
          if (!eveningVisible) return false;
        } else if (timeMode === 'night') {
          // Dots 16..31 cover 22:00..01:45
          const nightVisible = c.dotTrack.slice(16, 32).some(Boolean);
          if (!nightVisible) return false;
        }

        // Search query
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.englishName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.brightestStarName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'altitude') return b.altitude - a.altitude;
        if (sortBy === 'transit') return Math.abs(a.culmination.diffHours) - Math.abs(b.culmination.diffHours);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'area') return b.area - a.area;
        return 0;
      });
  }, [constellationsData, horizonFilter, hemisphereFilter, timeMode, searchQuery, sortBy]);

  // Filtered Bright Stars
  const filteredBrightStars = useMemo(() => {
    return brightStarsData.filter(s => {
      if (horizonFilter === 'above' && !s.isAboveHorizon) return false;
      if (hemisphereFilter === 'north' && s.dec < 0) return false;
      if (hemisphereFilter === 'south' && s.dec >= 0) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.proper && s.proper.toLowerCase().includes(q)) ||
        (s.con && s.con.toLowerCase().includes(q))
      );
    });
  }, [brightStarsData, horizonFilter, hemisphereFilter, searchQuery]);

  // Recommended Observation Windows: Top 3 constellations ranked by optimal observation window
  const recommendedWindows = useMemo(() => {
    return constellationsData
      .filter(c => !c.culmination.neverRises && c.culmination.maxAltitude > 20 && c.activeQuantaCount > 4)
      .sort((a, b) => b.culmination.maxAltitude - a.culmination.maxAltitude)
      .slice(0, 3);
  }, [constellationsData]);

  // Tonight's Highlights: Top 3 high-profile targets
  const tonightHighlights = useMemo(() => {
    // Prioritize prominent visible constellations like Orion, Cassiopeia, Scorpius, Ursa Major, Cygnus
    const priority = ['Ori', 'Cas', 'Sco', 'UMa', 'Cyg', 'Leo', 'Tau'];
    const candidates = constellationsData.filter(c => c.isAboveHorizon || c.activeQuantaCount > 8);
    candidates.sort((a, b) => {
      const idxA = priority.indexOf(a.id);
      const idxB = priority.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.altitude - a.altitude;
    });
    return candidates.slice(0, 3);
  }, [constellationsData]);

  // Current simulation UTC time
  const currentUtcHours = observationDate.getUTCHours();
  const currentUtcMinutes = observationDate.getUTCMinutes();
  const currentUtcTimeStr = `${currentUtcHours.toString().padStart(2, '0')}:${currentUtcMinutes.toString().padStart(2, '0')}`;

  // Quantum setter: updates UTC time to exact hour and minute with overnight rollover awareness
  const handleSetQuantumTime = (hour: number, minute: number) => {
    const newDate = getNightSampleDate(observationDate, hour, minute);
    setObservationDate(newDate);
  };

  const handleStepMinutes = (deltaMinutes: number) => {
    const newDate = new Date(observationDate.getTime() + deltaMinutes * 60 * 1000);
    setObservationDate(newDate);
  };

  // Active selected constellation for highlights
  const activeSelectedId = selectedConId || recommendedWindows[0]?.id || 'Ori';

  return (
    <section className="w-full h-full min-w-0 flex flex-col gap-2 overflow-y-auto pr-0.5 font-mono text-[var(--ink-primary)]" aria-label="Sky visibility tonight">
      {/* 1. Top Row of 5 Metric Cards matching Frame 5 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 shrink-0">
        {/* Card 1: DATE */}
        <div className="bento-card bg-white p-3.5 flex flex-col justify-between border border-[#E2E5EC] rounded-[14px] min-h-[96px]">
          <div className="flex items-center justify-between text-[10px] tracking-wider font-semibold text-[var(--ink-secondary)] uppercase">
            <span>DATE</span>
            <span aria-hidden="true" className="text-[var(--ink-muted)] text-[11px]">UTC</span>
          </div>
          <div className="font-dot text-xl sm:text-2xl text-[var(--ink-primary)] tracking-wide font-bold">
            {topMetrics.dateStr}
          </div>
        </div>

        {/* Card 2: OBSERVER LOCATION */}
        <div className="bento-card bg-white p-3.5 flex flex-col justify-between border border-[#E2E5EC] rounded-[14px] min-h-[96px]">
          <div className="flex items-center justify-between text-[10px] tracking-wider font-semibold text-[var(--ink-secondary)] uppercase">
            <span>OBSERVER LOCATION</span>
            <span aria-hidden="true" className="text-[var(--ink-muted)] text-[11px]">WGS84</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-[13px]">
            <span className="text-[var(--ink-muted)]">
              LAT <strong className="text-[var(--ink-primary)] font-bold">{topMetrics.latVal}° {topMetrics.latDir}</strong>
            </span>
            <span className="text-[var(--ink-muted)]">
              LON <strong className="text-[var(--ink-primary)] font-bold">{topMetrics.lonVal}° {topMetrics.lonDir}</strong>
            </span>
          </div>
        </div>

        {/* Card 3: SUNSET */}
        <div className="bento-card bg-white p-3.5 flex flex-col justify-between border border-[#E2E5EC] rounded-[14px] min-h-[96px]">
          <div className="flex items-center justify-between text-[10px] tracking-wider font-semibold text-[var(--ink-secondary)] uppercase">
            <span>SUNSET</span>
            <span aria-hidden="true" className="text-[var(--ink-muted)] text-[11px]">UTC</span>
          </div>
          <div className="font-dot text-xl sm:text-2xl text-[var(--ink-primary)] tracking-wide font-bold">
            {topMetrics.sunsetTimeStr}
          </div>
        </div>

        {/* Card 4: MOON ILLUMINATION */}
        <div className="bento-card bg-white p-3.5 flex flex-col justify-between border border-[#E2E5EC] rounded-[14px] min-h-[96px]">
          <div className="flex items-center justify-between text-[10px] tracking-wider font-semibold text-[var(--ink-secondary)] uppercase">
            <span>MOON ILLUMINATION</span>
            <span aria-hidden="true" className="text-[var(--ink-muted)] text-[11px]">PHASE</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="font-dot text-xl sm:text-2xl text-[var(--ink-primary)] tracking-wide font-bold">
              {topMetrics.moonPercentStr}
            </div>
            <MoonPhaseDisc fraction={topMetrics.moonFraction} phaseDeg={topMetrics.moonPhaseDeg} />
          </div>
        </div>

        {/* Card 5: VISIBLE COUNT */}
        <div className="col-span-2 md:col-span-1 bento-card bg-white p-3.5 flex flex-col justify-between border border-[#E2E5EC] rounded-[14px] min-h-[96px]">
          <div className="flex flex-col gap-0.5 text-[10px] tracking-wider font-semibold text-[var(--ink-secondary)] uppercase">
            <span>VISIBLE COUNT</span>
            <span className="text-[9px] font-normal text-[var(--ink-muted)]">{visibleTargetDescription}</span>
          </div>
          <div className="font-dot text-xl sm:text-2xl text-[var(--ink-primary)] tracking-wide font-bold">
            {visibleTargetCount}
          </div>
        </div>
      </div>

      {/* 2. Middle Bento Card: SKY TONIGHT Table matching Frame 5 */}
      <section className="bento-card bg-white border border-[#E2E5EC] rounded-[14px] p-3 sm:p-4 flex flex-col gap-3 min-h-[360px] flex-1" aria-labelledby="sky-tonight-title">
        {/* Table Title and Frame 5 Evening/Night/Full Mode Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <h1 id="sky-tonight-title" className="font-bold text-sm tracking-wider uppercase text-[var(--ink-primary)]">Sky tonight</h1>
            <span className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wide">
              [{targetType === 'constellations' ? filteredConstellations.length : filteredBrightStars.length} {targetType === 'constellations' ? 'CONSTELLATIONS' : 'BRIGHT STARS'} // {currentUtcTimeStr} UTC]
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Frame 5 Segmented Mode Rockers: EVENING / NIGHT / FULL */}
            <div className="tactile-rocker">
              <button
                onClick={() => setTimeMode('evening')}
                aria-pressed={timeMode === 'evening'}
                className={`tactile-pill text-[10px] uppercase font-semibold ${
                  timeMode === 'evening' ? 'active' : ''
                }`}
              >
                EVENING
              </button>
              <button
                onClick={() => setTimeMode('night')}
                aria-pressed={timeMode === 'night'}
                className={`tactile-pill text-[10px] uppercase font-semibold ${
                  timeMode === 'night' ? 'active' : ''
                }`}
              >
                NIGHT
              </button>
              <button
                onClick={() => setTimeMode('full')}
                aria-pressed={timeMode === 'full'}
                className={`tactile-pill text-[10px] uppercase font-semibold ${
                  timeMode === 'full' ? 'active' : ''
                }`}
              >
                FULL
              </button>
            </div>
          </div>
        </div>

        {/* Keep secondary browse and time controls available without crowding the reference layout. */}
        <details className="group shrink-0">
          <summary className="cursor-pointer list-none border-y border-[#E2E5EC]/60 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--ink-secondary)] marker:hidden">
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="text-[var(--signal-cobalt)]">+</span>
              Browse &amp; time controls
              <span className="font-normal normal-case tracking-normal text-[var(--ink-muted)]">Search, filters, target type, and time steps</span>
            </span>
          </summary>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Target Category Toggle: Constellations vs Bright Stars */}
            <div className="tactile-rocker">
              <button
                onClick={() => setTargetType('constellations')}
                aria-pressed={targetType === 'constellations'}
                className={`tactile-pill text-[10px] uppercase font-semibold ${
                  targetType === 'constellations' ? 'active' : ''
                }`}
              >
                CONSTELLATIONS ({aboveHorizonCount})
              </button>
              <button
                onClick={() => setTargetType('stars')}
                aria-pressed={targetType === 'stars'}
                className={`tactile-pill text-[10px] uppercase font-semibold ${
                  targetType === 'stars' ? 'active' : ''
                }`}
              >
                BRIGHT STARS ({visibleBrightStarsCount})
              </button>
            </div>


            {/* Search Input */}
            <input
              type="text"
              placeholder="SEARCH CONSTELLATION OR STAR..."
              aria-label="Search constellations or bright stars"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] rounded-[8px] px-3 py-1 text-xs text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--signal-cobalt)] uppercase tracking-wider w-52 sm:w-60"
            />

            {/* Horizon Filter Rockers */}
            <div className="tactile-rocker">
              <button
                onClick={() => setHorizonFilter('above')}
                aria-pressed={horizonFilter === 'above'}
                className={`tactile-pill text-[10px] uppercase ${
                  horizonFilter === 'above' ? 'active' : ''
                }`}
              >
                ABOVE ({aboveHorizonCount})
              </button>
              <button
                onClick={() => setHorizonFilter('all')}
                aria-pressed={horizonFilter === 'all'}
                className={`tactile-pill text-[10px] uppercase ${
                  horizonFilter === 'all' ? 'active' : ''
                }`}
              >
                ALL 88
              </button>
              <button
                onClick={() => setHorizonFilter('circumpolar')}
                aria-pressed={horizonFilter === 'circumpolar'}
                className={`tactile-pill text-[10px] uppercase ${
                  horizonFilter === 'circumpolar' ? 'active' : ''
                }`}
              >
                CIRCUMPOLAR ({circumpolarCount})
              </button>
            </div>

            {/* Hemisphere Filter */}
            <div className="tactile-rocker">
              {(['all', 'north', 'south'] as const).map(hemi => (
                <button
                  key={hemi}
                  onClick={() => setHemisphereFilter(hemi)}
                    aria-pressed={hemisphereFilter === hemi}
                  className={`tactile-pill text-[10px] uppercase ${
                    hemisphereFilter === hemi ? 'active' : ''
                  }`}
                >
                  {hemi === 'all' ? 'ALL' : hemi === 'north' ? 'NORTH' : 'SOUTH'}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              aria-label="Sort visible targets"
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] rounded-[6px] px-2 py-1 text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider cursor-pointer focus:outline-none focus:border-[var(--signal-cobalt)]"
            >
              <option value="altitude">ALTITUDE</option>
              <option value="transit">TRANSIT</option>
              <option value="name">NAME (A-Z)</option>
              <option value="area">AREA</option>
            </select>
          </div>

          {/* Quick Hardware Time Stepper Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => stepTime(-1)}
              className="tactile-pill text-[10px] py-1 px-2 font-bold"
              aria-label="Step observation time back one hour"
            >
              -1H
            </button>
            <button
              onClick={() => setObservationDate(new Date())}
              className="tactile-pill bg-[var(--signal-cobalt)] text-white text-[10px] py-1 px-2.5 font-bold"
              aria-label="Set observation date and time to now"
            >
              NOW
            </button>
            <button
              onClick={() => stepTime(1)}
              className="tactile-pill text-[10px] py-1 px-2 font-bold"
              aria-label="Step observation time forward one hour"
            >
              +1H
            </button>
            <button
              onClick={() => stepTime(24)}
              className="tactile-pill text-[10px] py-1 px-2 font-bold"
              aria-label="Step observation time forward 24 hours"
            >
              +24H
            </button>
            <button
              onClick={() => handleStepMinutes(-15)}
              className="tactile-pill text-[10px] py-1 px-2 font-bold"
              aria-label="Step observation time back 15 minutes"
            >
              -15M
            </button>
            <button
              onClick={() => handleStepMinutes(15)}
              className="tactile-pill text-[10px] py-1 px-2 font-bold"
              aria-label="Step observation time forward 15 minutes"
            >
              +15M
            </button>
          </div>
          </div>
        </details>

        {/* 11-Hour Dot Matrix Table */}
        <div className="min-h-0 flex-1 overflow-auto border border-[#E2E5EC] rounded-[10px]">
          <div className="min-w-[960px]">
            {/* Header Row */}
            <div className="sticky top-0 bg-[#F5F6F8] border-b border-[#E2E5EC] px-3 py-2 flex items-center text-[10px] font-bold text-[var(--ink-secondary)] tracking-wider uppercase z-10">
              <div className="w-56 shrink-0">
                {targetType === 'constellations' ? 'CONSTELLATION' : 'STAR'}
              </div>
              <div className="w-36 shrink-0">
                {targetType === 'constellations' ? 'VISIBILITY' : 'MAG // ALT'}
              </div>
              <div className="flex-1 grid grid-cols-11 gap-1 text-center">
                {NIGHT_HOURS.map(hour => (
                  <span
                    key={hour}
                    className={currentUtcHours === hour ? 'text-[var(--signal-cobalt)] font-bold' : ''}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                ))}
              </div>
              <div className="w-20 shrink-0 text-right">ACTION</div>
            </div>

            {/* Constellation Rows */}
            {targetType === 'constellations' && (
              <div className="divide-y divide-[#E2E5EC]/60">
                {filteredConstellations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
                    NO CONSTELLATIONS MATCH CURRENT FILTERS
                  </div>
                ) : (
                  filteredConstellations.map(con => (
                    <div
                      key={con.id}
                      className={`px-3 py-2 flex items-center hover:bg-[#F8FAFC] text-xs group ${selectedConId === con.id ? 'bg-[#F4F7FC]' : ''}`}
                    >
                      {/* Constellation Vector Glyph & Name */}
                      <div className="w-56 shrink-0 flex items-center gap-2.5">
                        <MiniAsterismGlyph con={con} width={34} height={24} />
                        <button
                          type="button"
                          onClick={() => setSelectedConId(con.id)}
                          aria-pressed={selectedConId === con.id}
                          aria-label={`Select ${con.name}`}
                          className="min-w-0 text-left"
                        >
                          <span className="block font-bold text-xs uppercase text-[var(--ink-primary)] group-hover:text-[var(--signal-cobalt)]">
                            {con.name}
                          </span>
                          <span className="block text-[10px] text-[var(--ink-muted)] uppercase">
                            {con.englishName} ({con.id})
                          </span>
                        </button>
                      </div>

                      {/* Visibility Window */}
                      <div className="w-36 shrink-0 font-mono text-[11px] text-[var(--ink-secondary)]">
                        {con.culmination.neverRises ? 'NEVER RISES' : con.windowStr}
                      </div>

                      {/* 44 Dots across 11 Hours (4 Dots/Hour) */}
                      <div className="flex-1 grid grid-cols-11 gap-1">
                        {NIGHT_HOURS.map((hour, hIdx) => {
                          const hourQuanta = [0, 1, 2, 3].map(qIdx => {
                            const dotIdx = hIdx * 4 + qIdx;
                            const isVisible = con.dotTrack[dotIdx];
                            const minute = QUANTA_MINUTES[qIdx];
                            const isCurrent =
                              currentUtcHours === hour &&
                              Math.floor(currentUtcMinutes / 15) === qIdx;

                            return (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSetQuantumTime(hour, minute);
                                }}
                                aria-label={`Set observation time to ${getNightSampleDate(observationDate, hour, minute).toISOString().slice(0, 10)} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC; ${
                                  isVisible ? 'Visible Above Horizon' : 'Below Horizon'
                                }`}
                                aria-pressed={isCurrent}
                                className="flex h-5 w-4 shrink-0 cursor-pointer items-center justify-center"
                              >
                                <span aria-hidden="true" className={`h-[6px] w-[6px] rounded-full ${
                                  isVisible ? 'bg-[var(--signal-cobalt)]' : 'bg-[#E2E5EC]'
                                } ${isCurrent ? 'ring-2 ring-[var(--signal-cobalt)]/50' : ''}`} />
                              </button>
                            );
                          });

                          return (
                            <div key={hour} className="flex items-center justify-center gap-[3px]">
                              {hourQuanta}
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Button */}
                      <div className="w-20 shrink-0 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            focusOnConstellation(con.id);
                          }}
                          aria-label={`Focus ${con.name} in sky canvas`}
                          className="tactile-pill text-[9px] py-1 px-2 uppercase hover:bg-[var(--bg-pill-active)] hover:text-[var(--signal-cobalt)]"
                          title={`Focus ${con.name} in sky canvas`}
                        >
                          FOCUS ↗
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Bright Stars Rows */}
            {targetType === 'stars' && (
              <div className="divide-y divide-[#E2E5EC]/60">
                {filteredBrightStars.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--ink-muted)]">
                    NO BRIGHT STARS MATCH CURRENT FILTERS
                  </div>
                ) : (
                  filteredBrightStars.map(star => (
                    <div
                      key={star.id}
                      className="px-3 py-2 flex items-center hover:bg-[#F8FAFC] text-xs group"
                    >
                      <div className="w-56 shrink-0">
                        <div>
                          <span className="block font-bold text-xs uppercase text-[var(--ink-primary)] group-hover:text-[var(--signal-cobalt)]">
                            {star.proper || star.name}
                          </span>
                          <span className="block text-[10px] text-[var(--ink-muted)] uppercase">
                            {star.con} // HIP {star.hip || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="w-36 shrink-0 font-mono text-[11px] text-[var(--ink-secondary)]">
                        <span className="font-bold text-[var(--signal-cobalt)]">{star.mag.toFixed(2)}m</span>
                        <span className="ml-2">ALT {star.altitude.toFixed(0)}°</span>
                      </div>

                      <div className="flex-1 grid grid-cols-11 gap-1">
                        {NIGHT_HOURS.map((hour, hIdx) => {
                          const hourQuanta = [0, 1, 2, 3].map(qIdx => {
                            const dotIdx = hIdx * 4 + qIdx;
                            const isVisible = star.dotTrack[dotIdx];
                            const minute = QUANTA_MINUTES[qIdx];
                            const isCurrent =
                              currentUtcHours === hour &&
                              Math.floor(currentUtcMinutes / 15) === qIdx;

                            return (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSetQuantumTime(hour, minute);
                                }}
                                aria-label={`Set observation time to ${getNightSampleDate(observationDate, hour, minute).toISOString().slice(0, 10)} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC; ${
                                  isVisible ? 'Visible' : 'Below Horizon'
                                }`}
                                aria-pressed={isCurrent}
                                className="flex h-5 w-4 shrink-0 cursor-pointer items-center justify-center"
                              >
                                <span aria-hidden="true" className={`h-[6px] w-[6px] rounded-full ${
                                  isVisible ? 'bg-[var(--signal-cobalt)]' : 'bg-[#E2E5EC]'
                                } ${isCurrent ? 'ring-2 ring-[var(--signal-cobalt)]/50' : ''}`} />
                              </button>
                            );
                          });

                          return (
                            <div key={hour} className="flex items-center justify-center gap-[3px]">
                              {hourQuanta}
                            </div>
                          );
                        })}
                      </div>

                      <div className="w-20 shrink-0 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            focusOnStar(star.id);
                          }}
                          aria-label={`Focus ${star.proper || star.name} in sky canvas`}
                          className="tactile-pill text-[9px] py-1 px-2 uppercase hover:bg-[var(--bg-pill-active)] hover:text-[var(--signal-cobalt)]"
                        >
                          FOCUS ↗
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Bottom Row: 3 Lower Modules matching Frame 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 shrink-0">
        {/* Module 1: RECOMMENDED OBSERVATION WINDOWS */}
        <div className="bento-card bg-white border border-[#E2E5EC] rounded-[14px] p-3.5 flex flex-col justify-between min-h-[190px]">
          <div className="text-[11px] font-bold text-[var(--ink-primary)] tracking-wider uppercase">
            RECOMMENDED OBSERVATION WINDOWS
          </div>

          <div className="space-y-2 mt-2">
            {recommendedWindows.map(item => {
              const isSelected = item.id === activeSelectedId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedConId(item.id);
                    focusOnConstellation(item.id);
                  }}
                  aria-pressed={isSelected}
                  className={`w-full p-2 rounded-[10px] flex items-center justify-between text-left border ${
                    isSelected
                      ? 'bg-[#EAF0FC] border-[#C7D5EC]'
                      : 'bg-[#F8FAFC] border-transparent hover:border-[#E2E5EC]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MiniAsterismGlyph con={item} width={32} height={22} />
                    <div>
                      <div className="font-bold text-xs uppercase text-[var(--ink-primary)]">
                        {item.name}
                      </div>
                      <div className="text-[9px] text-[var(--ink-secondary)] font-mono">
                        <span className="text-[var(--ink-muted)]">ALTITUDE WINDOW · </span>{item.windowStr} UTC
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right font-mono">
                    <div className="text-[9px] font-normal text-[var(--ink-muted)]">SAMPLE COVERAGE</div>
                    <div className="text-[10px] font-bold text-[var(--ink-secondary)]">{item.durationStr}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Module 2: TONIGHT'S HIGHLIGHTS */}
        <div className="bento-card bg-white border border-[#E2E5EC] rounded-[14px] p-3.5 flex flex-col justify-between min-h-[190px]">
          <div className="text-[11px] font-bold text-[var(--ink-primary)] tracking-wider uppercase">
            TONIGHT'S HIGHLIGHTS
          </div>

          <div className="space-y-2 mt-2">
            {tonightHighlights.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedConId(item.id);
                  focusOnConstellation(item.id);
                }}
                className="p-2 rounded-[10px] bg-[#F8FAFC] border border-transparent hover:border-[#E2E5EC] flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-[6px] bg-white border border-[#E2E5EC] flex items-center justify-center shrink-0">
                  <MiniAsterismGlyph con={item} width={26} height={18} />
                </div>
                <div>
                  <div className="font-bold text-xs uppercase text-[var(--ink-primary)]">
                    {item.name}
                  </div>
                  <div className="text-[10px] text-[var(--ink-secondary)] font-mono">
                    BEST: {item.transitTimeStr} (PEAK {item.culmination.maxAltitude}°)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module 3: SKY PREVIEW */}
        <div className="bento-card bg-white border border-[#E2E5EC] rounded-[14px] p-3.5 flex flex-col justify-between min-h-[190px]">
          <div className="flex items-center justify-between text-[11px] font-bold text-[var(--ink-primary)] tracking-wider uppercase">
            <span>SKY PREVIEW</span>
            <span className="font-mono text-[10px] text-[var(--ink-secondary)]">
              {currentUtcTimeStr} UTC
            </span>
          </div>

          <div className="mt-2">
            <SkyPreview
              topCons={filteredConstellations.length > 0 ? filteredConstellations : constellationsData}
              observationDate={observationDate}
              observer={observer}
              onSelectConstellation={conId => focusOnConstellation(conId)}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
