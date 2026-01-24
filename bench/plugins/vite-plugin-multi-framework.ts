import preact from '@preact/preset-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import solid from 'vite-plugin-solid'
import remix from './vite-plugin-remix'
//
import type { Plugin } from 'vite'

function scoped(plugins: Plugin[] | Plugin, test: (id: string) => boolean): Plugin[] {
  const list = Array.isArray(plugins) ? plugins : [plugins]

  return list.map((plugin) => {
    const t = plugin.transform
    if (!t) return plugin

    if (typeof t === 'function') {
      return {
        ...plugin,
        transform(code, id, ...args) {
          if (!test(id)) return null
          return t.call(this, code, id, ...args)
        },
      }
    }

    if (typeof t === 'object' && typeof t.handler === 'function') {
      return {
        ...plugin,
        transform: {
          ...t,
          handler(code, id, ...args) {
            if (!test(id)) return null
            return t.handler.call(this, code, id, ...args)
          },
        },
      }
    }

    return plugin
  })
}

const frameworkIds = [
  'preact',
  'react',
  'remix',
  'solid',
  'svelte',
  'vue',
  // 'vani',
  // 'vanilla',
] as const

type FrameworkId = (typeof frameworkIds)[number]

function getFrameworkSuffix(frameworkId: FrameworkId, defaultFrameworkId?: FrameworkId): string {
  return frameworkId === defaultFrameworkId ? '.tsx' : `.${frameworkId}.tsx`
}

function pluginsForFramework(frameworkId: FrameworkId, defaultFrameworkId?: FrameworkId): Plugin[] {
  switch (frameworkId) {
    case 'preact':
      return scoped(preact(), (id) =>
        id.endsWith(getFrameworkSuffix(frameworkId, defaultFrameworkId)),
      )

    case 'react':
      return scoped(react(), (id) =>
        id.endsWith(getFrameworkSuffix(frameworkId, defaultFrameworkId)),
      )

    case 'remix':
      return scoped(remix(), (id) =>
        id.endsWith(getFrameworkSuffix(frameworkId, defaultFrameworkId)),
      )

    case 'solid':
      return scoped(solid(), (id) =>
        id.endsWith(getFrameworkSuffix(frameworkId, defaultFrameworkId)),
      )

    case 'svelte':
      return svelte({
        compilerOptions: {
          css: 'injected',
        },
      })

    case 'vue':
      return [vue()]

    default:
      throw new Error(`Unknown framework: ${frameworkId}`)
  }
}

// Ensure that the build config does not include any global JSX config set by other plugins.
const noGlobalJSXConfig = (): Plugin => {
  const jsxUndefined = {
    jsx: undefined,
    jsxImportSource: undefined,
    jsxDev: undefined,
    jsxFactory: undefined,
    jsxFragment: undefined,
    jsxFragmentFactory: undefined,
    jsxInject: undefined,
    jsxPragma: undefined,
    jsxPragmaFrag: undefined,
    jsxPragmaFragFactory: undefined,
    jsxSideEffects: undefined,
  }
  return {
    name: 'no-global-jsx-config',
    enforce: 'post',
    config(config) {
      return {
        ...config,
        esbuild: {
          ...config.esbuild,
          ...jsxUndefined,
        },
        optimizeDeps: {
          ...config.optimizeDeps,
          esbuildOptions: {
            ...config.optimizeDeps?.esbuildOptions,
            ...jsxUndefined,
          },
        },
        oxc: {
          ...config.oxc,
          jsx: undefined,
          jsxInject: undefined,
          jsxRefreshExclude: undefined,
          jsxRefreshInclude: undefined,
        },
      }
    },
  }
}

export type VitePluginMultiFrameworkOptions = {
  /**
   * The frameworks to use for the build.
   */
  frameworks: FrameworkId[]
  /**
   * The default framework to use for the build.
   * When provided, there will be no need to specify framework suffixes for TSX files, such as:
   *
   * - Preact: .preact.tsx
   * - React: .react.tsx
   * - Remix: .remix.tsx
   * - Solid: .solid.tsx
   *
   * These suffixes are needed to ensure that the correct framework plugin is used for the build.
   */
  defaultFramework?: FrameworkId
}

export default function vitePluginMultiFramework(
  options: VitePluginMultiFrameworkOptions,
): Plugin[] {
  return options.frameworks
    .flatMap((frameworkId) => pluginsForFramework(frameworkId, options.defaultFramework))
    .concat(noGlobalJSXConfig())
}
