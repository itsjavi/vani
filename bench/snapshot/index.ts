import benchResults from './results/bench-results.json' with { type: 'json' }

type SnapshotFramework = {
  name: string
  version: string
  path: string
  benchmarkNotes?: string
}

type SnapshotOperationCell = {
  mean: number
  ci: number
  ratio: number
}

type SnapshotStats = {
  times: number[]
  mean: number
  median: number
  min: number
  max: number
}

type SnapshotResult = {
  framework: string
  operation: string
  scripting: SnapshotStats
  total: SnapshotStats
}

type SnapshotResourceMetrics = {
  framework: string
  firstRender: ResourceMetrics
  afterSuite: ResourceMetrics
  delta: ResourceMetrics
}

type ResourceMetrics = {
  jsHeapUsedSize: number
  jsHeapTotalSize: number
  taskDuration: number
  scriptDuration: number
  layoutDuration: number
  recalcStyleDuration: number
}

type SnapshotPayload = {
  generatedAt: string
  cpuThrottling: number
  runs: number
  warmups: number
  headless: boolean
  preflightUsed?: boolean
  frameworks: SnapshotFramework[]
  results: SnapshotResult[]
  resourceMetrics?: SnapshotResourceMetrics[]
  calculated?: SnapshotCalculated
}

type SnapshotCalculated = {
  operations: string[]
  frameworkOrder: string[]
  overallScores: Record<string, number | null>
  operationResults: Record<string, Record<string, SnapshotOperationCell>>
}

const OPERATION_LABELS: Record<
  string,
  {
    title: string
    description: string
  }
> = {
  create1k: {
    title: 'create rows',
    description: 'creating 1,000 rows. (5 warmup runs).',
  },
  replace1k: {
    title: 'replace all rows',
    description: 'updating all 1,000 rows. (5 warmup runs).',
  },
  update: {
    title: 'partial update',
    description: 'updating every 10th row for 1,000 rows. (3 warmup runs). 4x CPU slowdown.',
  },
  selectRow: {
    title: 'select row',
    description: 'highlighting a selected row. (5 warmup runs). 4x CPU slowdown.',
  },
  swapRows: {
    title: 'swap rows',
    description: 'swap 2 rows for table with 1,000 rows. (5 warmup runs). 4x CPU slowdown.',
  },
  removeRow: {
    title: 'remove row',
    description: 'removing one row. (5 warmup runs). 2x CPU slowdown.',
  },
  create10k: {
    title: 'create many rows',
    description: 'creating 10,000 rows. (5 warmup runs).',
  },
  append1k: {
    title: 'append rows to large table',
    description: 'appending 1,000 to a table of 1,000 rows. (5 warmup runs).',
  },
  clear: {
    title: 'clear rows',
    description: 'clearing a table with 1,000 rows. (5 warmup runs). 4x CPU slowdown.',
  },
  sortAsc: {
    title: 'sort rows (asc)',
    description: 'sort rows ascending. (5 warmup runs).',
  },
  sortDesc: {
    title: 'sort rows (desc)',
    description: 'sort rows descending. (5 warmup runs).',
  },
}

const app = document.querySelector('#app')
if (!app) throw new Error('#app not found')
const appRoot = app

const mainTitle = 'Frontend Framework Benchmarks - Results Snapshot'

function formatNumber(value: number): string {
  if (Number.isNaN(value)) return '-'
  return value.toFixed(1)
}

function formatBytesToMB(value: number): string {
  if (!Number.isFinite(value)) return '-'
  return (value / (1024 * 1024)).toFixed(1)
}

function formatSecondsToMs(value: number): string {
  if (!Number.isFinite(value)) return '-'
  return (value * 1000).toFixed(1)
}

function buildMetricCells(values: number[], formatter: (value: number) => string): string {
  const finiteValues = values.filter((value) => Number.isFinite(value))
  const best = finiteValues.length > 0 ? Math.min(...finiteValues) : Number.NaN
  return values
    .map((value) => {
      if (!Number.isFinite(value)) {
        return `<td class="text-center">-</td>`
      }
      const ratio = Number.isFinite(best) && best > 0 ? value / best : Number.NaN
      const className = Number.isFinite(ratio) ? ` ${cellClass(ratio)}` : ''
      return `<td class="text-center${className}">${formatter(value)}</td>`
    })
    .join('')
}

