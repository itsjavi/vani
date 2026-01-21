# Vani project agent guide

Vani (from Vanilla) is a Web Standards-first framework for building web applications.

A JS-first, transpiler-free runtime for building lightning-fast apps — no virtual DOM, no compiler,
zero dependencies, SSR support, imperative reactivity. It also ships an optional JSX adapter.

Check the DOCS.md and README.md files for more information.

```tsx
// With React
function App() {
  return <div className="text-purple-500">Hello World!</div>
}
```

In Vani, components are factories or Higher-Order Functions that create DOM nodes.

```ts
// With Vani
import { div } from '@vanijs/vani'

function App() {
  return () => div({ className: 'text-purple-500' }, 'Hello World!')
}
```
