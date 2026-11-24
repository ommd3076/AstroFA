import React from 'react';
import { useAstroStore } from '../stores/useAstroStore';

const controlClass = 'min-h-10 min-w-8 rounded-md border border-[#D8DCE5] bg-[var(--bg-card)] px-1.5 py-2 text-[11px] font-mono font-semibold text-[var(--ink-primary)] hover:border-[var(--signal-cobalt)] hover:text-[var(--signal-cobalt)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--signal-cobalt)]';

export const TimelineBar: React.FC = () => {
  const {
    observationDate,
    setObservationDate,
    stepTime,
    isTimePlaying,
    setIsTimePlaying,
    timeSpeedMultiplier,
    setTimeSpeedMultiplier,
  } = useAstroStore();

  const dateTime = observationDate.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });

  return (
    <section aria-label="Observation timeline" className="shrink-0 border-t border-[#D0D5DD] bg-[var(--bg-card)] px-2 py-2 sm:px-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="m-0 min-w-0 flex-1 text-[11px] font-mono font-semibold text-[var(--ink-primary)] sm:text-xs">
          <span className="text-[var(--ink-muted)]">OBSERVING </span>{dateTime} <span className="text-[var(--ink-muted)]">LOCAL</span>
        </p>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Change observation time">
          <button type="button" className={controlClass} onClick={() => stepTime(-24)} aria-label="Previous day" title="Previous day">−1D</button>
          <button type="button" className={controlClass} onClick={() => stepTime(-1)} aria-label="Previous hour" title="Previous hour">−1H</button>
          <button
            type="button"
            className={`${controlClass} ${isTimePlaying ? 'border-[var(--signal-cobalt)] bg-[var(--signal-cobalt)] text-white' : ''}`}
            onClick={() => setIsTimePlaying(!isTimePlaying)}
            aria-pressed={isTimePlaying}
            aria-label={isTimePlaying ? 'Pause time simulation' : 'Play time simulation'}
          >
            {isTimePlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button type="button" className={controlClass} onClick={() => stepTime(1)} aria-label="Next hour" title="Next hour">+1H</button>
          <button type="button" className={controlClass} onClick={() => stepTime(24)} aria-label="Next day" title="Next day">+1D</button>
          <button
            type="button"
            className={`${controlClass} text-[var(--signal-cobalt)]`}
            onClick={() => { setObservationDate(new Date()); setIsTimePlaying(false); }}
            aria-label="Set observation time to now"
          >NOW</button>
          <label className="sr-only" htmlFor="sky-time-speed">Time simulation speed</label>
          <select
            id="sky-time-speed"
            value={timeSpeedMultiplier}
            onChange={event => setTimeSpeedMultiplier(Number(event.target.value))}
            className="min-h-10 rounded-md border border-[#D8DCE5] bg-[var(--bg-card)] px-2 text-[11px] font-mono text-[var(--ink-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--signal-cobalt)]"
          >
            <option value={1}>1× real time</option>
            <option value={60}>60×</option>
            <option value={600}>600×</option>
            <option value={3600}>3600×</option>
            <option value={86400}>86400×</option>
          </select>
        </div>
      </div>
    </section>
  );
};
