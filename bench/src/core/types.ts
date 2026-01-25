/**
 * Core types for benchmark data structures.
 * These types are shared between the runner, results viewer, and homepage.
 */

// Statistical data for timing measurements
export type Stats = {
  times: number[]
  mean: number
  median: number
  min: number
  max: number
}

// Result of a single benchmark operation for a framework
export type BenchmarkResult = {
  framework: string
  operation: string
  scripting: Stats
  total: Stats
}

// Framework metadata
export type SnapshotFramework = {
  id: string
  name: string
  version: string
  path: string
  implementationNotes?: string
}

// Legacy framework format (for backward compatibility)
export type LegacySnapshotFramework = {
  name: string
  version: string
  path: string
  benchmarkNotes?: string
}

// Resource metrics from Chrome DevTools Protocol
export type ResourceMetrics = {
  jsHeapUsedSize: number
  jsHeapTotalSize: number
  taskDuration: number
  scriptDuration: number
  layoutDuration: number
  recalcStyleDuration: number
}

// Resource metrics for a framework (before/after/delta)
export type SnapshotFrameworkMetrics = {
  framework: string
  firstRender: ResourceMetrics
  afterSuite: ResourceMetrics
  delta: ResourceMetrics
}

// Cell data for operation results table
export type SnapshotOperationCell = {
  mean: number
  ci: number
  ratio: number
}

// Per-suite calculated scores
export type SuiteCalculated = {
  frameworkOrder: string[]
  overallScores: Record<string, number | null>
}

// View type for operations (which test suite they belong to)
export type OperationView = 'datatable' | 'pokeboxes'

// Pre-calculated data for display
export type SnapshotCalculated = {
  operations: string[]
  frameworkOrder: string[]
  overallScores: Record<string, number | null>
  operationResults: Record<string, Record<string, SnapshotOperationCell>>
  operationSuites: Record<string, OperationView>
  suiteScores: Record<string, SuiteCalculated>
}

// Full snapshot payload
export type SnapshotPayload = {
  generatedAt: string
  machine?: string
  cpuThrottling: number
  runs: number
  warmups: number
  headless: boolean
  preflightUsed?: boolean
  frameworks: SnapshotFramework[]
  results: BenchmarkResult[]
  resourceMetrics?: SnapshotFrameworkMetrics[]
  calculated?: SnapshotCalculated
}

export type SnapshotIndexEntry = {
  id: string
  file: string
  generatedAt: string
  machine?: string
  cpuThrottling: number
  runs: number
  warmups: number
  headless: boolean
  preflightUsed?: boolean
  frameworks: SnapshotFramework[]
}

export type SnapshotIndex = {
  latestId?: string
  entries: SnapshotIndexEntry[]
}

// Legacy snapshot format (for backward compatibility)
export type LegacySnapshotPayload = Omit<SnapshotPayload, 'frameworks'> & {
  frameworks: LegacySnapshotFramework[]
}

// Function profiling data
export type FunctionProfile = {
  name: string
  time: number
  percentage: number
}
