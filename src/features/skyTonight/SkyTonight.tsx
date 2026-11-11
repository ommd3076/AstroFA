import React, { useState, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATIONS, STAR_BY_ID } from '../../data/astroData';
import { getHorizontalCoordinates, getMeridianCulmination } from '../../astronomy/coordinates';

const NIGHT_HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];
const QUANTA_MINUTES = [0, 15, 30, 45];

export const SkyTonight: React.FC = () => {
  const {
    observer,
    observationDate,
    setObservationDate,
    stepTime,
    setActiveView,
    setFocusedConstellationId,
  } = useAstroStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [horizonFilter, setHorizonFilter] = useState<'above' | 'all' | 'circumpolar'>('above');
  const [hemisphereFilter, setHemisphereFilter] = useState<'all' | 'north' | 'south'>('all');
  const [sortBy, setSortBy] = useState<'altitude' | 'transit' | 'name' | 'area'>('altitude');

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
      const formatTime = (d: Date) => {
        const h = d.getUTCHours().toString().padStart(2, '0');
        const m = d.getUTCMinutes().toString().padStart(2, '0');
        return `${h}:${m} UTC`;
      };

      const transitTimeStr = formatTime(culmination.transitDate);
      const windowStr = `${formatTime(culmination.optimalWindowStart)} – ${formatTime(culmination.optimalWindowEnd)}`;

      // Calculate 10-hour night visibility dot array (18:00 to 04:00)
      const nightVisibilityDots = NIGHT_HOURS.map(hour => {
        const sampleDate = new Date(observationDate);
        sampleDate.setUTCHours(hour, 0, 0, 0);
        const sampleHor = getHorizontalCoordinates(con.raCenter, con.decCenter, observer, sampleDate);
        return sampleHor.isAboveHorizon;
      });

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
        nightVisibilityDots,
      };
    });
  }, [observer, observationDate]);

  // Filtering & Sorting
  const filtered = useMemo(() => {
    return constellationsData
      .filter(c => {
        // Horizon filter
        if (horizonFilter === 'above' && !c.isAboveHorizon) return false;
        if (horizonFilter === 'circumpolar' && !c.culmination.isCircumpolar) return false;

        // Hemisphere filter
        if (hemisphereFilter === 'north' && c.decCenter < 0) return false;
        if (hemisphereFilter === 'south' && c.decCenter >= 0) return false;

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
  }, [constellationsData, horizonFilter, hemisphereFilter, searchQuery, sortBy]);

  const aboveHorizonCount = constellationsData.filter(c => c.isAboveHorizon).length;
  const circumpolarCount = constellationsData.filter(c => c.culmination.isCircumpolar).length;

  const currentUtcHours = observationDate.getUTCHours();
  const currentUtcMinutes = observationDate.getUTCMinutes();

  // Quantum setter: updates UTC time to exact hour and minute
  const handleSetQuantumTime = (hour: number, minute: number) => {
    const newDate = new Date(observationDate);
    newDate.setUTCHours(hour, minute, 0, 0);
    setObservationDate(newDate);
  };

  const handleStepMinutes = (deltaMinutes: number) => {
    const newDate = new Date(observationDate.getTime() + deltaMinutes * 60 * 1000);
    setObservationDate(newDate);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-mono p-1.5 sm:p-2 gap-1.5 overflow-y-auto">
      {/* Top Header Bento Card */}
      <div className="bento-card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--signal-cobalt)]" />
            <span className="telemetry-label text-xs">[ 🔭 TOPOCENTRIC TELEMETRY // SKY TONIGHT ]</span>
          </div>
          <p className="text-[11px] text-[var(--ink-secondary)] mt-1">
            Topocentric ephemerides from <strong>{observer.name.toUpperCase()}</strong> [LAT {observer.latitude.toFixed(2)}° // LON {observer.longitude.toFixed(2)}°] at{' '}
            <strong className="font-dot text-[var(--signal-cobalt)]">{observationDate.toUTCString().replace('GMT', 'UTC')}</strong>.
          </p>
        </div>

        {/* Quick Time Navigation Hardware Stepper Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <button
            onClick={() => stepTime(-2)}
            className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] tracking-wider font-bold"
          >
            -2H
          </button>
          <button
            onClick={() => stepTime(-1)}
            className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] tracking-wider font-bold"
          >
            -1H
          </button>
          <button
            onClick={() => setObservationDate(new Date())}
            className="tactile-pill hud-reticle bg-[var(--signal-cobalt)] text-white border border-[var(--signal-mid)] text-[10px] tracking-wider font-bold"
          >
            NOW
          </button>
          <button
            onClick={() => stepTime(1)}
            className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] tracking-wider font-bold"
          >
            +1H
          </button>
          <button
            onClick={() => stepTime(2)}
            className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] tracking-wider font-bold"
          >
            +2H
          </button>
          <button
            onClick={() => stepTime(24)}
            className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] tracking-wider"
          >
            +24H
          </button>
        </div>
      </div>

      {/* Multi-Band Horizontal Dot Matrix Timeline (10 Hours: 18:00 to 04:00, 4 Dots/Hour) */}
      <div className="bento-card p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="telemetry-label text-[11px]">[ ⏱️ MULTI-BAND DOT MATRIX TIMELINE // 18:00 - 04:00 UTC (15-MIN QUANTA) ]</span>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="telemetry-label text-[10px]">CURRENT UTC:</span>
            <span className="font-dot text-sm text-[var(--signal-cobalt)] font-bold bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] px-2.5 py-0.5 rounded-[6px]">
              {currentUtcHours.toString().padStart(2, '0')}:{currentUtcMinutes.toString().padStart(2, '0')} UTC
            </span>
          </div>
        </div>

        {/* Quantized Multi-Band Matrix Track */}
        <div className="p-3 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[10px] overflow-x-auto">
          <div className="grid grid-cols-11 gap-1.5 min-w-[620px]">
            {NIGHT_HOURS.map(hour => {
              const isCurrentHour = currentUtcHours === hour;
              return (
                <div
                  key={hour}
                  className={`p-2 rounded-[6px] border flex flex-col items-center gap-2 transition-all ${
                    isCurrentHour
                      ? 'bg-[var(--bg-pill-active)] border-[var(--signal-cobalt)]'
                      : 'bg-[var(--bg-card)] border-[var(--card-border-subtle)]'
                  }`}
                >
                  {/* Hour Label */}
                  <span className={`text-[10px] font-bold ${isCurrentHour ? 'font-dot text-[var(--signal-cobalt)]' : 'text-[var(--ink-muted)]'}`}>
                    {hour.toString().padStart(2, '0')}:00
                  </span>

                  {/* 4 Discrete Dots per Hour (15-min quanta) */}
                  <div className="flex items-center gap-[4px]">
                    {QUANTA_MINUTES.map(minute => {
                      const isActiveQuantum =
                        currentUtcHours === hour &&
                        Math.floor(currentUtcMinutes / 15) === Math.floor(minute / 15);

                      return (
                        <button
                          key={minute}
                          onClick={() => handleSetQuantumTime(hour, minute)}
                          title={`Set time to ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC`}
                          className={`w-[7px] h-[7px] rounded-full transition-all cursor-pointer ${
                            isActiveQuantum
                              ? 'bg-[var(--dot-active)] ring-2 ring-[var(--signal-cobalt)]/40 scale-125'
                              : 'bg-[var(--dot-inactive)] hover:bg-[var(--signal-mid)] hover:scale-110'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hardware Stepping Controls Bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className="telemetry-label text-[10px] text-[var(--ink-muted)]">QUANTUM STEPPERS:</span>
            <button
              onClick={() => handleStepMinutes(-15)}
              className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1 px-2.5 font-bold"
            >
              -15 MIN
            </button>
            <button
              onClick={() => handleStepMinutes(15)}
              className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1 px-2.5 font-bold"
            >
              +15 MIN
            </button>
            <button
              onClick={() => stepTime(-1)}
              className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1 px-2.5 font-bold"
            >
              -1 HR
            </button>
            <button
              onClick={() => stepTime(1)}
              className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1 px-2.5 font-bold"
            >
              +1 HR
            </button>
          </div>

          <div className="text-[10px] text-[var(--ink-muted)] flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--dot-active)]" />
            <span>ACTIVE QUANTA: #1D55F5</span>
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--dot-inactive)] ml-2" />
            <span>DORMANT: #C8CCD4</span>
          </div>
        </div>
      </div>

      {/* Controls Bar: Search, Filters, Sorting */}
      <div className="bento-card p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input wrapped in HUD Reticle */}
          <div className="hud-reticle flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="SEARCH CONSTELLATION OR STAR..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] rounded-[8px] px-3.5 py-1.5 text-xs text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--signal-cobalt)] font-mono uppercase tracking-wider w-full"
            />
          </div>

          {/* Horizon Filter Rockers */}
          <div className="tactile-rocker hud-reticle">
            <button
              onClick={() => setHorizonFilter('above')}
              className={`tactile-pill text-[10px] uppercase tracking-wider ${
                horizonFilter === 'above' ? 'active' : ''
              }`}
            >
              ABOVE HORIZON ({aboveHorizonCount})
            </button>
            <button
              onClick={() => setHorizonFilter('all')}
              className={`tactile-pill text-[10px] uppercase tracking-wider ${
                horizonFilter === 'all' ? 'active' : ''
              }`}
            >
              ALL 88
            </button>
            <button
              onClick={() => setHorizonFilter('circumpolar')}
              className={`tactile-pill text-[10px] uppercase tracking-wider ${
                horizonFilter === 'circumpolar' ? 'active' : ''
              }`}
            >
              CIRCUMPOLAR ({circumpolarCount})
            </button>
          </div>
        </div>

        {/* Hemisphere & Sort Dropdowns */}
        <div className="flex items-center gap-2 text-xs">
          <div className="tactile-rocker hud-reticle">
            {(['all', 'north', 'south'] as const).map(hemi => (
              <button
                key={hemi}
                onClick={() => setHemisphereFilter(hemi)}
                className={`tactile-pill text-[10px] uppercase tracking-wider ${
                  hemisphereFilter === hemi ? 'active' : ''
                }`}
              >
                {hemi === 'all' ? 'ALL' : hemi === 'north' ? 'NORTH' : 'SOUTH'}
              </button>
            ))}
          </div>

          <div className="hud-reticle">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] rounded-[6px] px-2.5 py-1 text-[11px] text-[var(--ink-secondary)] font-mono uppercase tracking-wider cursor-pointer focus:outline-none focus:border-[var(--signal-cobalt)]"
            >
              <option value="altitude">SORT: CURRENT ALTITUDE</option>
              <option value="transit">SORT: NEAREST TRANSIT</option>
              <option value="name">SORT: NAME (A-Z)</option>
              <option value="area">SORT: SKY AREA</option>
            </select>
          </div>
        </div>
      </div>

      {/* Recessed Bento Grid of Constellation Ranking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 flex-1 min-h-0">
        {filtered.map(con => (
          <div
            key={con.id}
            className="bento-card p-3.5 flex flex-col justify-between gap-2.5 hover:border-[var(--signal-mid)] transition-all group"
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
                  {con.culmination.isCircumpolar && (
                    <span className="hud-reticle px-1 py-0.2 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] text-[8px] font-bold uppercase">
                      CIRCUMPOLAR
                    </span>
                  )}
                </div>
              </div>

              {/* Status Pill: Live Altitude & Azimuth in Tier 1 Doto */}
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span
                  className={`hud-reticle px-2 py-0.5 rounded-[6px] text-[10px] font-semibold flex items-center gap-1.5 ${
                    con.isAboveHorizon
                      ? 'bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-mid)]'
                      : 'bg-[var(--bg-pill-neutral)] text-[var(--ink-muted)] border border-[var(--bg-tray)]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${con.isAboveHorizon ? 'bg-[var(--signal-cobalt)]' : 'bg-[var(--dot-inactive)]'}`} />
                  {con.isAboveHorizon ? (
                    <span>ALT: <strong className="font-dot">{con.altitude.toFixed(1)}°</strong></span>
                  ) : (
                    <span>BELOW HORIZON</span>
                  )}
                </span>

                <span className="text-[10px] font-mono text-[var(--ink-muted)]">
                  AZ: <strong className="font-dot text-[var(--ink-secondary)]">{con.azimuth.toFixed(0)}°</strong>
                </span>
              </div>

              {/* 10-Hour Night Visibility Dot Matrix Row */}
              <div className="mt-2 p-1.5 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[6px] flex items-center justify-between text-[9px] text-[var(--ink-muted)]">
                <span>NIGHT VISIBILITY (18-04h):</span>
                <div className="flex items-center gap-[3px]">
                  {con.nightVisibilityDots.map((isVisible, dIdx) => (
                    <span
                      key={dIdx}
                      title={`${NIGHT_HOURS[dIdx]}:00 UTC - ${isVisible ? 'Observable' : 'Below Horizon'}`}
                      className={`w-[4.5px] h-[4.5px] rounded-full ${
                        isVisible ? 'bg-[var(--dot-active)]' : 'bg-[var(--dot-inactive)]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Meridian Transit & Optimal Observation Window in Tier 1 Doto Font */}
              <div className="mt-2 p-2.5 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] space-y-1.5 text-[11px] font-mono">
                <div className="flex justify-between items-center">
                  <span className="telemetry-label text-[9px]">MERIDIAN TRANSIT:</span>
                  <span className="font-dot text-[var(--signal-cobalt)] font-bold text-xs">
                    {con.culmination.neverRises ? 'NEVER RISES' : con.transitTimeStr}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="telemetry-label text-[9px]">MAX ALTITUDE:</span>
                  <span className={`font-dot font-semibold text-xs ${con.culmination.maxAltitude > 0 ? 'text-[var(--ink-primary)]' : 'text-[var(--ink-muted)]'}`}>
                    {con.culmination.maxAltitude > 0 ? `${con.culmination.maxAltitude}°` : 'UNOBSERVABLE'}
                  </span>
                </div>
                {!con.culmination.neverRises && (
                  <div className="flex justify-between items-center pt-0.5 border-t border-[var(--bg-tray)]">
                    <span className="telemetry-label text-[9px]">OPTIMAL WINDOW:</span>
                    <span className="font-dot text-[10px] text-[var(--ink-secondary)]">{con.windowStr}</span>
                  </div>
                )}
              </div>

              {/* Stellar Facts */}
              <div className="mt-2 pt-2 border-t border-[var(--card-border-subtle)] space-y-1 text-[10px] font-mono text-[var(--ink-muted)]">
                <div className="flex justify-between">
                  <span className="uppercase">BRIGHTEST STAR:</span>
                  <span className="text-[var(--ink-primary)] font-semibold">{con.brightestStarName}</span>
                </div>
                {con.brightestMag !== null && (
                  <div className="flex justify-between">
                    <span className="uppercase">PEAK MAGNITUDE:</span>
                    <span className="font-dot text-[var(--signal-cobalt)] font-bold">{con.brightestMag.toFixed(2)}m</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="uppercase">CONSTELLATION AREA:</span>
                  <span className="text-[var(--ink-secondary)]">{con.area} SQ DEG</span>
                </div>
              </div>
            </div>

            {/* Action Button: Tactile Hardware Control */}
            <button
              onClick={() => {
                setFocusedConstellationId(con.id);
                setActiveView('sky');
              }}
              className="tactile-button bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] text-[var(--ink-primary)] hover:text-[var(--signal-cobalt)] border border-[var(--bg-tray)] w-full py-1.5 text-center text-[10px] tracking-wider uppercase font-semibold flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              <span>🎯</span>
              <span>FOCUS IN SKY CANVAS ↗</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
