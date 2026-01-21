/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable unicorn/prefer-dom-node-append */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable unicorn/no-negated-condition */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type SSRNode =
  | {
      type: 'element'
      tag: string
      props: Record<string, any>
      children: SSRNode[]
    }
  | { type: 'text'; text: string }
  | { type: 'comment'; text: string }
  | { type: 'fragment'; children: SSRNode[] }
  | { type: 'component'; instance: ComponentInstance<any> }

export type VNode = Node | SSRNode

export interface Handle {
  /**
   * Schedules a render for the component.
   * This triggers a re-render on the next microtask.
   */
  update(): void
  /**
   * Flushes the component render.
   * This triggers a re-render immediately.
   */
  updateSync(): void
  /**
   * Disposes the component: removes the component from the DOM and runs all cleanup functions.
   */
  dispose(): void
  /**
   * Adds a cleanup function that is called when the component is disposed.
   */
  onCleanup(fn: () => void): void
  /**
   * This is purely syntatic sugar, as it is basically the same as running the function
   * on the setup phase and calling onCleanup to add a cleanup function.
   *
   * Using effects is necessary in SSR mode, for side effects to not run on the server
   * (e.g. timers, subscriptions, DOM usage, etc.)
   *
   * Runs a side effect function when the component is mounted.
   * The returning function may be a cleanup function that is called when the component is disposed.
   *
   */
  effect(fn: () => void | (() => void)): void
}

export type RenderFn = () => VChild

export type Component<Props = any> = (props: Props, handle: Handle) => RenderFn | Promise<RenderFn>

// Component instance descriptor (returned by component())
export type ComponentInstance<Props = any> = {
  $$vani: 'component'
  component: Component<Props>
  props: Props
  /**
   * A key is used to identify the component when it is re-rendered.
   * If a key is provided, the component will be re-rendered only if the key changes.
   */
  key?: string | number
  /**
   * A ref is used to get a reference to the component instance.
   * The ref is set to the component instance when the component is mounted.
   * The ref is set to null when the component is disposed.
   */
  ref?: ComponentRef
  clientOnly?: boolean
}

export type ComponentInput<Props> = Props & {
  key?: string | number
  ref?: ComponentRef
}

type ComponentMetaProps = {
  key?: string | number
  ref?: ComponentRef
  fallback?: RenderFn
  clientOnly?: boolean
}

export type VChild = VNode | ComponentInstance<any> | string | number | null | undefined | false

export type DataAttribute = `data-${string}` | `data${Capitalize<string>}`

type HtmlTagName = keyof HTMLElementTagNameMap
type SvgTagName = keyof SVGElementTagNameMap
type ElementTagName = HtmlTagName | SvgTagName

type ElementByTag<T extends ElementTagName> = T extends HtmlTagName
  ? HTMLElementTagNameMap[T]
  : T extends SvgTagName
    ? SVGElementTagNameMap[T]
    : Element

export type SvgProps<T extends SvgTagName = SvgTagName> = BaseProps<T> & {
  [key: string]: string | number | boolean | undefined | null | ((...args: any[]) => any)
}

type BaseProps<T extends ElementTagName> = {
  className?: ClassName
  style?: string
  ref?: DomRef<ElementByTag<T>>
} & {
  [key: DataAttribute]: string | number | boolean | undefined | null
}

export type HtmlProps<T extends HtmlTagName = HtmlTagName> = BaseProps<T> &
  Partial<Omit<ElementByTag<T>, 'children' | 'className' | 'style'>>

export type ElementProps<T extends ElementTagName> = T extends SvgTagName
  ? SvgProps<T>
  : HtmlProps<Extract<T, HtmlTagName>>

export type ClassName =
  | string
  | undefined
  | null
  | {
      [key: string]: boolean | undefined | null
    }
  | ClassName[]

type KeyedRecord = {
  handle: Handle
  fragment: DocumentFragment
  ref?: ComponentRef
}

export type ComponentRef = {
  current: Handle | null
}

export type DomRef<T extends Element = Element> = {
  current: T | null
}

type RenderMode = 'dom' | 'ssr'

// ─────────────────────────────────────────────
// component() helper
// ─────────────────────────────────────────────

function getKeyedMap(parent: Node): Map<string | number, KeyedRecord> {
  const anyParent = parent as any
  if (!anyParent.__vaniKeyed) {
    anyParent.__vaniKeyed = new Map()
  }
  return anyParent.__vaniKeyed
}

