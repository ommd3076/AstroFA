import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { handleApi, resolveRecognizerLaunch } from './api.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const invoke = async (url, { method = 'GET', body, headers = {} } = {}) => {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(body)])
  req.url = url
  req.method = method
  req.headers = headers
  const res = {
    writeHead(status, headers) { this.status = status; this.headers = headers },
    end(value = '') { this.body = value.toString() },
  }
  await handleApi(req, res)
  return { status: res.status, headers: res.headers, data: JSON.parse(res.body) }
}

test('observing conditions rejects invalid dates and coordinates before upstream calls', async () => {
  for (const query of [
    'date=2026-02-30&lat=12&lon=77',
    'date=2026-11-26&lat=91&lon=77',
    'date=2026-11-26&lat=12',
  ]) {
    const response = await invoke(`/api/observing-conditions?${query}`)
    assert.equal(response.status, 400)
    assert.equal(typeof response.data.error, 'string')
  }
})

test('same-origin guard rejects browser cross-site and same-site requests', async () => {
  for (const site of ['cross-site', 'same-site']) {
    const response = await invoke('/api/observing-conditions?date=2026-11-26&lat=51.48&lon=0', { headers: { 'sec-fetch-site': site } })
    assert.equal(response.status, 403)
  }
})

test('observing conditions validates and maps the Open-Meteo daily/hourly response and caches rounded coordinates', async () => {
  const originalFetch = globalThis.fetch
  let calls = 0
  let requested
  const times = Array.from({ length: 24 }, (_, hour) => `2026-11-26T${String(hour).padStart(2, '0')}:00`)
  globalThis.fetch = async (url, options) => {
    calls += 1
    requested = { url: String(url), userAgent: options.headers['user-agent'] }
    return new Response(JSON.stringify({
      latitude: 12.95, longitude: 77.6, timezone: 'GMT', utc_offset_seconds: 0,
      daily: {
        time: ['2026-11-26'], sunrise: ['2026-11-26T00:30'], sunset: ['2026-11-26T12:15'],
        daylight_duration: [42300], sunshine_duration: [39000], temperature_2m_max: [28.2], temperature_2m_min: [18.1],
        precipitation_sum: [0.2], precipitation_probability_max: [20], wind_speed_10m_max: [12.2], uv_index_max: [8.1], cloud_cover_mean: [32],
      },
      hourly: {
        time: times, temperature_2m: times.map((_, i) => 18 + i * 0.2), cloud_cover: times.map(() => 30),
        precipitation_probability: times.map(() => 5), precipitation: times.map(() => 0), wind_speed_10m: times.map(() => 5), uv_index: times.map(() => 0),
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  try {
    const first = await invoke('/api/observing-conditions?date=2026-11-26&lat=12.9716&lon=77.5946')
    assert.equal(first.status, 200)
    const data = first.data
    assert.equal(data.coordinates.latitude, 12.97)
    assert.equal(data.coordinates.longitude, 77.59)
    assert.equal(data.timeZone, 'UTC')
    assert.equal(data.solar.sunrise, '2026-11-26T00:30')
    assert.equal(data.conditions.temperatureMaxC, 28.2)
    assert.equal(data.hours.length, 24)
    assert.equal(data.hours[0].time, '2026-11-26T00:00')
    assert.equal(data.hours[0].cloudCoverPercent, 30)
    assert.equal(data.attribution, 'Weather data by Open-Meteo.com')
    assert.match(data.sourceUrl, /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/)
    assert.match(requested.url, /latitude=12\.97/)
    assert.match(requested.url, /longitude=77\.59/)
    assert.match(requested.userAgent, /Costellar AstroFA/)
    const second = await invoke('/api/observing-conditions?date=2026-11-26&lat=12.971&lon=77.594')
    assert.equal(second.status, 200)
    assert.equal(calls, 1)
  } finally { globalThis.fetch = originalFetch }
})

test('recognition validates bounded input before starting a worker', async () => {
  const response = await invoke('/api/recognize', {
    method: 'POST', body: JSON.stringify({ points: [{ x: 0, y: 0 }, { x: Infinity, y: 1 }, { x: 2, y: 3 }] }),
  })
  assert.equal(response.status, 422)
  assert.match(response.data.error, /points/)
})

test('recognition endpoint invokes the selected worker and validates its JSON result', async () => {
  const patterns = JSON.parse(await readFile(path.join(root, 'src', 'data', 'referencePatterns.json'), 'utf8'))
  const pattern = patterns.find(entry => entry.constellationId === 'Cas' && entry.traversalVariant === 'forward')
  assert.ok(pattern)
  const response = await invoke('/api/recognize', { method: 'POST', body: JSON.stringify({ points: pattern.referencePoints }) })
  assert.equal(response.status, 200)
  assert.ok(['FULL_MATCH', 'AMBIGUOUS'].includes(response.data.status))
  assert.ok(response.data.candidates.some(candidate => candidate.patternId === pattern.id))
})

test('Windows selects the project WASI runner and never falls back to a native executable', () => {
  const root = 'C:\\astrofa'
  const exists = value => value.endsWith('recognizer.wasm') || value.endsWith('runner.mjs') || value.endsWith('recognizer.exe')
  const launch = resolveRecognizerLaunch({ platform: 'win32', root, exists, nodePath: 'C:\\node\\node.exe' })
  assert.equal(launch.backend, 'wasi')
  assert.equal(launch.command, 'C:\\node\\node.exe')
  assert.deepEqual(launch.args, ['C:\\astrofa\\native\\runner.mjs'])
  assert.equal(launch.artifact, 'C:\\astrofa\\native\\.build\\recognizer.wasm')
  assert.throws(() => resolveRecognizerLaunch({
    platform: 'win32', root, exists: value => value.endsWith('runner.mjs') || value.endsWith('recognizer.exe'),
  }), /WASI recognizer or runner is not built/)
})

test('non-Windows keeps the native worker mode', () => {
  const root = path.resolve('astrofa-test-root')
  const executable = path.join(root, 'native', '.build', 'recognizer')
  const launch = resolveRecognizerLaunch({ platform: 'linux', root, exists: value => value === executable })
  assert.equal(launch.backend, 'native')
  assert.equal(launch.command, executable)
  assert.deepEqual(launch.args, [])
})
