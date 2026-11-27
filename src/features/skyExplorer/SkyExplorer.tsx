import React, { useMemo, useRef, useState } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { CONSTELLATIONS } from '../../data/astroData';
import { getHorizontalCoordinates, PRESET_OBSERVERS } from '../../astronomy/coordinates';
import { formatObserverCoordinates } from '../../utils/format';
import { SkyCanvas } from '../../sky/SkyCanvas';
import { StarInspector } from '../../components/StarInspector';
import { TraceHud } from '../traceMode/TraceHud';
import { TimelineBar } from '../../components/TimelineBar';
import { Button } from '../../components/ui/space/button';
import {
  Dialog,
  DialogClose,
  DialogCreateHandle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/space/dialog';
import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator } from '../../components/ui/space/toolbar';
import { handlePopupTabKeyDown } from '../../utils/dialogFocus';
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

    let phaseName = 'Waxing Gibbous';
    if (phaseDeg < 22.5 || phaseDeg >= 337.5) phaseName = 'New Moon';
    else if (phaseDeg < 67.5) phaseName = 'Waxing Crescent';
    else if (phaseDeg < 112.5) phaseName = 'First Quarter';
    else if (phaseDeg < 157.5) phaseName = 'Waxing Gibbous';
    else if (phaseDeg < 202.5) phaseName = 'Full Moon';
    else if (phaseDeg < 247.5) phaseName = 'Waning Gibbous';
    else if (phaseDeg < 292.5) phaseName = 'Third Quarter';
    else phaseName = 'Waning Crescent';

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
      phaseName: 'Waxing Gibbous',
      phaseDeg: 135,
    };
  }
}

/**
 * Compact Moon Phase Disk SVG depicting illumination phase
 */
const MoonDiskSvg: React.FC<{ phaseDeg: number; fraction: number }> = ({ phaseDeg, fraction }) => {
  const isWaxing = phaseDeg <= 180;
  const sweep = isWaxing ? 1 : 0;
  const r = 8;
  const cx = 10;
  const cy = 10;
  const rx = Math.max(0.4, Math.abs(2 * fraction - 1) * r);
  const largeArc = fraction > 0.5 ? 1 : 0;

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className="shrink-0" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="#1E1E24" stroke="#3A3A44" strokeWidth="1" />
      {fraction >= 0.98 ? (
        <circle cx={cx} cy={cy} r={r} fill="#F3F1EB" />
      ) : fraction <= 0.02 ? null : (
        <path
          d={`M ${cx} ${cy - r}
             A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r}
             A ${rx} ${r} 0 0 ${largeArc ? (1 - sweep) : sweep} ${cx} ${cy - r}`}
          fill="#E5E3DC"
        />
      )}
    </svg>
  );
};

