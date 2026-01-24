/*
Golden leaf test
================

Given this tree:

App
 ├─ Header
 ├─ Sidebar
 ├─ List
 │   ├─ Item A
 │   ├─ Item B   ← update here
 │   └─ Item C
 └─ Footer

When **Item B** updates:
- ❌ Header must not render
- ❌ Sidebar must not render
- ❌ List must not render
- ❌ Item A / C must not render
- ✅ Only Item B renders

This is Vani's core promise.
*/

import {
  button,
  component,
  div,
  h1,
  h3,
  hydrateToDOM,
  HydrationError,
  p,
  renderSvgString,
  renderToDOM,
  signal,
  span,
  table,
  tbody,
  text,
  th,
  thead,
  tr,
  type Handle,
  type RenderFn,
} from 'vani'

// ─────────────────────────────────────────────
// Render counter helper
// ─────────────────────────────────────────────

function getRenderBgStyle(name: string): string {
  const count = (window as any).__renders[name] || 0
  const opacity = Math.min(count * 0.025, 1) // 5% per render, max 100%
  return `background-color: rgba(0, 0, 0, ${opacity});`
}

function withRenderCounter(name: string, fn: RenderFn): RenderFn {
  return () => {
    ;(window as any).__renders[name]++
    return fn()
  }
}

const statusElId = 'test-status'
const tableBodyId = 'render-table-body'
const timestampId = 'render-timestamp'

function runRenderInputSmokeTests() {
  const Smoke = component(() => () => div('smoke'))
  const tempRoot = document.createElement('div')
  tempRoot.style.display = 'none'
  document.body.appendChild(tempRoot)

  const cleanups: Handle[] = []
  try {
    const singleHandles = renderToDOM(Smoke(), tempRoot)
    if (singleHandles.length !== 1) {
      throw new Error('[renderToDOM] single component should return one handle.')
    }
    cleanups.push(...singleHandles)
    singleHandles[0].updateSync()

    const arrayHandles = renderToDOM([Smoke()], tempRoot)
    if (arrayHandles.length !== 1) {
      throw new Error('[renderToDOM] array of one component should return one handle.')
    }
    cleanups.push(...arrayHandles)
    arrayHandles[0].updateSync()

    const hydrationRoot = document.createElement('div')
    hydrationRoot.style.display = 'none'
    hydrationRoot.innerHTML = '<div>no anchors</div>'
    document.body.appendChild(hydrationRoot)

    const loggedErrors: unknown[][] = []
    const originalError = console.error
    console.error = (...args) => {
      loggedErrors.push(args)
      const hasHydrationError = args.some((arg) => arg instanceof HydrationError)
      if (hasHydrationError) return
      originalError(...args)
    }

    try {
      hydrateToDOM(Smoke(), hydrationRoot)
    } finally {
      console.error = originalError
      hydrationRoot.remove()
    }

    const sawHydrationError = loggedErrors.some((args) =>
      args.some((arg) => arg instanceof HydrationError),
    )
    if (!sawHydrationError) {
      throw new Error('[hydrateToDOM] expected HydrationError to be logged.')
    }

    let svgThrew = false
    try {
      renderSvgString('<svg><g></svg>')
    } catch {
      svgThrew = true
    }
    if (!svgThrew) {
      throw new Error('[renderSvgString] expected invalid SVG to throw.')
    }
    console.info('[Golden leaf] Smoke tests passed ✅')
  } catch (error) {
    console.error('[Golden leaf] Smoke tests failed ❌', error)
    throw error
  } finally {
    for (const handle of cleanups) {
      handle.dispose()
    }
    tempRoot.remove()
  }
}

function setStatus(kind: 'info' | 'success' | 'danger', message: string) {
  const statusEl = document.getElementById(statusElId)
  if (!statusEl) return
  statusEl.className = `bench-alert bench-alert-${kind}`
  statusEl.textContent = message
}

