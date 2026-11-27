import { afterEach, describe, expect, it, vi } from 'vitest';
import { recognizeTraceOnServer } from '../src/recognition/client';

describe('native recognition client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('posts only ordered points and accepts a valid native result', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 'FULL_MATCH',
      candidates: [{ patternId: 'Cas_fwd', constellationId: 'Cas', patternName: 'Cassiopeia', residual: 0.01, isVerified: true, rotationDeg: 4, scale: 2 }],
      bestMatch: { patternId: 'Cas_fwd', constellationId: 'Cas', patternName: 'Cassiopeia', residual: 0.01, isVerified: true, rotationDeg: 4, scale: 2 },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const points = [{ x: 1, y: 2 }, { x: 3, y: 4 }, { x: 5, y: 6 }];
    const result = await recognizeTraceOnServer(points);
    expect(result.status).toBe('FULL_MATCH');
    expect(fetchMock).toHaveBeenCalledWith('/api/recognize', expect.objectContaining({
      method: 'POST', body: JSON.stringify({ points }),
    }));
  });

  it('surfaces the native service error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'worker unavailable' }), { status: 503 })));
    await expect(recognizeTraceOnServer([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }]))
      .rejects.toThrow('worker unavailable');
  });

  it('rejects traces outside the native point-count limit before sending', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(recognizeTraceOnServer([{ x: 0, y: 0 }, { x: 1, y: 1 }])).rejects.toThrow('between 3 and 128');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
