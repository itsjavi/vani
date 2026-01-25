import benchResults from '../../../results/bench-results.json' with { type: 'json' }
import {
  type LegacySnapshotPayload,
  type SnapshotFramework,
  type SnapshotIndex,
  type SnapshotIndexEntry,
  type SnapshotPayload,
  formatBytesToMB,
  formatNumber,
  formatSecondsToMs,
  getCellClass,
  normalizeSnapshot,
} from '@/bench/core'
import { cn } from '@/bench/lib/utils'
import { component, reactive, renderToDOM, signal, type Handle } from 'vani-local'

type SnapshotPayloadLike = SnapshotPayload | LegacySnapshotPayload

const OPERATION_LABELS: Record<string, { title: string; description: string }> = {
  create1k: { title: 'create rows', description: 'creating 1,000 rows. (5 warmup runs).' },
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
  create10k: { title: 'create many rows', description: 'creating 10,000 rows. (5 warmup runs).' },
  append1k: {
    title: 'append rows to large table',
    description: 'appending 1,000 to a table of 1,000 rows. (5 warmup runs).',
  },
  clear: {
    title: 'clear rows',
    description: 'clearing a table with 1,000 rows. (5 warmup runs). 4x CPU slowdown.',
  },
  sortAsc: { title: 'sort rows (asc)', description: 'sort rows ascending. (5 warmup runs).' },
  sortDesc: { title: 'sort rows (desc)', description: 'sort rows descending. (5 warmup runs).' },
  pokeAppend40: { title: 'append boxes', description: 'appending 40 pokeboxes. (5 warmup runs).' },
  pokePrepend40: {
    title: 'prepend boxes',
    description: 'prepending 40 pokeboxes. (5 warmup runs).',
  },
  pokeRemoveEvery3rdBox: {
    title: 'remove boxes (every 3rd)',
    description: 'removing every 3rd pokebox. (5 warmup runs).',
  },
  pokeSwapBoxSets: {
    title: 'swap box sets',
    description: 'swapping first and last box sets. (5 warmup runs).',
  },
  pokeReplaceFirst6Boxes: {
    title: 'replace box contents',
    description: 'replacing the first 6 pokeboxes with new pokemon. (5 warmup runs).',
  },
  pokeRemoveForms: {
    title: 'remove form variants',
    description: 'removing form variants and redistributing cells. (5 warmup runs).',
  },
  pokeToggleAllCaught: {
    title: 'toggle all caught',
    description: 'toggling all pokebox cells as caught. (5 warmup runs).',
  },
  pokeToggleEvery3rdCaught: {
    title: 'toggle every 3rd cell',
    description: 'toggling caught state for every 3rd cell. (5 warmup runs).',
  },
}

const app = document.querySelector('#app')
if (!app) throw new Error('#app not found')

const mainTitle = 'Frontend Framework Benchmarks - Results Snapshot'
const basePath = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/')
const dataBaseUrl = `${basePath}data/`
const fallbackSnapshot = normalizeSnapshot(benchResults as SnapshotPayloadLike)

// ─────────────────────────────────────────────
// Reactive State (Signals)
// ─────────────────────────────────────────────
const [index, setIndex] = signal<SnapshotIndex | null>(null)
const [selectedId, setSelectedId] = signal<string | null>(null)
const [compareId, setCompareId] = signal<string | null>(null)
const [snapshot, setSnapshot] = signal<SnapshotPayload | null>(null)
const [compareSnapshot, setCompareSnapshot] = signal<SnapshotPayload | null>(null)
const [error, setError] = signal<string | null>(null)
const [loading, setLoading] = signal(true)

// ─────────────────────────────────────────────
// Data Fetching
// ─────────────────────────────────────────────
const fetchIndex = async (): Promise<SnapshotIndex | null> => {
  try {
    const response = await fetch(`${dataBaseUrl}bench-results-index.json`, { cache: 'no-store' })
    if (!response.ok) return null
    const data = (await response.json()) as SnapshotIndex
    if (!data || !Array.isArray(data.entries)) return null
    return data
  } catch {
    return null
  }
}

