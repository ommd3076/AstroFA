import React from 'react';
import { useAstroStore } from '../stores/useAstroStore';
import { Button } from './ui/space/button';
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from './ui/space/select';

const controlClass =
  'min-w-8 font-mono tabular-nums text-[11px] font-medium';

const SPEED_OPTIONS = [
  { value: '1', label: '1× real time' },
  { value: '60', label: '60×' },
  { value: '600', label: '600×' },
  { value: '3600', label: '3600×' },
  { value: '86400', label: '86400×' },
];

export const TimelineBar: React.FC = () => {
  const observationDate = useAstroStore(state => state.observationDate);
  const setObservationDate = useAstroStore(state => state.setObservationDate);
  const stepTime = useAstroStore(state => state.stepTime);
  const isTimePlaying = useAstroStore(state => state.isTimePlaying);
  const setIsTimePlaying = useAstroStore(state => state.setIsTimePlaying);
  const timeSpeedMultiplier = useAstroStore(state => state.timeSpeedMultiplier);
  const setTimeSpeedMultiplier = useAstroStore(state => state.setTimeSpeedMultiplier);

  const dateTime = observationDate.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <section
      aria-label="Observation timeline"
      className="shrink-0 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/95 px-2.5 py-1.5 sm:px-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="m-0 min-w-0 flex-1 text-[11px] font-mono tabular-nums font-medium text-[var(--ink-primary)] sm:text-xs truncate">
          <span className="font-sans text-[10px] uppercase tracking-wider text-[var(--ink-muted)] mr-1.5">Epoch</span>
          {dateTime}
          <span className="font-sans text-[10px] uppercase tracking-wider text-[var(--ink-muted)] ml-1.5">Local</span>
        </p>
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Change observation time">
          <Button variant="outline" size="xs" className={controlClass} onClick={() => stepTime(-24)} aria-label="Previous day" title="Previous day">
            −1D
          </Button>
          <Button variant="outline" size="xs" className={controlClass} onClick={() => stepTime(-1)} aria-label="Previous hour" title="Previous hour">
            −1H
          </Button>
          <Button
            variant={isTimePlaying ? 'default' : 'outline'}
            size="xs"
            className="min-w-14 font-sans text-[11px] font-semibold tracking-wide"
            onClick={() => setIsTimePlaying(!isTimePlaying)}
            aria-pressed={isTimePlaying}
            aria-label={isTimePlaying ? 'Pause time simulation' : 'Play time simulation'}
          >
            {isTimePlaying ? 'PAUSE' : 'PLAY'}
          </Button>
          <Button variant="outline" size="xs" className={controlClass} onClick={() => stepTime(1)} aria-label="Next hour" title="Next hour">
            +1H
          </Button>
          <Button variant="outline" size="xs" className={controlClass} onClick={() => stepTime(24)} aria-label="Next day" title="Next day">
            +1D
          </Button>
          <Button
            variant="ghost"
            size="xs"
            className="font-sans text-[11px] font-semibold text-[var(--signal-mid)]"
            onClick={() => {
              setObservationDate(new Date());
              setIsTimePlaying(false);
            }}
            aria-label="Set observation time to now"
          >
            Now
          </Button>
          <Select
            value={String(timeSpeedMultiplier)}
            onValueChange={val => {
              if (val) setTimeSpeedMultiplier(Number(val));
            }}
          >
            <SelectTrigger
              id="sky-time-speed"
              size="sm"
              aria-label="Time simulation speed"
              className="w-auto min-w-[100px] h-7 font-mono tabular-nums text-[11px]"
            >
              <SelectValue>
                {val => SPEED_OPTIONS.find(o => o.value === val)?.label ?? `${val}×`}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup align="end">
              {SPEED_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="font-mono tabular-nums text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </div>
    </section>
  );
};
