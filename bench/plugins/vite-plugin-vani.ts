import { transformWithOxc, type Plugin } from 'vite'

export default function vitePluginVani(): Plugin {
  return {
    name: 'vite-plugin-vani',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('.vani.tsx')) {
        return transformWithOxc(code, id, {
          jsx: {
            runtime: 'automatic',
            importSource: 'vani-local',
          },
        })
      }
      return null
    },
  }
}
