# Vani

**Vani** is a small, dependency-free UI runtime built around a simple idea:

> **Rendering should be explicit, local, and predictable.**

Vani is not a Virtual DOM, not reactive-by-default, and not compiler-driven.  
It is a **runtime-first**, **DOM-anchored**, **subtree-based** rendering system designed for
clarity, performance, and long-term maintainability.

Docs: [DOCS.md](https://github.com/itsjavi/vani/blob/main/DOCS.md)

---

## Philosophy

### 1. Explicit intent over implicit magic

In Vani, **nothing re-renders unless you explicitly ask for it**.

```ts
handle.update()
```

That single call is the only thing that triggers a re-render.

There are:

- no dependency graphs
- no signals auto-tracking
- no state subscriptions
- no implicit invalidation

This makes performance characteristics **obvious and predictable**.

---

### 2. Subtree ownership, not tree reconciliation

Each component owns **exactly one DOM range**, delimited by stable anchors:

```html
<!--vani:start-->
subtree
<!--vani:end-->
```

Updates replace **only that subtree**, never parents or siblings.

This guarantees:

- leaf-only updates
- O(size of subtree) cost
- no accidental cascades

---

### 3. Runtime-first, not compiler-first

Vani requires:

- JS-first by default (optional JSX adapter)
- no compiler
- no build-time transforms
- no generated code

Components are plain TypeScript functions.

This keeps:

- debugging straightforward
- stack traces readable
- behavior inspectable at runtime

---

### 4. Hydration is binding, not execution

During SSR hydration:

- **no setup runs**
- **no effects start**
- **no DOM is mutated**

Hydration only **binds runtime handles to existing DOM**. Actual execution happens on the first
explicit update.

This avoids:

- double subscriptions
- zombie timers
- mismatched server/client behavior

---

### 5. Scheduling, not reactivity, handles performance

Performance is handled by:

- batching
- microtask queues
- transition scheduling

Not by reactive graphs or heuristics.

```ts
startTransition(() => {
  handle.update()
})
```

This separates:

- **what** updates
- from **when** updates happen

---

## Core Design Principles

| Principle         | Meaning                                   |
| ----------------- | ----------------------------------------- |
| Explicit updates  | Only `handle.update()` triggers rendering |
| Locality          | Updates affect only the owning subtree    |
| Determinism       | Same inputs → same DOM mutations          |
| No hidden work    | No background tracking or diffing         |
| Runtime clarity   | Debuggable without tooling                |
| Opt-in complexity | Advanced features are explicit            |

---

## Goals

- Predictable performance at scale
- Leaf-only updates by default
- Zero runtime dependencies
- SSR without hydration heuristics
- Clear mental model for developers
- Long-term maintainability over convenience
- Web-standards-first
- ESM-first and designed to run in any modern environment
- Good and intuitive developer experience
- Reduce magic and complexity, give freedom back to the developers

---

## Ergonomic features

- Vani uses real HTML attribute names, with a small set of library-specific exceptions (`ref`,
  `key`, `fallback`, `clientOnly`)
- Async components are supported, including fallbacks
- `className` accepts string, array, and object forms for ergonomic composition
- ESM-first and designed to run in any modern environment

---

## JSX (optional)

Vani is JS-first and transpiler-free, but it also ships a JSX adapter that maps JSX syntax to the
same runtime behavior (CSR + SSR).

TypeScript config example:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@vanijs/vani"
  }
}
```

---

## SSR (experimental)

Vani SSR is explicit and anchor-based. You call `renderToString`, and the output includes the same
`<!--vani:start-->` / `<!--vani:end-->` anchors used by the client runtime.

```ts
import { renderToString } from './vani/ssr'
import { hydrateToDOM } from './vani/runtime'
import { getHydrationChildren } from './demos/hydration-app'

const html = await renderToString(getHydrationChildren())
// inject `html` into <div id="app"> on the server

// On the client
const root = document.getElementById('app')
const handles = hydrateToDOM(getHydrationChildren(), root!)
handles.forEach((handle) => handle.update())
```

Notes:

- SSR does not use a virtual DOM or heuristics.
- Hydration binds to anchors only; it does not render.
- If SSR output does not match the client component tree, Vani warns (dev only).

---

## What Vani is NOT

- ❌ Not a Virtual DOM
- ❌ Not reactive-by-default
- ❌ Not JSX-mandatory (optional adapter)
- ❌ Not compiler-driven
- ❌ Not a template language
- ❌ Not a framework that guesses intent

### Why not Web Components (yet)

Vani does not use Web Components today because the developer ergonomics are still rough and SSR
support is a key goal. We may revisit this if Web Components bring clear benefits without harming
productivity and cross-browser compatibility.

---

## Comparison with Popular Frameworks

| Feature / Framework    | Vani | React | Vue | Svelte | Solid |
| ---------------------- | ---- | ----- | --- | ------ | ----- |
| Virtual DOM            | ❌   | ✅    | ✅  | ❌     | ❌    |
| Implicit reactivity    | ❌   | ⚠️    | ✅  | ✅     | ✅    |
| Compiler required      | ❌   | ❌    | ❌  | ✅     | ❌    |
| JSX required           | ❌   | ✅    | ❌  | ❌     | ❌    |
| Explicit updates       | ✅   | ❌    | ❌  | ❌     | ❌    |
| Leaf-only updates      | ✅   | ❌    | ❌  | ❌     | ❌    |
| Runtime-only           | ✅   | ⚠️    | ⚠️  | ❌     | ⚠️    |
| SSR without heuristics | ✅   | ❌    | ❌  | ❌     | ❌    |
| Dependency-free core   | ✅   | ❌    | ❌  | ❌     | ❌    |

⚠️ = partially / indirectly supported / average

The strength of Vani is its predictability and simplicity, while other frameworks focus on developer
productivity and ease of use, handling a lot of complexity behind the scenes automatically.

### Vani's Sweet Spot

✅ Perfect for:

- Dashboard widgets
- Micro-frontends
- Live-coding in the browser
- Embeddable components in other frameworks
- Performance-critical UIs where you need exact control
- Server-rendered sites
- Learning UI fundamentals (no magic, direct DOM)
- Lightweight SPAs or small Multi-Page Applications

❌ Not ideal for:

- Large, complex web applications with many interrelated states
- Teams that want framework conventions to handle complexity
- Projects needing a mature ecosystem

(at least not yet)

---

## Mental Model

Think of Vani as:

> **“Manually invalidated, DOM-owned UI subtrees.”**

You decide:

- when something updates
- how much updates
- and why it updates

Nothing else happens behind your back.

---

## Who Vani is for

Vani is a good fit if you value:

- full control over rendering
- predictable performance
- small runtimes
- explicit data flow
- SSR without complexity
- understanding your tools deeply

It is **not** optimized for:

- rapid prototyping
- beginners
- implicit magic
- large teams that rely on conventions

---

## Status

Vani is experimental and evolving. The core architecture is intentionally small and stable.

Expect:

- iteration
- refinement
- careful additions

Not:

- rapid feature creep
- breaking conceptual changes

---

## License

MIT
