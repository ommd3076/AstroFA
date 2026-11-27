import { spawn } from 'node:child_process'
import { createReadStream, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'
const MAX_BODY = 32 * 1024
const MAX_WORKER_OUTPUT = 1024 * 1024
const WORKER_TIMEOUT_MS = 5000
const CONDITIONS_CACHE_TTL_MS = 10 * 60_000
const CACHE_LIMIT = 256
const cache = new Map()
let conditionsQueue = Promise.resolve()
let recognitionQueue = Promise.resolve()
let recognitionOutstanding = 0
let conditionsOutstanding = 0
const MAX_RECOGNITION_OUTSTANDING = 8
const MAX_CONDITIONS_OUTSTANDING = 8
const MAX_UPSTREAM_BYTES = 1024 * 1024

function json(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  res.end(body)
}

async function readJson(req) {
  const chunks = []
  let length = 0
  for await (const chunk of req) {
    length += chunk.length
    if (length > MAX_BODY) throw Object.assign(new Error('Request body is too large'), { status: 413 })
    chunks.push(chunk)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw Object.assign(new Error('Request body must be valid JSON'), { status: 400 }) }
}

function validatePoints(value) {
  if (!value || !Array.isArray(value.points) || value.points.length < 3 || value.points.length > 128) return false
  return value.points.every(point => point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && Math.abs(point.x) <= 1e6 && Math.abs(point.y) <= 1e6)
}

export function resolveRecognizerLaunch({ platform = process.platform, root = ROOT, exists = existsSync, nodePath = process.execPath } = {}) {
  const buildDir = path.join(root, 'native', '.build')
  if (platform === 'win32') {
    const wasm = path.join(buildDir, 'recognizer.wasm')
    const runner = path.join(root, 'native', 'runner.mjs')
    if (!exists(wasm) || !exists(runner)) throw new Error('WASI recognizer or runner is not built; run npm run build')
    return { command: nodePath, args: [runner], backend: 'wasi', artifact: wasm }
  }
  const executable = path.join(buildDir, 'recognizer')
  if (!exists(executable)) throw new Error('Native recognition worker is not built; run npm run build')
  return { command: executable, args: [], backend: 'native', artifact: executable }
}

function validCandidate(value) {
  return value && typeof value === 'object'
    && typeof value.patternId === 'string' && typeof value.constellationId === 'string' && typeof value.patternName === 'string'
    && Number.isFinite(value.residual) && value.residual >= 0 && typeof value.isVerified === 'boolean'
    && Number.isFinite(value.rotationDeg) && Number.isFinite(value.scale) && value.scale > 0
}

function runRecognizerNow(points) {
  return new Promise((resolve, reject) => {
    let launch
    try { launch = resolveRecognizerLaunch() }
    catch (error) { return reject(error) }
    const child = spawn(launch.command, launch.args, { cwd: ROOT, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] })
    let stdout = ''
    let settled = false
    const finish = (error, result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (error) reject(error)
      else resolve(result)
    }
    const timer = setTimeout(() => { child.kill(); finish(new Error('Recognition worker timed out')) }, WORKER_TIMEOUT_MS)
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', chunk => {
      stdout += chunk
      if (Buffer.byteLength(stdout) > MAX_WORKER_OUTPUT) { child.kill(); finish(new Error('Recognition worker output exceeded limit')) }
    })
    child.on('error', error => finish(error))
    child.on('close', code => {
      if (code !== 0) return finish(new Error(`Recognition worker exited with code ${code}`))
      try {
        const data = JSON.parse(stdout)
        if (!data || !['FULL_MATCH', 'AMBIGUOUS', 'NO_MATCH'].includes(data.status)
          || !Array.isArray(data.candidates) || data.candidates.length > 128 || !data.candidates.every(validCandidate)
          || !(data.bestMatch === null || validCandidate(data.bestMatch))) {
          throw new Error('Invalid recognition worker response')
        }
        finish(null, data)
      } catch (error) { finish(error) }
    })
    child.stdin.on('error', () => {})
    child.stdin.end(`${points.length}\n${points.map(({ x, y }) => `${x} ${y}`).join('\n')}\n`)
  })
}

