import { create } from 'zustand';
import type { Star, ObserverLocation } from '../types/astronomy';
import type { Point2D } from '../geometry/types';
import type { ReferencePattern, RecognitionReport } from '../recognition/types';
import { PRESET_OBSERVERS } from '../astronomy/coordinates';
import {
  REFERENCE_PATTERNS,
  MINIMIZED_DFA_MACHINE,
  STAR_BY_ID,
  CONSTELLATION_BY_ID,
} from '../data/astroData';
import { recognizePattern } from '../recognition/matcher';
import { projectRaDecToTangentPlane } from '../geometry/projection';

export type ActiveView =
  | 'sky'
  | 'tonight'
  | 'constellations'
  | 'automataLab'
  | 'hunt'
  | 'imageLab'
  | 'academic'
  | 'credits';

export type AutomataTab =
  | 'nfa'
  | 'closure'
  | 'subset'
  | 'dfa'
  | 'minimized'
  | 'simulator'
  | 'formal'
  | 'table';

export interface AstroState {
  // Navigation
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;

  // Observation settings
  observer: ObserverLocation;
  setObserver: (obs: ObserverLocation) => void;
  observationDate: Date;
  setObservationDate: (date: Date) => void;
  stepTime: (hours: number) => void;
  isTimePlaying: boolean;
  setIsTimePlaying: (playing: boolean) => void;
  timeSpeedMultiplier: number;
  setTimeSpeedMultiplier: (mult: number) => void;

  // Sky rendering toggles
  showConstellationLines: boolean;
  setShowConstellationLines: (v: boolean) => void;
  showConstellationLabels: boolean;
  setShowConstellationLabels: (v: boolean) => void;
  showHorizon: boolean;
  setShowHorizon: (v: boolean) => void;
  showEquatorialGrid: boolean;
  setShowEquatorialGrid: (v: boolean) => void;

  // Inspection & Focus
  selectedStarId: number | null;
  setSelectedStarId: (id: number | null) => void;
  focusedConstellationId: string | null;
  setFocusedConstellationId: (id: string | null) => void;
  targetFocusCoords: { ra: number; dec: number } | null;
  setTargetFocusCoords: (coords: { ra: number; dec: number } | null) => void;
  focusOnStar: (starId: number) => void;
  focusOnConstellation: (conId: string) => void;

  // Trace Mode & Pattern Recognition
  isTraceMode: boolean;
  setIsTraceMode: (v: boolean) => void;
  showTraceHints: boolean;
  setShowTraceHints: (v: boolean) => void;
  showPatternAnalysisModal: boolean;
  setShowPatternAnalysisModal: (v: boolean) => void;
  showRecognitionResultsModal: boolean;
  setShowRecognitionResultsModal: (v: boolean) => void;
  tracedStarIds: number[];
  tracedPoints: Point2D[];
  recognitionReport: RecognitionReport | null;
  addTracedStar: (star: Star) => void;
  addTracedCustomPoint: (pt: Point2D) => void;
  undoLastTracePoint: () => void;
  clearTrace: () => void;
  loadPresetTrace: (pattern: ReferencePattern) => void;

  // Automata Lab
  automataTab: AutomataTab;
  setAutomataTab: (tab: AutomataTab) => void;
  simulatorSymbols: string[];
  setSimulatorSymbols: (symbols: string[]) => void;
  simulatorStep: number;
  setSimulatorStep: (step: number | ((prev: number) => number)) => void;
  simulatorIsPlaying: boolean;
  setSimulatorIsPlaying: (v: boolean) => void;

  // Constellation Hunt Mode
  huntTarget: ReferencePattern | null;
  setHuntTarget: (target: ReferencePattern | null) => void;
  huntHintLevel: number; // 0: no hints, 1: region circle, 2: start star highlight, 3: ghost lines
  setHuntHintLevel: (level: number) => void;
  startNewHunt: (patternId?: string) => void;
}

