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
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  benchmark?: {
    libName?: string
    libPackage?: string
    libVersion?: string
    implementationNotes?: string
  }
}

function readPackageJson(packagePath: string): FrameworkPackage | null {
  if (!fs.existsSync(packagePath)) {
    return null
  }

  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as FrameworkPackage
}

function isVaniPackage(libPackage?: string) {
  if (!libPackage) return false
  return libPackage === '@vanijs/vani' || libPackage === 'vani' || libPackage.startsWith('vani-')
}

function getVersion(pkg: FrameworkPackage | null) {
  if (!pkg) {
    return '0.0.0'
  }
  const benchmark = pkg.benchmark
  const libPackage = benchmark?.libPackage?.trim()
  const libVersion = benchmark?.libVersion?.trim()
  if (libVersion) {
    return libVersion.replace(/[vV~^]/, '')
  }
  if (isVaniPackage(libPackage)) {
    return vaniPkg.version + '-main'
  }
  const version =
    (libPackage && pkg.dependencies?.[libPackage]) ||
    (libPackage && pkg.devDependencies?.[libPackage]) ||
    (libPackage && pkg.peerDependencies?.[libPackage]) ||
    (libPackage && pkg.optionalDependencies?.[libPackage]) ||
    pkg.version ||
    '0.0.0'
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
        const benchmark = pkg?.benchmark
        const displayName = benchmark?.libName?.trim() || name
        const implementationNotes = benchmark?.implementationNotes?.trim()
        return {
          id: name,
          name: displayName,
          version: getVersion(pkg),
          implementationNotes: implementationNotes ? implementationNotes : undefined,
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
