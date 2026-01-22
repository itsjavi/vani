# Vani Documentation

Vani is a small, dependency‑free UI runtime built around a simple idea:

> Rendering should be explicit, local, and predictable.

Vani is **not** a Virtual DOM, not reactive‑by‑default, and not compiler‑driven. Components own a
DOM subtree delimited by anchors and only update when you explicitly ask them to.

---

## Install

```bash
pnpm add @vanijs/vani
```

---

## Quick Start (SPA)

```ts
import { component, div, button, renderToDOM, type Handle } from '@vanijs/vani'

const Counter = component((_, handle: Handle) => {
  let count = 0
  return () =>
    div(
      `Count: ${count}`,
      button(
        {
          onclick: () => {
            count += 1
            handle.update()
          },
        },
        'Inc',
      ),
    )
})

const appRoot = document.getElementById('app')
if (!appRoot) throw new Error('#app not found')

renderToDOM([Counter()], appRoot)
```

---

## JSX mode examples

Vani is JS-first and transpiler-free, with an optional JSX adapter. JSX mode requires
`jsxImportSource` to be set to `@vanijs/vani` and a `.tsx` file.

### 1) JSX counter button

```tsx
import { component, renderToDOM, type Handle } from '@vanijs/vani'

const Counter = component((_, handle: Handle) => {
  let count = 0
  return () => (
    <button
      type="button"
      onclick={() => {
        count += 1
        handle.update()
      }}
    >
      Count: {count}
    </button>
  )
})

renderToDOM([Counter()], document.getElementById('app')!)
```

### 2) JSX component inside JS-first components

```tsx
import { component } from '@vanijs/vani'
import * as h from '@vanijs/vani/html'

const Badge = component<{ label: string }>((props) => {
  return () => <span>{props.label}</span>
})

const Panel = component(() => {
  return () =>
    h.div(
      'Mixed render:',
      Badge({ label: 'JSX component' }),
      h.span('inside a JS-first component.'),
    )
})
```

---

## Incremental adoption (mounting points)

Vani is intentionally small and lightweight, so you don't need to replace your full stack. You can
adopt it gradually by mounting Vani components inside existing apps (React, Vue, server-rendered
pages, etc.) using plain DOM elements as mounting points.

Benefits:

- Gradual migration: move one widget or screen at a time without a rewrite.
- Minimal surface area: no global runtime or framework lock-in.
- Clear ownership: a Vani component owns only its subtree between anchors.
- Easy rollback: remove a mount point and the rest of the app keeps working.

### Example: mount a Vani widget inside React

```tsx
import { useEffect, useRef } from 'react'
import { component, div, button, renderToDOM, type Handle } from '@vanijs/vani'

// Vani component (local state + explicit updates)
const VaniCounter = component((_, handle) => {
  let count = 0
  return () =>
    div(
      `Count: ${count}`,
      button(
        {
          onclick: () => {
            count += 1
            handle.update()
          },
        },
        'Increment',
      ),
    )
})

// React component that hosts the Vani widget
export function MyReactComponent() {
  const containerRef = useRef<HTMLDivElement>(null)
  const vaniHandlesRef = useRef<Handle[] | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Mount Vani into a React-managed DOM element (the mounting point)
    vaniHandlesRef.current = renderToDOM([VaniCounter()], containerRef.current)

    // Cleanup when React unmounts
    return () => {
      for (const handle of vaniHandlesRef.current ?? []) {
        handle.dispose()
      }
      vaniHandlesRef.current = null
    }
  }, [])

  return <div ref={containerRef} />
}
```

---

## Core Concepts

### 1) Components are functions

Components are functions that return a render function:

```ts
import { component, div } from '@vanijs/vani'

const Hello = component(() => {
  return () => div('Hello Vani')
})
```

### 2) Explicit updates

Re-renders are always explicit: call `handle.update()` to refresh a component’s subtree. The only
automatic update is the initial mount (or `clientOnly` during hydration), which schedules the first
render for you.

