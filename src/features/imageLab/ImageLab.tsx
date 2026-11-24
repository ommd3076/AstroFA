import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS } from '../../data/astroData';
import { recognizePattern } from '../../recognition/matcher';
import type { Point2D } from '../../geometry/types';
import type { RecognitionReport } from '../../recognition/types';

// Deterministic Pseudo-Random Number Generator (Mulberry32) for reproducible synthetic sky
function createSeededRandom(seed: number) {
  let s = seed;
  return () => {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type CorrectionTool = 'select' | 'add' | 'remove';
type PreviewMode = 'ORIGINAL' | 'DETECTED';

interface FileMetadata {
  name: string;
  size: number;
  width?: number;
  height?: number;
}

export const ImageLab: React.FC = () => {
  const { setActiveView, setAutomataTab, setSimulatorSymbols } = useAstroStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [detectionComplete, setDetectionComplete] = useState(false);
  const [imageRevision, setImageRevision] = useState(0);
  const [fileMeta, setFileMeta] = useState<FileMetadata | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preview Mode
  const [previewMode, setPreviewMode] = useState<PreviewMode>('DETECTED');

  // Luminance Threshold (50-240, mapping to [0, 1] normalized display)
  const [threshold, setThreshold] = useState<number>(180);
  const [thresholdText, setThresholdText] = useState('180');

  // Detected & Traced Points
  const [autoStars, setAutoStars] = useState<Point2D[]>([]);
  const [manualStars, setManualStars] = useState<Point2D[]>([]);
  const [excludedStarKeys, setExcludedStarKeys] = useState<Set<string>>(new Set());
  const [tracedPoints, setTracedPoints] = useState<Point2D[]>([]);
  const [report, setReport] = useState<RecognitionReport | null>(null);

  // Active Tool for Manual Correction
  const [activeTool, setActiveTool] = useState<CorrectionTool>('select');

  // Preprocessing controls (Tactile hardware settings)
  const [filterActive, setFilterActive] = useState<boolean>(true);
  const [contrast, setContrast] = useState<number>(1.2);

  // 24 discrete histogram bins for luminance range [50, 240]
  const [histogramBins, setHistogramBins] = useState<number[]>(new Array(24).fill(0));


  // Combined visible detected stars (auto minus excluded + manual)
  const visibleStars = useMemo(() => {
    const filteredAuto = autoStars.filter(s => !excludedStarKeys.has(`${s.x}_${s.y}`));
    return [...filteredAuto, ...manualStars];
  }, [autoStars, manualStars, excludedStarKeys]);

  // Maximum histogram count for scaling dot indicators
  const maxBinVal = useMemo(() => {
    return Math.max(1, ...histogramBins);
  }, [histogramBins]);

  // Generate deterministic synthetic starry sky canvas with Cassiopeia asterism
  const loadSampleSkyImage = useCallback(() => {
    setUploadError(null);
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    // Dark space gradient background
    const grad = ctx.createRadialGradient(400, 300, 50, 400, 300, 500);
    grad.addColorStop(0, '#0a0f1d');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // Cassiopeia W asterism reference coordinates
    const casPoints: Point2D[] = [
      { x: 180, y: 350 }, // Caph (Beta Cas)
      { x: 300, y: 220 }, // Schedar (Alpha Cas)
      { x: 420, y: 320 }, // Gamma Cas
      { x: 540, y: 200 }, // Ruchbah (Delta Cas)
      { x: 640, y: 310 }, // Segin (Epsilon Cas)
    ];

    // Seeded deterministic PRNG for reproducible stars
    const rand = createSeededRandom(42);

    // Deterministic faint background stars
    for (let i = 0; i < 150; i++) {
      const rx = rand() * 800;
      const ry = rand() * 600;
      const brightness = Math.round(110 + rand() * 115);
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.beginPath();
      ctx.arc(rx, ry, rand() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Prominent asterism stars
    for (const p of casPoints) {
      const starGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
      starGrad.addColorStop(0, '#ffffff');
      starGrad.addColorStop(0.3, '#bae6fd');
      starGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    const dataUrl = canvas.toDataURL('image/png');
    const base64Payload = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const sampleByteSize = Math.floor(base64Payload.length * 3 / 4) - (base64Payload.endsWith('==') ? 2 : base64Payload.endsWith('=') ? 1 : 0);
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      imageObjRef.current = img;
      setImageRevision(revision => revision + 1);
      setDetectionComplete(false);
      setImageLoaded(true);
      setFileMeta({
        name: 'SYNTHETIC_CASSIOPEIA.PNG',
        size: sampleByteSize,
        width: 800,
        height: 600,
      });
      setThumbnailUrl(dataUrl);
      setAutoStars([]);
      setManualStars([]);
      setExcludedStarKeys(new Set());
      setTracedPoints([]);
      setReport(null);
    };
  }, []);

  // Handle uploaded file (PNG or JPEG)
  const processFile = useCallback((file: File) => {
    const mimeType = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isSupported = mimeType === 'image/png' || mimeType === 'image/jpeg' ||
      (!mimeType && (extension === 'png' || extension === 'jpg' || extension === 'jpeg'));
    if (!isSupported) {
      setUploadError('Unsupported file. Choose a PNG or JPEG image. FITS files are not supported.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onerror = () => setUploadError('The selected file could not be read. Please try another PNG or JPEG.');
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onerror = () => setUploadError('This file could not be decoded as an image. Your current image is unchanged.');
      img.onload = () => {
        imageObjRef.current = img;
        setImageRevision(revision => revision + 1);
        setDetectionComplete(false);
      setImageLoaded(true);
        setFileMeta({
          name: file.name.toUpperCase(),
          size: file.size,
          width: img.width,
          height: img.height,
        });
        setThumbnailUrl(dataUrl);
        setAutoStars([]);
        setManualStars([]);
        setExcludedStarKeys(new Set());
        setTracedPoints([]);
        setReport(null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUnloadImage = () => {
    imageObjRef.current = null;
    setImageLoaded(false);
    setDetectionComplete(false);
    setFileMeta(null);
    setThumbnailUrl(null);
    setAutoStars([]);
    setManualStars([]);
    setExcludedStarKeys(new Set());
    setTracedPoints([]);
    setReport(null);
    setUploadError(null);
  };

  const handleSetThreshold = (value: number) => {
    if (!Number.isFinite(value)) return;
    const nextThreshold = Math.min(240, Math.max(50, Math.round(value)));
    setThreshold(nextThreshold);
    setThresholdText(String(nextThreshold));
    // Detection changes with the threshold. Clear a trace tied to the previous point set.
    setTracedPoints([]);
    setReport(null);
  };

  // Run Star Detection & Update Real Luminance Histogram
  useEffect(() => {
    if (!imageLoaded || !imageObjRef.current || !canvasRef.current) return;
    setDetectionComplete(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = imageObjRef.current;

    canvas.width = img.width;
    canvas.height = img.height;

    // 1. Draw original image
    ctx.drawImage(img, 0, 0);

    // 2. Extract image pixel buffer for star candidate detection
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const w = canvas.width;
    const h = canvas.height;

    // Grayscale perceptual luminance & 24-bin histogram accumulation
    const lum = new Float32Array(w * h);
    const bins = new Array(24).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      // Perceptual luminance Y = 0.299R + 0.587G + 0.114B
      let val = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

      // Preprocessing: apply contrast adjustment if enabled
      if (filterActive && contrast !== 1.0) {
        val = 128 + (val - 128) * contrast;
        val = Math.max(0, Math.min(255, val));
      }

      lum[i / 4] = val;

      // Accumulate into 24 bins over [50, 240]
      if (val >= 50 && val <= 240) {
        const binIdx = Math.min(23, Math.floor(((val - 50) / 190) * 24));
        bins[binIdx]++;
      }
    }

    setHistogramBins(bins);

    // 3. 2D Local Intensity Maximum Detection with Non-Maximum Suppression (radius 8px)
    const radius = 8;
    const candidates: Point2D[] = [];

    for (let y = radius; y < h - radius; y += 3) {
      for (let x = radius; x < w - radius; x += 3) {
        const val = lum[y * w + x];
        if (val < threshold) continue;

        let isMax = true;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (lum[(y + dy) * w + (x + dx)] > val) {
              isMax = false;
              break;
            }
          }
          if (!isMax) break;
        }

        if (isMax) {
          candidates.push({ x, y });
        }
      }
    }

    setAutoStars(candidates);
    setDetectionComplete(true);
  }, [imageLoaded, imageRevision, threshold, contrast, filterActive]);

  // Canvas Redraw for Preview Modes & Interactive Overlays
  useEffect(() => {
    if (!imageLoaded || !imageObjRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = imageObjRef.current;

    // Clear and redraw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // If ORIGINAL preview mode is selected, render raw input only
    if (previewMode === 'ORIGINAL') {
      return;
    }

    // DETECTED Mode: Render cobalt corner brackets around detected stars
    const size = 7;
    const tick = 3;
    ctx.strokeStyle = '#1D55F5'; // electric cobalt
    ctx.lineWidth = 1.5;

    for (const c of visibleStars) {
      // Top-left corner [
      ctx.beginPath();
      ctx.moveTo(c.x - size, c.y - size + tick);
      ctx.lineTo(c.x - size, c.y - size);
      ctx.lineTo(c.x - size + tick, c.y - size);
      ctx.stroke();

      // Top-right corner ]
      ctx.beginPath();
      ctx.moveTo(c.x + size - tick, c.y - size);
      ctx.lineTo(c.x + size, c.y - size);
      ctx.lineTo(c.x + size, c.y - size + tick);
      ctx.stroke();

      // Bottom-left corner [
      ctx.beginPath();
      ctx.moveTo(c.x - size, c.y + size - tick);
      ctx.lineTo(c.x - size, c.y + size);
      ctx.lineTo(c.x - size + tick, c.y + size);
      ctx.stroke();

      // Bottom-right corner ]
      ctx.beginPath();
      ctx.moveTo(c.x + size - tick, c.y + size);
      ctx.lineTo(c.x + size, c.y + size);
      ctx.lineTo(c.x + size, c.y + size - tick);
      ctx.stroke();

      // Central core dot
      ctx.fillStyle = '#1D55F5';
      ctx.fillRect(c.x - 1, c.y - 1, 2, 2);
    }

    // Render Traced Path Segment Lines
    if (tracedPoints.length >= 2) {
      ctx.strokeStyle = '#1D55F5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tracedPoints[0].x, tracedPoints[0].y);
      for (let i = 1; i < tracedPoints.length; i++) {
        ctx.lineTo(tracedPoints[i].x, tracedPoints[i].y);
      }
      ctx.stroke();
    }

    // Render Traced Nodes Telemetry Badges
    tracedPoints.forEach((p, idx) => {
      // Core star marker
      ctx.fillStyle = '#1D55F5';
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);

      // Square telemetry number badge
      ctx.fillStyle = '#181A20';
      ctx.strokeStyle = '#1D55F5';
      ctx.lineWidth = 1.5;
      ctx.fillRect(p.x + 8, p.y - 18, 18, 16);
      ctx.strokeRect(p.x + 8, p.y - 18, 18, 16);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px "IBM Plex Mono", monospace';
      ctx.fillText(`${idx + 1}`, p.x + 12, p.y - 6);
    });
  }, [imageLoaded, imageRevision, previewMode, visibleStars, tracedPoints]);

  // Handle Canvas Click based on Active Tool
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !imageObjRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Tool: REMOVE STAR
    if (activeTool === 'remove') {
      let nearestIdx = -1;
      let minDist = 20;
      visibleStars.forEach((star, idx) => {
        const d = Math.hypot(star.x - clickX, star.y - clickY);
        if (d < minDist) {
          minDist = d;
          nearestIdx = idx;
        }
      });

      if (nearestIdx >= 0) {
        const removedStar = visibleStars[nearestIdx];
        setExcludedStarKeys(prev => new Set(prev).add(`${removedStar.x}_${removedStar.y}`));
        setManualStars(prev => prev.filter(s => s.x !== removedStar.x || s.y !== removedStar.y));
        const nextTraced = tracedPoints.filter(p => Math.hypot(p.x - removedStar.x, p.y - removedStar.y) > 5);
        setTracedPoints(nextTraced);
        if (nextTraced.length >= 2) {
          setReport(recognizePattern(nextTraced, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS));
        } else {
          setReport(null);
        }
      }
      return;
    }

    // Tool: ADD MANUAL STAR
    if (activeTool === 'add') {
      const newStar: Point2D = { x: Math.round(clickX), y: Math.round(clickY) };
      setManualStars(prev => [...prev, newStar]);
      return;
    }

    // Default Tool: SELECT / TRACE
    // Snap to nearest detected star within 18px radius
    let selectedPoint: Point2D = { x: Math.round(clickX), y: Math.round(clickY) };
    for (const star of visibleStars) {
      if (Math.hypot(star.x - clickX, star.y - clickY) <= 18) {
        selectedPoint = star;
        break;
      }
    }

    const nextPoints = [...tracedPoints, selectedPoint];
    setTracedPoints(nextPoints);

    if (nextPoints.length >= 2) {
      const rep = recognizePattern(nextPoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS);
      setReport(rep);
    }
  };

  const handleUndo = () => {
    const nextPoints = tracedPoints.slice(0, -1);
    setTracedPoints(nextPoints);
    if (nextPoints.length >= 2) {
      setReport(recognizePattern(nextPoints, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS));
    } else {
      setReport(null);
    }
  };

  const handleClear = () => {
    setTracedPoints([]);
    setReport(null);
  };

  return (
    <div className="image-lab w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-mono p-3 sm:p-4 gap-3 overflow-y-auto min-h-0">
      <style>{`
        .image-lab .bento-card { background: #f6f6f5; border-color: #dedfdf; box-shadow: 0 1px 2px #18191b08; }
        .image-lab .tactile-pill { border-radius: 6px; transition: background-color .15s ease, color .15s ease, border-color .15s ease; }
        .image-lab .tactile-pill:focus-visible, .image-lab [role="button"]:focus-visible { outline: 2px solid #064bdc; outline-offset: 2px; }
        .image-lab input[type="range"] { accent-color: #064bdc; }
        .image-lab canvas { max-width: 100%; max-height: min(62vh, 620px); width: auto; height: auto; }
        @media (max-width: 1023px) {
          .image-lab .image-workspace { display: flex; flex: none; flex-direction: column; align-items: stretch; min-height: auto; }
          .image-lab .image-workspace > div { flex: none; min-height: auto; }
          .image-lab .image-preview-card { min-height: 420px; }
          .image-lab .image-viewport { flex: 1 0 320px; min-height: 320px; }
        }
        @media (max-width: 640px) {
          .image-lab .image-preview-card { min-height: 360px; }
          .image-lab .image-viewport { flex: 1 0 240px; min-height: 240px; }
        }
      `}</style>
      <header className="flex flex-wrap items-end justify-between gap-2 px-1">
        <h1 className="text-lg font-semibold tracking-tight">Image Lab</h1>
        <p className="text-[10px] text-[var(--ink-secondary)]">PNG / JPEG · 8-bit luminance analysis</p>
      </header>
      {/* =========================================================================
          MAIN 3-COLUMN WORKSPACE (Upload/Preprocess - Preview - Detection/Settings)
          ========================================================================= */}
      <div className="image-workspace grid grid-cols-1 lg:grid-cols-12 gap-2 flex-1 min-h-0">
        {/* =======================================================================
            COLUMN 1: UPLOAD & PREPROCESSING (Left Column, lg:col-span-3)
            ======================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-2 min-h-0">
          {/* Card 1: Upload Image Card */}
          <div className="bento-card p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="telemetry-label text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                UPLOAD IMAGE
              </span>
              <span className="micro-label text-[9px] text-[var(--ink-muted)]">STEP 01 · SOURCE</span>
            </div>

            {/* Drag & Drop Target Area */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Choose a PNG or JPEG image, or drop a file here"
              data-testid="image-lab-upload"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`border border-dashed rounded-[8px] p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1.5 ${
                isDragOver
                  ? 'border-[var(--signal-cobalt)] bg-[var(--bg-pill-active)]'
                  : 'border-[var(--card-border-subtle)] bg-[var(--bg-card-subtle)] hover:border-[var(--signal-cobalt)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <svg className="w-5 h-5 text-[var(--ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-[10px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                DRAG &amp; DROP OR CLICK TO UPLOAD
              </div>
              <div className="text-[9px] text-[var(--ink-muted)] font-mono tracking-widest">
                JPG &nbsp; PNG
              </div>
            </div>
                {uploadError && (
              <p role="alert" className="text-[10px] text-red-600 font-mono leading-relaxed">
                {uploadError}
              </p>
            )}

            {/* Quick Sample Sky Button */}
            <button
              onClick={loadSampleSkyImage}
              aria-label="Load synthetic Cassiopeia sample"
              data-testid="image-lab-sample"
              className="tactile-pill w-full bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] text-[var(--ink-primary)] hover:text-[var(--signal-cobalt)] border border-[var(--card-border-subtle)] text-[10px] py-1.5 px-2 font-bold uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>🌌</span>
              <span>LOAD SYNTHETIC CASSIOPEIA</span>
            </button>

            {/* File Metadata Tile when Loaded */}
            {imageLoaded && fileMeta && (
              <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[6px] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail"
                      className="w-8 h-8 rounded-[4px] object-cover border border-[var(--card-border-subtle)] shrink-0 bg-black"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-[4px] bg-black shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold truncate text-[var(--ink-primary)]">
                      {fileMeta.name}
                    </div>
                    <div className="text-[9px] text-[var(--ink-muted)] font-mono truncate">
                      {fileMeta.width} × {fileMeta.height} • {(fileMeta.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleUnloadImage}
                  title="Remove asset"
                  className="text-[var(--ink-muted)] hover:text-red-500 font-bold p-1 text-sm leading-none cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Contrast is the supported preprocessing control; other imaging algorithms are not implemented. */}
          <div className="bento-card p-3 space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <span className="telemetry-label text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                DETECTION CONTRAST
              </span>
              <button
                onClick={() => setFilterActive(!filterActive)}
                className={`tactile-pill text-[9px] font-bold py-0.5 px-2 uppercase ${
                  filterActive ? 'active' : ''
                }`}
              >
                {filterActive ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {/* Contrast Slider (Directly impacts luminance calculation) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[var(--ink-secondary)] uppercase">CONTRAST</span>
                  <span className="font-mono text-[var(--signal-cobalt)] font-bold">{contrast.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="2.00"
                  step="0.05"
                  value={contrast}
                  onChange={e => setContrast(parseFloat(e.target.value))}
                  className="w-full accent-[var(--signal-cobalt)] h-1 cursor-pointer bg-[var(--bg-tray)] rounded"
                />
              </div>

              <p className="text-[9px] leading-relaxed text-[var(--ink-muted)]">Contrast remaps luminance before thresholding. Denoise, debayer, background correction, sharpening, and normalization are not available for these PNG/JPEG inputs.</p>
            </div>
          </div>
        </div>

        {/* =======================================================================
            COLUMN 2: DOMINANT IMAGE PREVIEW (Center Column, lg:col-span-6)
            ======================================================================= */}
        <div className="lg:col-span-6 flex flex-col gap-2 min-h-0">
          <div className="bento-card image-preview-card p-3 flex flex-col flex-1 min-h-[420px]">
            {/* Header: Title and Original / Detected Preview Mode Toggle */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--card-border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="telemetry-label text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                  IMAGE PREVIEW
                </span>
                {imageLoaded && (
                  <span className="micro-label text-[9px] text-[var(--signal-cobalt)] font-bold">
                    [ {tracedPoints.length} NODES TRACED ]
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="tactile-rocker">
                  {(['ORIGINAL', 'DETECTED'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setPreviewMode(mode)}
                      aria-pressed={previewMode === mode}
                      className={`tactile-pill text-[10px] py-1 px-2.5 uppercase font-bold ${
                        previewMode === mode ? 'active' : ''
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dominant Dark Viewport Container */}
            <div className="image-viewport relative flex-1 bg-[#101318] rounded-[8px] overflow-hidden flex items-center justify-center p-2 border border-[var(--card-border-subtle)] min-h-[360px]">
              {imageLoaded ? (
                    <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="max-w-full max-h-[520px] object-contain cursor-crosshair rounded-[4px]"
                />
              ) : (
                /* Empty Viewport Prompt */
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-[10px] bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-[var(--signal-mid)]">
                    🌌
                  </div>
                  <div className="telemetry-label text-xs text-white uppercase font-bold tracking-wider">
                    {uploadError ? 'IMAGE COULD NOT BE LOADED' : 'NO IMAGE LOADED'}
                  </div>
                  <p className="text-[11px] text-[var(--ink-muted)] max-w-sm font-mono leading-relaxed">
                    {uploadError || 'Choose a local JPG/PNG image, or load the labelled synthetic Cassiopeia sample. FITS is not supported.'}
                  </p>
                  <button
                    onClick={loadSampleSkyImage}
                    className="tactile-pill bg-[var(--signal-cobalt)] hover:bg-[var(--signal-mid)] text-white text-[11px] py-1.5 px-3 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    LOAD SYNTHETIC CASSIOPEIA
                  </button>
                </div>
              )}
            </div>

            {/* Traced Nodes Sub-Bar */}
            {imageLoaded && (
              <div className="mt-2 pt-2 border-t border-[var(--card-border-subtle)] flex items-center justify-between text-xs">
                <div className="text-[10px] text-[var(--ink-secondary)]">
                  ACTIVE TOOL: <strong className="text-[var(--signal-cobalt)] uppercase">{activeTool}</strong> (CLICK CANVAS TO INTERACT)
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleUndo}
                    disabled={tracedPoints.length === 0}
                    className="tactile-pill text-[10px] py-1 px-2 uppercase font-bold disabled:opacity-40"
                  >
                    ↩ UNDO
                  </button>
                  <button
                    onClick={handleClear}
                    disabled={tracedPoints.length === 0}
                    className="tactile-pill text-[10px] py-1 px-2 uppercase font-bold disabled:opacity-40"
                  >
                    CLEAR PATH
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =======================================================================
            COLUMN 3: DETECTION METRICS & THRESHOLD & CORRECTION (Right Column, lg:col-span-3)
            ======================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-2 min-h-0">
          {/* Card 1: Ground-Truth Star-Detection Metrics (Frame 11 Target Alignment) */}
          <div className="bento-card p-3 space-y-2">
            <span className="telemetry-label text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider block">
              STAR-DETECTION METRICS
            </span>

            {/* 2x2 Honest Metrics Grid */}
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[6px]">
                <div className="micro-label text-[9px] text-[var(--ink-muted)] uppercase">DETECTED STARS</div>
                <div className="font-dot text-base font-bold text-[var(--signal-cobalt)] mt-0.5">
                  {imageLoaded ? autoStars.length.toLocaleString() : '--'}
                </div>
              </div>

            </div>
          </div>

          {/* Card 2: Threshold Settings with Real Luminance Histogram & Continuous Slider */}
          <div className="bento-card p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="telemetry-label text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
                THRESHOLD SETTINGS
              </span>
              <span className="font-mono text-[10px] text-[var(--ink-muted)]">8-bit luminance · 50–240</span>
            </div>

            {/* 24-Column Dot Matrix Luminance Histogram with Threshold Marker Line */}
            <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] flex flex-col gap-1 relative">
              <div className="relative flex items-end justify-between h-14 gap-[2px] pt-1">
                {histogramBins.map((binCount, binIdx) => {
                  const binVal = 50 + (binIdx / 23) * 190;
                  const isAboveThreshold = binVal >= threshold;
                  const fillHeightDots = imageLoaded ? Math.max(1, Math.min(7, Math.round((binCount / maxBinVal) * 7))) : 0;

                  return (
                    <button
                      key={binIdx}
                      onClick={() => handleSetThreshold(binVal)}
                      aria-label={`Set luminance threshold to ${Math.round(binVal)}`}
                      title={`Luminance ${Math.round(binVal)}: ${binCount.toLocaleString()} pixels`}
                      className="flex-1 flex flex-col-reverse items-center gap-[2px] cursor-pointer hover:opacity-80 h-full justify-start"
                    >
                      {Array.from({ length: 7 }).map((_, dIdx) => (
                        <span
                          key={dIdx}
                          className={`w-[3px] h-[3px] rounded-full transition-colors ${
                            dIdx < fillHeightDots
                              ? isAboveThreshold
                                ? 'bg-[var(--dot-active)]'
                                : 'bg-[var(--dot-inactive)]'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </button>
                  );
                })}

                {/* Vertical Threshold Marker Indicator Line */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
                  style={{ left: `${((threshold - 50) / 190) * 100}%` }}
                >
                  <div className="w-2 h-2 rounded-full bg-[var(--signal-cobalt)] -mt-1 shadow-sm" />
                  <div className="w-[1.5px] flex-1 bg-[var(--signal-cobalt)] opacity-80" />
                </div>
              </div>

              {/* Axis labels */}
              <div className="flex justify-between text-[8px] text-[var(--ink-muted)] font-mono border-t border-[var(--bg-tray)] pt-0.5">
                <span>50</span>
                <span>145</span>
                <span>240</span>
              </div>
            </div>

            {/* Threshold Slider (Range 50 - 240) */}
            <div className="space-y-1">
              <input
                type="range"
                min="50"
                max="240"
                step="1"
                value={threshold}
                onChange={e => handleSetThreshold(parseInt(e.target.value, 10))}
                aria-label="Luminance detection threshold slider"
                className="w-full accent-[var(--signal-cobalt)] h-1 cursor-pointer bg-[var(--bg-tray)] rounded"
              />
            </div>

            {/* Numeric Readout: Detection Threshold mapped to [0, 1] normalized display */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="micro-label text-[10px] text-[var(--ink-secondary)] uppercase">
                LUMINANCE CUTOFF (8-BIT):
              </span>
              <div className="flex items-center gap-1.5">
                <label className="sr-only" htmlFor="image-lab-threshold">Luminance threshold, 50 to 240</label>
                <input
                  id="image-lab-threshold"
                  type="number"
                  min={50}
                  max={240}
                  step={1}
                  value={thresholdText}
                  onChange={e => {
                    const raw = e.target.value;
                    setThresholdText(raw);
                    if (/^\d+$/.test(raw)) {
                      const next = Number(raw);
                      if (next >= 50 && next <= 240) handleSetThreshold(next);
                    }
                  }}
                  onBlur={() => {
                    const parsed = Number(thresholdText);
                    if (Number.isFinite(parsed) && thresholdText !== '') {
                      handleSetThreshold(parsed);
                    } else {
                      setThresholdText(String(threshold));
                    }
                  }}
                  className="w-16 px-2 py-0.5 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded font-mono font-bold text-xs text-[var(--ink-primary)]"
                />
              </div>
            </div>

          </div>

          {/* Card 3: Manual Correction Tools (Frame 11 Target Alignment) */}
          <div className="bento-card p-3 space-y-2">
            <span className="telemetry-label text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider block">
              MANUAL CORRECTION
            </span>

            {/* 5 Hardware Tool Buttons */}
            <div className="grid grid-cols-5 gap-1.5">
              {/* Tool 1: Pointer / Select */}
              <button
                onClick={() => setActiveTool('select')}
                aria-label="Select and trace centroids"
                title="Select / Trace star centroids"
                className={`tactile-pill flex items-center justify-center p-2 rounded-[6px] cursor-pointer ${
                  activeTool === 'select' ? 'active' : ''
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </button>

              {/* Tool 2: Add Point (+) */}
              <button
                onClick={() => setActiveTool('add')}
                aria-label="Add manual centroid"
                title="Add manual star centroid"
                className={`tactile-pill flex items-center justify-center p-2 rounded-[6px] cursor-pointer ${
                  activeTool === 'add' ? 'active' : ''
                }`}
              >
                <span className="text-sm font-bold leading-none">+</span>
              </button>

              {/* Tool 3: Remove Point (-) */}
              <button
                onClick={() => setActiveTool('remove')}
                aria-label="Remove centroid"
                title="Remove star centroid"
                className={`tactile-pill flex items-center justify-center p-2 rounded-[6px] cursor-pointer ${
                  activeTool === 'remove' ? 'active' : ''
                }`}
              >
                <span className="text-sm font-bold leading-none">−</span>
              </button>

              {/* Tool 4: Undo Node (↩) */}
              <button
                onClick={handleUndo}
                disabled={tracedPoints.length === 0}
                title="Undo last trace node"
                className="tactile-pill flex items-center justify-center p-2 rounded-[6px] cursor-pointer disabled:opacity-40"
              >
                <span className="text-xs font-bold leading-none">↩</span>
              </button>

              {/* Tool 5: Clear / Trash (🗑) */}
              <button
                onClick={handleClear}
                disabled={tracedPoints.length === 0}
                title="Clear all traced points"
                className="tactile-pill flex items-center justify-center p-2 rounded-[6px] cursor-pointer disabled:opacity-40 text-red-500 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* Tool Mode Explanatory Pill */}
            <div className="text-[9px] text-[var(--ink-muted)] bg-[var(--bg-card-subtle)] p-1.5 rounded-[4px] font-mono">
              {activeTool === 'select' && 'MODE: SNAP & TRACE CENTROIDS'}
              {activeTool === 'add' && 'MODE: CLICK ANYWHERE TO ADD STAR'}
              {activeTool === 'remove' && 'MODE: CLICK STAR TO REMOVE'}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ROW: ANALYSIS PIPELINE & RECOGNITION RESULT (Frame 11 Target Alignment)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 shrink-0">
        {/* Analysis Pipeline Stepper (Left lg:col-span-9) */}
        <div className="lg:col-span-9 bento-card p-3 flex flex-col justify-between gap-2">
          <span className="telemetry-label text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
            ANALYSIS PIPELINE
          </span>

          <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto text-[10px] py-1">
            {[
              { num: '01', label: 'SOURCE', active: imageLoaded, icon: '01' },
              { num: '02', label: 'DETECT STARS', active: imageLoaded && detectionComplete, icon: '✦' },
              { num: '03', label: 'EDIT POINTS', active: tracedPoints.length > 0 || manualStars.length > 0, icon: '✎' },
              { num: '04', label: 'TRACE PATTERN', active: tracedPoints.length >= 2, icon: '☍' },
              { num: '05', label: 'MATCH', active: report !== null, icon: '05' },
            ].map((step, idx, arr) => (
              <React.Fragment key={step.num}>
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border transition-colors ${
                      step.active
                        ? 'bg-[var(--signal-cobalt)] text-white border-[var(--signal-mid)]'
                        : 'bg-[var(--bg-card-subtle)] text-[var(--ink-muted)] border-[var(--card-border-subtle)]'
                    }`}
                  >
                    <span>{step.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-[var(--ink-muted)] font-mono">{step.num}</span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                        step.active ? 'text-[var(--signal-cobalt)]' : 'text-[var(--ink-secondary)]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>
                {idx < arr.length - 1 && (
                  <span className="text-[var(--ink-muted)] font-mono text-xs shrink-0">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Recognition Result Card (Right lg:col-span-3) */}
        <div className="lg:col-span-3 bento-card p-3 flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between">
            <span className="telemetry-label text-[11px] font-bold text-[var(--ink-primary)] uppercase tracking-wider">
              RESULT
            </span>
            <span className="font-dot text-[10px] text-[var(--signal-cobalt)]">DFA</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="font-dot text-lg font-bold text-[var(--signal-cobalt)] truncate max-w-[150px]">
              {report?.bestMatch?.patternName
                ? report.bestMatch.patternName.split(' ')[0]
                : report?.status === 'VALID_PREFIX'
                ? 'PREFIX'
                : report?.status === 'SYMBOLIC_REJECT' || report?.status === 'GEOMETRIC_REJECT'
                ? 'NO MATCH'
                : 'STANDBY'}
            </div>
            <div className="text-right">
              <span className="micro-label text-[8px] block text-[var(--ink-muted)]">RESIDUAL</span>
              <span className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                {report?.bestMatch ? report.bestMatch.residual.toFixed(3) : '--'}
              </span>
            </div>
          </div>

          {/* Automata Lab Navigation Action */}
          {report?.inputSymbols && report.inputSymbols.length > 0 ? (
            <button
              onClick={() => {
                setSimulatorSymbols(report.inputSymbols);
                setAutomataTab('simulator');
                setActiveView('automataLab');
              }}
              className="tactile-pill bg-[var(--signal-cobalt)] hover:bg-[var(--signal-mid)] text-white w-full py-1.5 px-2 font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>⚡</span>
              <span>OPEN IN AUTOMATA LAB ↗</span>
            </button>
          ) : (
            <div className="micro-label text-[9px] text-[var(--ink-muted)] truncate">
              {tracedPoints.length >= 2 ? 'RECOGNITION IN PROGRESS' : 'CLICK STARS TO SEQUENCE PATH'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
