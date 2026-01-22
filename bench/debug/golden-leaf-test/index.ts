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
  p,
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
  statusEl.className = `alert alert-${kind}`
  statusEl.textContent = message
}

function renderRendersUI() {
  const tableBody = document.getElementById(tableBodyId)
  if (!tableBody) return
  const renders = (window as any).__renders as Record<string, number>
  tableBody.innerHTML = Object.entries(renders)
    .map(([name, count]) => `<tr><td>${name}</td><td class="text-end">${count}</td></tr>`)
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
      { className: 'card shadow-sm border-0' },
      div({ className: 'card-body py-2 text-center fw-semibold text-secondary' }, 'Header'),
    ),
  )
})

const Sidebar = component(() => {
  return withRenderCounter('Sidebar', () =>
    div(
      { className: 'card shadow-sm border-0' },
      div({ className: 'card-body py-2 text-center fw-semibold text-secondary' }, 'Sidebar'),
    ),
  )
})

const Footer = component(() => {
  return withRenderCounter('Footer', () =>
    div(
      { className: 'card shadow-sm border-0' },
      div({ className: 'card-body py-2 text-center fw-semibold text-secondary' }, 'Footer'),
    ),
  )
})

let triggerSignalUpdate: (() => void) | null = null

const SignalBox = component(() => {
  const [count, setCount] = signal(0)
  triggerSignalUpdate = () => setCount((value) => value + 1)

  return withRenderCounter('SignalBox', () =>
    div(
      { className: 'card shadow-sm border-0' },
      div({ className: 'card-header bg-light' }, h3({ className: 'h6 mb-0' }, 'Signals')),
      div(
        { className: 'card-body d-flex align-items-center justify-content-between' },
        span(
          { className: 'text-muted' },
          text(() => `Count: ${count()}`),
        ),
        button(
          {
            className: 'btn btn-sm btn-outline-secondary',
            onclick: () => triggerSignalUpdate?.(),
          },
          'Increment',
        ),
      ),
    ),
  )
})

const Item = component((props: { id: string }, handle) => {
  return withRenderCounter(`Item-${props.id}`, () =>
    div(
      { className: 'list-group-item d-flex align-items-center justify-content-between' },
      span({ className: 'fw-semibold' }, props.id),
      button(
        {
          className: 'btn btn-sm btn-primary',
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
      { className: 'card shadow-sm border-0' },
      div({ className: 'card-header bg-light' }, h3({ className: 'h6 mb-0' }, 'List')),
      div(
        { className: 'list-group list-group-flush' },
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
      { className: 'container py-5' },
      div({ className: 'mb-3' }, h1({ className: 'fw-bold' }, "Vani's Golden leaf test")),
      p(
        { className: 'lead text-muted' },
        'Only the buttons should re-render when they update. All other nodes must stay untouched.',
      ),
      div(
        { className: 'row g-4' },
        div(
          { className: 'col-lg-6' },
          div(
            { className: 'card shadow-sm border-0' },
            div(
              { className: 'card-header bg-light' },
              h3({ className: 'h6 mb-0' }, 'Rendered tree'),
            ),
            div(
              { className: 'card-body d-grid gap-3' },
              Header(),
              Sidebar(),
              List(),
              SignalBox(),
              Footer(),
            ),
          ),
        ),
        div(
          { className: 'col-lg-6' },
          div(
            { className: 'card shadow-sm border-0' },
            div({ className: 'card-header bg-light' }, h3({ className: 'h6 mb-0' }, 'Debug info')),
            div(
              { className: 'card-body' },
              div(
                { className: 'alert alert-info mb-3', id: statusElId },
                'Waiting for test to run...',
              ),
              div(
                { className: 'small text-muted mb-3' },
                span('Last update: '),
                span({ id: timestampId }, '—'),
              ),
              table(
                { className: 'table table-sm table-striped align-middle mb-0' },
                thead(tr(th('Node'), th({ className: 'text-end' }, 'Renders'))),
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
