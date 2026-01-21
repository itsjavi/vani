# Manual UI Debugging

This directory contains code for debugging the UI manually. It is not related to the benchmarks.

Every different test should have its own directory with the following structure:

```
debug/
  [name]-test/
    index.html
```

These are served by the `start` script of the `bench/package.json` file.

You can access them at `http://localhost:4555/debug/[name]-test/`, e.g.
`http://localhost:4555/debug/golden-leaf-test/`.
