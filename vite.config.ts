import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Match api/yahoo.js — DevTools mobile emulation sends a phone UA; Yahoo often 429s those. */
const YAHOO_UPSTREAM_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function yahooProxy(): ProxyOptions {
  return {
    target: 'https://query1.finance.yahoo.com',
    changeOrigin: true,
    rewrite: (reqPath: string) => reqPath.replace(/^\/api\/yahoo/, ''),
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.setHeader('User-Agent', YAHOO_UPSTREAM_UA)
        proxyReq.setHeader('Accept', 'application/json,text/plain,*/*')
        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9')
      })
    },
  }
}

function watchlistCsvProxy(mode: string) {
  const env = loadEnv(mode, process.cwd(), '')
  const raw = env.VITE_WATCHLIST_CSV_URL?.trim()
  if (!raw || !raw.startsWith('http')) return undefined
  try {
    const u = new URL(raw)
    return {
      '/api/watchlist-csv': {
        target: `${u.protocol}//${u.host}`,
        changeOrigin: true,
        rewrite: (reqPath: string) => {
          const dest = new URL(raw)
          const q = reqPath.includes('?')
            ? reqPath.slice(reqPath.indexOf('?') + 1)
            : ''
          for (const [k, v] of new URLSearchParams(q)) {
            dest.searchParams.set(k, v)
          }
          return `${dest.pathname}${dest.search}`
        },
      },
    }
  } catch {
    return undefined
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const sheetProxy = watchlistCsvProxy(mode)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api/yahoo': yahooProxy(),
        ...(sheetProxy ?? {}),
      },
    },
    preview: {
      proxy: {
        '/api/yahoo': yahooProxy(),
        ...(sheetProxy ?? {}),
      },
    },
  }
})
