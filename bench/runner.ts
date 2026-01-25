import { spawn, type ChildProcess } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseArgs } from 'node:util'

import { chromium, type Browser, type CDPSession, type Page } from 'playwright'
import { getFrameworks, pkgJson } from './src/metadata'
import {
  type BenchmarkResult,
  type FunctionProfile,
  type OperationView,
  type ResourceMetrics,
  type SnapshotCalculated,
  type SnapshotFramework,
  type SnapshotFrameworkMetrics,
  type SnapshotPayload,
  type Stats,
  type SuiteCalculated,
  calcStats,
  calcConfidenceInterval,
  buildCalculatedSnapshot,
  aggregateProfiles,
  DEFAULT_VIEW,
} from './src/core'

const PORT = process.env.PORT ?? pkgJson.benchmarks.port ?? 8778
const BASE_URL = `http://localhost:${PORT}/frameworks`
const RESULTS_DIR = path.resolve(import.meta.dirname, 'results')
const BLUEPRINT_DIR = path.resolve(import.meta.dirname, 'src/core')
const LAST_ARGS_FILE = path.join(RESULTS_DIR, 'bench-last-args.json')
const SNAPSHOT_FILE = path.join(RESULTS_DIR, 'bench-results.json')
const VANI_RESULTS_FILE = path.join(RESULTS_DIR, 'bench-results-vani.json')
const BLUEPRINTS = {
  datatable: path.resolve(BLUEPRINT_DIR, 'blueprint-datatable.html'),
  pokeboxes: path.resolve(BLUEPRINT_DIR, 'blueprint-pokeboxes.html'),
}

interface SavedArgs {
  cpu: string
  runs: string
  warmups: string
  headless: boolean
  table: boolean
  profile: boolean
  'preflight-only': boolean
  'no-preflight': boolean
  browser: string
  framework: string[]
  benchmark: string[]
  view: string[]
}

// Get list of frameworks

function getFrameworkIds(): string[] {
  return getFrameworks().map((framework) => framework.id)
}

function saveArgs(args: SavedArgs): void {
  fs.mkdirSync(RESULTS_DIR, { recursive: true })
  fs.writeFileSync(LAST_ARGS_FILE, JSON.stringify(args, null, 2))
}

function loadLastArgs(): SavedArgs | null {
  try {
    if (fs.existsSync(LAST_ARGS_FILE)) {
      return JSON.parse(fs.readFileSync(LAST_ARGS_FILE, 'utf-8'))
    }
  } catch {
    // Ignore errors
  }
  return null
}

// Check for 'repeat' command
let isRepeat = process.argv[2] === 'repeat'

// Parse command line arguments
let { values: args } = parseArgs({
  options: {
    cpu: { type: 'string', default: String(pkgJson.benchmarks.cpuThrottling ?? '4') },
    runs: { type: 'string', default: String(pkgJson.benchmarks.benchmarkRuns ?? '5') },
    warmups: { type: 'string', default: String(pkgJson.benchmarks.warmupRuns ?? '2') },
    headless: { type: 'boolean', default: false },
    table: { type: 'boolean', default: false },
    profile: { type: 'boolean', default: false },
    'preflight-only': { type: 'boolean', default: false },
    'no-preflight': { type: 'boolean', default: false },
    browser: { type: 'string', default: 'chromium' },
    framework: {
      type: 'string',
      multiple: true,
      short: 'f',
      // default: ['vani', 'preact'],
    },
    benchmark: { type: 'string', multiple: true, short: 'b' },
    view: { type: 'string', multiple: true, short: 'v' },
  },
  allowPositionals: true,
})

// If repeating, load saved args
if (isRepeat) {
  let savedArgs = loadLastArgs()
  if (savedArgs) {
    args = { ...args, ...savedArgs }
    console.log('Repeating with saved options:', savedArgs)
  } else {
    console.error('No previous run found. Run a benchmark first.')
    process.exit(1)
  }
} else {
  // Save current args for repeat
  saveArgs({
    cpu: args.cpu!,
    runs: args.runs!,
    warmups: args.warmups!,
    headless: args.headless!,
    table: args.table!,
    profile: args.profile!,
    'preflight-only': args['preflight-only'] ?? false,
    'no-preflight': args['no-preflight'] ?? false,
    browser: args.browser!,
    framework: args.framework || [],
    benchmark: args.benchmark || [],
    view: args.view || [],
  })
}

let cpuThrottling = parseInt(args.cpu!, 10)
let benchmarkRuns = parseInt(args.runs!, 10)
let warmupRuns = parseInt(args.warmups!, 10)
let headless = args.headless!
let useTable = args.table!
let showProfile = args.profile!
let preflightOnly = args['preflight-only'] ?? false
let noPreflight = args['no-preflight'] ?? false
let browserName = (args.browser ?? 'chromium').toLowerCase()
let frameworkFilter = args.framework || []
let benchmarkFilter = args.benchmark || []
let viewFilter = args.view || []
let viewportWidth = Number.parseInt(process.env.BENCH_VIEWPORT_WIDTH ?? '', 10)
let viewportHeight = Number.parseInt(process.env.BENCH_VIEWPORT_HEIGHT ?? '', 10)
let viewport =
  Number.isFinite(viewportWidth) && Number.isFinite(viewportHeight)
    ? { width: viewportWidth, height: viewportHeight }
    : undefined

