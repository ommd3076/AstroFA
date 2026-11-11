import type { TurnCategory, DistanceCategory, QuantizedStep, EncodedGeometry, Point2D } from './types';
import { normalizeGeometry } from './normalize';

export const ANGLE_THRESHOLDS = {
  SHARP_LEFT: 65,
  LEFT: 20,
  STRAIGHT_MIN: -20,
  SHARP_RIGHT: -65,
  TOLERANCE_DEG: 7.5,
};

export const RATIO_THRESHOLDS = {
  SHORT_MAX: 0.75,
  LONG_MIN: 1.35,
  TOLERANCE_RATIO: 0.12,
};

/**
 * Quantizes a turning angle in degrees [-180, +180] into a discrete TurnCategory.
 */
export function quantizeTurnAngle(angleDeg: number): {
  category: TurnCategory;
  isNearBoundary: boolean;
  alternateCategories: TurnCategory[];
} {
  const { SHARP_LEFT, LEFT, STRAIGHT_MIN, SHARP_RIGHT, TOLERANCE_DEG } = ANGLE_THRESHOLDS;
  let category: TurnCategory;
  let isNearBoundary = false;
  const alternates: TurnCategory[] = [];

  if (angleDeg >= SHARP_LEFT) {
    category = 'LL';
    if (Math.abs(angleDeg - SHARP_LEFT) <= TOLERANCE_DEG) {
      isNearBoundary = true;
      alternates.push('L');
    }
  } else if (angleDeg >= LEFT) {
    category = 'L';
    if (Math.abs(angleDeg - SHARP_LEFT) <= TOLERANCE_DEG) {
      isNearBoundary = true;
      alternates.push('LL');
    }
    if (Math.abs(angleDeg - LEFT) <= TOLERANCE_DEG) {
      isNearBoundary = true;
      alternates.push('S');
    }
  } else if (angleDeg >= STRAIGHT_MIN) {
    category = 'S';
    if (Math.abs(angleDeg - LEFT) <= TOLERANCE_DEG) {
      isNearBoundary = true;
      alternates.push('L');
    }
    if (Math.abs(angleDeg - STRAIGHT_MIN) <= TOLERANCE_DEG) {
      isNearBoundary = true;
      alternates.push('R');
    }
  } else if (angleDeg >= SHARP_RIGHT) {
    category = 'R';
    if (Math.abs(angleDeg - STRAIGHT_MIN) <= TOLERANCE_DEG) {
      isNearBoundary = true;
      alternates.push('S');
    }
    if (Math.abs(angleDeg - SHARP_RIGHT) <= TOLERANCE_DEG) {
      isNearBoundary = true;
      alternates.push('RR');
    }
  } else {
    category = 'RR';
    if (Math.abs(angleDeg - SHARP_RIGHT) <= TOLERANCE_DEG) {
      isNearBoundary = true;
      alternates.push('R');
    }
  }

  return { category, isNearBoundary, alternateCategories: alternates };
}

/**
 * Quantizes an edge length ratio into a discrete DistanceCategory.
 */
export function quantizeDistanceRatio(ratio: number): {
  category: DistanceCategory;
  isNearBoundary: boolean;
  alternateCategories: DistanceCategory[];
} {
  const { SHORT_MAX, LONG_MIN, TOLERANCE_RATIO } = RATIO_THRESHOLDS;
  let category: DistanceCategory;
  let isNearBoundary = false;
  const alternates: DistanceCategory[] = [];

  if (ratio < SHORT_MAX) {
    category = 'S';
    if (Math.abs(ratio - SHORT_MAX) <= TOLERANCE_RATIO) {
      isNearBoundary = true;
      alternates.push('M');
    }
  } else if (ratio <= LONG_MIN) {
    category = 'M';
    if (Math.abs(ratio - SHORT_MAX) <= TOLERANCE_RATIO) {
      isNearBoundary = true;
      alternates.push('S');
    }
    if (Math.abs(ratio - LONG_MIN) <= TOLERANCE_RATIO) {
      isNearBoundary = true;
      alternates.push('G');
    }
  } else {
    category = 'G';
    if (Math.abs(ratio - LONG_MIN) <= TOLERANCE_RATIO) {
      isNearBoundary = true;
      alternates.push('M');
    }
  }

  return { category, isNearBoundary, alternateCategories: alternates };
}

/**
 * Encodes an ordered path of 2D points into a normalized geometric feature sequence
 * and discrete symbol alphabet Σ.
 */
export function encodeGeometry(points: Point2D[]): EncodedGeometry {
  const normalized = normalizeGeometry(points);
  const steps: QuantizedStep[] = [];
  const symbols: string[] = [];
  const toleranceAlternates: Record<number, string[]> = {};

  for (let i = 0; i < normalized.turnAngles.length; i++) {
    const angle = normalized.turnAngles[i];
    const ratio = normalized.lengthRatios[i];

    const turnRes = quantizeTurnAngle(angle);
    const distRes = quantizeDistanceRatio(ratio);

    const primarySymbol = `${turnRes.category}:${distRes.category}`;
    symbols.push(primarySymbol);

    // Compute alternate symbols if near boundaries
    const altSymbols: string[] = [];
    const allTurns = [turnRes.category, ...turnRes.alternateCategories];
    const allDists = [distRes.category, ...distRes.alternateCategories];

    for (const t of allTurns) {
      for (const d of allDists) {
        const candidate = `${t}:${d}`;
        if (candidate !== primarySymbol && !altSymbols.includes(candidate)) {
          altSymbols.push(candidate);
        }
      }
    }

    if (altSymbols.length > 0) {
      toleranceAlternates[i] = altSymbols;
    }

    steps.push({
      turnCategory: turnRes.category,
      distanceCategory: distRes.category,
      symbol: primarySymbol,
      turnAngleDeg: Number(angle.toFixed(1)),
      lengthRatio: Number(ratio.toFixed(2)),
      isAngleNearBoundary: turnRes.isNearBoundary,
      isRatioNearBoundary: distRes.isNearBoundary,
      alternateSymbols: altSymbols,
    });
  }

  return {
    points,
    normalizedPoints: normalized.normalizedPoints,
    symbols,
    steps,
    toleranceAlternates,
  };
}