interface SkyTelemetryStripProps {
  siteDialogHandle: ReturnType<typeof DialogCreateHandle>;
  locationTriggerRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Isolated compact telemetry readout so 100ms time playback ticks do not rerender the SkyExplorer shell/toolbar.
 */
const SkyTelemetryStrip: React.FC<SkyTelemetryStripProps> = React.memo(({
  siteDialogHandle,
  locationTriggerRef,
}) => {
  const observer = useAstroStore(state => state.observer);
  const observationDate = useAstroStore(state => state.observationDate);
  const setActiveView = useAstroStore(state => state.setActiveView);

  const visibleConstellationsCount = useMemo(() => {
    return CONSTELLATIONS.filter(con => {
      const hor = getHorizontalCoordinates(con.raCenter, con.decCenter, observer, observationDate);
      return hor.altitude > 0;
    }).length;
  }, [observer, observationDate]);

  const moonData = useMemo(() => getMoonData(observationDate), [observationDate]);

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
    });
  }, [observationDate]);

  return (
    <div className="flex flex-wrap items-center gap-1.5 min-w-0 text-[11px]">
      <DialogTrigger
        handle={siteDialogHandle}
        render={
          <Button
            ref={locationTriggerRef}
            variant="ghost"
            size="xs"
            title="Change Observer Location"
            className="h-7 gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] px-2 font-normal hover:border-[var(--signal-surface)]"
          />
        }
      >
        <span className="font-mono text-[var(--signal-mid)]" aria-hidden="true">⌖</span>
        <span className="font-medium text-[var(--ink-primary)] truncate max-w-[110px]">
          {observer.name.split(',')[0]}
        </span>
        <span className="hidden lg:inline font-mono tabular-nums text-[10px] text-[var(--ink-muted)]">
          {formatObserverCoordinates(observer.latitude, observer.longitude, 1)}
        </span>
      </DialogTrigger>

      <Button
        variant="ghost"
        size="xs"
        onClick={() => setActiveView('tonight')}
        title="Open Sky Tonight Visibility Planner"
        className="h-7 gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] px-2 font-mono tabular-nums text-[var(--ink-secondary)] hover:border-[var(--signal-surface)] hover:text-[var(--ink-primary)]"
      >
        <strong className="text-[var(--ink-primary)]">{visibleConstellationsCount}</strong>
        <span className="text-[var(--ink-muted)]">/ {CONSTELLATIONS.length} up</span>
      </Button>

      <div
        className="hidden sm:inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] px-2 text-[var(--ink-secondary)]"
        title={`Moon: ${moonData.phaseName} (${moonData.percentStr})`}
      >
        <MoonDiskSvg phaseDeg={moonData.phaseDeg} fraction={moonData.fraction} />
        <span className="font-mono tabular-nums text-[10px] text-[var(--signal-mid)]">{moonData.percentStr}</span>
        <span className="hidden xl:inline text-[11px] text-[var(--ink-muted)]">{moonData.phaseName}</span>
      </div>

      <div className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] px-2 font-mono tabular-nums text-[11px]">
        <span className="font-semibold text-[var(--ink-primary)]">{timeStr}</span>
        <span className="text-[10px] text-[var(--ink-muted)]">{dateStr}</span>
      </div>
    </div>
  );
});

