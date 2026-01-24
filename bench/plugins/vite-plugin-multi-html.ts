import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, UserConfig } from 'vite'

function normalizeUrl(url: string): string {
  return url.split('?')[0].split('#')[0]
}

type VitePluginMultiHtmlOptions = {
  /**
   * A mapping between the base URL and the directory containing the pages.
   * Example:
   *
   * ```
   * {
   *   '/': 'src/pages/',
   *   '/frameworks': 'frameworks/',
   * }
   * ```
   */
  pageDirs: Record<string, string>
}

type PageDirMapping = {
  basePath: string
  dirPrefix: string
  outputPrefix: string
  devPrefix: string
}

/**
 * Adds support for multiple HTML files in the same project,
 * building a static page routing system.
 *
 * Each directory acts as a page, and the index.html file is the entry point for that page.
 *
 * For example, the following directory structure:
 *
 * ```
 * src/pages/
 *   index/
 *     index.html
 *   about/
 *     index.html
 *     index.ts
 * ```
 *
 * Will be built to:
 *
 * ```
 * dist/
 *   index/
 *     index.html
 *   about/
 *     index.html
 *   about.js
 * ```
 */
function normalizeBasePath(basePath: string): string {
  const normalized = basePath.startsWith('/') ? basePath : `/${basePath}`
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1)
  }
  return normalized
}

