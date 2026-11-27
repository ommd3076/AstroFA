import React, { useState, useMemo, memo } from 'react';
import * as Astronomy from 'astronomy-engine';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATIONS, STAR_BY_ID, STARS } from '../../data/astroData';
import { getHorizontalCoordinates, getMeridianCulmination } from '../../astronomy/coordinates';
import type { IAUConstellation, ObserverLocation } from '../../types/astronomy';
import { ObservingConditions } from './ObservingConditions';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/space/button';
import { Card } from '../../components/ui/space/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/space/empty';
import { Input } from '../../components/ui/space/input';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '../../components/ui/space/select';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/space/toggle-group';
import { Toolbar, ToolbarGroup } from '../../components/ui/space/toolbar';

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
    <svg viewBox="0 0 26 26" className="w-6 h-6 shrink-0" aria-label={`Moon phase ${(fraction * 100).toFixed(0)}%`}>
      <circle cx={cx} cy={cy} r={r} fill="#202026" />
      {pathD && <path d={pathD} fill="#F3F1EB" />}
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
  strokeColor = '#8FA3FF',
  dotColor = '#F3F1EB',
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
    <div className="w-full h-[148px] bg-[var(--bg-viewport)] rounded-lg border border-[var(--border-subtle)] relative overflow-hidden flex items-center justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        role="img"
        aria-label="Night sky preview"
      >
        {/* Subtle background stars */}
        {backgroundStars.map((pt, idx) => (
          <circle key={idx} cx={pt.x} cy={pt.y} r={pt.r} fill="#B5B2A9" opacity={pt.opacity} />
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
                  stroke="#8FA3FF"
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
                fill="#F3F1EB"
                stroke="#8FA3FF"
                strokeWidth="0.8"
              />
            ))}
            {centroid && (
              <text
                x={centroid.x}
                y={Math.min(height - 8, centroid.y + 12)}
                fill="#F3F1EB"
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
    <section className="w-full h-full min-w-0 flex flex-col gap-4 overflow-y-auto pr-0.5 font-sans text-[var(--ink-primary)]" aria-label="Sky visibility tonight">
      <PageHeader
        eyebrow="Observing Planner"
        title="Sky tonight"
        titleId="sky-tonight-title"
        meta={`${targetType === 'constellations' ? filteredConstellations.length : filteredBrightStars.length} ${targetType === 'constellations' ? 'constellations' : 'bright stars'} · ${currentUtcTimeStr} UTC`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ToggleGroup
              aria-label="Time window mode"
              size="sm"
              value={[timeMode]}
              onValueChange={vals => {
                const next = vals.find(v => v !== timeMode) ?? vals[0];
                if (next) setTimeMode(next as typeof timeMode);
              }}
              className="bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] p-0.5 rounded-lg gap-0.5"
            >
              {(['evening', 'night', 'full'] as const).map(mode => (
                <ToggleGroupItem
                  key={mode}
                  value={mode}
                  className="text-[11px] font-semibold uppercase data-pressed:bg-primary data-pressed:text-primary-foreground"
                >
                  {mode}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <Toolbar className="bg-[var(--bg-card-subtle)] border-[var(--border-subtle)] p-0.5 gap-0.5 shadow-none font-mono tabular-nums">
              <ToolbarGroup>
                <Button variant="ghost" size="xs" onClick={() => stepTime(-1)} aria-label="Step observation time back one hour">-1h</Button>
                <Button variant="default" size="xs" onClick={() => setObservationDate(new Date())} aria-label="Set observation date and time to now">Now</Button>
                <Button variant="ghost" size="xs" onClick={() => stepTime(1)} aria-label="Step observation time forward one hour">+1h</Button>
                <Button variant="ghost" size="xs" onClick={() => stepTime(24)} aria-label="Step observation time forward 24 hours">+24h</Button>
                <Button variant="ghost" size="xs" onClick={() => handleStepMinutes(-15)} aria-label="Step observation time back 15 minutes">-15m</Button>
                <Button variant="ghost" size="xs" onClick={() => handleStepMinutes(15)} aria-label="Step observation time forward 15 minutes">+15m</Button>
              </ToolbarGroup>
            </Toolbar>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          {/* Inline ephemeris & site telemetry strip */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-y border-[var(--border-subtle)] py-2.5 sm:grid-cols-3 lg:grid-cols-5">
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">Date · UTC</dt>
              <dd className="mt-0.5 font-mono tabular-nums text-sm font-semibold text-[var(--ink-primary)]">{topMetrics.dateStr}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">Observer site</dt>
              <dd className="mt-0.5 font-mono tabular-nums text-xs font-semibold text-[var(--ink-primary)]">
                {topMetrics.latVal}°{topMetrics.latDir} · {topMetrics.lonVal}°{topMetrics.lonDir}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">Sunset · UTC</dt>
              <dd className="mt-0.5 font-mono tabular-nums text-sm font-semibold text-[var(--ink-primary)]">{topMetrics.sunsetTimeStr}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">Moon phase</dt>
              <dd className="mt-0.5 flex items-center gap-2 font-mono tabular-nums text-sm font-semibold text-[var(--ink-primary)]">
                <span>{topMetrics.moonPercentStr}</span>
                <MoonPhaseDisc fraction={topMetrics.moonFraction} phaseDeg={topMetrics.moonPhaseDeg} />
              </dd>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <dt className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">{visibleTargetDescription}</dt>
              <dd className="mt-0.5 font-mono tabular-nums text-sm font-semibold text-[var(--signal-mid)]">{visibleTargetCount}</dd>
            </div>
          </dl>

          {/* Accessible catalog & visibility filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <ToggleGroup
              aria-label="Target type filter"
              size="sm"
              value={[targetType]}
              onValueChange={vals => {
                const next = vals.find(v => v !== targetType) ?? vals[0];
                if (next) setTargetType(next as typeof targetType);
              }}
              className="bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] p-0.5 rounded-lg gap-0.5"
            >
              <ToggleGroupItem
                value="constellations"
                className="text-[11px] font-semibold data-pressed:bg-primary data-pressed:text-primary-foreground"
              >
                Constellations ({aboveHorizonCount})
              </ToggleGroupItem>
              <ToggleGroupItem
                value="stars"
                className="text-[11px] font-semibold data-pressed:bg-primary data-pressed:text-primary-foreground"
              >
                Bright stars ({visibleBrightStarsCount})
              </ToggleGroupItem>
            </ToggleGroup>

            <Input
              type="text"
              size="sm"
              placeholder="Search constellation or star..."
              aria-label="Search constellations or bright stars"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.stopPropagation()}
              className="w-52 sm:w-60 text-xs"
            />

            <ToggleGroup
              aria-label="Horizon visibility filter"
              size="sm"
              value={[horizonFilter]}
              onValueChange={vals => {
                const next = vals.find(v => v !== horizonFilter) ?? vals[0];
                if (next) setHorizonFilter(next as typeof horizonFilter);
              }}
              className="bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] p-0.5 rounded-lg gap-0.5"
            >
              <ToggleGroupItem
                value="above"
                className="text-[11px] font-semibold data-pressed:bg-primary data-pressed:text-primary-foreground"
              >
                Above ({aboveHorizonCount})
              </ToggleGroupItem>
              <ToggleGroupItem
                value="all"
                className="text-[11px] font-semibold data-pressed:bg-primary data-pressed:text-primary-foreground"
              >
                All 88
              </ToggleGroupItem>
              <ToggleGroupItem
                value="circumpolar"
                className="text-[11px] font-semibold data-pressed:bg-primary data-pressed:text-primary-foreground"
              >
                Circumpolar ({circumpolarCount})
              </ToggleGroupItem>
            </ToggleGroup>

            <ToggleGroup
              aria-label="Hemisphere filter"
              size="sm"
              value={[hemisphereFilter]}
              onValueChange={vals => {
                const next = vals.find(v => v !== hemisphereFilter) ?? vals[0];
                if (next) setHemisphereFilter(next as typeof hemisphereFilter);
              }}
              className="bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] p-0.5 rounded-lg gap-0.5"
            >
              {(['all', 'north', 'south'] as const).map(hemi => (
                <ToggleGroupItem
                  key={hemi}
                  value={hemi}
                  className="text-[11px] font-semibold capitalize data-pressed:bg-primary data-pressed:text-primary-foreground"
                >
                  {hemi === 'all' ? 'All skies' : hemi}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <Select
              value={sortBy}
              onValueChange={val => {
                if (val) setSortBy(val as typeof sortBy);
              }}
            >
              <SelectTrigger size="sm" aria-label="Sort visible targets" className="w-auto min-w-[140px] text-xs">
                <SelectValue>
                  {val =>
                    val === 'altitude'
                      ? 'Sort: Altitude'
                      : val === 'transit'
                        ? 'Sort: Transit'
                        : val === 'name'
                          ? 'Sort: Name (A–Z)'
                          : 'Sort: Area'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="altitude" className="text-xs">Sort: Altitude</SelectItem>
                <SelectItem value="transit" className="text-xs">Sort: Transit</SelectItem>
                <SelectItem value="name" className="text-xs">Sort: Name (A–Z)</SelectItem>
                <SelectItem value="area" className="text-xs">Sort: Area</SelectItem>
              </SelectPopup>
            </Select>
          </div>
        </div>
      </PageHeader>

      {/* Main 2-column planning workspace: Quantum Matrix left, Companion Stack right */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start min-h-0 flex-1">
        {/* Left: 11-Hour Visibility Quantum Matrix */}
        <Card className="atlas-surface rounded-xl p-0 gap-0 overflow-hidden min-h-[380px] max-h-[680px] flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-3.5 py-2.5">
            <h2 className="text-xs font-semibold text-[var(--ink-primary)]">
              11-hour visibility matrix · <span className="font-mono text-[var(--ink-muted)] font-normal">18:00–04:45 UTC</span>
            </h2>
            <span className="font-mono text-[10px] text-[var(--ink-muted)]">
              Click any 15m dot to scrub time
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="min-w-[820px]">
              <div className="sticky top-0 bg-[var(--bg-card-subtle)] border-b border-[var(--border-subtle)] px-3 py-2 flex items-center text-[10px] font-semibold text-[var(--ink-muted)] tracking-[0.08em] uppercase z-10">
                <div className="w-48 shrink-0">
                  {targetType === 'constellations' ? 'Constellation' : 'Star'}
                </div>
                <div className="w-28 shrink-0 font-mono">
                  {targetType === 'constellations' ? 'Window' : 'Mag / Alt'}
                </div>
                <div className="flex-1 grid grid-cols-11 gap-1 text-center font-mono">
                  {NIGHT_HOURS.map(hour => (
                    <span
                      key={hour}
                      className={currentUtcHours === hour ? 'text-[var(--signal-mid)] font-bold' : ''}
                    >
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  ))}
                </div>
                <div className="w-20 shrink-0 text-right">Action</div>
              </div>

              {targetType === 'constellations' && (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {filteredConstellations.length === 0 ? (
                    <Empty className="p-8 border-0">
                      <EmptyHeader>
                        <EmptyTitle className="text-xs">No matching constellations</EmptyTitle>
                        <EmptyDescription className="text-xs">
                          No constellations match current filters.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    filteredConstellations.map(con => (
                      <div
                        key={con.id}
                        className={`px-3 py-2 flex items-center hover:bg-[var(--bg-card-subtle)] text-xs group transition-colors ${selectedConId === con.id ? 'bg-[var(--bg-pill-active)]' : ''}`}
                      >
                        <div className="w-48 shrink-0 flex items-center gap-2.5">
                          <MiniAsterismGlyph con={con} width={32} height={22} />
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedConId(con.id)}
                            aria-pressed={selectedConId === con.id}
                            aria-label={`Select ${con.name}`}
                            className="h-auto p-0 min-w-0 flex-col items-start text-left font-normal hover:bg-transparent"
                          >
                            <span className="block font-sans font-semibold text-xs text-[var(--ink-primary)] group-hover:text-[var(--signal-mid)]">
                              {con.name}
                            </span>
                            <span className="block text-[10px] font-mono text-[var(--ink-muted)] truncate max-w-[140px]">
                              {con.englishName} ({con.id})
                            </span>
                          </Button>
                        </div>

                        <div className="w-28 shrink-0 font-mono tabular-nums text-[11px] text-[var(--ink-secondary)]">
                          {con.culmination.neverRises ? 'Never rises' : con.windowStr}
                        </div>

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
                                <Button
                                  key={qIdx}
                                  variant="ghost"
                                  size="xs"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleSetQuantumTime(hour, minute);
                                  }}
                                  aria-label={`Set observation time to ${getNightSampleDate(observationDate, hour, minute).toISOString().slice(0, 10)} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC; ${
                                    isVisible ? 'Visible Above Horizon' : 'Below Horizon'
                                  }`}
                                  aria-pressed={isCurrent}
                                  className="h-5 sm:h-5 w-3.5 min-w-0 shrink-0 gap-0 rounded-sm border-0 p-0 hover:bg-[var(--bg-pill-active)]"
                                >
                                  <span aria-hidden="true" className={`h-[6px] w-[6px] rounded-full ${
                                    isVisible ? 'bg-[var(--signal-mid)]' : 'bg-[var(--dot-inactive)]'
                                  } ${isCurrent ? 'ring-2 ring-[var(--signal-mid)]/70' : ''}`} />
                                </Button>
                              );
                            });

                            return (
                              <div key={hour} className="flex items-center justify-center gap-[2px]">
                                {hourQuanta}
                              </div>
                            );
                          })}
                        </div>

                        <div className="w-20 shrink-0 text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={e => {
                              e.stopPropagation();
                              focusOnConstellation(con.id);
                            }}
                            aria-label={`Focus ${con.name} in sky canvas`}
                            className="text-[11px] font-semibold hover:text-[var(--signal-mid)]"
                            title={`Focus ${con.name} in sky canvas`}
                          >
                            Focus ↗
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {targetType === 'stars' && (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {filteredBrightStars.length === 0 ? (
                    <Empty className="p-8 border-0">
                      <EmptyHeader>
                        <EmptyTitle className="text-xs">No matching bright stars</EmptyTitle>
                        <EmptyDescription className="text-xs">
                          No bright stars match current filters.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    filteredBrightStars.map(star => (
                      <div
                        key={star.id}
                        className="px-3 py-2 flex items-center hover:bg-[var(--bg-card-subtle)] text-xs group transition-colors"
                      >
                        <div className="w-48 shrink-0">
                          <div>
                            <span className="block font-sans font-semibold text-xs text-[var(--ink-primary)] group-hover:text-[var(--signal-mid)]">
                              {star.proper || star.name}
                            </span>
                            <span className="block text-[10px] font-mono text-[var(--ink-muted)]">
                              {star.con} · HIP {star.hip || '—'}
                            </span>
                          </div>
                        </div>

                        <div className="w-28 shrink-0 font-mono tabular-nums text-[11px] text-[var(--ink-secondary)]">
                          <span className="font-semibold text-[var(--signal-mid)]">{star.mag.toFixed(2)}m</span>
                          <span className="ml-2">Alt {star.altitude.toFixed(0)}°</span>
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
                                <Button
                                  key={qIdx}
                                  variant="ghost"
                                  size="xs"
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleSetQuantumTime(hour, minute);
                                  }}
                                  aria-label={`Set observation time to ${getNightSampleDate(observationDate, hour, minute).toISOString().slice(0, 10)} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC; ${
                                    isVisible ? 'Visible' : 'Below Horizon'
                                  }`}
                                  aria-pressed={isCurrent}
                                  className="h-5 sm:h-5 w-3.5 min-w-0 shrink-0 gap-0 rounded-sm border-0 p-0 hover:bg-[var(--bg-pill-active)]"
                                >
                                  <span aria-hidden="true" className={`h-[6px] w-[6px] rounded-full ${
                                    isVisible ? 'bg-[var(--signal-mid)]' : 'bg-[var(--dot-inactive)]'
                                  } ${isCurrent ? 'ring-2 ring-[var(--signal-mid)]/70' : ''}`} />
                                </Button>
                              );
                            });

                            return (
                              <div key={hour} className="flex items-center justify-center gap-[2px]">
                                {hourQuanta}
                              </div>
                            );
                          })}
                        </div>

                        <div className="w-20 shrink-0 text-right">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={e => {
                              e.stopPropagation();
                              focusOnStar(star.id);
                            }}
                            aria-label={`Focus ${star.proper || star.name} in sky canvas`}
                            className="text-[11px] font-semibold hover:text-[var(--signal-mid)]"
                          >
                            Focus ↗
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Right: Sticky Companion Stack (Sky preview, Windows & Highlights, Weather Forecast) */}
        <div className="flex flex-col gap-3 xl:sticky xl:top-0">
          <Card className="atlas-surface rounded-xl p-3.5 gap-2.5 flex flex-col">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-primary)]">
              <span>Sky preview</span>
              <span className="font-mono tabular-nums text-[10px] font-normal text-[var(--ink-muted)]">
                {currentUtcTimeStr} UTC
              </span>
            </div>
            <SkyPreview
              topCons={filteredConstellations.length > 0 ? filteredConstellations : constellationsData}
              observationDate={observationDate}
              observer={observer}
              onSelectConstellation={conId => focusOnConstellation(conId)}
            />
          </Card>

          <Card className="atlas-surface rounded-xl p-3.5 gap-3 flex flex-col">
            <div>
              <h2 className="text-xs font-semibold text-[var(--ink-primary)] mb-2">
                Recommended windows
              </h2>
              <div className="space-y-1.5">
                {recommendedWindows.map(item => {
                  const isSelected = item.id === activeSelectedId;
                  return (
                    <Button
                      key={item.id}
                      variant={isSelected ? 'secondary' : 'ghost'}
                      onClick={() => {
                        setSelectedConId(item.id);
                        focusOnConstellation(item.id);
                      }}
                      aria-pressed={isSelected}
                      className={`h-auto w-full px-2.5 py-2 rounded-lg flex items-center justify-between text-left border font-normal ${
                        isSelected
                          ? 'bg-[var(--bg-pill-active)] border-[var(--signal-surface)]'
                          : 'bg-[var(--bg-card-subtle)] border-transparent hover:border-[var(--border-subtle)]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MiniAsterismGlyph con={item} width={30} height={20} />
                        <div>
                          <div className="font-sans font-semibold text-xs text-[var(--ink-primary)]">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-[var(--ink-secondary)] font-mono tabular-nums">
                            {item.windowStr} UTC
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right font-mono tabular-nums">
                        <div className="text-[9px] text-[var(--ink-muted)] uppercase">Coverage</div>
                        <div className="text-[11px] font-semibold text-[var(--ink-secondary)]">{item.durationStr}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-3">
              <h2 className="text-xs font-semibold text-[var(--ink-primary)] mb-2">
                Tonight's highlights
              </h2>
              <div className="space-y-1.5">
                {tonightHighlights.map(item => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => {
                      setSelectedConId(item.id);
                      focusOnConstellation(item.id);
                    }}
                    className="h-auto w-full justify-start text-left px-2.5 py-2 rounded-lg bg-[var(--bg-card-subtle)] border border-transparent hover:border-[var(--border-subtle)] flex items-center gap-2.5 font-normal"
                  >
                    <div className="w-7 h-7 rounded-md bg-[var(--bg-viewport)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                      <MiniAsterismGlyph con={item} width={22} height={16} />
                    </div>
                    <div>
                      <div className="font-sans font-semibold text-xs text-[var(--ink-primary)]">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-[var(--ink-secondary)] font-mono tabular-nums">
                        Transit {item.transitTimeStr} · Peak {item.culmination.maxAltitude}°
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          <ObservingConditions />
        </div>
      </div>
    </section>
  );
};
