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
  small,
  span,
  table,
  tbody,
  td,
  th,
  thead,
  tr,
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
    .map(
      ([name, count]) =>
        `<tr><td>${name}</td><td class="text-right">${count}</td></tr>`,
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
    div({ className: 'panel panel-default' }, div({ className: 'panel-body' }, 'Header')),
  )
})

const Sidebar = component(() => {
  return withRenderCounter('Sidebar', () =>
    div({ className: 'panel panel-default' }, div({ className: 'panel-body' }, 'Sidebar')),
  )
})

const Footer = component(() => {
  return withRenderCounter('Footer', () =>
    div({ className: 'panel panel-default' }, div({ className: 'panel-body' }, 'Footer')),
  )
})

const Item = component((props: { id: string }, handle) => {
  return withRenderCounter(`Item-${props.id}`, () =>
    div(
      { className: 'list-group-item clearfix' },
      span(props.id),
      button(
        {
          className: 'btn btn-xs btn-primary pull-right',
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
      { className: 'panel panel-default' },
      div({ className: 'panel-heading' }, h3({ className: 'panel-title' }, 'List')),
      div(
        { className: 'list-group' },
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
      { className: 'container' },
      div(
        { className: 'page-header' },
        h1('Golden leaf test ', small('UI runner')),
      ),
      p(
        { className: 'lead' },
        'Only Item B should re-render when it updates. All other nodes must stay untouched.',
      ),
      div(
        { className: 'row' },
        div(
          { className: 'col-sm-6' },
          div(
            { className: 'panel panel-default' },
            div({ className: 'panel-heading' }, h3({ className: 'panel-title' }, 'Rendered tree')),
            div({ className: 'panel-body' }, Header(), Sidebar(), List(), Footer()),
          ),
        ),
        div(
          { className: 'col-sm-6' },
          div(
            { className: 'panel panel-info' },
            div({ className: 'panel-heading' }, h3({ className: 'panel-title' }, 'Debug info')),
            div(
              { className: 'panel-body' },
              div(
                { className: 'alert alert-info', id: statusElId },
                'Waiting for test to run...',
              ),
              div(
                { className: 'clearfix' },
                span({ className: 'text-muted' }, 'Last update: '),
                span({ className: 'text-muted', id: timestampId }, '—'),
              ),
              table(
                { className: 'table table-striped table-condensed', style: 'margin-top: 12px;' },
                thead(tr(th('Node'), th({ className: 'text-right' }, 'Renders'))),
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
  Footer: 0,
  'Item-A': 0,
  'Item-B': 0,
  'Item-C': 0,
}

// mount app
const root = document.querySelector('#app')
if (!root) throw new Error('#app not found')
renderToDOM([App()], root)
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
      setStatus('success', '✅ Golden leaf test passed.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Golden leaf test failed.'
      setStatus('danger', message)
      throw error
    }
  })
})
