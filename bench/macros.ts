// To use these exports in the frontend scripts, import them with the `with { type: 'macro' }` syntax.
// @see https://bun.com/docs/bundler/macros#macros
// That would only work if your index.html file doesn't require a build step,
// importing the .ts or .tsx scripts directly.

import fs from 'fs'
import path from 'path'
import vaniPkg from '../package.json'

type FrameworkPackage = {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  benchmarkNotes?: string
}

function readPackageJson(packagePath: string): FrameworkPackage | null {
  if (!fs.existsSync(packagePath)) {
    return null
  }

  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as FrameworkPackage
}

function getVersion(pkg: FrameworkPackage | null) {
  if (!pkg) {
    return '0.0.0'
  }
  const frameworkPackage = (pkg.name ?? '').replace('benchmark-', '')
  if (!frameworkPackage) {
    return '0.0.0'
  }
  if (frameworkPackage === 'vani') {
    return vaniPkg.version
  }
  const version = pkg.version || pkg.dependencies?.[frameworkPackage] || '0.0.0'
  return version.replace(/[vV~^]/, '')
}

export function getProjects(projectType: 'frameworks' | 'debug' = 'frameworks') {
  const basePath = path.join(process.cwd(), projectType)

  return fs
    .readdirSync(basePath)
    .map((name) => {
      const dirPath = path.join(basePath, name)
      const indexPath = path.join(dirPath, 'index.html')
      const packagePath = path.join(dirPath, 'package.json')
      const pkg = readPackageJson(packagePath)

      if (fs.statSync(dirPath).isDirectory() && fs.existsSync(indexPath)) {
        const benchmarkNotes = pkg?.benchmarkNotes?.trim()
        return {
          name,
          version: getVersion(pkg),
          benchmarkNotes: benchmarkNotes ? benchmarkNotes : undefined,
          path: `${projectType}/${name}`,
        }
      }

      return null
    })
    .filter((project) => project !== null)
}

export function getNotes() {
  const notesPath = path.join(__dirname, 'index-notes.txt')

  return fs.readFileSync(notesPath, 'utf8')
}