function runRecognizer(points) {
  if (recognitionOutstanding >= MAX_RECOGNITION_OUTSTANDING) return Promise.reject(Object.assign(new Error('Recognition queue is full'), { status: 503 }))
  recognitionOutstanding += 1
  const task = recognitionQueue.then(() => runRecognizerNow(points))
  recognitionQueue = task.catch(() => {})
  return task.finally(() => { recognitionOutstanding -= 1 })
}

function validCalendarDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1700 || year > 2100) return false
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function isNumberOrNull(value) { return value === null || Number.isFinite(value) }

async function readBoundedJson(response) {
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_UPSTREAM_BYTES) throw new Error('Upstream response is too large')
  if (!response.body) throw new Error('Upstream response body is missing')
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_UPSTREAM_BYTES) {
      await reader.cancel()
      throw new Error('Upstream response is too large')
    }
    chunks.push(Buffer.from(value))
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function requestObservingConditions(date, latitude, longitude) {
  const key = `openmeteo:${date}:${latitude.toFixed(2)}:${longitude.toFixed(2)}`
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) return Promise.resolve(cached.data)
  if (conditionsOutstanding >= MAX_CONDITIONS_OUTSTANDING) return Promise.reject(Object.assign(new Error('Observing conditions queue is full'), { status: 503 }))
  conditionsOutstanding += 1
  const params = new URLSearchParams({
    latitude: latitude.toFixed(2), longitude: longitude.toFixed(2), timezone: 'UTC', timeformat: 'iso8601',
    start_date: date, end_date: date,
    daily: 'sunrise,sunset,daylight_duration,sunshine_duration,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,cloud_cover_mean',
    hourly: 'temperature_2m,cloud_cover,precipitation_probability,precipitation,wind_speed_10m,uv_index',
  })
  const url = `${OPEN_METEO_URL}?${params}`
  const task = conditionsQueue.then(async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'Costellar/1.0 (observing-conditions)' } })
      if (!response.ok) throw new Error(`Open-Meteo returned HTTP ${response.status}`)
      const payload = await readBoundedJson(response)
      const utcZone = (payload.timezone === 'UTC' && (payload.utc_offset_seconds === undefined || payload.utc_offset_seconds === 0))
        || (payload.timezone === 'GMT' && payload.utc_offset_seconds === 0)
      if (payload.error || !payload.daily || !payload.hourly || !utcZone) throw new Error(payload.reason || 'Invalid Open-Meteo response')
      const dayIndex = payload.daily.time?.indexOf(date)
      if (!Number.isInteger(dayIndex) || dayIndex < 0) throw new Error('Open-Meteo response did not contain the requested day')
      const d = payload.daily
      const h = payload.hourly
      const dailyValue = name => {
        const value = d[name]?.[dayIndex]
        if (!isNumberOrNull(value) && typeof value !== 'string') throw new Error(`Invalid Open-Meteo daily field ${name}`)
        return value
      }
      const hourlyNames = ['time', 'temperature_2m', 'cloud_cover', 'precipitation_probability', 'precipitation', 'wind_speed_10m', 'uv_index']
      if (!hourlyNames.every(name => Array.isArray(h[name])) || h.time.length !== 24
        || hourlyNames.slice(1).some(name => h[name].length !== h.time.length)) throw new Error('Invalid Open-Meteo hourly arrays')
      const hours = h.time.map((time, i) => {
        if (typeof time !== 'string' || !time.startsWith(`${date}T`)) throw new Error('Open-Meteo returned a mismatched hourly timestamp')
        const numeric = name => {
          const value = h[name][i]
          if (!isNumberOrNull(value)) throw new Error(`Invalid Open-Meteo hourly field ${name}`)
          return value
        }
        return {
          time,
          temperatureC: numeric('temperature_2m'),
          cloudCoverPercent: numeric('cloud_cover'),
          precipitationProbabilityPercent: numeric('precipitation_probability'),
          precipitationMm: numeric('precipitation'),
          windSpeedKmh: numeric('wind_speed_10m'),
          uvIndex: numeric('uv_index'),
        }
      })
      const data = {
        date,
        coordinates: { latitude, longitude },
        modelGrid: { latitude: payload.latitude, longitude: payload.longitude },
        timeZone: 'UTC',
        timeScale: 'UTC',
        solar: {
          sunrise: dailyValue('sunrise'), sunset: dailyValue('sunset'),
          sunshineDurationSeconds: dailyValue('sunshine_duration'), daylightDurationSeconds: dailyValue('daylight_duration'),
        },
        conditions: {
          temperatureMaxC: dailyValue('temperature_2m_max'), temperatureMinC: dailyValue('temperature_2m_min'),
          cloudCoverMeanPercent: dailyValue('cloud_cover_mean'), precipitationMm: dailyValue('precipitation_sum'),
          precipitationProbabilityMaxPercent: dailyValue('precipitation_probability_max'),
          windSpeedMaxKmh: dailyValue('wind_speed_10m_max'), uvIndexMax: dailyValue('uv_index_max'),
        },
        hours,
        source: 'Open-Meteo',
        sourceUrl: url,
        attribution: 'Weather data by Open-Meteo.com',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      }
      cache.set(key, { data, expires: Date.now() + CONDITIONS_CACHE_TTL_MS })
      while (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value)
      return data
    } finally { clearTimeout(timeout) }
  })
  conditionsQueue = task.catch(() => {})
  return task.finally(() => { conditionsOutstanding -= 1 })
}

