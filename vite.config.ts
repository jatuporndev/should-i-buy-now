import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
        rewrite: (path) => {
          const dest = new URL(raw)
          const q = path.includes('?') ? path.slice(path.indexOf('?') + 1) : ''
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
        '/api/yahoo': {
          target: 'https://query1.finance.yahoo.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
        },
        ...(sheetProxy ?? {}),
      },
    },
    preview: {
      proxy: {
        '/api/yahoo': {
          target: 'https://query1.finance.yahoo.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
        },
        ...(sheetProxy ?? {}),
      },
    },
  }
})