function renderRendersUI() {
  const tableBody = document.getElementById(tableBodyId)
  if (!tableBody) return
  const renders = (window as any).__renders as Record<string, number>
  tableBody.innerHTML = Object.entries(renders)
    .map(
      ([name, count]) =>
        `<tr class="bench-table-row"><td class="bench-table-cell">${name}</td><td class="bench-table-cell text-right">${count}</td></tr>`,
    )
    .join('')

  const timestampEl = document.getElementById(timestampId)
  if (timestampEl) {
    timestampEl.textContent = new Date().toLocaleTimeString()
  }
}

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────

const Header = component(() => {
  return withRenderCounter('Header', () =>
    div(
      { className: 'bench-card', style: getRenderBgStyle('Header') },
      div(
        { className: 'bench-card-body py-1 text-center' },
        'Header ',
        span({ className: 'text-muted text-sm' }, '(should NOT re-render)'),
      ),
    ),
  )
})

const Footer = component(() => {
  return withRenderCounter('Footer', () =>
    div(
      { className: 'bench-card', style: getRenderBgStyle('Footer') },
      div(
        { className: 'bench-card-body py-1 text-center' },
        'Footer ',
        span({ className: 'text-muted text-sm' }, '(should NOT re-render)'),
      ),
    ),
  )
})

let triggerSignalUpdate: (() => void) | null = null

const SignalBox = component(() => {
  const [count, setCount] = signal(0)
  triggerSignalUpdate = () => setCount((value) => value + 1)

  return withRenderCounter('SignalBox', () =>
    div(
      { className: 'bench-card', style: getRenderBgStyle('SignalBox') },
      div(
        { className: 'bench-card-header bench-manual-card-header' },
        h3({ className: 'bench-card-title' }, 'Signals'),
        span({ className: 'text-muted text-sm' }, '(should NOT re-render)'),
      ),
      div(
        { className: 'bench-card-body bench-manual-card-body bench-inline-between' },
        span(
          { className: 'text-muted' },
          text(() => `Count: ${count()}`),
        ),
        button(
          {
            className: 'bench-button bench-button-ghost',
            onclick: () => triggerSignalUpdate?.(),
          },
          'Increment',
        ),
      ),
    ),
  )
})

const Item = component((props: { id: string }, handle) => {
  const name = `Item-${props.id}`
  return withRenderCounter(name, () =>
    div(
      { className: 'bench-list-item bench-manual-list-item', style: getRenderBgStyle(name) },
      span(
        { className: 'bench-item-title' },
        props.id,
        ' ',
        span({ className: 'text-muted text-sm' }, '(only this re-renders)'),
      ),
      button(
        {
          className: 'bench-button bench-button-primary',
          onclick: () => {
            setStatus('info', `Manual update triggered for Item ${props.id}.`)
            handle.updateSync()
            renderRendersUI()
          },
        },
        'Update',
      ),
    ),
  )
})

const List = component(() => {
  return withRenderCounter('List', () =>
    div(
      { className: 'bench-card', style: getRenderBgStyle('List') },
      div(
        { className: 'bench-card-header bench-manual-card-header' },
        h3({ className: 'bench-card-title' }, 'List'),
        span({ className: 'text-muted text-sm' }, '(should NOT re-render)'),
      ),
      div(
        { className: 'bench-list' },
        Item({ id: 'A', key: 'A' }),
        Item({ id: 'B', key: 'B' }),
        Item({ id: 'C', key: 'C' }),
      ),
    ),
  )
})