const fetchSnapshot = async (entry: SnapshotIndexEntry): Promise<SnapshotPayload | null> => {
  try {
    const response = await fetch(`${dataBaseUrl}${entry.file}`, { cache: 'no-store' })
    if (!response.ok) {
      if (entry.file === 'bench-results.json') return fallbackSnapshot
      return null
    }
    const data = (await response.json()) as SnapshotPayloadLike
    return normalizeSnapshot(data)
  } catch {
    if (entry.file === 'bench-results.json') return fallbackSnapshot
    return null
  }
}

const selectRun = async (id: string | null, newCompareId?: string | null) => {
  if (!id) return
  const currentIndex = index()
  if (!currentIndex) return
  const entry = currentIndex.entries.find((item) => item.id === id)
  if (!entry) return

  setLoading(true)
  setError(null)

  const snapshotData = await fetchSnapshot(entry)
  if (!snapshotData) {
    setLoading(false)
    setError('Failed to load the selected snapshot.')
    return
  }

  const resolvedCompareId = newCompareId ?? compareId()
  const compareEntry = resolvedCompareId
    ? currentIndex.entries.find((item) => item.id === resolvedCompareId)
    : null
  const compareData = compareEntry ? await fetchSnapshot(compareEntry) : null

  setSnapshot(snapshotData)
  setCompareSnapshot(compareData)
  setSelectedId(id)
  setCompareId(compareEntry ? compareEntry.id : null)
  setLoading(false)
  setError(null)
}

const init = async () => {
  const indexData = await fetchIndex()
  if (!indexData || indexData.entries.length === 0) {
    // Use fallback
    const fallbackEntry: SnapshotIndexEntry = {
      id: 'latest',
      file: 'bench-results.json',
      generatedAt: fallbackSnapshot.generatedAt,
      machine: fallbackSnapshot.machine,
      cpuThrottling: fallbackSnapshot.cpuThrottling,
      runs: fallbackSnapshot.runs,
      warmups: fallbackSnapshot.warmups,
      headless: fallbackSnapshot.headless,
      preflightUsed: fallbackSnapshot.preflightUsed,
      frameworks: fallbackSnapshot.frameworks,
    }
    setIndex({ latestId: 'latest', entries: [fallbackEntry] })
    setSelectedId('latest')
    setSnapshot(fallbackSnapshot)
    setCompareSnapshot(null)
    setLoading(false)
    return
  }

  setIndex(indexData)
  const initialId = indexData.latestId ?? indexData.entries[0]?.id ?? null
  setSelectedId(initialId)
  if (initialId) {
    await selectRun(initialId, null)
  } else {
    setLoading(false)
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getRunLabel = (entry: SnapshotIndexEntry) => {
  const date = new Date(entry.generatedAt)
  const label = Number.isNaN(date.getTime())
    ? entry.generatedAt
    : date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
  return `${label} • ${entry.frameworks.map((fw) => fw.name).join(', ')}`
}

const renderHeaderCell = (framework: SnapshotFramework) => (
  <span>
    {framework.name}
    <br />
    <small className={cn('text-slate-500')}>v{framework.version}</small>
  </span>
)

const buildImplementationLink = (path: string, view: string) => {
  const url = new URL(`../${path}`, window.location.href)
  url.searchParams.set('view', view)
  return url.toString()
}

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────
const ResultsHeader = reactive((_, handle: Handle) => {
  // Signals read in render are auto-tracked via reactive()
  return () => {
    const currentSnapshot = snapshot()
    const entries = index()?.entries ?? []
    const hasEntries = entries.length > 0
    const isLoading = loading()
    const currentSelectedId = selectedId()
    const currentCompareId = compareId()
    const disabled = isLoading || !hasEntries

    return (
      <div className={cn('rounded-xl border border-slate-200 bg-white p-6')}>
        <div className={cn('flex flex-wrap items-start justify-between gap-4')}>
          <div className={cn('space-y-2')}>
            <h1 className={cn('text-3xl font-bold text-slate-900')}>{mainTitle}</h1>
            <p className={cn('text-base text-slate-600')}>
              Duration in milliseconds +/- 95% confidence interval.
            </p>
            {/* Example of JSX fragment shorthand <>...</> */}
            {currentSnapshot ? (
              <>
                {currentSnapshot.machine ? (
                  <p className={cn('text-sm font-semibold text-slate-700')}>
                    Machine: {currentSnapshot.machine}
                  </p>
                ) : null}
                <p className={cn('text-sm text-slate-500')}>
                  Generated at {new Date(currentSnapshot.generatedAt).toLocaleString()} | CPU
                  throttling {currentSnapshot.cpuThrottling}x | {currentSnapshot.warmups} warmups |{' '}
                  {currentSnapshot.runs} runs | headless {currentSnapshot.headless ? 'yes' : 'no'} |
                  preflight {(currentSnapshot.preflightUsed ?? true) ? 'yes' : 'no'}
                </p>
              </>
            ) : null}
          </div>
          <a
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900',
            )}
            href="https://github.com/itsjavi/vani/tree/main/bench"
            target="_blank"
            rel="noreferrer"
            aria-label="View benchmarks on GitHub"
            title="View benchmarks on GitHub"
          >
            <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
              <path d="M12 2c-5.52 0-10 4.48-10 10 0 4.41 2.87 8.15 6.84 9.47.5.09.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.6-3.37-1.34-3.37-1.34-.46-1.15-1.12-1.46-1.12-1.46-.91-.63.07-.62.07-.62 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.93.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.47 9.47 0 0 1 5.01 0c1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.21 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.58 4.95.36.31.69.93.69 1.88 0 1.35-.01 2.44-.01 2.77 0 .26.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
            </svg>
          </a>
        </div>
        <div className={cn('mt-4 grid gap-4 lg:grid-cols-2')}>
          <label className={cn('space-y-1 text-sm font-medium text-slate-700')}>
            Run
            <select
              className={cn(
                'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm',
              )}
              value={currentSelectedId ?? ''}
              disabled={disabled}
              onchange={(event) => {
                const nextId = (event.currentTarget as HTMLSelectElement).value
                void selectRun(nextId || null, null)
              }}
            >
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {getRunLabel(entry)}
                </option>
              ))}
            </select>
          </label>
          <label className={cn('space-y-1 text-sm font-medium text-slate-700')}>
            Compare to
            <select
              className={cn(
                'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm',
              )}
              value={currentCompareId ?? ''}
              disabled={disabled}
              onchange={(event) => {
                const nextId = (event.currentTarget as HTMLSelectElement).value
                void selectRun(currentSelectedId, nextId || null)
              }}
            >
              <option value="">None</option>
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {getRunLabel(entry)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    )
  }
})