export const useAstroStore = create<AstroState>((set, get) => ({
  // Defaults
  activeView: 'sky',
  setActiveView: view => set({ activeView: view }),

  observer: PRESET_OBSERVERS[0], // Greenwich prime meridian
  setObserver: obs => set({ observer: obs }),

  observationDate: new Date(),
  setObservationDate: date => set({ observationDate: date }),

  stepTime: hours => {
    const cur = get().observationDate;
    const next = new Date(cur.getTime() + hours * 3600 * 1000);
    set({ observationDate: next });
  },

  isTimePlaying: false,
  setIsTimePlaying: playing => set({ isTimePlaying: playing }),
  timeSpeedMultiplier: 60, // 1 min per sec
  setTimeSpeedMultiplier: mult => set({ timeSpeedMultiplier: mult }),

  showConstellationLines: true,
  setShowConstellationLines: v => set({ showConstellationLines: v }),
  showConstellationLabels: true,
  setShowConstellationLabels: v => set({ showConstellationLabels: v }),
  showHorizon: true,
  setShowHorizon: v => set({ showHorizon: v }),
  showEquatorialGrid: false,
  setShowEquatorialGrid: v => set({ showEquatorialGrid: v }),

  selectedStarId: null,
  setSelectedStarId: id => set({ selectedStarId: id }),
  focusedConstellationId: null,
  setFocusedConstellationId: id => set({ focusedConstellationId: id }),
  targetFocusCoords: null,
  setTargetFocusCoords: coords => set({ targetFocusCoords: coords }),

  focusOnStar: starId => {
    const star = STAR_BY_ID.get(starId);
    if (!star) return;
    set({
      selectedStarId: starId,
      focusedConstellationId: star.con || null,
      targetFocusCoords: { ra: star.ra, dec: star.dec },
      activeView: 'sky',
    });
  },

  focusOnConstellation: conId => {
    const con = get().observer ? CONSTELLATION_BY_ID.get(conId) : null;
    if (!con) return;
    set({
      focusedConstellationId: conId,
      targetFocusCoords: { ra: con.raCenter, dec: con.decCenter },
      activeView: 'sky',
    });
  },

  // Trace Mode
  isTraceMode: false,
  setIsTraceMode: v => {
    if (!v) {
      set({
        isTraceMode: false,
        tracedStarIds: [],
        tracedPoints: [],
        recognitionReport: null,
        showPatternAnalysisModal: false,
        showRecognitionResultsModal: false,
      });
    } else {
      set({ isTraceMode: true, showConstellationLines: false });
    }
  },

  showTraceHints: false,
  setShowTraceHints: v => set({ showTraceHints: v }),
  showPatternAnalysisModal: false,
  setShowPatternAnalysisModal: v => set({ showPatternAnalysisModal: v }),
  showRecognitionResultsModal: false,
  setShowRecognitionResultsModal: v => set({ showRecognitionResultsModal: v }),

  tracedStarIds: [],
  tracedPoints: [],
  recognitionReport: null,

  addTracedStar: star => {
    const { tracedStarIds } = get();
    // Allow clicking same star only if closing a loop, or don't duplicate consecutively
    if (tracedStarIds.length > 0 && tracedStarIds[tracedStarIds.length - 1] === star.id) {
      return;
    }

    const nextIds = [...tracedStarIds, star.id];
    // Project all traced stars onto local tangent plane centered at their group centroid
    const starCoords = nextIds.map(id => {
      const s = STAR_BY_ID.get(id)!;
      return { ra: s.ra, dec: s.dec };
    });

    const points2D = projectRaDecToTangentPlane(starCoords);
    const report = recognizePattern(points2D, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);

    set({
      tracedStarIds: nextIds,
      tracedPoints: points2D,
      recognitionReport: report,
      selectedStarId: star.id,
    });
  },

  addTracedCustomPoint: pt => {
    const { tracedPoints } = get();
    const nextPoints = [...tracedPoints, pt];
    const report = recognizePattern(nextPoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);
    set({
      tracedStarIds: [],
      tracedPoints: nextPoints,
      recognitionReport: report,
    });
  },

  undoLastTracePoint: () => {
    const { tracedStarIds, tracedPoints } = get();
    if (tracedStarIds.length > 0) {
      const nextIds = tracedStarIds.slice(0, -1);
      const starCoords = nextIds.map(id => {
        const s = STAR_BY_ID.get(id)!;
        return { ra: s.ra, dec: s.dec };
      });
      const points2D = projectRaDecToTangentPlane(starCoords);
      const report = points2D.length >= 2
        ? recognizePattern(points2D, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS)
        : null;
      set({
        tracedStarIds: nextIds,
        tracedPoints: points2D,
        recognitionReport: report,
      });
    } else if (tracedPoints.length > 0) {
      const nextPoints = tracedPoints.slice(0, -1);
      const report = nextPoints.length >= 2
        ? recognizePattern(nextPoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS)
        : null;
      set({
        tracedPoints: nextPoints,
        recognitionReport: report,
      });
    }
  },

  clearTrace: () => {
    set({
      tracedStarIds: [],
      tracedPoints: [],
      recognitionReport: null,
    });
  },

  loadPresetTrace: pattern => {
    set({
      isTraceMode: true,
      tracedStarIds: pattern.orderedStarIds,
      tracedPoints: pattern.referencePoints,
      recognitionReport: recognizePattern(pattern.referencePoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS),
      focusedConstellationId: pattern.constellationId,
      activeView: 'sky',
    });
  },

  // Automata Lab
  automataTab: 'nfa',
  setAutomataTab: tab => set({ automataTab: tab }),
  simulatorSymbols: ['LL:M', 'RR:M', 'L:M'], // default sample (Cassiopeia)
  setSimulatorSymbols: symbols => set({ simulatorSymbols: symbols, simulatorStep: 0, simulatorIsPlaying: false }),
  simulatorStep: 0,
  setSimulatorStep: stepOrFn => set(state => ({
    simulatorStep: typeof stepOrFn === 'function' ? stepOrFn(state.simulatorStep) : stepOrFn
  })),
  simulatorIsPlaying: false,
  setSimulatorIsPlaying: v => set({ simulatorIsPlaying: v }),

  // Constellation Hunt
  huntTarget: null,
  setHuntTarget: target => set({ huntTarget: target, huntHintLevel: 0 }),
  huntHintLevel: 0,
  setHuntHintLevel: level => set({ huntHintLevel: level }),
  startNewHunt: patternId => {
    let target: ReferencePattern;
    if (patternId) {
      target = REFERENCE_PATTERNS.find(p => p.id === patternId) || REFERENCE_PATTERNS[0];
    } else {
      const forwardPatterns = REFERENCE_PATTERNS.filter(p => p.traversalVariant === 'forward');
      target = forwardPatterns[Math.floor(Math.random() * forwardPatterns.length)];
    }

    set({
      huntTarget: target,
      huntHintLevel: 0,
      activeView: 'hunt',
      isTraceMode: true,
      showConstellationLines: false,
      showTraceHints: false,
      tracedStarIds: [],
      tracedPoints: [],
      recognitionReport: null,
      focusedConstellationId: target.constellationId,
      targetFocusCoords: {
        ra: CONSTELLATION_BY_ID.get(target.constellationId)?.raCenter || 0,
        dec: CONSTELLATION_BY_ID.get(target.constellationId)?.decCenter || 0,
      },
    });
  },
}));