interface TimingResult {
  scripting: number
  total: number
  profile?: FunctionProfile[]
}

interface Operation {
  name: string
  view?: OperationView
  readySelector?: string
  setup?: (page: Page) => Promise<void>
  action: (page: Page) => Promise<TimingResult>
  teardown?: (page: Page) => Promise<void>
}

// Click an element and measure time until next paint using Event Timing API
// Also captures Chrome DevTools Profiler data for detailed function-level analysis
async function clickAndMeasure(
  page: Page,
  selector: string,
  operationName?: string,
): Promise<TimingResult> {
  // Set up the observer before clicking (using string to avoid tsx transformation issues)
  await page.evaluate(`
    window.__benchResult = null;
    window.__benchObserver = new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (entry.entryType === 'event' && entry.name === 'click') {
          window.__benchResult = {
            scripting: entry.processingEnd - entry.processingStart,
            total: entry.duration
          };
          window.__benchObserver.disconnect();
          return;
        }
      }
    });
    window.__benchObserver.observe({ type: 'event', buffered: false, durationThreshold: 0 });
  `)

  // Start Chrome DevTools Profiler
  let cdp = await page.context().newCDPSession(page)
  await cdp.send('Profiler.enable')
  await cdp.send('Profiler.start')

  // Use Playwright's click which fires real pointer events
  await page.click(selector)

  // Wait for paint and retrieve the timing result
  let timing = (await page.evaluate(`
    new Promise(function(resolve) {
      function check() {
        if (window.__benchResult !== null) {
          resolve(window.__benchResult);
        } else {
          requestAnimationFrame(check);
        }
      }
      requestAnimationFrame(check);
    })
  `)) as TimingResult

  // Stop profiler and get results
  let result = await cdp.send('Profiler.stop')
  await cdp.send('Profiler.disable')

  // Process profiling data
  let profileData: FunctionProfile[] | undefined
  if (showProfile && result && result.profile) {
    let profile = result.profile as any
    let nodes = profile.nodes || []
    let samples = profile.samples || []
    let timeDeltas = profile.timeDeltas || []

    // Calculate self time for each function
    let functionTimes = new Map<number, number>()
    let functionNames = new Map<number, string>()

    // Build function name map
    for (let node of nodes) {
      let name = node.callFrame?.functionName || node.callFrame?.url || 'unknown'
      if (name.includes('node_modules')) continue // Skip node_modules
      functionNames.set(node.id, name)
    }

    // Calculate time spent in each function (self time = time when this function is on top of stack)
    let totalTime = 0
    for (let i = 0; i < samples.length; i++) {
      let sampleId = samples[i]
      let delta = timeDeltas[i] || 0
      totalTime += delta

      // Self time is when this function is the top of the stack
      let current = functionTimes.get(sampleId) || 0
      functionTimes.set(sampleId, current + delta)
    }

    // Sort by self time and get top 30
    profileData = Array.from(functionTimes.entries())
      .map(([id, time]) => ({
        name: functionNames.get(id) || 'unknown',
        time: time / 1000, // Convert to ms
        percentage: totalTime > 0 ? (time / totalTime) * 100 : 0,
      }))
      .filter((item) => !item.name.includes('node_modules'))
      .sort((a, b) => b.time - a.time)
      .slice(0, 30)
  }

  return { ...timing, profile: profileData }
}

// Wait for the main thread to be idle (no pending tasks)
async function waitForIdle(page: Page): Promise<void> {
  await page.evaluate(`
    new Promise(function(resolve) {
      // First wait for paint to complete
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          // Then wait for the main thread to be idle
          requestIdleCallback(function() {
            // Double-check with another idle callback to ensure cleanup is done
            requestIdleCallback(resolve, { timeout: 100 });
          }, { timeout: 100 });
        });
      });
    })
  `)
}

// Click without measuring (for setup/teardown)
async function click(page: Page, selector: string): Promise<void> {
  await page.click(selector)
  // Wait for paint and idle to complete before continuing
  await waitForIdle(page)
}

// Clear all rows
async function clear(page: Page): Promise<void> {
  await click(page, '#clear')
}

// Create 1000 rows
async function create1k(page: Page): Promise<void> {
  await click(page, '#run')
}

const AVAILABLE_VIEWS: OperationView[] = ['datatable', 'pokeboxes']

function resolveOperationView(operation: Operation): OperationView {
  return operation.view ?? DEFAULT_VIEW
}

function resolveViewUrl(baseUrl: string, view: OperationView): string {
  let url = new URL(baseUrl)
  url.searchParams.set('view', view)
  return url.toString()
}

function resolveOperationUrl(baseUrl: string, operation: Operation): string {
  return resolveViewUrl(baseUrl, resolveOperationView(operation))
}

function resolveViewReadySelector(view: OperationView): string {
  return view === 'pokeboxes' ? '#append40' : '#run'
}

function resolveOperationReadySelector(operation: Operation): string {
  return operation.readySelector ?? resolveViewReadySelector(resolveOperationView(operation))
}

function resolveViewFilter(): OperationView[] {
  if (viewFilter.length === 0) return AVAILABLE_VIEWS
  const normalized = viewFilter
    .map((view) => view.toLowerCase())
    .filter((view): view is OperationView => (AVAILABLE_VIEWS as string[]).includes(view))
  return normalized.length > 0 ? normalized : AVAILABLE_VIEWS
}