function validConditionsDate(value) {
  if (!validCalendarDate(value)) return false
  const today = new Date()
  const nowDay = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const target = Date.parse(`${value}T00:00:00Z`)
  const diff = (target - nowDay) / 86_400_000
  return diff >= -92 && diff <= 16
}

export async function handleApi(req, res) {
  const fetchSite = req.headers?.['sec-fetch-site']
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') return json(res, 403, { error: 'Cross-origin requests are not allowed' })
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/api/recognize') {
    if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
    try {
      const body = await readJson(req)
      if (!validatePoints(body)) return json(res, 422, { error: 'points must contain 3 to 128 finite x/y points within ±1,000,000' })
      const result = await runRecognizer(body.points)
      return json(res, 200, result)
    } catch (error) {
      const status = error.status || 503
      return json(res, status, { error: status === 400 || status === 413 ? error.message : 'Recognition service unavailable' })
    }
  }
  if (url.pathname === '/api/observing-conditions') {
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })
    const date = url.searchParams.get('date') || ''
    const latParam = url.searchParams.get('lat')
    const lonParam = url.searchParams.get('lon')
    const latValue = latParam === null || latParam.trim() === '' ? NaN : Number(latParam)
    const lonValue = lonParam === null || lonParam.trim() === '' ? NaN : Number(lonParam)
    if (!validConditionsDate(date)) return json(res, 400, { error: 'date must be a valid YYYY-MM-DD date from 92 days ago through 16 days ahead' })
    if (!Number.isFinite(latValue) || !Number.isFinite(lonValue) || latValue < -90 || latValue > 90 || lonValue < -180 || lonValue > 180) {
      return json(res, 400, { error: 'lat and lon must be valid decimal degrees within geographic bounds' })
    }
    const latitude = Math.round(latValue * 100) / 100
    const longitude = Math.round(lonValue * 100) / 100
    try { return json(res, 200, await requestObservingConditions(date, latitude, longitude)) }
    catch { return json(res, 503, { error: 'Open-Meteo is unavailable or returned an unsupported response' }) }
  }
  return json(res, 404, { error: 'Not found' })
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json; charset=utf-8' }

export function createProductionServer() {
  const dist = path.join(ROOT, 'dist')
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost')
    if (url.pathname.startsWith('/api/')) return handleApi(req, res)
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed' })
    let relative
    try { relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') }
    catch { return json(res, 400, { error: 'Invalid path' }) }
    let target = path.resolve(dist, relative || 'index.html')
    if (!target.startsWith(`${dist}${path.sep}`) && target !== path.join(dist, 'index.html')) return json(res, 400, { error: 'Invalid path' })
    if (!existsSync(target)) {
      const looksLikeAsset = path.extname(target) !== '' || url.pathname.startsWith('/assets/')
      if (looksLikeAsset) return json(res, 404, { error: 'Not found' })
      target = path.join(dist, 'index.html')
    }
    if (!target.startsWith(dist)) return json(res, 404, { error: 'Not found' })
    const ext = path.extname(target).toLowerCase()
    res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'x-content-type-options': 'nosniff' })
    if (req.method === 'HEAD') return res.end()
    createReadStream(target).pipe(res)
  })
}

export function viteApiPlugin() {
  return {
    name: 'costellar-api',
    configureServer(server) { server.middlewares.use((req, res, next) => { if (req.url?.startsWith('/api/')) void handleApi(req, res); else next() }) },
  }
}
