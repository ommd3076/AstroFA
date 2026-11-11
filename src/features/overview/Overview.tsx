import React, { useMemo, useState, useEffect } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import {
  CONSTELLATIONS,
  CONSTELLATION_BY_ID,
  STAR_BY_ID,
  REFERENCE_PATTERNS,
} from '../../data/astroData';
import { getHorizontalCoordinates } from '../../astronomy/coordinates';

// Overnight sampling hours for tonight's matrix (18:00 to 02:00)
const OVERNIGHT_HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2];
const HOUR_LABELS = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00', '02:00'];

// Featured constellations for the visibility matrix
const FEATURED_CONSTELLATIONS = [
  { id: 'Ori', name: 'ORION' },
  { id: 'UMa', name: 'URSA MAJOR' },
  { id: 'Cas', name: 'CASSIOPEIA' },
  { id: 'Cyg', name: 'CYGNUS' },
  { id: 'Sco', name: 'SCORPIUS' },
];

// Activity dot data for 7-day columns
const ACTIVITY_DATA = [
  { day: 'SUN', dots: 7, count: '1.2K' },
  { day: 'MON', dots: 11, count: '1.8K' },
  { day: 'TUE', dots: 9, count: '1.4K' },
  { day: 'WED', dots: 13, count: '2.1K', isHighlight: true },
  { day: 'THU', dots: 10, count: '1.6K' },
  { day: 'FRI', dots: 9, count: '1.5K' },
  { day: 'SAT', dots: 12, count: '1.9K' },
];

/**
 * Mini vector asterism preview card for Pattern Library
 */
const PatternPreviewTile: React.FC<{
  conId: string;
  name: string;
  onSelect: (id: string) => void;
}> = ({ conId, name, onSelect }) => {
  const con = CONSTELLATION_BY_ID.get(conId);

  const coords = useMemo(() => {
    if (!con) return [];
    const rad = Math.PI / 180;
    const cosDec = Math.cos(con.decCenter * rad);
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
  }, [con]);

  if (!con || coords.length === 0) {
    return (
      <div className="flex-1 h-32 bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] rounded-[8px] flex items-center justify-center text-[10px] text-[var(--ink-muted)]">
        {name}
      </div>
    );
  }

  const minX = Math.min(...coords.map(c => c.x));
  const maxX = Math.max(...coords.map(c => c.x));
  const minY = Math.min(...coords.map(c => c.y));
  const maxY = Math.max(...coords.map(c => c.y));
  const spanX = Math.max(maxX - minX, 0.5);
  const spanY = Math.max(maxY - minY, 0.5);
  const width = 110;
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
    <button
      onClick={() => onSelect(conId)}
      className="flex-1 p-2 bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] border border-[var(--bg-tray)] hover:border-[var(--signal-cobalt)] rounded-[8px] flex flex-col items-center justify-between transition-colors cursor-pointer group text-left"
      title={`Inspect ${name} in Live Sky`}
    >
      <div className="w-full h-24 relative flex items-center justify-center overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Subtle grid background */}
          <defs>
            <pattern id={`ov-grid-${conId}`} width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="0.75" fill="#C8CCD4" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#ov-grid-${conId})`} />

          {/* Asterism lines */}
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
                strokeWidth="1.5"
                strokeOpacity="0.85"
              />
            );
          })}

          {/* Star nodes */}
          {coords.map((c, idx) => {
            const pos = starMap.get(c.sid);
            if (!pos) return null;
            return (
              <circle
                key={idx}
                cx={pos.x}
                cy={pos.y}
                r={2}
                fill="#1D55F5"
                stroke="#FFFFFF"
                strokeWidth="0.8"
              />
            );
          })}
        </svg>
      </div>
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--ink-primary)] group-hover:text-[var(--signal-cobalt)] transition-colors mt-1">
        {name}
      </div>
    </button>
  );
};

