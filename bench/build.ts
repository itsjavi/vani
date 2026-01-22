import { Glob } from 'bun'
import { rm } from 'node:fs/promises'
import path from 'node:path'

type BuildOptions = {
  basePath: string
  outDir: string
  clean: boolean
}

const DEFAULT_ENTRY_GLOBS = [
  'index.html',
  'frameworks/*/index.html',
  'debug/*/index.html',
  'snapshot/index.html',
]

function inferGithubPagesBasePath(): string | undefined {
  const repo = process.env.GITHUB_REPOSITORY
  if (!repo) {
    return undefined
  }

  const repoName = repo.split('/')[1]
  if (!repoName) {
    return undefined
  }

  return `/${repoName}/`
}

function parseArgs(args: string[]): BuildOptions {
  const envBasePath =
    process.env.BENCH_BASE_PATH ?? process.env.PUBLIC_PATH ?? process.env.BASE_PATH ?? ''
  let basePath = envBasePath === '' ? './' : envBasePath
  let outDir = 'dist'
  let clean = true

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--base') {
      basePath = args[index + 1] ?? basePath
      index += 1
      continue
    }

    if (arg.startsWith('--base=')) {
      basePath = arg.slice('--base='.length)
      continue
    }

    if (arg === '--outdir') {
      outDir = args[index + 1] ?? outDir
      index += 1
      continue
    }

    if (arg.startsWith('--outdir=')) {
      outDir = arg.slice('--outdir='.length)
      continue
    }

    if (arg === '--no-clean') {
      clean = false
    }
  }

  return {
    basePath:
      basePath === './' && envBasePath === '' ? (inferGithubPagesBasePath() ?? basePath) : basePath,
    outDir,
    clean,
  }
}

function normalizeBasePath(basePath: string): string {
  const trimmed = basePath.trim()
  if (trimmed === '' || trimmed === '.') {
    return './'
  }

  if (trimmed.startsWith('.')) {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
  }

  if (trimmed.startsWith('{dir}')) {
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`
}

function toUrlDir(entryDir: string): string {
  return entryDir.split(path.sep).join('/')
}

function buildPublicPath(basePath: string, entryDir: string): string {
  const normalizedBase = normalizeBasePath(basePath)
  if (normalizedBase.startsWith('.')) {
    return './'
  }

  const normalizedEntryDir = toUrlDir(entryDir)
  const normalizedDir = normalizedEntryDir === '.' ? '' : `${normalizedEntryDir}/`
  if (normalizedBase.includes('{dir}')) {
    const trimmedDir = normalizedDir.replace(/\/$/, '')
    const replaced = normalizedBase.replace('{dir}', trimmedDir).replace(/\/{2,}/g, '/')
    if (trimmedDir === '' && normalizedBase.startsWith('{dir}')) {
      return './'
    }

    return replaced
  }

  return `${normalizedBase}${normalizedDir}`
}

async function collectEntries(cwd: string): Promise<string[]> {
  const entries: string[] = []

  for (const pattern of DEFAULT_ENTRY_GLOBS) {
    const glob = new Glob(pattern)
    for await (const file of glob.scan({ cwd })) {
      if (file.endsWith('index.html')) {
        entries.push(file)
      }
    }
  }

  return entries.sort((left, right) => left.localeCompare(right))
}

function buildEntryOutDir(baseOutDir: string, entryDir: string): string {
  return entryDir === '.' ? baseOutDir : path.join(baseOutDir, entryDir)
}

async function runBuildForEntry(cwd: string, entry: string, options: BuildOptions): Promise<void> {
  const entryDir = path.dirname(entry)
  const publicPath = buildPublicPath(options.basePath, entryDir)
  const entryOutDir = buildEntryOutDir(options.outDir, entryDir)
  const command = [
    'bun',
    'build',
    entry,
    '--outdir',
    entryOutDir,
    '--entry-naming',
    '[name].[ext]',
    '--asset-naming',
    '[name]-[hash].[ext]',
    '--chunk-naming',
    '[name]-[hash].[ext]',
    '--public-path',
    publicPath,
  ]

  const subprocess = Bun.spawn({
    cmd: command,
    cwd,
    stderr: 'inherit',
    stdout: 'inherit',
  })

  const exitCode = await subprocess.exited
  if (exitCode !== 0) {
    process.exit(exitCode)
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  const cwd = import.meta.dir

  if (options.clean) {
    await rm(path.join(cwd, options.outDir), { force: true, recursive: true })
  }

  const entries = await collectEntries(cwd)
  if (entries.length === 0) {
    console.warn('No entry HTML files found.')
    return
  }

  for (const entry of entries) {
    await runBuildForEntry(cwd, entry, options)
  }
}

await main()
