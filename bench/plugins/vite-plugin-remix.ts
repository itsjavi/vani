import { transformWithEsbuild, type Plugin } from 'vite'

export default function vitePluginRemix(): Plugin {
  return {
    name: 'vite-plugin-remix',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('.remix.tsx')) {
        return transformWithEsbuild(code, id, {
          loader: 'tsx',
          jsx: 'automatic',
          jsxImportSource: 'remix/component',
        })
      }
      return null
    },
  }
}
