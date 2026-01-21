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

import { button, div } from '@/vani/html'
import { component, renderToDOM, type RenderFn } from '@/vani/runtime'

// ─────────────────────────────────────────────
// Render counter helper
// ─────────────────────────────────────────────

function withRenderCounter(name: string, fn: RenderFn): RenderFn {
  return () => {
    ;(window as any).__renders[name]++
    return fn()
  }
}

function printRenders() {
  console.clear()
  console.table((window as any).__renders)
}

// ─────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────

const Header = component(() => {
  return withRenderCounter('Header', () => div('Header'))
})

const Sidebar = component(() => {
  return withRenderCounter('Sidebar', () => div('Sidebar'))
})

const Footer = component(() => {
  return withRenderCounter('Footer', () => div('Footer'))
})

const Item = component((props: { id: string }, handle) => {
  return withRenderCounter(`Item-${props.id}`, () =>
    div(
      props.id,
      button(
        {
          onclick: () => {
            // immediate update to see the updated renders in the console
            handle.updateSync()
            printRenders()
          },
        },
        'Update',
      ),
    ),
  )
})

const List = component(() => {
  return withRenderCounter('List', () =>
    div(Item({ id: 'A', key: 'A' }), Item({ id: 'B', key: 'B' }), Item({ id: 'C', key: 'C' })),
  )
})

const App = component(() => {
  return () => div(Header(), Sidebar(), List(), Footer())
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
const root = document.createElement('div')
document.body.appendChild(root)
renderToDOM([App()], root)

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
  itemBButton.click()

  // ⬇️ wait for update flush
  queueMicrotask(() => {
    const renders = (window as any).__renders

    printRenders()

    function assertEqual(name: string, actual: number, expected: number) {
      if (actual !== expected) {
        throw new Error(`[Golden leaf failed] ${name}: expected ${expected}, got ${actual}`)
      }
    }

    assertEqual('Item-B', renders['Item-B'], 1)
    assertEqual('Item-A', renders['Item-A'], 0)
    assertEqual('Item-C', renders['Item-C'], 0)
    assertEqual('List', renders['List'], 0)
    assertEqual('Header', renders['Header'], 0)
    assertEqual('Sidebar', renders['Sidebar'], 0)
    assertEqual('Footer', renders['Footer'], 0)

    console.log('✅ Golden leaf test passed')
  })
})