export function component(
  fn: Component<void>,
): (props?: ComponentMetaProps) => ComponentInstance<void>
export function component<Props>(
  fn: Component<Props>,
): (props: Props & ComponentMetaProps) => ComponentInstance<Props>
export function component<Props>(fn: Component<Props>) {
  return (input?: ComponentInput<Props>): ComponentInstance<Props> => {
    let key: string | number | undefined
    let ref: ComponentRef | undefined
    let clientOnly = false
    let props = input as Props

    if (input && typeof input === 'object') {
      const anyInput = input as any
      key = anyInput.key
      ref = anyInput.ref
      clientOnly = anyInput.clientOnly
      if ('key' in anyInput || 'ref' in anyInput) {
        const { key: _, ref: __, clientOnly: ___, ...rest } = anyInput
        props = rest
      }
    }

    return {
      $$vani: 'component',
      component: fn,
      props,
      key,
      ref,
      clientOnly,
    }
  }
}

// ─────────────────────────────────────────────
// Render mode (DOM vs SSR)
// ─────────────────────────────────────────────

let currentRenderMode: RenderMode = 'dom'

export function withRenderMode<T>(mode: RenderMode, fn: () => T): T {
  const prev = currentRenderMode
  currentRenderMode = mode
  const result = fn()
  if (result && typeof (result as unknown as Promise<unknown>).finally === 'function') {
    return (result as unknown as Promise<unknown>).finally(() => {
      currentRenderMode = prev
    }) as T
  }
  currentRenderMode = prev
  return result
}

export function getRenderMode(): RenderMode {
  return currentRenderMode
}

function isSsrNode(node: VNode): node is SSRNode {
  if (typeof node !== 'object' || node === null || !('type' in node)) {
    return false
  }

  const anyNode = node as SSRNode
  switch (anyNode.type) {
    case 'element':
      return (
        typeof anyNode.tag === 'string' &&
        typeof anyNode.props === 'object' &&
        Array.isArray(anyNode.children)
      )
    case 'text':
    case 'comment':
      return typeof anyNode.text === 'string'
    case 'fragment':
      return Array.isArray(anyNode.children)
    case 'component':
      return typeof anyNode.instance === 'object' && anyNode.instance != null
    default:
      return false
  }
}

function isSsrElement(node: VNode): node is Extract<SSRNode, { type: 'element' }> {
  return isSsrNode(node) && node.type === 'element'
}

function isSsrFragment(node: VNode): node is Extract<SSRNode, { type: 'fragment' }> {
  return isSsrNode(node) && node.type === 'fragment'
}

const svgTags = new Set<string>([
  'svg',
  'g',
  'path',
  'circle',
  'rect',
  'line',
  'polyline',
  'polygon',
  'ellipse',
  'defs',
  'clipPath',
  'mask',
  'pattern',
  'linearGradient',
  'radialGradient',
  'stop',
  'use',
])

function createElementNode(tag: string): VNode {
  if (currentRenderMode === 'dom') {
    if (svgTags.has(tag)) {
      return document.createElementNS('http://www.w3.org/2000/svg', tag)
    }
    return document.createElement(tag)
  }
  return { type: 'element', tag, props: {}, children: [] }
}

function createTextNode(text: string): VNode {
  if (currentRenderMode === 'dom') {
    return document.createTextNode(text)
  }
  return { type: 'text', text }
}