export const SkyExplorer: React.FC<SkyExplorerProps> = () => {
  const observer = useAstroStore(state => state.observer);
  const setObserver = useAstroStore(state => state.setObserver);
  const showConstellationLines = useAstroStore(state => state.showConstellationLines);
  const setShowConstellationLines = useAstroStore(state => state.setShowConstellationLines);
  const showConstellationLabels = useAstroStore(state => state.showConstellationLabels);
  const setShowConstellationLabels = useAstroStore(state => state.setShowConstellationLabels);
  const showEquatorialGrid = useAstroStore(state => state.showEquatorialGrid);
  const setShowEquatorialGrid = useAstroStore(state => state.setShowEquatorialGrid);
  const showHorizon = useAstroStore(state => state.showHorizon);
  const setShowHorizon = useAstroStore(state => state.setShowHorizon);
  const isTraceMode = useAstroStore(state => state.isTraceMode);
  const setIsTraceMode = useAstroStore(state => state.setIsTraceMode);

  const siteDialogHandle = useMemo(() => DialogCreateHandle(), []);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showMobileInspector, setShowMobileInspector] = useState(false);
  const [showDeepSky, setShowDeepSky] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);
  const locationTriggerRef = useRef<HTMLButtonElement>(null);

  const closeLocationPicker = () => {
    setShowLocationPicker(false);
  };

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
      <div className="atlas-stage w-full h-full min-h-0 relative select-none">
        <SkyCanvas showDeepSky={showDeepSky} />
        <TraceHud />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-1.5 min-h-0 select-none">
      {/* Unified Compact Stage Header + Layer & Zoom Dock (leaves maximum height for SkyCanvas) */}
      <Toolbar
        aria-label="Sky display controls and ephemeris"
        onKeyDown={e => e.stopPropagation()}
        className="px-2.5 py-1.5 flex-wrap items-center justify-between gap-2 shrink-0 bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[10px]"
      >
        <SkyTelemetryStrip
          siteDialogHandle={siteDialogHandle}
          locationTriggerRef={locationTriggerRef}
        />

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Zoom controls */}
          <ToolbarGroup
            aria-label="Zoom controls"
            className="h-7 px-1 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-md text-xs font-mono tabular-nums"
          >
            <ToolbarButton
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-[var(--ink-primary)] font-bold"
                  title="Zoom Out"
                  aria-label="Zoom out"
                />
              }
              onClick={handleZoomOut}
            >
              −
            </ToolbarButton>
            <span className="px-1 font-medium text-[11px] text-[var(--ink-secondary)]">{zoomLevel}%</span>
            <ToolbarButton
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-[var(--ink-primary)] font-bold"
                  title="Zoom In"
                  aria-label="Zoom in"
                />
              }
              onClick={handleZoomIn}
            >
              +
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarSeparator orientation="vertical" className="hidden sm:block h-4" />

          {/* Layer toggles: CONST, LABELS, DEEP, GRID, HORIZON */}
          <ToolbarGroup aria-label="Sky display layers" className="flex-wrap gap-1">
            <ToolbarButton
              render={
                <Button
                  variant={showConstellationLines ? 'default' : 'outline'}
                  size="xs"
                  className="h-7 text-[10px] font-mono tracking-[0.04em]"
                  title="Toggle Constellation Lines"
                  aria-pressed={showConstellationLines}
                  aria-label="Show constellation lines"
                />
              }
              onClick={() => setShowConstellationLines(!showConstellationLines)}
            >
              CONST
            </ToolbarButton>
            <ToolbarButton
              render={
                <Button
                  variant={showConstellationLabels ? 'default' : 'outline'}
                  size="xs"
                  className="h-7 text-[10px] font-mono tracking-[0.04em]"
                  title="Toggle Constellation Labels"
                  aria-pressed={showConstellationLabels}
                  aria-label="Show constellation labels"
                />
              }
              onClick={() => setShowConstellationLabels(!showConstellationLabels)}
            >
              LABELS
            </ToolbarButton>
            <ToolbarButton
              render={
                <Button
                  variant={showDeepSky ? 'default' : 'outline'}
                  size="xs"
                  className="h-7 text-[10px] font-mono tracking-[0.04em]"
                  title="Toggle NASA Milky Way Deep-Sky Backdrop"
                  aria-pressed={showDeepSky}
                  aria-label="Show Milky Way deep-sky backdrop"
                />
              }
              onClick={() => setShowDeepSky(value => !value)}
            >
              DEEP
            </ToolbarButton>
            <ToolbarButton
              render={
                <Button
                  variant={showEquatorialGrid ? 'default' : 'outline'}
                  size="xs"
                  className="h-7 text-[10px] font-mono tracking-[0.04em]"
                  title="Toggle Equatorial Coordinate Grid"
                  aria-pressed={showEquatorialGrid}
                  aria-label="Show equatorial grid"
                />
              }
              onClick={() => setShowEquatorialGrid(!showEquatorialGrid)}
            >
              GRID
            </ToolbarButton>
            <ToolbarButton
              render={
                <Button
                  variant={showHorizon ? 'default' : 'outline'}
                  size="xs"
                  className="h-7 text-[10px] font-mono tracking-[0.04em]"
                  title="Toggle horizon and azimuth markers"
                  aria-pressed={showHorizon}
                  aria-label="Show horizon and azimuth markers"
                />
              }
              onClick={() => setShowHorizon(!showHorizon)}
            >
              HORIZON
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarSeparator orientation="vertical" className="hidden sm:block h-4" />

          <ToolbarButton
            render={
              <Button
                variant="secondary"
                size="xs"
                className="h-7 text-[11px] font-semibold text-[var(--signal-mid)]"
                title="Switch to Trace Mode"
              />
            }
            onClick={() => setIsTraceMode(true)}
          >
            Trace ↗
          </ToolbarButton>

          <ToolbarButton
            render={
              <Button
                variant="outline"
                size="icon-xs"
                className="h-7 w-7 text-[var(--ink-secondary)] hover:text-[var(--signal-mid)]"
                title="Toggle Fullscreen"
                aria-label="Toggle fullscreen"
              />
            }
            onClick={toggleFullscreen}
          >
            ⛶
          </ToolbarButton>
        </div>
      </Toolbar>

      {/* Dominant Planetarium Stage + Bounded Contextual Inspector */}
      <div className="flex-1 relative flex gap-2 min-h-[240px] overflow-hidden">
        <div className="atlas-stage flex-1 relative flex flex-col min-h-0">
          <div className="relative flex-1 min-h-0">
            <SkyCanvas showDeepSky={showDeepSky} />
          </div>
          <TimelineBar />
        </div>

        <aside className="w-[min(28vw,320px)] min-w-[268px] shrink-0 h-full overflow-hidden hidden md:block">
          <StarInspector />
        </aside>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowMobileInspector(value => !value)}
          aria-expanded={showMobileInspector}
          aria-controls="sky-inspector-mobile"
          className={`md:hidden min-h-9 rounded-lg border-[var(--border-subtle)] bg-[var(--bg-card)]/95 px-3 py-1.5 text-[11px] font-sans font-semibold text-[var(--ink-primary)] ${
            showMobileInspector ? 'fixed right-3 top-14 z-50' : 'absolute right-3 top-3 z-20'
          }`}
        >
          {showMobileInspector ? 'Close details' : 'Inspect object'}
        </Button>

        {showMobileInspector && (
          <aside
            id="sky-inspector-mobile"
            aria-label="Selected object details"
            className="md:hidden fixed inset-x-3 top-14 bottom-24 z-40 rounded-[10px] overflow-hidden shadow-2xl"
          >
            <StarInspector />
          </aside>
        )}
      </div>

      {/* Observation Site Picker Space UI Dialog */}
      <Dialog
        handle={siteDialogHandle}
        open={showLocationPicker}
        onOpenChange={setShowLocationPicker}
      >
        <DialogPopup
          finalFocus={locationTriggerRef}
          onKeyDown={handlePopupTabKeyDown}
          className="max-w-md border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)] font-sans"
        >
          <DialogHeader className="border-b border-[var(--border-subtle)]">
            <DialogTitle className="text-sm font-semibold">Select observation site</DialogTitle>
            <DialogDescription className="text-xs text-[var(--ink-secondary)]">
              Choose an observatory or city horizon for the sky projection.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel className="space-y-1.5">
            {PRESET_OBSERVERS.map((preset: ObserverLocation) => {
              const isSelected = preset.name === observer.name;
              return (
                <Button
                  key={preset.name}
                  variant={isSelected ? 'secondary' : 'outline'}
                  onClick={() => {
                    setObserver(preset);
                    closeLocationPicker();
                  }}
                  className={`h-auto w-full text-left p-2.5 rounded-[8px] flex items-center justify-between text-xs font-normal ${
                    isSelected
                      ? 'border-[var(--signal-cobalt)] bg-[var(--bg-pill-active)] text-[var(--ink-primary)] font-semibold'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] hover:border-[var(--signal-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{preset.name}</div>
                    <div className="text-[10px] font-mono tabular-nums text-[var(--ink-muted)] mt-0.5">
                      {formatObserverCoordinates(preset.latitude, preset.longitude, 2)}
                    </div>
                  </div>
                  {isSelected && <span className="text-[var(--signal-mid)] font-bold">✓</span>}
                </Button>
              );
            })}
          </DialogPanel>
          <DialogFooter className="border-t border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]">
            <DialogClose render={<Button variant="ghost" size="sm" />}>Close</DialogClose>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
};
