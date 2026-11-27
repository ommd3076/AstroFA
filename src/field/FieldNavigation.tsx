import { useEffect, useMemo, useState } from 'react';
import { Compass, Search, Telescope } from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { PRESET_OBSERVERS } from '../astronomy/coordinates';
import { Button } from '../components/ui/board/base/buttons/button';
import { CommandPalette, CommandPaletteItem, CommandPaletteSection } from '../components/ui/board/base/command-palette/command-palette';
import { Input } from '../components/ui/board/base/input/input';
import { Kbd } from '../components/ui/board/base/kbd/kbd';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '../components/ui/board/base/modal/modal';
import { CONSTELLATIONS, STARS } from '../data/astroData';
import { useAstroStore } from '../stores/useAstroStore';
import type { ActiveView } from '../stores/useAstroStore';
import type { ObserverLocation } from '../types/astronomy';

export const fieldRoutes = [
  { id: 'overview', name: 'Atlas' },
  { id: 'sky', name: 'Planetarium' },
  { id: 'tonight', name: 'Tonight' },
  { id: 'constellations', name: 'Catalog' },
  { id: 'hunt', name: 'Hunt' },
  { id: 'imageLab', name: 'Image Lab' },
  { id: 'automataLab', name: 'Automata' },
  { id: 'academic', name: 'Walkthrough' },
  { id: 'results', name: 'Recognition' },
  { id: 'patterns', name: 'Geometry' },
  { id: 'credits', name: 'Sources' },
] as const satisfies readonly { id: ActiveView; name: string }[];

const namedStars = STARS.filter(star => star.proper).sort((a, b) => a.mag - b.mag);
const searchableStars = STARS.map(star => ({
  star, term: `${star.proper ?? ''} ${star.name} ${star.hr ? `HR ${star.hr}` : ''}`.toLowerCase(),
}));

function ObserverForm({ observer, onSelect }: { observer: ObserverLocation; onSelect: (value: ObserverLocation) => void }) {
  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState(String(observer.latitude));
  const [longitude, setLongitude] = useState(String(observer.longitude));
  const [error, setError] = useState('');

  function locate() {
    if (!navigator.geolocation) {
      setError('This browser does not provide location. Enter coordinates below.');
      return;
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => onSelect({
      name: 'Current location',
      latitude: coords.latitude,
      longitude: coords.longitude,
      elevation: coords.altitude ?? undefined,
    }), () => setError('Location is unavailable. Enter coordinates below.'));
  }

  return (
    <div className="field-location-options">
      <div className="field-preset-list">
        {PRESET_OBSERVERS.map(preset => (
          <Button key={preset.name} variant="secondary" size="small" onClick={() => onSelect(preset)}>{preset.name.split(',')[0]}</Button>
        ))}
        <Button variant="secondary" size="small" leadingIcon={Compass} onClick={locate}>Use my location</Button>
      </div>
      <form id="field-coordinates" className="field-coordinates" onSubmit={event => {
        event.preventDefault();
        const lat = Number(latitude);
        const lon = Number(longitude);
        if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
          setError('Enter latitude between −90 and 90 and longitude between −180 and 180.');
          return;
        }
        onSelect({ name: name.trim() || 'Custom location', latitude: lat, longitude: lon });
      }}>
        <Input label="Site name" placeholder="Custom location" value={name} onChange={setName} />
        <Input label="Latitude" inputMode="decimal" value={latitude} onChange={setLatitude} isRequired />
        <Input label="Longitude" inputMode="decimal" value={longitude} onChange={setLongitude} isRequired />
      </form>
      {error && <p role="alert" className="field-error">{error}</p>}
    </div>
  );
}

