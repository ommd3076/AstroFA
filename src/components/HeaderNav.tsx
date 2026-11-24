import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAstroStore } from '../stores/useAstroStore';
import { PRESET_OBSERVERS } from '../astronomy/coordinates';
import { STARS, CONSTELLATIONS, REFERENCE_PATTERNS } from '../data/astroData';
import type { ObserverLocation } from '../types/astronomy';
import { formatObserverCoordinates } from '../utils/format';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchOptionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const observerTriggerRef = useRef<HTMLButtonElement>(null);

  // The search shortcut is available from every view; Escape dismisses its results.
  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
        searchContainerRef.current?.querySelector('input')?.focus();
      } else if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeys);
    return () => document.removeEventListener('keydown', handleKeys);
  }, []);

  useEffect(() => {
    if (!isObserverOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsObserverOpen(false);
        requestAnimationFrame(() => observerTriggerRef.current?.focus());
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isObserverOpen]);

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
  const searchTargetCount = searchResults.constellations.length + searchResults.stars.length;

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchQuery.trim() || !searchTargetCount) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsSearchOpen(true);
      setActiveSearchIndex(index => Math.min(index + 1, searchTargetCount - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsSearchOpen(true);
      setActiveSearchIndex(index => index < 0 ? searchTargetCount - 1 : Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && activeSearchIndex >= 0) {
      event.preventDefault();
      searchOptionRefs.current[activeSearchIndex]?.click();
    }
  };

  const handleSelectConstellation = (conId: string) => {
    focusOnConstellation(conId);
    setSearchQuery('');
    setIsSearchOpen(false);
    if (activeView !== 'sky') {
      setActiveView('sky');
    }
  };

  const handleSelectStar = (starId: number) => {
    focusOnStar(starId);
    setSearchQuery('');
    setIsSearchOpen(false);
    if (activeView !== 'sky') {
      setActiveView('sky');
    }
  };

  const navItems = [
    {
      id: 'overview',
      label: 'OVERVIEW',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      ),
      onClick: () => {
        useAstroStore.setState({ isTraceMode: false });
        setActiveView('overview');
      },
      isActive: activeView === 'overview',
    },
    {
      id: 'sky',
      label: 'SKY EXPLORER',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <line x1="8" y1="0" x2="8" y2="3" />
          <line x1="8" y1="13" x2="8" y2="16" />
          <line x1="0" y1="8" x2="3" y2="8" />
          <line x1="13" y1="8" x2="16" y2="8" />
        </svg>
      ),
      onClick: () => {
        useAstroStore.setState({ isTraceMode: false });
        setActiveView('sky');
      },
      isActive: activeView === 'sky' && !isTraceMode,
    },
    {
      id: 'trace',
      label: 'TRACE',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 14L8 8M8 8L14 2M8 8L5 11" strokeLinecap="round" />
          <circle cx="14" cy="2" r="1.5" fill="currentColor" />
          <circle cx="2" cy="14" r="1.5" fill="currentColor" />
        </svg>
      ),
      onClick: () => {
        setIsTraceMode(true);
        setActiveView('sky');
      },
      isActive: (activeView === 'sky' && isTraceMode) || activeView === 'patterns',
    },
    {
      id: 'constellations',
      label: 'LIBRARY',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="4" cy="4" r="2" fill="currentColor" />
          <circle cx="12" cy="5" r="2" fill="currentColor" />
          <circle cx="9" cy="12" r="2" fill="currentColor" />
          <line x1="4" y1="4" x2="12" y2="5" />
          <line x1="12" y1="5" x2="9" y2="12" />
        </svg>
      ),
      onClick: () => {
        setActiveView('constellations');
      },
      isActive: activeView === 'constellations',
    },
    {
      id: 'automataLab',
      label: 'AUTOMATA',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="4" cy="8" r="3" />
          <circle cx="12" cy="8" r="3" />
          <circle cx="12" cy="8" r="1.5" fill="currentColor" />
          <path d="M7 8h2" />
        </svg>
      ),
      onClick: () => {
        setActiveView('automataLab');
      },
      isActive: activeView === 'automataLab',
    },
    {
      id: 'imageLab',
      label: 'IMAGE LAB',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="12" height="12" rx="2" />
          <circle cx="8" cy="8" r="2.5" />
          <circle cx="11.5" cy="4.5" r="0.75" fill="currentColor" />
        </svg>
      ),
      onClick: () => {
        setActiveView('imageLab');
      },
      isActive: activeView === 'imageLab',
    },
    {
      id: 'results',
      label: 'RESULTS',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="3" y1="13" x2="3" y2="9" />
          <line x1="7" y1="13" x2="7" y2="5" />
          <line x1="11" y1="13" x2="11" y2="2" />
        </svg>
      ),
      onClick: () => {
        setActiveView('results');
      },
      isActive: activeView === 'results',
    },
    {
      id: 'tonight',
      label: 'SKY TONIGHT',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.5 1A7.5 7.5 0 1 0 15 9.5 6.5 6.5 0 0 1 6.5 1z" />
        </svg>
      ),
      onClick: () => {
        setActiveView('tonight');
      },
      isActive: activeView === 'tonight',
    },
    {
      id: 'hunt',
      label: 'HUNT MODE',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <circle cx="8" cy="8" r="2" />
          <line x1="8" y1="1" x2="8" y2="4" />
          <line x1="8" y1="12" x2="8" y2="15" />
          <line x1="1" y1="8" x2="4" y2="8" />
          <line x1="12" y1="8" x2="15" y2="8" />
        </svg>
      ),
      onClick: () => {
        setActiveView('hunt');
      },
      isActive: activeView === 'hunt',
    },
    {
      id: 'academic',
      label: 'VIVA MODE',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4l6-2 6 2v7l-6 3-6-3V4z" />
          <line x1="8" y1="2" x2="8" y2="14" />
        </svg>
      ),
      onClick: () => {
        setActiveView('academic');
      },
      isActive: activeView === 'academic',
    },
    {
      id: 'credits',
      label: 'CREDITS',
      icon: (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="6" />
          <line x1="8" y1="7" x2="8" y2="11" />
          <circle cx="8" cy="4.5" r="0.75" fill="currentColor" />
        </svg>
      ),
      onClick: () => {
        setActiveView('credits');
      },
      isActive: activeView === 'credits',
    },
  ];

  return (
    <>
      <aside
        className="left-rail font-mono flex flex-col justify-between shrink-0 p-3 bg-[var(--bg-shell)] border-r border-[var(--bg-tray)] text-[var(--ink-primary)]"
        aria-label="Application Navigation Rail"
      >
        {/* Top Segment: Brand & Omnibar Search */}
        <div className="space-y-3">
          {/* Brand Logo & Name */}
          <button
            onClick={() => setActiveView('sky')}
            className="flex items-center gap-2.5 w-full group text-left cursor-pointer p-1 rounded-[6px] hover:bg-[var(--bg-pill-neutral)] transition-colors"
            title="Costellar Sky Explorer Home"
          >
            {/* 4-Point Cobalt Star / Diamond Icon */}
            <div className="w-7 h-7 rounded-[6px] bg-[var(--signal-cobalt)] flex items-center justify-center border border-[var(--signal-mid)] shadow-none shrink-0 transition-opacity group-hover:opacity-90">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold tracking-tight text-[var(--ink-primary)] text-xs uppercase flex items-center gap-1.5 truncate">
                <span className="tracking-wider">COSTELLAR</span>
                <span className="hud-reticle text-[8px] font-mono uppercase px-1 py-0.5 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-mid)] rounded-[3px] font-semibold shrink-0">
                  DFA
                </span>
              </div>
            </div>
          </button>

          {/* Search Omnibar */}
          <div ref={searchContainerRef} className="relative w-full">
            <div className="relative hud-reticle-4corner w-full">
              <input
                type="text"
                placeholder="SEARCH SKY..."
                aria-label="Search stars and constellations"
                aria-keyshortcuts="Control+K Meta+K"
                aria-expanded={isSearchOpen && !!searchQuery}
                aria-controls="sky-search-results"
                aria-activedescendant={activeSearchIndex >= 0 ? `sky-search-option-${activeSearchIndex}` : undefined}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  setActiveSearchIndex(-1);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                className="w-full bg-[var(--bg-card)] border border-[var(--bg-tray)] focus:border-[var(--signal-cobalt)] rounded-[6px] pl-7 pr-6 py-1.5 text-[10px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none font-mono uppercase tracking-wide transition-colors"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] text-[10px] pointer-events-none">
                ⌕
              </span>
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] text-xs cursor-pointer font-mono"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown floating over content */}
            {isSearchOpen && searchQuery && (
              <div id="sky-search-results" role="listbox" aria-label="Search results" className="absolute top-full left-0 right-[-100px] mt-1 bg-[var(--bg-card)] border border-[var(--signal-surface)] rounded-[8px] shadow-lg overflow-hidden z-50 text-xs max-h-72 overflow-y-auto divide-y divide-[var(--bg-tray)] font-mono">
                {hasResults ? (
                  <>
                    {/* Constellation matches */}
                    {searchResults.constellations.length > 0 && (
                      <div className="p-1">
                        <div className="text-[9px] uppercase font-bold text-[var(--ink-muted)] px-2 py-1 tracking-wider">
                          CONSTELLATIONS
                        </div>
                        {searchResults.constellations.map((c, index) => {
                          const hasDfa = REFERENCE_PATTERNS.some(p => p.constellationId === c.id);
                          return (
                            <button
                              key={c.id}
                              id={`sky-search-option-${index}`}
                              ref={element => { searchOptionRefs.current[index] = element; }}
                              role="option"
                              aria-selected={activeSearchIndex === index}
                              onMouseMove={() => setActiveSearchIndex(index)}
                              onClick={() => handleSelectConstellation(c.id)}
                              className="w-full p-1.5 hover:bg-[var(--bg-card-subtle)] rounded-[4px] text-left flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div className="truncate">
                                <span className="font-semibold text-[var(--ink-primary)] text-[11px]">{c.name}</span>
                                <span className="text-[10px] text-[var(--ink-secondary)] ml-1 uppercase">"{c.englishName}"</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <span className="px-1 py-0.2 bg-[var(--bg-pill-neutral)] text-[9px] text-[var(--ink-secondary)] font-mono rounded uppercase">
                                  {c.id}
                                </span>
                                {hasDfa && (
                                  <span className="px-1 py-0.2 bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] text-[8px] font-bold rounded uppercase">
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
                        <div className="text-[9px] uppercase font-bold text-[var(--ink-muted)] px-2 py-1 tracking-wider">
                          CATALOG STARS
                        </div>
                        {searchResults.stars.map((s, starIndex) => {
                          const index = searchResults.constellations.length + starIndex;
                          return (
                          <button
                            key={s.id}
                            id={`sky-search-option-${index}`}
                            ref={element => { searchOptionRefs.current[index] = element; }}
                            role="option"
                            aria-selected={activeSearchIndex === index}
                            onMouseMove={() => setActiveSearchIndex(index)}
                            onClick={() => handleSelectStar(s.id)}
                            className="w-full p-1.5 hover:bg-[var(--bg-card-subtle)] rounded-[4px] text-left flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <div className="truncate">
                              <span className="font-semibold text-[var(--signal-cobalt)] text-[11px]">{s.proper || s.name}</span>
                              {s.con && (
                                <span className="text-[10px] text-[var(--ink-secondary)] ml-1 font-mono uppercase">
                                  ({s.con})
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-[var(--ink-muted)] font-mono uppercase shrink-0 ml-1">
                              MAG {s.mag.toFixed(1)}
                            </span>
                          </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 text-center text-[var(--ink-muted)] text-[10px] uppercase tracking-wider">
                    NO TARGETS FOUND
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="rail-nav flex flex-col gap-1" aria-label="Main Navigation">
            {navItems.map(item => {
              const isActive = item.isActive;
              return (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full h-8.5 px-2.5 rounded-[6px] text-[11px] font-mono font-semibold uppercase tracking-wider transition-colors flex items-center gap-2.5 cursor-pointer text-left ${
                    isActive
                      ? 'bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border border-[var(--signal-cobalt)] hud-reticle-4corner active'
                      : 'bg-transparent text-[#525866] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-pill-neutral)] hover:hud-reticle border border-transparent'
                  }`}
                >
                  <span className={`${isActive ? 'text-[var(--signal-cobalt)]' : 'text-[var(--ink-muted)]'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--signal-cobalt)] shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Observer location shortcut */}
        <div className="pt-2 border-t border-[var(--bg-tray)] space-y-2 shrink-0">
          {/* Observer Location Pill */}
          <button
            ref={observerTriggerRef}
            onClick={() => setIsObserverOpen(true)}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={isObserverOpen}
            className="w-full p-2 bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] border border-[var(--bg-tray)] hover:border-[var(--signal-mid)] rounded-[6px] text-left transition-colors cursor-pointer font-mono"
            title="Change observer location telemetry"
          >
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 text-[var(--ink-primary)] font-semibold truncate">
                <span className="text-[var(--signal-cobalt)] text-xs">⌖</span>
                <span className="truncate uppercase">{observer.name.split(',')[0]}</span>
              </div>
              <span className="text-[9px] text-[var(--ink-muted)]">EDIT</span>
            </div>
            <div className="text-[9px] text-[var(--ink-muted)] mt-0.5 truncate pl-4">
              {formatObserverCoordinates(observer.latitude, observer.longitude)}
            </div>
          </button>

        </div>
      </aside>

      {/* Observer Location Modal */}
      {isObserverOpen && (
        <ObserverModal
          currentObserver={observer}
          onSelect={obs => {
            setObserver(obs);
            setIsObserverOpen(false);
            requestAnimationFrame(() => observerTriggerRef.current?.focus());
          }}
          onClose={() => {
            setIsObserverOpen(false);
            requestAnimationFrame(() => observerTriggerRef.current?.focus());
          }}
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
  const [validationError, setValidationError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { closeButtonRef.current?.focus(); }, []);

  const trapDialogTab = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const controls = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    ));
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setValidationError('');
      onSelect({
        name: customName || `LAT ${lat.toFixed(2)}°, LON ${lon.toFixed(2)}°`,
        latitude: lat,
        longitude: lon,
      });
    } else {
      setValidationError('Enter a latitude from −90 to 90 and a longitude from −180 to 180.');
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
    <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} onKeyDown={trapDialogTab} role="dialog" aria-modal="true" aria-labelledby="observer-dialog-title" className="hud-reticle-4corner bg-[var(--bg-card)] border border-[var(--card-border)] rounded-[14px] max-w-lg w-full p-6 shadow-none space-y-4 font-mono text-[var(--ink-primary)]">
        <div className="flex items-center justify-between border-b border-[var(--bg-tray)] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-[var(--signal-cobalt)] text-sm">⌖</span>
            <h3 id="observer-dialog-title" className="font-bold text-xs uppercase tracking-wider text-[var(--ink-primary)]">
              OBSERVATION LOCATION // TELEMETRY
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
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
                  className={`text-left p-2.5 rounded-[8px] border text-xs transition-colors cursor-pointer font-mono ${
                    isSelected
                      ? 'bg-[var(--bg-pill-active)] border-[var(--signal-cobalt)] text-[var(--signal-cobalt)]'
                      : 'bg-[var(--bg-card-subtle)] border-[var(--bg-tray)] text-[var(--ink-secondary)] hover:border-[var(--signal-surface)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <div className="font-semibold truncate uppercase">{preset.name}</div>
                  <div className="text-[10px] text-[var(--ink-muted)] mt-0.5">
                    {formatObserverCoordinates(preset.latitude, preset.longitude, 2)}
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
          {validationError && (
            <Alert variant="destructive" className="text-[var(--ink-primary)]">
              <AlertTitle>Coordinates out of range</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
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
