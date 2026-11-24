# Gates: Sky rendering
OWNS: src/sky/**
Scope: Sky rendering

- [x] G1: Rendering remains stable at idle and answers drag, focus, selection, time, trace, and resize
  EVIDENCE: Final browser-2026-11-14T07-21-25-759Z/run-summary.json: idle screenshot hashes matched, drag changed rendering, and chart reflowed at 1024 and 390. Focus, time and render scheduling paths inspected in owning source.
