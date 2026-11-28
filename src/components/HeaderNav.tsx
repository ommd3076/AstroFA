import React, { useState, useMemo, useRef, useEffect } from 'react';
import { SearchIcon } from 'lucide-react';
import { useAstroStore } from '../stores/useAstroStore';
import { PRESET_OBSERVERS } from '../astronomy/coordinates';
import { STARS, CONSTELLATIONS, REFERENCE_PATTERNS } from '../data/astroData';
import type { ObserverLocation } from '../types/astronomy';
import { formatObserverCoordinates } from '../utils/format';
import { handlePopupTabKeyDown } from '../utils/dialogFocus';
import { Alert, AlertDescription, AlertTitle } from './ui/space/alert';
import { Button } from './ui/space/button';
import { Input } from './ui/space/input';
import { Kbd, KbdGroup } from './ui/space/kbd';
import {
  Dialog,
  DialogClose,
  DialogCreateHandle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from './ui/space/dialog';
import {
  Command,
  CommandCreateHandle,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
} from './ui/space/command';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from './ui/space/sidebar';

export const HeaderNav: React.FC = () => {
  const activeView = useAstroStore(state => state.activeView);
  const setActiveView = useAstroStore(state => state.setActiveView);
  const observer = useAstroStore(state => state.observer);
  const setObserver = useAstroStore(state => state.setObserver);
  const isTraceMode = useAstroStore(state => state.isTraceMode);
  const setIsTraceMode = useAstroStore(state => state.setIsTraceMode);
  const focusOnStar = useAstroStore(state => state.focusOnStar);
  const focusOnConstellation = useAstroStore(state => state.focusOnConstellation);
  const { isMobile, setOpenMobile } = useSidebar();

  const observerDialogHandle = useMemo(() => DialogCreateHandle(), []);
  const commandDialogHandle = useMemo(() => CommandCreateHandle(), []);
  const [isObserverOpen, setIsObserverOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const observerTriggerRef = useRef<HTMLButtonElement>(null);

  // Catalog command palette shortcut (Ctrl/Cmd+K) & shell button events
  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (document.querySelector('[role="dialog"]') && !isCommandOpen) return;
        event.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    const handleOpenCommand = () => setIsCommandOpen(true);
    const handleOpenObserver = () => setIsObserverOpen(true);

    document.addEventListener('keydown', handleKeys);
    window.addEventListener('costellar:open-command', handleOpenCommand);
    window.addEventListener('costellar:open-observer', handleOpenObserver);
    return () => {
      document.removeEventListener('keydown', handleKeys);
      window.removeEventListener('costellar:open-command', handleOpenCommand);
      window.removeEventListener('costellar:open-observer', handleOpenObserver);
    };
  }, [isCommandOpen]);

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const navGroups = useMemo(
    () => [
      {
        label: 'Observe',
        items: [
          {
            id: 'overview',
            label: 'Overview',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
                <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" />
                <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" />
                <rect x="9" y="9" width="5.5" height="5.5" rx="1" />
              </svg>
            ),
            onClick: () => {
              useAstroStore.setState({ isTraceMode: false });
              setActiveView('overview');
              closeMobileSidebar();
            },
            isActive: activeView === 'overview',
          },
          {
            id: 'sky',
            label: 'Sky Planetarium',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
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
              closeMobileSidebar();
            },
            isActive: activeView === 'sky' && !isTraceMode,
          },
          {
            id: 'tonight',
            label: 'Sky Tonight',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M6.5 1A7.5 7.5 0 1 0 15 9.5 6.5 6.5 0 0 1 6.5 1z" />
              </svg>
            ),
            onClick: () => {
              setActiveView('tonight');
              closeMobileSidebar();
            },
            isActive: activeView === 'tonight',
          },
          {
            id: 'constellations',
            label: 'Catalog (88)',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="4" cy="4" r="2" fill="currentColor" />
                <circle cx="12" cy="5" r="2" fill="currentColor" />
                <circle cx="9" cy="12" r="2" fill="currentColor" />
                <line x1="4" y1="4" x2="12" y2="5" />
                <line x1="12" y1="5" x2="9" y2="12" />
              </svg>
            ),
            onClick: () => {
              setActiveView('constellations');
              closeMobileSidebar();
            },
            isActive: activeView === 'constellations',
          },
        ],
      },
      {
        label: 'Workbench',
        items: [
          {
            id: 'trace',
            label: 'Trace Mode',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M2 14L8 8M8 8L14 2M8 8L5 11" strokeLinecap="round" />
                <circle cx="14" cy="2" r="1.5" fill="currentColor" />
                <circle cx="2" cy="14" r="1.5" fill="currentColor" />
              </svg>
            ),
            onClick: () => {
              setIsTraceMode(true);
              setActiveView('sky');
              closeMobileSidebar();
            },
            isActive: (activeView === 'sky' && isTraceMode) || activeView === 'patterns',
          },
          {
            id: 'results',
            label: 'Results',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <line x1="3" y1="13" x2="3" y2="9" />
                <line x1="7" y1="13" x2="7" y2="5" />
                <line x1="11" y1="13" x2="11" y2="2" />
              </svg>
            ),
            onClick: () => {
              setActiveView('results');
              closeMobileSidebar();
            },
            isActive: activeView === 'results',
          },
          {
            id: 'imageLab',
            label: 'Image Lab',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="2" y="2" width="12" height="12" rx="2" />
                <circle cx="8" cy="8" r="2.5" />
                <circle cx="11.5" cy="4.5" r="0.75" fill="currentColor" />
              </svg>
            ),
            onClick: () => {
              setActiveView('imageLab');
              closeMobileSidebar();
            },
            isActive: activeView === 'imageLab',
          },
          {
            id: 'automataLab',
            label: 'Automata Lab',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="4" cy="8" r="3" />
                <circle cx="12" cy="8" r="3" />
                <circle cx="12" cy="8" r="1.5" fill="currentColor" />
                <path d="M7 8h2" />
              </svg>
            ),
            onClick: () => {
              setActiveView('automataLab');
              closeMobileSidebar();
            },
            isActive: activeView === 'automataLab',
          },
        ],
      },
      {
        label: 'Learn & Reference',
        items: [
          {
            id: 'hunt',
            label: 'Hunt Mode',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
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
              closeMobileSidebar();
            },
            isActive: activeView === 'hunt',
          },
          {
            id: 'academic',
            label: 'Walkthrough',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M2 4l6-2 6 2v7l-6 3-6-3V4z" />
                <line x1="8" y1="2" x2="8" y2="14" />
              </svg>
            ),
            onClick: () => {
              setActiveView('academic');
              closeMobileSidebar();
            },
            isActive: activeView === 'academic',
          },
          {
            id: 'credits',
            label: 'Sources & Credits',
            icon: (
              <svg className="size-4 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="8" cy="8" r="6" />
                <line x1="8" y1="7" x2="8" y2="11" />
                <circle cx="8" cy="4.5" r="0.75" fill="currentColor" />
              </svg>
            ),
            onClick: () => {
              setActiveView('credits');
              closeMobileSidebar();
            },
            isActive: activeView === 'credits',
          },
        ],
      },
    ],
    [activeView, isTraceMode, isMobile, setActiveView, setIsTraceMode]
  );

  // Command search results filtering (Constellations, Stars, Views)
  const commandResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const flatViews = navGroups.flatMap(g =>
      g.items.map(item => ({ ...item, group: g.label }))
    );

    if (!q) {
      return {
        constellations: CONSTELLATIONS.filter(c =>
          REFERENCE_PATTERNS.some(p => p.constellationId === c.id)
        ).slice(0, 4),
        stars: STARS.slice()
          .sort((a, b) => a.mag - b.mag)
          .slice(0, 4),
        views: flatViews.slice(0, 6),
      };
    }

    const matchedCons = CONSTELLATIONS.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.englishName.toLowerCase().includes(q)
    ).slice(0, 6);

    const matchedStars = STARS.filter(s => {
      const proper = s.proper?.toLowerCase() || '';
      const name = s.name.toLowerCase();
      const hr = s.hr ? s.hr.toString() : '';
      return proper.includes(q) || name.includes(q) || hr === q;
    })
      .sort((a, b) => a.mag - b.mag)
      .slice(0, 6);

    const matchedViews = flatViews.filter(
      v => v.label.toLowerCase().includes(q) || v.id.toLowerCase().includes(q)
    );

    return {
      constellations: matchedCons,
      stars: matchedStars,
      views: matchedViews,
    };
  }, [searchQuery, navGroups]);

  const hasCommandMatches =
    commandResults.constellations.length > 0 ||
    commandResults.stars.length > 0 ||
    commandResults.views.length > 0;

  const handleSelectConstellation = (conId: string) => {
    focusOnConstellation(conId);
    setSearchQuery('');
    setIsCommandOpen(false);
    closeMobileSidebar();
    if (activeView !== 'sky') {
      setActiveView('sky');
    }
  };

  const handleSelectStar = (starId: number) => {
    focusOnStar(starId);
    setSearchQuery('');
    setIsCommandOpen(false);
    closeMobileSidebar();
    if (activeView !== 'sky') {
      setActiveView('sky');
    }
  };

  return (
    <>
      <Sidebar
        variant="inset"
        collapsible="icon"
        aria-label="Application Navigation Sidebar"
      >
        <SidebarHeader className="gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                tooltip="Costellar Atlas Home"
                onClick={() => {
                  useAstroStore.setState({ isTraceMode: false });
                  setActiveView('overview');
                  closeMobileSidebar();
                }}
                className="data-[active=true]:bg-sidebar-accent"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[var(--signal-surface)] bg-[var(--bg-pill-active)] text-[var(--signal-mid)]">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                  </svg>
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold tracking-wider text-xs text-[var(--ink-primary)] uppercase">
                    COSTELLAR
                  </span>
                  <span className="truncate text-[11px] font-mono text-[var(--ink-secondary)] uppercase">
                    Observing Atlas
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <CommandDialogTrigger
                handle={commandDialogHandle}
                render={
                  <SidebarMenuButton
                    tooltip="Search stars, constellations & views (Ctrl+K)"
                    className="border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                    aria-label="Search stars and constellations"
                    aria-keyshortcuts="Control+K Meta+K"
                  />
                }
              >
                <SearchIcon className="size-4 shrink-0 text-[var(--ink-muted)]" aria-hidden="true" />
                <span className="truncate text-xs">Search catalog...</span>
                <CommandShortcut className="ml-auto group-data-[collapsible=icon]:hidden">
                  Ctrl K
                </CommandShortcut>
              </CommandDialogTrigger>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          {navGroups.map(group => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[11px] font-mono font-medium uppercase tracking-[0.04em] text-[var(--ink-secondary)]">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map(item => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={item.isActive}
                        tooltip={item.label}
                        onClick={item.onClick}
                        aria-current={item.isActive ? 'page' : undefined}
                        className="text-[12px] font-medium data-[active=true]:bg-[var(--bg-pill-active)] data-[active=true]:text-[var(--ink-primary)] data-[active=true]:border data-[active=true]:border-[var(--signal-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
                      >
                        <span className={item.isActive ? 'text-[var(--signal-mid)]' : 'text-[var(--ink-muted)]'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarSeparator />

        {/* Observer location shortcut bound via Space UI DialogTrigger handle */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DialogTrigger
                handle={observerDialogHandle}
                render={
                  <SidebarMenuButton
                    ref={observerTriggerRef}
                    size="lg"
                    tooltip={`Observer: ${observer.name} (${formatObserverCoordinates(observer.latitude, observer.longitude)})`}
                    className="border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] hover:border-[var(--signal-surface)] text-left"
                    title="Change observer location"
                  />
                }
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[var(--bg-pill-active)] text-[var(--signal-mid)] text-xs font-mono" aria-hidden="true">
                  ⌖
                </span>
                <div className="grid flex-1 text-left leading-tight min-w-0">
                  <span className="truncate text-[11px] font-semibold text-[var(--ink-primary)]">
                    {observer.name.split(',')[0]}
                  </span>
                  <span className="truncate text-[11px] font-mono tabular-nums text-[var(--ink-secondary)]">
                    {formatObserverCoordinates(observer.latitude, observer.longitude)}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--ink-muted)] group-data-[collapsible=icon]:hidden">
                  SITE
                </span>
              </DialogTrigger>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Space UI Command Palette Dialog for Sky Search & Quick Navigation */}
      <CommandDialog
        handle={commandDialogHandle}
        open={isCommandOpen}
        onOpenChange={open => {
          setIsCommandOpen(open);
          if (!open) setSearchQuery('');
        }}
      >
        <CommandDialogPopup
          onKeyDown={e => {
            if (e.key !== 'Escape' && e.key !== 'Tab') {
              e.stopPropagation();
            }
          }}
          className="border-[var(--border-strong)] bg-[var(--bg-card)]"
        >
          <Command
            value={searchQuery}
            onValueChange={setSearchQuery}
            filter={null}
          >
            <CommandInput
              placeholder="Search stars, IAU constellations, HR numbers, or views..."
              aria-label="Search catalog targets and views"
              onKeyDown={e => e.stopPropagation()}
            />
            <CommandPanel className="bg-[var(--bg-tray)]">
              <CommandList className="max-h-80">
                {!hasCommandMatches ? (
                  <div className="py-10 text-center text-xs text-[var(--ink-muted)] font-mono">
                    No matching catalog targets or views found for &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  <>
                    {commandResults.constellations.length > 0 && (
                      <CommandGroup>
                        <CommandGroupLabel>Constellations</CommandGroupLabel>
                        {commandResults.constellations.map(c => {
                          const hasDfa = REFERENCE_PATTERNS.some(p => p.constellationId === c.id);
                          return (
                            <CommandItem
                              key={c.id}
                              value={`con-${c.id}-${c.name}`}
                              onClick={() => handleSelectConstellation(c.id)}
                              className="justify-between"
                            >
                              <div className="truncate">
                                <span className="font-semibold text-[var(--ink-primary)] text-xs">
                                  {c.name}
                                </span>
                                <span className="text-[11px] text-[var(--ink-secondary)] ml-2">
                                  {c.englishName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="px-1.5 py-0.5 bg-[var(--bg-pill-neutral)] text-[10px] text-[var(--ink-secondary)] font-mono rounded uppercase">
                                  {c.id}
                                </span>
                                {hasDfa && (
                                  <span className="px-1.5 py-0.5 bg-[var(--bg-pill-active)] text-[var(--signal-mid)] text-[9px] font-mono font-semibold rounded uppercase">
                                    DFA
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}

                    {commandResults.constellations.length > 0 && commandResults.stars.length > 0 && (
                      <CommandSeparator />
                    )}

                    {commandResults.stars.length > 0 && (
                      <CommandGroup>
                        <CommandGroupLabel>Catalog Stars</CommandGroupLabel>
                        {commandResults.stars.map(s => (
                          <CommandItem
                            key={s.id}
                            value={`star-${s.id}-${s.proper || s.name}`}
                            onClick={() => handleSelectStar(s.id)}
                            className="justify-between"
                          >
                            <div className="truncate">
                              <span className="font-semibold text-[var(--signal-mid)] text-xs">
                                {s.proper || s.name}
                              </span>
                              {s.con && (
                                <span className="text-[10px] text-[var(--ink-secondary)] ml-1.5 font-mono uppercase">
                                  ({s.con})
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[var(--ink-muted)] font-mono tabular-nums uppercase shrink-0">
                              mag {s.mag.toFixed(1)}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}

                    {(commandResults.constellations.length > 0 || commandResults.stars.length > 0) &&
                      commandResults.views.length > 0 && <CommandSeparator />}

                    {commandResults.views.length > 0 && (
                      <CommandGroup>
                        <CommandGroupLabel>Navigation Views</CommandGroupLabel>
                        {commandResults.views.map(v => (
                          <CommandItem
                            key={v.id}
                            value={`view-${v.id}-${v.label}`}
                            onClick={() => {
                              v.onClick();
                              setSearchQuery('');
                              setIsCommandOpen(false);
                            }}
                            className="justify-between"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-[var(--ink-muted)]">{v.icon}</span>
                              <span className="text-xs font-medium text-[var(--ink-primary)]">
                                {v.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--ink-muted)] uppercase">
                              {v.group}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            </CommandPanel>
            <CommandFooter>
              <div className="flex items-center gap-2">
                <KbdGroup>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                </KbdGroup>
                <span>Navigate</span>
                <Kbd>↵</Kbd>
                <span>Focus / Open</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Kbd>Esc</Kbd>
                <span>Close</span>
              </div>
            </CommandFooter>
          </Command>
        </CommandDialogPopup>
      </CommandDialog>

      {/* Space UI Dialog for Observation Location Settings */}
      <ObserverDialog
        handle={observerDialogHandle}
        open={isObserverOpen}
        onOpenChange={setIsObserverOpen}
        finalFocus={observerTriggerRef}
        currentObserver={observer}
        onSelect={obs => {
          setObserver(obs);
          setIsObserverOpen(false);
        }}
      />
    </>
  );
};

interface ObserverDialogProps {
  handle: ReturnType<typeof DialogCreateHandle>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  finalFocus: React.RefObject<HTMLButtonElement | null>;
  currentObserver: ObserverLocation;
  onSelect: (obs: ObserverLocation) => void;
}

const ObserverDialog: React.FC<ObserverDialogProps> = ({
  handle,
  open,
  onOpenChange,
  finalFocus,
  currentObserver,
  onSelect,
}) => {
  return (
    <Dialog handle={handle} open={open} onOpenChange={onOpenChange}>
      {open && (
        <ObserverDialogContent
          finalFocus={finalFocus}
          currentObserver={currentObserver}
          onSelect={onSelect}
        />
      )}
    </Dialog>
  );
};

interface ObserverDialogContentProps {
  finalFocus: React.RefObject<HTMLButtonElement | null>;
  currentObserver: ObserverLocation;
  onSelect: (obs: ObserverLocation) => void;
}

const ObserverDialogContent: React.FC<ObserverDialogContentProps> = ({
  finalFocus,
  currentObserver,
  onSelect,
}) => {
  const [customLat, setCustomLat] = useState(currentObserver.latitude.toString());
  const [customLon, setCustomLon] = useState(currentObserver.longitude.toString());
  const [customName, setCustomName] = useState('Custom Site');
  const [validationError, setValidationError] = useState('');

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setValidationError('');
      onSelect({
        name: customName.trim() || `LAT ${lat.toFixed(2)}°, LON ${lon.toFixed(2)}°`,
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
          setValidationError('');
          onSelect({
            name: `GPS (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            elevation: pos.coords.altitude || 0,
          });
        },
        err => {
          setValidationError(`Geolocation unavailable: ${err.message}`);
        }
      );
    } else {
      setValidationError('Geolocation is not supported by this browser.');
    }
  };

  return (
    <DialogPopup
      finalFocus={finalFocus}
      onKeyDown={handlePopupTabKeyDown}
      className="max-w-lg border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--ink-primary)] font-sans"
    >
      <DialogHeader className="border-b border-[var(--border-subtle)]">
        <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-primary)]">
          <span className="text-[var(--signal-mid)]" aria-hidden="true">⌖</span>
          <span>Observation location settings</span>
        </DialogTitle>
        <DialogDescription className="text-xs text-[var(--ink-secondary)]">
          Select a preset observatory, read browser GPS, or enter custom coordinates.
        </DialogDescription>
      </DialogHeader>

      <DialogPanel className="space-y-4">
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-[var(--ink-secondary)] uppercase tracking-wider">
            Global observatories &amp; sites
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESET_OBSERVERS.map((preset, idx) => {
              const isSelected = preset.name === currentObserver.name;
              return (
                <Button
                  key={idx}
                  variant={isSelected ? 'secondary' : 'outline'}
                  onClick={() => onSelect(preset)}
                  className={`h-auto w-full flex-col items-start justify-start gap-0.5 p-2.5 text-left font-normal ${
                    isSelected
                      ? 'bg-[var(--bg-pill-active)] border-[var(--signal-cobalt)] text-[var(--ink-primary)]'
                      : 'bg-[var(--bg-card-subtle)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--signal-surface)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <div className="font-semibold text-xs truncate w-full">{preset.name}</div>
                  <div className="text-[10px] font-mono tabular-nums text-[var(--ink-muted)]">
                    {formatObserverCoordinates(preset.latitude, preset.longitude, 2)}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <Button
            variant="outline"
            onClick={handleGeolocation}
            className="w-full text-xs font-semibold text-[var(--signal-mid)]"
          >
            <span aria-hidden="true">⌖</span>
            <span>Use browser GPS geolocation</span>
          </Button>
        </div>

        <form id="observer-custom-form" onSubmit={handleApplyCustom} className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
          <div className="text-[11px] font-semibold text-[var(--ink-secondary)] uppercase tracking-wider">
            Custom coordinates
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label htmlFor="observer-custom-name" className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block mb-1">
                Name
              </label>
              <Input
                id="observer-custom-name"
                type="text"
                size="sm"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                placeholder="My location"
              />
            </div>
            <div>
              <label htmlFor="observer-custom-lat" className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block mb-1">
                Lat (−90..90)
              </label>
              <Input
                id="observer-custom-lat"
                type="number"
                step="0.001"
                size="sm"
                className="font-mono tabular-nums"
                value={customLat}
                onChange={e => setCustomLat(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
              />
            </div>
            <div>
              <label htmlFor="observer-custom-lon" className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider block mb-1">
                Lon (−180..180)
              </label>
              <Input
                id="observer-custom-lon"
                type="number"
                step="0.001"
                size="sm"
                className="font-mono tabular-nums"
                value={customLon}
                onChange={e => setCustomLon(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
              />
            </div>
          </div>
          {validationError && (
            <Alert variant="error">
              <AlertTitle>Location notice</AlertTitle>
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
        </form>
      </DialogPanel>

      <DialogFooter className="border-t border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]">
        <DialogClose render={<Button variant="ghost" size="sm" />}>Cancel</DialogClose>
        <Button type="submit" form="observer-custom-form" variant="default" size="sm">
          Apply coordinates
        </Button>
      </DialogFooter>
    </DialogPopup>
  );
};
