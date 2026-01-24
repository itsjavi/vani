# Manual UI Tests

This directory hosts manual UI tests that run in the shared benchmark Vite app. They are not part of
the automated benchmark runner.

Each test should have its own directory:

```
bench/src/pages/manual-tests/
  [test-name]/
    index.html
    index.ts[x]?
```

Also add the test to `bench/src/pages/index.ts` so it appears under "Other Tests" on the homepage.
