import React, { useState, useMemo } from 'react';
import { MINIMIZED_DFA_MACHINE, DFA_MACHINE } from '../../data/astroData';
import type { DFA, StateId } from '../../automata/types';
import { Card } from './boardPrimitives';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './boardPrimitives';
import { Input } from './boardPrimitives';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from './boardPrimitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './boardPrimitives';
import { ToggleGroup, ToggleGroupItem } from './boardPrimitives';

export const TransitionTableView: React.FC = () => {
  const [machineChoice, setMachineChoice] = useState<'minimized' | 'original'>('minimized');
  const [searchState, setSearchState] = useState('');
  const [filterSymbol, setFilterSymbol] = useState('ALL');

  const dfa: DFA = machineChoice === 'minimized' ? MINIMIZED_DFA_MACHINE : DFA_MACHINE;

  // Build matrix lookup: (stateId, symbol) -> targetStateId
  const matrix = useMemo(() => {
    const map = new Map<string, StateId>();
    for (const t of dfa.transitions) {
      map.set(`${t.from}:::${t.symbol}`, t.to);
    }
    return map;
  }, [dfa]);

  const filteredStates = useMemo(() => {
    return dfa.states.filter(s => {
      if (!searchState) return true;
      const term = searchState.toLowerCase();
      return (
        s.id.toLowerCase().includes(term) ||
        s.name.toLowerCase().includes(term) ||
        s.acceptingLabels.some(lbl => lbl.toLowerCase().includes(term))
      );
    });
  }, [dfa.states, searchState]);

  const activeAlphabet = useMemo(() => {
    if (filterSymbol === 'ALL') return dfa.alphabet;
    return [filterSymbol];
  }, [dfa.alphabet, filterSymbol]);

  return (
    <div className="w-full h-full flex flex-col gap-3 font-mono overflow-hidden">
      {/* Control Banner */}
      <Card className="atlas-surface p-3 rounded-xl flex-row flex-wrap items-center justify-between gap-3 shrink-0 shadow-none">
        <div className="flex flex-wrap items-center gap-3">
          {/* Machine Selection Rocker */}
          <ToggleGroup
            aria-label="Select DFA version"
            size="sm"
            value={[machineChoice]}
            onValueChange={vals => {
              const next = vals.find(v => v !== machineChoice) ?? vals[0];
              if (next === 'minimized' || next === 'original') setMachineChoice(next);
            }}
            className="bg-[var(--bg-card-subtle)] rounded-lg p-0.5 border border-[var(--border-subtle)] gap-0.5"
          >
            <ToggleGroupItem
              value="minimized"
              className="text-[10px] font-mono font-semibold uppercase tracking-wider data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              MINIMIZED DFA ({MINIMIZED_DFA_MACHINE.states.length} STATES)
            </ToggleGroupItem>
            <ToggleGroupItem
              value="original"
              className="text-[10px] font-mono font-semibold uppercase tracking-wider data-pressed:bg-primary data-pressed:text-primary-foreground"
            >
              ORIGINAL DFA ({DFA_MACHINE.states.length} STATES)
            </ToggleGroupItem>
          </ToggleGroup>

          <span className="text-[10px] font-mono text-[var(--ink-secondary)] uppercase tracking-wider hidden sm:inline">
            CELL MATRIX: {dfa.states.length} × {dfa.alphabet.length} = {dfa.states.length * dfa.alphabet.length}
          </span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            size="sm"
            aria-label="Filter states by name or accepting pattern"
            placeholder="FILTER STATE / PATTERN..."
            value={searchState}
            onChange={e => setSearchState(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            className="w-48 text-[10px] font-mono uppercase tracking-wider"
          />
          <Select
            value={filterSymbol}
            onValueChange={val => {
              if (val) setFilterSymbol(val);
            }}
          >
            <SelectTrigger size="sm" aria-label="Filter transition table by input symbol" className="w-auto min-w-[140px] text-[10px] font-mono uppercase">
              <SelectValue>
                {val => (val === 'ALL' ? 'ALL SYMBOLS Σ' : `SYMBOL ${val}`)}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup align="end">
              <SelectItem value="ALL" className="text-xs font-mono">ALL SYMBOLS Σ</SelectItem>
              {dfa.alphabet.map(sym => (
                <SelectItem key={sym} value={sym} className="text-xs font-mono">SYMBOL {sym}</SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </Card>

      {/* Recessed Transition Matrix Table */}
      <Card className="atlas-surface flex-1 rounded-xl overflow-auto relative p-0 gap-0 shadow-none">
        {filteredStates.length === 0 ? (
          <Empty className="m-auto border-0 p-8">
            <EmptyHeader>
              <EmptyTitle className="text-xs">No matching DFA states</EmptyTitle>
              <EmptyDescription className="text-xs">
                No states match filter &ldquo;{searchState}&rdquo;.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table className="text-xs font-mono">
            <TableHeader className="bg-[var(--bg-card-subtle)] sticky top-0 z-10">
              <TableRow>
                <TableHead className="p-2.5 sticky left-0 bg-[var(--bg-card-subtle)] z-20 border-r border-[var(--border-subtle)] min-w-[140px] text-[10px] uppercase">
                  STATE q ∈ Q
                </TableHead>
                {activeAlphabet.map(sym => (
                  <TableHead key={sym} className="p-2.5 text-center border-r border-[var(--border-subtle)] min-w-[70px] text-[10px] uppercase">
                    <span className="text-[var(--signal-mid)] font-bold">{sym}</span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="text-[11px]">
              {filteredStates.map(state => {
                const isInitial = state.isInitial;
                const isAccepting = state.isAccepting;
                const isDead = state.isDead;

                return (
                  <TableRow key={state.id}>
                    <TableCell className="p-2.5 sticky left-0 bg-[var(--bg-card)] border-r border-[var(--border-subtle)] font-bold text-[var(--ink-primary)] z-10">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {isInitial && (
                            <span className="text-[var(--signal-mid)] font-bold text-[10px]">
                              ➔
                            </span>
                          )}
                          {isAccepting && (
                            <span className="px-1 py-0.2 rounded bg-primary text-primary-foreground text-[9px] font-bold">
                              ◎
                            </span>
                          )}
                          <span className={`font-mono tabular-nums text-xs ${
                            isAccepting ? 'text-[var(--signal-mid)] font-bold' : isDead ? 'text-[var(--ink-muted)]' : 'text-[var(--ink-primary)]'
                          }`}>
                            {state.id}
                          </span>
                        </div>
                        {state.acceptingLabels.length > 0 && (
                          <span className="text-[9px] px-1 py-0.2 bg-[var(--bg-pill-active)] text-[var(--signal-mid)] font-mono font-bold uppercase rounded">
                            {state.acceptingLabels[0]}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {activeAlphabet.map(sym => {
                      const targetId = matrix.get(`${state.id}:::${sym}`);
                      const targetState = targetId ? dfa.states.find(s => s.id === targetId) : undefined;
                      const isTargetDead = targetState?.isDead || targetId === dfa.deadStateId;

                      return (
                        <TableCell
                          key={sym}
                          className={`p-2.5 text-center border-r border-[var(--border-subtle)] ${
                            !targetId || isTargetDead
                              ? 'text-[var(--ink-muted)]'
                              : targetState?.isAccepting
                                ? 'bg-[var(--bg-pill-active)] text-[var(--signal-mid)] font-bold font-mono tabular-nums'
                                : 'text-[var(--ink-primary)] font-mono tabular-nums'
                          }`}
                        >
                          {targetId ? (
                            isTargetDead ? (
                              <span className="opacity-40 text-[10px] uppercase">trap</span>
                            ) : (
                              <span className="text-xs">{targetId}</span>
                            )
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
