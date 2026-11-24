import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAstroStore, type AutomataTab } from '../../stores/useAstroStore';
import {
  DFA_MACHINE,
  MINIMIZED_DFA_MACHINE,
  REFERENCE_PATTERNS,
} from '../../data/astroData';
import type { DFA, StateId } from '../../automata/types';
import { simulateDfa } from '../../automata/simulate';
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
    <div className="flex-1 flex flex-col p-3.5 gap-3 bg-[var(--bg-shell,#ECEEF2)] text-[var(--ink-primary,#181A20)] font-mono  overflow-y-auto overflow-x-hidden">
      {/* =========================================================================
          ROW 1: FOUR HARDWARE METRIC TILES (FRAME 10 TOP STRIP)
          ========================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {metricCards.map((m, idx) => (
          <div
            key={idx}
            className="hud-reticle-4corner bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] flex flex-col justify-between gap-1 shadow-none transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--ink-secondary,#525866)] uppercase">
                {m.label}
              </span>
              <span className="text-[12px] text-[var(--ink-muted,#8C93A0)] font-mono leading-none">↗</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-3xl font-bold font-['Doto',monospace] tracking-wider text-[var(--ink-primary,#181A20)]">
                {m.value}
              </div>
              <span className="text-[9px] font-mono text-[var(--ink-muted,#8C93A0)] uppercase tracking-wider font-semibold">
                {m.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
          ROW 2: CENTER BODY (AUTOMATA LAB GRAPH CARD + FORMAL DEFINITION CARD)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0">
        {/* CENTER LEFT: AUTOMATA LAB GRAPH CARD (~62% / 7.5 COLS) */}
        <div className="lg:col-span-8 bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-4 rounded-[12px] flex flex-col gap-2.5 min-h-[360px] shadow-none">
          {/* Header Row: Title, Rocker Switch, Reset, Expand */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--bg-tray,#E2E5EC)] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
              <h2 className="text-[13px] font-bold font-mono tracking-widest uppercase text-[var(--ink-primary,#181A20)]">
                AUTOMATA LAB
              </h2>

              {/* Fixture Toggle: Live Engine vs Frame 10 Benchmark */}
              <div className="ml-2 flex items-center bg-[var(--bg-tray,#E2E5EC)] rounded-[6px] p-0.5 border border-[rgba(0,0,0,0.06)]">
                <button
                  onClick={() => handleSelectFixture('live')}
                  className={`px-2 py-0.5 rounded-[4px] text-[9px] font-mono font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                    fixtureSource === 'live'
                      ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white shadow-none'
                      : 'text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)]'
                  }`}
                  title="Live Determinized/Minimized Constellation Engine"
                >
                  LIVE ENGINE
                </button>
                <button
                  onClick={() => handleSelectFixture('frame10')}
                  className={`px-2 py-0.5 rounded-[4px] text-[9px] font-mono font-semibold uppercase tracking-wider cursor-pointer transition-colors ${
                    fixtureSource === 'frame10'
                      ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white shadow-none'
                      : 'text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)]'
                  }`}
                  title="Frame 10 Benchmark Reference Model"
                >
                  FRAME 10 REF
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Rocker Switch: NFA | DFA | MINIMIZED (Matches Frame 10 Rocker) */}
              <div className="flex items-center bg-[var(--bg-tray,#E2E5EC)] rounded-[6px] p-0.5 border border-[rgba(0,0,0,0.06)]">
                {(['nfa', 'dfa', 'minimized'] as const).map(choice => {
                  const isActive = choice !== 'nfa' && rockerChoice === choice && fixtureSource === 'live';
                  return (
                    <button
                      key={choice}
                      onClick={() => {
                        if (choice === 'nfa') {
                          onOpenTab('nfa');
                          return;
                        }
                        handleSelectFixture('live');
                        setRockerChoice(choice);
                      }}
                      title={choice === 'nfa' ? 'Open the epsilon-NFA lesson' : `Show the ${choice === 'minimized' ? 'minimized DFA' : 'original DFA'}`}
                      className={`px-2.5 py-1 rounded-[4px] text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[var(--signal-cobalt,#1D55F5)] text-white shadow-none'
                          : 'text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)]'
                      }`}
                    >
                      {choice === 'nfa' ? 'ε-NFA' : choice.toUpperCase()}
                    </button>
                  );
                })}
              </div>

              {/* Reset Graph Button */}
              <button
                onClick={handleResetGraph}
                className="hud-reticle p-1.5 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] border border-[rgba(0,0,0,0.08)] text-[var(--ink-primary,#181A20)] text-[12px] cursor-pointer transition-colors"
                title="Reset Graph Zoom & Simulator"
              >
                ⟳
              </button>

              {/* Expand Full Tab View */}
              <button
                onClick={() => onOpenTab(rockerChoice)}
                className="hud-reticle p-1.5 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] border border-[rgba(0,0,0,0.08)] text-[var(--ink-primary,#181A20)] text-[12px] cursor-pointer transition-colors"
                title="Expand Full Screen Teaching View"
              >
                ⛶
              </button>

              {/* Export Suite Quick Action */}
              {onOpenExport && (
                <button
                  onClick={onOpenExport}
                  className="hud-reticle p-1.5 rounded-[6px] bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] border border-[rgba(0,0,0,0.08)] text-[var(--signal-cobalt,#1D55F5)] text-[12px] cursor-pointer transition-colors font-bold"
                  title="Open Export Suite"
                >
                  ↗
                </button>
              )}
            </div>
          </div>

          {/* Graph Sub-toolbar (Constellation Filter in Live Mode) */}
          {fixtureSource === 'live' && (
            <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-secondary,#525866)] px-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold uppercase">TRACE PATH:</span>
                <select
                  value={highlightConstellation}
                  onChange={e => setHighlightConstellation(e.target.value)}
                  className="bg-[var(--bg-card,#F5F6F8)] border border-[var(--bg-tray,#E2E5EC)] rounded-[4px] px-2 py-0.5 text-[10px] font-mono uppercase cursor-pointer"
                >
                  <option value="ALL">ALL MACHINE STATES</option>
                  <option value="Ori">ORION (ORI)</option>
                  <option value="Cas">CASSIOPEIA (CAS)</option>
                  <option value="UMa">URSA MAJOR (BIG DIPPER)</option>
                  <option value="Cyg">CYGNUS (NORTHERN CROSS)</option>
                </select>
              </div>
              <span className="text-[9px] text-[var(--ink-muted,#8C93A0)] uppercase font-semibold">
                DRAG TO PAN • SCROLL TO ZOOM • CLICK NODE TO INSPECT
              </span>
            </div>
          )}

          {fixtureSource === 'live' && activeMachine.states.length > 18 && (
            <div className="flex items-center justify-between px-1 text-[9px] font-mono uppercase tracking-wider text-[var(--ink-muted,#8C93A0)]">
              <span>{showAllGraphStates ? 'FULL MACHINE' : `TRACE WINDOW / ${graphStates.length} OF ${activeMachine.states.length} STATES`}</span>
              <button
                type="button"
                onClick={() => setShowAllGraphStates(value => !value)}
                aria-pressed={showAllGraphStates}
                className="font-bold text-[var(--signal-cobalt,#1D55F5)] hover:underline cursor-pointer"
              >
                {showAllGraphStates ? 'FOCUS TRACE' : `SHOW ALL ${activeMachine.states.length}`}
              </button>
            </div>
          )}
          {/* Interactive Automaton SVG Graph */}
          <div className="flex-1 min-h-[260px] bg-[var(--bg-tray,#E2E5EC)]/40 rounded-[8px] border border-[rgba(0,0,0,0.06)] relative overflow-hidden flex items-center justify-center">
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
                {/* Cobalt Arrowhead Marker */}
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#1D55F5" />
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
                  <polygon points="0 0, 8 3, 0 6" fill="#181A20" />
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
                    stroke="#181A20"
                    strokeWidth="2"
                    markerEnd="url(#entry-arrowhead)"
                  />
                  <text
                    x={nodePositions[activeMachine.initialState].x - 65}
                    y={nodePositions[activeMachine.initialState].y - 6}
                    fill="#525866"
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
                        stroke="#1D55F5"
                        strokeWidth="1.75"
                        markerEnd="url(#arrowhead)"
                      />
                      <rect
                        x={src.x - 8}
                        y={src.y - 70}
                        width="16"
                        height="14"
                        rx="3"
                        fill="#F5F6F8"
                        stroke="#E2E5EC"
                        strokeWidth="1"
                      />
                      <text
                        x={src.x}
                        y={src.y - 59}
                        textAnchor="middle"
                        fill="#181A20"
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
                      stroke="#1D55F5"
                      strokeWidth="1.75"
                      markerEnd="url(#arrowhead)"
                    />
                    <rect
                      x={labelX - 10}
                      y={labelY - 9}
                      width="20"
                      height="14"
                      rx="3"
                      fill="#F5F6F8"
                      stroke="#E2E5EC"
                      strokeWidth="0.8"
                    />
                    <text
                      x={labelX}
                      y={labelY + 2}
                      textAnchor="middle"
                      fill="#181A20"
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
                        stroke="#1D55F5"
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
                        stroke="#1D55F5"
                        strokeWidth="2"
                      />
                    )}

                    {/* Inner Node Circle */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="22"
                      fill={isAccepting ? '#1D55F5' : '#EBF2FE'}
                      stroke="#1D55F5"
                      strokeWidth="2"
                    />

                    {/* Node State Label */}
                    <text
                      x={pos.x}
                      y={pos.y + 4.5}
                      textAnchor="middle"
                      fill={isAccepting ? '#FFFFFF' : '#181A20'}
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

        {/* CENTER RIGHT: FORMAL DEFINITION CARD (~38% / 4.5 COLS) */}
        <div className="lg:col-span-4 bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-4 rounded-[12px] flex flex-col justify-between gap-3 min-h-[360px] shadow-none">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--bg-tray,#E2E5EC)] pb-2">
              <h3 className="text-[12px] font-bold font-mono tracking-widest uppercase text-[var(--ink-primary,#181A20)]">
                FORMAL DEFINITION
              </h3>
              <button
                onClick={() => onOpenTab('formal')}
                className="text-[10px] font-mono text-[var(--signal-cobalt,#1D55F5)] hover:underline uppercase tracking-wider font-semibold cursor-pointer"
              >
                TUPLE DETAIL ↗
              </button>
            </div>

            {/* Canonical Tuple Formula Pill Box */}
            <div className="py-2.5 px-3 bg-[var(--bg-tray,#E2E5EC)] rounded-[8px] border border-[rgba(0,0,0,0.06)] text-center">
              <div className="text-base font-mono font-medium text-[var(--ink-primary,#181A20)] tracking-widest">
                M = (Q, Σ, δ, q₀, F)
              </div>
            </div>

            {/* Formal Definition Rows */}
            <div className="space-y-2 text-[11px] font-mono">
              {/* Q: Set of States */}
              <div className="flex items-start justify-between py-1 border-b border-[rgba(0,0,0,0.04)] gap-2">
                <span className="font-bold text-[var(--ink-secondary,#525866)] shrink-0 w-8">Q</span>
                <span className="text-[var(--ink-secondary,#525866)] shrink-0">=</span>
                <div className="flex-1 text-right text-[var(--ink-primary,#181A20)] truncate">
                  <span title={`{${activeMachine.states.map(state => state.id).join(', ')}}`}>
                    {`{${activeMachine.states.slice(0, 6).map(s => s.id).join(', ')}${activeMachine.states.length > 6 ? ', …' : ''}} (|Q|=${activeMachine.states.length})`}
                  </span>
                </div>
              </div>

              {/* Σ: Finite Alphabet */}
              <div className="flex items-start justify-between py-1 border-b border-[rgba(0,0,0,0.04)] gap-2">
                <span className="font-bold text-[var(--ink-secondary,#525866)] shrink-0 w-8">Σ</span>
                <span className="text-[var(--ink-secondary,#525866)] shrink-0">=</span>
                <div className="flex-1 text-right text-[var(--ink-primary,#181A20)] truncate">
                  <span title={`{${activeMachine.alphabet.join(', ')}}`}>
                    {`{${activeMachine.alphabet.slice(0, 5).join(', ')}${activeMachine.alphabet.length > 5 ? ', …' : ''}} (|Σ|=${activeMachine.alphabet.length})`}
                  </span>
                </div>
              </div>

              {/* δ: Transition Mapping Signature */}
              <div className="flex items-start justify-between py-1 border-b border-[rgba(0,0,0,0.04)] gap-2">
                <span className="font-bold text-[var(--ink-secondary,#525866)] shrink-0 w-8">δ</span>
                <span className="text-[var(--ink-secondary,#525866)] shrink-0">:</span>
                <div className="flex-1 text-right text-[var(--ink-primary,#181A20)]">
                  Q × Σ → Q
                </div>
              </div>

              {/* q0: Initial Start State */}
              <div className="flex items-start justify-between py-1 border-b border-[rgba(0,0,0,0.04)] gap-2">
                <span className="font-bold text-[var(--ink-secondary,#525866)] shrink-0 w-8">q₀</span>
                <span className="text-[var(--ink-secondary,#525866)] shrink-0">=</span>
                <div className="flex-1 text-right text-[var(--signal-cobalt,#1D55F5)] font-bold">
                  {activeMachine.initialState}
                </div>
              </div>

              {/* F: Set of Accepting Final States */}
              <div className="flex items-start justify-between py-1 gap-2">
                <span className="font-bold text-[var(--ink-secondary,#525866)] shrink-0 w-8">F</span>
                <span className="text-[var(--ink-secondary,#525866)] shrink-0">=</span>
                <div className="flex-1 text-right text-[var(--signal-cobalt,#1D55F5)] font-bold truncate">
                  <span title={`{${activeMachine.acceptingStates.join(', ')}}`}>
                    {`{${activeMachine.acceptingStates.slice(0, 4).join(', ')}${activeMachine.acceptingStates.length > 4 ? ', …' : ''}} (|F|=${activeMachine.acceptingStates.length})`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active State Metadata Box */}
          {selectedStateId && (
            <div className="p-2.5 bg-[var(--bg-tray,#E2E5EC)]/60 rounded-[8px] border border-[rgba(0,0,0,0.06)] text-[10px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[var(--ink-secondary,#525866)] font-semibold uppercase">INSPECTED STATE:</span>
                <span className="text-[var(--signal-cobalt,#1D55F5)] font-bold">{selectedStateId}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-[var(--ink-muted,#8C93A0)]">
                <span>ACCEPTING:</span>
                <span className={activeMachine.acceptingStates.includes(selectedStateId) ? 'text-emerald-600 font-bold' : ''}>
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0">
        {/* LOWER LEFT: TRANSITION TABLE (δ) (~38% / 4.5 COLS) */}
        <div className="lg:col-span-5 bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] flex flex-col gap-2 min-h-[310px] shadow-none">
          <div className="flex items-center justify-between border-b border-[var(--bg-tray,#E2E5EC)] pb-2">
            <h3 className="text-[12px] font-bold font-mono tracking-widest uppercase text-[var(--ink-primary,#181A20)]">
              TRANSITION PREVIEW · δ
            </h3>
            <button
              onClick={() => onOpenTab('table')}
              className="text-[10px] font-mono text-[var(--signal-cobalt,#1D55F5)] hover:underline uppercase tracking-wider font-semibold cursor-pointer"
            >
              OPEN FULL TABLE ↗
            </button>
          </div>

          <p className="text-[10px] text-[var(--ink-muted,#777d85)]">
            Showing {tableStates.length} of {activeMachine.states.length} states and {tableAlphabet.length} of {activeMachine.alphabet.length} symbols. The full table includes every transition.
          </p>

          {/* Table Container with Sticky Light Header */}
          <div className="flex-1 border border-[rgba(0,0,0,0.06)] rounded-[8px] bg-[var(--bg-card,#F5F6F8)] overflow-auto max-h-[240px]">
            <table className="w-full text-left text-[11px] border-collapse font-mono">
              <thead className="sticky top-0 bg-[#E5EEF9] text-[var(--ink-primary,#181A20)] z-10 border-b border-[rgba(0,0,0,0.08)]">
                <tr>
                  <th className="py-2 px-3 font-bold uppercase tracking-wider">STATE</th>
                  {tableAlphabet.map(sym => (
                    <th key={sym} className="py-2 px-2.5 font-bold uppercase tracking-wider text-center">
                      {sym}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.05)]">
                {tableStates.map(s => {
                  const isSelected = s.id === highlightedStateId;
                  const isAccepting = activeMachine.acceptingStates.includes(s.id);
                  const isInitial = s.id === activeMachine.initialState;

                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStateId(s.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[var(--bg-pill-active,#E0E8F9)] font-bold text-[var(--signal-cobalt,#1D55F5)]'
                          : 'hover:bg-[var(--bg-tray,#E2E5EC)]/40 text-[var(--ink-primary,#181A20)]'
                      }`}
                    >
                      <td className="py-1.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          {isInitial && <span className="text-[var(--signal-cobalt,#1D55F5)]">→</span>}
                          <span>{s.id}</span>
                          {isAccepting && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--signal-cobalt,#1D55F5)] text-white font-normal">
                              F
                            </span>
                          )}
                        </span>
                      </td>
                      {tableAlphabet.map(sym => {
                        const target = tableMatrix.get(`${s.id}:::${sym}`);
                        return (
                          <td key={sym} className="py-1.5 px-2.5 text-center whitespace-nowrap">
                            {target || '—'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOWER RIGHT: STRING SIMULATOR (~62% / 7.5 COLS) */}
        <div className="lg:col-span-7 bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] p-3.5 rounded-[12px] flex flex-col justify-between gap-3 min-h-[310px] shadow-none">
          {/* Header Row: STRING SIMULATOR + STEP MODE Toggle */}
          <div className="flex items-center justify-between border-b border-[var(--bg-tray,#E2E5EC)] pb-2">
            <h3 className="text-[12px] font-bold font-mono tracking-widest uppercase text-[var(--ink-primary,#181A20)]">
              STRING SIMULATOR
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-[var(--ink-secondary,#525866)] uppercase">
                STEP MODE
              </span>
              <button
                onClick={() => {
                  setStepMode(!stepMode);
                  if (!stepMode) setLocalIsPlaying(false);
                }}
                aria-label="Toggle step mode"
                aria-pressed={stepMode}
                className={`w-9 h-5 rounded-full p-0.5 cursor-pointer transition-colors flex items-center ${
                  stepMode ? 'bg-[var(--signal-cobalt,#1D55F5)] justify-end' : 'bg-[var(--bg-tray,#E2E5EC)] justify-start'
                }`}
                title="Toggle Step Mode"
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>

          {/* Input Row: INPUT STRING, text input, RUN, prev, next, reset */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--ink-secondary,#525866)] uppercase shrink-0">
              INPUT STRING
            </span>

            <div className="flex-1 flex items-center relative">
              <input
                type="text"
                value={localInputRaw}
                onChange={e => {
                  setLocalInputRaw(e.target.value);
                  setLocalStep(0);
                  setLocalIsPlaying(false);
                }}
                placeholder={fixtureSource === 'frame10' ? '010110' : 'LL:M RR:M L:M'}
                aria-label="Input string for the active automaton"
                aria-invalid={!hasValidInput}
                className="w-full bg-[var(--bg-card,#F5F6F8)] border border-[var(--bg-tray,#E2E5EC)] rounded-[6px] pl-3 pr-8 py-1.5 text-[12px] font-mono font-semibold tracking-wider text-[var(--ink-primary,#181A20)] uppercase"
              />
              {localInputRaw && (
                <button
                  onClick={() => {
                    setLocalInputRaw('');
                    setLocalStep(0);
                    setLocalIsPlaying(false);
                  }}
                  className="absolute right-2.5 text-[var(--ink-muted,#8C93A0)] hover:text-[var(--ink-primary,#181A20)] text-[12px] cursor-pointer"
                  title="Clear input"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Run / Pause Button */}
            <button
              onClick={handleToggleRun}
              disabled={!hasValidInput || simResult.steps.length === 0 || (stepMode && localStep >= simResult.steps.length)}
              aria-label={stepMode ? 'Advance one transition' : localIsPlaying ? 'Pause simulation' : 'Run simulation'}
              className="hud-reticle active px-4 py-1.5 bg-[var(--signal-cobalt,#1D55F5)] hover:bg-[#1546D8] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-[6px] text-[11px] font-mono uppercase tracking-wider font-bold cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <span>{stepMode ? '› NEXT STEP' : localIsPlaying ? '⏸ PAUSE' : '▶ RUN'}</span>
            </button>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleStepBack}
                disabled={localStep === 0}
                className="hud-reticle px-2.5 py-1.5 bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] disabled:opacity-40 border border-[rgba(0,0,0,0.08)] rounded-[6px] text-[11px] font-mono font-bold cursor-pointer transition-colors"
                title="Step backward"
              >
                &lt;
              </button>
              <button
                onClick={handleStepForward}
                disabled={localStep >= simResult.steps.length}
                className="hud-reticle px-2.5 py-1.5 bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] disabled:opacity-40 border border-[rgba(0,0,0,0.08)] rounded-[6px] text-[11px] font-mono font-bold cursor-pointer transition-colors"
                title="Step forward"
              >
                &gt;
              </button>
              <button
                onClick={() => {
                  setLocalStep(0);
                  setLocalIsPlaying(false);
                }}
                className="hud-reticle px-2.5 py-1.5 bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] border border-[rgba(0,0,0,0.08)] rounded-[6px] text-[12px] font-mono cursor-pointer transition-colors"
                title="Reset simulation step"
              >
                ⟳
              </button>
            </div>
          </div>

          {!hasValidInput && (
            <p role="alert" aria-live="polite" className="text-[10px] text-red-600 font-mono">
              Unknown symbol{invalidSymbols.length === 1 ? '' : 's'}: {invalidSymbols.join(', ')}. Allowed: {activeMachine.alphabet.join(', ')}.
            </p>
          )}

          {/* Trace Pipeline Row (Matches Frame 10 Trace Flow) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono font-semibold tracking-wider text-[var(--ink-secondary,#525866)] uppercase">
              TRACE
            </span>

            <div className="p-3 bg-[var(--bg-tray,#E2E5EC)]/40 rounded-[8px] border border-[rgba(0,0,0,0.06)] overflow-x-auto flex items-center gap-2 min-h-[64px]">
              {/* Start State */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 transition-colors ${
                    localStep === 0
                      ? 'bg-[var(--signal-cobalt,#1D55F5)] border-[var(--signal-mid,#6892F6)] text-white ring-2 ring-[var(--signal-cobalt,#1D55F5)]/40'
                      : 'bg-[#EBF2FE] border-[var(--signal-cobalt,#1D55F5)] text-[var(--ink-primary,#181A20)]'
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
                      <span className="text-[9px] font-mono font-bold text-[var(--ink-secondary,#525866)] mb-0.5">
                        {st.inputSymbol}
                      </span>
                      <div className="w-full flex items-center justify-center text-[var(--signal-cobalt,#1D55F5)] leading-none text-xs">
                        ────►
                      </div>
                    </div>

                    {/* Target State Circle */}
                    <div className="relative flex items-center justify-center">
                      {isLastAccepted && (
                        <div className="absolute w-11 h-11 rounded-full border-2 border-[var(--signal-cobalt,#1D55F5)]" />
                      )}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs border-2 transition-colors ${
                          isLastAccepted && isReached
                            ? 'bg-[var(--signal-cobalt,#1D55F5)] border-[var(--signal-cobalt,#1D55F5)] text-white'
                            : isCurrent
                              ? 'bg-[var(--signal-cobalt,#1D55F5)] border-[var(--signal-mid,#6892F6)] text-white ring-2 ring-[var(--signal-cobalt,#1D55F5)]/40'
                              : isReached
                                ? 'bg-[#EBF2FE] border-[var(--signal-cobalt,#1D55F5)] text-[var(--ink-primary,#181A20)]'
                                : 'bg-[var(--bg-card,#F5F6F8)] border-[rgba(0,0,0,0.15)] text-[var(--ink-muted,#8C93A0)]'
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
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-[var(--bg-tray,#E2E5EC)] text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--ink-secondary,#525866)] uppercase">RESULT</span>
              <span
                className={`px-3 py-1 rounded-[6px] font-bold text-[11px] tracking-wider uppercase transition-colors ${
                  simResult.accepted
                    ? 'bg-[var(--bg-pill-active,#E0E8F9)] text-[var(--signal-cobalt,#1D55F5)] border border-[var(--signal-mid,#6892F6)]/30'
                    : 'bg-red-50 text-red-600 border border-red-200'
                }`}
              >
                {!hasValidInput ? 'INVALID INPUT' : simResult.accepted ? 'ACCEPT' : 'REJECT'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[var(--ink-secondary,#525866)] uppercase">FINAL STATE</span>
              <span className="font-bold text-[var(--ink-primary,#181A20)]">
                {!hasValidInput ? '—' : simResult.steps.length > 0 && localStep > 0
                  ? simResult.steps[Math.min(localStep - 1, simResult.steps.length - 1)].nextState
                  : simResult.finalState}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[var(--ink-secondary,#525866)] uppercase">STEPS</span>
              <span className="font-bold text-[var(--ink-primary,#181A20)]">
                {hasValidInput ? `${localStep} / ${simResult.steps.length}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
