import {
  getRenderMode,
  getSignalDomAdapter,
  type AttrValue,
  type ClassName,
  type TextNode,
} from './common'

export type SignalGetter<T> = () => T
export type SignalSetter<T> = (value: T | ((prev: T) => T)) => void
export type Signal<T> = [SignalGetter<T>, SignalSetter<T>]

type SignalRecord<T> = {
  value: T
  observers: Set<SignalObserver>
}

type SignalObserver = {
  fn: () => void | (() => void)
  deps: Set<SignalRecord<any>>
  cleanup?: () => void
  disposed: boolean
}

let currentObserver: SignalObserver | null = null
const observerQueue = new Set<SignalObserver>()
let observerFlushScheduled = false

function trackSignal(record: SignalRecord<any>) {
  if (!currentObserver || currentObserver.disposed) return
  if (!currentObserver.deps.has(record)) {
    currentObserver.deps.add(record)
    record.observers.add(currentObserver)
  }
}

function cleanupObserver(observer: SignalObserver) {
  for (const record of observer.deps) {
    record.observers.delete(observer)
  }
  observer.deps.clear()
  if (observer.cleanup) {
    observer.cleanup()
    observer.cleanup = undefined
  }
}

function runObserver(observer: SignalObserver) {
  if (observer.disposed) return
  cleanupObserver(observer)
  const prev = currentObserver
  currentObserver = observer
  const cleanup = observer.fn()
  currentObserver = prev
  if (typeof cleanup === 'function') {
    observer.cleanup = cleanup
  }
}

function scheduleObserver(observer: SignalObserver) {
  if (observer.disposed) return
  observerQueue.add(observer)
  if (observerFlushScheduled) return
  observerFlushScheduled = true
  queueMicrotask(() => {
    observerFlushScheduled = false
    const queued = Array.from(observerQueue)
    observerQueue.clear()
    for (const next of queued) {
      runObserver(next)
    }
  })
}

export function signal<T>(value: T): Signal<T> {
  const record: SignalRecord<T> = {
    value,
    observers: new Set(),
  }

  const getter: SignalGetter<T> = () => {
    trackSignal(record)
    return record.value
  }

  const setter: SignalSetter<T> = (next) => {
    const resolved = typeof next === 'function' ? (next as (prev: T) => T)(record.value) : next
    if (Object.is(resolved, record.value)) return
    record.value = resolved
    for (const observer of record.observers) {
      scheduleObserver(observer)
    }
  }

  return [getter, setter]
}

export function effect(fn: () => void | (() => void)): () => void {
  if (getRenderMode() === 'ssr') {
    fn()
    return () => {}
  }
  return createEffect(fn)
}

export function createEffect(fn: () => void | (() => void)): () => void {
  const observer: SignalObserver = {
    fn,
    deps: new Set(),
    disposed: false,
  }

  runObserver(observer)

  return () => {
    if (observer.disposed) return
    observer.disposed = true
    cleanupObserver(observer)
  }
}

export function derive<T>(fn: () => T): SignalGetter<T> {
  const [get, set] = signal(fn())
  createEffect(() => {
    set(fn())
  })
  return get
}

export function text(value: SignalGetter<unknown> | (() => unknown) | unknown): TextNode {
  const resolve = () => (typeof value === 'function' ? (value as () => unknown)() : value)
  const textValue = String(resolve() ?? '')
  const adapter = getSignalDomAdapter()
  if (!adapter) {
    if (typeof document !== 'undefined') {
      return document.createTextNode(textValue)
    }
    return { type: 'text', text: textValue }
  }

  const node = adapter.createTextNode(textValue)
  if (adapter.getRenderMode() === 'ssr') {
    return node
  }

  if (typeof value === 'function') {
    const textNode = node as Text
    const dispose = createEffect(() => {
      textNode.textContent = String(resolve() ?? '')
    })
    getSignalDomAdapter()?.addNodeCleanup(textNode, dispose)
  }

  return node as TextNode
}

export function attr(
  el: Element,
  name: string,
  value: SignalGetter<AttrValue> | (() => AttrValue) | AttrValue,
) {
  const adapter = getSignalDomAdapter()
  if (!adapter) return () => {}
  if (adapter.getRenderMode() === 'ssr') return () => {}
  if (name.startsWith('on')) return () => {}

  const isSvg = el instanceof SVGElement
  const key = name === 'className' ? 'class' : adapter.normalizeAttrKey(name, isSvg)

  const apply = (nextValue: AttrValue) => {
    if (key === 'class') {
      const classValue = adapter.classNames(nextValue as ClassName)
      if (!classValue) {
        el.removeAttribute('class')
        return
      }
      el.setAttribute('class', classValue)
      return
    }

    if (nextValue === true) {
      el.setAttribute(key, '')
      return
    }

    if (nextValue === false || nextValue == null) {
      el.removeAttribute(key)
      return
    }

    el.setAttribute(key, String(nextValue))
  }

  if (typeof value === 'function') {
    const disposer = createEffect(() => {
      apply((value as () => AttrValue)())
    })
    adapter.addNodeCleanup(el, disposer)
    return disposer
  }

  apply(value as AttrValue)
  return () => {}
}
