import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAstroStore, type AutomataTab } from '../../stores/useAstroStore';
import {
  DFA_MACHINE,
  MINIMIZED_DFA_MACHINE,
  REFERENCE_PATTERNS,
} from '../../data/astroData';
import type { DFA, StateId } from '../../automata/types';
import { simulateDfa } from '../../automata/simulate';
import { Alert, AlertDescription } from '../../components/ui/space/alert';
import { Button } from '../../components/ui/space/button';
import { Input } from '../../components/ui/space/input';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from '../../components/ui/space/select';
import { Switch } from '../../components/ui/space/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/space/table';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/space/toggle-group';
import {
  FRAME_10_DFA,
  FRAME_10_METRICS,
  FRAME_10_NODE_POSITIONS,
  FRAME_10_DEFAULT_INPUT,
} from './referenceFixture';

interface AutomataInstrumentPanelProps {
  onOpenTab: (tab: AutomataTab) => void;
  onOpenExport?: () => void;
}

type MachineRockerChoice = 'dfa' | 'minimized';
type FixtureSource = 'live' | 'frame10';

export const AutomataInstrumentPanel: React.FC<AutomataInstrumentPanelProps> = ({
  onOpenTab,
  onOpenExport,
}) => {
  const {
    simulatorSymbols,
    simulatorStep,
  } = useAstroStore();

  // Machine Rocker & Fixture Selection
  const [rockerChoice, setRockerChoice] = useState<MachineRockerChoice>('dfa');
  const [fixtureSource, setFixtureSource] = useState<FixtureSource>('live');

  // Selected State for synchronized inspection across Graph, Table & Formal Def
  const [selectedStateId, setSelectedStateId] = useState<StateId | null>(null);

  // Selected Constellation for DFA path highlighting
  const [highlightConstellation, setHighlightConstellation] = useState<string>('ALL');

  // Simulator local state
  const [stepMode, setStepMode] = useState<boolean>(true);
  const [localInputRaw, setLocalInputRaw] = useState<string>(() => {
    return simulatorSymbols.length > 0
      ? simulatorSymbols.join(' ')
      : (REFERENCE_PATTERNS.find(p => p.id === 'Cas_fwd') || REFERENCE_PATTERNS[0]).encodedSymbols.join(' ');
  });
  const [localStep, setLocalStep] = useState<number>(simulatorStep);
  const [localIsPlaying, setLocalIsPlaying] = useState<boolean>(false);

  // Graph Pan & Zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [showAllGraphStates, setShowAllGraphStates] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Determine active machine
  const activeMachine: DFA = useMemo(() => {
    if (fixtureSource === 'frame10') {
      return FRAME_10_DFA;
    }
    if (rockerChoice === 'minimized') {
      return MINIMIZED_DFA_MACHINE;
    }
    return DFA_MACHINE;
  }, [fixtureSource, rockerChoice]);

  // Handle switching fixture source
  const handleSelectFixture = (source: FixtureSource) => {
    setLocalIsPlaying(false);
    setFixtureSource(source);
    if (source === 'frame10') {
      setLocalInputRaw(FRAME_10_DEFAULT_INPUT);
      setLocalStep(0);
    } else {
      const defaultPattern = REFERENCE_PATTERNS.find(p => p.id === 'Cas_fwd') || REFERENCE_PATTERNS[0];
      setLocalInputRaw(simulatorSymbols.length > 0 ? simulatorSymbols.join(' ') : defaultPattern.encodedSymbols.join(' '));
      setLocalStep(0);
    }
  };

  // Parse input string into symbol array
  const parsedInputSymbols: string[] = useMemo(() => {
    const raw = localInputRaw.trim();
    if (!raw) return [];
    if (fixtureSource === 'frame10') {
      // Allow char by char or space separated
      if (raw.includes(' ')) {
        return raw.split(/\s+/).filter(Boolean);
      }
      return raw.split('');
    }
    return raw.split(/[\s,]+/).filter(Boolean);
  }, [localInputRaw, fixtureSource]);

  const invalidSymbols = useMemo(
    () => [...new Set(parsedInputSymbols.filter(symbol => !activeMachine.alphabet.includes(symbol)))],
    [parsedInputSymbols, activeMachine],
  );
  const hasValidInput = invalidSymbols.length === 0;

  // Run simulation over activeMachine
  const simResult = useMemo(() => {
    if (parsedInputSymbols.length === 0) {
      return {
        accepted: activeMachine.acceptingStates.includes(activeMachine.initialState),
        steps: [],
        finalState: activeMachine.initialState,
        finalStateName: activeMachine.initialState,
        failureReason: undefined,
      };
    }
    return simulateDfa(activeMachine, parsedInputSymbols);
  }, [activeMachine, parsedInputSymbols]);

  // Playback timer for simulator
  useEffect(() => {
    if (!localIsPlaying) return;
    const interval = setInterval(() => {
      setLocalStep(prev => {
        if (prev < simResult.steps.length) {
          return prev + 1;
        } else {
          setLocalIsPlaying(false);
          return prev;
        }
      });
    }, 700);
    return () => clearInterval(interval);
  }, [localIsPlaying, simResult.steps.length]);

  // Current simulation step & state
  const currentSimStep = localStep > 0 && localStep <= simResult.steps.length ? simResult.steps[localStep - 1] : null;
  const currentSimStateId = currentSimStep ? currentSimStep.nextState : activeMachine.initialState;

  // Keep large live machines readable by showing a labelled window around the
  // current input trace. The full graph is one click away and remains the same
  // active machine; no fixture data is substituted.
  const graphVisibleStateIds = useMemo(() => {
    const allStateIds = new Set(activeMachine.states.map(state => state.id));
    if (fixtureSource === 'frame10' || showAllGraphStates || activeMachine.states.length <= 18) {
      return allStateIds;
    }

    const windowSize = 10;
    const windowStart = Math.max(0, Math.min(localStep - 5, simResult.steps.length - windowSize));
    const visibleIds = new Set<StateId>();
    if (windowStart === 0 || simResult.steps.length === 0) visibleIds.add(activeMachine.initialState);
    simResult.steps.slice(windowStart, windowStart + windowSize).forEach(step => {
      visibleIds.add(step.currentState);
      visibleIds.add(step.nextState);
    });
    if (selectedStateId && allStateIds.has(selectedStateId)) visibleIds.add(selectedStateId);
    return visibleIds;
  }, [activeMachine, fixtureSource, localStep, selectedStateId, showAllGraphStates, simResult.steps]);

  const graphStates = useMemo(
    () => activeMachine.states.filter(state => graphVisibleStateIds.has(state.id)),
    [activeMachine, graphVisibleStateIds],
  );

  // Active state for highlighting
  const highlightedStateId = selectedStateId || currentSimStateId;

  // Compute metric numbers
  const patternCount = fixtureSource === 'frame10' ? FRAME_10_METRICS.patternCount : REFERENCE_PATTERNS.length;
  const alphabetSize = fixtureSource === 'frame10' ? FRAME_10_METRICS.alphabetSize : activeMachine.alphabet.length;
  const dfaStateCount = fixtureSource === 'frame10' ? FRAME_10_METRICS.dfaStates : DFA_MACHINE.states.length;
  const minStateCount = fixtureSource === 'frame10' ? FRAME_10_METRICS.minimizedStates : MINIMIZED_DFA_MACHINE.states.length;

  // Top metric tiles matching Frame 10
  const metricCards = [
    {
      label: 'PATTERN COUNT',
      value: patternCount,
      sub: fixtureSource === 'live' ? 'CANONICAL ASTERISMS' : 'BENCHMARK SUITE',
    },
    {
      label: 'ALPHABET SIZE | Σ |',
      value: alphabetSize,
      sub: fixtureSource === 'live' ? 'QUANTIZED FEATURES' : 'BINARY TOKENS',
    },
    {
      label: 'DFA STATES',
      value: dfaStateCount,
      sub: fixtureSource === 'live' ? 'DETERMINIZED STATES' : 'REFERENCE MODEL',
    },
    {
      label: 'MINIMIZED STATES',
      value: minStateCount,
      sub: fixtureSource === 'live' ? 'MYHILL-NERODE CLASSES' : 'MINIMAL QUOTIENT',
    },
  ];

  // Graph Node Positions
  const nodePositions = useMemo(() => {
    if (fixtureSource === 'frame10') {
      return FRAME_10_NODE_POSITIONS;
    }

    // BFS depth assignment for live machines
    const depths = new Map<StateId, number>();
    const layoutStartState = graphVisibleStateIds.has(activeMachine.initialState)
      ? activeMachine.initialState
      : graphStates[0]?.id;
    if (layoutStartState) depths.set(layoutStartState, 0);
    const queue: StateId[] = layoutStartState ? [layoutStartState] : [];
    const adj = new Map<StateId, StateId[]>();

    for (const t of activeMachine.transitions) {
      if (!graphVisibleStateIds.has(t.from) || !graphVisibleStateIds.has(t.to)) continue;
      if (!adj.has(t.from)) adj.set(t.from, []);
      adj.get(t.from)!.push(t.to);
    }

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const d = depths.get(curr)!;
      for (const to of adj.get(curr) || []) {
        if (!depths.has(to)) {
          depths.set(to, d + 1);
          queue.push(to);
        }
      }
    }

    // Group the visible graph window by layer so a focused trace does not keep
    // the spacing of dozens of hidden states.
    const layers: Record<number, StateId[]> = {};
    const deepestReachableDepth = Math.max(0, ...depths.values());
    for (const s of graphStates) {
      const d = depths.get(s.id) ?? deepestReachableDepth;
      if (!layers[d]) layers[d] = [];
      layers[d].push(s.id);
    }

    const pos: Record<StateId, { x: number; y: number }> = {};
    const depthKeys = Object.keys(layers).map(Number).sort((a, b) => a - b);
    const maxDepth = Math.max(...depthKeys.filter(k => k < 90), 1);

    const svgWidth = 720;
    const svgHeight = 280;

    depthKeys.forEach(d => {
      const stateList = layers[d];
      const x = 90 + (d / (maxDepth + 0.5)) * (svgWidth - 160);
      const n = stateList.length;
      stateList.forEach((stId, idx) => {
        const y = n === 1 ? svgHeight / 2 : 40 + ((idx + 0.5) / n) * (svgHeight - 80);
        pos[stId] = { x, y };
      });
    });

    return pos;
  }, [fixtureSource, activeMachine, graphStates, graphVisibleStateIds]);

  // Constellation path states
  const constellationPathStateIds = useMemo(() => {
    if (highlightConstellation === 'ALL') return null;
    const pat = REFERENCE_PATTERNS.find(p => p.constellationId === highlightConstellation);
    if (!pat) return null;
    const res = simulateDfa(activeMachine, pat.encodedSymbols);
    const set = new Set<StateId>([activeMachine.initialState]);
    res.steps.forEach(st => set.add(st.nextState));
    return set;
  }, [highlightConstellation, activeMachine]);

  // Transition Table lookup
  const tableMatrix = useMemo(() => {
    const map = new Map<string, StateId>();
    for (const t of activeMachine.transitions) {
      map.set(`${t.from}:::${t.symbol}`, t.to);
    }
    return map;
  }, [activeMachine]);

  // Visible Alphabet for transition table
  const tableAlphabet = useMemo(() => {
    if (fixtureSource === 'frame10') {
      return ['0', '1'];
    }
    return activeMachine.alphabet.slice(0, 6);
  }, [fixtureSource, activeMachine]);

  // Visible States for transition table
  const tableStates = useMemo(() => {
    if (fixtureSource === 'frame10') {
      return activeMachine.states;
    }
    const prioritized = [
      activeMachine.states.find(state => state.id === activeMachine.initialState),
      activeMachine.states.find(state => state.id === currentSimStateId),
      ...activeMachine.states.filter(state => state.isAccepting),
      ...activeMachine.states,
    ].filter((state): state is (typeof activeMachine.states)[number] => Boolean(state));
    return [...new Map(prioritized.map(state => [state.id, state])).values()].slice(0, 8);
  }, [fixtureSource, activeMachine, currentSimStateId]);

  // Handle Graph Reset
  const handleResetGraph = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setLocalStep(0);
    setLocalIsPlaying(false);
  };

  // Handle Run / Pause
  const handleToggleRun = () => {
    if (!hasValidInput) return;
    if (stepMode) {
      setLocalIsPlaying(false);
      setLocalStep(prev => Math.min(simResult.steps.length, prev + 1));
      return;
    }
    if (localIsPlaying) {
      setLocalIsPlaying(false);
    } else {
      if (localStep >= simResult.steps.length) {
        setLocalStep(0);
      }
      setLocalIsPlaying(true);
    }
  };

  const handleStepBack = () => {
    setLocalIsPlaying(false);
    setLocalStep(prev => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setLocalIsPlaying(false);
    setLocalStep(prev => Math.min(simResult.steps.length, prev + 1));
  };

  return (
    <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3.5 bg-[var(--bg-shell)] text-[var(--ink-primary)] font-sans overflow-y-auto overflow-x-hidden">
      {/* Compact inline machine summary telemetry bar (no 4 boxed HUD tiles) */}
      <dl className="atlas-surface rounded-xl px-4 py-2.5 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 shrink-0">
        {metricCards.map((m, idx) => (
          <div key={idx} className="flex items-baseline justify-between gap-2">
            <dt className="text-[10px] font-mono font-semibold tracking-wider text-[var(--ink-muted)] uppercase">
              {m.label}
            </dt>
            <dd className="flex items-baseline gap-1.5 font-mono tabular-nums">
              <strong className="text-lg font-bold text-[var(--ink-primary)]">{m.value}</strong>
              <span className="hidden xl:inline text-[9px] text-[var(--ink-muted)] uppercase">{m.sub}</span>
            </dd>
          </div>
        ))}
      </dl>

      {/* =========================================================================
          ROW 2: CENTER BODY (AUTOMATA LAB GRAPH CARD + FORMAL DEFINITION CARD)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 shrink-0">
        {/* CENTER LEFT: AUTOMATA LAB GRAPH CARD (~66% / 8 COLS) */}
        <div className="lg:col-span-8 atlas-surface p-4 rounded-xl flex flex-col gap-2.5 min-h-[390px] shadow-none">
          {/* Header Row: Title, Rocker Switch, Reset, Expand */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" aria-hidden="true" />
              <h2 className="text-xs font-bold font-mono tracking-widest uppercase text-[var(--ink-primary)]">
                AUTOMATA LAB
              </h2>

              {/* Fixture Toggle: Live Engine vs Frame 10 Benchmark */}
              <ToggleGroup
                aria-label="Automaton fixture source"
                size="sm"
                value={[fixtureSource]}
                onValueChange={vals => {
                  const next = vals.find(v => v !== fixtureSource) ?? vals[0];
                  if (next === 'live' || next === 'frame10') handleSelectFixture(next);
                }}
                className="ml-2 bg-[var(--bg-card-subtle)] rounded-md p-0.5 border border-[var(--border-subtle)] gap-0.5"
              >
                <ToggleGroupItem
                  value="live"
                  className="h-6 px-2 text-[9px] font-mono font-semibold uppercase tracking-wider data-pressed:bg-primary data-pressed:text-primary-foreground"
                  title="Live Determinized/Minimized Constellation Engine"
                >
                  LIVE ENGINE
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="frame10"
                  className="h-6 px-2 text-[9px] font-mono font-semibold uppercase tracking-wider data-pressed:bg-primary data-pressed:text-primary-foreground"
                  title="Frame 10 Benchmark Reference Model"
                >
                  FRAME 10 REF
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center gap-2">
              {/* Rocker Switch: NFA | DFA | MINIMIZED */}
              <div role="group" aria-label="Automaton view mode" className="flex items-center bg-[var(--bg-card-subtle)] rounded-md p-0.5 border border-[var(--border-subtle)] gap-0.5">
                {(['nfa', 'dfa', 'minimized'] as const).map(choice => {
                  const isActive = choice !== 'nfa' && rockerChoice === choice && fixtureSource === 'live';
                  return (
                    <Button
                      key={choice}
                      variant={isActive ? 'default' : 'ghost'}
                      size="xs"
                      onClick={() => {
                        if (choice === 'nfa') {
                          onOpenTab('nfa');
                          return;
                        }
                        handleSelectFixture('live');
                        setRockerChoice(choice);
                      }}
                      title={choice === 'nfa' ? 'Open the epsilon-NFA lesson' : `Show the ${choice === 'minimized' ? 'minimized DFA' : 'original DFA'}`}
                      className="h-6 px-2.5 text-[10px] font-mono font-bold uppercase tracking-wider"
                    >
                      {choice === 'nfa' ? 'ε-NFA' : choice.toUpperCase()}
                    </Button>
                  );
                })}
              </div>

              {/* Reset Graph Button */}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleResetGraph}
                title="Reset Graph Zoom & Simulator"
                aria-label="Reset graph zoom and simulator"
              >
                ⟳
              </Button>

              {/* Expand Full Tab View */}
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => onOpenTab(rockerChoice)}
                title="Expand Full Screen Teaching View"
                aria-label="Expand full screen teaching view"
              >
                ⛶
              </Button>

              {/* Export Suite Quick Action */}
              {onOpenExport && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={onOpenExport}
                  className="text-[var(--signal-mid)] font-bold"
                  title="Open Export Suite"
                  aria-label="Open Export Suite"
                >
                  ↗
                </Button>
              )}
            </div>
          </div>

          {/* Graph Sub-toolbar (Constellation Filter in Live Mode) */}
          {fixtureSource === 'live' && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[var(--ink-secondary)] px-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold uppercase">TRACE PATH:</span>
                <Select
                  value={highlightConstellation}
                  onValueChange={val => {
                    if (val) setHighlightConstellation(val);
                  }}
                >
                  <SelectTrigger size="sm" aria-label="Filter traced constellation path" className="w-auto min-w-[170px] h-7 text-[10px] font-mono uppercase">
                    <SelectValue>
                      {val => {
                        if (val === 'ALL') return 'ALL MACHINE STATES';
                        if (val === 'Ori') return 'ORION (ORI)';
                        if (val === 'Cas') return 'CASSIOPEIA (CAS)';
                        if (val === 'UMa') return 'URSA MAJOR (BIG DIPPER)';
                        if (val === 'Cyg') return 'CYGNUS (NORTHERN CROSS)';
                        return String(val);
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="ALL" className="text-xs font-mono">ALL MACHINE STATES</SelectItem>
                    <SelectItem value="Ori" className="text-xs font-mono">ORION (ORI)</SelectItem>
                    <SelectItem value="Cas" className="text-xs font-mono">CASSIOPEIA (CAS)</SelectItem>
                    <SelectItem value="UMa" className="text-xs font-mono">URSA MAJOR (BIG DIPPER)</SelectItem>
                    <SelectItem value="Cyg" className="text-xs font-mono">CYGNUS (NORTHERN CROSS)</SelectItem>
                  </SelectPopup>
                </Select>
              </div>
              <span className="text-[9px] text-[var(--ink-muted)] uppercase font-semibold">
                DRAG TO PAN • SCROLL TO ZOOM • CLICK NODE TO INSPECT
              </span>
            </div>
          )}

          {fixtureSource === 'live' && activeMachine.states.length > 18 && (
            <div className="flex items-center justify-between px-1 text-[9px] font-mono uppercase tracking-wider text-[var(--ink-muted)]">
              <span>{showAllGraphStates ? 'FULL MACHINE' : `TRACE WINDOW / ${graphStates.length} OF ${activeMachine.states.length} STATES`}</span>
              <Button
                variant="link"
                size="xs"
                onClick={() => setShowAllGraphStates(value => !value)}
                aria-pressed={showAllGraphStates}
                className="h-auto p-0 text-[9px] font-bold text-[var(--signal-mid)]"
              >
                {showAllGraphStates ? 'FOCUS TRACE' : `SHOW ALL ${activeMachine.states.length}`}
              </Button>
            </div>
          )}
          {/* Interactive Automaton SVG Graph */}
          <div className="flex-1 min-h-[280px] bg-[var(--bg-viewport)] rounded-lg border border-[var(--border-subtle)] relative overflow-hidden flex items-center justify-center">
            <svg
              viewBox="0 0 740 310"
              className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
              style={{
                transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                transformOrigin: 'center center',
              }}
              onPointerDown={e => {
                isDraggingRef.current = true;
                dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={e => {
                if (!isDraggingRef.current) return;
                setPan({
                  x: e.clientX - dragStartRef.current.x,
                  y: e.clientY - dragStartRef.current.y,
                });
              }}
              onPointerUp={() => {
                isDraggingRef.current = false;
              }}
              onPointerCancel={() => {
                isDraggingRef.current = false;
              }}
              onWheel={e => {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 1.1 : 0.9;
                setZoom(z => Math.min(2.5, Math.max(0.6, z * delta)));
              }}
            >
              <defs>
                {/* Soft Periwinkle Arrowhead Marker */}
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#8FA3FF" />
                </marker>
                {/* Entry Arrowhead Marker */}
                <marker
                  id="entry-arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#A8B8FF" />
                </marker>
              </defs>

              {/* Initial State Entry Arrow */}
              {nodePositions[activeMachine.initialState] && (
                <g>
                  <line
                    x1={nodePositions[activeMachine.initialState].x - 55}
                    y1={nodePositions[activeMachine.initialState].y}
                    x2={nodePositions[activeMachine.initialState].x - 26}
                    y2={nodePositions[activeMachine.initialState].y}
                    stroke="#A8B8FF"
                    strokeWidth="2"
                    markerEnd="url(#entry-arrowhead)"
                  />
                  <text
                    x={nodePositions[activeMachine.initialState].x - 65}
                    y={nodePositions[activeMachine.initialState].y - 6}
                    fill="#B5B2A9"
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                    fontWeight="bold"
                  >
                    START
                  </text>
                </g>
              )}

              {/* Transitions (Edges) */}
              {activeMachine.transitions.filter(t => graphVisibleStateIds.has(t.from) && graphVisibleStateIds.has(t.to)).map((t, idx) => {
                const src = nodePositions[t.from];
                const dst = nodePositions[t.to];
                if (!src || !dst) return null;

                const isConstellationPathActive = constellationPathStateIds
                  ? constellationPathStateIds.has(t.from) && constellationPathStateIds.has(t.to)
                  : true;
                const isCurrentTransition = currentSimStep?.currentState === t.from && currentSimStep?.inputSymbol === t.symbol && currentSimStep?.nextState === t.to;
                const isPathActive = isConstellationPathActive && (!currentSimStep || isCurrentTransition);

                // Self loop transition
                if (t.from === t.to) {
                  return (
                    <g key={`loop-${idx}`} opacity={isPathActive ? 1 : 0.35}>
                      <path
                        d={`M ${src.x - 12} ${src.y - 20} C ${src.x - 22} ${src.y - 65}, ${src.x + 22} ${src.y - 65}, ${src.x + 12} ${src.y - 20}`}
                        fill="none"
                        stroke="#8FA3FF"
                        strokeWidth="1.75"
                        markerEnd="url(#arrowhead)"
                      />
                      <rect
                        x={src.x - 8}
                        y={src.y - 70}
                        width="16"
                        height="14"
                        rx="3"
                        fill="#151519"
                        stroke="#2A2A32"
                        strokeWidth="1"
                      />
                      <text
                        x={src.x}
                        y={src.y - 59}
                        textAnchor="middle"
                        fill="#A8B8FF"
                        fontSize="10"
                        fontFamily="IBM Plex Mono, monospace"
                        fontWeight="bold"
                      >
                        {t.symbol}
                      </text>
                    </g>
                  );
                }

                // Directed Transition between two different states
                const dx = dst.x - src.x;
                const dy = dst.y - src.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 1) return null;

                const nodeRadius = 24;
                const startX = src.x + (dx / dist) * nodeRadius;
                const startY = src.y + (dy / dist) * nodeRadius;
                const endX = dst.x - (dx / dist) * (nodeRadius + 4);
                const endY = dst.y - (dy / dist) * (nodeRadius + 4);

                // Check if reverse edge exists, curve slightly if bidirectional
                const isBidirectional = activeMachine.transitions.some(
                  other => other.from === t.to && other.to === t.from
                );

                let pathD = `M ${startX} ${startY} L ${endX} ${endY}`;
                let labelX = (startX + endX) / 2;
                let labelY = (startY + endY) / 2 - 8;

                if (isBidirectional || Math.abs(dy) > 20) {
                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;
                  const normX = -dy / dist;
                  const normY = dx / dist;
                  const curveOffset = isBidirectional ? 22 : 12;
                  const ctrlX = midX + normX * curveOffset;
                  const ctrlY = midY + normY * curveOffset;
                  pathD = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
                  labelX = ctrlX;
                  labelY = ctrlY - 6;
                }

                return (
                  <g key={`trans-${idx}`} opacity={isPathActive ? 1 : 0.35}>
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#8FA3FF"
                      strokeWidth="1.75"
                      markerEnd="url(#arrowhead)"
                    />
                    <rect
                      x={labelX - 10}
                      y={labelY - 9}
                      width="20"
                      height="14"
                      rx="3"
                      fill="#151519"
                      stroke="#2A2A32"
                      strokeWidth="0.8"
                    />
                    <text
                      x={labelX}
                      y={labelY + 2}
                      textAnchor="middle"
                      fill="#A8B8FF"
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                      fontWeight="bold"
                    >
                      {t.symbol}
                    </text>
                  </g>
                );
              })}

              {/* State Nodes */}
              {graphStates.map(s => {
                const pos = nodePositions[s.id];
                if (!pos) return null;

                const isAccepting = activeMachine.acceptingStates.includes(s.id);
                const isSelected = s.id === highlightedStateId;
                const isCurrentSim = s.id === currentSimStateId;

                return (
                  <g
                    key={s.id}
                    className="cursor-pointer outline-none"
                    role="button"
                    tabIndex={0}
                    aria-label={`${s.name}, state ${s.id}${isAccepting ? ', accepting' : ''}${s.isInitial ? ', initial' : ''}`}
                    aria-pressed={selectedStateId === s.id}
                    onClick={() => setSelectedStateId(s.id)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedStateId(s.id);
                      }
                    }}
                  >
                    {/* Selected / Current Simulation Ring */}
                    {(isSelected || isCurrentSim) && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="31"
                        fill="none"
                        stroke="#F3F1EB"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* Double Ring for Accepting States (Frame 10 canonical rule) */}
                    {isAccepting && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="27"
                        fill="none"
                        stroke="#8FA3FF"
                        strokeWidth="2"
                      />
                    )}

                    {/* Inner Node Circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="22"
                      fill={isAccepting ? '#8FA3FF' : '#1B1B20'}
                      stroke="#A8B8FF"
                      strokeWidth="2"
                    />

                    {/* Node State Label */}
                    <text
                      x={pos.x}
                      y={pos.y + 4.5}
                      textAnchor="middle"
                      fill={isAccepting ? '#0B0B10' : '#F3F1EB'}
                      fontSize="12"
                      fontFamily="IBM Plex Mono, monospace"
                      fontWeight="bold"
                    >
                      {s.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* CENTER RIGHT: FORMAL DEFINITION CARD (~34% / 4 COLS) */}
        <div className="lg:col-span-4 atlas-surface p-4 rounded-xl flex flex-col justify-between gap-3 min-h-[390px] shadow-none">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[var(--ink-primary)]">
                FORMAL DEFINITION
              </h3>
              <Button
                variant="link"
                size="xs"
                onClick={() => onOpenTab('formal')}
                className="h-auto p-0 text-[10px] font-mono text-[var(--signal-mid)] uppercase tracking-wider font-semibold"
              >
                TUPLE DETAIL ↗
              </Button>
            </div>

            {/* Canonical Tuple Formula Pill Box */}
            <div className="py-2.5 px-3 bg-[var(--bg-viewport)] rounded-lg border border-[var(--border-subtle)] text-center">
              <div className="text-base font-mono font-medium text-[var(--ink-primary)] tracking-widest">
                M = (Q, Σ, δ, q₀, F)
              </div>
            </div>

            {/* Formal Definition Rows */}
            <div className="space-y-2 text-[11px] font-mono">
              {/* Q: Set of States */}
              <div className="flex items-start justify-between py-1 border-b border-[var(--border-subtle)] gap-2">
                <span className="font-bold text-[var(--ink-secondary)] shrink-0 w-8">Q</span>
                <span className="text-[var(--ink-secondary)] shrink-0">=</span>
                <div className="flex-1 text-right text-[var(--ink-primary)] truncate">
                  <span title={`{${activeMachine.states.map(state => state.id).join(', ')}}`}>
                    {`{${activeMachine.states.slice(0, 6).map(s => s.id).join(', ')}${activeMachine.states.length > 6 ? ', …' : ''}} (|Q|=${activeMachine.states.length})`}
                  </span>
                </div>
              </div>

              {/* Σ: Finite Alphabet */}
              <div className="flex items-start justify-between py-1 border-b border-[var(--border-subtle)] gap-2">
                <span className="font-bold text-[var(--ink-secondary)] shrink-0 w-8">Σ</span>
                <span className="text-[var(--ink-secondary)] shrink-0">=</span>
                <div className="flex-1 text-right text-[var(--ink-primary)] truncate">
                  <span title={`{${activeMachine.alphabet.join(', ')}}`}>
                    {`{${activeMachine.alphabet.slice(0, 5).join(', ')}${activeMachine.alphabet.length > 5 ? ', …' : ''}} (|Σ|=${activeMachine.alphabet.length})`}
                  </span>
                </div>
              </div>

              {/* δ: Transition Mapping Signature */}
              <div className="flex items-start justify-between py-1 border-b border-[var(--border-subtle)] gap-2">
                <span className="font-bold text-[var(--ink-secondary)] shrink-0 w-8">δ</span>
                <span className="text-[var(--ink-secondary)] shrink-0">:</span>
                <div className="flex-1 text-right text-[var(--ink-primary)]">
                  Q × Σ → Q
                </div>
              </div>

              {/* q0: Initial Start State */}
              <div className="flex items-start justify-between py-1 border-b border-[var(--border-subtle)] gap-2">
                <span className="font-bold text-[var(--ink-secondary)] shrink-0 w-8">q₀</span>
                <span className="text-[var(--ink-secondary)] shrink-0">=</span>
                <div className="flex-1 text-right text-[var(--signal-mid)] font-bold">
                  {activeMachine.initialState}
                </div>
              </div>

              {/* F: Set of Accepting Final States */}
              <div className="flex items-start justify-between py-1 gap-2">
                <span className="font-bold text-[var(--ink-secondary)] shrink-0 w-8">F</span>
                <span className="text-[var(--ink-secondary)] shrink-0">=</span>
                <div className="flex-1 text-right text-[var(--signal-mid)] font-bold truncate">
                  <span title={`{${activeMachine.acceptingStates.join(', ')}}`}>
                    {`{${activeMachine.acceptingStates.slice(0, 4).join(', ')}${activeMachine.acceptingStates.length > 4 ? ', …' : ''}} (|F|=${activeMachine.acceptingStates.length})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active State Metadata Box */}
          {selectedStateId && (
            <div className="p-2.5 bg-[var(--bg-card-subtle)] rounded-lg border border-[var(--border-subtle)] text-[10px] font-mono space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-secondary)] font-semibold uppercase">INSPECTED STATE:</span>
                <span className="text-[var(--signal-mid)] font-bold">{selectedStateId}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-[var(--ink-muted)]">
                <span>ACCEPTING:</span>
                <span className={activeMachine.acceptingStates.includes(selectedStateId) ? 'text-emerald-400 font-bold' : ''}>
                  {activeMachine.acceptingStates.includes(selectedStateId) ? 'YES (TERMINAL)' : 'NO (INTERMEDIATE)'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          ROW 3: LOWER DECK (TRANSITION TABLE CARD + STRING SIMULATOR CARD)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 shrink-0">
        {/* LOWER LEFT: TRANSITION TABLE (δ) */}
        <div className="lg:col-span-5 atlas-surface p-3.5 rounded-xl flex flex-col gap-2 min-h-[300px] shadow-none">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <h3 className="text-xs font-bold font-mono tracking-widest uppercase text-[var(--ink-primary)]">
              TRANSITION PREVIEW · δ
            </h3>
            <Button
              variant="link"
              size="xs"
              onClick={() => onOpenTab('table')}
              className="h-auto p-0 text-[10px] font-mono text-[var(--signal-mid)] uppercase tracking-wider font-semibold"
            >
              OPEN FULL TABLE ↗
            </Button>
          </div>

          <p className="text-[11px] text-[var(--ink-muted)]">
            Showing {tableStates.length} of {activeMachine.states.length} states and {tableAlphabet.length} of {activeMachine.alphabet.length} symbols. The full table includes every transition.
          </p>

          {/* Table Container with Space UI Table */}
          <div className="flex-1 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-viewport)] overflow-auto max-h-[240px]">
            <Table className="text-[11px] font-mono">
              <TableHeader className="sticky top-0 bg-[var(--bg-card-subtle)] z-10">
                <TableRow>
                  <TableHead className="py-2 px-3 font-bold uppercase tracking-wider">STATE</TableHead>
                  {tableAlphabet.map(sym => (
                    <TableHead key={sym} className="py-2 px-2.5 font-bold uppercase tracking-wider text-center">
                      {sym}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableStates.map(s => {
                  const isSelected = s.id === highlightedStateId;
                  const isAccepting = activeMachine.acceptingStates.includes(s.id);
                  const isInitial = s.id === activeMachine.initialState;

                  return (
                    <TableRow
                      key={s.id}
                      onClick={() => setSelectedStateId(s.id)}
                      className={`cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--bg-pill-active)] font-bold text-[var(--signal-mid)]'
                          : 'hover:bg-[var(--bg-card-subtle)] text-[var(--ink-primary)]'
                      }`}
                    >
                      <TableCell className="py-1.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          {isInitial && <span className="text-[var(--signal-mid)]">→</span>}
                          <span>{s.id}</span>
                          {isAccepting && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-primary text-primary-foreground font-semibold">
                              F
                            </span>
                          )}
                        </span>
                      </TableCell>
                      {tableAlphabet.map(sym => {
                        const target = tableMatrix.get(`${s.id}:::${sym}`);
                        return (
                          <TableCell key={sym} className="py-1.5 px-2.5 text-center whitespace-nowrap">
                            {target || '—'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* LOWER RIGHT: STRING SIMULATOR */}
        <div className="lg:col-span-7 atlas-surface p-3.5 rounded-xl flex flex-col justify-between gap-3 min-h-[300px] shadow-none">
          {/* Header Row: STRING SIMULATOR + STEP MODE Toggle */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <h3 className="text-[12px] font-bold font-mono tracking-widest uppercase text-[var(--ink-primary)]">
              STRING SIMULATOR
            </h3>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-[var(--ink-secondary)] uppercase">
                STEP MODE
              </span>
              <Switch
                checked={stepMode}
                onCheckedChange={checked => {
                  setStepMode(checked);
                  if (checked) setLocalIsPlaying(false);
                }}
                aria-label="Toggle step mode"
                title="Toggle Step Mode"
              />
            </label>
          </div>

          {/* Input Row: INPUT STRING, text input, RUN, prev, next, reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--ink-secondary)] uppercase shrink-0">
              INPUT STRING
            </span>

            <div className="flex-1 flex items-center gap-1">
              <Input
                type="text"
                size="sm"
                value={localInputRaw}
                onChange={e => {
                  setLocalInputRaw(e.target.value);
                  setLocalStep(0);
                  setLocalIsPlaying(false);
                }}
                onKeyDown={e => e.stopPropagation()}
                placeholder={fixtureSource === 'frame10' ? '010110' : 'LL:M RR:M L:M'}
                aria-label="Input string for the active automaton"
                aria-invalid={!hasValidInput}
                className="flex-1 font-mono font-semibold tracking-wider uppercase text-xs"
              />
              {localInputRaw && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setLocalInputRaw('');
                    setLocalStep(0);
                    setLocalIsPlaying(false);
                  }}
                  title="Clear input"
                  aria-label="Clear input string"
                >
                  ✕
                </Button>
              )}
            </div>

            {/* Run / Pause Button */}
            <Button
              variant="default"
              size="sm"
              onClick={handleToggleRun}
              disabled={!hasValidInput || simResult.steps.length === 0 || (stepMode && localStep >= simResult.steps.length)}
              aria-label={stepMode ? 'Advance one transition' : localIsPlaying ? 'Pause simulation' : 'Run simulation'}
              className="text-[11px] font-mono uppercase tracking-wider font-bold shrink-0"
            >
              <span>{stepMode ? '› NEXT STEP' : localIsPlaying ? '⏸ PAUSE' : '▶ RUN'}</span>
            </Button>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleStepBack}
                disabled={localStep === 0}
                className="font-mono font-bold text-[11px]"
                title="Step backward"
                aria-label="Step backward"
              >
                &lt;
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleStepForward}
                disabled={localStep >= simResult.steps.length}
                className="font-mono font-bold text-[11px]"
                title="Step forward"
                aria-label="Step forward"
              >
                &gt;
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => {
                  setLocalStep(0);
                  setLocalIsPlaying(false);
                }}
                className="font-mono text-[12px]"
                title="Reset simulation step"
                aria-label="Reset simulation step"
              >
                ⟳
              </Button>
            </div>
          </div>

          {!hasValidInput && (
            <Alert variant="error" role="alert" aria-live="polite" className="p-2 text-[10px] font-mono">
              <AlertDescription>
                Unknown symbol{invalidSymbols.length === 1 ? '' : 's'}: {invalidSymbols.join(', ')}. Allowed: {activeMachine.alphabet.join(', ')}.
              </AlertDescription>
            </Alert>
          )}

          {/* Trace Pipeline Row (Matches Frame 10 Trace Flow) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-semibold tracking-wider text-[var(--ink-secondary)] uppercase">
              TRACE
            </span>

            <div className="p-3 bg-[var(--bg-viewport)] rounded-lg border border-[var(--border-subtle)] overflow-x-auto flex items-center gap-2 min-h-[64px]">
              {/* Start State */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 transition-colors ${
                    localStep === 0
                      ? 'bg-primary border-[var(--signal-mid)] text-primary-foreground ring-2 ring-[var(--signal-surface)]'
                      : 'bg-[var(--bg-pill-active)] border-[var(--signal-cobalt)] text-[var(--ink-primary)]'
                  }`}
                >
                  {activeMachine.initialState}
                </div>
              </div>

              {/* Transition steps */}
              {hasValidInput && simResult.steps.map((st, idx) => {
                const isReached = idx < localStep;
                const isCurrent = idx === localStep - 1;
                const isLast = idx === simResult.steps.length - 1;
                const isLastAccepted = isLast && simResult.accepted;

                return (
                  <div key={idx} className="flex items-center gap-2 shrink-0">
                    {/* Arrow with symbol label above */}
                    <div className="flex flex-col items-center justify-center w-10">
                      <span className="text-[9px] font-mono font-bold text-[var(--ink-secondary)] mb-0.5">
                        {st.inputSymbol}
                      </span>
                      <div className="w-full flex items-center justify-center text-[var(--signal-mid)] leading-none text-xs">
                        ────►
                      </div>
                    </div>

                    {/* Target State Circle */}
                    <div className="relative flex items-center justify-center">
                      {isLastAccepted && (
                        <div className="absolute w-11 h-11 rounded-full border-2 border-[var(--signal-mid)]" />
                      )}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 transition-colors ${
                          isLastAccepted && isReached
                            ? 'bg-primary border-[var(--signal-mid)] text-primary-foreground'
                            : isCurrent
                              ? 'bg-primary border-[var(--signal-mid)] text-primary-foreground ring-2 ring-[var(--signal-surface)]'
                              : isReached
                                ? 'bg-[var(--bg-pill-active)] border-[var(--signal-mid)] text-[var(--ink-primary)]'
                                : 'bg-[var(--bg-card-subtle)] border-[var(--border-subtle)] text-[var(--ink-muted)]'
                        }`}
                      >
                        {st.nextState}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Status Row: RESULT badge, FINAL STATE, STEPS */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--border-subtle)] text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--ink-secondary)] uppercase">RESULT</span>
              <span
                className={`px-3 py-1 rounded-md font-bold text-[11px] tracking-wider uppercase transition-colors ${
                  simResult.accepted
                    ? 'bg-[var(--bg-pill-active)] text-[var(--signal-mid)] border border-[var(--signal-surface)]'
                    : 'bg-rose-950/50 text-rose-300 border border-rose-500/40'
                }`}
              >
                {!hasValidInput ? 'INVALID INPUT' : simResult.accepted ? 'ACCEPT' : 'REJECT'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[var(--ink-secondary)] uppercase">FINAL STATE</span>
              <span className="font-bold text-[var(--ink-primary)]">
                {!hasValidInput ? '—' : simResult.steps.length > 0 && localStep > 0
                  ? simResult.steps[Math.min(localStep - 1, simResult.steps.length - 1)].nextState
                  : simResult.finalState}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[var(--ink-secondary)] uppercase">STEPS</span>
              <span className="font-bold text-[var(--ink-primary)]">
                {hasValidInput ? `${localStep} / ${simResult.steps.length}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
