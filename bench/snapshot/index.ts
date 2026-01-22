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

type SnapshotPayload = {
  generatedAt: string
  cpuThrottling: number
  runs: number
  warmups: number
  headless: boolean
  preflightUsed?: boolean
  frameworks: SnapshotFramework[]
  results: SnapshotResult[]
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
        <div class="border-bottom pb-2 mb-3">
          <h1 class="mb-0">${mainTitle}</h1>
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

  let html = `
    <div class="container py-4">
      <div class="border-bottom pb-2 mb-3">
        <h1 class="mb-0">${mainTitle}</h1>
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
                    `<td class="text-center"><a target="_blank" href="/${fw.path}">view</a></td>`,
                )
                .join('')}
            </tr>
            <tr>
              <td><strong>overall score</strong><br /><small>average of ratios. baseline is the framework with the best mean time.</small></td>
              ${overallScores
                .map((score) => {
                  if (score === null) {
                    return `<td class="text-center">-</td>`
                  }
                  return `
                    <td class="text-center ${cellClass(score)}">
                      <strong>${score.toFixed(2)}</strong>
                      ${score === 1 ? '<div class="small text-muted">baseline</div>' : ''}
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
        <div class="border-bottom pb-2 mb-3">
          <h1 class="mb-0">${mainTitle}</h1>
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
