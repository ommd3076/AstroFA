import React from 'react';
import { MINIMIZED_DFA_MACHINE, NFA_MACHINE } from '../../data/astroData';
import { useAstroStore } from '../../stores/useAstroStore';
import { Button } from './boardPrimitives';
import { Modal, ModalBody, ModalFooter, ModalHeader, useModalClose } from '../../components/ui/board/base/modal/modal';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onOpenChange,
}) => {
  const recognitionReport = useAstroStore(state => state.recognitionReport);
  const simulatorSymbols = useAstroStore(state => state.simulatorSymbols);

  const handleDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 1. Export CSV Transition Table
  const exportCsv = () => {
    const dfa = MINIMIZED_DFA_MACHINE;
    const header = ['State_ID', 'Is_Initial', 'Is_Accepting', 'Accepting_Labels', ...dfa.alphabet].join(',');
    const rows: string[] = [header];

    for (const s of dfa.states) {
      const row = [
        s.id,
        s.isInitial ? 'true' : 'false',
        s.isAccepting ? 'true' : 'false',
        `"${s.acceptingLabels.join(';')}"`,
      ];
      for (const sym of dfa.alphabet) {
        const trans = dfa.transitions.find(t => t.from === s.id && t.symbol === sym);
        row.push(trans ? trans.to : '');
      }
      rows.push(row.join(','));
    }

    handleDownload('costellar_dfa_transition_table.csv', rows.join('\n'), 'text/csv;charset=utf-8');
  };

  // 2. Export DFA as JSON
  const exportDfaJson = () => {
    const jsonStr = JSON.stringify(MINIMIZED_DFA_MACHINE, null, 2);
    handleDownload('costellar_minimized_dfa.json', jsonStr, 'application/json');
  };

  // 3. Export NFA as JSON
  const exportNfaJson = () => {
    const jsonStr = JSON.stringify(NFA_MACHINE, null, 2);
    handleDownload('costellar_nfa.json', jsonStr, 'application/json');
  };

  // 4. Export Recognition Trace as JSON
  const exportTraceJson = () => {
    const data = {
      timestamp: new Date().toISOString(),
      simulatorInput: simulatorSymbols,
      recognitionReport,
    };
    handleDownload('costellar_recognition_trace.json', JSON.stringify(data, null, 2), 'application/json');
  };

  // 5. Export SVG State Diagram
  const exportSvgDiagram = () => {
    const dfa = MINIMIZED_DFA_MACHINE;
    const svgWidth = 1400;
    const svgHeight = 900;
    const cols = 9;
    const position = (index: number) => ({
      x: 80 + (index % cols) * 145,
      y: 110 + Math.floor(index / cols) * 105,
    });
    const indexById = new Map(dfa.states.map((state, index) => [state.id, index]));

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">\n`;
    svg += `  <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#565b64"/></marker></defs>\n`;
    svg += `  <style>\n    .state { font-family: monospace; font-size: 11px; font-weight: bold; fill: #18191b; }\n    .edge { stroke: #8a8f96; stroke-width: 1.2; fill: none; }\n    .label { font-family: monospace; font-size: 9px; fill: #064bdc; font-weight: bold; }\n  </style>\n`;
    svg += `  <rect width="${svgWidth}" height="${svgHeight}" fill="#f6f6f5"/>\n`;
    svg += `  <text x="30" y="40" font-family="monospace" font-size="16" font-weight="bold" fill="#18191b">MINIMIZED DFA · ${dfa.states.length} STATES · ${dfa.transitions.length} TRANSITIONS</text>\n`;

    for (const transition of dfa.transitions) {
      const fromIndex = indexById.get(transition.from);
      const toIndex = indexById.get(transition.to);
      if (fromIndex === undefined || toIndex === undefined) continue;
      const from = position(fromIndex);
      const to = position(toIndex);
      if (transition.from === transition.to) {
        svg += `  <path class="edge" d="M ${from.x - 12} ${from.y - 20} C ${from.x - 28} ${from.y - 65}, ${from.x + 28} ${from.y - 65}, ${from.x + 12} ${from.y - 20}" marker-end="url(#arrow)"/>\n`;
        svg += `  <text x="${from.x}" y="${from.y - 62}" text-anchor="middle" class="label">${transition.symbol}</text>\n`;
        continue;
      }
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      const startX = from.x + (dx / length) * 23;
      const startY = from.y + (dy / length) * 23;
      const endX = to.x - (dx / length) * 27;
      const endY = to.y - (dy / length) * 27;
      const labelX = (startX + endX) / 2;
      const labelY = (startY + endY) / 2 - 5;
      svg += `  <line class="edge" x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" marker-end="url(#arrow)"/>\n`;
      svg += `  <text x="${labelX}" y="${labelY}" text-anchor="middle" class="label">${transition.symbol}</text>\n`;
    }

    dfa.states.forEach((s, idx) => {
      const { x: cx, y: cy } = position(idx);
      const strokeColor = s.isInitial || s.isAccepting ? '#064bdc' : s.isDead ? '#8a8f96' : '#c6c9cc';
      const fillColor = s.isInitial || s.isAccepting ? '#e5edff' : '#f6f6f5';

      if (s.isAccepting) {
        svg += `  <circle cx="${cx}" cy="${cy}" r="26" fill="none" stroke="${strokeColor}" stroke-width="2"/>\n`;
      }
      svg += `  <circle cx="${cx}" cy="${cy}" r="22" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>\n`;
      svg += `  <text x="${cx}" y="${cy + 4}" text-anchor="middle" class="state">${s.id}</text>\n`;
      if (s.acceptingLabels.length > 0) {
        svg += `  <text x="${cx}" y="${cy + 38}" text-anchor="middle" class="label">${s.acceptingLabels[0]}</text>\n`;
      }
    });

    svg += '</svg>';
    handleDownload('costellar_minimized_dfa.svg', svg, 'image/svg+xml');
  };

  return (
    <Modal isOpen={open} onOpenChange={onOpenChange} size="lg" className="border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--ink-primary)] font-sans">
          <ModalHeader title={<span className="flex items-center gap-2 text-sm font-semibold text-[var(--ink-primary)]"><span className="w-2 h-2 rounded-full bg-[var(--signal-mid)]" aria-hidden="true" />Export telemetry &amp; automata suite</span>} description="Download computed transition matrices, formal definitions, SVG diagrams, and active simulation traces." />
          <ModalBody className="space-y-2">
            <Button
              variant="outline"
              onClick={exportCsv}
              className="h-auto w-full p-2.5 bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-pill-active)] border-[var(--border-subtle)] hover:border-[var(--signal-surface)] rounded-[8px] text-left flex items-center justify-between font-normal"
            >
              <div>
                <div className="font-semibold text-[var(--ink-primary)] text-xs">
                  Transition matrix (.csv)
                </div>
                <div className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
                  Full state × alphabet transition table
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--signal-mid)] rounded-[4px] font-mono text-[10px] font-semibold">
                .CSV
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={exportDfaJson}
              className="h-auto w-full p-2.5 bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-pill-active)] border-[var(--border-subtle)] hover:border-[var(--signal-surface)] rounded-[8px] text-left flex items-center justify-between font-normal"
            >
              <div>
                <div className="font-semibold text-[var(--ink-primary)] text-xs">
                  Minimized DFA machine (.json)
                </div>
                <div className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
                  States, alphabet, transitions, and accepting labels
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--signal-mid)] rounded-[4px] font-mono text-[10px] font-semibold">
                .JSON
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={exportNfaJson}
              className="h-auto w-full p-2.5 bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-pill-active)] border-[var(--border-subtle)] hover:border-[var(--signal-surface)] rounded-[8px] text-left flex items-center justify-between font-normal"
            >
              <div>
                <div className="font-semibold text-[var(--ink-primary)] text-xs">
                  ε-NFA specification (.json)
                </div>
                <div className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
                  Non-deterministic branching automaton model
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--signal-mid)] rounded-[4px] font-mono text-[10px] font-semibold">
                .JSON
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={exportSvgDiagram}
              className="h-auto w-full p-2.5 bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-pill-active)] border-[var(--border-subtle)] hover:border-[var(--signal-surface)] rounded-[8px] text-left flex items-center justify-between font-normal"
            >
              <div>
                <div className="font-semibold text-[var(--ink-primary)] text-xs">
                  Vector state diagram (.svg)
                </div>
                <div className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
                  Clean print-ready diagram for reports
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--signal-mid)] rounded-[4px] font-mono text-[10px] font-semibold">
                .SVG
              </span>
            </Button>

            <Button
              variant="outline"
              onClick={exportTraceJson}
              className="h-auto w-full p-2.5 bg-[var(--bg-card-subtle)] hover:bg-[var(--bg-pill-active)] border-[var(--border-subtle)] hover:border-[var(--signal-surface)] rounded-[8px] text-left flex items-center justify-between font-normal"
            >
              <div>
                <div className="font-semibold text-[var(--ink-primary)] text-xs">
                  Active recognition trace (.json)
                </div>
                <div className="text-[11px] text-[var(--ink-secondary)] mt-0.5">
                  Simulation input symbols and alignment telemetry
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--signal-mid)] rounded-[4px] font-mono text-[10px] font-semibold">
                .JSON
              </span>
            </Button>
          </ModalBody>
          <ModalFooter className="border-t border-[var(--border-subtle)] bg-[var(--bg-card-subtle)]"><CloseExportButton /></ModalFooter>
    </Modal>
  );
};

function CloseExportButton() {
  const close = useModalClose();
  return <Button variant="outline" size="sm" onClick={close}>Close</Button>;
}
