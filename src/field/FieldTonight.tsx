import { useMemo, useState } from 'react';
import { ArrowUpRight, Compass } from 'lucide-react';
import { getHorizontalCoordinates, getMeridianCulmination } from '../astronomy/coordinates';
import { Button } from '../components/ui/board/base/buttons/button';
import { SearchField } from '../components/ui/board/base/search-field/search-field';
import { SegmentedControl, SegmentedControlItem } from '../components/ui/board/base/segmented-control/segmented-control';
import { CONSTELLATIONS } from '../data/astroData';
import { ObservingConditions } from '../features/skyTonight/ObservingConditions';
import { useAstroStore } from '../stores/useAstroStore';

const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

export function FieldTonight() {
  const observer = useAstroStore(state => state.observer);
  const date = useAstroStore(state => state.observationDate);
  const setDate = useAstroStore(state => state.setObservationDate);
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('above');
  const targets = useMemo(() => CONSTELLATIONS.map(target => ({
    ...target,
    ...getHorizontalCoordinates(target.raCenter, target.decCenter, observer, date),
    transit: getMeridianCulmination(target.raCenter, target.decCenter, observer, date).transitDate,
  })).sort((a, b) => b.altitude - a.altitude), [observer, date]);
  const visible = targets.filter(target => (scope === 'all' || target.isAboveHorizon) &&
    `${target.name} ${target.id}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <header className="field-page-heading">
        <h1>Tonight’s sky</h1>
        <p>Visibility and transit times for the centers of the IAU constellations.</p>
      </header>
      <div className="field-planner">
        <section className="field-planner-sheet" aria-label="Night visibility">
          <div className="field-planner-toolbar">
            <SearchField aria-label="Filter observing targets" placeholder="Find a target" value={query} onChange={setQuery} />
            <SegmentedControl aria-label="Horizon filter" selectedKeys={new Set([scope])} onSelectionChange={keys => { const key = [...keys][0]; if (key) setScope(String(key)); }}>
              <SegmentedControlItem id="above">Above horizon</SegmentedControlItem>
              <SegmentedControlItem id="all">All targets</SegmentedControlItem>
            </SegmentedControl>
          </div>
          <div className="field-table-scroll">
            <table className="field-table">
              <caption>{visible.length} targets at {time.format(date)} UTC</caption>
              <thead><tr><th scope="col">Constellation</th><th scope="col">Altitude</th><th scope="col">Azimuth</th><th scope="col">Transit UTC</th><th scope="col"><span className="sr-only">Action</span></th></tr></thead>
              <tbody>
                {visible.map(target => (
                  <tr key={target.id}>
                    <th scope="row">{target.name}<small>{target.id}</small></th>
                    <td>{target.altitude.toFixed(1)}°</td><td>{target.azimuth.toFixed(1)}°</td><td>{time.format(target.transit)}</td>
                    <td><Button size="xs" variant="secondary" iconOnly leadingIcon={ArrowUpRight} aria-label={`Open ${target.name} in planetarium`} onClick={() => useAstroStore.getState().focusOnConstellation(target.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!visible.length && <p className="field-empty">No targets match your filters.</p>}
        </section>
        <aside className="field-planner-side">
          <section className="field-note">
            <h2>Observation</h2>
            <p>{observer.name}</p>
            <Button variant="secondary" leadingIcon={Compass} onClick={() => window.dispatchEvent(new CustomEvent('costellar:open-observer'))}>Change site</Button>
            <label>Time (UTC)
              <input type="datetime-local" value={date.toISOString().slice(0, 16)} onChange={event => {
                const value = new Date(`${event.target.value}Z`);
                if (!Number.isNaN(value.getTime())) setDate(value);
              }} />
            </label>
            <Button size="small" variant="secondary" onClick={() => setDate(new Date())}>Use current time</Button>
          </section>
          <ObservingConditions />
        </aside>
      </div>
    </>
  );
}