function appendChildNode(parent: VNode, child: VNode) {
  if (currentRenderMode === 'dom') {
    ;(parent as Node).appendChild(child as Node)
    return
  }

  if (isSsrElement(parent) || isSsrFragment(parent)) {
    parent.children.push(child as SSRNode)
  }
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

function clearBetween(start: Comment, end: Comment) {
  let node = start.nextSibling
  while (node && node !== end) {
    const next = node.nextSibling
    const anyNode = node as any
    if (anyNode.__vaniDomRef) {
      anyNode.__vaniDomRef.current = null
    }
    node.remove()
    node = next
  }
}

// ─────────────────────────────────────────────
// Core mounting logic
// ─────────────────────────────────────────────

function normalizeDomChild(child: VChild): Node {
  if (child == null || child === false) {
    return document.createComment('vani:empty')
  }

  if (isComponentInstance(child)) {
    const fragment = document.createDocumentFragment()
    const handle = mountComponent(child.component, getMountProps(child), fragment)
    if (child.ref) {
      child.ref.current = handle
    }
    return fragment
  }

  if (typeof child === 'string' || typeof child === 'number') {
    return document.createTextNode(String(child))
  }

  if (child instanceof Node) {
    return child
  }

  throw new Error('[vani] render returned an unsupported node type in DOM mode')
}

function mountComponent<Props>(component: Component<Props>, props: Props, parent: Node): Handle {
  const cleanups: Array<() => void> = []
  let disposed = false
  let start: Comment
  let end: Comment

  // ─────────────────────────────────────────────
  // Anchor handling (hydration-aware)
  // ─────────────────────────────────────────────

  const clientOnly = (props as any)?.clientOnly === true

  if (isHydrating) {
    const componentIndex = hydrationComponentIndex
    hydrationComponentIndex += 1
    start = findNextStartAnchor(parent, componentIndex)
    end = findMatchingEndAnchor(start, componentIndex)
  } else {
    start = document.createComment('vani:start')
    end = document.createComment('vani:end')
    parent.appendChild(start)
    parent.appendChild(end)
  }

  let render!: RenderFn

  // ─────────────────────────────────────────────
  // Handle
  // ─────────────────────────────────────────────

  const handle: Handle = {
    update() {
      if (disposed) return

      if (inTransition) {
        if (!urgentQueue.has(handle)) {
          transitionQueue.add(handle)
          scheduleTransitionFlush()
        }
      } else {
        transitionQueue.delete(handle)
        urgentQueue.add(handle)
        scheduleUrgentFlush()
      }
    },

    updateSync() {
      if (disposed) return
      if (!start.parentNode) return

      clearBetween(start, end)
      const node = normalizeDomChild(render())
      end.before(node, end)
    },

    onCleanup(fn) {
      cleanups.push(fn)
    },

    dispose() {
      if (disposed) return
      disposed = true

      urgentQueue.delete(handle)
      transitionQueue.delete(handle)

      for (const fn of cleanups) fn()
      cleanups.length = 0

      clearBetween(start, end)
      start.remove()
      end.remove()

      // prevent accidental reuse
      render = (() => document.createComment('disposed')) as any
    },

    effect(fn) {
      const cleanup = fn()
      if (typeof cleanup === 'function') {
        cleanups.push(cleanup)
      }
    },
  }

  // ─────────────────────────────────────────────
  // Setup phase
  // ─────────────────────────────────────────────

  if (isHydrating && !clientOnly) {
    let initialized = false

    render = () => {
      if (!initialized) {
        initialized = true
        const result = component(props, handle)
        render = result instanceof Promise ? () => document.createComment('async') : result
      }
      return render()
    }

    return handle
  }

  const result = component(props, handle)

  // ─────────────────────────────────────────────
  // Async component
  // ─────────────────────────────────────────────

  if (result instanceof Promise) {
    const fallback = (props as any)?.fallback
    render = fallback ? fallback : () => document.createComment('vani:async')

    // initial render only if not hydrating or clientOnly
    if (!isHydrating || clientOnly) {
      handle.update()
    }

    result.then((realRender) => {
      if (disposed) return
      render = realRender
      handle.update()
    })

    return handle
  }

  // ─────────────────────────────────────────────
  // Sync component
  // ─────────────────────────────────────────────

  render = result

  // initial render only if not hydrating or clientOnly
  if (!isHydrating || clientOnly) {
    handle.update()
  }

  return handle
}

// ─────────────────────────────────────────────
// Public render API
// ─────────────────────────────────────────────

export function renderToDOM(
  components: Array<Component<any> | ComponentInstance<any>>,
  root: HTMLElement,
): Handle[] {
  if (!root) {
    throw new Error('[vani] root element not found')
  }

  const handles: Handle[] = []
  for (const Comp of components) {
    if (typeof Comp === 'function') {
      // raw component (no props)
      const handle = mountComponent(Comp, {} as any, root)
      handles.push(handle)
      continue
    }

    // ComponentInstance descriptor
    const handle = mountComponent(Comp.component, getMountProps(Comp), root)
    handles.push(handle)
  }

  return handles
}

// ─────────────────────────────────────────────
// DOM helpers
// ─────────────────────────────────────────────

export function isComponentInstance(child: VChild): child is ComponentInstance<any> {
  const isDomNode = typeof Node !== 'undefined' && child instanceof Node
  if (typeof child !== 'object' || isDomNode) return false
  const instance = child as ComponentInstance<any>
  return instance.$$vani === 'component' && typeof instance.component === 'function'
}

function isHtmlProps(props: any): props is ElementProps<any> {
  const isDomNode = typeof Node !== 'undefined' && props instanceof Node
  return (
    props !== null &&
    typeof props === 'object' &&
    !isDomNode &&
    !isComponentInstance(props as VChild) &&
    !isSsrNode(props as VNode)
  )
}

function getMountProps<Props>(instance: ComponentInstance<Props>): Props {
  if (!instance.clientOnly) return instance.props
  const base = (instance.props ?? {}) as Record<string, any>
  return { ...base, clientOnly: true } as Props
}

function appendChildren(parent: VNode, children: VChild[]) {
  if (currentRenderMode === 'ssr') {
    for (const child of children) {
      if (child == null || child === false || child === undefined) continue

      if (isComponentInstance(child)) {
        appendChildNode(parent, { type: 'component', instance: child })
        continue
      }

      if (typeof child === 'string' || typeof child === 'number') {
        appendChildNode(parent, createTextNode(String(child)))
        continue
      }

      if (isSsrNode(child)) {
        appendChildNode(parent, child)
        continue
      }
    }

    return
  }

  const domParent = parent as Node
  for (const child of children) {
    if (child == null || child === false || child === undefined) continue

    if (isComponentInstance(child)) {
      // keyed component
      // Only components support keys, and that is the correct design:
      // - DOM elements don’t need identity, components do.
      // - React uses virtual DOM and diffing, but Vani uses the real DOM and is simpler and faster.
      // - forcing identity only where it matters keeps Vani simple, fast, and predictable
      if (child.key != null) {
        const keyedMap = getKeyedMap(domParent)
        const usedKeys = ((domParent as any).__vaniUsedKeys ??= new Set())

        let record = keyedMap.get(child.key)

        if (!record) {
          const fragment = document.createDocumentFragment()
          const handle = mountComponent(child.component, getMountProps(child), fragment)
          if (child.ref) {
            child.ref.current = handle
          }
          record = { fragment, handle, ref: child.ref }
          keyedMap.set(child.key, record)
          if (child.ref) {
            child.ref.current = handle
          }
        }

        usedKeys.add(child.key)
        domParent.appendChild(record.fragment)
        continue
      }

      // non-keyed component
      const fragment = document.createDocumentFragment()
      const handle = mountComponent(child.component, getMountProps(child), fragment)
      if (child.ref) {
        child.ref.current = handle
      }
      domParent.appendChild(fragment)
      continue
    }

    if (typeof child === 'string' || typeof child === 'number') {
      domParent.appendChild(document.createTextNode(String(child)))
      continue
    }

    domParent.appendChild(child as Node)
  }

  const keyedMap = (domParent as any).__vaniKeyed as Map<string | number, KeyedRecord> | undefined
  const usedKeys = (domParent as any).__vaniUsedKeys as Set<string | number> | undefined

  if (keyedMap && usedKeys) {
    for (const [key, record] of keyedMap) {
      if (!usedKeys.has(key)) {
        record.handle.dispose()
        if (record.ref) {
          record.ref.current = null
        }
        keyedMap.delete(key)
      }
    }
    usedKeys.clear()
  }
}

function isSvgElement(el: VNode): el is SVGElement {
  return typeof SVGElement !== 'undefined' && el instanceof SVGElement
}

function normalizeAttrKey(key: string, isSvg: boolean) {
  if (key.startsWith('aria')) {
    return 'aria-' + key.replace('aria-', '').replace('aria', '').toLowerCase()
  }
  if (key.startsWith('data')) {
    return 'data-' + key.replace('data-', '').replace('data', '')
  }
  if (key.toLowerCase() === 'htmlfor') {
    return 'for'
  }
  if (isSvg) return key
  return key.toLowerCase()
}

function setProps(el: VNode, props: Record<string, any>) {
  const isSvg = isSsrElement(el) ? svgTags.has(el.tag) : isSvgElement(el)
  for (const key in props) {
    const value = props[key]

    if (['key', 'ref'].includes(key)) {
      continue
    }

    if (key === 'className') {
      const classValue = classNames(value)
      if (isSsrElement(el)) {
        el.props.class = classValue
      } else if (isSvg) {
        ;(el as SVGElement).setAttribute('class', classValue)
      } else {
        ;(el as HTMLElement).className = classValue
      }
      continue
    }

    if (key.startsWith('on') && typeof value === 'function') {
      if (!isSsrElement(el)) {
        ;(el as any)[key.toLowerCase()] = value
      }
    } else if (value === true) {
      if (isSsrElement(el)) {
        el.props[key] = true
      } else {
        ;(el as HTMLElement).setAttribute(key, '')
      }
    } else if (value === false || value == null) {
      continue
    } else {
      const normalizedKey = normalizeAttrKey(key, isSvg)
      if (isSsrElement(el)) {
        el.props[normalizedKey] = String(value)
      } else {
        ;(el as HTMLElement).setAttribute(normalizedKey, String(value))
      }
    }
  }
}

export function classNames(...classes: ClassName[]): string {
  return classes
    .map((cls) => {
      if (cls === null || cls === undefined || cls === '') {
        return
      }
      if (typeof cls === 'string') {
        return cls.trim()
      }
      if (Array.isArray(cls)) {
        return classNames(...cls)
      }
      return Object.entries(cls)
        .filter(([_, value]) => value)
        .map(([key]) => key.trim())
        .join(' ')
        .trim()
    })
    .filter(Boolean)
    .join(' ')
}

// ─────────────────────────────────────────────
// Element helpers
// ─────────────────────────────────────────────

export function el<E extends ElementTagName>(
  tag: E,
  props?: ElementProps<E> | VChild | null,
  ...children: VChild[]
): VNode {
  const node = createElementNode(tag)
  if (isHtmlProps(props)) {
    if (props.ref) {
      if (!isSsrElement(node)) {
        props.ref.current = node as ElementByTag<E>
        ;(node as any).__vaniDomRef = props.ref
      } else {
        props.ref.current = null
      }
    }
    setProps(node, props)
    appendChildren(node, children)
    return node
  }

  appendChildren(node, [props, ...children])
  return node
}

export const fragment = (...children: VChild[]) => {
  if (currentRenderMode === 'ssr') {
    const node: SSRNode = { type: 'fragment', children: [] }
    appendChildren(node, children)
    return node
  }

  const node = document.createDocumentFragment()
  appendChildren(node, children)
  return node
}

// ─────────────────────────────────────────────
// Low-level mount helper for unwrapped component functions
// ─────────────────────────────────────────────
export function mount<Props>(component: Component<Props>, props: Props): VNode {
  if (currentRenderMode === 'ssr') {
    return {
      type: 'component',
      instance: {
        $$vani: 'component',
        component,
        props,
      },
    }
  }

  const fragment = document.createDocumentFragment()
  mountComponent(component, props, fragment)
  return fragment
}

// ─────────────────────────────────────────────
// Transitions and Render batching
// ─────────────────────────────────────────────
let flushScheduled = false
let inTransition = false
let transitionFlushScheduled = false

const urgentQueue = new Set<Handle>()
const transitionQueue = new Set<Handle>()

/**
 * Marks all updates triggered inside the callback as a "transition".
 *
 * A transition represents non-urgent UI work that can be deferred
 * to keep the application responsive.
 *
 * Updates scheduled inside `startTransition`:
 * - do NOT block user interactions
 * - are batched separately from urgent updates
 * - may be flushed later (e.g. after the current event or during idle time)
 *
 * Transitions are NOT animations.
 * They do not control how updates look, only *when* they are applied.
 *
 * Typical use cases:
 * - Filtering or sorting large lists
 * - Rendering expensive subtrees
 * - Applying async results that are not immediately visible
 *
 * Example:
 * ```ts
 * button({
 *   onclick: () => {
 *     // urgent update
 *     setOpen(true)
 *     handle.update()
 *
 *     // non-urgent update
 *     startTransition(() => {
 *       setItems(filter(items))
 *       handle.update()
 *     })
 *   },
 * })
 * ```
 *
 * If multiple transitions are triggered, they are automatically batched.
 * Transition updates never interrupt urgent updates.
 */
export function startTransition(fn: () => void): void {
  const prev = inTransition
  inTransition = true

  try {
    fn()
  } finally {
    inTransition = prev
    scheduleTransitionFlush()
  }
}

function scheduleTransitionFlush() {
  if (transitionFlushScheduled) return
  transitionFlushScheduled = true

  // defer more than urgent work
  setTimeout(() => {
    transitionFlushScheduled = false
    flushTransitionQueue()
  }, 0)
}

function scheduleUrgentFlush() {
  if (flushScheduled) return
  flushScheduled = true

  queueMicrotask(() => {
    flushScheduled = false
    for (const handle of urgentQueue) {
      handle.updateSync()
    }
    urgentQueue.clear()
  })
}

function flushTransitionQueue() {
  for (const handle of transitionQueue) {
    handle.updateSync()
  }
  transitionQueue.clear()

  // if something queued during flush, schedule again
  if (transitionQueue.size > 0) {
    scheduleTransitionFlush()
  }
}

// ─────────────────────────────────────────────
// Hydration and SSR
// ─────────────────────────────────────────────
let isHydrating = false
let hydrationCursor: ChildNode | null = null
let hydrationComponentIndex = 0

function warnHydration(message: string) {
  if (!isDevMode()) return
  console.warn(`[vani] hydration warning: ${message}`)
}

function findNextStartAnchor(parent: Node, componentIndex: number): Comment {
  let node = hydrationCursor
  if (!node || !parent.contains(node)) {
    node = parent.firstChild
  }
  let sawEndBeforeStart = false
  while (node) {
    if (node.nodeType === Node.COMMENT_NODE && node.nodeValue === 'vani:start') {
      if (sawEndBeforeStart) {
        warnHydration(
          `Found <!--vani:end--> before <!--vani:start--> for component #${componentIndex}. ` +
            `This usually means the server HTML anchor order is incorrect.`,
        )
      }
      return node as Comment
    }
    if (node.nodeType === Node.COMMENT_NODE && node.nodeValue === 'vani:end') {
      sawEndBeforeStart = true
    }
    node = node.nextSibling
  }
  warnHydration(
    `Expected <!--vani:start--> for component #${componentIndex}, but none was found. ` +
      `This usually means the server HTML does not match the client component tree.`,
  )
  throw new Error('[vani] hydration failed: start anchor not found')
}

function findMatchingEndAnchor(start: Comment, componentIndex: number): Comment {
  let node = start.nextSibling
  let depth = 0
  while (node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      if (node.nodeValue === 'vani:start') {
        depth += 1
      } else if (node.nodeValue === 'vani:end') {
        if (depth === 0) {
          hydrationCursor = node.nextSibling
          return node as Comment
        }
        depth -= 1
      }
    }
    node = node.nextSibling
  }
  warnHydration(
    `Expected <!--vani:end--> for component #${componentIndex}, but none was found. ` +
      `This usually means the server HTML does not match the client component tree.`,
  )
  throw new Error('[vani] hydration failed: end anchor not found')
}

