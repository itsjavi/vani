# Benchmarks

Performance benchmarks for Vani, based on `js-framework-benchmark` and `@remix-run/component`
benchmarking code.

Compared to `js-framework-benchmark`, it adds the following performance tests:

- Sorting rows ascending (`#sortasc`)
- Sorting rows descending (`#sortdesc`)

## View the benchmark UIs

You can view the UIs that are used for the benchmarks at `http://localhost:4555/`, for example:
`http://localhost:4555/frameworks/vani/`.

```bash
pnpm run dev  # serves all framework UIs and debugging tests
```

## Running the benchmarks

1. Build the frameworks:

```bash
pnpm run build-frameworks
```

2. Run the benchmarks:

```bash
pnpm run bench
```

This will use `playwright` to run the benchmarks and save the results to the `./results/` directory.

## Manual UI Debugging

The `./debug/` directory contains code for debugging the UI manually. It is not related to the
benchmarks.

Every different debugging test should have its own directory with the following structure:

```
debug/
  [name]-test/
    index.html
    index.ts[x]?
```

These are served by the `start` script of the `bench/package.json` file.

You can access them at `http://localhost:4555/debug/[name]-test/`, e.g.
`http://localhost:4555/debug/golden-leaf-test/`.
