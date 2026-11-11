const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const EVIDENCE_DIR = path.resolve('work/evidence');

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

async function main() {
  console.log('Starting Edge headless...');
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--window-size=1586,992',
    'http://localhost:4173/',
  ], { stdio: 'ignore' });

  // Wait for remote debugging to be ready
  let targets = null;
  for (let i = 0; i < 20; i++) {
    try {
      const resp = await fetch('http://localhost:9222/json');
      targets = await resp.json();
      if (targets && targets.find(t => t.type === 'page')) break;
    } catch {
      // retry
    }
    await sleep(500);
  }

  if (!targets) {
    edge.kill();
    throw new Error('Failed to connect to Edge CDP');
  }

  const pageTarget = targets.find(t => t.type === 'page');
  console.log('Connected to target:', pageTarget.url, pageTarget.webSocketDebuggerUrl);

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  // Enable Page, Runtime, DOM
  await sendCDP(ws, 'Page.enable');
  await sendCDP(ws, 'Runtime.enable');
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
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('OVERVIEW'));
    if (btn) btn.click();
  })()`);
  await sleep(1000);
  results['frame_01_overview'] = await captureScreen(ws, 'frame_01_overview.png');

  // 2. Frame 02 & 04: Sky Explorer (inspect Orion)
  console.log('\nCapturing Frame 2 & 4: Sky Explorer...');
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('SKY EXPLORER'));
    if (btn) btn.click();
  })()`);
  await sleep(1000);
  results['frame_02_sky'] = await captureScreen(ws, 'frame_02_sky.png');

  // 3. Frame 05: Sky Tonight
  console.log('\nCapturing Frame 5: Sky Tonight...');
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('SKY TONIGHT'));
    if (btn) btn.click();
  })()`);
  await sleep(1000);
  results['frame_05_tonight'] = await captureScreen(ws, 'frame_05_tonight.png');

  // 4. Frame 06: Constellation Library
  console.log('\nCapturing Frame 6: Constellation Library...');
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('CONSTELLATIONS'));
    if (btn) btn.click();
  })()`);
  await sleep(1000);
  results['frame_06_constellations'] = await captureScreen(ws, 'frame_06_constellations.png');

  // 5. Frame 12: Orion Detail
  console.log('\nCapturing Frame 12: Orion Detail...');
  await evalInPage(ws, `(() => {
    const cards = Array.from(document.querySelectorAll('.bento-card'));
    const orionCard = cards.find(el => {
      const h3 = el.querySelector('h3');
      return h3 && h3.textContent.trim().toUpperCase() === 'ORION';
    });
    if (orionCard) orionCard.click();
  })()`);
  await sleep(1000);
  results['frame_12_orion_detail'] = await captureScreen(ws, 'frame_12_orion_detail.png');

  // 6. Frame 10: Automata Lab
  console.log('\nCapturing Frame 10: Automata Lab...');
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('AUTOMATA LAB'));
    if (btn) btn.click();
  })()`);
  await sleep(1000);
  results['frame_10_automata'] = await captureScreen(ws, 'frame_10_automata.png');

  // 7. Frame 11: Image Lab
  console.log('\nCapturing Frame 11: Image Lab...');
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent && b.textContent.includes('IMAGE LAB'));
    if (btn) btn.click();
  })()`);
  await sleep(500);
  // Also click load sample in Image Lab if present
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sampleBtn = btns.find(b => b.textContent && b.textContent.includes('SAMPLE'));
    if (sampleBtn) sampleBtn.click();
  })()`);
  await sleep(1000);
  results['frame_11_imagelab'] = await captureScreen(ws, 'frame_11_imagelab.png');

  // 8. Frame 07: Trace Mode Reticle
  console.log('\nCapturing Frame 7: Trace Mode...');
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const skyBtn = btns.find(b => b.textContent && b.textContent.includes('SKY EXPLORER'));
    if (skyBtn) skyBtn.click();
  })()`);
  await sleep(500);
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const traceBtn = btns.find(b => b.textContent && b.textContent.includes('TRACE MODE'));
    if (traceBtn) traceBtn.click();
  })()`);
  await sleep(1000);
  results['frame_07_trace'] = await captureScreen(ws, 'frame_07_trace.png');

  // 9. Frame 08: Recognition Result Modal
  console.log('\nCapturing Frame 8: Recognition Result Modal...');
  await evalInPage(ws, `(() => {
    // Select Orion or Cas from the preset dropdown
    const select = document.querySelector('select');
    if (select) {
      const opt = Array.from(select.options).find(o => o.value && o.value.includes('Ori'));
      if (opt) {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  })()`);
  await sleep(600);
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const completeBtn = btns.find(b => b.textContent && b.textContent.includes('COMPLETE TRACE'));
    if (completeBtn) completeBtn.click();
  })()`);
  await sleep(1000);
  results['frame_08_results'] = await captureScreen(ws, 'frame_08_results.png');

  // 10. Frame 09: Pattern Analysis Modal
  console.log('\nCapturing Frame 9: Pattern Analysis Modal...');
  await evalInPage(ws, `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const geomBtn = btns.find(b => b.textContent && (b.textContent.includes('GEOMETRY') || b.textContent.includes('PATTERN ANALYSIS') || b.textContent.includes('PATTERNS')));
    if (geomBtn) geomBtn.click();
  })()`);
  await sleep(1000);
  results['frame_09_patterns'] = await captureScreen(ws, 'frame_09_patterns.png');

  console.log('\nVerification Summary of All 10 Unique Target Frames:');
  console.log(JSON.stringify(results, null, 2));

  ws.close();
  edge.kill();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