function normalizeDirPrefix(dirPrefix: string): string {
  const normalized = dirPrefix.replace(/\\/g, '/').replace(/^\.?\//, '')
  return normalized.endsWith('/') ? normalized : `${normalized}/`
}

function buildMappings(pageDirs: Record<string, string>): PageDirMapping[] {
  return Object.entries(pageDirs).map(([basePath, dirPrefix]) => {
    const normalizedBase = normalizeBasePath(basePath)
    const normalizedDir = normalizeDirPrefix(dirPrefix)
    return {
      basePath: normalizedBase,
      dirPrefix: normalizedDir,
      outputPrefix: normalizedBase === '/' ? '' : `${normalizedBase.slice(1)}/`,
      devPrefix: `/${normalizedDir}`,
    }
  })
}

function getPagesRecursive(baseDir: string, segmentPath = ''): string[] {
  const pages: string[] = []
  if (!fs.existsSync(baseDir)) {
    return pages
  }
  const basePath = segmentPath.trim()
  const dirEntries = fs.readdirSync(baseDir, { withFileTypes: true })
  if (basePath === '' && fs.existsSync(path.resolve(baseDir, 'index.html'))) {
    pages.push('index')
  }
  for (const entry of dirEntries) {
    if (!entry.isDirectory()) {
      continue
    }
    const entryPath = path.resolve(baseDir, entry.name)
    if (fs.existsSync(path.resolve(entryPath, 'index.html'))) {
      pages.push(`${basePath}/${entry.name}`)
    }
    pages.push(...getPagesRecursive(entryPath, `${basePath}/${entry.name}`))
  }
  return pages.map((page) => page.replace(/\/+/g, '/').replace(/^\/+/, ''))
}

function buildEntryPoints(mappings: PageDirMapping[], rootDir: string): Record<string, string> {
  const entryPoints: Record<string, string> = {}
  for (const mapping of mappings) {
    const absoluteDir = path.resolve(rootDir, mapping.dirPrefix)
    const pages = getPagesRecursive(absoluteDir)
    for (const page of pages) {
      const entryName =
        page === 'index'
          ? mapping.basePath === '/'
            ? 'main'
            : `${mapping.outputPrefix}index`
          : `${mapping.outputPrefix}${page}`
      const entryPath = page === 'index' ? 'index.html' : `${page}/index.html`
      entryPoints[entryName] = `${mapping.dirPrefix}${entryPath}`.replace(/\/+/g, '/')
    }
  }
  return entryPoints
}

function normalizeRollupOutput(buildConfig: UserConfig['build']): NonNullable<UserConfig['build']> {
  const output =
    buildConfig?.rollupOptions?.output && !Array.isArray(buildConfig.rollupOptions.output)
      ? buildConfig.rollupOptions.output
      : undefined
  return {
    ...buildConfig,
    rollupOptions: {
      ...buildConfig?.rollupOptions,
      output: {
        ...output,
        entryFileNames: ({ name }) => `${name}.js`,
        chunkFileNames: 'assets/chunks/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  }
}

function resolveMapping(url: string, mappings: PageDirMapping[]): PageDirMapping | undefined {
  for (const mapping of mappings) {
    if (mapping.basePath === '/') {
      return mapping
    }
    if (url === mapping.basePath || url.startsWith(`${mapping.basePath}/`)) {
      return mapping
    }
  }
  return undefined
}

export default function vitePluginMultiHtml(options: VitePluginMultiHtmlOptions): Plugin[] {
  const mappings = buildMappings(options.pageDirs).sort(
    (a, b) => b.basePath.length - a.basePath.length,
  )
  const rootMapping = mappings.find((mapping) => mapping.basePath === '/')
  const entryPoints = (mappings: PageDirMapping[], config: UserConfig) =>
    buildEntryPoints(mappings, config.root ?? process.cwd())

  const configPlugin: Plugin = {
    name: 'multi-html-build-config',
    config(userConfig) {
      const buildConfig = normalizeRollupOutput(userConfig.build)
      return {
        build: {
          ...buildConfig,
          rollupOptions: {
            ...buildConfig.rollupOptions,
            input: entryPoints(mappings, userConfig),
          },
        },
      }
    },
  }

  const flattenPlugin: Plugin = {
    name: 'multi-html-flatten',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (!fileName.endsWith('.html')) {
          continue
        }
        const mapping = mappings.find(({ dirPrefix }) => fileName.startsWith(dirPrefix))
        if (!mapping) {
          continue
        }
        const nextName = `${mapping.outputPrefix}${fileName.slice(mapping.dirPrefix.length)}`
        chunk.fileName = nextName
        delete bundle[fileName]
        bundle[nextName] = chunk
      }
    },
  }

  const devServerPlugin: Plugin = {
    name: 'multi-html-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url) {
          return next()
        }
        const originalUrl = req.url
        const match = originalUrl.match(/^([^?#]*)(.*)$/)
        const url = normalizeUrl(match?.[1] ?? originalUrl)
        const querySuffix = match?.[2] ?? ''

        if (url.startsWith('/@') || url.startsWith('/__') || url.startsWith('/node_modules/')) {
          return next()
        }

        if (!url.startsWith('/src/')) {
          const mapping =
            url === '/' || url === '/index.html'
              ? (rootMapping ?? resolveMapping(url, mappings))
              : resolveMapping(url, mappings)
          if (!mapping) {
            return next()
          }

          const relativePath =
            mapping.basePath === '/'
              ? url.replace(/^\/+/, '')
              : url === mapping.basePath
                ? ''
                : url.slice(mapping.basePath.length + 1)
          const normalizedRelative = relativePath.replace(/^\/+/, '').replace(/\/+$/, '')
          const isHtmlRequest = url.endsWith('.html')
          const hasExtension = normalizedRelative !== '' && path.extname(normalizedRelative) !== ''
          const needsTrailingSlash =
            !hasExtension && !url.endsWith('/') && url !== '/' && normalizedRelative !== ''
          if (needsTrailingSlash) {
            res.statusCode = 302
            res.setHeader('Location', `${url}/${querySuffix}`)
            res.end()
            return
          }
          const pathSuffix = isHtmlRequest
            ? normalizedRelative === ''
              ? 'index.html'
              : normalizedRelative
            : hasExtension
              ? normalizedRelative
              : normalizedRelative === ''
                ? 'index.html'
                : `${normalizedRelative}/index.html`
          const target = `${mapping.devPrefix}${pathSuffix}${querySuffix}`
          if (hasExtension && mapping.basePath === '/' && normalizedRelative !== '') {
            const rootDir = server.config.root ?? process.cwd()
            const primaryPath = path.resolve(rootDir, mapping.dirPrefix, normalizedRelative)
            if (!fs.existsSync(primaryPath)) {
              const rootPath = path.resolve(rootDir, normalizedRelative)
              if (fs.existsSync(rootPath)) {
                req.url = `/${normalizedRelative}${querySuffix}`
                return next()
              }
              const srcPath = path.resolve(rootDir, 'src', normalizedRelative)
              if (fs.existsSync(srcPath)) {
                req.url = `/src/${normalizedRelative}${querySuffix}`
                return next()
              }
            }
          }

          req.url = target
          return next()
        }

        return next()
      })
    },
  }

  return [configPlugin, devServerPlugin, flattenPlugin]
}
