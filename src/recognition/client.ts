import type { Point2D } from '../geometry/types';
import type { BackendRecognitionCandidate, BackendRecognitionResult } from './types';

function isCandidate(value: unknown): value is BackendRecognitionCandidate {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return typeof c.patternId === 'string' && typeof c.constellationId === 'string' &&
    typeof c.patternName === 'string' && typeof c.residual === 'number' && Number.isFinite(c.residual) && c.residual >= 0 &&
    typeof c.isVerified === 'boolean' && typeof c.rotationDeg === 'number' && Number.isFinite(c.rotationDeg) &&
    typeof c.scale === 'number' && Number.isFinite(c.scale) && c.scale > 0;
}

function isResult(value: unknown): value is BackendRecognitionResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return ['FULL_MATCH', 'AMBIGUOUS', 'NO_MATCH'].includes(String(result.status)) &&
    Array.isArray(result.candidates) && result.candidates.length <= 128 && result.candidates.every(isCandidate) &&
    (result.bestMatch === null || isCandidate(result.bestMatch));
}

export async function recognizeTraceOnServer(points: Point2D[], signal?: AbortSignal): Promise<BackendRecognitionResult> {
  if (points.length < 3 || points.length > 128) throw new Error('Trace must contain between 3 and 128 points.');
  const response = await fetch('/api/recognize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points }),
    signal,
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && typeof (payload as { error?: unknown }).error === 'string'
      ? (payload as { error: string }).error
      : `Recognition service returned HTTP ${response.status}.`;
    throw new Error(message);
  }
  if (!isResult(payload)) throw new Error('Recognition service returned an invalid response.');
  return payload;
}

export function imagePointsToMath(points: Point2D[], imageHeight: number): Point2D[] {
  return points.map(({ x, y }) => ({ x, y: imageHeight - y }));
}