function filterOperationsByView(operationsToFilter: Operation[]): Operation[] {
  const allowedViews = new Set(resolveViewFilter())
  return operationsToFilter.filter((operation) => allowedViews.has(resolveOperationView(operation)))
}

// Define all benchmark operations
const operations: Operation[] = [
  {
    name: 'create1k',
    setup: clear,
    action: (page) => clickAndMeasure(page, '#run', 'create1k'),
  },
  // {
  //   name: 'create10k',
  //   setup: clear,
  //   action: (page) => clickAndMeasure(page, '#runlots', 'create10k'),
  // },
  {
    name: 'append1k',
    setup: create1k,
    action: (page) => clickAndMeasure(page, '#add', 'append1k'),
    teardown: clear,
  },
  {
    name: 'update',
    setup: create1k,
    action: (page) => clickAndMeasure(page, '#update', 'update'),
    teardown: clear,
  },
  {
    name: 'clear',
    setup: create1k,
    action: (page) => clickAndMeasure(page, '#clear', 'clear'),
  },
  {
    name: 'swapRows',
    setup: create1k,
    action: (page) => clickAndMeasure(page, '#swaprows', 'swapRows'),
    teardown: clear,
  },
  {
    name: 'selectRow',
    setup: create1k,
    action: (page) => clickAndMeasure(page, 'tbody tr:first-child .bench-data-link', 'selectRow'),
    teardown: clear,
  },
  {
    name: 'removeRow',
    setup: create1k,
    action: (page) => clickAndMeasure(page, 'tbody tr:first-child .bench-data-remove', 'removeRow'),
    teardown: clear,
  },
  {
    name: 'replace1k',
    setup: create1k,
    action: (page) => clickAndMeasure(page, '#run', 'replace1k'),
    teardown: clear,
  },
  {
    name: 'sortAsc',
    setup: create1k,
    action: (page) => clickAndMeasure(page, '#sortasc', 'sortAsc'),
    teardown: clear,
  },
  {
    name: 'sortDesc',
    setup: create1k,
    action: (page) => clickAndMeasure(page, '#sortdesc', 'sortDesc'),
    teardown: clear,
  },
  {
    name: 'pokeAppend40',
    view: 'pokeboxes',
    readySelector: '#append40',
    action: (page) => clickAndMeasure(page, '#append40', 'pokeAppend40'),
  },
  {
    name: 'pokePrepend40',
    view: 'pokeboxes',
    readySelector: '#append40',
    setup: (page) => click(page, '#append40'),
    action: (page) => clickAndMeasure(page, '#prepend40', 'pokePrepend40'),
  },
  {
    name: 'pokeRemoveEvery3rdBox',
    view: 'pokeboxes',
    readySelector: '#append40',
    setup: (page) => click(page, '#append40'),
    action: (page) => clickAndMeasure(page, '#remove3rdbox', 'pokeRemoveEvery3rdBox'),
  },
  {
    name: 'pokeSwapBoxSets',
    view: 'pokeboxes',
    readySelector: '#append40',
    setup: (page) => click(page, '#append40'),
    action: (page) => clickAndMeasure(page, '#swapboxsets', 'pokeSwapBoxSets'),
  },
  {
    name: 'pokeReplaceFirst6Boxes',
    view: 'pokeboxes',
    readySelector: '#append40',
    setup: (page) => click(page, '#append40'),
    action: (page) => clickAndMeasure(page, '#replacefirst6', 'pokeReplaceFirst6Boxes'),
  },
  {
    name: 'pokeRemoveForms',
    view: 'pokeboxes',
    readySelector: '#append40',
    setup: (page) => click(page, '#append40'),
    action: (page) => clickAndMeasure(page, '#removeforms', 'pokeRemoveForms'),
  },
  {
    name: 'pokeToggleAllCaught',
    view: 'pokeboxes',
    readySelector: '#append40',
    setup: (page) => click(page, '#append40'),
    action: (page) => clickAndMeasure(page, '#toggleall', 'pokeToggleAllCaught'),
  },
  {
    name: 'pokeToggleEvery3rdCaught',
    view: 'pokeboxes',
    readySelector: '#append40',
    setup: (page) => click(page, '#append40'),
    action: (page) => clickAndMeasure(page, '#toggle3rd', 'pokeToggleEvery3rdCaught'),
  },
]

// Start the benchmark server
function startServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    let server = spawn('pnpm', ['run', 'serve', '-p', PORT.toString()], {
      env: {
        ...process.env,
        PORT: PORT.toString(),
      },
      cwd: import.meta.dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    })

    let started = false
    let stdoutBuffer = ''

    server.stdout?.on('data', (data: Buffer) => {
      stdoutBuffer += data.toString()
      if (!started && stdoutBuffer.includes(`http://localhost:${PORT}`)) {
        started = true
        console.log(`Server detected at http://localhost:${PORT}`)
        resolve(server)
      }
    })

    server.stderr?.on('data', (data: Buffer) => {
      if (!started) {
        reject(new Error(`Server error: ${data.toString()}`))
      }
    })

    server.on('error', reject)

    // Timeout if server doesn't start
    setTimeout(() => {
      if (!started) {
        server.kill()
        reject(new Error('Server failed to start within timeout'))
      }
    }, 10_000)
  })
}

