/**
 * Proxies Yahoo Finance requests on Vercel.
 * Rewrites map /api/yahoo/<path>?<query> -> /api/yahoo?path=<path>&...
 * Retries on 429/503 — shared serverless IPs often hit Yahoo rate limits.
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchYahooWithRetry(upstream) {
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
  }

  const maxAttempts = 5
  let lastRes = null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    lastRes = await fetch(upstream, { headers })
    if (lastRes.ok) return lastRes
    if (lastRes.status !== 429 && lastRes.status !== 503) return lastRes

    if (attempt < maxAttempts - 1) {
      const ra = lastRes.headers.get('Retry-After')
      let delayMs = 800 * Math.pow(2, attempt)
      if (ra) {
        const sec = parseInt(ra, 10)
        if (!Number.isNaN(sec) && sec > 0) delayMs = Math.max(delayMs, sec * 1000)
      }
      delayMs = Math.min(delayMs, 12_000)
      await sleep(delayMs)
    }
  }

  return lastRes
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.statusCode = 405
    res.end('Method Not Allowed')
    return
  }

  const rawPath = req.query.path
  const parts = Array.isArray(rawPath)
    ? rawPath.join('/')
    : typeof rawPath === 'string'
      ? rawPath
      : ''

  if (!parts) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Missing Yahoo path' }))
    return
  }

  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path' || v === undefined) continue
    const vals = Array.isArray(v) ? v : [v]
    for (const item of vals) {
      if (typeof item === 'string') params.append(k, item)
    }
  }
  const qs = params.toString()
  const search = qs ? `?${qs}` : ''

  const upstream = `https://query1.finance.yahoo.com/${parts}${search}`
  const yahooRes = await fetchYahooWithRetry(upstream)

  const body = await yahooRes.text()
  const ct = yahooRes.headers.get('content-type')
  res.statusCode = yahooRes.status
  if (ct) res.setHeader('Content-Type', ct)
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
  res.end(body)
}
