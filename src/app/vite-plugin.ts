import fs from 'node:fs/promises'
import path from 'node:path'
import type { Plugin, PreviewServer, ResolvedConfig, ViteDevServer } from 'vite'
import { createServer, isRunnableDevEnvironment } from 'vite'

type VaniSpaPluginOptions = {
  entryClientFile?: string
  entryServerFile?: string
}

async function renderWithEntryServer(server: ViteDevServer, url: string, entryServerId: string) {
  const environment = server.environments.ssr ?? server.environments.server
  if (!environment || !isRunnableDevEnvironment(environment)) {
    throw new Error('[vani] SSR environment runner not available')
  }

  const mod = await environment.runner.import(entryServerId)
  const handler = mod?.default?.fetch
  if (typeof handler !== 'function') {
    throw new Error('[vani] entry-server default export must expose fetch()')
  }

  const response = await handler()
  const html = await response.text()
  return server.transformIndexHtml(url, html)
}

async function renderStaticHtml(
  config: ResolvedConfig,
  manifestEntryKey: string,
  entryServerId: string,
) {
  const root = config.root ?? process.cwd()
  const distClient = path.resolve(root, config.build.outDir)
  const manifestPath = path.resolve(distClient, '.vite/manifest.json')

  const ssrServer = await createServer({
    root,
    configFile: config.configFile,
    mode: config.mode,
    appType: 'custom',
    server: { middlewareMode: true },
  })

  const environment = ssrServer.environments.ssr ?? ssrServer.environments.server
  if (!environment || !isRunnableDevEnvironment(environment)) {
    await ssrServer.close()
    throw new Error('[vani] SSR environment runner not available for SSG')
  }

  try {
    const mod = await environment.runner.import(entryServerId)
    const handler = mod?.default?.fetch
    if (typeof handler !== 'function') {
      throw new Error('[vani] entry-server default export must expose fetch()')
    }

    const response = await handler()
    let html = await response.text()

    const manifestRaw = await fs.readFile(manifestPath, 'utf-8')
    const manifest = JSON.parse(manifestRaw) as Record<
      string,
      { file: string; css?: string[]; imports?: string[] }
    >
    const entry = manifest[manifestEntryKey]
    if (!entry) {
      throw new Error(`[vani] manifest entry missing for ${manifestEntryKey}`)
    }

    const base = config.base ?? '/'
    const withBase = (file: string) => {
      const normalizedBase = base.endsWith('/') ? base : `${base}/`
      return `${normalizedBase}${file.replace(/^\//, '')}`
    }

    const preloadTags = (entry.imports ?? [])
      .map((importKey) => manifest[importKey]?.file)
      .filter((file): file is string => Boolean(file))
      .map((file) => `<link rel='modulepreload' href='${withBase(file)}'>`)
    const cssTags = (entry.css ?? []).map(
      (file) => `<link rel='stylesheet' href='${withBase(file)}'>`,
    )
    const scriptTag = `<script type='module' src='${withBase(entry.file)}'></script>`

    html = html.replace("<link rel='stylesheet' href='{{VANI_STYLES_URL}}'>", cssTags.join('\n'))
    html = html.replace(
      "<script type='module' src='{{VANI_ENTRY_CLIENT_JS_URL}}'></script>",
      [...preloadTags, scriptTag].join('\n'),
    )
    await fs.mkdir(distClient, { recursive: true })
    await fs.writeFile(path.resolve(distClient, 'index.html'), html, 'utf-8')
  } finally {
    await ssrServer.close()
  }
}

async function servePreviewHtml(server: PreviewServer, resolvedConfig: ResolvedConfig) {
  const root = resolvedConfig.root ?? process.cwd()
  const distClient = path.resolve(root, resolvedConfig.build.outDir)
  const html = await fs.readFile(path.resolve(distClient, 'index.html'), 'utf-8')

  server.middlewares.use((req, res, next) => {
    const url = req.originalUrl ?? '/'
    const accept = req.headers.accept ?? ''
    if (req.method && !['GET', 'HEAD'].includes(req.method)) {
      return next()
    }
    if (!accept.includes('text/html')) {
      return next()
    }
    const pathname = new URL(url, 'http://localhost').pathname
    if (pathname.startsWith('/assets') || pathname.startsWith('/@')) {
      return next()
    }
    if (pathname.includes('.') && !pathname.endsWith('/')) {
      return next()
    }
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    res.end(html)
  })
}

export function vaniSpaPlugin(options: VaniSpaPluginOptions = {}): Plugin {
  let resolvedConfig: ResolvedConfig
  let hasRendered = false
  const entryClientFile = options.entryClientFile ?? 'src/app/entry-client.ts'
  const entryServerFile = options.entryServerFile ?? 'src/app/entry-server.ts'
  let entryServerId = '/src/app/entry-server.ts'
  let manifestEntryKey = 'src/app/entry-client.ts'

  const toPosixPath = (filePath: string) => filePath.replace(/\\/g, '/')

  return {
    name: 'vani-app',
    config(config) {
      const root = config.root ?? process.cwd()
      const entryClientAbs = path.resolve(root, entryClientFile)
      return {
        appType: 'custom',
        build: {
          outDir: 'dist/client',
          manifest: true,
          rollupOptions: {
            input: entryClientAbs,
          },
        },
      }
    },
    configResolved(config) {
      resolvedConfig = config
      const root = config.root ?? process.cwd()
      const entryClientAbs = path.resolve(root, entryClientFile)
      const entryServerAbs = path.resolve(root, entryServerFile)
      manifestEntryKey = toPosixPath(path.relative(root, entryClientAbs))
      entryServerId = `/${toPosixPath(path.relative(root, entryServerAbs))}`
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.originalUrl ?? '/'
        const accept = req.headers.accept ?? ''
        if (!accept.includes('text/html')) {
          return next()
        }
        if (url.startsWith('/@') || url.includes('/__vite') || url.includes('/@fs/')) {
          return next()
        }
        try {
          const html = await renderWithEntryServer(server, url, entryServerId)
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html')
          res.end(html)
        } catch (error) {
          server.ssrFixStacktrace(error as Error)
          next(error)
        }
      })
    },
    configurePreviewServer(server) {
      if (!resolvedConfig) return
      servePreviewHtml(server, resolvedConfig)
    },
    async closeBundle() {
      if (hasRendered) return
      if (resolvedConfig.command !== 'build') return
      if (resolvedConfig.env.MODE !== 'production') return

      hasRendered = true
      await renderStaticHtml(resolvedConfig, manifestEntryKey, entryServerId)
    },
  }
}
