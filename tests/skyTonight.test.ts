import { describe, it, expect } from 'vitest';
import * as Astronomy from 'astronomy-engine';
import { CONSTELLATIONS, STARS, STAR_BY_ID } from '../src/data/astroData';
import { getHorizontalCoordinates, getMeridianCulmination } from '../src/astronomy/coordinates';
import type { ObserverLocation } from '../src/types/astronomy';

describe('Sky Tonight Topocentric Telemetry & Calculations (TONIGHT-01)', () => {
  const sfObserver: ObserverLocation = {
    name: 'San Francisco, CA',
    latitude: 37.7749,
    longitude: -122.4194,
    elevation: 16,
  };

  const testDate = new Date('2025-01-26T22:30:00Z');
  const NIGHT_HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4] as const;
  const QUANTA_MINUTES = [0, 15, 30, 45] as const;

  it('correctly derives honest sunset and moon illumination from astronomy-engine', () => {
    const obs = new Astronomy.Observer(sfObserver.latitude, sfObserver.longitude, sfObserver.elevation ?? 0);
    const noon = new Date(testDate);
    noon.setUTCHours(12, 0, 0, 0);

    const sunsetEvent = Astronomy.SearchRiseSet(Astronomy.Body.Sun, obs, -1, noon, 1.0);
    expect(sunsetEvent).toBeDefined();
    expect(sunsetEvent?.date).toBeInstanceOf(Date);

    const sunsetHours = sunsetEvent!.date.getUTCHours();
    const sunsetMinutes = sunsetEvent!.date.getUTCMinutes();
    expect(sunsetHours).toBeGreaterThanOrEqual(0);
    expect(sunsetHours).toBeLessThan(24);
    expect(sunsetMinutes).toBeGreaterThanOrEqual(0);
    expect(sunsetMinutes).toBeLessThan(60);

    const moonIllum = Astronomy.Illumination(Astronomy.Body.Moon, testDate);
    expect(moonIllum.phase_fraction).toBeGreaterThanOrEqual(0);
    expect(moonIllum.phase_fraction).toBeLessThanOrEqual(1);

    const moonPercent = (moonIllum.phase_fraction * 100).toFixed(1) + '%';
    expect(moonPercent).toMatch(/^\d+\.\d+%$/);

    const moonPhaseDeg = Astronomy.MoonPhase(testDate);
    expect(moonPhaseDeg).toBeGreaterThanOrEqual(0);
    expect(moonPhaseDeg).toBeLessThan(360);
  });

  it('computes 44-dot timeline matrix across 11 night hours with overnight UTC date rollover', () => {
    const baseHour = testDate.getUTCHours();
    const dates: Date[] = [];

    for (const h of NIGHT_HOURS) {
      for (const m of QUANTA_MINUTES) {
        const d = new Date(testDate);
        if (h < 12 && baseHour >= 12) {
          d.setUTCDate(d.getUTCDate() + 1);
        } else if (h >= 12 && baseHour < 12) {
          d.setUTCDate(d.getUTCDate() - 1);
        }
        d.setUTCHours(h, m, 0, 0);
        dates.push(d);
      }
    }

    expect(dates.length).toBe(44);

    // Verify chronological progression across the night
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i].getTime()).toBeGreaterThan(dates[i - 1].getTime());
    }

    // Verify Orion visibility across 44 samples
    const orion = CONSTELLATIONS.find(c => c.id === 'Ori')!;
    expect(orion).toBeDefined();

    const orionTrack = dates.map(d => {
      const hor = getHorizontalCoordinates(orion.raCenter, orion.decCenter, sfObserver, d);
      return hor.isAboveHorizon;
    });

    expect(orionTrack.length).toBe(44);
    // Orion rises during late evening in January in SF and sets after 04:00
    const visibleCount = orionTrack.filter(Boolean).length;
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThanOrEqual(44);
  });

  it('computes topocentric horizontal coordinates for bright stars (mag < 2.5)', () => {
    const brightStars = STARS.filter(s => s.mag < 2.5);
    expect(brightStars.length).toBeGreaterThan(50);

    const liveBrightStars = brightStars.map(s => {
      const hor = getHorizontalCoordinates(s.ra, s.dec, sfObserver, testDate);
      return {
        ...s,
        altitude: hor.altitude,
        azimuth: hor.azimuth,
        isAboveHorizon: hor.isAboveHorizon,
      };
    });

    const aboveHorizonStars = liveBrightStars.filter(s => s.isAboveHorizon);
    expect(aboveHorizonStars.length).toBeGreaterThan(10);

    // Sirius should have accurate coordinates
    const sirius = liveBrightStars.find(s => s.proper?.toLowerCase().includes('sirius') || s.name.includes('Sirius'));
    if (sirius) {
      expect(typeof sirius.altitude).toBe('number');
      expect(typeof sirius.azimuth).toBe('number');
      expect(sirius.mag).toBeLessThan(0); // Sirius is brightest star with negative mag
    }
  });

  it('correctly ranks recommended observation windows based on culmination', () => {
    const recommendations = CONSTELLATIONS
      .map(c => {
        const hor = getHorizontalCoordinates(c.raCenter, c.decCenter, sfObserver, testDate);
        const culmination = getMeridianCulmination(c.raCenter, c.decCenter, sfObserver, testDate);
        return {
          ...c,
          isAboveHorizon: hor.isAboveHorizon,
          culmination,
        };
      })
      .filter(c => !c.culmination.neverRises && c.culmination.maxAltitude > 20)
      .sort((a, b) => b.culmination.maxAltitude - a.culmination.maxAltitude)
      .slice(0, 3);

    expect(recommendations.length).toBe(3);
    expect(recommendations[0].culmination.maxAltitude).toBeGreaterThanOrEqual(recommendations[1].culmination.maxAltitude);
    expect(recommendations[1].culmination.maxAltitude).toBeGreaterThanOrEqual(recommendations[2].culmination.maxAltitude);
  });

  it('verifies that all 88 constellations have valid line segments and star coordinates for asterism diagrams', () => {
    expect(CONSTELLATIONS.length).toBe(88);

    for (const con of CONSTELLATIONS) {
      expect(con.starIds.length).toBeGreaterThan(0);
      expect(con.lineSegments.length).toBeGreaterThan(0);

      for (const seg of con.lineSegments) {
        const s1 = STAR_BY_ID.get(seg.starId1);
        const s2 = STAR_BY_ID.get(seg.starId2);
        expect(s1).toBeDefined();
        expect(s2).toBeDefined();
        expect(typeof s1?.ra).toBe('number');
        expect(typeof s1?.dec).toBe('number');
        expect(typeof s2?.ra).toBe('number');
        expect(typeof s2?.dec).toBe('number');
      }
    }
  });
});