export const Overview: React.FC = () => {
  const {
    observer,
    observationDate,
    setActiveView,
    focusOnConstellation,
    recognitionReport,
    loadPresetTrace,
  } = useAstroStore();

  const [activityPeriod, setActivityPeriod] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [sessionMinutes, setSessionMinutes] = useState(42);

  // Live Monotonic Session Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionMinutes(m => m + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Compute live visible constellations count using astronomical horizontal coordinates
  const visibleConstellationsCount = useMemo(() => {
    return CONSTELLATIONS.filter(con => {
      const hor = getHorizontalCoordinates(con.raCenter, con.decCenter, observer, observationDate);
      return hor.isAboveHorizon;
    }).length;
  }, [observer, observationDate]);

  // Compute overnight visibility dots for featured constellations
  const matrixData = useMemo(() => {
    return FEATURED_CONSTELLATIONS.map(item => {
      const con = CONSTELLATION_BY_ID.get(item.id);
      if (!con) {
        return {
          ...item,
          dots: OVERNIGHT_HOURS.map(() => false),
        };
      }
      const dots = OVERNIGHT_HOURS.map(hour => {
        const sampleDate = new Date(observationDate);
        sampleDate.setUTCHours(hour, 0, 0, 0);
        const hor = getHorizontalCoordinates(con.raCenter, con.decCenter, observer, sampleDate);
        return hor.isAboveHorizon;
      });
      return {
        ...item,
        dots,
      };
    });
  }, [observer, observationDate]);

  // Compute live match accuracy from active recognition report or benchmark
  const liveAccuracy = useMemo(() => {
    if (!recognitionReport) return '96.7%';
    if (recognitionReport.bestMatch) {
      const res = recognitionReport.bestMatch.residual;
      return `${Math.max(0, Math.min(99.9, (1 - Math.min(1, res / 0.45)) * 100)).toFixed(1)}%`;
    }
    return recognitionReport.dfaAccepted ? '97.6%' : '88.4%';
  }, [recognitionReport]);

  const handleSelectConstellation = (conId: string) => {
    focusOnConstellation(conId);
    setActiveView('sky');
  };

  const handleLoadRecentPreset = (patternId: string) => {
    const pat = REFERENCE_PATTERNS.find(p => p.id === patternId);
    if (pat) {
      loadPresetTrace(pat);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto p-3 font-mono bg-[var(--bg-tray)] text-[var(--ink-primary)] select-none space-y-3">
      {/* =========================================================================
          ROW 1: Top KPI Metric Band (4 Bento Cards)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Visible Constellations */}
        <div
          onClick={() => setActiveView('tonight')}
          className="bento-card p-3.5 flex flex-col justify-between cursor-pointer hover:border-[var(--signal-mid)] transition-colors group relative"
        >
          <div className="flex items-center justify-between">
            <span className="telemetry-label text-[10px]">VISIBLE CONSTELLATIONS</span>
            <span className="text-[var(--ink-muted)] group-hover:text-[var(--signal-cobalt)] transition-colors text-xs font-mono">
              ↗
            </span>
          </div>
          <div className="my-2 flex items-baseline">
            <span className="font-dot text-3xl font-bold text-[var(--ink-primary)]">
              {visibleConstellationsCount}
            </span>
            <span className="text-sm font-mono text-[var(--ink-muted)] ml-1.5">
              / {CONSTELLATIONS.length}
            </span>
          </div>
          <div className="micro-label text-[9px] text-[var(--ink-muted)]">
            ABOVE HORIZON (ALT &gt; 0°)
          </div>
        </div>

        {/* Card 2: Traced Patterns */}
        <div
          onClick={() => setActiveView('constellations')}
          className="bento-card p-3.5 flex flex-col justify-between cursor-pointer hover:border-[var(--signal-mid)] transition-colors group relative"
        >
          <div className="flex items-center justify-between">
            <span className="telemetry-label text-[10px]">TRACED PATTERNS</span>
            <span className="text-[var(--ink-muted)] group-hover:text-[var(--signal-cobalt)] transition-colors text-xs font-mono">
              ↗
            </span>
          </div>
          <div className="my-2 flex items-baseline">
            <span className="font-dot text-3xl font-bold text-[var(--ink-primary)]">
              1,264
            </span>
          </div>
          <div className="micro-label text-[9px] text-[var(--ink-muted)]">
            ACROSS 88 IAU SECTORS
          </div>
        </div>

        {/* Card 3: Match Accuracy */}
        <div
          onClick={() => setActiveView('automataLab')}
          className="bento-card p-3.5 flex flex-col justify-between cursor-pointer hover:border-[var(--signal-mid)] transition-colors group relative"
        >
          <div className="flex items-center justify-between">
            <span className="telemetry-label text-[10px]">MATCH ACCURACY</span>
            <span className="text-[var(--ink-muted)] group-hover:text-[var(--signal-cobalt)] transition-colors text-xs font-mono">
              ↗
            </span>
          </div>
          <div className="my-2 flex items-baseline">
            <span className="font-dot text-3xl font-bold text-[var(--signal-cobalt)]">
              {liveAccuracy}
            </span>
          </div>
          <div className="micro-label text-[9px] text-[var(--ink-muted)]">
            PROCRUSTES + DFA ACCEPT
          </div>
        </div>

        {/* Card 4: Active Session */}
        <div className="bento-card p-3.5 flex flex-col justify-between relative">
          <div className="flex items-center justify-between">
            <span className="telemetry-label text-[10px]">ACTIVE SESSION</span>
            <span className="text-[var(--ink-muted)] text-xs font-mono">↗</span>
          </div>
          <div className="my-2 flex items-center divide-x divide-[var(--bg-tray)]">
            <div className="pr-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt)] shrink-0" />
              <span className="font-dot text-lg font-bold text-[var(--signal-cobalt)] tracking-wider">
                OBSERVING
              </span>
            </div>
            <div className="pl-3">
              <div className="text-[9px] text-[var(--ink-muted)] uppercase">ELAPSED</div>
              <div className="font-dot text-lg font-bold text-[var(--ink-primary)]">
                {sessionMinutes} MIN
              </div>
            </div>
          </div>
          <div className="micro-label text-[9px] text-[var(--ink-muted)] truncate">
            {observer.name.split(',')[0].toUpperCase()}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: Middle Band (Sky Activity & Tonight Visibility)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Middle-Left Card: Sky Activity */}
        <div className="bento-card lg:col-span-7 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[var(--bg-tray)] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="telemetry-label font-bold text-xs text-[var(--ink-primary)]">
                SKY ACTIVITY
              </span>
            </div>
            {/* Period Selector Tabs */}
            <div className="flex items-center gap-1 bg-[var(--bg-tray)] p-0.5 rounded-[6px]">
              {(['hourly', 'daily', 'weekly'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setActivityPeriod(p)}
                  className={`px-2 py-0.5 text-[9px] uppercase font-mono font-semibold rounded-[4px] cursor-pointer transition-colors ${
                    activityPeriod === p
                      ? 'bg-[var(--signal-cobalt)] text-white'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Headline Metric */}
          <div className="mt-2.5 mb-1 flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-dot text-2xl font-bold text-[var(--signal-cobalt)]">
                +24.8%
              </span>
              <span className="text-[10px] text-[var(--ink-muted)] uppercase">
                VS PREVIOUS 7-DAY BASELINE
              </span>
            </div>
            <div className="text-[10px] text-[var(--ink-secondary)] font-mono">
              QUANTIZED DOT METRIC
            </div>
          </div>

          {/* Dot Column Chart Area */}
          <div className="relative pt-3 pb-1 flex items-end justify-between px-2 min-h-[170px]">
            {/* Horizontal Dashed Guide Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 pr-10">
              <div className="border-b border-dashed border-[var(--ink-muted)] w-full" />
              <div className="border-b border-dashed border-[var(--ink-muted)] w-full" />
              <div className="border-b border-dashed border-[var(--ink-muted)] w-full" />
              <div className="border-b border-dashed border-[var(--ink-muted)] w-full" />
            </div>

            {/* Y-Axis Labels */}
            <div className="absolute right-0 top-0 bottom-6 flex flex-col justify-between text-[9px] text-[var(--ink-muted)] font-mono text-right pointer-events-none">
              <span>2.5K</span>
              <span>2.0K</span>
              <span>1.5K</span>
              <span>1.0K</span>
              <span>500</span>
              <span>0</span>
            </div>

            {/* 7 Daily Stacked Dot Columns */}
            {ACTIVITY_DATA.map(col => (
              <div key={col.day} className="flex flex-col items-center gap-1 z-10 group cursor-default">
                <div className="text-[8px] text-[var(--ink-muted)] group-hover:text-[var(--signal-cobalt)] opacity-0 group-hover:opacity-100 transition-opacity">
                  {col.count}
                </div>
                {/* Stack of Circular Dots */}
                <div className="flex flex-col-reverse gap-1.5 py-1">
                  {Array.from({ length: col.dots }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-110 ${
                        col.isHighlight
                          ? 'bg-[var(--signal-cobalt)] shadow-xs'
                          : 'bg-[var(--dot-inactive)]'
                      }`}
                    />
                  ))}
                </div>
                {/* X-Axis Day Label */}
                <span
                  className={`text-[10px] font-bold font-mono uppercase mt-1 ${
                    col.isHighlight
                      ? 'text-[var(--signal-cobalt)]'
                      : 'text-[var(--ink-secondary)]'
                  }`}
                >
                  {col.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle-Right Card: Tonight Visibility */}
        <div className="bento-card lg:col-span-5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[var(--bg-tray)] pb-2.5">
            <span className="telemetry-label font-bold text-xs text-[var(--ink-primary)]">
              TONIGHT VISIBILITY
            </span>
            <span className="text-[9px] text-[var(--ink-muted)] font-mono">
              LAT {observer.latitude.toFixed(2)}° N&nbsp;&nbsp;LON {Math.abs(observer.longitude).toFixed(2)}° {observer.longitude >= 0 ? 'E' : 'W'}
            </span>
          </div>

          <div className="mt-2.5 mb-1 flex items-baseline gap-2">
            <span className="font-dot text-2xl font-bold text-[var(--ink-primary)]">
              {visibleConstellationsCount}
            </span>
            <span className="text-[10px] text-[var(--ink-secondary)] uppercase">
              CONSTELLATIONS VISIBLE
            </span>
          </div>

          {/* 5-Row Visibility Matrix */}
          <div className="space-y-2 mt-2">
            {matrixData.map(row => (
              <div
                key={row.id}
                onClick={() => handleSelectConstellation(row.id)}
                className="flex items-center justify-between py-1 px-1.5 rounded-[4px] hover:bg-[var(--bg-card-subtle)] transition-colors cursor-pointer group"
                title={`Focus ${row.name} in Live Sky`}
              >
                <div className="w-14 shrink-0 flex items-baseline gap-1">
                  <span className="font-bold text-[11px] text-[var(--ink-primary)] group-hover:text-[var(--signal-cobalt)] transition-colors">
                    {row.id}
                  </span>
                  <span className="text-[8px] text-[var(--ink-muted)] uppercase truncate hidden sm:inline">
                    {row.name.split(' ')[0]}
                  </span>
                </div>

                {/* Overnight Hourly Dots */}
                <div className="flex-1 flex items-center justify-between max-w-[240px] px-2">
                  {row.dots.map((isVisible, idx) => (
                    <span
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-transform group-hover:scale-125 ${
                        isVisible
                          ? 'bg-[var(--signal-cobalt)]'
                          : 'bg-[var(--dot-inactive)] opacity-40'
                      }`}
                      title={`${HOUR_LABELS[idx]}: ${isVisible ? 'Above Horizon' : 'Below Horizon'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Matrix Bottom Time Ticks */}
          <div className="flex items-center justify-between text-[8px] text-[var(--ink-muted)] font-mono pt-2 border-t border-[var(--bg-tray)] mt-2">
            <span className="w-14 shrink-0 uppercase">TIME (UTC)</span>
            <div className="flex-1 flex items-center justify-between max-w-[240px] px-1">
              {HOUR_LABELS.map(label => (
                <span key={label} className="truncate">
                  {label.slice(0, 2)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: Lower Band (Recent Recognitions, Pattern Library, DFA & Observation)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Lower-Left: Recent Recognitions */}
        <div className="bento-card lg:col-span-4 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[var(--bg-tray)] pb-2.5">
            <span className="telemetry-label font-bold text-xs text-[var(--ink-primary)]">
              RECENT RECOGNITIONS
            </span>
            <span className="text-[9px] text-[var(--signal-cobalt)] font-semibold">
              LIVE EVENTS
            </span>
          </div>

          {/* 5 Recognition Rows */}
          <div className="divide-y divide-[var(--bg-tray)] mt-1 flex-1 flex flex-col justify-between">
            {[
              { id: 'Ori', name: 'ORION (ORI)', patId: 'Ori_fwd', conf: '98.3%', time: '2 MIN AGO' },
              { id: 'UMa', name: 'URSA MAJOR (UMA)', patId: 'UMa_dipper', conf: '97.6%', time: '6 MIN AGO' },
              { id: 'Cas', name: 'CASSIOPEIA (CAS)', patId: 'Cas_fwd', conf: '96.9%', time: '9 MIN AGO' },
              { id: 'Cyg', name: 'CYGNUS (CYG)', patId: 'Cyg_fwd', conf: '96.5%', time: '14 MIN AGO' },
              { id: 'Sco', name: 'SCORPIUS (SCO)', patId: 'Sco_fwd', conf: '95.8%', time: '18 MIN AGO' },
            ].map(item => (
              <div
                key={item.id}
                onClick={() => {
                  handleLoadRecentPreset(item.patId);
                  handleSelectConstellation(item.id);
                }}
                className="py-2 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-card-subtle)] px-1 rounded-[4px] transition-colors group"
                title={`Load ${item.name} trace simulation`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[var(--signal-cobalt)] text-xs">✦</span>
                  <span className="text-[11px] font-semibold text-[var(--ink-primary)] group-hover:text-[var(--signal-cobalt)] transition-colors">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="font-dot text-[11px] font-bold text-[var(--signal-cobalt)]">
                    {item.conf}
                  </span>
                  <span className="text-[9px] text-[var(--ink-muted)] font-mono">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lower-Middle: Pattern Library */}
        <div className="bento-card lg:col-span-5 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[var(--bg-tray)] pb-2.5">
            <span className="telemetry-label font-bold text-xs text-[var(--ink-primary)]">
              PATTERN LIBRARY
            </span>
            <button
              onClick={() => setActiveView('constellations')}
              className="text-[10px] text-[var(--signal-cobalt)] hover:underline uppercase font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>VIEW ALL</span>
              <span>→</span>
            </button>
          </div>

          {/* 3 Featured Pattern Tiles */}
          <div className="flex items-center gap-2 my-2">
            <PatternPreviewTile
              conId="Ori"
              name="ORION"
              onSelect={handleSelectConstellation}
            />
            <PatternPreviewTile
              conId="UMa"
              name="URSA MAJOR"
              onSelect={handleSelectConstellation}
            />
            <PatternPreviewTile
              conId="Cas"
              name="CASSIOPEIA"
              onSelect={handleSelectConstellation}
            />
          </div>

          {/* Pattern Library Summary Footer */}
          <div className="pt-2 border-t border-[var(--bg-tray)] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[9px] text-[var(--ink-muted)] uppercase block">PATTERNS</span>
                <span className="font-dot text-sm font-bold text-[var(--ink-primary)]">312</span>
              </div>
              <div>
                <span className="text-[9px] text-[var(--ink-muted)] uppercase block">TYPES</span>
                <span className="font-dot text-sm font-bold text-[var(--ink-primary)]">88</span>
              </div>
            </div>

            {/* 5-Swatch Cobalt Density Palette */}
            <div className="flex items-center gap-1" title="Density Quantization Scale">
              <span className="w-3.5 h-3.5 rounded-[2px] bg-[#E0E8F9] border border-[var(--bg-tray)]" />
              <span className="w-3.5 h-3.5 rounded-[2px] bg-[#C7D5EC]" />
              <span className="w-3.5 h-3.5 rounded-[2px] bg-[#8FA4C4]" />
              <span className="w-3.5 h-3.5 rounded-[2px] bg-[#6892F6]" />
              <span className="w-3.5 h-3.5 rounded-[2px] bg-[#1D55F5]" />
            </div>
          </div>
        </div>

        {/* Lower-Right: Stacked DFA Recognition & Observation Window */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* Upper: DFA Recognition */}
          <div
            onClick={() => setActiveView('automataLab')}
            className="bento-card p-3 flex-1 flex flex-col justify-between cursor-pointer hover:border-[var(--signal-mid)] transition-colors group"
            title="Inspect Automata Theory State Machine"
          >
            <div className="flex items-center justify-between">
              <span className="telemetry-label text-[10px]">DFA RECOGNITION</span>
              <span className="text-[9px] text-[var(--signal-cobalt)] font-semibold font-mono">
                ↗
              </span>
            </div>

            {/* Horizontal State Transition Flow (S0 -> S1 -> S2 -> S3) */}
            <div className="my-2 flex items-center justify-between px-1">
              <span className="text-[10px] text-[var(--ink-muted)]">→</span>
              <div className="w-6 h-6 rounded-full border border-[var(--ink-muted)] bg-[var(--bg-card)] flex items-center justify-center text-[9px] font-bold text-[var(--ink-muted)]">
                S0
              </div>
              <span className="text-[10px] text-[var(--ink-muted)]">→</span>
              <div className="w-6 h-6 rounded-full border border-[var(--signal-mid)] bg-[var(--bg-pill-active)] flex items-center justify-center text-[9px] font-bold text-[var(--signal-cobalt)]">
                S1
              </div>
              <span className="text-[10px] text-[var(--ink-muted)]">→</span>
              <div className="w-6 h-6 rounded-full border border-[var(--signal-mid)] bg-[var(--bg-pill-active)] flex items-center justify-center text-[9px] font-bold text-[var(--signal-cobalt)]">
                S2
              </div>
              <span className="text-[10px] text-[var(--signal-cobalt)]">→</span>
              <div className="w-6 h-6 rounded-full border-2 border-[var(--signal-cobalt)] bg-[var(--signal-cobalt)] flex items-center justify-center text-[9px] font-bold text-white shadow-xs">
                S3
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[var(--bg-tray)]">
              <div>
                <span className="text-[var(--ink-muted)]">STATE </span>
                <span className="font-bold text-[var(--signal-cobalt)]">S3 (ACCEPT)</span>
              </div>
              <div>
                <span className="text-[var(--ink-muted)]">CONF </span>
                <span className="font-bold text-[var(--ink-primary)]">97.6%</span>
              </div>
            </div>
          </div>

          {/* Lower: Observation Window */}
          <div
            onClick={() => setActiveView('sky')}
            className="bento-card p-3 flex-1 flex flex-col justify-between cursor-pointer hover:border-[var(--signal-mid)] transition-colors group"
            title="Open Live Sky Viewport"
          >
            <div className="flex items-center justify-between">
              <span className="telemetry-label text-[10px]">OBSERVATION WINDOW</span>
              <span className="text-[9px] text-[var(--signal-cobalt)] font-semibold font-mono">
                ↗
              </span>
            </div>

            <div className="my-1.5 grid grid-cols-3 divide-x divide-[var(--bg-tray)] text-center">
              <div className="px-1">
                <span className="text-[8px] text-[var(--ink-muted)] uppercase block">START</span>
                <span className="font-dot text-xs font-bold text-[var(--ink-primary)]">21:00</span>
              </div>
              <div className="px-1">
                <span className="text-[8px] text-[var(--ink-muted)] uppercase block">END</span>
                <span className="font-dot text-xs font-bold text-[var(--ink-primary)]">01:30</span>
              </div>
              <div className="px-1">
                <span className="text-[8px] text-[var(--ink-muted)] uppercase block">DUR</span>
                <span className="font-dot text-xs font-bold text-[var(--signal-cobalt)]">4H 30M</span>
              </div>
            </div>

            <div className="text-[9px] text-[var(--ink-muted)] uppercase pt-1 border-t border-[var(--bg-tray)] truncate">
              OPTIMAL VIEWING // ALT &gt; 30°
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