function cellClass(ratio: number): string {
  if (ratio <= 1.1) return 'cell-good'
  if (ratio <= 1.3) return 'cell-ok'
  if (ratio <= 1.7) return 'cell-warn'
  return 'cell-bad'
}

function buildHeaderCell(framework: SnapshotFramework): string {
  return `${framework.name}<br /><small>v${framework.version}</small>`
}

function render(snapshot: SnapshotPayload): void {
  if (!snapshot.calculated) {
    appRoot.innerHTML = `
      <div class="container py-4">
        <div class="border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
          <h1 class="mb-0">${mainTitle}</h1>
          <a
            class="bench-github-link d-inline-flex align-items-center justify-content-center"
            href="https://github.com/itsjavi/vani/tree/main/bench"
            target="_blank"
            rel="noreferrer"
            aria-label="View benchmarks on GitHub"
            title="View benchmarks on GitHub"
          >
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path
                d="M12 2c-5.52 0-10 4.48-10 10 0 4.41 2.87 8.15 6.84 9.47.5.09.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.6-3.37-1.34-3.37-1.34-.46-1.15-1.12-1.46-1.12-1.46-.91-.63.07-.62.07-.62 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.93.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.47 9.47 0 0 1 5.01 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.21 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.58 4.95.36.31.69.93.69 1.88 0 1.35-.01 2.44-.01 2.77 0 .26.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z"
              />
            </svg>
          </a>
        </div>
        <div class="alert alert-warning">
          This snapshot is missing calculated data. Re-run the benchmark runner to regenerate it.
        </div>
      </div>
    `
    return
  }

  const calculated = snapshot.calculated
  let frameworkMap = new Map(snapshot.frameworks.map((framework) => [framework.name, framework]))
  let frameworks =
    calculated.frameworkOrder.length > 0
      ? calculated.frameworkOrder
          .map((name) => frameworkMap.get(name))
          .filter((framework): framework is SnapshotFramework => Boolean(framework))
      : snapshot.frameworks
  let operations = calculated.operations
  let scoredFrameworks = frameworks.map((framework, index) => ({
    framework,
    score: calculated.overallScores[framework.name] ?? null,
    index,
  }))
  scoredFrameworks.sort((a, b) => {
    let aScore = a.score ?? Number.POSITIVE_INFINITY
    let bScore = b.score ?? Number.POSITIVE_INFINITY
    if (aScore === bScore) return a.index - b.index
    return aScore - bScore
  })
  frameworks = scoredFrameworks.map((item) => item.framework)
  let frameworkNames = frameworks.map((fw) => fw.name)
  let overallScores = frameworkNames.map(
    (frameworkName) => calculated.overallScores[frameworkName] ?? null,
  )
  let bestOverallScore = Math.min(
    ...overallScores.filter((score): score is number => Number.isFinite(score)),
  )
  let resourceMetricsByFramework = new Map(
    (snapshot.resourceMetrics ?? []).map((entry) => [entry.framework, entry]),
  )

  let html = `
    <div class="container py-4">
      <div class="border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
        <h1 class="mb-0">${mainTitle}</h1>
        <a
          class="bench-github-link d-inline-flex align-items-center justify-content-center"
          href="https://github.com/itsjavi/vani/tree/main/bench"
          target="_blank"
          rel="noreferrer"
          aria-label="View benchmarks on GitHub"
          title="View benchmarks on GitHub"
        >
          <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path
              d="M12 2c-5.52 0-10 4.48-10 10 0 4.41 2.87 8.15 6.84 9.47.5.09.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.6-3.37-1.34-3.37-1.34-.46-1.15-1.12-1.46-1.12-1.46-.91-.63.07-.62.07-.62 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.93.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.47 9.47 0 0 1 5.01 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.21 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.58 4.95.36.31.69.93.69 1.88 0 1.35-.01 2.44-.01 2.77 0 .26.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z"
            />
          </svg>
        </a>
      </div>
      <p class="lead mb-2">
        Duration in milliseconds +/- 95% confidence interval.
      </p>
      <p class="text-muted mb-4">
        Generated at ${new Date(snapshot.generatedAt).toLocaleString()} | CPU throttling ${
          snapshot.cpuThrottling
        }x | ${snapshot.warmups} warmups | ${snapshot.runs} runs | headless ${
          snapshot.headless ? 'yes' : 'no'
        } | preflight ${(snapshot.preflightUsed ?? true) ? 'yes' : 'no'}
      </p>
      <div class="table-responsive shadow-sm rounded bg-white">
        <table class="table table-bordered table-hover align-middle mb-0 test-results">
          <thead>
            <tr class="table-active">
              <th style="width: 32%">Name<br /><small>Duration for...</small></th>
              ${frameworks.map((fw) => `<th class="text-center">${buildHeaderCell(fw)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="table-active" style="--bs-table-bg-state: #f5f5f5 !important;">
              <td>Implementation notes</td>
              ${frameworks
                .map((framework) => {
                  const notes = framework.benchmarkNotes?.trim()
                  return `<td class="text-center small">${notes ? notes : '-'}</td>`
                })
                .join('')}
            </tr>
            <tr>
              <td>Implementation link</td>
              ${frameworks
                .map(
                  (fw) =>
                    `<td class="text-center"><a target="_blank" href="../${fw.path}">view</a></td>`,
                )
                .join('')}
            </tr>
            <tr>
              <td><strong>overall score</strong><br /><small>average total time (ms).</small></td>
              ${overallScores
                .map((score) => {
                  if (score === null) {
                    return `<td class="text-center">-</td>`
                  }
                  const ratio =
                    Number.isFinite(bestOverallScore) && bestOverallScore > 0
                      ? score / bestOverallScore
                      : Number.NaN
                  const className = Number.isFinite(ratio) ? ` ${cellClass(ratio)}` : ''
                  return `
                    <td class="text-center${className}">
                      <strong>${formatNumber(score)} ms</strong>
                    </td>
                  `
                })
                .join('')}
            </tr>
            ${operations
              .map((operation) => {
                let label = OPERATION_LABELS[operation]
                let prettyLabel = label
                  ? `<div><strong>${label.title}</strong></div><small>${label.description}</small>`
                  : operation

                return `
                  <tr>
                    <td>${prettyLabel}</td>
                    ${frameworkNames
                      .map((frameworkName) => {
                        let result = calculated.operationResults[operation]?.[frameworkName]
                        if (!result) {
                          return `<td class="text-center">-</td>`
                        }
                        return `
                          <td class="text-center ${cellClass(result.ratio)}">
                            <div>${formatNumber(result.mean)} <small>+/- ${formatNumber(result.ci)}</small></div>
                            <small>(${result.ratio.toFixed(2)})</small>
                          </td>
                        `
                      })
                      .join('')}
                  </tr>
                `
              })
              .join('')}
          </tbody>
        </table>
      </div>
      ${
        snapshot.resourceMetrics && snapshot.resourceMetrics.length > 0
          ? `
      <div class="table-responsive shadow-sm rounded bg-white mt-4">
        <table class="table table-bordered table-hover align-middle mb-0 test-results">
          <thead>
            <tr class="table-active">
              <th style="width: 32%">Resource metrics<br /><small>CDP Performance.getMetrics</small></th>
              ${frameworks.map((fw) => `<th class="text-center">${buildHeaderCell(fw)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Heap used (first render, MB)</strong></td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.firstRender.jsHeapUsedSize ??
                    Number.NaN,
                ),
                formatBytesToMB,
              )}
            </tr>
            <tr>
              <td>Heap used (after suite, MB)</td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.afterSuite.jsHeapUsedSize ??
                    Number.NaN,
                ),
                formatBytesToMB,
              )}
            </tr>
            <tr>
              <td>Heap used delta (MB)</td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.delta.jsHeapUsedSize ??
                    Number.NaN,
                ),
                formatBytesToMB,
              )}
            </tr>
            <tr>
              <td><strong>CPU task duration delta (ms)</strong></td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.delta.taskDuration ?? Number.NaN,
                ),
                formatSecondsToMs,
              )}
            </tr>
            <tr>
              <td>CPU script duration delta (ms)</td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.delta.scriptDuration ??
                    Number.NaN,
                ),
                formatSecondsToMs,
              )}
            </tr>
            <tr>
              <td>CPU task duration (after suite, ms)</td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.afterSuite.taskDuration ??
                    Number.NaN,
                ),
                formatSecondsToMs,
              )}
            </tr>
            <tr>
              <td>CPU script duration (after suite, ms)</td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.afterSuite.scriptDuration ??
                    Number.NaN,
                ),
                formatSecondsToMs,
              )}
            </tr>
            <tr>
              <td><strong>CPU layout duration delta (ms)</strong></td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.delta.layoutDuration ??
                    Number.NaN,
                ),
                formatSecondsToMs,
              )}
            </tr>
            <tr>
              <td>CPU recalc style duration delta (ms)</td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.delta.recalcStyleDuration ??
                    Number.NaN,
                ),
                formatSecondsToMs,
              )}
            </tr>
            <tr>
              <td>CPU layout duration (after suite, ms)</td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.afterSuite.layoutDuration ??
                    Number.NaN,
                ),
                formatSecondsToMs,
              )}
            </tr>
            <tr>
              <td>CPU recalc style duration (after suite, ms)</td>
              ${buildMetricCells(
                frameworkNames.map(
                  (frameworkName) =>
                    resourceMetricsByFramework.get(frameworkName)?.afterSuite.recalcStyleDuration ??
                    Number.NaN,
                ),
                formatSecondsToMs,
              )}
            </tr>
          </tbody>
        </table>
      </div>
          `
          : ''
      }
    </div>
  `

  appRoot.innerHTML = html
}

