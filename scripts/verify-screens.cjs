const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const os = require('os');
const OUTPUT_ROOT = process.env.COSTELLAR_EVIDENCE_DIR || path.join(os.tmpdir(), 'costellar-evidence');
const BASE_URL = process.env.COSTELLAR_BASE_URL || 'http://localhost:5319/';
const CDP_PORT = Number(process.env.COSTELLAR_CDP_PORT || 9237);
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const EVIDENCE_DIR = path.join(OUTPUT_ROOT, `browser-${RUN_ID}`);
const pageErrors = [];

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendCDP(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handleMsg = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handleMsg);
          if (msg.error) reject(new Error(JSON.stringify(msg.error)));
          else resolve(msg.result);
        }
      } catch {
        // ignore
      }
    };
    ws.addEventListener('message', handleMsg);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalInPage(ws, expression) {
  const res = await sendCDP(ws, 'Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error('Eval exception: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result?.value;
}

async function captureScreen(ws, filename) {
  const res = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(res.data, 'base64');
  const outPath = path.join(EVIDENCE_DIR, filename);
  fs.writeFileSync(outPath, buf);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  console.log(`Saved ${filename}: ${w}x${h} (${buf.length} bytes)`);
  return { path: outPath, width: w, height: h, size: buf.length };
}

async function clickNav(ws, label) {
  const active = await evalInPage(ws, `(() => {
    const nav = document.querySelector('nav[aria-label="Main Navigation"]');
    const button = Array.from(nav?.querySelectorAll('button') || []).find(b => b.textContent.trim() === ${JSON.stringify(label)});
    if (!button) return { found: false, active: null };
    button.click();
    return { found: true, active: button.textContent.trim() };
  })()`);
  if (!active?.found) throw new Error(`Navigation item not found: ${label}`);
  await sleep(500);
  const current = await evalInPage(ws, `document.querySelector('nav[aria-label="Main Navigation"] button[aria-current="page"]')?.textContent.trim() || null`);
  const shellPresent = await evalInPage(ws, `Boolean(document.querySelector('.left-rail') && document.querySelector('main'))`);
  if (!shellPresent) throw new Error(`Application shell disappeared after navigation to ${label}; active item is ${current}; page errors=${JSON.stringify(pageErrors)}`);
  if (current !== label) throw new Error(`Navigation to ${label} failed; active item is ${current}; available=${JSON.stringify(await evalInPage(ws, `Array.from(document.querySelectorAll('nav button')).map(b=>b.textContent.trim())`))}; page errors=${JSON.stringify(pageErrors)}`);
  console.log(`Navigation OK: ${label}`);
}

async function setViewport(ws, width, height) {
  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width <= 500,
  });
  await sleep(400);
  return await evalInPage(ws, `(() => ({
    viewport: [innerWidth, innerHeight],
    page: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
    main: (() => { const r = document.querySelector('main')?.getBoundingClientRect(); return r ? {x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height)} : null; })(),
    rail: (() => { const r = document.querySelector('.left-rail')?.getBoundingClientRect(); return r ? {x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height)} : null; })(),
    navButtons: document.querySelectorAll('nav[aria-label="Main Navigation"] button').length,
    bodyTextLength: document.body.innerText.length,
  }))()`);
}

async function canvasHash(ws) {
  const r = await evalInPage(ws, `(() => { const c = document.querySelector('canvas'); if (!c) return null; const b = c.getBoundingClientRect(); return {x:b.x,y:b.y,width:b.width,height:b.height}; })()`);
  if (!r || !r.width || !r.height) return null;
  const ss = await sendCDP(ws, 'Page.captureScreenshot', {
    format: 'png', fromSurface: true,
    clip: { x: r.x, y: r.y, width: r.width, height: r.height, scale: 1 },
  });
  return crypto.createHash('sha256').update(Buffer.from(ss.data, 'base64')).digest('hex');
}

let edgeProcess;
let browserSocket;

