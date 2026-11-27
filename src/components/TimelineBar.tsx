import React from 'react';
import { useAstroStore } from '../stores/useAstroStore';
import { ButtonGroup, ButtonGroupItem } from './ui/board/base/buttons/button-group';
import {
  Select,
  SelectItem,
} from './ui/board/base/select/select';

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
        <ButtonGroup size="small" aria-label="Change observation time" className="max-w-full overflow-x-auto">
          <ButtonGroupItem onClick={() => stepTime(-24)} aria-pressed={false} aria-label="Previous day" title="Previous day">
            −1D
          </ButtonGroupItem>
          <ButtonGroupItem onClick={() => stepTime(-1)} aria-pressed={false} aria-label="Previous hour" title="Previous hour">
            −1H
          </ButtonGroupItem>
          <ButtonGroupItem
            selected={isTimePlaying}
            aria-pressed={isTimePlaying}
            onClick={() => setIsTimePlaying(!isTimePlaying)}
            aria-label={isTimePlaying ? 'Pause time simulation' : 'Play time simulation'}
          >
            {isTimePlaying ? 'PAUSE' : 'PLAY'}
          </ButtonGroupItem>
          <ButtonGroupItem onClick={() => stepTime(1)} aria-pressed={false} aria-label="Next hour" title="Next hour">
            +1H
          </ButtonGroupItem>
          <ButtonGroupItem onClick={() => stepTime(24)} aria-pressed={false} aria-label="Next day" title="Next day">
            +1D
          </ButtonGroupItem>
          <ButtonGroupItem
            onClick={() => {
              setObservationDate(new Date());
              setIsTimePlaying(false);
            }}
            aria-pressed={false}
            aria-label="Set observation time to now"
          >
            Now
          </ButtonGroupItem>
          <Select
            selectedKey={String(timeSpeedMultiplier)}
            onSelectionChange={key => {
              if (key !== null) setTimeSpeedMultiplier(Number(key));
            }}
            aria-label="Time simulation speed"
            size="sm"
            triggerClassName="h-7 min-w-[100px] font-mono tabular-nums text-[11px]"
          >
            {SPEED_OPTIONS.map(opt => (
              <SelectItem key={opt.value} id={opt.value} textValue={opt.label} className="font-mono tabular-nums text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </Select>
        </ButtonGroup>
      </div>
    </section>
  );
};
