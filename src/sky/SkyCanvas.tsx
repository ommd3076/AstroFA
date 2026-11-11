import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAstroStore } from '../stores/useAstroStore';
import {
  STARS,
  CONSTELLATIONS,
  STAR_BY_ID,
  CONSTELLATION_BY_ID,
} from '../data/astroData';
import {
  raDecToCartesian,
  bvToColorHex,
  getHorizontalCoordinates,
  getEquatorialToThreeJsHorizontalMatrix,
} from '../astronomy/coordinates';
import type { Star } from '../types/astronomy';

// Helper to generate a soft circular stellar point texture
function createStarTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(230, 245, 255, 0.9)');
  gradient.addColorStop(0.5, 'rgba(160, 210, 255, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.premultiplyAlpha = true;
  return texture;
}

export const SkyCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgOverlayRef = useRef<SVGSVGElement>(null);

  const {
    observer,
    observationDate,
    stepTime,
    isTimePlaying,
    timeSpeedMultiplier,
    showConstellationLines,
    showConstellationLabels,
    showHorizon,
    showEquatorialGrid,
    showTraceHints,
    selectedStarId,
    setSelectedStarId,
    focusedConstellationId,
    setFocusedConstellationId,
    targetFocusCoords,
    isTraceMode,
    tracedStarIds,
    addTracedStar,
    huntTarget,
    huntHintLevel,
  } = useAstroStore();

  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const celestialGroupRef = useRef<THREE.Group | null>(null);
  const starPointsRef = useRef<THREE.Points | null>(null);
  const normalLinesMeshRef = useRef<THREE.LineSegments | null>(null);
  const focusedLinesMeshRef = useRef<THREE.LineSegments | null>(null);
  const traceLineMeshRef = useRef<THREE.Line | null>(null);
  const hintLinesMeshRef = useRef<THREE.LineSegments | null>(null);
  const horizonGroupRef = useRef<THREE.Group | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);

  // Camera look rotation angles (azimuth and elevation in radians)
  const lookAngles = useRef({ az: 0, el: Math.PI / 6 });
  const targetLookAngles = useRef<{ az: number; el: number } | null>(null);

  // Drag detection to distinguish camera panning from star clicking
  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const syncSvgOverlayRef = useRef<() => void>(() => {});
  const requestRenderRef = useRef<() => void>(() => {});
  const lastSvgContentRef = useRef<string>('');
  const isRenderScheduled = useRef(false);
  const animFrameId = useRef<number | null>(null);

  // 1. Initialize Scene & Three.js Canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060A14); // Deep space viewport background (--bg-viewport: #060A14)
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Master group for all celestial objects (rotates according to observer frame)
    const celestialGroup = new THREE.Group();
    scene.add(celestialGroup);
    celestialGroupRef.current = celestialGroup;

    // --- Build Starfield ---
    const starCount = STARS.length;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const tempColor = new THREE.Color();
    for (let i = 0; i < starCount; i++) {
      const star = STARS[i];
      const [x, y, z] = raDecToCartesian(star.ra, star.dec, 500);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      tempColor.set(bvToColorHex(star.ci));
      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;

      // Magnitude scaling: Sirius (-1.44) -> ~9px, mag 6.5 -> ~1.8px
      const size = Math.max(1.8, 8.5 - 1.05 * star.mag);
      sizes[i] = size;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starMaterial = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      map: createStarTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: false,
    });

    const starPoints = new THREE.Points(starGeometry, starMaterial);
    celestialGroup.add(starPoints);
    starPointsRef.current = starPoints;

    // --- Build Constellation Lines ---
    const normalLinePositions: number[] = [];
    for (const c of CONSTELLATIONS) {
      for (const seg of c.lineSegments) {
        const s1 = STAR_BY_ID.get(seg.starId1);
        const s2 = STAR_BY_ID.get(seg.starId2);
        if (s1 && s2) {
          const [x1, y1, z1] = raDecToCartesian(s1.ra, s1.dec, 498);
          const [x2, y2, z2] = raDecToCartesian(s2.ra, s2.dec, 498);
          normalLinePositions.push(x1, y1, z1, x2, y2, z2);
        }
      }
    }

    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(normalLinePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    const normalLines = new THREE.LineSegments(lineGeom, lineMat);
    celestialGroup.add(normalLines);
    normalLinesMeshRef.current = normalLines;

    // Highlighted / Focused Constellation Lines
    const focusedGeom = new THREE.BufferGeometry();
    const focusedMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const focusedLines = new THREE.LineSegments(focusedGeom, focusedMat);
    celestialGroup.add(focusedLines);
    focusedLinesMeshRef.current = focusedLines;

    // Ghost Hint Lines for Trace Mode
    const hintGeom = new THREE.BufferGeometry();
    const hintMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const hintLines = new THREE.LineSegments(hintGeom, hintMat);
    celestialGroup.add(hintLines);
    hintLinesMeshRef.current = hintLines;

    // --- Trace Line Mesh ---
    const traceGeom = new THREE.BufferGeometry();
    const traceMat = new THREE.LineBasicMaterial({
      color: 0x38ef7d,
      linewidth: 3,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const traceLine = new THREE.Line(traceGeom, traceMat);
    celestialGroup.add(traceLine);
    traceLineMeshRef.current = traceLine;

    // --- Build Horizon & Compass Group (Fixed in topocentric horizon frame) ---
    const horizonGroup = new THREE.Group();
    scene.add(horizonGroup);
    horizonGroupRef.current = horizonGroup;

    // Horizon Ring at altitude = 0 (Y=0 in horizontal coordinate system)
    const ringRadius = 496;
    const ringSegments = 128;
    const ringPts: THREE.Vector3[] = [];
    for (let i = 0; i <= ringSegments; i++) {
      const theta = (i / ringSegments) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(ringRadius * Math.sin(theta), 0, -ringRadius * Math.cos(theta)));
    }
    const ringGeom = new THREE.BufferGeometry().setFromPoints(ringPts);
    const ringMat = new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.8 });
    const ringLine = new THREE.Line(ringGeom, ringMat);
    horizonGroup.add(ringLine);

    // Ground disc (subtle dark mask for beneath the horizon)
    const groundGeom = new THREE.CylinderGeometry(ringRadius, ringRadius, 400, 64, 1, false);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.9,
      depthWrite: true,
    });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.position.y = -200;
    horizonGroup.add(groundMesh);

    // --- Equatorial Coordinate Grid (optional toggle) ---
    const gridGroup = new THREE.Group();
    celestialGroup.add(gridGroup);
    gridGroupRef.current = gridGroup;

    // Declination circles
    for (let dec = -80; dec <= 80; dec += 20) {
      const pts: THREE.Vector3[] = [];
      for (let ra = 0; ra <= 360; ra += 4) {
        const [x, y, z] = raDecToCartesian(ra, dec, 497);
        pts.push(new THREE.Vector3(x, y, z));
      }
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.2 });
      gridGroup.add(new THREE.Line(g, m));
    }

    // Demand-driven Render Frame (MOTION-01: 0 idle RAFs, 0 idle renders)
    const renderFrame = () => {
      isRenderScheduled.current = false;
      animFrameId.current = null;

      if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

      // Camera orientation from lookAngles
      const cam = cameraRef.current;
      if (cam) {
        const { az, el } = lookAngles.current;
        const targetX = 500 * Math.cos(el) * Math.sin(az);
        const targetY = 500 * Math.sin(el);
        const targetZ = -500 * Math.cos(el) * Math.cos(az);
        cam.position.set(0, 0, 0);
        cam.lookAt(targetX, targetY, targetZ);
      }

      rendererRef.current.render(sceneRef.current, cam);

      // Synchronize SVG overlay for numbered trace points and labels
      syncSvgOverlayRef.current();
    };

    const requestRender = () => {
      if (!isRenderScheduled.current) {
        isRenderScheduled.current = true;
        animFrameId.current = requestAnimationFrame(renderFrame);
      }
    };
    requestRenderRef.current = requestRender;

    // Attach ResizeObserver to canvas container for reliable responsive sizing (MOTION-01)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
          requestRender();
        }
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial render
    requestRender();

    return () => {
      if (animFrameId.current !== null) {
        cancelAnimationFrame(animFrameId.current);
      }
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Synchronize SVG overlay elements directly without triggering React re-renders
  const syncSvgOverlay = () => {
    if (!svgOverlayRef.current || !cameraRef.current || !containerRef.current || !celestialGroupRef.current) return;
    const cam = cameraRef.current;
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const matrixWorld = celestialGroupRef.current.matrixWorld;

    const overlay = svgOverlayRef.current;
    let svgContent = '';

    // 1. Render Cardinal Compass labels on horizon (North=-Z, East=+X, South=+Z, West=-X)
    const cardinals = [
      { label: 'N', x: 0, y: 5, z: -496, color: '#EF4444' },
      { label: 'E', x: 496, y: 5, z: 0, color: '#1D55F5' },
      { label: 'S', x: 0, y: 5, z: 496, color: '#8FA4C4' },
      { label: 'W', x: -496, y: 5, z: 0, color: '#1D55F5' },
    ];
    for (const c of cardinals) {
      const p = new THREE.Vector3(c.x, c.y, c.z).project(cam);
      if (p.z < 1) {
        const sx = (p.x * 0.5 + 0.5) * w;
        const sy = (-p.y * 0.5 + 0.5) * h;
        svgContent += `
          <g transform="translate(${sx}, ${sy})">
            <line x1="0" y1="-8" x2="0" y2="-3" stroke="${c.color}" stroke-width="1.25"/>
            <text x="0" y="5" font-family="'IBM Plex Mono', monospace" font-size="11" font-weight="700" letter-spacing="0.08em" fill="${c.color}" text-anchor="middle" dominant-baseline="middle">${c.label}</text>
          </g>
        `;
      }
    }

    // 2. Render Constellation Labels when toggle is ON
    if (showConstellationLabels) {
      for (const con of CONSTELLATIONS) {
        const [cx, cy, cz] = raDecToCartesian(con.raCenter, con.decCenter, 497);
        const pWorld = new THREE.Vector3(cx, cy, cz).applyMatrix4(matrixWorld);
        // Only show if above horizon (Y > 0)
        if (pWorld.y > 10) {
          const p = pWorld.project(cam);
          if (p.z < 1) {
            const sx = (p.x * 0.5 + 0.5) * w;
            const sy = (-p.y * 0.5 + 0.5) * h;
            const isFocused = con.id === focusedConstellationId;
            const fill = isFocused ? '#1D55F5' : '#8FA4C4';
            const size = isFocused ? '10' : '9';
            const weight = isFocused ? '700' : '500';
            const conNameUpper = con.name.toUpperCase();
            svgContent += `<text x="${sx}" y="${sy}" font-family="'IBM Plex Mono', monospace" font-size="${size}" font-weight="${weight}" letter-spacing="0.08em" fill="${fill}" text-anchor="middle" dominant-baseline="middle" opacity="0.9">${conNameUpper}</text>`;
          }
        }
      }
    }

    // 3. Render Numbered Badges for Traced Stars (Precision Hardware Markers)
    if (isTraceMode && tracedStarIds.length > 0) {
      tracedStarIds.forEach((sid, idx) => {
        const star = STAR_BY_ID.get(sid);
        if (!star) return;
        const [sx3, sy3, sz3] = raDecToCartesian(star.ra, star.dec, 496);
        const pWorld = new THREE.Vector3(sx3, sy3, sz3).applyMatrix4(matrixWorld);
        const p = pWorld.project(cam);
        if (p.z < 1) {
          const sx = (p.x * 0.5 + 0.5) * w;
          const sy = (-p.y * 0.5 + 0.5) * h;
          const starLabel = (star.proper || star.name).toUpperCase();
          const labelWidth = Math.max(48, starLabel.length * 6.5 + 12);
          svgContent += `
            <g transform="translate(${sx}, ${sy})">
              <!-- Precision hardware marker with 1px border -->
              <rect x="-10" y="-10" width="20" height="20" rx="2" fill="#080E1C" stroke="#1D55F5" stroke-width="1"/>
              <line x1="-3" y1="0" x2="3" y2="0" stroke="#6892F6" stroke-width="0.75"/>
              <line x1="0" y1="-3" x2="0" y2="3" stroke="#6892F6" stroke-width="0.75"/>
              <text x="0" y="0.5" text-anchor="middle" dominant-baseline="middle" fill="#E0E8F9" font-family="'Doto', 'IBM Plex Mono', monospace" font-size="11" font-weight="700">${idx + 1}</text>
              <!-- Star name hardware tag -->
              <g transform="translate(14, -8)">
                <rect x="0" y="0" width="${labelWidth}" height="16" rx="2" fill="#060A14" stroke="#232D42" stroke-width="1"/>
                <text x="6" y="11" fill="#C7D5EC" font-family="'IBM Plex Mono', monospace" font-size="9" font-weight="600" letter-spacing="0.08em">${starLabel}</text>
              </g>
            </g>
          `;
        }
      });
    }

    // 4. Render Target Reticle for Selected Star (Precision Concentric Crosshairs with 4px Corner Ticks)
    if (selectedStarId !== null) {
      const selStar = STAR_BY_ID.get(selectedStarId);
      if (selStar) {
        const [sx3, sy3, sz3] = raDecToCartesian(selStar.ra, selStar.dec, 496);
        const pWorld = new THREE.Vector3(sx3, sy3, sz3).applyMatrix4(matrixWorld);
        const p = pWorld.project(cam);
        if (p.z < 1) {
          const sx = (p.x * 0.5 + 0.5) * w;
          const sy = (-p.y * 0.5 + 0.5) * h;
          svgContent += `
            <g transform="translate(${sx}, ${sy})">
              <!-- Precision Concentric Rings -->
              <circle r="7" fill="none" stroke="#1D55F5" stroke-width="1"/>
              <circle r="15" fill="none" stroke="#6892F6" stroke-width="0.75" stroke-dasharray="2,2"/>
              <!-- Crosshair Ticks -->
              <line x1="-22" y1="0" x2="-10" y2="0" stroke="#1D55F5" stroke-width="1"/>
              <line x1="10" y1="0" x2="22" y2="0" stroke="#1D55F5" stroke-width="1"/>
              <line x1="0" y1="-22" x2="0" y2="-10" stroke="#1D55F5" stroke-width="1"/>
              <line x1="0" y1="10" x2="0" y2="22" stroke="#1D55F5" stroke-width="1"/>
              <!-- 4px Corner Bracket Ticks (#8FA4C4) -->
              <polyline points="-19,-15 -19,-19 -15,-19" fill="none" stroke="#8FA4C4" stroke-width="1.25"/>
              <polyline points="15,-19 19,-19 19,-15" fill="none" stroke="#8FA4C4" stroke-width="1.25"/>
              <polyline points="-19,15 -19,19 -15,19" fill="none" stroke="#8FA4C4" stroke-width="1.25"/>
              <polyline points="15,19 19,19 19,15" fill="none" stroke="#8FA4C4" stroke-width="1.25"/>
            </g>
          `;
        }
      }
    }

    // Diff SVG overlay innerHTML to eliminate DOM thrash (MOTION-01)
    if (overlay.innerHTML !== svgContent) {
      overlay.innerHTML = svgContent;
      lastSvgContentRef.current = svgContent;
    }
  };

  useEffect(() => {
    syncSvgOverlayRef.current = syncSvgOverlay;
  });

  // 2. Rotate Celestial Sphere according to Observer & Date/Time
  useEffect(() => {
    if (!celestialGroupRef.current) return;
    const m = getEquatorialToThreeJsHorizontalMatrix(observer, observationDate);

    // Apply exact 4x4 topocentric transformation matrix
    const matrix = new THREE.Matrix4();
    matrix.set(
      m[0], m[1], m[2], m[3],
      m[4], m[5], m[6], m[7],
      m[8], m[9], m[10], m[11],
      m[12], m[13], m[14], m[15]
    );
    celestialGroupRef.current.setRotationFromMatrix(matrix);
    requestRenderRef.current();
  }, [observer, observationDate]);

  // 3. Time progression simulation loop
  useEffect(() => {
    if (!isTimePlaying) return;
    const interval = setInterval(() => {
      stepTime(timeSpeedMultiplier / 3600); // step in hours
    }, 100);
    return () => clearInterval(interval);
  }, [isTimePlaying, timeSpeedMultiplier, stepTime]);

  // 4. Update Toggles (Lines, Horizon, Grid)
  useEffect(() => {
    if (normalLinesMeshRef.current) normalLinesMeshRef.current.visible = showConstellationLines;
    if (horizonGroupRef.current) horizonGroupRef.current.visible = showHorizon;
    if (gridGroupRef.current) gridGroupRef.current.visible = showEquatorialGrid;
    requestRenderRef.current();
  }, [showConstellationLines, showHorizon, showEquatorialGrid]);

  // 5. Update Focused Constellation Lines
  useEffect(() => {
    if (!focusedLinesMeshRef.current) return;
    if (!focusedConstellationId) {
      focusedLinesMeshRef.current.geometry.dispose();
      focusedLinesMeshRef.current.geometry = new THREE.BufferGeometry();
      requestRenderRef.current();
      return;
    }

    const con = CONSTELLATION_BY_ID.get(focusedConstellationId);
    if (!con || con.lineSegments.length === 0) {
      focusedLinesMeshRef.current.geometry.dispose();
      focusedLinesMeshRef.current.geometry = new THREE.BufferGeometry();
      requestRenderRef.current();
      return;
    }

    const pts: number[] = [];
    for (const seg of con.lineSegments) {
      const s1 = STAR_BY_ID.get(seg.starId1);
      const s2 = STAR_BY_ID.get(seg.starId2);
      if (s1 && s2) {
        const [x1, y1, z1] = raDecToCartesian(s1.ra, s1.dec, 497.5);
        const [x2, y2, z2] = raDecToCartesian(s2.ra, s2.dec, 497.5);
        pts.push(x1, y1, z1, x2, y2, z2);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    focusedLinesMeshRef.current.geometry.dispose();
    focusedLinesMeshRef.current.geometry = geom;
    requestRenderRef.current();
  }, [focusedConstellationId]);

  // 6. Update Ghost Hint Lines in Trace / Hunt Mode
  useEffect(() => {
    if (!hintLinesMeshRef.current) return;
    const shouldShowHints = isTraceMode && (showTraceHints || huntHintLevel >= 2);
    if (!shouldShowHints || (!focusedConstellationId && !huntTarget)) {
      hintLinesMeshRef.current.geometry.dispose();
      hintLinesMeshRef.current.geometry = new THREE.BufferGeometry();
      requestRenderRef.current();
      return;
    }

    const conId = huntTarget?.constellationId || focusedConstellationId;
    const con = conId ? CONSTELLATION_BY_ID.get(conId) : null;
    if (!con) return;

    const pts: number[] = [];
    for (const seg of con.lineSegments) {
      const s1 = STAR_BY_ID.get(seg.starId1);
      const s2 = STAR_BY_ID.get(seg.starId2);
      if (s1 && s2) {
        const [x1, y1, z1] = raDecToCartesian(s1.ra, s1.dec, 496.5);
        const [x2, y2, z2] = raDecToCartesian(s2.ra, s2.dec, 496.5);
        pts.push(x1, y1, z1, x2, y2, z2);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    hintLinesMeshRef.current.geometry.dispose();
    hintLinesMeshRef.current.geometry = geom;
    requestRenderRef.current();
  }, [isTraceMode, showTraceHints, huntHintLevel, focusedConstellationId, huntTarget]);

  // 7. Update Traced Star Lines
  useEffect(() => {
    if (!traceLineMeshRef.current) return;
    if (!isTraceMode || tracedStarIds.length < 2) {
      traceLineMeshRef.current.geometry.dispose();
      traceLineMeshRef.current.geometry = new THREE.BufferGeometry();
      requestRenderRef.current();
      return;
    }

    const pts: THREE.Vector3[] = [];
    for (const sid of tracedStarIds) {
      const star = STAR_BY_ID.get(sid);
      if (star) {
        const [x, y, z] = raDecToCartesian(star.ra, star.dec, 496);
        pts.push(new THREE.Vector3(x, y, z));
      }
    }

    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    traceLineMeshRef.current.geometry.dispose();
    traceLineMeshRef.current.geometry = geom;
    requestRenderRef.current();
  }, [isTraceMode, tracedStarIds]);

  // 8. Focus camera smoothly when targetFocusCoords or focusedConstellationId changes
  useEffect(() => {
    let targetRa: number | null = null;
    let targetDec: number | null = null;

    if (targetFocusCoords) {
      targetRa = targetFocusCoords.ra;
      targetDec = targetFocusCoords.dec;
    } else if (focusedConstellationId) {
      const con = CONSTELLATION_BY_ID.get(focusedConstellationId);
      if (con) {
        targetRa = con.raCenter;
        targetDec = con.decCenter;
      }
    }

    if (targetRa !== null && targetDec !== null) {
      const hor = getHorizontalCoordinates(targetRa, targetDec, observer, observationDate);
      const targetAz = (hor.azimuth * Math.PI) / 180;
      const targetEl = (Math.max(-75, Math.min(85, hor.altitude)) * Math.PI) / 180;
      // Immediate assignment without 8% easing or snap threshold (MOTION-01)
      lookAngles.current = { az: targetAz, el: targetEl };
      targetLookAngles.current = null;
      requestRenderRef.current();
    }
  }, [targetFocusCoords, focusedConstellationId, observer, observationDate]);

  // Synchronize overlay on toggle, selection or hunt change
  useEffect(() => {
    requestRenderRef.current();
  }, [showConstellationLabels, selectedStarId, focusedConstellationId]);

  // 9. Pointer Drag, Zoom, and Raycasting Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    hasDragged.current = false;
    prevPointer.current = { x: e.clientX, y: e.clientY };
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
    targetLookAngles.current = null; // stop any ongoing smooth animation when user takes manual control
    requestRenderRef.current();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current) {
      const deltaX = e.clientX - prevPointer.current.x;
      const deltaY = e.clientY - prevPointer.current.y;
      prevPointer.current = { x: e.clientX, y: e.clientY };

      if (Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y) > 6) {
        hasDragged.current = true;
      }

      const sensitivity = 0.0035;
      lookAngles.current.az -= deltaX * sensitivity;
      lookAngles.current.el += deltaY * sensitivity;

      // Clamp elevation so camera doesn't flip over zenith or nadir
      lookAngles.current.el = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, lookAngles.current.el));
      requestRenderRef.current();
      return;
    }

    // Raycast / hover picking
    if (!containerRef.current || !cameraRef.current || !starPointsRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 14 }; // 14px picking threshold
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);

    const intersects = raycaster.intersectObject(starPointsRef.current, false);
    if (intersects.length > 0 && intersects[0].index !== undefined) {
      const idx = intersects[0].index;
      setHoveredStar(STARS[idx]);
    } else {
      setHoveredStar(null);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    requestRenderRef.current();
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const nextFov = cameraRef.current.fov + e.deltaY * 0.05;
    cameraRef.current.fov = Math.max(20, Math.min(85, nextFov));
    cameraRef.current.updateProjectionMatrix();
    requestRenderRef.current();
  };

  const handleClick = (e: React.MouseEvent) => {
    // If user dragged/panned the sky, ignore the click to prevent accidental selections
    if (hasDragged.current) return;

    if (!containerRef.current || !cameraRef.current || !starPointsRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 16 };
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), cameraRef.current);

    const intersects = raycaster.intersectObject(starPointsRef.current, false);
    if (intersects.length > 0 && intersects[0].index !== undefined) {
      const star = STARS[intersects[0].index];
      if (isTraceMode) {
        addTracedStar(star);
      } else {
        setSelectedStarId(star.id);
        if (star.con) {
          setFocusedConstellationId(star.con);
        }
      }
      requestRenderRef.current();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden cursor-grab active:cursor-grabbing bg-[#060A14] touch-none min-h-0"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      {/* 2D Projected SVG Overlay for Numbered Star Badges & Labels */}
      <svg
        ref={svgOverlayRef}
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      />

      {/* Hovered Star Tooltip Telemetry Readout (Costellar HUD Reticle) */}
      {hoveredStar && (
        <div className="hud-reticle absolute pointer-events-none z-20 bottom-6 left-6 p-3 bg-[#080E1C]/95 border border-[#1E293B] rounded-[6px] text-xs space-y-2 font-mono">
          <div className="flex items-center justify-between gap-3 border-b border-[#1E293B] pb-1.5">
            <span className="font-bold text-[#E0E8F9] text-xs uppercase tracking-[0.08em]">
              {hoveredStar.proper || hoveredStar.name}
            </span>
            {hoveredStar.con && (
              <span className="px-1.5 py-0.5 bg-[#101827] border border-[#232D42] rounded-[3px] text-[9px] text-[#8FA4C4] uppercase tracking-wider font-semibold">
                {hoveredStar.con}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[#8C93A0] text-[10px] uppercase tracking-wider">
            <span className="flex items-baseline gap-1">
              <span>MAG:</span>
              <strong className="font-dot text-xs text-[var(--signal-cobalt)] font-bold">
                {hoveredStar.mag.toFixed(2)}
              </strong>
            </span>
            <span className="flex items-baseline gap-1">
              <span>B-V:</span>
              <strong className="text-[#C7D5EC]">{hoveredStar.ci ?? 'N/A'}</strong>
            </span>
            <span className="flex items-baseline gap-1">
              <span>RA:</span>
              <strong className="text-[#C7D5EC]">{(hoveredStar.ra / 15).toFixed(2)}H</strong>
            </span>
            <span className="flex items-baseline gap-1">
              <span>DEC:</span>
              <strong className="text-[#C7D5EC]">{hoveredStar.dec.toFixed(1)}°</strong>
            </span>
          </div>
          {isTraceMode && (
            <div className="pt-1 text-[9px] text-[#6892F6] flex items-center gap-1.5 border-t border-[#1E293B]/60 uppercase tracking-[0.08em]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal-cobalt)]" />
              CLICK STAR TO APPEND TRACE
            </div>
          )}
        </div>
      )}

      {/* Hunt Mode Target Hardware Overlay */}
      {huntTarget && (
        <div className="hud-reticle absolute top-4 left-4 z-20 bg-[#080E1C]/95 border border-[#232D42] rounded-[8px] p-3.5 text-xs font-mono max-w-sm space-y-2">
          <div className="flex items-center justify-between gap-3 border-b border-[#1E293B] pb-2">
            <span className="font-bold text-[#E0E8F9] text-xs uppercase tracking-[0.08em] flex items-center gap-1.5">
              <span>TARGET:</span>
              <span className="text-[var(--signal-cobalt)]">{huntTarget.name}</span>
            </span>
            <span className="text-[9px] text-[#8FA4C4] uppercase px-1.5 py-0.5 bg-[#101827] border border-[#232D42] rounded-[3px]">
              {huntTarget.orderedStarIds.length} STARS
            </span>
          </div>
          <p className="text-[#A0AEC0] text-[10px] leading-relaxed tracking-wide">
            {huntTarget.description}
          </p>
          {huntHintLevel >= 1 && (
            <div className="text-[10px] text-[#C7D5EC] bg-[#101827] border border-[#232D42] p-2 rounded-[4px] uppercase tracking-wider">
              HINT 1: REGION RA {((CONSTELLATION_BY_ID.get(huntTarget.constellationId)?.raCenter || 0) / 15).toFixed(1)}H, DEC {(CONSTELLATION_BY_ID.get(huntTarget.constellationId)?.decCenter || 0).toFixed(0)}°.
            </div>
          )}
          {huntHintLevel >= 2 && (
            <div className="text-[10px] text-[var(--signal-cobalt)] bg-[#101827] border border-[var(--signal-cobalt)]/40 p-2 rounded-[4px] uppercase tracking-wider font-semibold">
              HINT 2: INITIAL STAR &rarr; {huntTarget.starNames[0]}
            </div>
          )}
        </div>
      )}

      {/* Precision 360° Azimuth Telemetry Strip with HUD Corner Ticks */}
      <div className="hud-reticle absolute bottom-6 right-6 z-20 bg-[#080E1C]/95 border border-[#1E293B] rounded-[6px] px-3.5 py-2 text-[10px] font-mono text-[#8C93A0] pointer-events-none uppercase tracking-[0.08em] space-y-1">
        <div className="flex items-center justify-between gap-4 text-[9px] text-[#525866]">
          <span>AZIMUTH TELEMETRY</span>
          <span className="text-[var(--signal-cobalt)] font-semibold">360° HORIZON</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="font-bold text-[#EF4444]">N</span>
          <span className="text-[#C7D5EC]">000°</span>
          <span className="text-[#232D42]">|</span>
          <span className="font-bold text-[#6892F6]">E</span>
          <span className="text-[#C7D5EC]">090°</span>
          <span className="text-[#232D42]">|</span>
          <span className="font-bold text-[#8FA4C4]">S</span>
          <span className="text-[#C7D5EC]">180°</span>
          <span className="text-[#232D42]">|</span>
          <span className="font-bold text-[#6892F6]">W</span>
          <span className="text-[#C7D5EC]">270°</span>
        </div>
        {/* Discrete Segment Ticks Ruler */}
        <div className="flex items-center justify-between gap-1 pt-0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-[2px] ${
                i % 4 === 0 ? 'bg-[var(--signal-cobalt)] h-2' : 'bg-[#232D42]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};