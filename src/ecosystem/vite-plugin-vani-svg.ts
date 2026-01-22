import { createFilter } from '@rollup/pluginutils'
import fs from 'node:fs'
import type { Plugin } from 'vite'

type FilterExpression = string | RegExp | Array<string | RegExp>

export type VitePluginVaniSvgOptions = {
  include?: FilterExpression
  exclude?: FilterExpression
}

const DEFAULT_INCLUDE = '**/*.svg?vani'
const POSTFIX_RE = /[?#].*$/s

const buildComponentModule = (svgCode: string) => {
  const svgSource = JSON.stringify(svgCode)
  return `
import { classNames, component, renderSvgString } from '@/vani'

const SvgComponent = component(
  ({ className, ref, ...props }) =>
    () =>
      renderSvgString(${svgSource}, {
        className: classNames(className),
        attributes: { 'aria-hidden': 'true', ...props },
      }),
)

export default SvgComponent
export const svg = ${svgSource}
`
}

export default function vitePluginVaniSvg({
  include = DEFAULT_INCLUDE,
  exclude,
}: VitePluginVaniSvgOptions = {}): Plugin {
  const filter = createFilter(include, exclude)

  return {
    name: 'vite-plugin-vani-svg',
    enforce: 'pre', // to override `vite:asset`'s behavior
    load: {
      filter: {
        id: {
          include,
          exclude,
        },
      },
      async handler(id) {
        if (!filter(id)) return null
        const filePath = id.replace(POSTFIX_RE, '')
        const svgCode = await fs.promises.readFile(filePath, 'utf8')
        return {
          code: buildComponentModule(svgCode),
          map: null,
        }
      },
    },
  }
}
