# Benchmarks

Performance benchmarks for Vani, based on `js-framework-benchmark` and `@remix-run/component`
benchmarking code.

Compared to `js-framework-benchmark`, it adds the following performance tests:

- Sorting rows ascending (`#sortasc`)
- Sorting rows descending (`#sortdesc`)

## Running the benchmarks

```bash
pnpm run bench
```

This will run the `build-frameworks` package script for all frameworks and then use `playwright` to
run the benchmarks and show the results in the terminal.

## Manual UI Debugging

### View the benchmark implementations

You can view the benchmark implementations at `http://localhost:4555/`, for example:
`http://localhost:4555/frameworks/vani/`.

### View the custom debug apps

The `./debug/` directory contains some UIs for manual debugging. They are not related to the
benchmarks, and won't be used by the benchmark runner.

Every different debug app should have its own directory with the following structure:

```
debug/
  [name]-test/
    index.html
    index.ts[x]?
```

## Writing benchmark implementations

All you need to add a new framework is:

- Create a new directory in `bench/frameworks/` with the framework name.
- Add a `package.json` file with every dependency you need
- The package name should be `benchmark-<framework-npm-package-name>`
- The version will be inferred from the framework lib dependency version, and fallback to `version`,
  or `0.0.0` if none is found.
- Add an `index.html` file (you can use vani's as a reference)

### Guidelines and Rules

The following implementation rules are an adaptation from `js-framework-benchmark` and apply to
framework benchmark implementations in this repo:

- Reuse the `bench/frameworks/shared.js` helpers so implementations share baseline behavior and
  avoid accidental slow paths that skew results.
- Keep the HTML output identical to the vanillajs reference (in
  `bench/frameworks/vanillajs/index.html`), including `aria-hidden` attributes.
- Do not change button IDs (`run`, `runlots`, `add`, `update`, `clear`, `swaprows`, `sortasc`,
  `sortdesc`). Playwright will use these IDs to interact with the UI.
- Use the shared `styles.css` from the `bench` directory (do not use other Bootstrap copies).
- Avoid Shadow DOM; it breaks global CSS and automated tests.
- Use keyed list rendering when the framework supports it: each row uses a stable id as its key so
  DOM nodes stay aligned to data items during updates, reorders, and swaps. For example in React we
  use the "key" prop to achieve this.
- Prefer idiomatic framework code; avoid artificial micro-optimizations that skew results.
- Do not use requestAnimationFrame to alter benchmark operations.
- Do not add custom repaint timing code; the benchmark runner already measures timings.
- Track selection as a single id/reference, not per-row flags.
- Manual DOM manipulation or explicit event delegation may be flagged in reviews, with the exception
  of the vanillajs implementation.
- Keep the preload icon (`.preloadicon ... glyphicon-remove`) to avoid layout shifts.
