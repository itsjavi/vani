// @see https://bun.com/docs/bundler/macros#macros
// All exports in this file are supposed to be imported in the frontends
// with the `with { type: 'macro' }` syntax.

import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

export function getProjects(projectType: 'frameworks' | 'debug' = 'frameworks') {
  const basePath = join(process.cwd(), projectType)

  return readdirSync(basePath)
    .map((name) => {
      const dirPath = join(basePath, name)
      const indexPath = join(dirPath, 'index.html')

      if (statSync(dirPath).isDirectory() && existsSync(indexPath)) {
        return {
          name,
          path: `${projectType}/${name}`,
        }
      }

      return null
    })
    .filter((project) => project !== null)
}
