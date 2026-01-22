// To use these exports in the frontend scripts, import them with the `with { type: 'macro' }` syntax.
// @see https://bun.com/docs/bundler/macros#macros
// That would only work if your index.html file doesn't require a build step,
// importing the .ts or .tsx scripts directly.

import fs from 'fs'
import path from 'path'

export function getProjects(projectType: 'frameworks' | 'debug' = 'frameworks') {
  const basePath = path.join(process.cwd(), projectType)

  return fs
    .readdirSync(basePath)
    .map((name) => {
      const dirPath = path.join(basePath, name)
      const indexPath = path.join(dirPath, 'index.html')

      if (fs.statSync(dirPath).isDirectory() && fs.existsSync(indexPath)) {
        return {
          name,
          path: `${projectType}/${name}`,
        }
      }

      return null
    })
    .filter((project) => project !== null)
}