export function hydrateToDOM(
  components: Array<Component<any> | ComponentInstance<any>>,
  root: HTMLElement,
): Handle[] {
  let handles: Handle[] = []
  isHydrating = true
  hydrationCursor = root.firstChild
  hydrationComponentIndex = 0
  try {
    handles = renderToDOM(components, root)
  } catch (error) {
    console.error('[vani] hydration failed:', error)
  } finally {
    if (isDevMode() && hydrationCursor) {
      let node: ChildNode | null = hydrationCursor
      let foundExtraAnchors = false
      while (node) {
        if (node.nodeType === Node.COMMENT_NODE) {
          const value = node.nodeValue
          if (value === 'vani:start' || value === 'vani:end') {
            foundExtraAnchors = true
            break
          }
        }
        node = node.nextSibling
      }

      if (foundExtraAnchors) {
        warnHydration(
          'Unused SSR anchors detected after hydration. ' +
            'Some server-rendered DOM was not claimed by the client runtime.',
        )
      }
    }
    isHydrating = false
    hydrationCursor = null
    hydrationComponentIndex = 0
  }
  return handles
}

export function isDevMode() {
  if ('__vaniDevMode' in globalThis) {
    return (globalThis as any).__vaniDevMode === true
  }

  // @ts-ignore
  if (import.meta.env) {
    // @ts-ignore
    return import.meta.env.DEV
  }

  // @ts-ignore
  if (typeof process !== 'undefined' && process.env !== undefined) {
    // @ts-ignore
    return process.env.NODE_ENV === 'development'
  }

  return false
}
