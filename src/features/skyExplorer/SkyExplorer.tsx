import React, { useMemo, useState } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATIONS } from '../../data/astroData';
import { getHorizontalCoordinates } from '../../astronomy/coordinates';
import { formatObserverCoordinates } from '../../utils/format';
import { SkyCanvas } from '../../sky/SkyCanvas';
import { StarInspector } from '../../components/StarInspector';
import { TraceHud } from '../traceMode/TraceHud';
import { TimelineBar } from '../../components/TimelineBar';
import { PRESET_OBSERVERS } from '../../astronomy/coordinates';
import type { ObserverLocation } from '../../types/astronomy';
import * as Astronomy from 'astronomy-engine';

interface SkyExplorerProps {
  onOpenObserverModal?: () => void;
}

/**
 * Calculates Moon illumination fraction and phase name
 */
function getMoonData(date: Date) {
  try {
    const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
    const phaseDeg = Astronomy.MoonPhase(date);

    let phaseName = 'WAXING GIBBOUS';
    if (phaseDeg < 22.5 || phaseDeg >= 337.5) phaseName = 'NEW MOON';
    else if (phaseDeg < 67.5) phaseName = 'WAXING CRESCENT';
    else if (phaseDeg < 112.5) phaseName = 'FIRST QUARTER';
    else if (phaseDeg < 157.5) phaseName = 'WAXING GIBBOUS';
    else if (phaseDeg < 202.5) phaseName = 'FULL MOON';
    else if (phaseDeg < 247.5) phaseName = 'WANING GIBBOUS';
    else if (phaseDeg < 292.5) phaseName = 'THIRD QUARTER';
    else phaseName = 'WANING CRESCENT';

    return {
      fraction: illum.phase_fraction,
      percentStr: (illum.phase_fraction * 100).toFixed(1) + '%',
      phaseName,
      phaseDeg,
    };
  } catch {
    return {
      fraction: 0.784,
      percentStr: '78.4%',
      phaseName: 'WAXING GIBBOUS',
      phaseDeg: 135,
    };
  }
}

/**
 * Mini SVG Moon Disk Component depicting illumination phase
 */
const MoonDiskSvg: React.FC<{ phaseDeg: number; fraction: number }> = ({ phaseDeg, fraction }) => {
  const isWaxing = phaseDeg <= 180;
  // Sweep flag determines crescent vs gibbous arc
  const sweep = isWaxing ? 1 : 0;
  const r = 16;
  const cx = 18;
  const cy = 18;
  // Ellipse x-radius based on fraction
  const rx = Math.max(0.5, Math.abs(2 * fraction - 1) * r);
  const largeArc = fraction > 0.5 ? 1 : 0;

  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0 drop-shadow-xs">
      <defs>
        <radialGradient id="moon-surface" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </radialGradient>
      </defs>
      {/* Dark lunar disc */}
      <circle cx={cx} cy={cy} r={r} fill="#1E293B" stroke="#334155" strokeWidth="1" />
      {/* Illuminated portion */}
      {fraction >= 0.98 ? (
        <circle cx={cx} cy={cy} r={r} fill="url(#moon-surface)" />
      ) : fraction <= 0.02 ? null : (
        <path
          d={`M ${cx} ${cy - r}
             A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r}
             A ${rx} ${r} 0 0 ${largeArc ? (1 - sweep) : sweep} ${cx} ${cy - r}`}
          fill="url(#moon-surface)"
        />
      )}
    </svg>
  );
};

