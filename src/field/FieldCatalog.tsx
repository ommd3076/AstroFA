import { useMemo, useState } from 'react';
import { ArrowUpRight, Crosshair, Star } from 'lucide-react';
import { Button } from '../components/ui/board/base/buttons/button';
import { SearchField } from '../components/ui/board/base/search-field/search-field';
import { Select, SelectItem } from '../components/ui/board/base/select/select';
import { Switch } from '../components/ui/board/base/switch/switch';
import { CONSTELLATIONS, REFERENCE_PATTERNS, STAR_BY_ID } from '../data/astroData';
import { useAstroStore } from '../stores/useAstroStore';
import { ConstellationPlate } from './Plate';

const families = [...new Set(CONSTELLATIONS.map(target => target.family))].sort();

export function FieldCatalog() {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const deepLink = new URLSearchParams(window.location.search).get('constellation')?.toLowerCase();
  const focused = useAstroStore(state => state.focusedConstellationId);
  const [selected, setSelected] = useState(() => CONSTELLATIONS.find(target => target.id.toLowerCase() === deepLink)?.id ?? focused);
  const openSky = useAstroStore(state => state.focusOnConstellation);
  const loadTrace = useAstroStore(state => state.loadPresetTrace);
  const matches = useMemo(() => CONSTELLATIONS.filter(target =>
    (family === 'all' || target.family === family) &&
    (!favoritesOnly || favorites.includes(target.id)) &&
    `${target.name} ${target.englishName} ${target.id}`.toLowerCase().includes(query.trim().toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name)), [family, favorites, favoritesOnly, query]);
  const target = matches.find(item => item.id === selected) ?? matches[0];
  const stars = target?.starIds.flatMap(id => {
    const star = STAR_BY_ID.get(id);
    return star ? [star] : [];
  }).sort((a, b) => a.mag - b.mag).slice(0, 8) ?? [];
  const patterns = target ? REFERENCE_PATTERNS.filter(pattern => pattern.constellationId === target.id) : [];

  return (
    <>
      <header className="field-page-heading">
        <h1>Constellation catalog</h1>
        <p>Explore the 88 official IAU regions and the stars that outline their figures.</p>
      </header>
      <div className="field-catalog">
        <aside className="field-index" aria-label="Constellation filters and results">
          <SearchField value={query} onChange={setQuery} aria-label="Search constellations" placeholder="Find a constellation" />
          <Select aria-label="Filter by constellation family" value={family} onChange={key => setFamily(typeof key === 'string' ? key : 'all')}>
            <SelectItem id="all">All families</SelectItem>
            {families.map(name => <SelectItem id={name} key={name}>{name}</SelectItem>)}
          </Select>
          <Switch size="sm" isSelected={favoritesOnly} onChange={setFavoritesOnly}>Favorites only</Switch>
          <p className="field-count" aria-live="polite">{matches.length} constellations</p>
          <div className="field-index-results">
            {matches.map(item => (
              <button key={item.id} aria-pressed={target?.id === item.id} onClick={() => setSelected(item.id)}>
                <span>{item.name}<small>{item.englishName}</small></span><code>{item.id}</code>
              </button>
            ))}
          </div>
        </aside>
        {target ? (
          <article className="field-entry">
            <div className="field-entry-heading">
              <div><span className="field-label">{target.family} family</span><h2>{target.name}</h2></div>
              <div className="field-actions">
                <Button variant="secondary" leadingIcon={Star} aria-pressed={favorites.includes(target.id)} onClick={() =>
                  setFavorites(items => items.includes(target.id) ? items.filter(id => id !== target.id) : [...items, target.id])}>
                  {favorites.includes(target.id) ? 'Saved' : 'Save target'}
                </Button>
                <Button onClick={() => openSky(target.id)} trailingIcon={ArrowUpRight}>Open in planetarium</Button>
              </div>
            </div>
            <ConstellationPlate target={target} detailed />
            <dl className="field-metrics field-entry-metrics">
              <div><dt>Area</dt><dd>{target.area.toFixed(1)} deg²</dd></div>
              <div><dt>Right ascension</dt><dd>{(target.raCenter / 15).toFixed(2)}h</dd></div>
              <div><dt>Declination</dt><dd>{target.decCenter.toFixed(1)}°</dd></div>
            </dl>
            <div className="field-entry-columns">
              <section>
                <h3>Brightest stars in the figure</h3>
                <ul className="field-star-list">
                  {stars.map(star => <li key={star.id}><button onClick={() => useAstroStore.getState().focusOnStar(star.id)}>{star.proper || star.name}<ArrowUpRight size={13} aria-hidden /></button><code>{star.mag.toFixed(2)} mag</code></li>)}
                </ul>
              </section>
              <section>
                <h3>Reference traces</h3>
                {patterns.length ? <div className="field-stack">{patterns.map(pattern => (
                  <div className="field-actions" key={pattern.id}>
                    <Button variant="secondary" leadingIcon={Crosshair} onClick={() => loadTrace(pattern)}>{pattern.name}</Button>
                    <Button variant="secondary" aria-label={`Inspect ${pattern.name} in Automata Lab`} onClick={() => {
                      const store = useAstroStore.getState();
                      store.setSimulatorSymbols(pattern.encodedSymbols);
                      store.setAutomataTab('dfa');
                      store.setActiveView('automataLab');
                    }}>Inspect DFA</Button>
                  </div>
                ))}</div> : <p>There are no reference traces for this region.</p>}
              </section>
            </div>
          </article>
        ) : <p className="field-empty">No constellations match those filters.</p>}
      </div>
    </>
  );
}
