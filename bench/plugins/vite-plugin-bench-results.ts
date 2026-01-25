import fs from 'node:fs'
import path from 'node:path'
import type { Connect } from 'vite'
import type { Plugin } from 'vite'

const RESULTS_DIR = path.resolve(import.meta.dirname, '..', 'results')

function getContentType(filePath: string): string {
  if (filePath.endsWith('.json')) return 'application/json'
  if (filePath.endsWith('.txt')) return 'text/plain'
  return 'application/octet-stream'
}

function createResultsMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (!req.url) return next()
    const url = req.url.split('?')[0] || ''
    const dataPrefix = url.startsWith('/benchmarks/data/')
      ? '/benchmarks/data/'
      : url.startsWith('/data/')
        ? '/data/'
        : null

    if (!dataPrefix) return next()

    const relativePath = url.slice(dataPrefix.length)
    if (!relativePath) return next()

    const filePath = path.join(RESULTS_DIR, relativePath)
    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.statusCode = 404
      res.end('Not found')
      return
    }

    res.setHeader('Content-Type', getContentType(filePath))
    fs.createReadStream(filePath).pipe(res)
  }
}

export default function vitePluginBenchResults(): Plugin {
  return {
    name: 'vite-plugin-bench-results',
    configureServer(server) {
      server.middlewares.use(createResultsMiddleware())
    },
    configurePreviewServer(server) {
      server.middlewares.use(createResultsMiddleware())
    },
  }
}