async function loadSnapshot(): Promise<void> {
  try {
    render(benchResults)
  } catch (error) {
    appRoot.innerHTML = `
      <div class="container py-4">
        <div class="border-bottom pb-2 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-3">
          <h1 class="mb-0">${mainTitle}</h1>
          <a
            class="bench-github-link d-inline-flex align-items-center justify-content-center"
            href="https://github.com/itsjavi/vani/tree/main/bench"
            target="_blank"
            rel="noreferrer"
            aria-label="View benchmarks on GitHub"
            title="View benchmarks on GitHub"
          >
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path
                d="M12 2c-5.52 0-10 4.48-10 10 0 4.41 2.87 8.15 6.84 9.47.5.09.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.6-3.37-1.34-3.37-1.34-.46-1.15-1.12-1.46-1.12-1.46-.91-.63.07-.62.07-.62 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.93.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.47 9.47 0 0 1 5.01 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.21 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.58 4.95.36.31.69.93.69 1.88 0 1.35-.01 2.44-.01 2.77 0 .26.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z"
              />
            </svg>
          </a>
        </div>
        <div class="alert alert-danger">
          Failed to load bench-snapshot.json. Run the benchmark runner to generate it.
        </div>
      </div>
    `
    console.error(error)
  }
}

const style = document.createElement('style')
style.textContent = `
  .table > tbody > tr > td {
    vertical-align: middle;
  }
  .cell-good {
    --bs-table-bg: #5cb85c22;
    --bs-table-color: #1f3d1f;
    background-color: #5cb85c22;
  }
  .cell-ok {
    --bs-table-bg: #8ad17d33;
    --bs-table-color: #1f3d1f;
    background-color: #8ad17d33;
  }
  .cell-warn {
    --bs-table-bg: #f0ad4e33;
    --bs-table-color: #5a3b09;
    background-color: #f0ad4e33;
  }
  .cell-bad {
    --bs-table-bg: #d9534f33;
    --bs-table-color: #5a1a18;
    background-color: #d9534f33;
  }
`
document.head.append(style)

void loadSnapshot()