const App = component(() => {
  return () =>
    div(
      { className: 'bench-container bench-section' },
      div({}, h1({ className: 'bench-manual-title' }, "Vani's Golden leaf test")),
      p(
        { className: 'bench-manual-lead text-muted' },
        'Only the buttons should re-render when they update. All other nodes must stay untouched.',
      ),
      div(
        { className: 'bench-grid-2' },
        div(
          div(
            { className: 'bench-card' },
            div(
              { className: 'bench-card-header bench-manual-card-header' },
              h3({ className: 'bench-card-title' }, 'Rendered tree'),
            ),
            div(
              { className: 'bench-card-body bench-manual-card-body bench-stack' },
              Header(),
              List(),
              SignalBox(),
              Footer(),
            ),
          ),
        ),
        div(
          div(
            { className: 'bench-card' },
            div(
              { className: 'bench-card-header bench-manual-card-header' },
              h3({ className: 'bench-card-title' }, 'Debug info'),
            ),
            div(
              { className: 'bench-card-body bench-manual-card-body bench-stack' },
              div(
                { className: 'bench-alert bench-alert-info', id: statusElId },
                'Waiting for test to run...',
              ),
              div(
                { className: 'text-sm text-muted' },
                span('Last update: '),
                span({ id: timestampId }, '—'),
              ),
              table(
                { className: 'bench-table' },
                thead(
                  tr(
                    { className: 'bench-table-head' },
                    th('Node'),
                    th({ className: 'text-right' }, 'Renders'),
                  ),
                ),
                tbody({ id: tableBodyId }),
              ),
            ),
          ),
        ),
      ),
    )
})

// ─────────────────────────────────────────────
// Test setup
// ─────────────────────────────────────────────

;(window as any).__renders = {
  Header: 0,
  Sidebar: 0,
  List: 0,
  SignalBox: 0,
  Footer: 0,
  'Item-A': 0,
  'Item-B': 0,
  'Item-C': 0,
}

// mount app
const root = document.querySelector('#app') as HTMLElement | null
if (!root) throw new Error('#app not found')
runRenderInputSmokeTests()
renderToDOM(App(), root)
renderRendersUI()

// ─────────────────────────────────────────────
// Trigger leaf update (Item B)
// ─────────────────────────────────────────────

queueMicrotask(() => {
  // find Item-B button
  const buttons = root.querySelectorAll('button')
  const itemBButton = Array.from(buttons).find((btn) =>
    btn.parentElement?.textContent?.includes('B'),
  )

  if (!itemBButton) {
    throw new Error('Item-B button not found')
  }

  // reset counters AFTER initial render
  for (const key in (window as any).__renders) {
    ;(window as any).__renders[key] = 0
  }

  // click Item-B
  setStatus('info', 'Running automatic test (Item B update).')
  itemBButton.click()

  // ⬇️ wait for update flush
  queueMicrotask(() => {
    const renders = (window as any).__renders

    renderRendersUI()

    function assertEqual(name: string, actual: number, expected: number) {
      if (actual !== expected) {
        throw new Error(`[Golden leaf failed] ${name}: expected ${expected}, got ${actual}`)
      }
    }

    try {
      assertEqual('Item-B', renders['Item-B'], 1)
      assertEqual('Item-A', renders['Item-A'], 0)
      assertEqual('Item-C', renders['Item-C'], 0)
      assertEqual('List', renders['List'], 0)
      assertEqual('Header', renders['Header'], 0)
      assertEqual('Sidebar', renders['Sidebar'], 0)
      assertEqual('Footer', renders['Footer'], 0)
      if (!triggerSignalUpdate) {
        setStatus('success', '✅ Golden leaf test passed: Only Item B re-rendered.')
        return
      }

      setStatus('info', 'Item B test passed. Running signal update test...')
      renders.SignalBox = 0
      triggerSignalUpdate()

      queueMicrotask(() => {
        renderRendersUI()
        try {
          assertEqual('SignalBox', renders.SignalBox, 0)
          setStatus(
            'success',
            '✅ Golden leaf test passed: Only Item B re-rendered and signals avoided rerenders.',
          )
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Signal update test failed.'
          setStatus('danger', message)
          throw error
        }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Golden leaf test failed.'
      setStatus('danger', message)
      throw error
    }
  })
})
