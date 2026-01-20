# Vani Documentation

Vani is a small, dependency‑free UI runtime built around a simple idea:

> Rendering should be explicit, local, and predictable.

Vani is **not** a Virtual DOM, not reactive‑by‑default, and not compiler‑driven. Components own a
DOM subtree delimited by anchors and only update when you explicitly ask them to.

---

## Install

```bash
pnpm add vani
```

---

## Quick Start (SPA)

```ts
import { component, div, button, renderToDOM, type Handle } from 'vani'

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

## Core Concepts

### 1) Components are functions

Components are functions that return a render function:

```ts
import { component, div } from 'vani'

const Hello = component(() => {
  return () => div('Hello Vani')
})
```

### 2) Explicit updates

Nothing re‑renders unless you call `handle.update()`:

```ts
import { component, div, button, type Handle } from 'vani'

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

---

## API Reference (with examples)

### `component(fn)`

Creates a component factory. The `fn` receives `props` and a `handle`.

```ts
import { component, div, type Handle } from 'vani'

const Card = component<{ title: string }>((props, handle: Handle) => {
  handle.effect(() => {
    console.log('Mounted:', props.title)
  })

  return () => div(props.title)
})
```

Components can return other component instances directly:

```ts
import { component } from 'vani'
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
import { renderToDOM, component, div } from 'vani'

const App = component(() => () => div('App'))
renderToDOM([App()], document.getElementById('app')!)
```

### `hydrateToDOM(components, root)`

Binds handles to existing DOM (SSR/SSG) without rendering. You must call `handle.update()` to
activate.

```ts
import { hydrateToDOM } from 'vani'
import { App } from './app'

const root = document.getElementById('app')!
const handles = hydrateToDOM([App()], root)
handles.forEach((handle) => handle.update())
```

### `renderToString(components)`

Server‑side render to HTML with anchors. Import from `vani/ssr`.

```ts
import { component } from 'vani'
import { renderToString } from 'vani/ssr'

const App = component(() => () => 'Hello SSR')
const html = await renderToString([App()])
```

### `mount(component, props)`

Low‑level helper for embedding raw component functions in the middle of a render tree. Use it when
you have an unwrapped component function.

```ts
import { component, mount, div, type Component } from 'vani'

const Footer: Component = () => () => div('Footer')

const Page = component(() => () => div('Body', mount(Footer, {})))
```

### `fragment(...children)`

Returns a fragment node. Useful for returning multiple siblings.

```ts
import { fragment, div, component } from 'vani'

const App = component(() => () => fragment(div('One'), div('Two')))
```

### Element helpers

Vani ships helpers for common elements:

```ts
import { div, span, button, input } from 'vani'

div(span('Label'), input({ type: 'text' }), button({ onclick: () => {} }, 'Submit'))
```

### `classNames(...classes)`

Utility for composing class names:

```ts
import { classNames, div } from 'vani'

div({
  className: classNames('base', { active: true }, ['p-2', 'rounded']),
})
```

### Refs

DOM refs and component refs are supported:

```ts
import { component, input, type DomRef, type ComponentRef } from 'vani'

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

Effects are very simple, they don't have dependencies and are run once on mount and once on update.

```ts
import { component, div } from 'vani'

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
import { component, button, div, startTransition, type Handle } from 'vani'

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
import { component, div } from 'vani'

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

They are awaited and the fallback is rendered until the component is ready.

---

## clientOnly Islands

Use `clientOnly: true` to skip SSR of a component and render it only on the client:

```ts
import { component, div } from 'vani'

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

**Important:** Hydration only binds to anchors. It does not render or start effects. Call
`handle.update()` to activate the UI.

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

## License

MIT
