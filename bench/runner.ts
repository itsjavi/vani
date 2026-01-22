import { spawn, type ChildProcess } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseArgs } from 'node:util'

import { chromium, type Browser, type Page } from 'playwright'
import { getProjects } from './macros'

const PORT = 44100
const BASE_URL = `http://localhost:${PORT}`
const LAST_ARGS_FILE = path.join(import.meta.dirname, 'snapshot/results/bench-last-args.json')
const SNAPSHOT_FILE = path.join(import.meta.dirname, 'snapshot/results/bench-results.json')
const VANI_RESULTS_FILE = path.join(import.meta.dirname, 'snapshot/results/bench-results-vani.json')

interface SavedArgs {
  cpu: string
  runs: string
  warmups: string
  headless: boolean
  table: boolean
  profile: boolean
  framework: string[]
  benchmark: string[]
}

// Get list of frameworks
function getFrameworks(): string[] {
  return getProjects('frameworks')
    .map((project) => project.name)
    .sort()
}

function saveArgs(args: SavedArgs): void {
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
    cpu: { type: 'string', default: '4' },
    runs: { type: 'string', default: '5' },
    warmups: { type: 'string', default: '2' },
    headless: { type: 'boolean', default: false },
    table: { type: 'boolean', default: false },
    profile: { type: 'boolean', default: false },
    framework: {
      type: 'string',
      multiple: true,
      short: 'f',
      // default: ['vani', 'preact'],
    },
    benchmark: { type: 'string', multiple: true, short: 'b' },
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
    framework: args.framework || [],
    benchmark: args.benchmark || [],
  })
}

let cpuThrottling = parseInt(args.cpu!, 10)
let benchmarkRuns = parseInt(args.runs!, 10)
let warmupRuns = parseInt(args.warmups!, 10)
let headless = args.headless!
let useTable = args.table!
let showProfile = args.profile!
let frameworkFilter = args.framework || []
let benchmarkFilter = args.benchmark || []

interface FunctionProfile {
  name: string
  time: number
  percentage: number
}

interface TimingResult {
  scripting: number
  total: number
  profile?: FunctionProfile[]
}

interface BenchmarkResult {
  framework: string
  operation: string
  scripting: { times: number[]; mean: number; median: number; min: number; max: number }
  total: { times: number[]; mean: number; median: number; min: number; max: number }
}

interface SnapshotFramework {
  name: string
  version: string
  path: string
  benchmarkNotes?: string
}

interface SnapshotPayload {
  generatedAt: string
  cpuThrottling: number
  runs: number
  warmups: number
  headless: boolean
  frameworks: SnapshotFramework[]
  results: BenchmarkResult[]
  calculated: SnapshotCalculated
}

type SnapshotOperationCell = {
  mean: number
  ci: number
  ratio: number
}

type SnapshotCalculated = {
  operations: string[]
  frameworkOrder: string[]
  overallScores: Record<string, number | null>
  operationResults: Record<string, Record<string, SnapshotOperationCell>>
}

interface Operation {
  name: string
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
    action: (page) => clickAndMeasure(page, 'tbody tr:first-child td.col-md-4 a', 'selectRow'),
    teardown: clear,
  },
  {
    name: 'removeRow',
    setup: create1k,
    action: (page) => clickAndMeasure(page, 'tbody tr:first-child td.col-md-1 a', 'removeRow'),
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
]

// Start the benchmark server
function startServer(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    let server = spawn('bun', ['run', './frameworks/*/index.html'], {
      env: {
        ...process.env,
        PORT: PORT.toString(),
      },
      cwd: import.meta.dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let started = false

    server.stdout?.on('data', (data: Buffer) => {
      let output = data.toString()
      if (output.includes('frameworks/') && output.includes('index.html') && !started) {
        started = true
        resolve(server)
      } else {
        console.warn('Unexpected server output:\n\n', output)
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
    }, 5000)
  })
}

// Stop the server
function stopServer(server: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    server.on('close', () => resolve())
    server.kill('SIGTERM')
  })
}

