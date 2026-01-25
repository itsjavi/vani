/**
 * Statistical analysis and score calculation utilities for benchmarks.
 */

import type {
  BenchmarkResult,
  FunctionProfile,
  OperationView,
  SnapshotCalculated,
  SnapshotFramework,
  SnapshotOperationCell,
  SnapshotPayload,
  Stats,
  SuiteCalculated,
  LegacySnapshotPayload,
  LegacySnapshotFramework,
} from './types'

// Default view for operations without explicit view
export const DEFAULT_VIEW: OperationView = 'datatable'
export const AVAILABLE_VIEWS: OperationView[] = ['datatable', 'pokeboxes']

/**
 * Calculate basic statistics for an array of timing values.
 */
export function calcStats(times: number[]): Stats {
  let sorted = [...times].sort((a, b) => a - b)
  return {
    times,
    mean: times.reduce((a, b) => a + b, 0) / times.length,
    median: sorted[Math.floor(sorted.length / 2)],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
}

/**
 * Calculate 95% confidence interval for an array of values.
 * Uses 1.96 as the z-score for 95% confidence.
 */
export function calcConfidenceInterval(times: number[]): number {
  if (times.length < 2) {
    return 0
  }

  let mean = times.reduce((sum, value) => sum + value, 0) / times.length
  let variance =
    times.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (times.length - 1)
  let stddev = Math.sqrt(variance)
  return (1.96 * stddev) / Math.sqrt(times.length)
}

/**
 * Calculate average mean for a set of operations.
 */
function calcAverageMean(
  operationNames: string[],
  resultsByOperation: Map<string, Map<string, BenchmarkResult>>,
  frameworkId: string,
): number {
  let totalMeans = operationNames.map((operationName) => {
    let result = resultsByOperation.get(operationName)?.get(frameworkId)
    if (!result) return Number.POSITIVE_INFINITY
    return result.total.mean
  })
  let validMeans = totalMeans.filter((value) => Number.isFinite(value))
  return validMeans.length === 0
    ? Number.POSITIVE_INFINITY
    : validMeans.reduce((sum, value) => sum + value, 0) / validMeans.length
}

/**
 * Build calculated snapshot data from raw benchmark results.
 * This generates framework rankings, per-operation scores, and per-suite scores.
 */
export function buildCalculatedSnapshot(
  results: BenchmarkResult[],
  frameworks: SnapshotFramework[],
  operationViewResolver: (operationName: string) => OperationView,
): SnapshotCalculated {
  // Group results by operation and framework
  let resultsByOperation = new Map<string, Map<string, BenchmarkResult>>()
  for (let result of results) {
    if (!resultsByOperation.has(result.operation)) {
      resultsByOperation.set(result.operation, new Map())
    }
    resultsByOperation.get(result.operation)!.set(result.framework, result)
  }

  let operationNames = Array.from(resultsByOperation.keys())

  // Calculate global average means per framework
  let averageMeansByFramework = frameworks.map((framework) => ({
    framework,
    averageMean: calcAverageMean(operationNames, resultsByOperation, framework.id),
  }))

  let averageMeanMap = new Map(
    averageMeansByFramework.map((entry) => [entry.framework.id, entry.averageMean]),
  )

  // Sort frameworks by average mean (best first)
  let frameworkOrder = [...averageMeansByFramework]
    .sort((a, b) => a.averageMean - b.averageMean)
    .map((entry) => entry.framework.id)

  // Build global overall scores
  let overallScores: Record<string, number | null> = {}
  for (let frameworkId of frameworkOrder) {
    let averageMean = averageMeanMap.get(frameworkId)
    overallScores[frameworkId] =
      averageMean !== undefined && Number.isFinite(averageMean) ? averageMean : null
  }

  // Map operations to their suites
  let operationSuites: Record<string, OperationView> = {}
  for (let operationName of operationNames) {
    operationSuites[operationName] = operationViewResolver(operationName)
  }

  // Group operations by suite
  let operationsBySuite = new Map<OperationView, string[]>()
  for (let operationName of operationNames) {
    let suite = operationSuites[operationName]
    if (!operationsBySuite.has(suite)) {
      operationsBySuite.set(suite, [])
    }
    operationsBySuite.get(suite)!.push(operationName)
  }

  // Compute per-suite scores and framework ordering
  let suiteScores: Record<string, SuiteCalculated> = {}
  for (let [suiteId, suiteOperations] of operationsBySuite) {
    let suiteAverageMeansByFramework = frameworks.map((framework) => ({
      framework,
      averageMean: calcAverageMean(suiteOperations, resultsByOperation, framework.id),
    }))

    let suiteFrameworkOrder = [...suiteAverageMeansByFramework]
      .sort((a, b) => a.averageMean - b.averageMean)
      .map((entry) => entry.framework.id)

    let suiteOverallScores: Record<string, number | null> = {}
    for (let { framework, averageMean } of suiteAverageMeansByFramework) {
      suiteOverallScores[framework.id] = Number.isFinite(averageMean) ? averageMean : null
    }

    suiteScores[suiteId] = {
      frameworkOrder: suiteFrameworkOrder,
      overallScores: suiteOverallScores,
    }
  }

  // Build per-operation results with ratios
  let operationResults: Record<string, Record<string, SnapshotOperationCell>> = {}
  for (let operationName of operationNames) {
    let opResults = resultsByOperation.get(operationName)
    if (!opResults) continue

    let means = frameworkOrder.map((frameworkId) => {
      let result = opResults.get(frameworkId)
      if (!result) return Number.POSITIVE_INFINITY
      return result.total.mean
    })
    let best = Math.min(...means.filter((value) => Number.isFinite(value)))

    let perFramework: Record<string, SnapshotOperationCell> = {}
    for (let frameworkId of frameworkOrder) {
      let result = opResults.get(frameworkId)
      if (!result) continue
      let mean = result.total.mean
      let ci = calcConfidenceInterval(result.total.times)
      let ratio = best > 0 ? mean / best : 1
      perFramework[frameworkId] = { mean, ci, ratio }
    }
    operationResults[operationName] = perFramework
  }

  return {
    operations: operationNames,
    frameworkOrder,
    overallScores,
    operationResults,
    operationSuites,
    suiteScores,
  }
}

/**
 * Aggregate profiling data from multiple runs and calculate medians.
 * Returns top 30 functions by median self time.
 */
export function aggregateProfiles(
  profiles: FunctionProfile[][],
  _operationName: string,
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

/**
 * Normalize a legacy framework object to the current format.
 */
export function normalizeFramework(
  framework: SnapshotFramework | LegacySnapshotFramework,
): SnapshotFramework {
  const id =
    'id' in framework && framework.id
      ? framework.id
      : framework.path.split('/').pop() || framework.name
  const implementationNotes =
    'implementationNotes' in framework
      ? framework.implementationNotes
      : 'benchmarkNotes' in framework
        ? framework.benchmarkNotes
        : undefined
  return {
    id,
    name: framework.name,
    version: framework.version,
    path: framework.path,
    implementationNotes,
  }
}

/**
 * Normalize a legacy snapshot payload to the current format.
 */
export function normalizeSnapshot(
  snapshot: SnapshotPayload | LegacySnapshotPayload,
): SnapshotPayload {
  return {
    ...snapshot,
    frameworks: snapshot.frameworks.map((framework) => normalizeFramework(framework)),
  } as SnapshotPayload
}

/**
 * Sort frameworks by their scores (ascending, best first).
 */
export function sortFrameworksByScore(
  frameworks: SnapshotFramework[],
  scores: Record<string, number | null>,
): SnapshotFramework[] {
  let scoredFrameworks = frameworks.map((framework, index) => ({
    framework,
    score: scores[framework.id] ?? null,
    index,
  }))
  scoredFrameworks.sort((a, b) => {
    let aScore = a.score ?? Number.POSITIVE_INFINITY
    let bScore = b.score ?? Number.POSITIVE_INFINITY
    if (aScore === bScore) return a.index - b.index
    return aScore - bScore
  })
  return scoredFrameworks.map((item) => item.framework)
}

/**
 * Get the best (minimum) score from a set of scores.
 */
export function getBestScore(scores: (number | null)[]): number {
  return Math.min(...scores.filter((score): score is number => Number.isFinite(score)))
}

/**
 * Calculate ratio relative to best score.
 */
export function calcRatio(score: number, bestScore: number): number {
  if (!Number.isFinite(bestScore) || bestScore <= 0) return Number.NaN
  return score / bestScore
}

/**
 * Determine cell class based on ratio to best score.
 */
export function getCellClass(ratio: number): 'good' | 'ok' | 'warn' | 'bad' | null {
  if (!Number.isFinite(ratio)) return null
  if (ratio <= 1.1) return 'good'
  if (ratio <= 1.3) return 'ok'
  if (ratio <= 1.7) return 'warn'
  return 'bad'
}
