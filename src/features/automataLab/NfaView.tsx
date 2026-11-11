import React, { useState, useMemo } from 'react';
import { NFA_MACHINE, REFERENCE_PATTERNS } from '../../data/astroData';
import type { StateId, NFATransition } from '../../automata/types';

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
    <div className="w-full h-full flex flex-col gap-[6px] font-mono select-none overflow-hidden">
      {/* Control Banner — Elevated Bento Module Card */}
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-[var(--ink-primary,#181A20)] uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
            <span>Nondeterministic Finite Automaton (ε-NFA)</span>
            <span className="hud-reticle px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral,#E6E9EF)] text-[var(--ink-secondary,#525866)] text-[10px] font-mono uppercase tracking-wider">
              {NFA_MACHINE.states.length} STATES / {NFA_MACHINE.transitions.length} TRANSITIONS
            </span>
          </div>
          <p className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider">
            Pattern chains mapped from Master initial state q₀ via ε-transitions.
          </p>
        </div>

        {/* Filter pattern */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider font-semibold">
            PATTERN FILTER:
          </label>
          <div className="hud-reticle">
            <select
              value={selectedPatternId}
              onChange={e => setSelectedPatternId(e.target.value)}
              className="bg-[var(--bg-card,#F5F6F8)] border border-[var(--bg-tray,#E2E5EC)] rounded-[6px] px-2.5 py-1 text-[11px] text-[var(--ink-primary,#181A20)] font-mono uppercase tracking-wider cursor-pointer"
            >
              <option value="ALL">SHOW ALL 24 PATTERNS</option>
              {REFERENCE_PATTERNS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name.toUpperCase()} [{p.constellationId}]
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Uniform Matte Technical Canvas */}
      <div className="flex-1 rounded-[12px] border border-[var(--bg-tray,#E2E5EC)] overflow-auto relative bg-[#060A14]">
        <svg
          width={layout.width}
          height={layout.height}
          className="min-w-full"
          style={{ background: '#060A14' }}
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
              <polygon points="0 0, 8 3, 0 6" fill="#1D55F5" />
            </marker>
            <marker
              id="arrowhead-eps"
              markerWidth="8"
              markerHeight="6"
              refX="18"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#8FA4C4" />
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
                opacity={isHighlighted ? 1 : 0.75}
              >
                <path
                  d={pathD}
                  fill="none"
                  stroke={isHighlighted ? '#1D55F5' : isEps ? '#8FA4C4' : '#525866'}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
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
                  fill="#0B1120"
                  stroke={isHighlighted ? '#1D55F5' : isEps ? '#8FA4C4' : '#2A3447'}
                  strokeWidth={1}
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isHighlighted ? '#FFFFFF' : isEps ? '#C7D5EC' : '#E0E8F9'}
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
                className="cursor-pointer"
              >
                {/* Start arrow for q0 */}
                {isInitial && (
                  <path
                    d="M -40 0 L -24 0"
                    stroke="#1D55F5"
                    strokeWidth={2}
                    markerEnd="url(#arrowhead-nfa)"
                  />
                )}

                {/* Outer ring for hovered state */}
                {isHovered && (
                  <circle
                    r={26}
                    fill="none"
                    stroke="#1D55F5"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                )}

                {/* Double-ring solid cobalt for final accept states */}
                {node.isAccepting && (
                  <circle
                    r={24}
                    fill="none"
                    stroke="#1D55F5"
                    strokeWidth={2}
                  />
                )}

                {/* Main state circle */}
                <circle
                  r={20}
                  fill={isInitial || node.isAccepting ? '#0D2359' : '#0B1120'}
                  stroke={isInitial || node.isAccepting ? '#1D55F5' : isHovered ? '#1D55F5' : '#3E485E'}
                  strokeWidth={isHovered ? 2.5 : 1.8}
                />

                {/* State Label */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FFFFFF"
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
                      fill="#0D2359"
                      stroke="#1D55F5"
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#E0E8F9"
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
        <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.08)] rounded-[12px] px-3 py-2 text-[11px] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[var(--signal-cobalt,#1D55F5)] uppercase tracking-wider">
              STATE: {hoveredState}
            </span>
            <span className="text-[var(--ink-secondary,#525866)] uppercase tracking-wider text-[10px]">
              {hoveredState === 'q0'
                ? 'MASTER INITIAL STATE (BRANCH UNIFICATION)'
                : layout.nodeCoords.get(hoveredState)?.isAccepting
                  ? `ACCEPTING STATE [${layout.nodeCoords.get(hoveredState)?.labels.join(', ')}]`
                  : 'INTERMEDIATE PATTERN STATE'}
            </span>
          </div>
          <div className="text-[10px] text-[var(--ink-muted,#8C93A0)] uppercase tracking-wider">
            M = (Q, Σ, δ, q₀, F)
          </div>
        </div>
      )}
    </div>
  );
};