```ts
import { component, div, button, type Handle } from '@vanijs/vani'

const Clicker = component((_, handle: Handle) => {
  let clicks = 0
  return () =>
    div(
      `Clicks: ${clicks}`,
      button(
        {
          onclick: () => {
            clicks += 1
            handle.update()
          },
        },
        'Click',
      ),
    )
})
```

### 3) Subtree ownership (anchors)

Each component owns a DOM range delimited by anchors:

```html
<!--vani:start-->
... subtree ...
<!--vani:end-->
```

Updates replace only the DOM between anchors.

### 4) Lists and item-level updates

Lists are efficient in Vani when each item is its own component. Every item owns a tiny subtree and
can update itself (or be updated via a ref) without touching siblings. Use `key` to preserve
identity across reorders.

Key ideas:

- Represent list data by id (Map or array + id).
- Render each row as a keyed component.
- Store a `ComponentRef` per id so you can call `ref.current?.update()` for that item only.
- Call the list handle only when the list structure changes (add/remove/reorder).

Example:

```ts
import { component, ul, li, input, button, type Handle, type ComponentRef } from '@vanijs/vani'

type Todo = { id: string; text: string; done: boolean }

const Row = component<{
  id: string
  getItem: (id: string) => Todo | undefined
  onToggle: (id: string) => void
  onRename: (id: string, text: string) => void
}>((props) => {
  return () => {
    const item = props.getItem(props.id)
    if (!item) return null
    return li(
      input({
        type: 'checkbox',
        checked: item.done,
        onchange: () => props.onToggle(item.id),
      }),
      input({
        value: item.text,
        oninput: (event) => {
          const value = (event.currentTarget as HTMLInputElement).value
          props.onRename(item.id, value)
        },
      }),
    )
  }
})

const List = component((_, handle: Handle) => {
  let order = ['a', 'b']
  const items = new Map<string, Todo>([
    ['a', { id: 'a', text: 'Ship Vani', done: false }],
    ['b', { id: 'b', text: 'Write docs', done: true }],
  ])

  const refs = new Map<string, ComponentRef>()
  const getRef = (id: string) => {
    let ref = refs.get(id)
    if (!ref) {
      ref = { current: null }
      refs.set(id, ref)
    }
    return ref
  }

  const getItem = (id: string) => items.get(id)

  const updateItem = (id: string, next: Partial<Todo>) => {
    const current = items.get(id)
    if (!current) return
    items.set(id, { ...current, ...next })
    refs.get(id)?.current?.update()
  }

  const toggle = (id: string) => {
    const current = items.get(id)
    if (!current) return
    updateItem(id, { done: !current.done })
  }

  const rename = (id: string, text: string) => updateItem(id, { text })

  const add = (text: string) => {
    const id = String(order.length + 1)
    items.set(id, { id, text, done: false })
    order = [...order, id]
    handle.update()
  }

  const remove = (id: string) => {
    items.delete(id)
    refs.delete(id)
    order = order.filter((value) => value !== id)
    handle.update()
  }

  return () =>
    ul(
      order.map((id) =>
        Row({
          key: id,
          ref: getRef(id),
          id,
          getItem,
          onToggle: toggle,
          onRename: rename,
        }),
      ),
      button({ onclick: () => add('New item') }, 'Add'),
      button(
        {
          onclick: () => {
            const first = order[0]
            if (first) remove(first)
          },
        },
        'Remove first',
      ),
    )
})
```

This pattern keeps updates local: changing an item triggers only that row’s subtree update, while
structural list changes re-render the list container and reuse keyed rows.

---

### 5) Forms with explicit submit

For forms, you can keep input values in local variables and update the DOM only on submit. This
matches Vani’s model: read input changes without re-rendering, then call `handle.update()` when the
user explicitly submits.

Example:

