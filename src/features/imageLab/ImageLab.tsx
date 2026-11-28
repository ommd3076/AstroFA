import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS } from '../../data/astroData';
import { recognizePattern } from '../../recognition/matcher';
import type { Point2D } from '../../geometry/types';
import type { RecognitionReport } from '../../recognition/types';
import { imagePointsToMath, recognizeTraceOnServer } from '../../recognition/client';
import type { BackendRecognitionState } from '../../recognition/types';
import { IMAGE_HEADER_SCAN_BYTES, isRasterDimensionsAllowed, parseRasterDimensions, projectReferencePointsToImage } from './imageUpload';
import { PageHeader } from '../../components/PageHeader';
import { Alert, AlertDescription } from '../../components/ui/space/alert';
import { Button } from '../../components/ui/space/button';
import { Card } from '../../components/ui/space/card';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/space/empty';
import { Input } from '../../components/ui/space/input';
import { Slider } from '../../components/ui/space/slider';
import { Switch } from '../../components/ui/space/switch';
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/space/toggle-group';

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
  const decodeVersion = useRef(0);
  const backendVersion = useRef(0);

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
  const [backendRecognition, setBackendRecognition] = useState<BackendRecognitionState | null>(null);

  const analyzeTrace = (points: Point2D[]) => {
    setReport(points.length >= 2 ? recognizePattern(points, MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS) : null);
    const version = ++backendVersion.current;
    if (points.length < 3) {
      setBackendRecognition({ state: 'not-requested', reason: 'insufficient-points' });
      return;
    }
    const height = imageObjRef.current?.height ?? 0;
    const mathPoints = imagePointsToMath(points, height);
    setBackendRecognition({ state: 'pending' });
    void recognizeTraceOnServer(mathPoints).then(result => {
      if (version === backendVersion.current) setBackendRecognition({ state: 'available', result });
    }).catch(error => {
      if (version === backendVersion.current) setBackendRecognition({ state: 'unavailable', error: error instanceof Error ? error.message : 'Recognition service unavailable.' });
    });
  };

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
    const version = ++decodeVersion.current;
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

    // Derive the synthetic Cassiopeia asterism from its exact reference geometry.
    const cassiopeia = REFERENCE_PATTERNS.find(pattern => pattern.id === 'Cas_fwd');
    const casPoints = cassiopeia
      ? projectReferencePointsToImage(cassiopeia.referencePoints, 800, 600, 32)
      : [];

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
      if (version !== decodeVersion.current) return;
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
      backendVersion.current++;
      setBackendRecognition(null);
    };
  }, []);

  // Handle uploaded file (PNG or JPEG)
  const processFile = useCallback(async (file: File) => {
    const version = ++decodeVersion.current;
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Image is larger than the 20 MB limit. Choose a smaller PNG or JPEG.');
      return;
    }
    const mimeType = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase();
    const isSupported = mimeType === 'image/png' || mimeType === 'image/jpeg' ||
      (!mimeType && (extension === 'png' || extension === 'jpg' || extension === 'jpeg'));
    if (!isSupported) {
      setUploadError('Unsupported file. Choose a PNG or JPEG image. FITS files are not supported.');
      return;
    }

    setUploadError(null);
    let dimensions: { width: number; height: number } | null;
    try {
      const header = new Uint8Array(await file.slice(0, IMAGE_HEADER_SCAN_BYTES).arrayBuffer());
      if (version !== decodeVersion.current) return;
      dimensions = parseRasterDimensions(header);
    } catch {
      if (version === decodeVersion.current) setUploadError('The image header could not be read safely. Your current image is unchanged.');
      return;
    }
    if (!dimensions) {
      setUploadError('PNG or JPEG dimensions were not found in the first 1 MB. Your current image is unchanged.');
      return;
    }
    if (!isRasterDimensionsAllowed(dimensions.width, dimensions.height)) {
      setUploadError('Image dimensions exceed the 8192 px side or 40 megapixel limit. Your current image is unchanged.');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => { if (version === decodeVersion.current) setUploadError('The selected file could not be read. Please try another PNG or JPEG.'); };
    reader.onload = ev => {
      if (version !== decodeVersion.current) return;
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onerror = () => { if (version === decodeVersion.current) setUploadError('This file could not be decoded as an image. Your current image is unchanged.'); };
      img.onload = () => {
        if (version !== decodeVersion.current) return;
        if (!isRasterDimensionsAllowed(img.width, img.height)) {
          setUploadError('Image dimensions exceed the 8192 px side or 40 megapixel limit. Your current image is unchanged.');
          return;
        }
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
        backendVersion.current++;
        setBackendRecognition(null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
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
    decodeVersion.current++;
    backendVersion.current++;
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    setBackendRecognition(null);
  };

  const handleSetThreshold = (value: number) => {
    if (!Number.isFinite(value)) return;
    const nextThreshold = Math.min(240, Math.max(50, Math.round(value)));
    setThreshold(nextThreshold);
    setThresholdText(String(nextThreshold));
    // Detection changes with the threshold. Clear a trace tied to the previous point set.
    setTracedPoints([]);
    setReport(null);
    backendVersion.current++;
    setBackendRecognition(null);
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

    // DETECTED Mode: Render soft periwinkle corner brackets around detected stars
    const size = 7;
    const tick = 3;
    ctx.strokeStyle = '#8FA3FF';
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
      ctx.fillStyle = '#F3F1EB';
      ctx.fillRect(c.x - 1, c.y - 1, 2, 2);
    }

    // Render Traced Path Segment Lines
    if (tracedPoints.length >= 2) {
      ctx.strokeStyle = '#8FA3FF';
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
      ctx.fillStyle = '#8FA3FF';
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);

      // Square telemetry number badge
      ctx.fillStyle = '#151519';
      ctx.strokeStyle = '#8FA3FF';
      ctx.lineWidth = 1.5;
      ctx.fillRect(p.x + 8, p.y - 18, 18, 16);
      ctx.strokeRect(p.x + 8, p.y - 18, 18, 16);

      ctx.fillStyle = '#F3F1EB';
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
        analyzeTrace(nextTraced);
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

    analyzeTrace(nextPoints);
  };

  const handleUndo = () => {
    const nextPoints = tracedPoints.slice(0, -1);
    setTracedPoints(nextPoints);
    analyzeTrace(nextPoints);
  };

  const handleClear = () => {
    setTracedPoints([]);
    setReport(null);
    backendVersion.current++;
    setBackendRecognition(null);
  };

  return (
    <div className="image-lab w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-sans gap-4 overflow-y-auto min-h-0 pr-0.5">
      <style>{`
        .image-lab input[type="range"] { accent-color: var(--signal-mid); }
        .image-lab canvas { max-width: 100%; max-height: min(64vh, 640px); width: auto; height: auto; }
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

      <PageHeader
        eyebrow="Photometry & Recognition"
        title="Image Lab"
        meta="PNG / JPEG · 8-bit luminance"
        description="Detect bright stars on local PNG/JPEG photographs and trace patterns into the DFA."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {[
              { num: '01', label: 'Source', active: imageLoaded },
              { num: '02', label: 'Detect', active: imageLoaded && detectionComplete },
              { num: '03', label: 'Edit', active: tracedPoints.length > 0 || manualStars.length > 0 },
              { num: '04', label: 'Trace', active: tracedPoints.length >= 2 },
              { num: '05', label: 'Match', active: report !== null },
            ].map((step, idx, arr) => (
              <React.Fragment key={step.num}>
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] ${
                  step.active
                    ? 'border-[var(--signal-surface)] bg-[var(--bg-pill-active)] text-[var(--signal-mid)] font-semibold'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--ink-muted)]'
                }`}>
                  <span>{step.num}</span>
                  <span className="font-sans">{step.label}</span>
                </span>
                {idx < arr.length - 1 && (
                  <span className="text-[var(--ink-muted)] font-mono hidden sm:inline" aria-hidden="true">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        }
      />

      {/* Image-first asymmetric studio workspace: Dominant stage (left 8) + Ordered inspector rail (right 4) */}
      <div className="image-workspace grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 items-start">
        {/* DOMINANT IMAGE CANVAS STAGE (Left 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
          <Card className="image-preview-card atlas-surface p-3.5 gap-3 flex flex-col min-h-[480px] rounded-xl shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-[var(--ink-primary)]">
                  Starfield preview
                </span>
                {imageLoaded && (
                  <span className="font-mono tabular-nums text-[11px] text-[var(--signal-mid)] font-medium">
                    {autoStars.length.toLocaleString()} detected · {tracedPoints.length} traced
                  </span>
                )}
              </div>

              <ToggleGroup
                aria-label="Preview overlay mode"
                size="sm"
                value={[previewMode]}
                onValueChange={vals => {
                  const next = vals.find(v => v !== previewMode) ?? vals[0];
                  if (next === 'ORIGINAL' || next === 'DETECTED') setPreviewMode(next);
                }}
                className="bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] p-0.5 rounded-lg gap-0.5"
              >
                {(['ORIGINAL', 'DETECTED'] as const).map(mode => (
                  <ToggleGroupItem
                    key={mode}
                    value={mode}
                    className="text-[11px] font-semibold data-pressed:bg-primary data-pressed:text-primary-foreground"
                  >
                    {mode === 'ORIGINAL' ? 'Original' : 'Detected'}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="image-viewport relative flex-1 bg-[var(--bg-viewport)] rounded-lg overflow-hidden flex items-center justify-center p-2 border border-[var(--border-subtle)] min-h-[400px]">
              {imageLoaded ? (
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="max-w-full max-h-[580px] object-contain cursor-crosshair rounded"
                />
              ) : (
                <Empty className="border-0 p-6 max-w-md">
                  <EmptyHeader>
                    <EmptyMedia variant="icon" className="text-[var(--signal-mid)]">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                      </svg>
                    </EmptyMedia>
                    <EmptyTitle className="text-sm">
                      {uploadError ? 'Image could not be loaded' : 'No sky photograph loaded'}
                    </EmptyTitle>
                    <EmptyDescription className="text-xs leading-relaxed">
                      {uploadError || 'Choose a local PNG or JPEG sky image, or load the labelled synthetic Cassiopeia sample. FITS is not supported.'}
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={loadSampleSkyImage}
                      className="text-xs font-semibold"
                    >
                      Load synthetic Cassiopeia
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
            </div>

            {imageLoaded && (
              <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-[11px] text-[var(--ink-secondary)]">
                  Tool: <strong className="text-[var(--signal-mid)] font-semibold capitalize">{activeTool}</strong> · click stars on canvas
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="xs" onClick={handleUndo} disabled={tracedPoints.length === 0} className="text-[11px] font-semibold">
                    ↩ Undo
                  </Button>
                  <Button variant="outline" size="xs" onClick={handleClear} disabled={tracedPoints.length === 0} className="text-[11px] font-semibold">
                    Clear path
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Compact Shape Confirmation Bar beneath canvas */}
          <Card className="atlas-surface p-3.5 gap-2.5 flex flex-col sm:flex-row sm:items-center justify-between rounded-xl shadow-none">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">Server shape</span>
                <span className="font-sans text-sm font-semibold text-[var(--signal-mid)] truncate">
                  {backendRecognition?.state === 'pending' ? 'Checking'
                    : backendRecognition?.state === 'unavailable' ? 'Offline'
                    : backendRecognition?.state === 'available' ? backendRecognition.result.bestMatch?.patternName ?? backendRecognition.result.status
                    : report?.status === 'VALID_PREFIX' ? 'Prefix' : 'Standby'}
                </span>
                {backendRecognition?.state === 'available' && backendRecognition.result.bestMatch && (
                  <span className="font-mono tabular-nums text-xs text-[var(--ink-primary)]">
                    · Residual {backendRecognition.result.bestMatch.residual.toFixed(3)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--ink-muted)] leading-snug" aria-live="polite">
                {backendRecognition?.state === 'pending' ? 'Sending selected points to Costellar for shape confirmation.'
                  : backendRecognition?.state === 'unavailable' ? `Server check unavailable: ${backendRecognition.error}`
                  : backendRecognition?.state === 'available' ? `${backendRecognition.result.status} · server geometry result`
                  : 'DFA data is local telemetry; select at least 3 points for server shape confirmation.'}
              </p>
            </div>

            {report?.inputSymbols && report.inputSymbols.length > 0 ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setSimulatorSymbols(report.inputSymbols);
                  setAutomataTab('simulator');
                  setActiveView('automataLab');
                }}
                className="text-xs font-semibold shrink-0"
              >
                Open in Automata Lab ↗
              </Button>
            ) : (
              <span className="text-[10px] font-mono text-[var(--ink-muted)] shrink-0">
                {tracedPoints.length >= 2 ? 'Recognition in progress' : 'Click stars to sequence path'}
              </span>
            )}
          </Card>
        </div>

        {/* ORDERED INSPECTOR RAIL (Right 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3 min-h-0">
          {/* 1. Source Upload & Sample */}
          <Card className="atlas-surface p-3.5 gap-2.5 rounded-xl shadow-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ink-primary)]">
                1. Source photograph
              </span>
              <span className="font-mono text-[10px] text-[var(--ink-muted)]">Max 4096 px</span>
            </div>

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
              className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-1 ${
                isDragOver
                  ? 'border-[var(--signal-mid)] bg-[var(--bg-pill-active)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-card-subtle)] hover:border-[var(--signal-surface)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <svg className="w-5 h-5 text-[var(--ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-[11px] font-semibold text-[var(--ink-primary)]">
                Drop or choose PNG / JPEG
              </div>
              <div className="text-[10px] text-[var(--ink-muted)] font-mono">
                Local browser decode
              </div>
            </div>
            {uploadError && (
              <Alert variant="error" role="alert" className="p-2 text-[11px] font-mono">
                <AlertDescription className="leading-relaxed">
                  {uploadError}
                </AlertDescription>
              </Alert>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={loadSampleSkyImage}
              aria-label="Load synthetic Cassiopeia sample"
              data-testid="image-lab-sample"
              className="w-full text-xs font-semibold"
            >
              Load synthetic Cassiopeia
            </Button>

            {imageLoaded && fileMeta && (
              <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] rounded-lg flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail"
                      className="w-8 h-8 rounded object-cover border border-[var(--border-subtle)] shrink-0 bg-black"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-black shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold truncate text-[var(--ink-primary)]">
                      {fileMeta.name}
                    </div>
                    <div className="text-[10px] text-[var(--ink-muted)] font-mono tabular-nums truncate">
                      {fileMeta.width} × {fileMeta.height} · {(fileMeta.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleUnloadImage}
                  title="Remove asset"
                  aria-label="Remove loaded image"
                  className="text-[var(--ink-muted)] hover:text-rose-400 shrink-0"
                >
                  ✕
                </Button>
              </div>
            )}
          </Card>

          {/* 2. Luminance Threshold & Detection Count */}
          <Card className="atlas-surface p-3.5 gap-2.5 rounded-xl shadow-none">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--ink-primary)]">
                2. Luminance threshold
              </span>
              <span className="font-mono tabular-nums text-[11px] text-[var(--signal-mid)] font-semibold">
                {imageLoaded ? `${autoStars.length.toLocaleString()} stars` : '8-bit · 50–240'}
              </span>
            </div>

            <div className="p-2 bg-[var(--bg-viewport)] border border-[var(--border-subtle)] rounded-lg flex flex-col gap-1 relative">
              <div className="relative flex items-end justify-between h-14 gap-[2px] pt-1">
                {histogramBins.map((binCount, binIdx) => {
                  const binVal = 50 + (binIdx / 23) * 190;
                  const isAboveThreshold = binVal >= threshold;
                  const fillHeightDots = imageLoaded ? Math.max(1, Math.min(7, Math.round((binCount / maxBinVal) * 7))) : 0;

                  return (
                    <Button
                      key={binIdx}
                      variant="ghost"
                      size="xs"
                      onClick={() => handleSetThreshold(binVal)}
                      aria-label={`Set luminance threshold to ${Math.round(binVal)}`}
                      title={`Luminance ${Math.round(binVal)}: ${binCount.toLocaleString()} pixels`}
                      className="flex h-full sm:h-full w-auto min-w-0 flex-1 shrink flex-col-reverse items-center justify-start gap-[2px] rounded-none border-0 p-0 hover:bg-transparent hover:opacity-80"
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
                    </Button>
                  );
                })}

                <div
                  className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
                  style={{ left: `${((threshold - 50) / 190) * 100}%` }}
                >
                  <div className="w-2 h-2 rounded-full bg-[var(--signal-mid)] -mt-1" />
                  <div className="w-[1.5px] flex-1 bg-[var(--signal-mid)] opacity-80" />
                </div>
              </div>

              <div className="flex justify-between text-[9px] text-[var(--ink-muted)] font-mono border-t border-[var(--border-subtle)] pt-0.5">
                <span>50</span>
                <span>145</span>
                <span>240</span>
              </div>
            </div>

            <div className="space-y-1 py-0.5">
              <Slider
                min={50}
                max={240}
                step={1}
                value={threshold}
                onValueChange={val => handleSetThreshold(typeof val === 'number' ? val : val[0])}
                aria-label="Luminance detection threshold slider"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label htmlFor="image-lab-threshold" className="text-[11px] text-[var(--ink-secondary)]">
                Luminance cutoff
              </label>
              <Input
                id="image-lab-threshold"
                type="number"
                size="sm"
                min={50}
                max={240}
                step={1}
                value={thresholdText}
                onKeyDown={e => e.stopPropagation()}
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
                className="w-20 font-mono tabular-nums font-semibold text-xs"
              />
            </div>
          </Card>

          {/* 3. Detection Contrast Preprocessing */}
          <Card className="atlas-surface p-3.5 gap-2 rounded-xl shadow-none">
            <div className="flex items-center justify-between">
              <label htmlFor="image-lab-contrast-switch" className="text-xs font-semibold text-[var(--ink-primary)] cursor-pointer">
                3. Detection contrast
              </label>
              <Switch
                id="image-lab-contrast-switch"
                checked={filterActive}
                onCheckedChange={checked => setFilterActive(checked)}
                aria-label="Enable detection contrast preprocessing"
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[var(--ink-secondary)]">Contrast scale</span>
                <span className="font-mono tabular-nums text-[var(--signal-mid)] font-semibold">{contrast.toFixed(2)}×</span>
              </div>
              <Slider
                min={0.5}
                max={2.0}
                step={0.05}
                value={contrast}
                onValueChange={val => setContrast(typeof val === 'number' ? val : val[0])}
                aria-label="Contrast scale"
              />
              <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
                Remaps luminance before thresholding. Denoise, debayer, and platesolve calibration are not applied.
              </p>
            </div>
          </Card>

          {/* 4. Manual Star Tools */}
          <Card className="atlas-surface p-3.5 gap-2 rounded-xl shadow-none">
            <span className="text-xs font-semibold text-[var(--ink-primary)]">
              4. Manual correction
            </span>

            <div className="grid grid-cols-5 gap-1.5">
              <Button
                variant={activeTool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('select')}
                aria-label="Select and trace centroids"
                aria-pressed={activeTool === 'select'}
                title="Select / Trace star centroids"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </Button>

              <Button
                variant={activeTool === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('add')}
                aria-label="Add manual centroid"
                aria-pressed={activeTool === 'add'}
                title="Add manual star centroid"
                className="font-mono font-bold"
              >
                +
              </Button>

              <Button
                variant={activeTool === 'remove' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTool('remove')}
                aria-label="Remove centroid"
                aria-pressed={activeTool === 'remove'}
                title="Remove star centroid"
                className="font-mono font-bold"
              >
                −
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={tracedPoints.length === 0}
                aria-label="Undo last trace node"
                title="Undo last trace node"
              >
                ↩
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={tracedPoints.length === 0}
                aria-label="Clear all traced points"
                title="Clear all traced points"
                className="text-rose-400 hover:text-rose-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>

            <div className="text-[10px] text-[var(--ink-secondary)] bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] px-2 py-1.5 rounded font-mono">
              {activeTool === 'select' && 'Mode: snap & trace centroids'}
              {activeTool === 'add' && 'Mode: click canvas to add star'}
              {activeTool === 'remove' && 'Mode: click star to remove'}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