export function FieldNavigation({ view, navigate }: { view: ActiveView; navigate: (view: ActiveView) => void }) {
  const observer = useAstroStore(state => state.observer);
  const setObserver = useAstroStore(state => state.setObserver);
  const [searchOpen, setSearchOpen] = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const reduced = useReducedMotion();
  const term = query.trim().toLowerCase();
  const matches = useMemo(() => ({
    views: fieldRoutes.filter(route => route.name.toLowerCase().includes(term)),
    constellations: CONSTELLATIONS.filter(target => `${target.name} ${target.englishName} ${target.id}`.toLowerCase().includes(term)).slice(0, 5),
    stars: term ? searchableStars.filter(item => item.term.includes(term)).slice(0, 5).map(item => item.star) : namedStars.slice(0, 5),
  }), [term]);

  useEffect(() => {
    const showSite = () => setSiteOpen(true);
    window.addEventListener('costellar:open-observer', showSite);
    return () => window.removeEventListener('costellar:open-observer', showSite);
  }, []);

  return (
    <header className="field-masthead">
      <div className="field-masthead-inner">
        <button className="field-brand" onClick={() => navigate('overview')} aria-label="Costellar atlas">
          <span><Telescope size={17} aria-hidden /></span>Costellar
        </button>
        <nav className="field-nav" aria-label="Views">
          <LayoutGroup id="field-navigation">
            {fieldRoutes.slice(0, 7).map(route => (
              <button key={route.id} aria-current={view === route.id ? 'page' : undefined} onClick={() => navigate(route.id)}>
                {view === route.id && <motion.span className="field-nav-selection" aria-hidden layoutId={reduced ? undefined : 'selection'} transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 35 }} />}
                <span className="field-nav-text">{route.name}</span>
              </button>
            ))}
          </LayoutGroup>
        </nav>
        <div className="field-global-actions">
          <Button variant="secondary" size="small" onClick={() => setSearchOpen(true)} leadingIcon={Search} aria-label="Search the atlas"><Kbd>Ctrl K</Kbd></Button>
          <Button variant="secondary" size="small" onClick={() => setSiteOpen(true)} leadingIcon={Compass} aria-label="Change observation site"><span className="field-site-name">{observer.name.split(',')[0]}</span></Button>
        </div>
      </div>
      <CommandPalette
        isOpen={searchOpen}
        onOpenChange={open => { setSearchOpen(open); if (!open) setQuery(''); }}
        inputValue={query}
        onInputChange={setQuery}
        filter={null}
        aria-label="Search the atlas"
        placeholder="Find a star, constellation or page"
        onAction={key => {
          const id = String(key);
          const store = useAstroStore.getState();
          const route = fieldRoutes.find(item => item.id === id);
          if (route) navigate(route.id);
          if (id.startsWith('con/')) store.focusOnConstellation(id.slice(4));
          if (id.startsWith('star/')) store.focusOnStar(Number(id.slice(5)));
        }}
      >
        {matches.constellations.length > 0 && (
          <CommandPaletteSection title="Constellations">
            {matches.constellations.map(target => <CommandPaletteItem key={target.id} id={`con/${target.id}`} textValue={target.name} description={target.englishName}>{target.name}</CommandPaletteItem>)}
          </CommandPaletteSection>
        )}
        {matches.stars.length > 0 && (
          <CommandPaletteSection title="Stars">
            {matches.stars.map(star => <CommandPaletteItem key={star.id} id={`star/${star.id}`} textValue={star.proper || star.name} description={star.con}>{star.proper || star.name}</CommandPaletteItem>)}
          </CommandPaletteSection>
        )}
        {matches.views.length > 0 && (
          <CommandPaletteSection title="Pages">
            {matches.views.map(route => <CommandPaletteItem key={route.id} id={route.id} textValue={route.name}>{route.name}</CommandPaletteItem>)}
          </CommandPaletteSection>
        )}
      </CommandPalette>
      <Modal isOpen={siteOpen} onOpenChange={setSiteOpen} aria-label="Observation site" size="lg">
        <ModalHeader title="Observation site" description="Choose a preset or enter your own coordinates." />
        <ModalBody>
          <ObserverForm observer={observer} onSelect={site => { setObserver(site); setSiteOpen(false); }} />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setSiteOpen(false)}>Cancel</Button>
          <Button type="submit" form="field-coordinates">Apply site</Button>
        </ModalFooter>
      </Modal>
    </header>
  );
}