// Save vani results to file for comparison with next run
function saveVaniResults(results: BenchmarkResult[]): void {
  let vaniResults = results.filter((r) => r.framework === 'vani')
  if (vaniResults.length > 0) {
    fs.writeFileSync(VANI_RESULTS_FILE, JSON.stringify(vaniResults, null, 2))
  }
}

function saveSnapshot(payload: SnapshotPayload): void {
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(payload, null, 2))
  console.log(`Saved snapshot to ${SNAPSHOT_FILE}`)
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

// Calculate statistics for an array of numbers
function calcStats(times: number[]) {
  let sorted = [...times].sort((a, b) => a - b)
  return {
    times,
    mean: times.reduce((a, b) => a + b, 0) / times.length,
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
}

function calcConfidenceInterval(times: number[]): number {
  if (times.length < 2) {
    return 0
  }

  let mean = times.reduce((sum, value) => sum + value, 0) / times.length
  let variance =
    times.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (times.length - 1)
  let stddev = Math.sqrt(variance)
  return (1.96 * stddev) / Math.sqrt(times.length)
}

function buildCalculatedSnapshot(
  results: BenchmarkResult[],
  frameworks: SnapshotFramework[],
): SnapshotCalculated {
  let resultsByOperation = new Map<string, Map<string, BenchmarkResult>>()
  for (let result of results) {
    if (!resultsByOperation.has(result.operation)) {
      resultsByOperation.set(result.operation, new Map())
    }
    resultsByOperation.get(result.operation)!.set(result.framework, result)
  }

  let operations = Array.from(resultsByOperation.keys())
  let averageMeansByFramework = frameworks.map((framework) => {
    let totalMeans = operations.map((operation) => {
      let result = resultsByOperation.get(operation)?.get(framework.name)
      if (!result) return Number.POSITIVE_INFINITY
      return result.total.mean
    })
    let validMeans = totalMeans.filter((value) => Number.isFinite(value))
    let averageMean =
      validMeans.length === 0
        ? Number.POSITIVE_INFINITY
        : validMeans.reduce((sum, value) => sum + value, 0) / validMeans.length
    return { framework, averageMean }
  })

  let frameworkOrder = averageMeansByFramework
    .sort((a, b) => a.averageMean - b.averageMean)
    .map((entry) => entry.framework.name)

  let overallScores: Record<string, number | null> = {}
  for (let frameworkName of frameworkOrder) {
    let ratios: number[] = []
    for (let operation of operations) {
      let opResults = resultsByOperation.get(operation)
      if (!opResults) continue
      let means = frameworkOrder.map((name) => {
        let result = opResults.get(name)
        if (!result) return Number.POSITIVE_INFINITY
        return result.total.mean
      })
      let best = Math.min(...means.filter((value) => Number.isFinite(value)))
      let current = opResults.get(frameworkName)
      if (!current || !Number.isFinite(best) || best <= 0) continue
      let mean = current.total.mean
      if (Number.isFinite(mean)) {
        ratios.push(mean / best)
      }
    }
    overallScores[frameworkName] =
      ratios.length === 0 ? null : ratios.reduce((sum, value) => sum + value, 0) / ratios.length
  }
  let normalizedBase = Math.min(
    ...Object.values(overallScores).filter((score): score is number => Number.isFinite(score)),
  )
  if (Number.isFinite(normalizedBase) && normalizedBase > 0) {
    for (let frameworkName of Object.keys(overallScores)) {
      let score = overallScores[frameworkName]
      if (score === null || !Number.isFinite(score)) continue
      overallScores[frameworkName] = score / normalizedBase
    }
  }

  let operationResults: Record<string, Record<string, SnapshotOperationCell>> = {}
  for (let operation of operations) {
    let opResults = resultsByOperation.get(operation)
    if (!opResults) continue
    let means = frameworkOrder.map((frameworkName) => {
      let result = opResults.get(frameworkName)
      if (!result) return Number.POSITIVE_INFINITY
      return result.total.mean
    })
    let best = Math.min(...means.filter((value) => Number.isFinite(value)))

    let perFramework: Record<string, SnapshotOperationCell> = {}
    for (let frameworkName of frameworkOrder) {
      let result = opResults.get(frameworkName)
      if (!result) continue
      let mean = result.total.mean
      let ci = calcConfidenceInterval(result.total.times)
      let ratio = best > 0 ? mean / best : 1
      perFramework[frameworkName] = { mean, ci, ratio }
    }
    operationResults[operation] = perFramework
  }

  return {
    operations,
    frameworkOrder,
    overallScores,
    operationResults,
  }
}

// Aggregate profiling data and calculate medians
function aggregateProfiles(
  profiles: FunctionProfile[][],
  operationName: string,
): FunctionProfile[] | null {
  if (profiles.length === 0) return null

  // Collect all function names across all runs
  let functionMap = new Map<string, number[]>()
  for (let profile of profiles) {
    for (let func of profile) {
      if (!functionMap.has(func.name)) {
        functionMap.set(func.name, [])
      }
      functionMap.get(func.name)!.push(func.time)
    }
  }

  // Calculate median time for each function
  // Also calculate average percentage across runs
  let aggregated: FunctionProfile[] = []
  for (let [name, times] of functionMap.entries()) {
    let sorted = [...times].sort((a, b) => a - b)
    let median = sorted[Math.floor(sorted.length / 2)]

    // Calculate average percentage across all runs
    let percentages: number[] = []
    for (let profile of profiles) {
      let func = profile.find((f) => f.name === name)
      if (func) {
        percentages.push(func.percentage)
      }
    }
    let avgPercentage =
      percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0

    aggregated.push({
      name,
      time: median,
      percentage: avgPercentage,
    })
  }

  // Sort by median time and return top 30
  return aggregated.sort((a, b) => b.time - a.time).slice(0, 30)
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
): Promise<{ results: BenchmarkResult[]; profiles: Map<string, FunctionProfile[][]> }> {
  let results: BenchmarkResult[] = []
  let profiles = new Map<string, FunctionProfile[][]>()

  let url = `${BASE_URL}/${framework}`

  // Filter operations if benchmark filter is specified
  let filteredOperations =
    benchmarkFilter.length > 0
      ? operations.filter((op) => benchmarkFilter.some((filter) => op.name.includes(filter)))
      : operations

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
    await page.goto(url)
    await page.waitForSelector('#run')

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

  return { results, profiles }
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

    console.log('Launching browser...')
    browser = await chromium.launch({ headless })
    let page = await browser.newPage()

    // Enable CPU throttling via CDP
    let client = await page.context().newCDPSession(page)
    await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottling })

    let allFrameworks = getFrameworks()
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

    let allResults: BenchmarkResult[] = []
    let allProfiles = new Map<string, FunctionProfile[][]>()

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
      let { results, profiles } = await benchmarkFramework(page, framework)
      allResults.push(...results)
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

    let frameworkDetails = getProjects('frameworks') as SnapshotFramework[]
    saveSnapshot({
      generatedAt: new Date().toISOString(),
      cpuThrottling,
      runs: benchmarkRuns,
      warmups: warmupRuns,
      headless,
      frameworks: frameworkDetails,
      results: snapshotResults,
      calculated: buildCalculatedSnapshot(snapshotResults, frameworkDetails),
    })

    console.log('Benchmark complete!')
  } finally {
    console.log('Cleaning up...')
    if (browser) {
      await browser.close()
    }
    if (server) {
      await stopServer(server)
    }
  }
}

main().catch((error) => {
  console.error('Benchmark failed:', error)
  process.exit(1)
})
