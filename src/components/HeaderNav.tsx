import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAstroStore, type ActiveView } from '../stores/useAstroStore';
import { PRESET_OBSERVERS } from '../astronomy/coordinates';
import { STARS, CONSTELLATIONS, REFERENCE_PATTERNS } from '../data/astroData';
import type { ObserverLocation } from '../types/astronomy';

export const HeaderNav: React.FC = () => {
  const {
    activeView,
    setActiveView,
    observer,
    setObserver,
    isTraceMode,
    setIsTraceMode,
    focusOnStar,
    focusOnConstellation,
  } = useAstroStore();

  const [isObserverOpen, setIsObserverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Search Results Filtering
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { constellations: [], stars: [] };

    const matchedCons = CONSTELLATIONS.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.englishName.toLowerCase().includes(q)
    ).slice(0, 4);

    const matchedStars = STARS.filter(s => {
      const proper = s.proper?.toLowerCase() || '';
      const name = s.name.toLowerCase();
      const hr = s.hr ? s.hr.toString() : '';
      return proper.includes(q) || name.includes(q) || hr === q;
    })
      .sort((a, b) => a.mag - b.mag)
      .slice(0, 6);

    return { constellations: matchedCons, stars: matchedStars };
  }, [searchQuery]);

  const hasResults =
    searchResults.constellations.length > 0 || searchResults.stars.length > 0;

  const handleSelectConstellation = (conId: string) => {
    focusOnConstellation(conId);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleSelectStar = (starId: number) => {
    focusOnStar(starId);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const navItems: Array<{ id: ActiveView; label: string; icon: string }> = [
    { id: 'sky', label: 'LIVE SKY', icon: '✦' },
    { id: 'tonight', label: 'SKY TONIGHT', icon: '◎' },
    { id: 'constellations', label: 'EXPLORER', icon: '☍' },
    { id: 'automataLab', label: 'AUTOMATA LAB', icon: 'δ' },
    { id: 'hunt', label: 'HUNT', icon: '⊕' },
    { id: 'imageLab', label: 'IMAGE LAB', icon: '◫' },
    { id: 'academic', label: 'VIVA MODE', icon: 'Σ' },
    { id: 'credits', label: 'CREDITS', icon: 'ℹ' },
  ];

  return (
    <>
      <header className="h-14 bg-[var(--bg-card)] border-b border-[var(--bg-tray)] px-4 flex items-center justify-between z-30 shrink-0 select-none gap-2 font-mono">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveView('sky')}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-[6px] bg-[var(--signal-cobalt)] flex items-center justify-center border border-[var(--signal-mid)] shadow-none shrink-0 transition-opacity group-hover:opacity-90">
              <span className="text-white font-bold text-sm tracking-wider font-mono">C</span>
            </div>
            <div>
              <div className="font-bold tracking-tight text-[var(--ink-primary)] text-xs uppercase flex items-center gap-1.5">
                <span className="tracking-wider">COSTELLAR</span>
                <span className="hud-reticle text-[9px] font-mono uppercase px-1.5 py-0.5 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-mid)] rounded-[4px] font-semibold">
                  DFA ENGINE
                </span>
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider hidden sm:block">
                HARDWARE TELEMETRY // AUTOMATA
              </div>
            </div>
          </button>
        </div>

        {/* Search Omnibar (Search for real constellations & stars) */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-xs md:max-w-sm mx-2">
          <div className="relative hud-reticle w-full">
            <input
              type="text"
              placeholder="SEARCH ORION, SIRIUS, VEGA..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] focus:border-[var(--signal-cobalt)] rounded-[6px] pl-8 pr-6 py-1.5 text-xs text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none font-mono uppercase tracking-wide transition-colors"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] text-[11px] pointer-events-none">
              ⌕
            </span>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] text-xs cursor-pointer font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--signal-surface)] rounded-[8px] shadow-none overflow-hidden z-50 text-xs max-h-80 overflow-y-auto divide-y divide-[var(--bg-tray)] font-mono">
              {hasResults ? (
                <>
                  {/* Constellation matches */}
                  {searchResults.constellations.length > 0 && (
                    <div className="p-1">
                      <div className="text-[10px] uppercase font-bold text-[var(--ink-muted)] px-2 py-1 tracking-wider">
                        CONSTELLATIONS
                      </div>
                      {searchResults.constellations.map(c => {
                        const hasDfa = REFERENCE_PATTERNS.some(p => p.constellationId === c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => handleSelectConstellation(c.id)}
                            className="w-full p-2 hover:bg-[var(--bg-card-subtle)] rounded-[6px] text-left flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <div>
                              <span className="font-semibold text-[var(--ink-primary)]">{c.name}</span>
                              <span className="text-[11px] text-[var(--ink-secondary)] ml-1.5 uppercase">"{c.englishName}"</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-[var(--bg-pill-neutral)] border border-[var(--bg-tray)] text-[10px] text-[var(--ink-secondary)] font-mono rounded-[4px] uppercase font-semibold">
                                {c.id}
                              </span>
                              {hasDfa && (
                                <span className="px-1.5 py-0.5 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-mid)] text-[9px] font-bold rounded-[4px] uppercase">
                                  DFA
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Star matches */}
                  {searchResults.stars.length > 0 && (
                    <div className="p-1">
                      <div className="text-[10px] uppercase font-bold text-[var(--ink-muted)] px-2 py-1 tracking-wider">
                        CATALOG STARS
                      </div>
                      {searchResults.stars.map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectStar(s.id)}
                          className="w-full p-2 hover:bg-[var(--bg-card-subtle)] rounded-[6px] text-left flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div>
                            <span className="font-semibold text-[var(--signal-cobalt)]">{s.proper || s.name}</span>
                            {s.con && (
                              <span className="text-[11px] text-[var(--ink-secondary)] ml-1.5 font-mono uppercase">
                                ({s.con})
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--ink-muted)] font-mono uppercase">
                            MAG {s.mag.toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 text-center text-[var(--ink-muted)] text-xs uppercase tracking-wider">
                  NO MATCHING TARGETS FOUND
                </div>
              )}
            </div>
          )}
        </div>

        {/* View Switcher Rocker Pills */}
        <nav className="flex items-center gap-1 bg-[var(--bg-tray)] p-1 rounded-[8px] overflow-x-auto no-scrollbar">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-mono font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[var(--signal-cobalt)] text-white border border-[var(--signal-mid)] shadow-none'
                    : 'bg-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-pill-neutral)] border border-transparent'
                }`}
              >
                <span className="text-xs">{item.icon}</span>
                <span className="hidden xl:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Trace Mode Toggle */}
          <button
            onClick={() => {
              setIsTraceMode(!isTraceMode);
              if (activeView !== 'sky') setActiveView('sky');
            }}
            className={`px-3 py-1 rounded-[6px] text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              isTraceMode
                ? 'bg-[var(--signal-cobalt)] text-white border border-[var(--signal-mid)] shadow-none'
                : 'bg-[var(--bg-card-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)]'
            }`}
          >
            <span className={`w-2 h-2 rounded-[2px] ${isTraceMode ? 'bg-white' : 'bg-[var(--dot-inactive)]'}`} />
            <span>TRACE MODE</span>
          </button>

          {/* Observer Location Pill */}
          <button
            onClick={() => setIsObserverOpen(true)}
            className="hud-reticle px-2.5 py-1 bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-card)] border border-[var(--bg-tray)] hover:border-[var(--signal-mid)] rounded-[6px] text-[11px] font-mono text-[var(--ink-primary)] flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider"
            title="Change observer location"
          >
            <span className="text-[var(--signal-cobalt)] text-xs">⌖</span>
            <span className="max-w-[100px] truncate hidden sm:inline font-semibold">{observer.name.split(',')[0]}</span>
          </button>
        </div>
      </header>

      {/* Observer Location Modal */}
      {isObserverOpen && (
        <ObserverModal
          currentObserver={observer}
          onSelect={obs => {
            setObserver(obs);
            setIsObserverOpen(false);
          }}
          onClose={() => setIsObserverOpen(false)}
        />
      )}
    </>
  );
};

interface ObserverModalProps {
  currentObserver: ObserverLocation;
  onSelect: (obs: ObserverLocation) => void;
  onClose: () => void;
}

const ObserverModal: React.FC<ObserverModalProps> = ({ currentObserver, onSelect, onClose }) => {
  const [customLat, setCustomLat] = useState(currentObserver.latitude.toString());
  const [customLon, setCustomLon] = useState(currentObserver.longitude.toString());
  const [customName, setCustomName] = useState('CUSTOM COORDINATES');

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      onSelect({
        name: customName || `LAT ${lat.toFixed(2)}°, LON ${lon.toFixed(2)}°`,
        latitude: lat,
        longitude: lon,
      });
    }
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          onSelect({
            name: `GPS (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            elevation: pos.coords.altitude || 0,
          });
        },
        err => {
          alert(`Geolocation unavailable: ${err.message}`);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="hud-reticle-4corner bg-[var(--bg-card)] border border-[var(--card-border)] rounded-[12px] max-w-lg w-full p-6 shadow-none space-y-4 font-mono text-[var(--ink-primary)]">
        <div className="flex items-center justify-between border-b border-[var(--bg-tray)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--signal-cobalt)] text-sm">⌖</span>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--ink-primary)]">
              OBSERVATION LOCATION // TELEMETRY
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] text-xs px-2 py-1 rounded-[4px] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Global Preset Observatories */}
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider block">
            MAJOR GLOBAL OBSERVATORIES & CITIES
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {PRESET_OBSERVERS.map((preset, idx) => {
              const isSelected = preset.name === currentObserver.name;
              return (
                <button
                  key={idx}
                  onClick={() => onSelect(preset)}
                  className={`text-left p-2.5 rounded-[8px] border text-xs transition-all cursor-pointer font-mono ${
                    isSelected
                      ? 'bg-[var(--bg-pill-active)] border-[var(--signal-cobalt)] text-[var(--signal-cobalt)]'
                      : 'bg-[var(--bg-card-subtle)] border-[var(--bg-tray)] text-[var(--ink-secondary)] hover:border-[var(--signal-surface)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <div className="font-semibold truncate uppercase">{preset.name}</div>
                  <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                    {preset.latitude.toFixed(2)}°N, {preset.longitude.toFixed(2)}°E
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Browser Geolocation */}
        <div>
          <button
            type="button"
            onClick={handleGeolocation}
            className="w-full py-2 px-3 bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-pill-active)] border border-[var(--bg-tray)] hover:border-[var(--signal-mid)] rounded-[8px] text-[11px] font-mono uppercase tracking-wider text-[var(--signal-cobalt)] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>⌖</span>
            <span>USE BROWSER GPS GEOLOCATION</span>
          </button>
        </div>

        {/* Custom Coordinates */}
        <form onSubmit={handleApplyCustom} className="space-y-3 pt-2 border-t border-[var(--bg-tray)]">
          <label className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider block">
            CUSTOM COORDINATES
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wider block mb-1">NAME</label>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] focus:border-[var(--signal-cobalt)] rounded-[6px] px-2.5 py-1.5 text-xs text-[var(--ink-primary)] font-mono uppercase focus:outline-none"
                placeholder="MY LOCATION"
              />
            </div>
            <div>
              <label className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wider block mb-1">LAT (-90..90)</label>
              <input
                type="number"
                step="0.001"
                value={customLat}
                onChange={e => setCustomLat(e.target.value)}
                className="w-full bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] focus:border-[var(--signal-cobalt)] rounded-[6px] px-2.5 py-1.5 text-xs text-[var(--ink-primary)] font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wider block mb-1">LON (-180..180)</label>
              <input
                type="number"
                step="0.001"
                value={customLon}
                onChange={e => setCustomLon(e.target.value)}
                className="w-full bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] focus:border-[var(--signal-cobalt)] rounded-[6px] px-2.5 py-1.5 text-xs text-[var(--ink-primary)] font-mono focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[var(--signal-cobalt)] hover:bg-[var(--signal-mid)] text-white rounded-[6px] text-xs font-mono uppercase tracking-wider font-semibold shadow-none cursor-pointer"
            >
              APPLY COORDINATES
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
