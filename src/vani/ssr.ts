import {
  getRenderMode,
  isComponentInstance,
  withRenderMode,
  type Component,
  type ComponentInstance,
  type Handle,
  type RenderFn,
  type SSRNode,
  type VChild,
} from './runtime'

type Renderable = Component<any> | ComponentInstance<any>

const voidElements = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

function createSsrHandle(): Handle {
  return {
    update() {},
    updateSync() {},
    dispose() {},
    onCleanup() {},
    effect() {},
  }
}

function normalizeComponent(comp: Renderable): ComponentInstance<any> {
  if (typeof comp === 'function') {
    return {
      $$vani: 'component',
      component: comp,
      props: {},
    }
  }
  return comp
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function serializeProps(props: Record<string, any>): string {
  const parts: string[] = []
  for (const key of Object.keys(props)) {
    const value = props[key]
    if (value == null || value === false) continue
    if (key.startsWith('on') && typeof value === 'function') continue

    if (value === true) {
      parts.push(key)
    } else {
      parts.push(`${key}="${escapeHtml(String(value))}"`)
    }
  }

  return parts.length > 0 ? ` ${parts.join(' ')}` : ''
}

function toSsrNode(node: VChild): SSRNode {
  if (node == null || node === false) {
    return { type: 'fragment', children: [] }
  }

  if (typeof node === 'string' || typeof node === 'number') {
    return { type: 'text', text: String(node) }
  }

  if (isComponentInstance(node)) {
    return { type: 'component', instance: node }
  }

  if (typeof node === 'object' && 'type' in node) {
    return node as SSRNode
  }

  throw new Error('[vani] SSR received a DOM node. This is not supported.')
}

async function renderComponent(instance: ComponentInstance<any>): Promise<string> {
  const start = '<!--vani:start-->'
  const end = '<!--vani:end-->'

  if (instance.clientOnly) {
    const fallback = (instance.props as any)?.fallback as RenderFn | undefined
    if (!fallback) {
      return `${start}${end}`
    }
    const fallbackNode = toSsrNode(fallback())
    return `${start}${await serializeNode(fallbackNode)}${end}`
  }

  const result = instance.component(instance.props, createSsrHandle())
  const renderFn = result instanceof Promise ? await result : result
  const node = toSsrNode(renderFn())
  return `${start}${await serializeNode(node)}${end}`
}

async function serializeNode(node: SSRNode): Promise<string> {
  switch (node.type) {
    case 'text':
      return escapeHtml(node.text)
    case 'comment':
      return `<!--${node.text}-->`
    case 'fragment':
      return (await Promise.all(node.children.map(serializeNode))).join('')
    case 'component':
      return renderComponent(node.instance)
    case 'element': {
      const attrs = serializeProps(node.props)
      if (voidElements.has(node.tag)) {
        return `<${node.tag}${attrs}>`
      }
      const children = (await Promise.all(node.children.map(serializeNode))).join('')
      return `<${node.tag}${attrs}>${children}</${node.tag}>`
    }
  }
}

export async function renderToString(components: Renderable[]): Promise<string> {
  return withRenderMode('ssr', async () => {
    if (getRenderMode() !== 'ssr') {
      throw new Error('[vani] renderToString failed to set SSR render mode.')
    }

    const nodes: SSRNode[] = components.map((component) => ({
      type: 'component',
      instance: normalizeComponent(component),
    }))

    const rendered = await Promise.all(nodes.map(serializeNode))
    return rendered.join('')
  })
}
