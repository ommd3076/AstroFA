import React from 'react';
import { MINIMIZED_DFA_MACHINE, NFA_MACHINE } from '../../data/astroData';
import { useAstroStore } from '../../stores/useAstroStore';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { recognitionReport, simulatorSymbols } = useAstroStore();

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

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">\n`;
    svg += `  <style>\n    .state { font-family: monospace; font-size: 11px; font-weight: bold; fill: #ffffff; }\n    .edge { stroke: #525866; stroke-width: 1.5; }\n    .label { font-family: monospace; font-size: 9px; fill: #1D55F5; font-weight: bold; }\n  </style>\n`;
    svg += `  <rect width="${svgWidth}" height="${svgHeight}" fill="#060A14"/>\n`;
    svg += `  <text x="30" y="40" font-family="monospace" font-size="16" font-weight="bold" fill="#1D55F5">COSTELLAR MINIMIZED DFA HARDWARE TELEMETRY DIAGRAM</text>\n`;

    // Render grid of states
    const cols = 9;
    dfa.states.forEach((s, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = 80 + col * 145;
      const cy = 100 + row * 110;

      const strokeColor = s.isInitial || s.isAccepting ? '#1D55F5' : s.isDead ? '#525866' : '#8FA4C4';
      const fillColor = s.isInitial || s.isAccepting ? '#0D2359' : '#0B1120';

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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 select-none">
      <div className="bg-[var(--bg-card,#F5F6F8)] border border-[rgba(0,0,0,0.12)] rounded-[12px] max-w-lg w-full p-5 space-y-4 shadow-none font-mono text-[var(--ink-primary,#181A20)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--bg-tray,#E2E5EC)] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--signal-cobalt,#1D55F5)]" />
            <h3 className="font-bold text-[var(--ink-primary,#181A20)] text-xs uppercase tracking-wider">
              Export Telemetry &amp; Automata Suite
            </h3>
          </div>
          <button
            onClick={onClose}
            className="hud-reticle text-[var(--ink-secondary,#525866)] hover:text-[var(--ink-primary,#181A20)] text-xs px-2 py-0.5 rounded-[4px] bg-[var(--bg-pill-neutral,#E6E9EF)] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-[10px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider leading-relaxed">
          Download genuine computed scientific artifacts, transition matrices, and state models for verification, academic documentation, or viva defense.
        </p>

        {/* Bento Sub-Cards for Export Actions */}
        <div className="space-y-2">
          {/* CSV Transition Table */}
          <button
            onClick={exportCsv}
            className="w-full p-2.5 bg-[var(--bg-tray,#E2E5EC)] hover:bg-[#D9DDE6] border border-[rgba(0,0,0,0.06)] rounded-[8px] text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-bold text-[var(--ink-primary,#181A20)] text-xs uppercase tracking-wider">
                Transition Matrix (.CSV)
              </div>
              <div className="text-[9px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider mt-0.5">
                Full State × Alphabet transition matrix
              </div>
            </div>
            <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-card,#F5F6F8)] text-[var(--signal-cobalt,#1D55F5)] rounded-[4px] text-[10px] font-bold">
              .CSV
            </span>
          </button>

          {/* Minimized DFA JSON */}
          <button
            onClick={exportDfaJson}
            className="w-full p-2.5 bg-[var(--bg-tray,#E2E5EC)] hover:bg-[#D9DDE6] border border-[rgba(0,0,0,0.06)] rounded-[8px] text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-bold text-[var(--ink-primary,#181A20)] text-xs uppercase tracking-wider">
                Minimized DFA Machine (.JSON)
              </div>
              <div className="text-[9px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider mt-0.5">
                States, alphabet, transitions &amp; accepting labels
              </div>
            </div>
            <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-card,#F5F6F8)] text-[var(--signal-cobalt,#1D55F5)] rounded-[4px] text-[10px] font-bold">
              .JSON
            </span>
          </button>

          {/* ε-NFA JSON */}
          <button
            onClick={exportNfaJson}
            className="w-full p-2.5 bg-[var(--bg-tray,#E2E5EC)] hover:bg-[#D9DDE6] border border-[rgba(0,0,0,0.06)] rounded-[8px] text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-bold text-[var(--ink-primary,#181A20)] text-xs uppercase tracking-wider">
                ε-NFA Specification (.JSON)
              </div>
              <div className="text-[9px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider mt-0.5">
                Non-deterministic branching automaton
              </div>
            </div>
            <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-card,#F5F6F8)] text-[var(--signal-cobalt,#1D55F5)] rounded-[4px] text-[10px] font-bold">
              .JSON
            </span>
          </button>

          {/* SVG Vector Diagram */}
          <button
            onClick={exportSvgDiagram}
            className="w-full p-2.5 bg-[var(--bg-tray,#E2E5EC)] hover:bg-[#D9DDE6] border border-[rgba(0,0,0,0.06)] rounded-[8px] text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-bold text-[var(--ink-primary,#181A20)] text-xs uppercase tracking-wider">
                Vector State Diagram (.SVG)
              </div>
              <div className="text-[9px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider mt-0.5">
                Tactile hardware diagram for academic publications
              </div>
            </div>
            <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-card,#F5F6F8)] text-[var(--signal-cobalt,#1D55F5)] rounded-[4px] text-[10px] font-bold">
              .SVG
            </span>
          </button>

          {/* Recognition Trace JSON */}
          <button
            onClick={exportTraceJson}
            className="w-full p-2.5 bg-[var(--bg-tray,#E2E5EC)] hover:bg-[#D9DDE6] border border-[rgba(0,0,0,0.06)] rounded-[8px] text-left transition-colors flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-bold text-[var(--ink-primary,#181A20)] text-xs uppercase tracking-wider">
                Active Recognition Trace (.JSON)
              </div>
              <div className="text-[9px] text-[var(--ink-secondary,#525866)] uppercase tracking-wider mt-0.5">
                Simulation input tape &amp; geometric alignment stats
              </div>
            </div>
            <span className="hud-reticle px-2 py-0.5 bg-[var(--bg-card,#F5F6F8)] text-[var(--signal-cobalt,#1D55F5)] rounded-[4px] text-[10px] font-bold">
              .JSON
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="hud-reticle px-4 py-1.5 bg-[var(--bg-pill-neutral,#E6E9EF)] hover:bg-[#D9DDE6] text-[var(--ink-primary,#181A20)] rounded-[6px] text-[10px] font-mono font-semibold uppercase tracking-wider cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
