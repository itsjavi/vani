import vaniPkgJson from '../../package.json' with { type: 'json' }
import pkgJson from '../package.json' with { type: 'json' }
import indexNotes from './notes'

export { indexNotes, pkgJson, vaniPkgJson }

export const manualTestPages: Array<{ name: string; path: string }> = [
  { name: 'Todo App (JSX + Signals)', path: 'todo-app' },
  { name: 'Golden Leaf Test', path: 'manual-tests/golden-leaf-test' },
]

export type BenchPackageJson = {
  name: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  benchmarks: BenchConfig
}

export type BenchConfig = {
  version: string
  cpuThrottling: number
  benchmarkRuns: number
  warmupRuns: number
  resultsRetention?: number
  frameworks: BenchFrameworkConfig[]
}

export type BenchFrameworkConfig = {
  id: string
  name: string
  path: string
  package?: string
  implementationNotes?: string
  version?: string
}

export function getVersion(
  framework: BenchFrameworkConfig,
  dependencies: Record<string, string>,
): string {
  const versionOverride = framework.version?.trim()
  if (versionOverride) {
    return versionOverride.replace(/[vV~^]/, '')
  }
  if (framework.package === vaniPkgJson.name) {
    // since we are always benchmarking against the main branch, we should add the suffix
    return vaniPkgJson.version + '-dev'
  }
  if (framework.package && !dependencies[framework.package]) {
    throw new Error(
      `Package '${framework.package}' not found in dependencies for framework '${framework.id}'`,
    )
  }
  const pkgVersion = framework.package && dependencies[framework.package]
  if (pkgVersion) {
    return pkgVersion.replace(/[vV~^]/, '')
  }
  return '0.0.0'
}

export function getFrameworks(): Array<Required<BenchFrameworkConfig>> {
  return pkgJson.benchmarks.frameworks.map((framework) => ({
    ...framework,
    version: getVersion(framework, pkgJson.dependencies),
    package: framework.package || '',
    path: framework.path,
    implementationNotes: framework.implementationNotes,
  }))
}
