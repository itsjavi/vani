/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/no-array-callback-reference */

import { getRenderMode, type SSRNode, type SvgProps, type VNode } from './runtime'

export type SvgRenderOptions = {
  size?: number
  className?: string
  attributes?: SvgProps
}

const svgStringCache = new Map<string, SVGSVGElement>()

const mergeClassValue = (base: string | undefined, extra: string | undefined) => {
  if (!extra) return base
  const merged = `${base ?? ''} ${extra}`.trim()
  return merged.length > 0 ? merged : undefined
}

const applySvgOverridesToNode = (node: SVGSVGElement, options?: SvgRenderOptions) => {
  if (!options) return
  const size = options.size
  if (size != null) {
    node.setAttribute('width', String(size))
    node.setAttribute('height', String(size))
  }
  if (options.className) {
    const merged = mergeClassValue(node.getAttribute('class') ?? undefined, options.className)
    if (merged) {
      node.setAttribute('class', merged)
    }
  }
  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      if (value == null || value === false) continue
      if (value === true) {
        node.setAttribute(key, '')
        continue
      }
      node.setAttribute(key, String(value))
    }
  }
}

const parseSvgAttributes = (input: string) => {
  const attrs: Record<string, string | boolean> = {}
  const attrRegex = /([^\s=]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  let match: RegExpExecArray | null
  while ((match = attrRegex.exec(input))) {
    const key = match[1]
    const value = match[2] ?? match[3] ?? match[4]
    attrs[key] = value === undefined ? true : value
  }
  return attrs
}

const parseSvgToSsrNode = (svg: string): SSRNode => {
  const cleaned = svg.replaceAll(/<!--[\s\S]*?-->/g, '').trim()
  const tagRegex = /<\/?[^>]+>/g
  const stack: Array<SSRNode> = []
  let root: SSRNode | null = null
  let lastIndex = 0
  let match: RegExpExecArray | null

  const appendChild = (child: SSRNode) => {
    const parent = stack.at(-1)
    if (parent && (parent.type === 'element' || parent.type === 'fragment')) {
      parent.children.push(child)
    }
  }

  while ((match = tagRegex.exec(cleaned))) {
    const text = cleaned.slice(lastIndex, match.index)
    if (text.trim().length > 0) {
      appendChild({ type: 'text', text })
    }

    const token = match[0]
    if (token.startsWith('</')) {
      stack.pop()
    } else {
      const selfClosing = token.endsWith('/>')
      const inside = token.slice(1, selfClosing ? -2 : -1).trim()
      const spaceIndex = inside.search(/\s/)
      const tag = spaceIndex === -1 ? inside : inside.slice(0, spaceIndex)
      const attrString = spaceIndex === -1 ? '' : inside.slice(spaceIndex + 1)
      const props = parseSvgAttributes(attrString)
      const node: SSRNode = { type: 'element', tag, props, children: [] }

      if (root == null) {
        root = node
      } else {
        appendChild(node)
      }

      if (!selfClosing) {
        stack.push(node)
      }
    }

    lastIndex = tagRegex.lastIndex
  }

  return root ?? { type: 'fragment', children: [] }
}

const cloneSsrNode = (node: SSRNode): SSRNode => {
  if (node.type === 'text') {
    return { type: 'text', text: node.text }
  }
  if (node.type === 'comment') {
    return { type: 'comment', text: node.text }
  }
  if (node.type === 'fragment') {
    return { type: 'fragment', children: node.children.map(cloneSsrNode) }
  }
  if (node.type === 'component') {
    return { type: 'component', instance: node.instance }
  }
  return {
    type: 'element',
    tag: node.tag,
    props: { ...node.props },
    children: node.children.map(cloneSsrNode),
  }
}

const applySvgOverridesToSsr = (node: SSRNode, options?: SvgRenderOptions) => {
  if (!options || node.type !== 'element' || node.tag !== 'svg') return
  const props = node.props as Record<string, any>
  if (options.size != null) {
    props.width = String(options.size)
    props.height = String(options.size)
  }
  if (options.className) {
    const merged = mergeClassValue(props.class as string | undefined, options.className)
    if (merged) {
      props.class = merged
    }
  }
  if (options.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      if (value == null || value === false) continue
      if (value === true) {
        props[key] = true
        continue
      }
      props[key] = String(value)
    }
  }
}

export const renderSvgString = (svg: string, options?: SvgRenderOptions): VNode => {
  if (getRenderMode() === 'ssr') {
    const parsed = cloneSsrNode(parseSvgToSsrNode(svg))
    applySvgOverridesToSsr(parsed, options)
    return parsed
  }

  let base = svgStringCache.get(svg)
  if (!base) {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
    base = doc.documentElement as unknown as SVGSVGElement
    svgStringCache.set(svg, base)
  }
  const node = base.cloneNode(true) as SVGSVGElement
  applySvgOverridesToNode(node, options)
  return node
}