```ts
import { component, form, label, input, button, div, type Handle } from '@vanijs/vani'

const ContactForm = component((_, handle: Handle) => {
  let name = ''
  let email = ''
  let submitted = false

  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    submitted = true
    handle.update()
  }

  return () =>
    form(
      { onsubmit: onSubmit },
      label('Name'),
      input({
        name: 'name',
        value: name,
        oninput: (event) => {
          name = (event.currentTarget as HTMLInputElement).value
        },
      }),
      label('Email'),
      input({
        name: 'email',
        type: 'email',
        value: email,
        oninput: (event) => {
          email = (event.currentTarget as HTMLInputElement).value
        },
      }),
      button({ type: 'submit' }, 'Send'),
      submitted ? div(`Submitted: ${name} <${email}>`) : null,
    )
})
```

The DOM only updates on submit. Input changes mutate local variables but do not trigger a render
until the user confirms.

---

### 5.1) Inputs and focus

Vani replaces a component’s subtree on update. If you re-render on every keystroke, the input node
is recreated and the browser will drop focus/selection. Prefer uncontrolled inputs and update on
submit/blur, or split the input into its own component so only a sibling preview re-renders.

If you need a controlled input, preserve focus explicitly:

```ts
import { component, div, input, type DomRef, type Handle } from '@vanijs/vani'

const ControlledInput = component((_, handle: Handle) => {
  const ref: DomRef<HTMLInputElement> = { current: null }
  let value = ''

  const updateWithFocus = () => {
    const prev = ref.current
    const start = prev?.selectionStart ?? null
    const end = prev?.selectionEnd ?? null

    handle.updateSync()

    const next = ref.current
    if (next) {
      next.focus()
      if (start != null && end != null) {
        next.setSelectionRange(start, end)
      }
    }
  }

  return () =>
    div(
      input({
        ref,
        value,
        oninput: (event) => {
          value = (event.currentTarget as HTMLInputElement).value
          updateWithFocus()
        },
      }),
      div(`Value: ${value}`),
    )
})
```

---

### 6) Conditional rendering

Conditional rendering is just normal control flow inside the render function. You compute a boolean
from your local state and return either the element or `null`. Updates are still explicit: call
`handle.update()` when you want the condition to be re-evaluated and the DOM to change.

Example:

```ts
import { component, div, button, type Handle } from '@vanijs/vani'

const TogglePanel = component((_, handle: Handle) => {
  let open = false

  const toggle = () => {
    open = !open
    handle.update()
  }

  return () =>
    div(
      button({ onclick: toggle }, open ? 'Hide details' : 'Show details'),
      open ? div('Now you see me') : null,
    )
})
```

The `open` flag is local state. When it changes, you call `handle.update()` to re-render the
component’s subtree; the conditional element is added or removed accordingly.

---

### 7) Scheduling across independent regions

In large apps, keep each UI region as its own component root, and schedule updates explicitly. Use
microtasks for immediate batching and `startTransition()` for non‑urgent work. This lets you control
_when_ updates happen without hidden dependencies.

Strategy:

- Give each region its own `handle`.
- Coalesce multiple changes in the same tick into a single update per region.
- Use microtasks for urgent updates (input, selection).
- Use `startTransition()` for expensive or non‑urgent work (filters, reorders).
- Avoid cascading updates by keeping regions independent and coordinating through explicit APIs.

Example scheduler:

```ts
import { startTransition, type Handle } from '@vanijs/vani'

type RegionId = 'sidebar' | 'content' | 'status'

const pending = new Set<RegionId>()
const handles = new Map<RegionId, Handle>()

export const registerRegion = (id: RegionId, handle: Handle) => {
  handles.set(id, handle)
}

export const scheduleRegionUpdate = (id: RegionId, opts?: { transition?: boolean }) => {
  pending.add(id)

  if (opts?.transition) {
    startTransition(flush)
    return
  }

  queueMicrotask(flush)
}

const flush = () => {
  for (const id of pending) {
    handles.get(id)?.update()
  }
  pending.clear()
}
```