export const SkyExplorer: React.FC<SkyExplorerProps> = () => {
  const {
    observer,
    setObserver,
    observationDate,
    showConstellationLines,
    setShowConstellationLines,
    showConstellationLabels,
    setShowConstellationLabels,
    showEquatorialGrid,
    setShowEquatorialGrid,
    showHorizon,
    setShowHorizon,
    isTraceMode,
    setActiveView,
  } = useAstroStore();

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showMobileInspector, setShowMobileInspector] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Live Visible Constellations (Alt > 0°)
  const visibleConstellationsCount = useMemo(() => {
    return CONSTELLATIONS.filter(con => {
      const hor = getHorizontalCoordinates(con.raCenter, con.decCenter, observer, observationDate);
      return hor.altitude > 0;
    }).length;
  }, [observer, observationDate]);

  // Moon telemetry
  const moonData = useMemo(() => getMoonData(observationDate), [observationDate]);

  // Formatted date and time
  const timeStr = useMemo(() => {
    return observationDate.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [observationDate]);

  const dateStr = useMemo(() => {
    return observationDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).toUpperCase();
  }, [observationDate]);

  const weekdayStr = useMemo(() => {
    return observationDate.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
  }, [observationDate]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(200, prev + 20));
    window.dispatchEvent(new CustomEvent('sky-zoom', { detail: { delta: -10 } }));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(50, prev - 20));
    window.dispatchEvent(new CustomEvent('sky-zoom', { detail: { delta: 10 } }));
  };

  if (isTraceMode) {
    return (
      <div className="w-full h-full relative select-none rounded-[12px] overflow-hidden bento-card p-0 border border-white/60 bg-[var(--bg-viewport)]">
        <SkyCanvas />
        <TraceHud />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-2 min-h-0 select-none">
      {/* =========================================================================
          ROW 1: Top Telemetry 4-Card Band (Matching Frame 2)
          ========================================================================= */}
      <div className="grid min-w-0 grid-cols-2 xl:grid-cols-4 gap-2 shrink-0">
        {/* Card 1: Current Location */}
        <button
          type="button"
          onClick={() => setShowLocationPicker(true)}
          className="bento-card min-w-0 p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer hover:border-[var(--signal-mid)] transition-colors text-left group relative min-h-[76px]"
          title="Change Observer Location"
        >
          <div className="flex items-center justify-between">
            <span className="telemetry-label text-[10px]">CURRENT LOCATION</span>
            <span className="text-[var(--ink-muted)] group-hover:text-[var(--signal-cobalt)] transition-colors text-xs font-mono">
              ◎
            </span>
          </div>
          <div className="my-1.5 flex items-baseline">
            <span className="font-mono tabular-nums text-base lg:text-lg font-bold text-[var(--ink-primary)] tracking-wide truncate">
              {formatObserverCoordinates(observer.latitude, observer.longitude, 2)}
            </span>
          </div>
          <div className="micro-label text-[9px] text-[var(--ink-muted)] truncate uppercase">
            {observer.name.split(',')[0]}
          </div>
        </button>

        {/* Card 2: Visible Constellations */}
        <button
          type="button"
          onClick={() => setActiveView('tonight')}
          className="bento-card min-w-0 p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer hover:border-[var(--signal-mid)] transition-colors text-left group relative min-h-[76px]"
          title="Open Sky Tonight Visibility Matrix"
        >
          <div className="flex items-center justify-between">
            <span className="telemetry-label text-[10px]">VISIBLE CONSTELLATIONS</span>
            <span className="text-[var(--ink-muted)] group-hover:text-[var(--signal-cobalt)] transition-colors text-xs font-mono">
              ↗
            </span>
          </div>
          <div className="my-1.5 flex items-baseline">
            <span className="font-mono tabular-nums text-2xl font-bold text-[var(--ink-primary)]">
              {visibleConstellationsCount}
            </span>
            <span className="text-xs font-mono text-[var(--ink-muted)] ml-1.5">
              / {CONSTELLATIONS.length}
            </span>
          </div>
          <div className="micro-label text-[9px] text-[var(--ink-muted)] uppercase">
            ABOVE HORIZON (ALT &gt; 0°)
          </div>
        </button>

        {/* Card 3: Moon Phase */}
        <div className="bento-card min-w-0 p-2.5 sm:p-3 flex flex-col justify-between relative min-h-[76px]">
          <div className="flex items-center justify-between">
            <span className="telemetry-label text-[10px]">MOON PHASE</span>
            <span className="text-[9px] text-[var(--ink-muted)] font-mono uppercase">
              {moonData.percentStr}
            </span>
          </div>
          <div className="my-1 flex items-center justify-between gap-2">
            <div>
              <div className="font-dot text-sm font-bold text-[var(--ink-primary)] tracking-wide">
                {moonData.phaseName}
              </div>
              <div className="micro-label text-[9px] text-[var(--ink-muted)] uppercase mt-0.5">
                ILLUM. {moonData.percentStr}
              </div>
            </div>
            <MoonDiskSvg phaseDeg={moonData.phaseDeg} fraction={moonData.fraction} />
          </div>
          <div className="micro-label text-[9px] text-[var(--signal-cobalt)] font-semibold uppercase">
            LUNAR CYCLE // DAY {Math.round((moonData.phaseDeg / 360) * 29.53)}
          </div>
        </div>

        {/* Card 4: Local Time */}
        <div className="bento-card min-w-0 p-2.5 sm:p-3 flex flex-col justify-between relative min-h-[76px]">
          <div className="flex items-center justify-between">
            <span className="telemetry-label text-[10px]">TIME (LOCAL)</span>
            <span className="text-[9px] text-[var(--signal-cobalt)] font-semibold font-mono">
              {weekdayStr}
            </span>
          </div>
          <div className="my-1.5 flex items-baseline justify-between">
            <span className="font-mono tabular-nums text-2xl font-bold text-[var(--ink-primary)] tracking-wider">
              {timeStr}
            </span>
            <span className="text-[10px] font-mono font-semibold text-[var(--ink-secondary)]">
              {dateStr}
            </span>
          </div>
          <div className="micro-label text-[9px] text-[var(--ink-muted)] uppercase">
            LOCAL OBSERVATION TIMELINE
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: Control Toolbar (Matching Frame 2)
          ========================================================================= */}
      <div className="bento-card px-3 py-2 sm:px-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 shrink-0 border border-[#E2E5EC]">
        <div className="flex min-w-0 items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-[var(--ink-muted)]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--signal-cobalt)]" aria-hidden="true" />
          <span>Sky display</span>
          <span className="hidden sm:inline text-[#C0C6D1]">/</span>
          <span className="hidden sm:inline">Layers &amp; zoom</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom controls */}
          <div className="flex h-9 items-center gap-1 px-2 bg-[var(--bg-shell)] border border-[#D0D5DD] rounded-[8px] text-xs font-mono">
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-tray)] text-[var(--ink-primary)] font-bold transition-colors"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="px-1 font-bold text-[10px] text-[var(--ink-secondary)]">{zoomLevel}%</span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-tray)] text-[var(--ink-primary)] font-bold transition-colors"
              title="Zoom In"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>

          {/* Layer toggles: CONST, DEEP, GRID */}
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Sky display layers">
            <button
              type="button"
              onClick={() => setShowConstellationLines(!showConstellationLines)}
              className={`tactile-pill min-h-9 text-[10px] font-mono font-bold px-3 py-2 ${
                showConstellationLines ? 'active' : ''
              }`}
              title="Toggle Constellation Lines"
              aria-pressed={showConstellationLines}
              aria-label="Show constellation lines"
            >
              CONST
            </button>
            <button
              type="button"
              onClick={() => setShowConstellationLabels(!showConstellationLabels)}
              className={`tactile-pill min-h-9 text-[10px] font-mono font-bold px-3 py-2 ${
                showConstellationLabels ? 'active' : ''
              }`}
              title="Toggle Labels & Deep Sky Indicators"
              aria-pressed={showConstellationLabels}
              aria-label="Show sky labels"
            >
              DEEP
            </button>
            <button
              type="button"
              onClick={() => setShowEquatorialGrid(!showEquatorialGrid)}
              className={`tactile-pill min-h-9 text-[10px] font-mono font-bold px-3 py-2 ${
                showEquatorialGrid ? 'active' : ''
              }`}
              title="Toggle Equatorial Coordinate Grid"
              aria-pressed={showEquatorialGrid}
              aria-label="Show equatorial grid"
            >
              GRID
            </button>
            <button
              type="button"
              onClick={() => setShowHorizon(!showHorizon)}
              className={`tactile-pill min-h-9 text-[10px] font-mono font-bold px-3 py-2 ${showHorizon ? 'active' : ''}`}
              title="Toggle horizon and azimuth markers"
              aria-pressed={showHorizon}
              aria-label="Show horizon and azimuth markers"
            >
              HORIZON
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="h-9 w-9 bg-[var(--bg-shell)] border border-[#D0D5DD] hover:border-[var(--signal-mid)] rounded-[8px] text-[var(--ink-muted)] hover:text-[var(--signal-cobalt)] transition-colors cursor-pointer text-sm"
            title="Toggle Fullscreen"
            aria-label="Toggle fullscreen"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: Main Viewport Row (Matching Frame 2 Bounds)
          - Left: Sky Canvas Viewport with TimelineBar (~920px in reference)
          - Right: Star Inspector (~358px in reference) when not in trace mode
          ========================================================================= */}
      <div className="flex-1 relative flex gap-2 min-h-[220px] overflow-hidden">
        {/* Sky Viewport Area */}
        <div className="flex-1 relative flex flex-col rounded-[12px] overflow-hidden bento-card p-0 border border-white/60 bg-[var(--bg-viewport)] min-h-0">
          <div className="relative flex-1 min-h-0"><SkyCanvas /></div>
          <TimelineBar />
        </div>

        {/* Selected-Object Inspector (Visible in Sky Explorer mode matching Frame 2) */}
        <aside className="w-[min(32vw,358px)] min-w-[300px] shrink-0 h-full overflow-hidden hidden md:block">
          <StarInspector />
        </aside>
        <button
          type="button"
          onClick={() => setShowMobileInspector(value => !value)}
          aria-expanded={showMobileInspector}
          aria-controls="sky-inspector-mobile"
          className={`md:hidden min-h-10 rounded-lg border border-[#D0D5DD] bg-[var(--bg-card)] px-3 py-2 text-[11px] font-mono font-semibold text-[var(--ink-primary)] shadow-sm ${showMobileInspector ? 'fixed right-3 top-3 z-50' : 'absolute right-3 top-3 z-20'}`}
        >
          {showMobileInspector ? 'CLOSE DETAILS' : 'INSPECT OBJECT'}
        </button>
        {showMobileInspector && (
          <aside id="sky-inspector-mobile" aria-label="Selected object details" className="md:hidden fixed inset-x-3 top-16 bottom-40 z-40 rounded-xl shadow-lg overflow-hidden">
            <StarInspector />
          </aside>
        )}
      </div>

      {/* Observer Location Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="observer-picker-title" className="bg-white border border-[#D0D5DD] rounded-[16px] max-w-md w-full p-5 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E5EC] pb-2">
              <span id="observer-picker-title" className="font-bold text-sm uppercase">SELECT OBSERVATION SITE</span>
              <button
                type="button"
                onClick={() => setShowLocationPicker(false)}
                aria-label="Close observation site picker"
                className="min-h-10 min-w-10 text-base text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {PRESET_OBSERVERS.map((preset: ObserverLocation) => {
                const isSelected = preset.name === observer.name;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setObserver(preset);
                      setShowLocationPicker(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-[8px] border transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'border-[var(--signal-cobalt)] bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] font-bold'
                        : 'border-[#E2E5EC] hover:bg-[var(--bg-shell)] text-[var(--ink-primary)]'
                    }`}
                  >
                    <div>
                      <div className="font-bold uppercase">{preset.name}</div>
                      <div className="text-[10px] text-[var(--ink-muted)]">
                        {formatObserverCoordinates(preset.latitude, preset.longitude, 2)}
                      </div>
                    </div>
                    {isSelected && <span className="text-[var(--signal-cobalt)] font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
