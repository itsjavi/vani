import { transformWithOxc, type Plugin } from 'vite'

export default function vitePluginRemix(): Plugin {
  return {
    name: 'vite-plugin-remix',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('.remix.tsx')) {
        return transformWithOxc(code, id, {
          jsx: {
            runtime: 'automatic',
            importSource: 'remix/component',
          },
        })
      }
      return null
    },
  }
}