This design keeps scheduling predictable: each region updates at most once per flush, and you can
decide which updates are urgent vs. deferred. If a region needs data from another, call its public
API first, then schedule both regions explicitly in the same flush.

---

## Advanced patterns

These patterns stay explicit while scaling across larger apps.

### Global state with subscriptions

Use a small store with `getState`, `setState`, and `subscribe`. Components subscribe once and call
`handle.update()` on changes.

```ts
// store.ts
type Listener = () => void
type AppState = { count: number }

let state: AppState = { count: 0 }
const listeners = new Set<Listener>()

export const getState = () => state
export const setState = (next: AppState) => {
  state = next
  for (const listener of listeners) listener()
}
export const subscribe = (listener: Listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
```

```ts
import { component, div, button, type Handle } from '@vanijs/vani'
import { getState, setState, subscribe } from './store'

const Counter = component((_, handle: Handle) => {
  handle.effect(() => subscribe(() => handle.update()))

  return () => {
    const { count } = getState()
    return div(`Count: ${count}`, button({ onclick: () => setState({ count: count + 1 }) }, 'Inc'))
  }
})
```

### Data fetching + cache invalidation

Keep a simple cache and explicit invalidation. Updates are manual and predictable.

```ts
type Listener = () => void
const listeners = new Set<Listener>()
const cache = new Map<string, unknown>()

export const subscribe = (listener: Listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getCached = <T>(key: string) => cache.get(key) as T | undefined

export const refresh = async (key: string, fetcher: () => Promise<unknown>) => {
  cache.set(key, await fetcher())
  for (const listener of listeners) listener()
}
```

### Derived (selector) state

Compute derived values during render, or cache them when the base state changes. This keeps updates
explicit and avoids hidden dependencies.

```ts
const getVisibleItems = (items: string[], filter: string) =>
  filter ? items.filter((item) => item.includes(filter)) : items

// In render:
const visible = getVisibleItems(items, filter)
```

### Event bus for cross-feature coordination

For decoupled features, use a tiny event bus and update explicitly when events fire.

```ts
type Listener = (payload?: unknown) => void
const listeners = new Map<string, Set<Listener>>()

export const on = (event: string, listener: Listener) => {
  const set = listeners.get(event) ?? new Set<Listener>()
  set.add(listener)
  listeners.set(event, set)
  return () => set.delete(listener)
}

export const emit = (event: string, payload?: unknown) => {
  const set = listeners.get(event)
  if (!set) return
  for (const listener of set) listener(payload)
}
```

---

## Large-scale app architecture

Vani scales best when you keep update paths explicit and module boundaries clear. The core idea is
to let feature modules own their local state and expose small, explicit APIs for coordination,
instead of reaching into each other's state or relying on global reactive graphs. At scale, treat
updates like messages: state lives in a module, views read from the module, and invalidation is
triggered by module commands.

### Suggested architecture

1. Feature modules (state + commands)

Each module exposes:

- a small state container
- read accessors (snapshot getters)
- explicit commands (mutations) that notify listeners
- a `subscribe(listener)` for views to bind invalidation

2. View adapters (bind handles)

Views subscribe once via `handle.effect()` and call `handle.update()` when their module notifies.
This keeps invalidation scoped to the subtree that owns the handle.

3. Coordinator (optional)

For cross-module workflows, add a thin coordinator that:

- orchestrates sequences (e.g. save → refresh → notify)
- calls public APIs of each module
- never accesses private state directly

4. Stable, explicit contracts

Use interfaces, simple message payloads, or callbacks to avoid implicit coupling. If one feature
needs another to update, it calls that module's exported command (or `invalidate()` helper) rather
than mutating shared data.

### Example: Feature module with explicit invalidation

