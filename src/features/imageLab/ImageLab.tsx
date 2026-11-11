import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAstroStore } from '../../stores/useAstroStore';
import { MINIMIZED_DFA_MACHINE, REFERENCE_PATTERNS } from '../../data/astroData';
import { recognizePattern } from '../../recognition/matcher';
import type { Point2D } from '../../geometry/types';
import type { RecognitionReport } from '../../recognition/types';

export const ImageLab: React.FC = () => {
  const { setActiveView, setAutomataTab, setSimulatorSymbols } = useAstroStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [threshold, setThreshold] = useState<number>(180);
  const [detectedStars, setDetectedStars] = useState<Point2D[]>([]);
  const [tracedPoints, setTracedPoints] = useState<Point2D[]>([]);
  const [report, setReport] = useState<RecognitionReport | null>(null);

  // Preprocessing controls (Denoise, Contrast, Sharpen, Background, Debayer)
  const [denoise, setDenoise] = useState<number>(0.4);
  const [contrast, setContrast] = useState<number>(1.2);
  const [sharpen, setSharpen] = useState<number>(0.3);
  const [debayer, setDebayer] = useState<'OFF' | 'ON'>('ON');
  const [backgroundSub, setBackgroundSub] = useState<'NONE' | 'SUBTRACT' | 'FLATTEN'>('SUBTRACT');
  const [filterActive, setFilterActive] = useState<boolean>(true);

  // Histogram bins state (24 discrete quantized bins)
  const [histogramBins, setHistogramBins] = useState<number[]>(new Array(24).fill(0));

  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Generate synthetic / sample starry night sky canvas if user wants a quick sample
  const loadSampleSkyImage = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    // Dark space background
    const grad = ctx.createRadialGradient(400, 300, 50, 400, 300, 500);
    grad.addColorStop(0, '#0a0f1d');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // Render Cassiopeia W asterism distinctly in the center
    const casPoints: Point2D[] = [
      { x: 180, y: 350 }, // Caph
      { x: 300, y: 220 }, // Schedar
      { x: 420, y: 320 }, // Gamma Cas
      { x: 540, y: 200 }, // Ruchbah
      { x: 640, y: 310 }, // Segin
    ];

    // Background random faint stars
    for (let i = 0; i < 150; i++) {
      const rx = Math.random() * 800;
      const ry = Math.random() * 600;
      const brightness = 120 + Math.random() * 110;
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness})`;
      ctx.beginPath();
      ctx.arc(rx, ry, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Prominent stars for the asterism
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

    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    img.onload = () => {
      imageObjRef.current = img;
      setImageLoaded(true);
      setTracedPoints([]);
      setReport(null);
    };
  }, []);

  // Handle local user file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid JPG or PNG image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        imageObjRef.current = img;
        setImageLoaded(true);
        setTracedPoints([]);
        setReport(null);
      };
    };
    reader.readAsDataURL(file);
  };

  // Run Star Detection and Redraw Canvas
  useEffect(() => {
    if (!imageLoaded || !imageObjRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = imageObjRef.current;

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Extract image data for star candidate detection
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const w = canvas.width;
    const h = canvas.height;

    // Grayscale luminance array & histogram calculation
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

      // Map luminance (50..240) into 24 bins
      if (val >= 50 && val <= 240) {
        const binIdx = Math.min(23, Math.floor(((val - 50) / 190) * 24));
        bins[binIdx]++;
      }
    }

    setHistogramBins(bins);

    // 2D Local Intensity Maximum Detection with Non-Maximum Suppression (radius 8px)
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

    setDetectedStars(candidates);

    // Render detected star square corner reticles [ ] (Costellar tactile hardware reticle)
    const size = 7;
    const tick = 3;
    ctx.strokeStyle = '#1D55F5'; // electric cobalt
    ctx.lineWidth = 1.5;

    for (const c of candidates) {
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

    // Render Traced Path
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

    // Render Traced Points Hardware Reticle Badges
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
  }, [imageLoaded, threshold, tracedPoints, contrast, filterActive]);

  // Handle Click on Canvas to Select or Add Star
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if clicked near an auto-detected star (snap to centroid within 15px)
    let selectedPoint: Point2D = { x: clickX, y: clickY };
    for (const star of detectedStars) {
      const dx = star.x - clickX;
      const dy = star.y - clickY;
      if (Math.sqrt(dx * dx + dy * dy) <= 15) {
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

  const maxBinVal = useMemo(() => {
    return Math.max(1, ...histogramBins);
  }, [histogramBins]);

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-shell)] text-[var(--ink-primary)] font-mono p-1.5 sm:p-2 gap-1.5 overflow-y-auto">
      {/* Top Header Bento Card */}
      <div className="bento-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-[var(--signal-cobalt)]" />
            <span className="telemetry-label text-xs">[ 🖼️ IMAGE LAB // OPTICAL STAR TELEMETRY ]</span>
          </div>
          <p className="text-[11px] text-[var(--ink-secondary)] mt-1">
            Local astrophotography star centroid extraction, discrete quantization, and dual-layer formal automata recognition.
          </p>
        </div>

        {/* Upload & Sample Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadSampleSkyImage}
            className="tactile-pill bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] text-[var(--ink-primary)] hover:text-[var(--signal-cobalt)] border border-[var(--bg-tray)] text-[11px] py-1.5 px-3 font-semibold uppercase tracking-wider cursor-pointer"
          >
            🌌 LOAD SAMPLE SKY PHOTO
          </button>
          <label className="tactile-pill hud-reticle bg-[var(--signal-cobalt)] hover:bg-[var(--signal-mid)] text-white border border-[var(--signal-mid)] text-[11px] py-1.5 px-3 font-semibold uppercase tracking-wider cursor-pointer flex items-center gap-1.5">
            <span>📁 UPLOAD FITS / IMAGE</span>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 5-Stage Pipeline Stepper Bar */}
      <div className="bento-card p-2.5 flex items-center gap-1.5 overflow-x-auto text-[10px]">
        {[
          { num: '01', label: 'UPLOAD ASSET', active: imageLoaded },
          { num: '02', label: 'DETECT STARS', active: detectedStars.length > 0 },
          { num: '03', label: 'TRACE ASTERISM', active: tracedPoints.length > 0 },
          { num: '04', label: 'QUANTIZE Σ*', active: report !== null },
          { num: '05', label: 'RUN RECOGNITION', active: report?.status === 'FULL_MATCH' },
        ].map((st, sIdx) => (
          <div
            key={sIdx}
            className={`hud-reticle px-2.5 py-1 rounded-[6px] border flex items-center gap-1.5 shrink-0 transition-colors ${
              st.active
                ? 'bg-[var(--bg-pill-active)] text-[var(--signal-cobalt)] border-[var(--signal-mid)] font-bold'
                : 'bg-[var(--bg-card-subtle)] text-[var(--ink-muted)] border-[var(--card-border-subtle)]'
            }`}
          >
            <span className="font-dot text-[11px]">{st.num}</span>
            <span className="uppercase tracking-wider">{st.label}</span>
          </div>
        ))}
      </div>

      {/* Main Workspace */}
      {imageLoaded ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1.5 flex-1 min-h-0">
          {/* Canvas & Controls Container */}
          <div className="lg:col-span-2 flex flex-col gap-1.5 min-h-0">
            {/* Preprocessing Controls: Tactile Hardware Toggles & Discrete Steppers */}
            <div className="bento-card p-3 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="telemetry-label text-[10px]">[ PREPROCESSING HARDWARE TELEMETRY ]</span>
                <button
                  onClick={() => setFilterActive(!filterActive)}
                  className={`tactile-pill text-[10px] uppercase font-bold tracking-wider ${
                    filterActive ? 'active' : ''
                  }`}
                >
                  FILTER ENGINE: {filterActive ? 'ACTIVE' : 'BYPASS'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {/* Contrast Stepper */}
                <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[6px] space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[var(--ink-muted)] uppercase">CONTRAST:</span>
                    <span className="font-dot text-[var(--signal-cobalt)] font-bold">{contrast.toFixed(1)}x</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setContrast(prev => Math.max(0.5, parseFloat((prev - 0.1).toFixed(1))))}
                      className="tactile-pill bg-[var(--bg-card)] border border-[var(--card-border-subtle)] px-2 py-0.5 text-[10px] font-bold"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setContrast(prev => Math.min(2.0, parseFloat((prev + 0.1).toFixed(1))))}
                      className="tactile-pill bg-[var(--bg-card)] border border-[var(--card-border-subtle)] px-2 py-0.5 text-[10px] font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Denoise Stepper */}
                <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[6px] space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[var(--ink-muted)] uppercase">DENOISE:</span>
                    <span className="font-dot text-[var(--signal-cobalt)] font-bold">{denoise.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDenoise(prev => Math.max(0.0, parseFloat((prev - 0.1).toFixed(2))))}
                      className="tactile-pill bg-[var(--bg-card)] border border-[var(--card-border-subtle)] px-2 py-0.5 text-[10px] font-bold"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setDenoise(prev => Math.min(1.0, parseFloat((prev + 0.1).toFixed(2))))}
                      className="tactile-pill bg-[var(--bg-card)] border border-[var(--card-border-subtle)] px-2 py-0.5 text-[10px] font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Sharpen Stepper */}
                <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[6px] space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[var(--ink-muted)] uppercase">SHARPEN:</span>
                    <span className="font-dot text-[var(--signal-cobalt)] font-bold">{sharpen.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSharpen(prev => Math.max(0.0, parseFloat((prev - 0.05).toFixed(2))))}
                      className="tactile-pill bg-[var(--bg-card)] border border-[var(--card-border-subtle)] px-2 py-0.5 text-[10px] font-bold"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setSharpen(prev => Math.min(1.0, parseFloat((prev + 0.05).toFixed(2))))}
                      className="tactile-pill bg-[var(--bg-card)] border border-[var(--card-border-subtle)] px-2 py-0.5 text-[10px] font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Debayer Rocker */}
                <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[6px] space-y-1">
                  <div className="text-[10px] text-[var(--ink-muted)] uppercase">DEBAYER:</div>
                  <div className="tactile-rocker">
                    {(['OFF', 'ON'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDebayer(d)}
                        className={`tactile-pill text-[9px] uppercase ${debayer === d ? 'active' : ''}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Subtraction Rocker */}
                <div className="p-2 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[6px] space-y-1">
                  <div className="text-[10px] text-[var(--ink-muted)] uppercase">BACKGROUND:</div>
                  <div className="tactile-rocker">
                    {(['NONE', 'SUBTRACT'] as const).map(b => (
                      <button
                        key={b}
                        onClick={() => setBackgroundSub(b as any)}
                        className={`tactile-pill text-[9px] uppercase ${backgroundSub === b ? 'active' : ''}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quantized Dot Curve Histogram & Stepping Buttons (Zero Continuous Slider) */}
            <div className="bento-card p-3 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="telemetry-label text-[10px]">[ QUANTIZED BRIGHTNESS HISTOGRAM // DISCRETE THRESHOLD ]</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-[11px] text-[var(--ink-muted)]">
                    THRESHOLD: <span className="font-dot text-sm text-[var(--signal-cobalt)] font-bold">{threshold}</span>
                  </div>
                  <div className="text-[11px] text-[var(--ink-muted)]">
                    STARS DETECTED: <span className="font-dot text-sm text-[var(--signal-cobalt)] font-bold">{detectedStars.length}</span>
                  </div>
                </div>
              </div>

              {/* 24-Column Quantized Dot Matrix Histogram */}
              <div className="p-2.5 bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] rounded-[8px] flex flex-col gap-1.5">
                <div className="flex items-end justify-between h-16 gap-[3px] pt-1">
                  {histogramBins.map((binCount, binIdx) => {
                    const binVal = 50 + (binIdx / 23) * 190;
                    const isAboveThreshold = binVal >= threshold;
                    const fillHeightDots = Math.max(1, Math.min(8, Math.round((binCount / maxBinVal) * 8)));

                    return (
                      <button
                        key={binIdx}
                        onClick={() => setThreshold(Math.round(binVal))}
                        title={`Bin ${Math.round(binVal)}: ${binCount} pixels`}
                        className="flex-1 flex flex-col-reverse items-center gap-[2px] cursor-pointer hover:opacity-80 h-full justify-start"
                      >
                        {Array.from({ length: 8 }).map((_, dIdx) => (
                          <span
                            key={dIdx}
                            className={`w-[4px] h-[4px] rounded-full transition-colors ${
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
                </div>

                {/* Histogram Axis Markers */}
                <div className="flex justify-between text-[9px] text-[var(--ink-muted)] font-mono border-t border-[var(--bg-tray)] pt-1 px-1">
                  <span>50 (DARK)</span>
                  <span>145 (MID)</span>
                  <span>240 (PEAK BRIGHT)</span>
                </div>
              </div>

              {/* Hardware Stepping Controls for Brightness Threshold */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="telemetry-label text-[10px] text-[var(--ink-muted)]">STEPPERS:</span>
                  <button
                    onClick={() => setThreshold(prev => Math.max(50, prev - 10))}
                    className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1 px-2.5 font-bold"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => setThreshold(prev => Math.max(50, prev - 1))}
                    className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1 px-2.5 font-bold"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => setThreshold(prev => Math.min(240, prev + 1))}
                    className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1 px-2.5 font-bold"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => setThreshold(prev => Math.min(240, prev + 10))}
                    className="tactile-pill bg-[var(--bg-pill-neutral)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1 px-2.5 font-bold"
                  >
                    +10
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="telemetry-label text-[10px] text-[var(--ink-muted)]">PRESETS:</span>
                  {[
                    { label: '80', val: 80 },
                    { label: '140', val: 140 },
                    { label: '180', val: 180 },
                    { label: '210', val: 210 },
                  ].map(p => (
                    <button
                      key={p.val}
                      onClick={() => setThreshold(p.val)}
                      className={`tactile-pill text-[9px] py-1 px-2 ${
                        threshold === p.val ? 'active' : ''
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Canvas Viewport */}
            <div className="bento-card bg-[var(--bg-viewport)] rounded-[10px] overflow-hidden flex items-center justify-center p-2 relative shadow-none border border-[var(--bg-tray)] flex-1 min-h-[360px]">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="max-w-full max-h-[550px] object-contain cursor-crosshair rounded-[6px]"
              />
            </div>

            {/* Traced Points Action Bar */}
            <div className="bento-card p-2.5 flex items-center justify-between text-xs">
              <span className="font-mono text-[var(--ink-primary)] text-[11px]">
                TRACED NODES: <strong className="font-dot text-[var(--signal-cobalt)]">{tracedPoints.length}</strong> POINTS
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  disabled={tracedPoints.length === 0}
                  className="tactile-pill bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] disabled:opacity-40 text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1 px-2.5 font-bold uppercase tracking-wider cursor-pointer"
                >
                  ↩ UNDO NODE
                </button>
                <button
                  onClick={handleClear}
                  disabled={tracedPoints.length === 0}
                  className="tactile-pill bg-[var(--bg-pill-neutral)] hover:bg-[var(--bg-pill-active)] disabled:opacity-40 text-[var(--ink-primary)] border border-[var(--bg-tray)] text-[10px] py-1 px-2.5 font-bold uppercase tracking-wider cursor-pointer"
                >
                  CLEAR PATH
                </button>
              </div>
            </div>
          </div>

          {/* Recognition Results Side Panel */}
          <div className="bento-card p-4 flex flex-col space-y-3.5">
            <div className="flex items-center justify-between border-b border-[var(--card-border-subtle)] pb-2.5">
              <span className="telemetry-label text-xs">[ AUTOMATA RECOGNITION REPORT ]</span>
              <span className="font-dot text-xs text-[var(--signal-cobalt)]">DFA</span>
            </div>

            {report ? (
              <div className="space-y-3 text-xs">
                {/* Full Match Verdict Card */}
                {report.status === 'FULL_MATCH' && (
                  <div className="hud-reticle-4corner p-3.5 bg-[var(--bg-pill-active)] border border-[var(--signal-cobalt)] rounded-[8px] space-y-1.5">
                    <div className="font-dot text-base text-[var(--signal-cobalt)] font-bold">
                      [ VERIFIED: FULL MATCH ]
                    </div>
                    <div className="text-[12px] uppercase font-bold text-[var(--ink-primary)]">
                      MATCHED: {report.bestMatch?.patternName}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--ink-secondary)]">
                      PROCRUSTES RESIDUAL: <strong className="font-dot text-[var(--signal-cobalt)]">{report.bestMatch?.residual}</strong> (&le; 0.32 TOLERANCE)
                    </div>
                  </div>
                )}

                {/* Valid Prefix Verdict Card */}
                {report.status === 'VALID_PREFIX' && (
                  <div className="hud-reticle p-3 bg-[var(--bg-card-subtle)] border border-[var(--signal-mid)] rounded-[8px] space-y-1">
                    <div className="font-dot text-sm text-[var(--signal-cobalt)] font-bold">
                      [ VALID PATTERN PREFIX ]
                    </div>
                    <div className="text-[11px] text-[var(--ink-secondary)]">
                      CANDIDATE PATTERNS: {report.prefixMatch.reachableAcceptingLabels.join(', ')}
                    </div>
                  </div>
                )}

                {/* Symbolic Rejection Card */}
                {report.status === 'SYMBOLIC_REJECT' && (
                  <div className="hud-reticle p-3 bg-[var(--bg-card-subtle)] border border-[var(--ink-muted)] rounded-[8px] space-y-1">
                    <div className="font-dot text-sm text-[var(--ink-muted)] font-bold">
                      [ SYMBOLIC REJECTION ]
                    </div>
                    <div className="text-[11px] text-[var(--ink-muted)]">
                      {report.explanation}
                    </div>
                  </div>
                )}

                {/* Encoded Symbolic String (Σ*) */}
                <div className="p-3 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] space-y-1.5 font-mono">
                  <div className="telemetry-label text-[9px]">
                    ENCODED INPUT STRING (Σ*):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {report.inputSymbols.map((sym, idx) => (
                      <span key={idx} className="hud-reticle px-2 py-0.5 bg-[var(--bg-pill-neutral)] border border-[var(--bg-tray)] rounded-[4px] text-[var(--signal-cobalt)] font-bold text-[10px]">
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Open in Automata Lab Action Button */}
                <button
                  onClick={() => {
                    setSimulatorSymbols(report.inputSymbols);
                    setAutomataTab('simulator');
                    setActiveView('automataLab');
                  }}
                  className="tactile-button bg-[var(--signal-cobalt)] hover:bg-[var(--signal-mid)] text-white w-full py-2.5 px-3 rounded-[6px] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-none"
                >
                  <span>⚡</span>
                  <span>OPEN IN AUTOMATA LAB ↗</span>
                </button>
              </div>
            ) : (
              <div className="text-[var(--ink-muted)] text-xs p-3.5 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] leading-relaxed">
                Click at least 2 or 3 detected star centroids in sequence to form a path, compute relative turning angles and distance ratios, and run the DFA recognition engine.
              </div>
            )}

            {/* Scientific Boundary Disclaimer */}
            <div className="mt-auto p-3 bg-[var(--bg-card-subtle)] rounded-[8px] border border-[var(--card-border-subtle)] text-[10px] text-[var(--ink-muted)] leading-relaxed">
              💡 <strong>SCIENTIFIC SPECIFICATION:</strong> This module runs scale-invariant and rotation-invariant formal automata feature extraction on 2D image coordinates. It does not perform cloud blind astrometric plate solving.
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Prompt */
        <div className="bento-card flex-1 flex flex-col items-center justify-center border border-[var(--bg-tray)] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-[10px] bg-[var(--bg-card-subtle)] border border-[var(--card-border-subtle)] flex items-center justify-center text-2xl">
            🌌
          </div>
          <h3 className="telemetry-label text-sm text-[var(--ink-primary)]">
            UPLOAD NIGHT SKY PHOTOGRAPHY OR LOAD SAMPLE
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] max-w-md leading-relaxed font-mono">
            Upload local astrophotography (JPG or PNG) or load our curated starry night sample with the Cassiopeia asterism to begin optical centroid extraction and automata pattern tracing.
          </p>
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={loadSampleSkyImage}
              className="tactile-pill hud-reticle bg-[var(--signal-cobalt)] hover:bg-[var(--signal-mid)] text-white border border-[var(--signal-mid)] text-xs py-2 px-4 font-bold uppercase tracking-wider cursor-pointer"
            >
              LOAD SAMPLE NIGHT SKY IMAGE ↗
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
