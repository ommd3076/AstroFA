import React, { useState, useEffect, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS } from '../../data/astroData';
import { simulateDfa } from '../../automata/simulate';
import { Alert, AlertDescription, AlertTitle, Button, Card, Input } from './boardPrimitives';
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from './boardPrimitives';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './boardPrimitives';

const SPEED_CHOICES = [
  { value: '1200', label: '0.5X SLOW (1.2S)' },
  { value: '750', label: '1.0X NORMAL (750MS)' },
  { value: '350', label: '2.0X FAST (350MS)' },
  { value: '150', label: '5.0X TURBO (150MS)' },
];

export const SimulatorView: React.FC = () => {
  const {
    simulatorSymbols,
    setSimulatorSymbols,
    simulatorStep,
    setSimulatorStep,
    simulatorIsPlaying,
    setSimulatorIsPlaying,
  } = useAstroStore();

  const [inputStringRaw, setInputStringRaw] = useState<string>(simulatorSymbols.join(' '));
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(750);
  const [presetSelection, setPresetSelection] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Parse raw text into symbol array
  const handleApplyInput = () => {
    setSimulatorIsPlaying(false);
    const parsed = inputStringRaw
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    const invalidSymbols = [...new Set(parsed.filter(symbol => !MINIMIZED_DFA_MACHINE.alphabet.includes(symbol)))];
    if (invalidSymbols.length > 0) {
      setInputError(`Unknown symbol${invalidSymbols.length === 1 ? '' : 's'}: ${invalidSymbols.join(', ')}. Use symbols from Σ.`);
      return;
    }
    setInputError(null);
    setSimulatorStep(0);
    setSimulatorIsPlaying(false);
    setSimulatorSymbols(parsed);
  };

  // Run full simulation
  const simResult = useMemo(() => {
    return simulateDfa(MINIMIZED_DFA_MACHINE, simulatorSymbols);
  }, [simulatorSymbols]);

  const totalSteps = simResult.steps.length;
  const currentStep = simulatorStep > 0 && simulatorStep <= totalSteps ? simResult.steps[simulatorStep - 1] : null;

  // Active state at current step
  const activeStateId = currentStep ? currentStep.nextState : MINIMIZED_DFA_MACHINE.initialState;
  const activeState = MINIMIZED_DFA_MACHINE.states.find(s => s.id === activeStateId);

  // Playback timer
  useEffect(() => {
    if (!simulatorIsPlaying) return;
    const interval = setInterval(() => {
      setSimulatorStep(prev => {
        if (prev < totalSteps) {
          return prev + 1;
        } else {
          setSimulatorIsPlaying(false);
          return prev;
        }
      });
    }, playbackSpeedMs);
    return () => clearInterval(interval);
  }, [simulatorIsPlaying, totalSteps, playbackSpeedMs, setSimulatorStep, setSimulatorIsPlaying]);

  const isFinalStep = simulatorStep === totalSteps;

  return (
    <div className="w-full h-full flex flex-col gap-[6px] font-mono overflow-y-auto pr-0.5">
      {/* Overview Banner */}
      <Card className="bg-[var(--bg-card)] border-[var(--border-subtle)] p-3.5 rounded-[12px] gap-1.5 shrink-0 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" />
            <h3 className="font-bold text-[var(--ink-primary)] text-[11px] uppercase tracking-wider">
              DFA Step-by-Step String Simulator
            </h3>
            <span className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral)] text-[var(--signal-mid)] text-[10px] font-mono uppercase tracking-wider font-semibold">
              MACHINE: MINIMIZED DFA ({MINIMIZED_DFA_MACHINE.states.length} STATES)
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-secondary)] font-mono tracking-wider">
            TAPE HEAD: {simulatorStep} / {totalSteps} SYMBOLS
          </span>
        </div>
        <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed uppercase tracking-wider">
          Single-step execution over formal transition function δ. Inspects discrete tape consumption,
          active state transitions, and deterministic acceptance criteria.
        </p>
      </Card>

      {/* String Input & Preset Toolbar */}
      <Card className="bg-[var(--bg-card)] border-[var(--border-subtle)] p-3 rounded-[12px] gap-2.5 shrink-0 shadow-none">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 flex gap-2">
            <Input
              type="text"
              size="sm"
              value={inputStringRaw}
              onChange={e => setInputStringRaw(e.target.value)}
              onKeyDown={e => e.stopPropagation()}
              placeholder="E.G. LL:M RR:M L:M OR S:S R:G"
              aria-label="Input string over the minimized DFA alphabet"
              aria-invalid={Boolean(inputError)}
              aria-describedby={inputError ? 'simulator-input-error' : undefined}
              className="flex-1 text-[11px] font-mono uppercase tracking-wider"
            />
            <Button
              variant="default"
              size="sm"
              onClick={handleApplyInput}
              className="text-[10px] font-mono uppercase tracking-wider font-semibold shrink-0"
            >
              LOAD STRING
            </Button>
          </div>

          {/* Quick presets */}
          <Select
            value={presetSelection}
            onValueChange={val => {
              if (!val) return;
              const pat = REFERENCE_PATTERNS.find(p => p.id === val);
              if (pat) {
                setPresetSelection(val);
                setInputStringRaw(pat.encodedSymbols.join(' '));
                setInputError(null);
                setSimulatorStep(0);
                setSimulatorIsPlaying(false);
                setSimulatorSymbols(pat.encodedSymbols);
              }
            }}
          >
            <SelectTrigger size="sm" aria-label="Load preset reference pattern" className="w-auto min-w-[210px] text-[10px] font-mono uppercase tracking-wider">
              <SelectValue placeholder="PRESET PATTERNS">
                {val => {
                  const found = REFERENCE_PATTERNS.find(p => p.id === val);
                  return found ? `${found.name.toUpperCase()} [${found.constellationId}]` : '-- PRESET PATTERNS --';
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup align="end">
              {REFERENCE_PATTERNS.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-[11px] font-mono">
                  {p.name.toUpperCase()} [{p.encodedSymbols.join(' ')}]
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>

        {inputError && (
          <Alert id="simulator-input-error" variant="error" role="alert" className="p-2 text-[10px]">
            <AlertDescription>{inputError}</AlertDescription>
          </Alert>
        )}

        {/* Quick-insert alphabet symbol buttons */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] text-[var(--ink-secondary)] uppercase font-semibold mr-1">
            ALPHABET Σ:
          </span>
          {MINIMIZED_DFA_MACHINE.alphabet.map((sym, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="xs"
              onClick={() => {
                const nextStr = inputStringRaw ? `${inputStringRaw} ${sym}` : sym;
                setInputStringRaw(nextStr);
                setSimulatorSymbols(nextStr.split(/[\s,]+/).filter(Boolean));
              }}
              className="h-6 px-2 text-[10px] font-mono"
            >
              +{sym}
            </Button>
          ))}
        </div>
      </Card>

      {/* Stepper Controls */}
      <Card className="bg-[var(--bg-card)] border-[var(--border-subtle)] p-2.5 rounded-[12px] flex-row flex-wrap items-center justify-between gap-3 shrink-0 shadow-none">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            onClick={() => { setSimulatorStep(0); setSimulatorIsPlaying(false); }}
            disabled={simulatorStep === 0}
            className="text-[10px] font-mono font-semibold uppercase tracking-wider"
          >
            |◀ RESET
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => { setSimulatorStep(prev => Math.max(0, prev - 1)); setSimulatorIsPlaying(false); }}
            disabled={simulatorStep === 0}
            className="text-[10px] font-mono font-semibold uppercase tracking-wider"
          >
            - STEP
          </Button>
          <Button
            variant={simulatorIsPlaying ? 'outline' : 'default'}
            size="xs"
            onClick={() => setSimulatorIsPlaying(!simulatorIsPlaying)}
            disabled={!simulatorIsPlaying && (totalSteps === 0 || simulatorStep >= totalSteps)}
            className="text-[10px] font-mono font-semibold uppercase tracking-wider"
          >
            <span>{simulatorIsPlaying ? '⏸ PAUSE' : '▶ RUN'}</span>
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => { setSimulatorStep(prev => Math.min(totalSteps, prev + 1)); setSimulatorIsPlaying(false); }}
            disabled={simulatorStep === totalSteps}
            className="text-[10px] font-mono font-semibold uppercase tracking-wider"
          >
            + STEP
          </Button>
        </div>

        {/* Playback speed selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--ink-secondary)] uppercase font-semibold">
            SPEED:
          </span>
          <Select
            value={String(playbackSpeedMs)}
            onValueChange={val => {
              if (val) setPlaybackSpeedMs(Number(val));
            }}
          >
            <SelectTrigger size="sm" aria-label="Simulator playback speed" className="w-auto min-w-[160px] text-[10px] font-mono uppercase">
              <SelectValue>
                {val => SPEED_CHOICES.find(c => c.value === val)?.label ?? `${val}MS`}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup align="end">
              {SPEED_CHOICES.map(c => (
                <SelectItem key={c.value} value={c.value} className="text-xs font-mono">
                  {c.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </Card>

      {/* Interactive Active State & Tape HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="atlas-surface p-3.5 rounded-xl gap-2.5 shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--ink-secondary)] tracking-wider">
              ACTIVE TELEMETRY STATE
            </span>
            {activeState?.isAccepting ? (
              <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded text-[9px] font-bold font-mono uppercase tracking-wider">
                ACCEPTING STATE
              </span>
            ) : activeState?.isDead ? (
              <span className="px-2 py-0.5 bg-[var(--ink-muted)] text-[var(--bg-shell)] rounded text-[9px] font-bold font-mono uppercase tracking-wider">
                DEAD / TRAP STATE
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] rounded text-[9px] font-mono uppercase tracking-wider">
                TRANSIT STATE
              </span>
            )}
          </div>

          <div className="p-3 bg-[var(--bg-viewport)] rounded-lg border border-[var(--border-subtle)] flex items-center gap-3">
            <div className="w-14 h-14 rounded-[8px] bg-[var(--bg-card)] border border-[var(--reticle-tick)] flex items-center justify-center font-mono tabular-nums font-bold text-[var(--signal-mid)] text-xl shrink-0">
              {activeStateId}
            </div>
            <div className="space-y-0.5 overflow-hidden">
              <div className="text-[11px] font-bold text-[var(--ink-primary)] truncate uppercase">
                {activeState?.name}
              </div>
              {activeState?.acceptingLabels && activeState.acceptingLabels.length > 0 && (
                <div className="text-[10px] font-mono text-[var(--signal-mid)] font-bold uppercase tracking-wider">
                  RECOGNIZES: {activeState.acceptingLabels.join(', ')}
                </div>
              )}
            </div>
          </div>

          {currentStep && (
            <div className="text-[10px] font-mono text-[var(--ink-primary)] bg-[var(--bg-tray)] p-2 rounded-[6px] border border-[var(--border-subtle)] uppercase tracking-wider">
              TRANSITION: <strong className="text-[var(--signal-mid)] font-mono tabular-nums">{currentStep.currentState}</strong> ──[<span className="text-[var(--signal-mid)] font-bold">{currentStep.inputSymbol}</span>]──➔ <strong className="text-[var(--signal-mid)] font-mono tabular-nums">{currentStep.nextState}</strong>
            </div>
          )}
        </Card>

        <Card className="atlas-surface p-3.5 rounded-xl gap-2.5 shadow-none">
          <div className="text-[10px] uppercase font-bold text-[var(--ink-secondary)] tracking-wider">
            INPUT SYMBOL TAPE (Σ*)
          </div>

          <div className="p-2.5 bg-[var(--bg-viewport)] rounded-lg border border-[var(--border-subtle)] flex items-center gap-1.5 overflow-x-auto min-h-[48px]">
            {simulatorSymbols.map((sym, idx) => {
              const isConsumed = idx < simulatorStep;
              const isCurrent = idx === simulatorStep - 1;
              return (
                <div
                  key={idx}
                  className={`px-2.5 py-1.5 rounded text-[10px] font-mono font-bold border transition-colors shrink-0 ${
                    isCurrent
                      ? 'bg-primary border-[var(--signal-mid)] text-primary-foreground'
                      : isConsumed
                        ? 'bg-[var(--bg-pill-neutral)] border-[var(--border-subtle)] text-[var(--ink-muted)]'
                        : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--ink-primary)]'
                  }`}
                >
                  {sym}
                </div>
              );
            })}
          </div>

          {isFinalStep && (
            <Alert variant={simResult.accepted ? 'success' : 'warning'} className="p-3 font-mono text-[11px]">
              <AlertTitle className="text-xs font-bold uppercase tracking-wider">
                {simResult.accepted ? '✓ STRING ACCEPTED BY DFA' : '✕ STRING REJECTED'}
              </AlertTitle>
              <AlertDescription className="text-[10px] uppercase tracking-wider leading-relaxed">
                {simResult.accepted
                  ? `Automaton halted in accepting state ${simResult.finalState}. Successfully recognized pattern: ${simResult.acceptingLabels.join(', ')}.`
                  : simResult.failureReason || `Halted in non-accepting state ${simResult.finalState}.`}
              </AlertDescription>
            </Alert>
          )}
        </Card>
      </div>

      {/* Step Execution Trace Table */}
      <Card className="bg-[var(--bg-card)] border-[var(--border-subtle)] rounded-[12px] p-3.5 gap-2 flex-1 flex flex-col shadow-none">
        <h4 className="text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
          Step-by-Step Simulation Trace Matrix ({simResult.steps.length} Steps)
        </h4>
        <div className="flex-1 overflow-auto border border-[var(--border-subtle)] rounded-[8px] max-h-72 bg-[var(--bg-card)]">
          <Table className="text-xs font-mono">
            <TableHeader className="bg-[var(--bg-card-subtle)] sticky top-0 z-10">
              <TableRow>
                <TableHead className="p-2.5 uppercase text-[10px]">STEP</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">CURRENT STATE q</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">SYMBOL a</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">NEXT STATE δ(q, a)</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">REMAINING TAPE</TableHead>
                <TableHead className="p-2.5 uppercase text-[10px]">ACCEPTING STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-[11px]">
              {simResult.steps.map((st, idx) => {
                const isCurrentActive = idx + 1 === simulatorStep;
                return (
                  <TableRow
                    key={idx}
                    onClick={() => { setSimulatorStep(idx + 1); setSimulatorIsPlaying(false); }}
                    className={`cursor-pointer ${
                      isCurrentActive
                        ? 'bg-[var(--bg-pill-active)] text-[var(--signal-mid)] font-bold'
                        : 'hover:bg-[var(--bg-pill-neutral)] text-[var(--ink-primary)]'
                    }`}
                  >
                    <TableCell className="p-2.5 text-[var(--ink-muted)]">{st.step}</TableCell>
                    <TableCell className="p-2.5 font-mono tabular-nums font-bold text-[var(--signal-mid)]">{st.currentState}</TableCell>
                    <TableCell className="p-2.5 font-bold">{st.inputSymbol}</TableCell>
                    <TableCell className="p-2.5 font-mono tabular-nums font-bold text-[var(--signal-mid)]">{st.nextState}</TableCell>
                    <TableCell className="p-2.5 text-[var(--ink-muted)] text-[10px]">{st.remainingSymbols.join(' ') || 'ε (EMPTY)'}</TableCell>
                    <TableCell className="p-2.5">
                      {st.isAccepting ? (
                        <span className="px-1.5 py-0.2 rounded bg-primary text-primary-foreground text-[9px] font-bold uppercase">
                          ACCEPT ({st.acceptingLabels.join(', ')})
                        </span>
                      ) : (
                        <span className="text-[var(--ink-muted)] text-[10px] uppercase">NON-ACCEPTING</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