// Stop the server
function stopServer(server: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (!server.pid) {
      console.warn('Server process not found, stopServer has no effect')
      resolve()
      return
    }
    server.on('close', () => resolve())
    process.kill(-server.pid, 'SIGTERM')
    setTimeout(() => {
      if (server.pid) {
        process.kill(-server.pid, 'SIGKILL')
      }
    }, 5_000)
  })
}

// Save vani results to file for comparison with next run
function saveVaniResults(results: BenchmarkResult[]): void {
  let vaniResults = results.filter((r) => r.framework === 'vani')
  if (vaniResults.length > 0) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
    fs.writeFileSync(VANI_RESULTS_FILE, JSON.stringify(vaniResults, null, 2))
  }
}

function saveSnapshot(payload: SnapshotPayload): void {
  fs.mkdirSync(RESULTS_DIR, { recursive: true })
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(payload, null, 2))
  console.log(`Saved snapshot to ${SNAPSHOT_FILE}`)
}

function formatDiffLines(markup: string): string[] {
  return markup
    .replace(/></g, '>\n<')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

async function getCanonicalBodyFromMarkup(page: Page, markup: string): Promise<string> {
  return page.evaluate((html) => {
    function escapeAttribute(value: string): string {
      return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }

    function normalizeText(text: string): string {
      return text.replace(/\s+/g, ' ').trim()
    }

    function serializeNode(node: Node): string {
      if (node.nodeType === Node.ELEMENT_NODE) {
        let element = node as Element
        let tag = element.tagName.toLowerCase()
        if (tag === 'script' || tag === 'template') {
          return ''
        }
        let attrs = element
          .getAttributeNames()
          .filter((name) => !name.startsWith('data-'))
          .sort()
        let attrString = attrs
          .map((name) => {
            let value = element.getAttribute(name) ?? ''
            if (name === 'class') {
              value = value.split(/\s+/g).filter(Boolean).sort().join(' ')
            }
            return ` ${name}="${escapeAttribute(value)}"`
          })
          .join('')
        let children = serializeChildren(element)
        return `<${tag}${attrString}>${children}</${tag}>`
      }

      if (node.nodeType === Node.TEXT_NODE) {
        let text = normalizeText(node.nodeValue ?? '')
        return text.length > 0 ? text : ''
      }

      return ''
    }

    function serializeChildren(parent: Node): string {
      let output = ''
      parent.childNodes.forEach((child) => {
        output += serializeNode(child)
      })
      return output
    }

    let parser = new DOMParser()
    let doc = parser.parseFromString(html, 'text/html')
    return serializeChildren(doc.body)
  }, markup)
}

async function getCanonicalBodyFromPage(page: Page): Promise<string> {
  return page.evaluate(() => {
    function escapeAttribute(value: string): string {
      return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }

    function normalizeText(text: string): string {
      return text.replace(/\s+/g, ' ').trim()
    }

    function serializeNode(node: Node): string {
      if (node.nodeType === Node.ELEMENT_NODE) {
        let element = node as Element
        let tag = element.tagName.toLowerCase()
        if (tag === 'script' || tag === 'template') {
          return ''
        }
        let attrs = element
          .getAttributeNames()
          .filter((name) => !name.startsWith('data-'))
          .sort()
        let attrString = attrs
          .map((name) => {
            let value = element.getAttribute(name) ?? ''
            if (name === 'class') {
              value = value.split(/\s+/g).filter(Boolean).sort().join(' ')
            }
            return ` ${name}="${escapeAttribute(value)}"`
          })
          .join('')
        let children = serializeChildren(element)
        return `<${tag}${attrString}>${children}</${tag}>`
      }

      if (node.nodeType === Node.TEXT_NODE) {
        let text = normalizeText(node.nodeValue ?? '')
        return text.length > 0 ? text : ''
      }

      return ''
    }

    function serializeChildren(parent: Node): string {
      let output = ''
      parent.childNodes.forEach((child) => {
        output += serializeNode(child)
      })
      return output
    }

    return serializeChildren(document.body)
  })
}

function buildFirstDiff(expected: string, actual: string): string {
  let expectedLines = formatDiffLines(expected)
  let actualLines = formatDiffLines(actual)
  let maxLen = Math.max(expectedLines.length, actualLines.length)
  let mismatchIndex = -1
  for (let i = 0; i < maxLen; i++) {
    if (expectedLines[i] !== actualLines[i]) {
      mismatchIndex = i
      break
    }
  }

  if (mismatchIndex === -1) {
    return 'No diff found after normalization.'
  }

  let start = Math.max(0, mismatchIndex - 3)
  let end = Math.min(maxLen - 1, mismatchIndex + 3)
  let diffLines: string[] = []
  diffLines.push('--- blueprint')
  diffLines.push('+++ actual')
  for (let i = start; i <= end; i++) {
    diffLines.push(`- ${expectedLines[i] ?? ''}`)
    diffLines.push(`+ ${actualLines[i] ?? ''}`)
  }
  return diffLines.join('\n')
}

async function preflightFrameworks(
  page: Page,
  frameworks: string[],
  blueprintBodies: Record<OperationView, string>,
): Promise<string[]> {
  let failures: string[] = []
  let canonicalBlueprints = new Map<OperationView, string>()
  let firstDiff: { framework: string; view: OperationView; diff: string } | null = null

  for (const view of Object.keys(blueprintBodies) as OperationView[]) {
    canonicalBlueprints.set(view, await getCanonicalBodyFromMarkup(page, blueprintBodies[view]))
  }

  for (let framework of frameworks) {
    for (const view of Object.keys(blueprintBodies) as OperationView[]) {
      let url = resolveViewUrl(`${BASE_URL}/${framework}`, view)
      await page.goto(url)
      await page.waitForSelector(resolveViewReadySelector(view))
      await page.evaluate(() => {
        let title = document.querySelector<HTMLElement>('.bench-title')
        if (title) {
          title.textContent = 'TITLE'
        }
      })

      let canonicalBody = await getCanonicalBodyFromPage(page)
      let canonicalBlueprint = canonicalBlueprints.get(view) ?? ''
      if (canonicalBody !== canonicalBlueprint) {
        failures.push(`${framework} (${view})`)
        if (!firstDiff) {
          firstDiff = {
            framework,
            view,
            diff: buildFirstDiff(canonicalBlueprint, canonicalBody),
          }
        }
      }
    }
  }

  if (firstDiff) {
    console.error(
      `Preflight diff for first failing framework: ${firstDiff.framework} (${firstDiff.view})`,
    )
    console.error(firstDiff.diff)
  }

  return failures
}

// Load previous vani results if they exist
function loadPreviousVaniResults(): BenchmarkResult[] {
  try {
    if (fs.existsSync(VANI_RESULTS_FILE)) {
      let data = fs.readFileSync(VANI_RESULTS_FILE, 'utf-8')
      let results: BenchmarkResult[] = JSON.parse(data)
      // Rename framework to "vani (prev)"
      return results.map((r) => ({ ...r, framework: 'vani (prev)' }))
    }
  } catch {
    // Ignore errors loading previous results
  }
  return []
}

// Run a single operation and measure time
async function measureOperation(page: Page, operation: Operation): Promise<TimingResult> {
  // Run setup if defined
  if (operation.setup) {
    await operation.setup(page)
  }

  // Wait for idle before measuring to ensure no pending work from setup
  await waitForIdle(page)

  // Measure the action (returns timing from Event Timing API)
  let timing = await operation.action(page)

  // Run teardown if defined
  if (operation.teardown) {
    await operation.teardown(page)
  }

  // Wait for idle after teardown to ensure cleanup is complete before next operation
  await waitForIdle(page)

  return timing
}

function buildResourceMetricsDelta(
  first: ResourceMetrics,
  after: ResourceMetrics,
): ResourceMetrics {
  return {
    jsHeapUsedSize: after.jsHeapUsedSize - first.jsHeapUsedSize,
    jsHeapTotalSize: after.jsHeapTotalSize - first.jsHeapTotalSize,
    taskDuration: after.taskDuration - first.taskDuration,
    scriptDuration: after.scriptDuration - first.scriptDuration,
    layoutDuration: after.layoutDuration - first.layoutDuration,
    recalcStyleDuration: after.recalcStyleDuration - first.recalcStyleDuration,
  }
}

function getMetric(metrics: Array<{ name: string; value: number }>, name: string): number {
  let metric = metrics.find((item) => item.name === name)
  return metric ? metric.value : 0
}

async function collectResourceMetrics(cdp: CDPSession): Promise<ResourceMetrics> {
  const { metrics } = (await cdp.send('Performance.getMetrics')) as {
    metrics: Array<{ name: string; value: number }>
  }

  return {
    jsHeapUsedSize: getMetric(metrics, 'JSHeapUsedSize'),
    jsHeapTotalSize: getMetric(metrics, 'JSHeapTotalSize'),
    taskDuration: getMetric(metrics, 'TaskDuration'),
    scriptDuration: getMetric(metrics, 'ScriptDuration'),
    layoutDuration: getMetric(metrics, 'LayoutDuration'),
    recalcStyleDuration: getMetric(metrics, 'RecalcStyleDuration'),
  }
}

async function measureFrameworkResourceMetrics(
  page: Page,
  url: string,
  operationsToRun: Operation[],
  framework: string,
): Promise<SnapshotFrameworkMetrics> {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Performance.enable')

  try {
    const firstOperation = operationsToRun[0]
    if (!firstOperation) {
      return {
        framework,
        firstRender: {
          jsHeapUsedSize: 0,
          jsHeapTotalSize: 0,
          taskDuration: 0,
          scriptDuration: 0,
          layoutDuration: 0,
          recalcStyleDuration: 0,
        },
        afterSuite: {
          jsHeapUsedSize: 0,
          jsHeapTotalSize: 0,
          taskDuration: 0,
          scriptDuration: 0,
          layoutDuration: 0,
          recalcStyleDuration: 0,
        },
        delta: {
          jsHeapUsedSize: 0,
          jsHeapTotalSize: 0,
          taskDuration: 0,
          scriptDuration: 0,
          layoutDuration: 0,
          recalcStyleDuration: 0,
        },
      }
    }

    await page.goto(resolveOperationUrl(url, firstOperation))
    await page.waitForSelector(resolveOperationReadySelector(firstOperation))
    await waitForIdle(page)

    const firstRender = await collectResourceMetrics(cdp)

    for (const operation of operationsToRun) {
      await page.goto(resolveOperationUrl(url, operation))
      await page.waitForSelector(resolveOperationReadySelector(operation))
      await waitForIdle(page)
      await measureOperation(page, operation)
    }

    await waitForIdle(page)
    const afterSuite = await collectResourceMetrics(cdp)

    return {
      framework,
      firstRender,
      afterSuite,
      delta: buildResourceMetricsDelta(firstRender, afterSuite),
    }
  } finally {
    await cdp.send('Performance.disable')
    await cdp.detach()
  }
}

// Print profiling table
function printProfileTable(profile: FunctionProfile[], operationName: string): void {
  if (profile.length === 0) return

  console.log(`\n${operationName}`)
  console.log('📊 Top functions by self time (median):')
  console.log('═'.repeat(90))
  console.log(`${'Function'.padEnd(70)} ${'Time (ms)'.padStart(10)} ${'%'.padStart(8)}`)
  console.log('─'.repeat(90))
  for (let item of profile) {
    let name = item.name.length > 68 ? '...' + item.name.slice(-65) : item.name
    console.log(
      `${name.padEnd(70)} ${item.time.toFixed(2).padStart(10)} ${item.percentage.toFixed(1).padStart(7)}%`,
    )
  }
  console.log('═'.repeat(90))
}

// Run benchmark for a single framework
async function benchmarkFramework(
  page: Page,
  framework: string,
): Promise<{
  results: BenchmarkResult[]
  profiles: Map<string, FunctionProfile[][]>
  resourceMetrics: SnapshotFrameworkMetrics
}> {
  let results: BenchmarkResult[] = []
  let profiles = new Map<string, FunctionProfile[][]>()

  let baseUrl = `${BASE_URL}/${framework}`

  // Filter operations if benchmark filter is specified
  let filteredOperations =
    benchmarkFilter.length > 0
      ? operations.filter((op) => benchmarkFilter.some((filter) => op.name.includes(filter)))
      : operations
  filteredOperations = filterOperationsByView(filteredOperations)

  let resourceMetrics = await measureFrameworkResourceMetrics(
    page,
    baseUrl,
    filteredOperations,
    framework,
  )

  for (let operation of filteredOperations) {
    let scriptingTimes: number[] = []
    let totalTimes: number[] = []
    let runProfiles: FunctionProfile[][] = []

    // const body = await page.textContent('body')

    // if (!body) {
    //   console.error(`Framework ${framework} not found (body is null)`)
    //   // process.exit(1)
    // }

    // // If page containts "Not found" string, fail
    // if (body?.toLowerCase().includes('not found')) {
    //   console.error(`Framework ${framework} not found (body includes "Not Found")`)
    //   // process.exit(1)
    // }

    // Reload page before each operation to reset all JS state (idCounter, etc.)
    let operationUrl = resolveOperationUrl(baseUrl, operation)
    await page.goto(operationUrl)
    await page.waitForSelector(resolveOperationReadySelector(operation))

    // Warmup runs (not recorded)
    for (let i = 0; i < warmupRuns; i++) {
      await measureOperation(page, operation)
    }

    // Benchmark runs
    for (let i = 0; i < benchmarkRuns; i++) {
      let timing = await measureOperation(page, operation)
      scriptingTimes.push(timing.scripting)
      totalTimes.push(timing.total)
      if (showProfile && timing.profile) {
        runProfiles.push(timing.profile)
      }
    }

    results.push({
      framework,
      operation: operation.name,
      scripting: calcStats(scriptingTimes),
      total: calcStats(totalTimes),
    })

    if (showProfile && runProfiles.length > 0) {
      profiles.set(operation.name, runProfiles)
    }

    process.stdout.write('.')
  }

  return { results, profiles, resourceMetrics }
}

// ANSI color codes
const RESET = '\x1b[0m'
const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const WHITE = '\x1b[97m'
const BG_GRAY = '\x1b[48;5;240m'
const DIM = '\x1b[2m'
// const BOLD = '\x1b[1m'

// Print combined bar graph with scripting (yellow) and total bars
function printBarGraph(allResults: BenchmarkResult[]): void {
  let operationNames = [...new Set(allResults.map((r) => r.operation))]
  let frameworks = [...new Set(allResults.map((r) => r.framework))]
  let hasVani = frameworks.includes('vani')

  // Put vani first if it exists
  if (hasVani) {
    frameworks = ['vani', ...frameworks.filter((f) => f !== 'vani')]
  }

  // Get terminal width (default to 100, max 120)
  let termWidth = Math.min(process.stdout.columns || 100, 120)

  // Find max framework name length for label padding
  let maxNameLen = Math.max(...frameworks.map((f) => f.length))
  let labelWidth = maxNameLen + 4 // "  name: "

  // Reserve space for label + bar + " scripting_value " + " total_value (ratio)"
  let suffixWidth = 25
  let barMaxWidth = termWidth - labelWidth - suffixWidth

  // Calculate global max value across all operations (use total since it's always >= scripting)
  let globalMax = Math.max(...allResults.map((r) => r.total.median))

  for (let opName of operationNames) {
    console.log(`${DIM}${opName}${RESET}`)

    let vaniResult = hasVani
      ? allResults.find((r) => r.framework === 'vani' && r.operation === opName)
      : null
    let vaniTotal = vaniResult ? vaniResult.total.median : null

    for (let fw of frameworks) {
      let result = allResults.find((r) => r.framework === fw && r.operation === opName)
      let scriptingValue = result ? result.scripting.median : 0
      let totalValue = result ? result.total.median : 0
      let scriptingRounded = Math.round(scriptingValue * 10) / 10
      let totalRounded = Math.round(totalValue * 10) / 10

      // Calculate bar lengths (scaled to global max)
      let scriptingBarLen = Math.round((scriptingValue / globalMax) * barMaxWidth)
      let totalBarLen = Math.round((totalValue / globalMax) * barMaxWidth)
      let remainingBarLen = totalBarLen - scriptingBarLen

      // Build the scripting bar (yellow)
      let scriptingBar = '█'.repeat(scriptingBarLen)
      // Build the remaining bar (default color, total - scripting)
      let remainingBar = '█'.repeat(Math.max(0, remainingBarLen))

      // Scripting value with gray background and white text (fixed width for alignment)
      let scriptingText = ` ${String(scriptingRounded).padStart(5)} `

      // Build total suffix with ratio
      let totalSuffix = String(totalRounded)
      if (fw !== 'vani' && vaniTotal !== null && vaniTotal > 0) {
        let ratio = Math.round((totalValue / vaniTotal) * 10) / 10
        let color = ratio < 1 ? RED : ratio > 1 ? GREEN : ''
        totalSuffix += ` ${color}(${ratio}x)${color ? RESET : ''}`
      }

      // Print single combined line: label + yellow bars + scripting value (gray bg) + remaining bars + total
      let label = ('  ' + fw + ':').padEnd(labelWidth)
      console.log(
        `${label}${YELLOW}${scriptingBar}${RESET}${BG_GRAY}${WHITE}${scriptingText}${RESET}${remainingBar} ${totalSuffix}`,
      )
    }
    console.log('')
  }
}

// Print results as two tables (scripting and total)
function printTable(allResults: BenchmarkResult[]): void {
  let operationNames = [...new Set(allResults.map((r) => r.operation))]
  let frameworks = [...new Set(allResults.map((r) => r.framework))]

  // Put vani first if it exists
  if (frameworks.includes('vani')) {
    frameworks = ['vani', ...frameworks.filter((f) => f !== 'vani')]
  }

  // Build scripting table with flags for slow operations
  let scriptingData: Record<string, Record<string, number>> = {}
  for (let opName of operationNames) {
    let vaniResult = allResults.find((r) => r.framework === 'vani' && r.operation === opName)
    let vaniValue = vaniResult ? vaniResult.scripting.median : 0
    let otherValues = frameworks
      .filter((fw) => fw !== 'vani')
      .map((fw) => {
        let result = allResults.find((r) => r.framework === fw && r.operation === opName)
        return result ? result.scripting.median : 0
      })
      .filter((v) => v > 0)

    // Check if vani is significantly slower (2x longer than fastest other)
    let isSlow = false
    if (vaniValue && otherValues.length > 0) {
      let fastestOther = Math.min(...otherValues)
      isSlow = vaniValue > fastestOther * 2.0
    }

    let displayName = isSlow ? `${opName} 🚩` : opName
    scriptingData[displayName] = {}
    for (let fw of frameworks) {
      let result = allResults.find((r) => r.framework === fw && r.operation === opName)
      scriptingData[displayName][fw] = result ? Math.round(result.scripting.median * 10) / 10 : 0
    }
  }

  // Build total table with flags for slow operations
  let totalData: Record<string, Record<string, number>> = {}
  for (let opName of operationNames) {
    let vaniResult = allResults.find((r) => r.framework === 'vani' && r.operation === opName)
    let vaniValue = vaniResult ? vaniResult.total.median : 0
    let otherValues = frameworks
      .filter((fw) => fw !== 'vani')
      .map((fw) => {
        let result = allResults.find((r) => r.framework === fw && r.operation === opName)
        return result ? result.total.median : 0
      })
      .filter((v) => v > 0)

    // Check if vani is significantly slower (>20% slower than fastest other)
    let isSlow = false
    if (vaniValue && otherValues.length > 0) {
      let fastestOther = Math.min(...otherValues)
      isSlow = vaniValue > fastestOther * 1.2
    }

    let displayName = isSlow ? `${opName} 🚩` : opName
    totalData[displayName] = {}
    for (let fw of frameworks) {
      let result = allResults.find((r) => r.framework === fw && r.operation === opName)
      totalData[displayName][fw] = result ? Math.round(result.total.median * 10) / 10 : 0
    }
  }

  console.log('Scripting Time (ms):')
  console.table(scriptingData)
  console.log('')
  console.log('Total Time (ms):')
  console.table(totalData)
}

// Print results as bar graphs or tables
function printResults(allResults: BenchmarkResult[]): void {
  if (useTable) {
    printTable(allResults)
  } else {
    printBarGraph(allResults)
  }
}

// Main benchmark runner
async function main(): Promise<void> {
  let server: ChildProcess | null = null
  let browser: Browser | null = null

  try {
    console.log('Starting benchmark server...')
    server = await startServer()

    const browserLaunchers: Record<string, typeof chromium> = {
      chromium,
      // this runner currently doesn't support other browsers:
      // firefox,
      // webkit,
    }
    const launcher = browserLaunchers[browserName]
    if (!launcher) {
      console.error(`Error: Invalid browser: ${browserName}`)
      console.error('Available browsers: chromium')
      process.exit(1)
    }

    console.log(`🧑‍🔬 Launching ${browserName} browser...`)
    browser = await launcher.launch({
      headless,
      args: viewport ? [`--window-size=${viewport.width},${viewport.height}`] : undefined,
    })
    const context = await browser.newContext(viewport ? { viewport } : undefined)
    let page = await context.newPage()

    // Enable CPU throttling via CDP
    let client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottling })

    const allowedViews = resolveViewFilter()
    const blueprintBodies: Record<OperationView, string> = {} as Record<OperationView, string>
    if (allowedViews.includes('datatable')) {
      blueprintBodies.datatable = fs.readFileSync(BLUEPRINTS.datatable, 'utf-8')
    }
    if (allowedViews.includes('pokeboxes')) {
      blueprintBodies.pokeboxes = fs.readFileSync(BLUEPRINTS.pokeboxes, 'utf-8')
    }
    let allFrameworks = getFrameworkIds()
    let frameworks = allFrameworks

    // Filter frameworks if specified
    if (frameworkFilter.length > 0) {
      let invalidFrameworks = frameworkFilter.filter((f) => !allFrameworks.includes(f))
      if (invalidFrameworks.length > 0) {
        console.error(`Error: Invalid framework(s): ${invalidFrameworks.join(', ')}`)
        console.error(`Available frameworks: ${allFrameworks.join(', ')}`)
        process.exit(1)
      }
      frameworks = frameworkFilter
    }

    if (viewFilter.length > 0) {
      let invalidViews = viewFilter.filter(
        (view) => !AVAILABLE_VIEWS.includes(view.toLowerCase() as OperationView),
      )
      if (invalidViews.length > 0) {
        console.error(`Error: Invalid view(s): ${invalidViews.join(', ')}`)
        console.error(`Available views: ${AVAILABLE_VIEWS.join(', ')}`)
        process.exit(1)
      }
    }

    if (preflightOnly && noPreflight) {
      console.error('Error: --preflight-only cannot be used with --no-preflight')
      process.exit(1)
    }

    if (!noPreflight) {
      console.log('Running preflight DOM check...')
      let preflightFailures = await preflightFrameworks(page, frameworks, blueprintBodies)
      if (preflightFailures.length > 0) {
        console.error(
          `Preflight failed: initial body does not match blueprint for ${preflightFailures.length} framework(s): ${preflightFailures.join(
            ', ',
          )}`,
        )
        console.error('Fix the mismatched framework markup before running benchmarks.')
        process.exit(1)
      }
      if (preflightOnly) {
        console.log('Preflight complete.')
        return
      }
    }

    let allResults: BenchmarkResult[] = []
    let allProfiles = new Map<string, FunctionProfile[][]>()
    let allResourceMetrics: SnapshotFrameworkMetrics[] = []

    // Load previous vani results if vani is being benchmarked
    let hasVani = frameworks.includes('vani')
    let previousVaniResults: BenchmarkResult[] = []
    if (hasVani) {
      previousVaniResults = loadPreviousVaniResults()
      if (previousVaniResults.length > 0) {
        console.log('Loaded previous vani results for comparison')
      }
    }

    console.log(`Benchmarking ${frameworks.length} frameworks: ${frameworks.join(', ')}`)
    console.log(`${warmupRuns} warmup runs, ${benchmarkRuns} benchmark runs per operation`)
    console.log(`CPU throttling: ${cpuThrottling}x`)
    console.log('')

    for (let framework of frameworks) {
      process.stdout.write(`  ${framework}: `)
      let { results, profiles, resourceMetrics } = await benchmarkFramework(page, framework)
      allResults.push(...results)
      allResourceMetrics.push(resourceMetrics)
      // Store profiles keyed by framework-operation name
      for (let [operationName, runProfiles] of profiles.entries()) {
        let key = `${framework}-${operationName}`
        allProfiles.set(key, runProfiles)
      }
      console.log(' done')
    }

    // Save current vani results for next run
    if (hasVani) {
      saveVaniResults(allResults)
    }

    let snapshotResults = [...allResults]

    // Add previous vani results to display only when vani is the only framework
    // (When comparing against other frameworks, we don't need to show previous vani)
    if (previousVaniResults.length > 0 && frameworks.length === 1) {
      allResults.push(...previousVaniResults)
    }

    // Print aggregated profiling tables first
    if (showProfile && allProfiles.size > 0) {
      for (let [key, runProfiles] of allProfiles.entries()) {
        let aggregated = aggregateProfiles(runProfiles, key)
        if (aggregated) {
          printProfileTable(aggregated, key)
        }
      }
    }

    // Print benchmark results after profiles
    printResults(allResults)

    let frameworkDetails = getFrameworks()
    saveSnapshot({
      generatedAt: new Date().toISOString(),
      cpuThrottling,
      runs: benchmarkRuns,
      warmups: warmupRuns,
      headless,
      preflightUsed: !noPreflight,
      frameworks: frameworkDetails,
      results: snapshotResults,
      resourceMetrics: allResourceMetrics,
      calculated: buildCalculatedSnapshot(snapshotResults, frameworkDetails, (operationName) => {
        let operation = operations.find((op) => op.name === operationName)
        return operation ? resolveOperationView(operation) : DEFAULT_VIEW
      }),
    })

    console.log('Benchmark complete!')
    console.log('View results with: pnpm bench:dev')
  } finally {
    console.log('Cleaning up...')
    if (browser) {
      console.log('Closing browser...')
      await browser.close()
      console.log('Browser closed')
    }
    if (server) {
      console.log('Stopping server...')
      stopServer(server).then(() => {
        console.log('Server stopped')
        process.exit(0)
      })
    }
  }
}

main().catch((error) => {
  console.error('Benchmark failed:', error)
  process.exit(1)
})