```ts
import { component, div, type Handle, type Component } from '@vanijs/vani'

type User = { id: string; name: string }

export type UsersFeatureApi = {
  getUsers: () => User[]
  setUsers: (next: User[]) => void
  refreshUsers: () => Promise<void>
  subscribe: (listener: () => void) => () => void
}

export const createUsersFeature = (): { api: UsersFeatureApi; View: Component } => {
  let users: User[] = []
  const listeners = new Set<() => void>()

  const notify = () => {
    for (const listener of listeners) listener()
  }

  const api: UsersFeatureApi = {
    getUsers: () => users,
    setUsers: (next) => {
      users = next
      notify()
    },
    refreshUsers: async () => {
      const response = await fetch('/api/users')
      const data = (await response.json()) as User[]
      api.setUsers(data)
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }

  const View = component((_, handle: Handle) => {
    handle.effect(() => api.subscribe(() => handle.update()))
    return () => div(api.getUsers().map((user) => div(user.name)))
  })

  return { api, View }
}
```

### Example: Coordinator calling explicit APIs

```ts
import type { UsersFeatureApi } from './users-feature'

type Coordinator = {
  onUserSaved: () => Promise<void>
}

export const createCoordinator = (users: UsersFeatureApi): Coordinator => {
  return {
    onUserSaved: async () => {
      await users.refreshUsers()
    },
  }
}
```

### Example: Scoped invalidation by key

When a large list exists, invalidate only the affected rows.

```ts
import { component, div, type Handle } from '@vanijs/vani'

const rowHandles = new Map<string, Handle>()

export const bindUserRow = (id: string, handle: Handle) => {
  rowHandles.set(id, handle)
  return () => rowHandles.delete(id)
}

export const invalidateUserRow = (id: string) => {
  rowHandles.get(id)?.update()
}

export const UserRow = component<{ id: string; name: string }>((props, handle) => {
  handle.effect(() => bindUserRow(props.id, handle))
  return () => div(props.name)
})
```

### Explicit batching (optional)

If you dispatch many invalidations in a single tick, queue them and update once per handle.

```ts
import type { Handle } from '@vanijs/vani'

const pending = new Set<Handle>()
let scheduled = false

export const queueUpdate = (handle: Handle) => {
  pending.add(handle)
  if (scheduled) return
  scheduled = true
  queueMicrotask(() => {
    scheduled = false
    for (const item of pending) item.update()
    pending.clear()
  })
}
```

### Challenges with manual invalidation at scale

- Update fan-out: one action may need to notify several modules; keep this explicit via a
  coordinator instead of hidden subscriptions.
- Over-invalidating: calling `handle.update()` too broadly can re-render large subtrees; prefer
  small, keyed targets (row components, feature roots).
- Under-invalidating: missing an update call leaves views stale; treat "update after state change"
  as part of the module contract and centralize commands.
- Ordering and race conditions: when multiple modules depend on shared data, update data first, then
  invalidate in a predictable order; avoid interleaving async updates without coordination.
- Lifecycle leaks: if a handle isn't unsubscribed, updates keep firing; ensure `subscribe()` returns
  a cleanup and is wired through `handle.effect()`.
- Debugging update paths: without implicit reactivity, you must trace who called `update()`. Keep
  module APIs narrow, name update methods clearly (`refreshUsers`, `invalidateSearch`), and consider
  instrumentation (log or wrap invalidation helpers).

Vani trades automatic coordination for transparency. In large apps, that means you should invest in
clear module boundaries, explicit cross-module APIs, and small invalidation targets.

---

## API Reference (with examples)

### `component(fn)`

Creates a component factory. The `fn` receives `props` and a `handle`.

```ts
import { component, div, type Handle } from '@vanijs/vani'

const Card = component<{ title: string }>((props, handle: Handle) => {
  handle.effect(() => {
    console.log('Mounted:', props.title)
  })

  return () => div(props.title)
})
```

Components can return other component instances directly:

```ts
import { component } from '@vanijs/vani'
import * as h from 'vani/html'

const Hero = component(() => {
  return () => h.h1('Hello')
})

const Page = component(() => {
  return () => Hero()
})
```

### `renderToDOM(components, root)`

Mounts components to the DOM immediately.

