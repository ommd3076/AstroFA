import { describe, expect, it } from 'vitest';
import { formatObserverCoordinates } from '../src/utils/format';

describe('observer coordinate labels', () => {
  it('labels Sydney in the southern and eastern hemispheres', () => {
    expect(formatObserverCoordinates(-33.8688, 151.2093)).toBe('33.9°S, 151.2°E');
  });

  it('labels Greenwich in the northern hemisphere and west of the prime meridian', () => {
    expect(formatObserverCoordinates(51.4769, -0.0005, 2)).toBe('51.48°N, 0.00°W');
  });

  it('uses north and east for coordinates on the equator and prime meridian', () => {
    expect(formatObserverCoordinates(0, 0)).toBe('0.0°N, 0.0°E');
  });
});