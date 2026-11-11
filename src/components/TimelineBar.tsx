import React from 'react';
import { useAstroStore } from '../stores/useAstroStore';

export const TimelineBar: React.FC = () => {
  const {
    observationDate,
    setObservationDate,
    stepTime,
    isTimePlaying,
    setIsTimePlaying,
    timeSpeedMultiplier,
    setTimeSpeedMultiplier,
    showConstellationLines,
    setShowConstellationLines,
    showConstellationLabels,
    setShowConstellationLabels,
    showHorizon,
    setShowHorizon,
    showEquatorialGrid,
    setShowEquatorialGrid,
  } = useAstroStore();

  const formattedUTC = observationDate.toUTCString().replace('GMT', 'UTC');
  const formattedLocal = observationDate.toLocaleTimeString();

  return (
    <div className="h-14 bg-[var(--bg-card)] border-t border-[var(--bg-tray)] px-4 flex items-center justify-between text-xs z-20 shrink-0 select-none overflow-x-auto gap-4 font-mono text-[var(--ink-primary)]">
      {/* Date & Time Display in Doto Font */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="font-dot text-sm font-bold text-[var(--ink-primary)] tracking-wider whitespace-nowrap flex items-center gap-2">
          <span className="text-[var(--ink-secondary)]">{formattedUTC.slice(0, 16).toUpperCase()}</span>
          <span className="text-[var(--signal-cobalt)] bg-[var(--bg-pill-active)] px-1.5 py-0.5 rounded-[4px] border border-[var(--signal-surface)]">
            {formattedUTC.slice(17, 25)} UTC
          </span>
        </div>
        <div className="text-[10px] text-[var(--ink-muted)] font-mono uppercase tracking-wider hidden xl:inline">
          [LOCAL: {formattedLocal}]
        </div>
      </div>

      {/* Machined Stepping Console */}
      <div className="flex items-center gap-1 bg-[var(--bg-tray)] border border-[var(--bg-tray)] rounded-[8px] p-1 shadow-none">
        <button
          onClick={() => stepTime(-24)}
          className="px-2.5 py-1 bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-transparent hover:border-[var(--signal-surface)] rounded-[6px] text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          title="Previous Day (-24h)"
        >
          -1D
        </button>
        <button
          onClick={() => stepTime(-1)}
          className="px-2.5 py-1 bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-transparent hover:border-[var(--signal-surface)] rounded-[6px] text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          title="Previous Hour (-1h)"
        >
          -1H
        </button>

        {/* Play / Pause Hardware Button */}
        <button
          onClick={() => setIsTimePlaying(!isTimePlaying)}
          className={`px-3 py-1 rounded-[6px] text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
            isTimePlaying
              ? 'bg-[var(--signal-cobalt)] text-white border border-[var(--signal-mid)]'
              : 'bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-[var(--ink-primary)] border border-[var(--signal-surface)]'
          }`}
          title={isTimePlaying ? 'Pause Time' : 'Simulate Time Flow'}
        >
          <span>{isTimePlaying ? '⏸' : '▶'}</span>
          <span>{isTimePlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <button
          onClick={() => stepTime(1)}
          className="px-2.5 py-1 bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-transparent hover:border-[var(--signal-surface)] rounded-[6px] text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          title="Next Hour (+1h)"
        >
          +1H
        </button>
        <button
          onClick={() => stepTime(24)}
          className="px-2.5 py-1 bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-transparent hover:border-[var(--signal-surface)] rounded-[6px] text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          title="Next Day (+24h)"
        >
          +1D
        </button>

        <button
          onClick={() => {
            setObservationDate(new Date());
            setIsTimePlaying(false);
          }}
          className="px-2.5 py-1 bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-surface)] rounded-[6px] text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          title="Reset to current real-world time"
        >
          NOW
        </button>

        {/* Speed multiplier selector */}
        <select
          value={timeSpeedMultiplier}
          onChange={e => setTimeSpeedMultiplier(Number(e.target.value))}
          className="bg-[var(--bg-card)] border border-[var(--card-border-subtle)] focus:border-[var(--signal-cobalt)] rounded-[6px] px-2 py-1 text-[11px] text-[var(--ink-primary)] font-mono uppercase cursor-pointer focus:outline-none"
          title="Simulation Speed Multiplier"
        >
          <option value={1}>1× (REAL)</option>
          <option value={60}>60× (1M/S)</option>
          <option value={600}>600× (10M/S)</option>
          <option value={3600}>3600× (1H/S)</option>
          <option value={86400}>86400× (1D/S)</option>
        </select>
      </div>

      {/* Sky View Toggles with HUD Reticles */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setShowConstellationLines(!showConstellationLines)}
          className={`hud-reticle px-2.5 py-1 rounded-[6px] border text-[11px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
            showConstellationLines
              ? 'bg-[var(--bg-pill-active)] border-[var(--signal-cobalt)] text-[var(--signal-cobalt)] active'
              : 'bg-[var(--bg-card)] border-[var(--bg-tray)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:border-[var(--signal-surface)]'
          }`}
          title="Toggle Constellation Figures"
        >
          LINES
        </button>
        <button
          onClick={() => setShowConstellationLabels(!showConstellationLabels)}
          className={`hud-reticle px-2.5 py-1 rounded-[6px] border text-[11px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
            showConstellationLabels
              ? 'bg-[var(--bg-pill-active)] border-[var(--signal-cobalt)] text-[var(--signal-cobalt)] active'
              : 'bg-[var(--bg-card)] border-[var(--bg-tray)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:border-[var(--signal-surface)]'
          }`}
          title="Toggle Labels"
        >
          LABELS
        </button>
        <button
          onClick={() => setShowHorizon(!showHorizon)}
          className={`hud-reticle px-2.5 py-1 rounded-[6px] border text-[11px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
            showHorizon
              ? 'bg-[var(--bg-pill-active)] border-[var(--signal-cobalt)] text-[var(--signal-cobalt)] active'
              : 'bg-[var(--bg-card)] border-[var(--bg-tray)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:border-[var(--signal-surface)]'
          }`}
          title="Toggle Horizon Plane"
        >
          HORIZON
        </button>
        <button
          onClick={() => setShowEquatorialGrid(!showEquatorialGrid)}
          className={`hud-reticle px-2.5 py-1 rounded-[6px] border text-[11px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
            showEquatorialGrid
              ? 'bg-[var(--bg-pill-active)] border-[var(--signal-cobalt)] text-[var(--signal-cobalt)] active'
              : 'bg-[var(--bg-card)] border-[var(--bg-tray)] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:border-[var(--signal-surface)]'
          }`}
          title="Toggle Equatorial Grid"
        >
          GRID
        </button>
      </div>
    </div>
  );
};