```ts
import { renderToDOM, component, div } from '@vanijs/vani'

const App = component(() => () => div('App'))
renderToDOM([App()], document.getElementById('app')!)
```

### `hydrateToDOM(components, root)`

Binds handles to existing DOM (SSR/SSG) without rendering. You must call `handle.update()` to
activate.

```ts
import { hydrateToDOM } from '@vanijs/vani'
import { App } from './app'

const root = document.getElementById('app')!
const handles = hydrateToDOM([App()], root)
handles.forEach((handle) => handle.update())
```

### `renderToString(components)`

Server‑side render to HTML with anchors. Import from `vani/ssr`.

```ts
import { component } from '@vanijs/vani'
import { renderToString } from 'vani/ssr'

const App = component(() => () => 'Hello SSR')
const html = await renderToString([App()])
```

### `mount(component, props)`

Low‑level helper for embedding raw component functions in the middle of a render tree. Use it when
you have an unwrapped component function.

```ts
import { component, mount, div, type Component } from '@vanijs/vani'

const Footer: Component = () => () => div('Footer')

const Page = component(() => () => div('Body', mount(Footer, {})))
```

### `fragment(...children)`

Returns a fragment node. Useful for returning multiple siblings.

```ts
import { fragment, div, component } from '@vanijs/vani'

const App = component(() => () => fragment(div('One'), div('Two')))
```

### Element helpers

Vani ships helpers for common elements:

```ts
import { div, span, button, input } from '@vanijs/vani'

div(span('Label'), input({ type: 'text' }), button({ onclick: () => {} }, 'Submit'))
```

### SVG icons (Lucide)

Use the Vite SVG plugin at `src/ecosystem/vite-plugin-vani-svg.ts` and import SVGs with `?vani`.
This keeps the bundle small by only including the icons you actually import.

In your `vite.config.ts`:

```ts
import vitePluginVaniSvg from './src/ecosystem/vite-plugin-vani-svg'

export default defineConfig({
  plugins: [vitePluginVaniSvg()],
})
```

```ts
import GithubIcon from 'lucide-static/icons/github.svg?vani'
import { component } from '@vanijs/vani'

const GithubLink = component(() => {
  return () => GithubIcon({ size: 16, className: 'h-4 w-4', 'aria-hidden': true })
})
```

### SVGs as components

Any SVG can be turned into a Vani component with the same `?vani` suffix.

```ts
import LogoIcon from './logo.svg?vani'
import { component } from '@vanijs/vani'

const HeaderLogo = component(() => {
  return () => LogoIcon({ className: 'h-8 w-8', 'aria-hidden': true })
})
```

### `classNames(...classes)`

Utility for composing class names:

```ts
import { classNames, div } from '@vanijs/vani'

div({
  className: classNames('base', { active: true }, ['p-2', 'rounded-xl']),
})
```

### Refs

DOM refs and component refs are supported:

```ts
import { component, input, type DomRef, type ComponentRef } from '@vanijs/vani'

const Child = component((_, handle) => () => input({ ref: { current: null } }))

const Parent = component(() => {
  const childRef: ComponentRef = { current: null }
  return () => Child({ ref: childRef })
})
```

### Cleanup and effects

Effects are explicit and can return a cleanup function.

If you plan to use vani for a SSR/SSG application, you should use effects to run client-only code
such as accessing the window object, accessing the DOM, etc.

Effects are very simple and run once during component setup (the component function run). They do
not re-run on every `handle.update()`; updates only call the render function.

```ts
import { component, div } from '@vanijs/vani'

const Timer = component((_, handle) => {
  handle.effect(() => {
    const id = setInterval(() => console.log('tick'), 1000)
    return () => clearInterval(id)
  })
  return () => div('Timer running…')
})
```

### Transitions

`startTransition` marks a group of updates as non-urgent, so they are deferred and batched
separately.

This is useful to avoid blocking the UI while expensive work happens, e.g. if you are filtering a
large list.

