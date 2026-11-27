import React, { useState, useMemo } from 'react';
import { NFA_MACHINE, REFERENCE_PATTERNS } from '../../data/astroData';
import type { StateId, NFATransition } from '../../automata/types';
import { Card } from './boardPrimitives';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from './boardPrimitives';

export const NfaView: React.FC = () => {
  const [selectedPatternId, setSelectedPatternId] = useState<string>('ALL');
  const [hoveredState, setHoveredState] = useState<StateId | null>(null);
  const [hoveredTransition, setHoveredTransition] = useState<NFATransition | null>(null);

  // Filter reference patterns
  const activePatterns = useMemo(() => {
    if (selectedPatternId === 'ALL') return REFERENCE_PATTERNS;
    return REFERENCE_PATTERNS.filter(p => p.id === selectedPatternId);
  }, [selectedPatternId]);

  // Layout calculation for SVG
  const layout = useMemo(() => {
    const nodeCoords = new Map<StateId, { x: number; y: number; label: string; isAccepting: boolean; labels: string[] }>();
    const startX = 80;
    const q0Y = 50 + (activePatterns.length * 60) / 2;

    // q0 Master Start State
    nodeCoords.set('q0', {
      x: startX,
      y: q0Y,
      label: 'q0',
      isAccepting: false,
      labels: [],
    });

    const visibleTransitions: NFATransition[] = [];

    activePatterns.forEach((pattern, pIdx) => {
      const y = 50 + pIdx * 65;
      const pPrefix = `p${REFERENCE_PATTERNS.indexOf(pattern) + 1}_${pattern.id}`;
      const startStateId = `${pPrefix}_s0`;

      // Start state of pattern
      nodeCoords.set(startStateId, {
        x: startX + 160,
        y,
        label: `${pattern.constellationId}₀`,
        isAccepting: pattern.encodedSymbols.length === 0,
        labels: pattern.encodedSymbols.length === 0 ? [pattern.constellationId] : [],
      });

      visibleTransitions.push({
        from: 'q0',
        to: startStateId,
        symbol: 'ε',
      });

      for (let sIdx = 0; sIdx < pattern.encodedSymbols.length; sIdx++) {
        const nextStateId = `${pPrefix}_s${sIdx + 1}`;
        const isFinal = sIdx === pattern.encodedSymbols.length - 1;
        nodeCoords.set(nextStateId, {
          x: startX + 160 + (sIdx + 1) * 140,
          y,
          label: `${pattern.constellationId}₍${sIdx + 1}₎`,
          isAccepting: isFinal,
          labels: isFinal ? [pattern.constellationId] : [],
        });

        visibleTransitions.push({
          from: sIdx === 0 ? startStateId : `${pPrefix}_s${sIdx}`,
          to: nextStateId,
          symbol: pattern.encodedSymbols[sIdx],
        });
      }
    });

    const maxX = Math.max(...Array.from(nodeCoords.values()).map(v => v.x)) + 120;
    const maxY = Math.max(...Array.from(nodeCoords.values()).map(v => v.y)) + 80;

    return {
      nodeCoords,
      transitions: visibleTransitions,
      width: Math.max(1000, maxX),
      height: Math.max(600, maxY),
    };
  }, [activePatterns]);

  return (
    <div className="w-full h-full flex flex-col gap-3 font-mono overflow-hidden">
      {/* Control Banner */}
      <Card className="atlas-surface rounded-xl p-3 gap-3 flex-row flex-wrap items-center justify-between shrink-0 shadow-none">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" />
            <span>Nondeterministic Finite Automaton (ε-NFA)</span>
            <span className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] text-[10px] font-mono uppercase tracking-wider">
              {NFA_MACHINE.states.length} STATES / {NFA_MACHINE.transitions.length} TRANSITIONS
            </span>
          </div>
          <p className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider">
            Pattern chains mapped from Master initial state q₀ via ε-transitions.
          </p>
        </div>

        {/* Filter pattern */}
        <div className="flex items-center gap-2">
          <label htmlFor="nfa-pattern-filter" className="text-[10px] text-[var(--ink-secondary)] uppercase tracking-wider font-semibold">
            Pattern filter:
          </label>
          <Select
            value={selectedPatternId}
            onValueChange={val => {
              if (val) setSelectedPatternId(val);
            }}
          >
            <SelectTrigger id="nfa-pattern-filter" size="sm" aria-label="Filter NFA reference patterns" className="w-auto min-w-[200px] text-[11px] font-mono">
              <SelectValue>
                {val => {
                  if (val === 'ALL') return `Show all ${REFERENCE_PATTERNS.length} patterns`;
                  const found = REFERENCE_PATTERNS.find(p => p.id === val);
                  return found ? `${found.name} [${found.constellationId}]` : String(val);
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup align="end">
              <SelectItem value="ALL" className="text-xs font-mono">
                Show all {REFERENCE_PATTERNS.length} patterns
              </SelectItem>
              {REFERENCE_PATTERNS.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-xs font-mono">
                  {p.name} [{p.constellationId}]
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </Card>

      {/* Obsidian Technical Canvas */}
      <div className="flex-1 min-h-0 rounded-xl border border-[var(--border-subtle)] overflow-auto relative bg-[var(--bg-viewport)]">
        <svg
          width={layout.width}
          height={layout.height}
          className="min-w-full bg-[var(--bg-viewport)]"
        >
          <defs>
            <marker
              id="arrowhead-nfa"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#8FA3FF" />
            </marker>
            <marker
              id="arrowhead-eps"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#7C7A72" />
            </marker>
          </defs>

          {/* Transitions */}
          {layout.transitions.map((t, idx) => {
            const from = layout.nodeCoords.get(t.from);
            const to = layout.nodeCoords.get(t.to);
            if (!from || !to) return null;

            const isEps = t.symbol === 'ε';
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;

            // Curved line path for epsilon branches from q0
            const pathD = isEps
              ? `M ${from.x} ${from.y} C ${from.x + 80} ${from.y}, ${to.x - 80} ${to.y}, ${to.x} ${to.y}`
              : `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

            const isHighlighted = hoveredTransition === t || hoveredState === t.from || hoveredState === t.to;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredTransition(t)}
                onMouseLeave={() => setHoveredTransition(null)}
                className="cursor-pointer transition-opacity"
                opacity={isHighlighted ? 1 : 0.78}
              >
                <path
                  d={pathD}
                  fill="none"
                  stroke={isHighlighted ? '#8FA3FF' : isEps ? '#52515A' : '#3F3E46'}
                  strokeWidth={isHighlighted ? 2.2 : 1.4}
                  strokeDasharray={isEps ? '4 3' : undefined}
                  markerEnd={`url(#${isEps ? 'arrowhead-eps' : 'arrowhead-nfa'})`}
                />
                {/* Symbol label on edge */}
                <rect
                  x={midX - (isEps ? 10 : 20)}
                  y={midY - 9}
                  width={isEps ? 20 : 40}
                  height={18}
                  rx={3}
                  fill="#151519"
                  stroke={isHighlighted ? '#8FA3FF' : '#2A2A32'}
                  strokeWidth={1}
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isHighlighted ? '#A8B8FF' : '#B5B2A9'}
                  fontSize={isEps ? '11px' : '9px'}
                  fontWeight="600"
                  fontFamily="'IBM Plex Mono', monospace"
                >
                  {t.symbol}
                </text>
              </g>
            );
          })}

          {/* States */}
          {Array.from(layout.nodeCoords.entries()).map(([id, node]) => {
            const isInitial = id === 'q0';
            const isHovered = hoveredState === id;

            return (
              <g
                key={id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredState(id)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => setHoveredState(id)}
                onFocus={() => setHoveredState(id)}
                onBlur={() => setHoveredState(null)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setHoveredState(id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${node.label}${node.isAccepting ? `, accepting ${node.labels.join(', ')}` : ''}`}
                className="cursor-pointer outline-none"
              >
                {/* Start arrow for q0 */}
                {isInitial && (
                  <path
                    d="M -40 0 L -24 0"
                    stroke="#A8B8FF"
                    strokeWidth={2}
                    markerEnd="url(#arrowhead-nfa)"
                  />
                )}

                {/* Outer ring for hovered state */}
                {isHovered && (
                  <circle
                    r={26}
                    fill="none"
                    stroke="#F3F1EB"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                )}

                {/* Double-ring solid periwinkle for final accept states */}
                {node.isAccepting && (
                  <circle
                    r={24}
                    fill="none"
                    stroke="#8FA3FF"
                    strokeWidth={2}
                  />
                )}

                {/* Main state circle */}
                <circle
                  r={20}
                  fill={node.isAccepting ? '#8FA3FF' : isInitial ? '#202026' : '#1B1B20'}
                  stroke={isInitial || node.isAccepting || isHovered ? '#A8B8FF' : '#52515A'}
                  strokeWidth={isHovered ? 2.5 : 1.8}
                />

                {/* State Label */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={node.isAccepting ? '#0B0B10' : '#F3F1EB'}
                  fontSize={isInitial ? '11px' : '9px'}
                  fontFamily="'IBM Plex Mono', monospace"
                  fontWeight="600"
                >
                  {node.label}
                </text>

                {/* Constellation accepting badge tag */}
                {node.isAccepting && (
                  <g transform="translate(0, 32)">
                    <rect
                      x={-28}
                      y={-9}
                      width={56}
                      height={16}
                      rx={3}
                      fill="#151519"
                      stroke="#8FA3FF"
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#A8B8FF"
                      fontSize="9px"
                      fontFamily="'IBM Plex Mono', monospace"
                      fontWeight="600"
                    >
                      {node.labels[0]}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* State Inspector Footer — Module Card */}
      {hoveredState && (
        <Card className="atlas-surface rounded-xl px-3 py-2 text-[11px] flex-row items-center justify-between shrink-0 shadow-none">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[var(--signal-mid)] uppercase tracking-wider">
              STATE: {hoveredState}
            </span>
            <span className="text-[var(--ink-secondary)] uppercase tracking-wider text-[10px]">
              {hoveredState === 'q0'
                ? 'MASTER INITIAL STATE (BRANCH UNIFICATION)'
                : layout.nodeCoords.get(hoveredState)?.isAccepting
                  ? `ACCEPTING STATE [${layout.nodeCoords.get(hoveredState)?.labels.join(', ')}]`
                  : 'INTERMEDIATE PATTERN STATE'}
            </span>
          </div>
          <div className="text-[10px] text-[var(--ink-muted)] uppercase tracking-wider">
            M = (Q, Σ, δ, q₀, F)
          </div>
        </Card>
      )}
    </div>
  );
};