async function main() {
  console.log('Starting Edge headless...');
  edgeProcess = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${path.join(os.tmpdir(), `costellar-edge-${process.pid}`)}`,
    '--window-size=1586,992',
    BASE_URL,
  ], { stdio: 'ignore' });

  // Wait for remote debugging to be ready
  let targets = null;
  for (let i = 0; i < 20; i++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${CDP_PORT}/json`);
      targets = await resp.json();
      if (targets && targets.find(t => t.type === 'page')) break;
    } catch {
      // retry
    }
    await sleep(500);
  }

  if (!targets) {
    edgeProcess.kill();
    throw new Error('Failed to connect to Edge CDP');
  }

  const pageTarget = targets.find(t => t.type === 'page');
  console.log('Connected to target:', pageTarget.url, pageTarget.webSocketDebuggerUrl);

  const ws = browserSocket = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  // Enable Page, Runtime, DOM
  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');
  ws.addEventListener('message', event => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        const detail = msg.params.exceptionDetails;
        pageErrors.push({ type: 'exception', text: detail.text, description: detail.exception?.description, url: detail.url, line: detail.lineNumber, column: detail.columnNumber });
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        pageErrors.push({ type: 'console.error', args: (msg.params.args || []).map(a => a.value ?? a.description).join(' ') });
      }
    } catch { /* ignore unrelated CDP messages */ }
  });
  await sendCDP(ws, 'Page.navigate', { url: BASE_URL });
  await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
    width: 1586,
    height: 992,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('Waiting for React app to mount...');
  for (let i = 0; i < 30; i++) {
    const hasApp = await evalInPage(ws, `!!document.querySelector('.left-rail')`);
    if (hasApp) break;
    await sleep(400);
  }
  const shellReady = await evalInPage(ws, `Boolean(document.querySelector('.left-rail') && document.querySelector('main'))`);
  if (!shellReady) throw new Error(`Application shell did not mount at ${BASE_URL}; page errors=${JSON.stringify(pageErrors)}`);
  if (process.env.COSTELLAR_PROBE_ONLY === '1') {
    await sleep(1000);
    const direct = await evalInPage(ws, `({title:document.title, shell:Boolean(document.querySelector('.left-rail')), active:document.querySelector('nav button[aria-current="page"]')?.textContent.trim(), mainText:document.querySelector('main')?.innerText.slice(0,500)})`);
    const screenshot = await captureScreen(ws, 'direct-view.png');
    fs.writeFileSync(path.join(EVIDENCE_DIR, 'direct-view.json'), JSON.stringify({ baseUrl: BASE_URL, runId: RUN_ID, direct, screenshot, pageErrors }, null, 2));
    ws.close();
    edgeProcess.kill();
    return;
  }

  // Check left rail width
  const railMetrics = await evalInPage(ws, `(() => {
    const rail = document.querySelector('.left-rail');
    if (!rail) return null;
    const rect = rail.getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  })()`);
  console.log('Left rail metrics:', railMetrics);

  const results = {};

  // 1. Frame 01 & 03: Overview
  console.log('\nCapturing Frame 1 & 3: Overview...');
  await clickNav(ws, 'OVERVIEW');
  await sleep(1000);
  results['frame_01_overview'] = await captureScreen(ws, 'frame_01_overview.png');
  results.desktopMetrics = await setViewport(ws, 1586, 992);
  await captureScreen(ws, 'responsive-desktop-overview.png');

  // 2. Frame 02 & 04: Sky Explorer (inspect Orion)
  console.log('\nCapturing Frame 2 & 4: Sky Explorer...');
  await clickNav(ws, 'SKY EXPLORER');
  await sleep(1000);
  const idleHash1 = await canvasHash(ws);
  await sleep(2200);
  const idleHash2 = await canvasHash(ws);
  results.skyIdleStable = Boolean(idleHash1 && idleHash1 === idleHash2);
  const canvasRect = await evalInPage(ws, `(() => { const c = document.querySelector('canvas'); const r = c?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,width:r.width,height:r.height} : null; })()`);
  if (!canvasRect) throw new Error('Sky renderer canvas was not present for drag interaction');
  const startX = canvasRect.x + canvasRect.width * 0.52;
  const startY = canvasRect.y + canvasRect.height * 0.52;
  for (const p of [
    { type: 'mousePressed', x: startX, y: startY, button: 'left', buttons: 1, clickCount: 1 },
    { type: 'mouseMoved', x: startX + 76, y: startY + 42, button: 'left', buttons: 1 },
    { type: 'mouseReleased', x: startX + 76, y: startY + 42, button: 'left', buttons: 0, clickCount: 1 },
  ]) await sendCDP(ws, 'Input.dispatchMouseEvent', p);
  await sleep(700);
  const draggedHash = await canvasHash(ws);
  results.skyDragChanged = Boolean(idleHash2 && draggedHash && idleHash2 !== draggedHash);
  console.log('Sky idle/drag checks:', { idleStable: results.skyIdleStable, dragChanged: results.skyDragChanged });
  results['frame_02_sky'] = await captureScreen(ws, 'frame_02_sky.png');

  // 3. Frame 05: Sky Tonight
  console.log('\nCapturing Frame 5: Sky Tonight...');
  await clickNav(ws, 'SKY TONIGHT');
  await sleep(1000);
  results['frame_05_tonight'] = await captureScreen(ws, 'frame_05_tonight.png');

  // 4. Frame 06: Constellation Library
  console.log('\nCapturing Frame 6: Constellation Library...');
  await clickNav(ws, 'LIBRARY');
  await sleep(1000);
  results['frame_06_constellations'] = await captureScreen(ws, 'frame_06_constellations.png');

  // 5. Frame 12: Orion Detail
  console.log('\nCapturing Frame 12: Orion Detail...');
  const openedOrion = await evalInPage(ws, `(() => {
    const btn = Array.from(document.querySelectorAll('button[aria-label]')).find(b => b.getAttribute('aria-label').toLowerCase() === 'open orion details');
    if (btn) btn.click();
    else Array.from(document.querySelectorAll('[role="button"][aria-label]')).find(b => b.getAttribute('aria-label').toLowerCase() === 'select orion constellation')?.click();
    return { opened: Boolean(btn), labels: Array.from(document.querySelectorAll('button[aria-label]')).map(b => b.getAttribute('aria-label')).slice(0, 10) };
  })()`);
  await sleep(250);
  await evalInPage(ws, `Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'VIEW DETAILS')?.click()`);
  await sleep(1000);
  if (!(await evalInPage(ws, `document.querySelector('main h1')?.textContent.trim().toLowerCase().startsWith('orion') && Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('CONSTELLATION DETAILS'))`))) throw new Error(`Orion detail page did not open: ${JSON.stringify(openedOrion)}`);
  results['frame_12_orion_detail'] = await captureScreen(ws, 'frame_12_orion_detail.png');

  // Return back from detail
  await clickNav(ws, 'LIBRARY');

  // 6. Frame 10: Automata Lab
  console.log('\nCapturing Frame 10: Automata Lab...');
  await clickNav(ws, 'AUTOMATA');
  await sleep(1000);
  results['frame_10_automata'] = await captureScreen(ws, 'frame_10_automata.png');

  // 7. Frame 11: Image Lab
  console.log('\nCapturing Frame 11: Image Lab...');
  await clickNav(ws, 'IMAGE LAB');
  await sleep(500);
  // Also click load sample in Image Lab if present
  const clickedImageSample = await evalInPage(ws, `(() => {
    const sampleBtn = document.querySelector('main [data-testid="image-lab-sample"]') || Array.from(document.querySelectorAll('main button')).find(b => b.textContent.toUpperCase().includes('LOAD SYNTHETIC CASSIOPEIA'));
    sampleBtn?.click();
    return Boolean(sampleBtn);
  })()`);
  if (!clickedImageSample) throw new Error('Image Lab sample control not found');
  await sleep(1000);
  if (!(await evalInPage(ws, `document.body.innerText.includes('SYNTHETIC_CASSIOPEIA.PNG')`))) throw new Error('Image Lab sample did not load');
  results['frame_11_imagelab'] = await captureScreen(ws, 'frame_11_imagelab.png');

  // 8. Frame 07: Trace Mode Reticle
  console.log('\nCapturing Frame 7: Trace Mode...');
  await clickNav(ws, 'TRACE');
  const loadedPreset = await evalInPage(ws, `(() => {
    const select = Array.from(document.querySelectorAll('select')).find(s => Array.from(s.options).some(o => o.value && !o.value.startsWith('DEMO_')));
    const option = select && Array.from(select.options).find(o => o.value && !o.value.startsWith('DEMO_'));
    if (!select || !option) return false;
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  if (!loadedPreset) throw new Error('Trace preset selector not found');
  await sleep(700);
  await sleep(1000);
  results['frame_07_trace'] = await captureScreen(ws, 'frame_07_trace.png');

  // 9. Frame 08: Recognition Result
  console.log('\nCapturing Frame 8: Recognition Result...');
  const completedTrace = await evalInPage(ws, `(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('COMPLETE TRACE') && !b.disabled); if (!b) return false; b.click(); return true; })()`);
  if (!completedTrace) throw new Error('Trace preset did not enable recognition results');
  await sleep(1200);
  if (!(await evalInPage(ws, `document.body.innerText.includes('Pattern accepted') || document.body.innerText.includes('Valid prefix') || document.body.innerText.includes('No recognition report')`))) throw new Error('Recognition results page did not render');
  results['frame_08_results'] = await captureScreen(ws, 'frame_08_results.png');
  const handedOff = await evalInPage(ws, `(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Open in Automata Lab') && !b.disabled); if (!b) return false; b.click(); return true; })()`);
  if (!handedOff) throw new Error('Recognition report did not offer Automata Lab handoff');
  await sleep(700);
  const handoffState = await evalInPage(ws, `({active: document.querySelector('nav[aria-label="Main Navigation"] button[aria-current="page"]')?.textContent.trim(), hasInput: document.querySelector('main')?.innerText.length > 80})`);
  results.traceToAutomata = handoffState;
  if (handoffState.active !== 'AUTOMATA' || !handoffState.hasInput) throw new Error(`Trace report handoff failed: ${JSON.stringify(handoffState)}`);
  results.traceToAutomataScreenshot = await captureScreen(ws, '16-trace-to-automata.png');

  // 10. Frame 09: Pattern Analysis Modal
  console.log('\nCapturing Frame 9: Pattern Analysis Modal...');
  await clickNav(ws, 'TRACE');
  const openedGeometry = await evalInPage(ws, `(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('GEOMETRY') && !b.disabled); if (!b) return false; b.click(); return true; })()`);
  if (!openedGeometry) throw new Error('Geometry analysis control unavailable after preset trace');
  await sleep(1200);
  if (!(await evalInPage(ws, `!!document.querySelector('#pattern-analysis-title')`))) throw new Error('Pattern analysis did not open');
  results['frame_09_patterns'] = await captureScreen(ws, 'frame_09_patterns.png');

  // Other reachable views are captured on desktop as integration evidence.
  for (const [label, file] of [['HUNT MODE', '13-hunt.png'], ['VIVA MODE', '14-viva.png'], ['CREDITS', '15-credits.png']]) {
    await clickNav(ws, label);
    results[file] = await captureScreen(ws, file);
  }

  // Compact and mid-sized responsive layouts retain navigation and measurable content reachability.
  for (const [name, width, height] of [['mobile', 390, 844], ['mid', 1024, 768]]) {
    const metrics = await setViewport(ws, width, height);
    results[`${name}Metrics`] = metrics;
    await clickNav(ws, 'OVERVIEW');
    results[`${name}Overview`] = await captureScreen(ws, `${name}-overview.png`);
    await clickNav(ws, 'SKY EXPLORER');
    results[`${name}Sky`] = await captureScreen(ws, `${name}-sky.png`);
    await clickNav(ws, 'LIBRARY');
    results[`${name}Library`] = await captureScreen(ws, `${name}-library.png`);
    await clickNav(ws, 'IMAGE LAB');
    results[`${name}ImageLab`] = await captureScreen(ws, `${name}-image-lab.png`);
    if (name === 'mobile') {
      // With a selected constellation, the mobile preview footer should open and close its detail sheet.
      await clickNav(ws, 'LIBRARY');
      const pickedOrion = await evalInPage(ws, `(() => { const b = Array.from(document.querySelectorAll('main button[aria-label]')).find(b => b.getAttribute('aria-label').toLowerCase().startsWith('select orion constellation')); b?.click(); return Boolean(b); })()`);
      if (pickedOrion) await sleep(300);
      const openedDetailsSheet = await evalInPage(ws, `(() => { const b = Array.from(document.querySelectorAll('main button')).find(b => b.textContent.includes('VIEW DETAILS') && !b.textContent.includes('→')); b?.click(); return Boolean(b); })()`);
      await sleep(300);
      const catalogSheet = await evalInPage(ws, `(() => { const a = document.querySelector('aside[aria-label="Orion constellation details"]'); if (!a) return {visible:false}; const r=a.parentElement.getBoundingClientRect(); return {visible:true, rect:{x:r.x,y:r.y,width:r.width,height:r.height}, withinViewport:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}; })()`);
      results.mobileCatalogDetails = catalogSheet;
      if (!openedDetailsSheet || !catalogSheet.visible || !catalogSheet.withinViewport) throw new Error(`Mobile catalog details failed to open within viewport: ${JSON.stringify(catalogSheet)}`);
      results.mobileCatalogDetailsScreenshot = await captureScreen(ws, 'mobile-library-details.png');
      await evalInPage(ws, `document.querySelector('button[aria-label="Close constellation details"]')?.click()`);
      await sleep(200);
      if (!(await evalInPage(ws, `(() => { const a=document.querySelector('aside[aria-label="Orion constellation details"]'); const wrap=a?.parentElement; return !wrap || getComputedStyle(wrap).display==='none'; })()`))) throw new Error('Mobile constellation detail sheet did not close');

      for (const [label, file] of [['SKY TONIGHT', 'mobile-tonight.png'], ['HUNT MODE', 'mobile-hunt.png'], ['VIVA MODE', 'mobile-viva.png']]) {
        await clickNav(ws, label);
        results[file] = await captureScreen(ws, file);
      }
      await clickNav(ws, 'IMAGE LAB');
      const loaded = await evalInPage(ws, `(() => { const b = document.querySelector('[data-testid="image-lab-sample"]'); b?.click(); return Boolean(b); })()`);
      if (!loaded) throw new Error('Mobile Image Lab sample control not found');
      await sleep(700);
      const sampleVisible = await evalInPage(ws, `document.body.innerText.includes('SYNTHETIC_CASSIOPEIA.PNG')`);
      if (!sampleVisible) throw new Error('Mobile Image Lab sample failed to load');
      results.mobileImageLabLoaded = await captureScreen(ws, 'mobile-image-lab-loaded.png');
      await clickNav(ws, 'TRACE');
      results.mobileTrace = await captureScreen(ws, 'mobile-trace.png');
      results.mobileMatchesDefaultHidden = await evalInPage(ws, `(() => { const b=document.querySelector('button[aria-controls="trace-candidate-panel"]'); const p=document.querySelector('#trace-candidate-panel'); return Boolean(b&&p&&!b.getAttribute('aria-expanded')?.includes('true')&&getComputedStyle(p).display==='none'); })()`);
      if (!results.mobileMatchesDefaultHidden) throw new Error('Mobile TRACE candidate panel was not hidden by default');
      const matchesOpened = await evalInPage(ws, `(() => { const b=document.querySelector('button[aria-controls="trace-candidate-panel"]'); b?.click(); return Boolean(b); })()`);
      await sleep(200);
      const matchesMetrics = await evalInPage(ws, `(() => { const p=document.querySelector('#trace-candidate-panel'); if(!p)return {visible:false}; const r=p.getBoundingClientRect(); return {visible:getComputedStyle(p).display!=='none',withinViewport:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,rect:{x:r.x,y:r.y,width:r.width,height:r.height}}; })()`);
      results.mobileMatchesOpen = { opened: matchesOpened, ...matchesMetrics };
      if (!matchesOpened || !matchesMetrics.visible || !matchesMetrics.withinViewport) throw new Error(`Mobile MATCHES disclosure failed: ${JSON.stringify(results.mobileMatchesOpen)}`);
      results.mobileTraceMatchesOpenScreenshot = await captureScreen(ws, 'mobile-trace-matches-open.png');
      await evalInPage(ws, `document.querySelector('button[aria-controls="trace-candidate-panel"]')?.click()`);
      await sleep(150);
      if (!(await evalInPage(ws, `getComputedStyle(document.querySelector('#trace-candidate-panel')).display==='none'`))) throw new Error('Mobile MATCHES disclosure did not hide after toggling closed');
    }
  }

  await setViewport(ws, 390, 844);
  await clickNav(ws, 'OVERVIEW');
  const searchUpwards = await evalInPage(ws, `(() => {
    const input = document.querySelector('input[aria-label="Search stars and constellations"]');
    if (!input) return { found: false };
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Orion');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    const list = document.querySelector('#sky-search-results');
    if (!list) return { found: true, visible: false };
    const a = input.getBoundingClientRect(), b = list.getBoundingClientRect();
    return { found: true, visible: true, aboveInput: b.bottom <= a.top, withinViewport: b.top >= 0 && b.bottom <= innerHeight, hasOrion: list.innerText.toLowerCase().includes('orion'), input: {top:a.top,bottom:a.bottom}, list: {top:b.top,bottom:b.bottom} };
  })()`);
  results.mobileSearchMenu = searchUpwards;
  if (!searchUpwards.found || !searchUpwards.visible || !searchUpwards.aboveInput || !searchUpwards.hasOrion) throw new Error(`Mobile search results did not open upward: ${JSON.stringify(searchUpwards)}`);
  results.mobileSearch = await captureScreen(ws, 'mobile-search-upwards.png');

  await clickNav(ws, 'SKY EXPLORER');
  results.mobileObserverVisible = await evalInPage(ws, `document.body.innerText.includes('CURRENT LOCATION') && document.body.innerText.includes('GREENWICH')`);
  if (!results.mobileObserverVisible) throw new Error('Mobile observer/location content was not reachable');
  results.mobileObserver = await captureScreen(ws, 'mobile-observer.png');
  const openedObserver = await evalInPage(ws, `(() => { const b = document.querySelector('button[aria-haspopup="dialog"]'); b?.click(); return Boolean(b); })()`);
  await sleep(250);
  const observerDialog = await evalInPage(ws, `(() => { const d = document.querySelector('[role="dialog"][aria-modal="true"]'); return { visible: Boolean(d), focusInside: Boolean(d && d.contains(document.activeElement)), labels: d?.innerText.slice(0, 100) || '' }; })()`);
  results.mobileObserverDialog = observerDialog;
  if (!openedObserver || !observerDialog.visible || !observerDialog.focusInside) throw new Error(`Observer dialog did not open accessibly: ${JSON.stringify(observerDialog)}`);
  const invalidCoordinates = await evalInPage(ws, `(() => {
    const d = document.querySelector('[role="dialog"]');
    const fields = Array.from(d?.querySelectorAll('input[type="number"]') || []);
    if (fields.length < 2) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(fields[0], '91'); fields[0].dispatchEvent(new Event('input', { bubbles: true })); fields[0].dispatchEvent(new Event('change', { bubbles: true }));
    const apply = Array.from(d.querySelectorAll('button')).find(b => b.textContent.includes('APPLY COORDINATES'));
    apply?.click(); return Boolean(apply);
  })()`);
  await sleep(250);
  results.observerInvalidCoordinateRejected = invalidCoordinates && await evalInPage(ws, `document.querySelector('[role="alert"]')?.innerText.includes('Coordinates out of range') || document.querySelector('[role="alert"]')?.innerText.includes('latitude from')`);
  if (!results.observerInvalidCoordinateRejected) throw new Error('Observer modal did not reject an out-of-range latitude');
  await evalInPage(ws, `Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.trim() === 'CANCEL')?.click()`);
  results.keyboardSearchShortcut = await evalInPage(ws, `(() => {
    const input = document.querySelector('input[aria-label="Search stars and constellations"]');
    if (!input) return false;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    const focused = document.activeElement === input;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    return focused;
  })()`);
  if (!results.keyboardSearchShortcut) throw new Error('Ctrl+K did not focus the sky search input');

  if (!results.skyIdleStable) throw new Error('Sky renderer changes without user input after the settling period');
  if (!results.skyDragChanged) throw new Error('Sky drag did not change the rendered chart');
  for (const k of ['mobileMetrics', 'midMetrics']) {
    if (results[k].bodyTextLength < 150 || results[k].navButtons < 8) throw new Error(`${k} failed content/navigation reachability: ${JSON.stringify(results[k])}`);
  }

  console.log('\nVerification Summary:');
  console.log(JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'run-summary.json'), JSON.stringify({ baseUrl: BASE_URL, runId: RUN_ID, results, pageErrors }, null, 2));

  ws.close();
  edgeProcess.kill();
}

main().catch(err => {
  console.error(err);
  try { fs.writeFileSync(path.join(EVIDENCE_DIR, 'run-error.json'), JSON.stringify({ baseUrl: BASE_URL, runId: RUN_ID, error: err.stack || String(err), pageErrors }, null, 2)); } catch { /* keep original error */ }
  try { browserSocket?.close(); } catch { /* ignored */ }
  try { edgeProcess?.kill(); } catch { /* ignored */ }
  process.exit(1);
});
