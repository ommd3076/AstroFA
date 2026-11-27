import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, CompassIcon } from 'lucide-react';
import { useAstroStore } from '../stores/useAstroStore';
import { PRESET_OBSERVERS } from '../astronomy/coordinates';
import { STARS, CONSTELLATIONS } from '../data/astroData';
import type { ObserverLocation } from '../types/astronomy';
import { formatObserverCoordinates } from '../utils/format';
import { Button } from './ui/board/base/buttons/button';
import { Kbd } from './ui/board/base/kbd/kbd';
import { Input } from './ui/board/base/input/input';
import { CommandPalette, CommandPaletteItem, CommandPaletteSection } from './ui/board/base/command-palette/command-palette';
import { Modal, ModalBody, ModalFooter, ModalHeader } from './ui/board/base/modal/modal';

type NavItem = { id: string; label: string; icon: string; onClick: () => void; active: boolean };

export const HeaderNav: React.FC = () => {
  const activeView = useAstroStore(s => s.activeView);
  const setActiveView = useAstroStore(s => s.setActiveView);
  const observer = useAstroStore(s => s.observer);
  const setObserver = useAstroStore(s => s.setObserver);
  const isTraceMode = useAstroStore(s => s.isTraceMode);
  const setIsTraceMode = useAstroStore(s => s.setIsTraceMode);
  const focusOnStar = useAstroStore(s => s.focusOnStar);
  const focusOnConstellation = useAstroStore(s => s.focusOnConstellation);
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [observerOpen, setObserverOpen] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const command = () => setCommandOpen(true);
    const site = () => setObserverOpen(true);
    window.addEventListener('costellar:open-command', command);
    window.addEventListener('costellar:open-observer', site);
    return () => {
      window.removeEventListener('costellar:open-command', command);
      window.removeEventListener('costellar:open-observer', site);
    };
  }, []);
  const navigate = useCallback((view: Parameters<typeof setActiveView>[0], trace = false) => {
    if (trace) setIsTraceMode(true);
    setActiveView(view);
  }, [setActiveView, setIsTraceMode]);
  const navigateClean = useCallback((view: Parameters<typeof setActiveView>[0]) => {
    useAstroStore.setState({ isTraceMode: false });
    setActiveView(view);
  }, [setActiveView]);
  const navGroups = useMemo(() => {
    const item = (id: string, label: string, icon: string, onClick: () => void, active: boolean): NavItem => ({ id, label, icon, onClick, active });
    return [
      { label: 'Observe', items: [
        item('overview', 'Overview', '▦', () => navigateClean('overview'), activeView === 'overview'),
        item('sky', 'Sky Planetarium', '◉', () => navigateClean('sky'), activeView === 'sky' && !isTraceMode),
        item('tonight', 'Sky Tonight', '◐', () => navigate('tonight'), activeView === 'tonight'),
        item('constellations', 'Catalog · 88', '✣', () => navigate('constellations'), activeView === 'constellations'),
      ] },
      { label: 'Workbench', items: [
        item('trace', 'Trace Mode', '⌁', () => navigate('sky', true), (activeView === 'sky' && isTraceMode) || activeView === 'patterns'),
        item('results', 'Results', '▥', () => navigate('results'), activeView === 'results'),
        item('imageLab', 'Image Lab', '▣', () => navigate('imageLab'), activeView === 'imageLab'),
        item('automataLab', 'Automata Lab', '◎', () => navigate('automataLab'), activeView === 'automataLab'),
      ] },
      { label: 'Learn & Reference', items: [
        item('hunt', 'Hunt Mode', '⊙', () => navigate('hunt'), activeView === 'hunt'),
        item('academic', 'Walkthrough', '◇', () => navigate('academic'), activeView === 'academic'),
        item('credits', 'Sources & Credits', 'ⓘ', () => navigate('credits'), activeView === 'credits'),
      ] },
    ];
  }, [activeView, isTraceMode, navigate, navigateClean]);
  const views = useMemo(
    () => navGroups.flatMap(group => group.items.map(item => ({ ...item, group: group.label }))),
    [navGroups],
  );
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return {
      cons: CONSTELLATIONS.filter(c => !q || `${c.name} ${c.englishName} ${c.id}`.toLowerCase().includes(q)).slice(0, 5),
      stars: STARS.filter(s => !q || `${s.proper || ''} ${s.name} ${s.hr || ''}`.toLowerCase().includes(q)).sort((a, b) => a.mag - b.mag).slice(0, 5),
      nav: views.filter(v => !q || v.label.toLowerCase().includes(q)),
    };
  }, [query, views]);
  const commandActions = useMemo(() => new Map<string, () => void>([
    ...results.cons.map(c => [`con-${c.id}`, () => { focusOnConstellation(c.id); setActiveView('sky'); }] as const),
    ...results.stars.map(s => [`star-${s.id}`, () => { focusOnStar(s.id); setActiveView('sky'); }] as const),
    ...results.nav.map(v => [`view-${v.id}`, v.onClick] as const),
  ]), [results, focusOnConstellation, focusOnStar, setActiveView]);
  return <>
    <aside className={`board-sidebar boardui-surface ${collapsed ? 'is-collapsed' : ''}`} aria-label="Costellar navigation">
      <div className="board-sidebar-header"><button className="board-brand" onClick={() => navigateClean('overview')} aria-label="Costellar Atlas home"><span className="board-brand-mark" aria-hidden="true">✦</span><span className="board-brand-copy"><strong>COSTELLAR</strong><small>OBSERVING ATLAS</small></span></button><Button variant="ghost" size="small" iconOnly leadingIcon={collapsed ? ChevronRightIcon : ChevronLeftIcon} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(value => !value)} /></div>
      <button className="board-search-trigger" onClick={() => setCommandOpen(true)} aria-label="Search stars, constellations and views"><SearchIcon aria-hidden="true" /><span>Search catalog...</span><Kbd>Ctrl K</Kbd></button>
      <nav className="board-sidebar-nav">{navGroups.map(group => <section key={group.label} className="board-nav-group"><h2>{group.label}</h2>{group.items.map(item => <button key={item.id} className={`board-nav-item ${item.active ? 'is-active' : ''}`} onClick={item.onClick} aria-label={item.label} aria-current={item.active ? 'page' : undefined} title={collapsed ? item.label : undefined}><span className="board-nav-icon" aria-hidden="true">{item.icon}</span><span className="board-nav-label">{item.label}</span></button>)}</section>)}</nav>
      <button className="board-observer" onClick={() => setObserverOpen(true)} title="Change observer location"><CompassIcon aria-hidden="true" /><span><strong>{observer.name.split(',')[0]}</strong><small>{formatObserverCoordinates(observer.latitude, observer.longitude)}</small></span><em>SITE</em></button>
    </aside>
    <CommandPalette isOpen={commandOpen} onOpenChange={open => { setCommandOpen(open); if (!open) setQuery(''); }} inputValue={query} onInputChange={setQuery} filter={null} aria-label="Search Costellar catalog" placeholder="Search stars, constellations, HR numbers, or views..." emptyState={<p className="board-command-empty">No matching catalog targets or views.</p>} onAction={key => commandActions.get(String(key))?.()}>
      {results.cons.length > 0 && <CommandPaletteSection title="Constellations">{results.cons.map(c => <CommandPaletteItem key={c.id} id={`con-${c.id}`} textValue={`${c.name} ${c.englishName} ${c.id}`} description={c.englishName}>{c.name}<Kbd>{c.id}</Kbd></CommandPaletteItem>)}</CommandPaletteSection>}
      {results.stars.length > 0 && <CommandPaletteSection title="Catalog stars">{results.stars.map(s => <CommandPaletteItem key={s.id} id={`star-${s.id}`} textValue={`${s.proper || s.name} ${s.name} ${s.con || ''}`} description={s.con || 'Catalog star'}>{s.proper || s.name}</CommandPaletteItem>)}</CommandPaletteSection>}
      {results.nav.length > 0 && <CommandPaletteSection title="Navigation views">{results.nav.map(v => <CommandPaletteItem key={v.id} id={`view-${v.id}`} textValue={v.label} description={v.group}>{v.icon} {v.label}</CommandPaletteItem>)}</CommandPaletteSection>}
    </CommandPalette>
    <Modal isOpen={observerOpen} onOpenChange={open => setObserverOpen(open)} size="lg" aria-label="Observation location settings">
      <ModalHeader title="Observation location settings" description="Choose a preset, use browser GPS, or enter coordinates." />
      <ModalBody><ObserverPanel observer={observer} onSelect={obs => { setObserver(obs); setObserverOpen(false); }} /></ModalBody>
      <ModalFooter><Button variant="ghost" size="small" onClick={() => setObserverOpen(false)}>Cancel</Button><Button type="submit" form="observer-coordinate-form" variant="secondary" size="small">Apply coordinates</Button></ModalFooter>
    </Modal>
  </>;
};
function ObserverPanel({ observer, onSelect }: { observer: ObserverLocation; onSelect: (observer: ObserverLocation) => void }) {
  const [name, setName] = useState('Custom Site'); const [lat, setLat] = useState(String(observer.latitude)); const [lon, setLon] = useState(String(observer.longitude)); const [error, setError] = useState('');
  const apply = (event?: React.FormEvent) => { event?.preventDefault(); const latitude = Number(lat); const longitude = Number(lon); if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) { setError('Latitude must be −90..90 and longitude −180..180.'); return; } onSelect({ name: name.trim() || `LAT ${latitude.toFixed(2)}°, LON ${longitude.toFixed(2)}°`, latitude, longitude }); };
  return <div className="grid gap-4"><div className="board-presets">{PRESET_OBSERVERS.map(preset => <Button key={preset.name} variant={preset.name === observer.name ? 'primary' : 'secondary'} size="small" onClick={() => onSelect(preset)} className="board-preset"><strong>{preset.name}</strong><small>{formatObserverCoordinates(preset.latitude, preset.longitude, 2)}</small></Button>)}</div><Button variant="secondary" size="small" onClick={() => navigator.geolocation?.getCurrentPosition(pos => onSelect({ name: `GPS (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`, latitude: pos.coords.latitude, longitude: pos.coords.longitude, elevation: pos.coords.altitude || 0 }), () => setError('Geolocation unavailable.'))}>⌖ Use browser GPS</Button><form id="observer-coordinate-form" onSubmit={apply} className="board-coordinate-form"><Input label="Name" value={name} onChange={setName} /><Input label="Latitude" inputMode="decimal" value={lat} onChange={setLat} isRequired /><Input label="Longitude" inputMode="decimal" value={lon} onChange={setLon} isRequired /></form>{error && <p className="board-form-error" role="alert">{error}</p>}</div>;
}
