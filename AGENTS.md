# Vani Framework Agent Guide

Vani (from Vanilla) is a Web Standards-first framework for building transpiler-free and predictable
web applications.

Check the [DOCS.md](./DOCS.md) and [README.md](./README.md) files for more information.

Here is a quick example:

```ts
// With Vani
import { div } from '@vanijs/vani'

function App() {
  return () => div({ className: 'text-purple-500' }, 'Hello World!')
}
```
