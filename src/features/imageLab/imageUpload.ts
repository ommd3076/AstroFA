export const IMAGE_MAX_SIDE = 8192;
export const IMAGE_MAX_PIXELS = 40_000_000;
export const IMAGE_HEADER_SCAN_BYTES = 1024 * 1024;

export function isRasterDimensionsAllowed(width: number, height: number): boolean {
  return Number.isSafeInteger(width) && Number.isSafeInteger(height) && width > 0 && height > 0 &&
    width <= IMAGE_MAX_SIDE && height <= IMAGE_MAX_SIDE && width * height <= IMAGE_MAX_PIXELS;
}

export function projectReferencePointsToImage(points: Point2D[], width: number, height: number, scale: number): Point2D[] {
  return points.map(point => ({ x: width / 2 + point.x * scale, y: height / 2 - point.y * scale }));
}

/** Read dimensions from a bounded PNG/JPEG header before asking the browser to decode the image. */
export function parseRasterDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 24 && pngSignature.every((value, index) => bytes[index] === value) &&
      bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52) {
    const read32 = (offset: number) => bytes[offset] * 0x1000000 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3];
    return { width: read32(16), height: read32(20) };
  }
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset++] !== 0xff) return null;
    while (offset < bytes.length && bytes[offset] === 0xff) offset++;
    if (offset >= bytes.length) return null;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) return null;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) return null;
    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) return null;
    if (startOfFrame.has(marker)) {
      if (segmentLength < 7) return null;
      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      };
    }
    offset += segmentLength;
  }
  return null;
}
import type { Point2D } from '../../geometry/types';