```ts
import { component, button, div, startTransition, type Handle } from '@vanijs/vani'

const List = component((_, handle: Handle) => {
  let items = [1, 2, 3]
  return () =>
    div(
      button(
        {
          onclick: () => {
            startTransition(() => {
              items = items.slice().reverse()
              handle.update()
            })
          },
        },
        'Reverse',
      ),
    )
})
```

---

## Async Components

Components may return a Promise of a render function. You can provide a `fallback`:

```ts
import { component, div } from '@vanijs/vani'

const AsyncCard = component(async () => {
  await new Promise((resolve) => setTimeout(resolve, 500))
  return () => div('Loaded')
})

const App = component(
  () => () =>
    AsyncCard({
      fallback: () => div('Loading…'),
    }),
)
```

In DOM mode, the fallback is rendered until the component is ready. In SSR mode, async components
are awaited, so the fallback only renders for `clientOnly` components.

---

## clientOnly Islands

Use `clientOnly: true` to skip SSR of a component and render it only on the client:

```ts
import { component, div } from '@vanijs/vani'

const ClientWidget = component(() => () => div('Client‑only'))

const App = component(
  () => () =>
    ClientWidget({
      clientOnly: true,
    }),
)
```

---

## SSR, SSG, and SPA

Vani supports all three patterns:

### SPA

Use `renderToDOM()` to mount immediately on the client.

### SSR

Use `renderToString()` on the server, then `hydrateToDOM()` on the client.

### SSG

Use `renderToString()` at build time to generate a static `index.html`, then hydrate on the client.

**Important:** Hydration only binds to anchors for normal components. It does not render or start
effects until you call `handle.update()` to activate the UI. Components marked `clientOnly: true` do
render on the client during hydration.

---

## Selective Hydration

You can hydrate a full page but only **activate** the parts that need interactivity. Since
`hydrateToDOM()` returns handles, you choose which ones to `update()`.

Example: hydrate everything, activate only the header.

```ts
import { hydrateToDOM, type ComponentRef } from '@vanijs/vani'
import { Header } from './header'
import { Main } from './main'
import { Footer } from './footer'

const headerRef: ComponentRef = { current: null }
const root = document.getElementById('app')!

// Must match server render order.
hydrateToDOM([Header({ ref: headerRef }), Main(), Footer()], root)

// Activate only the header.
headerRef.current?.update()
```

Alternative: split the page into separate roots and hydrate only the interactive region.

```ts
const headerRoot = document.getElementById('header-root')!
const [headerHandle] = hydrateToDOM([Header()], headerRoot)
headerHandle.update()
```

Notes:

- Non‑updated components remain inert (no handlers/effects) until you call `update()`.
- The hydration list must match the server render order for that root.

---

## Hydration Warnings

In dev mode, Vani warns about structural mismatches only:

- Missing `<!--vani:start-->` or `<!--vani:end-->`
- Anchor order mismatch (end before start)
- Unused anchors after hydration

This avoids slow DOM diffing and keeps behavior explicit.

---

## Philosophy Summary

- Explicit updates only (`handle.update()`)
- Localized DOM updates (subtree‑only)
- No virtual DOM, no diffing, no magic
- Hydration is binding, not execution

---

## Other Resources

### Configuring Tailwind CSS Intellisense (VSCode)

In order to have proper Tailwind CSS Intellisense code completion and hover documentation with Vani,
you need to configure the following settings in your `.vscode/settings.json` file:

```json
{
  "tailwindCSS.experimental.classRegex": [
    ["(?:tw|clsx|cn)\\(([^;]*)[\\);]", "[`'\"`]([^'\"`;]*)[`'\"`]"],
    "(?:className)=\\s*(?:\"|'|{`)([^(?:\"|'|`})]*)",
    "(?:className):\\s*(?:\"|'|{`)([^(?:\"|'|`})]*)"
  ],
  "tailwindCSS.classAttributes": ["class", "classes", "className", "classNames"]
}
```

## License

MIT