const ResultsBody = reactive((_, handle: Handle) => {
  // Signals read in render are auto-tracked via reactive()
  return () => {
    const isLoading = loading()
    const currentError = error()
    const currentSnapshot = snapshot()
    const currentCompareSnapshot = compareSnapshot()

    if (isLoading) {
      return (
        <div className={cn('rounded-xl border border-slate-200 bg-white p-6 text-slate-700')}>
          Loading benchmark results...
        </div>
      )
    }

    if (currentError) {
      return (
        <div className={cn('rounded-xl border border-red-200 bg-red-50 p-6 text-red-700')}>
          {currentError}
        </div>
      )
    }

    if (!currentSnapshot) {
      return (
        <div className={cn('rounded-xl border border-slate-200 bg-white p-6 text-slate-700')}>
          No results available yet. Run the benchmark runner to generate a snapshot.
        </div>
      )
    }

    const calculated = currentSnapshot.calculated
    const compareCalculated = currentCompareSnapshot?.calculated

    if (!calculated) {
      return (
        <div className={cn('rounded-xl border border-slate-200 bg-white p-6 text-slate-700')}>
          This snapshot is missing calculated data. Re-run the benchmark runner to regenerate it.
        </div>
      )
    }

    const frameworkMap = new Map(
      currentSnapshot.frameworks.map((framework) => [framework.id, framework]),
    )
    const operations = calculated.operations
    const resourceMetricsByFramework = new Map(
      (currentSnapshot.resourceMetrics ?? []).map((entry) => [entry.framework, entry]),
    )
    const operationSuites = calculated.operationSuites ?? {}
    const suiteScores = calculated.suiteScores ?? {}
    const suiteOrder = ['datatable', 'pokeboxes']
    const suiteTitles: Record<string, string> = {
      datatable: 'Data Table Benchmarks',
      pokeboxes: 'Pokeboxes Benchmarks',
    }

    const getFrameworksForSuite = (suiteId: string): SnapshotFramework[] => {
      const suiteData = suiteScores[suiteId]
      const frameworkOrder = suiteData?.frameworkOrder ?? calculated.frameworkOrder
      const suiteOverallScores = suiteData?.overallScores ?? calculated.overallScores

      const frameworks =
        frameworkOrder.length > 0
          ? frameworkOrder
              .map((frameworkId) => frameworkMap.get(frameworkId))
              .filter((framework): framework is SnapshotFramework => Boolean(framework))
          : currentSnapshot.frameworks

      const scoredFrameworks = frameworks.map((framework, idx) => ({
        framework,
        score: suiteOverallScores[framework.id] ?? null,
        index: idx,
      }))
      scoredFrameworks.sort((a, b) => {
        const aScore = a.score ?? Number.POSITIVE_INFINITY
        const bScore = b.score ?? Number.POSITIVE_INFINITY
        if (aScore === bScore) return a.index - b.index
        return aScore - bScore
      })
      return scoredFrameworks.map((item) => item.framework)
    }

    const suites = suiteOrder
      .map((suiteId) => {
        const suiteFrameworks = getFrameworksForSuite(suiteId)
        const suiteData = suiteScores[suiteId]
        const suiteOverallScores = suiteData?.overallScores ?? calculated.overallScores
        const frameworkIds = suiteFrameworks.map((fw) => fw.id)
        const overallScoresArray = frameworkIds.map(
          (frameworkId) => suiteOverallScores[frameworkId] ?? null,
        )
        const bestOverallScore = Math.min(
          ...overallScoresArray.filter((score): score is number => Number.isFinite(score)),
        )

        return {
          id: suiteId,
          title: suiteTitles[suiteId] ?? suiteId,
          operations: operations.filter(
            (operation) => (operationSuites[operation] ?? 'datatable') === suiteId,
          ),
          frameworks: suiteFrameworks,
          frameworkIds,
          overallScores: overallScoresArray,
          bestOverallScore,
        }
      })
      .filter((suite) => suite.operations.length > 0)

    const globalFrameworks =
      calculated.frameworkOrder.length > 0
        ? calculated.frameworkOrder
            .map((frameworkId) => frameworkMap.get(frameworkId))
            .filter((framework): framework is SnapshotFramework => Boolean(framework))
        : currentSnapshot.frameworks
    const globalFrameworkIds = globalFrameworks.map((fw) => fw.id)

    const renderComparison = (value: number, compareValue?: number | null) => {
      if (!Number.isFinite(compareValue ?? Number.NaN)) return null
      const delta = value - (compareValue ?? 0)
      const deltaPct = compareValue ? (delta / compareValue) * 100 : 0
      const isPositive = delta > 0
      const text = `${isPositive ? '+' : ''}${formatNumber(delta)} ms (${isPositive ? '+' : ''}${formatNumber(deltaPct)}%)`
      return <small className={cn('text-xs text-slate-500')}>{text}</small>
    }

    return (
      <div className={cn('space-y-6')}>
        {suites.map((suite) => {
          const compareSuite = compareCalculated?.suiteScores?.[suite.id]
          const compareOverallScores =
            compareSuite?.overallScores ?? compareCalculated?.overallScores ?? {}

          return (
            <div
              key={suite.id}
              className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white')}
            >
              <div className={cn('border-b border-slate-200 bg-slate-50 px-5 py-3')}>
                <h2 className={cn('text-xs font-semibold tracking-wide text-slate-700 uppercase')}>
                  {suite.title}
                </h2>
              </div>
              <table className={cn('w-full border-collapse text-sm')}>
                <thead>
                  <tr>
                    <th className={cn('border border-slate-200 px-3 py-2 text-left')}>
                      Name
                      <br />
                      <small className={cn('text-slate-500')}>Duration for...</small>
                    </th>
                    {suite.frameworks.map((fw) => (
                      <th
                        key={fw.id}
                        className={cn('border border-slate-200 px-3 py-2 text-center')}
                      >
                        {renderHeaderCell(fw)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className={cn('bg-slate-50')}>
                    <td className={cn('border border-slate-200 px-3 py-2')}>
                      Implementation notes
                    </td>
                    {suite.frameworks.map((framework) => {
                      const notes = framework.implementationNotes?.trim()
                      return (
                        <td
                          key={framework.id}
                          className={cn('border border-slate-200 px-3 py-2 text-center text-sm')}
                        >
                          {notes || '-'}
                        </td>
                      )
                    })}
                  </tr>
                  <tr>
                    <td className={cn('border border-slate-200 px-3 py-2')}>Implementation link</td>
                    {suite.frameworks.map((fw) => (
                      <td
                        key={fw.id}
                        className={cn('border border-slate-200 px-3 py-2 text-center')}
                      >
                        <a
                          className={cn(
                            'inline-flex items-center justify-center rounded px-2 py-1 text-slate-700 hover:bg-slate-100',
                          )}
                          target="_blank"
                          rel="noreferrer"
                          href={buildImplementationLink(fw.path, suite.id)}
                        >
                          view
                        </a>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className={cn('border border-slate-200 px-3 py-2')}>
                      <strong>overall score</strong>
                      <br />
                      <small className={cn('text-slate-500')}>average total time (ms).</small>
                    </td>
                    {suite.overallScores.map((score, idx) => {
                      if (score === null) {
                        return (
                          <td
                            key={`overall-${suite.frameworkIds[idx]}`}
                            className={cn('border border-slate-200 px-3 py-2 text-center')}
                          >
                            -
                          </td>
                        )
                      }
                      const ratio =
                        Number.isFinite(suite.bestOverallScore) && suite.bestOverallScore > 0
                          ? score / suite.bestOverallScore
                          : Number.NaN
                      const cellClass = Number.isFinite(ratio) ? getCellClass(ratio) : null
                      const className = cellClass ? `bench-cell-${cellClass}` : ''
                      const frameworkId = suite.frameworkIds[idx]
                      const compareScore = compareOverallScores[frameworkId]
                      return (
                        <td
                          key={`overall-${frameworkId}`}
                          className={cn('border border-slate-200 px-3 py-2 text-center', className)}
                        >
                          <div className={cn('font-semibold')}>{formatNumber(score)} ms</div>
                          {renderComparison(score, compareScore)}
                        </td>
                      )
                    })}
                  </tr>
                  {suite.operations.map((operation) => {
                    const label = OPERATION_LABELS[operation]
                    const operationResults = calculated.operationResults[operation] ?? {}
                    const compareOperationResults =
                      compareCalculated?.operationResults?.[operation] ?? {}
                    const bestRatio = Math.min(
                      ...Object.values(operationResults)
                        .map((result) => result.ratio)
                        .filter((ratio) => Number.isFinite(ratio)),
                    )
                    const worstRatio = Math.max(
                      ...Object.values(operationResults)
                        .map((result) => result.ratio)
                        .filter((ratio) => Number.isFinite(ratio)),
                    )

                    return (
                      <tr key={operation}>
                        <td className={cn('border border-slate-200 px-3 py-2')}>
                          {label ? (
                            <div className={cn('space-y-1')}>
                              <div className={cn('font-semibold text-slate-900')}>
                                {label.title}
                              </div>
                              <small className={cn('text-slate-500')}>{label.description}</small>
                            </div>
                          ) : (
                            operation
                          )}
                        </td>
                        {suite.frameworkIds.map((frameworkId) => {
                          const result = operationResults[frameworkId]
                          if (!result) {
                            return (
                              <td
                                key={`${operation}-${frameworkId}`}
                                className={cn('border border-slate-200 px-3 py-2 text-center')}
                              >
                                -
                              </td>
                            )
                          }
                          const isBest =
                            Number.isFinite(bestRatio) && result.ratio <= bestRatio + 1e-6
                          const isWorst =
                            Number.isFinite(worstRatio) && result.ratio >= worstRatio - 1e-6
                          const cellClass = getCellClass(result.ratio)
                          const className = cellClass ? `bench-cell-${cellClass}` : ''
                          const compareResult = compareOperationResults?.[frameworkId]
                          return (
                            <td
                              key={`${operation}-${frameworkId}`}
                              className={cn(
                                'border border-slate-200 px-3 py-2 text-center',
                                className,
                                {
                                  'bench-cell-best': isBest,
                                  'bench-cell-worst': isWorst,
                                  'font-semibold': isBest,
                                },
                              )}
                            >
                              <div>
                                {formatNumber(result.mean)}{' '}
                                <small>+/- {formatNumber(result.ci)}</small>
                              </div>
                              <small className={cn('text-slate-500')}>
                                ({result.ratio.toFixed(2)})
                              </small>
                              {renderComparison(result.mean, compareResult?.mean)}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}

        {currentSnapshot.resourceMetrics && currentSnapshot.resourceMetrics.length > 0 ? (
          <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white')}>
            <table className={cn('w-full border-collapse text-sm')}>
              <thead>
                <tr>
                  <th className={cn('border border-slate-200 px-3 py-2 text-left')}>
                    Resource metrics
                    <br />
                    <small className={cn('text-slate-500')}>CDP Performance.getMetrics</small>
                  </th>
                  {globalFrameworks.map((fw) => (
                    <th key={fw.id} className={cn('border border-slate-200 px-3 py-2 text-center')}>
                      {renderHeaderCell(fw)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    label: 'Heap used (first render, MB)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.firstRender.jsHeapUsedSize ??
                        Number.NaN,
                    ),
                    formatter: formatBytesToMB,
                  },
                  {
                    label: 'Heap used (after suite, MB)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.afterSuite.jsHeapUsedSize ??
                        Number.NaN,
                    ),
                    formatter: formatBytesToMB,
                  },
                  {
                    label: 'Heap used delta (MB)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.delta.jsHeapUsedSize ??
                        Number.NaN,
                    ),
                    formatter: formatBytesToMB,
                  },
                  {
                    label: 'CPU task duration delta (ms)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.delta.taskDuration ??
                        Number.NaN,
                    ),
                    formatter: formatSecondsToMs,
                  },
                  {
                    label: 'CPU script duration delta (ms)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.delta.scriptDuration ??
                        Number.NaN,
                    ),
                    formatter: formatSecondsToMs,
                  },
                  {
                    label: 'CPU task duration (after suite, ms)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.afterSuite.taskDuration ??
                        Number.NaN,
                    ),
                    formatter: formatSecondsToMs,
                  },
                  {
                    label: 'CPU script duration (after suite, ms)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.afterSuite.scriptDuration ??
                        Number.NaN,
                    ),
                    formatter: formatSecondsToMs,
                  },
                  {
                    label: 'CPU layout duration delta (ms)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.delta.layoutDuration ??
                        Number.NaN,
                    ),
                    formatter: formatSecondsToMs,
                  },
                  {
                    label: 'CPU recalc style duration delta (ms)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.delta.recalcStyleDuration ??
                        Number.NaN,
                    ),
                    formatter: formatSecondsToMs,
                  },
                  {
                    label: 'CPU layout duration (after suite, ms)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.afterSuite.layoutDuration ??
                        Number.NaN,
                    ),
                    formatter: formatSecondsToMs,
                  },
                  {
                    label: 'CPU recalc style duration (after suite, ms)',
                    values: globalFrameworkIds.map(
                      (frameworkId) =>
                        resourceMetricsByFramework.get(frameworkId)?.afterSuite
                          .recalcStyleDuration ?? Number.NaN,
                    ),
                    formatter: formatSecondsToMs,
                  },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className={cn('border border-slate-200 px-3 py-2')}>{row.label}</td>
                    {row.values.map((value, idx) => (
                      <td
                        key={`${row.label}-${globalFrameworkIds[idx]}`}
                        className={cn('border border-slate-200 px-3 py-2 text-center')}
                      >
                        {Number.isFinite(value) ? row.formatter(value) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    )
  }
})

const ResultsPage = component((_, handle: Handle) => {
  // Initialize data on mount
  handle.onBeforeMount(() => {
    void init()
  })

  return () => (
    <div className={cn('mx-auto max-w-6xl px-4 py-6')}>
      <ResultsHeader key="results-header" />
      <div className={cn('mt-6')}>
        <ResultsBody key="results-body" />
      </div>
    </div>
  )
})

renderToDOM(ResultsPage, app as HTMLElement)
