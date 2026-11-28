import React, { useEffect, useMemo, useState } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { Alert, AlertDescription } from '../../components/ui/space/alert';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/space/card';

type WeatherHour = {
  time: string;
  temperatureC: number | null;
  cloudCoverPercent: number | null;
  precipitationProbability: number | null;
  precipitationMm: number | null;
  windSpeedKmh: number | null;
  uvIndex: number | null;
};

type ConditionsResponse = {
  date: string;
  coordinates: { latitude: number; longitude: number };
  timeZone: string;
  solar: {
    sunrise: string | null;
    sunset: string | null;
    sunshineDurationSeconds: number | null;
    daylightDurationSeconds: number | null;
  };
  conditions: {
    temperatureC: number | null;
    cloudCoverPercent: number | null;
    precipitationMm: number | null;
    windSpeedKmh: number | null;
    uvIndex: number | null;
  };
  hours: WeatherHour[];
  source: string;
  sourceUrl: string;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; value: ConditionsResponse }
  | { status: 'error'; message: string };

const displayValue = (value: number | null | undefined, digits = 0, suffix = '') =>
  typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(digits)}${suffix}` : '—';

const displayDuration = (seconds: number | null) => {
  if (seconds === null || !Number.isFinite(seconds)) return '—';
  const totalMinutes = Math.round(seconds / 60);
  return `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, '0')}m`;
};

const hourKey = (value: string) => value.slice(0, 13);
const displayHour = (value: string) => (value.length >= 16 ? value.slice(11, 16) : value);

/** Live forecast and daylight context for the currently selected UTC date/location. */
export const ObservingConditions: React.FC = () => {
  const observationDate = useAstroStore(state => state.observationDate);
  const observer = useAstroStore(state => state.observer);
  const isTimePlaying = useAstroStore(state => state.isTimePlaying);
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' });
  const queryDate = observationDate.toISOString().slice(0, 10);
  const selectedHourKey = observationDate.toISOString().slice(0, 13);
  const queryLatitude = Number(observer.latitude.toFixed(2));
  const queryLongitude = Number(observer.longitude.toFixed(2));

  useEffect(() => {
    if (isTimePlaying) return;

    const controller = new AbortController();
    const query = new URLSearchParams({
      date: queryDate,
      lat: queryLatitude.toFixed(2),
      lon: queryLongitude.toFixed(2),
    });
    const timer = window.setTimeout(async () => {
      setLoadState({ status: 'loading' });
      try {
        const response = await fetch(`/api/observing-conditions?${query.toString()}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`Forecast service returned HTTP ${response.status}`);
        const value = (await response.json()) as ConditionsResponse;
        if (value.date !== queryDate || !Array.isArray(value.hours) || !value.solar || !value.coordinates) {
          throw new Error('Forecast service returned an incomplete observing-conditions record');
        }
        setLoadState({ status: 'ready', value });
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadState({ status: 'error', message: error instanceof Error ? error.message : 'Forecast unavailable' });
      }
    }, 650);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [queryDate, queryLatitude, queryLongitude, isTimePlaying]);

  const selectedHour = useMemo(() => {
    if (loadState.status !== 'ready') return null;
    return loadState.value.hours.find(hour => hourKey(hour.time) === selectedHourKey) ?? null;
  }, [loadState, selectedHourKey]);

  return (
    <Card
      render={<section aria-labelledby="observing-conditions-title" />}
      className="atlas-surface rounded-xl p-3.5 text-[var(--ink-primary)] font-sans gap-3"
    >
      <CardHeader className="p-0 items-start gap-2 border-b border-[var(--border-subtle)] pb-2.5">
        <div>
          <CardTitle id="observing-conditions-title" className="text-xs font-semibold text-[var(--ink-primary)] tracking-wide">
            Observing conditions · <span className="font-mono tabular-nums text-[var(--signal-mid)]">{queryDate}</span>
          </CardTitle>
          <CardDescription className="mt-0.5 text-[11px] font-mono tabular-nums text-[var(--ink-muted)]">
            Weather forecast for {queryLatitude.toFixed(2)}°, {queryLongitude.toFixed(2)}° · UTC
          </CardDescription>
        </div>
        <CardAction>
          <span className="rounded-md border border-[var(--signal-surface)] bg-[var(--bg-pill-active)] px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-[var(--signal-mid)]">
            Forecast
          </span>
        </CardAction>
      </CardHeader>

      <CardContent className="p-0 flex flex-col gap-3">
        {isTimePlaying ? (
          <Alert variant="info" className="p-2.5 text-xs" role="status">
            <AlertDescription>
              Playback active. Forecast requests are paused to avoid request churn; pause playback to load the selected date.
            </AlertDescription>
          </Alert>
        ) : loadState.status === 'loading' ? (
          <Alert variant="default" className="p-2.5 text-xs" role="status" aria-live="polite">
            <AlertDescription>
              Loading Open-Meteo forecast for {queryDate}…
            </AlertDescription>
          </Alert>
        ) : loadState.status === 'error' ? (
          <Alert variant="error" className="p-2.5 text-xs" role="alert">
            <AlertDescription>
              Live forecast unavailable: {loadState.message}
            </AlertDescription>
          </Alert>
        ) : loadState.status === 'ready' ? (
          <>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-[var(--border-subtle)] pb-2.5 sm:grid-cols-4 xl:grid-cols-2">
              <div>
                <dt className="text-[10px] text-[var(--ink-muted)]">Sunrise · UTC</dt>
                <dd className="mt-0.5 font-mono tabular-nums text-xs font-semibold text-[var(--ink-primary)]">
                  {loadState.value.solar.sunrise ?? 'No event'}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-[var(--ink-muted)]">Sunset · UTC</dt>
                <dd className="mt-0.5 font-mono tabular-nums text-xs font-semibold text-[var(--ink-primary)]">
                  {loadState.value.solar.sunset ?? 'No event'}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-[var(--ink-muted)]">Daylight</dt>
                <dd className="mt-0.5 font-mono tabular-nums text-xs font-semibold text-[var(--ink-primary)]">
                  {displayDuration(loadState.value.solar.daylightDurationSeconds)}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-[var(--ink-muted)]">Sunshine</dt>
                <dd className="mt-0.5 font-mono tabular-nums text-xs font-semibold text-[var(--ink-primary)]">
                  {displayDuration(loadState.value.solar.sunshineDurationSeconds)}
                </dd>
              </div>
            </dl>

            <div className="atlas-surface-subtle rounded-lg p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold text-[var(--ink-primary)]">
                  Hourly cloud cover
                </h3>
                <span className="font-mono tabular-nums text-[10px] text-[var(--ink-muted)]">
                  Hour: {selectedHour ? displayHour(selectedHour.time) : `${observationDate.toISOString().slice(11, 16)} UTC`}
                </span>
              </div>
              {loadState.value.hours.length === 0 ? (
                <p className="mt-2 text-[11px] text-[var(--ink-secondary)]">No hourly forecast points were returned for this date.</p>
              ) : (
                <div className="mt-2 flex gap-1 overflow-x-auto pb-1" role="list" aria-label={`Hourly cloud cover forecast for ${loadState.value.date} UTC`}>
                  {loadState.value.hours.map(hour => {
                    const isSelected = hourKey(hour.time) === selectedHourKey;
                    const cloud = hour.cloudCoverPercent;
                    return (
                      <div
                        key={hour.time}
                        role="listitem"
                        aria-label={`${displayHour(hour.time)} UTC, cloud cover ${displayValue(cloud, 0, '%')}${isSelected ? ', selected observation hour' : ''}`}
                        className={`min-w-[52px] rounded-md border p-1.5 text-center transition-colors ${
                          isSelected
                            ? 'border-[var(--signal-mid)] bg-[var(--bg-pill-active)]'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-card)]'
                        }`}
                      >
                        <div className="font-mono text-[9px] font-medium text-[var(--ink-secondary)]">{displayHour(hour.time)}</div>
                        <div className="mx-auto mt-1 h-1.5 w-full overflow-hidden rounded bg-[var(--dot-inactive)]" aria-hidden="true">
                          {typeof cloud === 'number' && (
                            <div className="h-full bg-[var(--signal-mid)]" style={{ width: `${Math.max(0, Math.min(100, cloud))}%` }} />
                          )}
                        </div>
                        <div className="mt-1 font-mono tabular-nums text-[10px] font-semibold text-[var(--ink-primary)]">
                          {displayValue(cloud, 0, '%')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono tabular-nums text-[10px] text-[var(--ink-secondary)] sm:grid-cols-3">
              <div><dt className="inline text-[var(--ink-muted)]">TEMP </dt><dd className="inline font-semibold text-[var(--ink-primary)]">{displayValue(selectedHour?.temperatureC, 1, '°C')}</dd></div>
              <div><dt className="inline text-[var(--ink-muted)]">CLOUD </dt><dd className="inline font-semibold text-[var(--ink-primary)]">{displayValue(selectedHour?.cloudCoverPercent, 0, '%')}</dd></div>
              <div><dt className="inline text-[var(--ink-muted)]">PRECIP </dt><dd className="inline font-semibold text-[var(--ink-primary)]">{displayValue(selectedHour?.precipitationProbability, 0, '%')}</dd></div>
              <div><dt className="inline text-[var(--ink-muted)]">WIND </dt><dd className="inline font-semibold text-[var(--ink-primary)]">{displayValue(selectedHour?.windSpeedKmh, 0, ' km/h')}</dd></div>
              <div><dt className="inline text-[var(--ink-muted)]">UV </dt><dd className="inline font-semibold text-[var(--ink-primary)]">{displayValue(selectedHour?.uvIndex, 1)}</dd></div>
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-1 border-t border-[var(--border-subtle)] pt-2 text-[10px] text-[var(--ink-secondary)]">
              <span>
                Forecast date: <time dateTime={loadState.value.date}>{loadState.value.date} UTC</time> · Lookup point:{' '}
                <span className="font-mono tabular-nums">
                  {loadState.value.coordinates.latitude.toFixed(2)}°, {loadState.value.coordinates.longitude.toFixed(2)}°
                </span>
              </span>
              <span className="inline-flex flex-wrap gap-x-2">
                <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="font-semibold text-[var(--signal-mid)] underline underline-offset-2">
                  Weather data by Open-Meteo.com ↗
                </a>
                <a href={loadState.value.sourceUrl} target="_blank" rel="noreferrer" className="text-[var(--signal-mid)] underline underline-offset-2">
                  Source details ↗
                </a>
                <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="text-[var(--signal-mid)] underline underline-offset-2">
                  CC BY 4.0 license ↗
                </a>
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-[var(--ink-muted)]">
              Forecast data is model output, not a live weather-station observation. Subset of Open-Meteo fields reformatted by Costellar for this display (CC BY 4.0). The selected date and coordinates rounded to 0.01° are sent to Costellar for lookup. Sunrise and sunset are UTC.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
};
