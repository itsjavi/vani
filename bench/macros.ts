// To use these exports in the frontend scripts, import them with the `with { type: 'macro' }` syntax.
// @see https://bun.com/docs/bundler/macros#macros
// That would only work if your index.html file doesn't require a build step,
// importing the .ts or .tsx scripts directly.

import fs from 'fs'
import path from 'path'
import vaniPkg from '../package.json'

function getVersion(packagePath: string) {
  if (!fs.existsSync(packagePath)) {
    return '0.0.0'
  }
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  const frameworkPackage = pkg.name.replace('benchmark-', '')
  if (frameworkPackage === 'vani') {
    return vaniPkg.version
  }
  const version = pkg.version || pkg.dependencies[frameworkPackage] || '0.0.0'
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

      if (fs.statSync(dirPath).isDirectory() && fs.existsSync(indexPath)) {
        return {
          name,
          version: getVersion(packagePath),
          path: `${projectType}/${name}`,
        }
      }

      return null
    })
    .filter((project) => project !== null)
}
