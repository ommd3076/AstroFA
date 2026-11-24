/**
 * Formatting utilities for astronomical and geographic telemetry
 */

export const formatObserverCoordinates = (
  latitude: number,
  longitude: number,
  precision = 1,
): string => {
  const latitudeHemisphere = latitude < 0 ? 'S' : 'N';
  const longitudeHemisphere = longitude < 0 ? 'W' : 'E';
  return `${Math.abs(latitude).toFixed(precision)}°${latitudeHemisphere}, ${Math.abs(longitude).toFixed(precision)}°${longitudeHemisphere}`;
};
