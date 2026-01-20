# Vani project agent guide

Vani (from Vanilla) is a Web Standards-first framework for building web applications.

A fine-grained reactive open source framework for building lightning-fast apps — no virtual DOM, no
compiler, no JSX, no transpilation, zero dependencies, SSR support, imperative reactivity.

Check the DOCS.md and README.md files for more information.

```tsx
// With React
function App() {
  return <div className="text-red-500">Hello World!</div>
}
```

In Vani, components are factories or Higher-Order Functions that create DOM nodes.

```ts
// With Vani (global scope)
import { div } from '@vanijs/vani'

function App() {
  return () => div({ class: 'text-red-500' }, 'Hello World!')
}
```
