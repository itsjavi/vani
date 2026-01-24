# Benchmarks

Performance benchmarks for Vani, based on `js-framework-benchmark` and `@remix-run/component`
benchmarking code.

Compared to `js-framework-benchmark`, it adds the following performance tests:

- Sorting rows ascending (`#sortasc`)
- Sorting rows descending (`#sortdesc`)

## Tech Stack

- **Bundler**: Vite (all frameworks use Vite with framework-specific plugins for consistent builds)
- **Styling**: Tailwind CSS 4 (with CSS-based configuration)
- **Test Runner**: Playwright

## Benchmarking Infrastructure

The benchmark runner uses a single Vite server and a pair of custom plugins to host everything in
one build/dev pipeline:

- **Multi-HTML routing** (`bench/plugins/vite-plugin-multi-html.ts`)
  - Maps multiple page roots into one Vite app using `pageDirs` in `bench/vite.config.ts`
  - Current routing:
    - `/` -> `bench/src/pages/**/index.html`
    - `/frameworks` -> `bench/frameworks/*/index.html`
  - Dev server rewrites incoming URLs to the correct `index.html` file
  - Build mode flattens HTML output so `src/pages/**/index.html` lands in `bench/dist/` without the
    `src/pages` prefix
  - Rollup entry points are generated from the directory scan so each page gets its own JS entry

- **Multi-framework transforms** (`bench/plugins/vite-plugin-multi-framework.ts`)
  - Scopes framework Vite plugins by file suffix (e.g. `.react.tsx`, `.solid.tsx`)
  - Ensures per-framework JSX transforms do not bleed into other implementations
  - Includes a guard to reset any global JSX config that plugins might apply

- **TypeScript project layout**
  - Root `bench/tsconfig.json` is a solution config with project references only
  - Shared compiler options live in `bench/tsconfigs/tsconfig.base.json`
  - Each framework has its own tsconfig extending the base with JSX settings and scoped includes
  - This preserves per-framework typing while keeping the build orchestration centralized

## Running the benchmarks

```bash
pnpm run bench
```

This will build all frameworks and then use `playwright` to run the benchmarks and show the results
in the terminal.

## Development

### Start the dev server

```bash
pnpm run dev
```

This builds all frameworks first, then starts the Vite dev server with HMR on port 4555.

### Build for production

```bash
pnpm run build
```

Builds all frameworks and the main benchmark pages to `dist/`.

### Build frameworks only

```bash
pnpm run build-frameworks
```

Builds all framework implementations to their respective `dist/` directories.

## Manual UI Tests

### View the benchmark implementations

You can view the benchmark implementations at `http://localhost:4555/`, for example:
`http://localhost:4555/frameworks/vani/`.

### Add a manual UI test

Manual tests live under `bench/src/pages/manual-tests/` and are served by the same Vite app (they
are not part of the benchmark runner).

Each test should have its own directory:

```
bench/src/pages/manual-tests/
  [test-name]/
    index.html
    index.ts[x]?
```

Also add it to the homepage list in `bench/src/pages/index.ts` so it appears under "Other Tests".

## Adding a new framework implementation

Frameworks are configured in one shared Vite app, so adding a new one means wiring together config,
TypeScript projects, and the framework directory.

1. **Create the framework directory** at `bench/frameworks/<id>/` with:
   - `index.html` (use `../../src/styles.css` and the `.bench-shell` body class)
   - `index.ts` that bootstraps the framework implementation
   - `app.<suffix>` (see file suffix rules below)

2. **Register the framework in `bench/package.json`:**
   - Add the framework runtime to `dependencies` (plus `@types/*` if needed).
   - Add the Vite plugin to `devDependencies` when the framework needs one.
   - Add a new entry to `benchmarks.frameworks` with:
     - `id` (slug used in URLs and runner output)
     - `name` (display name)
     - `path` (must be `frameworks/<id>`)
     - `package` (dependency name used for version lookup)
     - `version` (optional override)
     - `implementationNotes` (optional results notes)

3. **Wire up Vite plugins and file suffixes:**
   - Add the framework to `bench/plugins/vite-plugin-multi-framework.ts` and map its plugin.
   - Update the `frameworkIds` list and choose the file suffix (`.react.tsx`, `.solid.tsx`, etc).
   - Add the framework id to `frameworks` in `bench/vite.config.ts` so Vite loads the plugin.

4. **Add a TypeScript project:**
   - Create `bench/tsconfigs/tsconfig.<id>.json` extending `tsconfig.base.json`.
   - Include `../src/**/*.ts` and `../frameworks/<id>/**/*` in `include`.
   - Add the new project to the references in `bench/tsconfig.json`.

### Framework file suffixes

The multi-framework plugin scopes transforms by file suffix, so JSX-based frameworks need a
framework-specific extension for their app entry:

- React: `app.react.tsx`
- Preact: `app.preact.tsx`
- Remix: `app.remix.tsx`
- Solid: `app.solid.tsx`
- Svelte: `app.svelte`
- Vue: `app.vue`
- Vani/Vanilla: `app.ts`

### Guidelines and Rules

The following implementation rules are an adaptation from `js-framework-benchmark` and apply to
framework benchmark implementations in this repo:

- Reuse the `bench/frameworks/shared.js` helpers so implementations share baseline behavior and
  avoid accidental slow paths that skew results.
- Keep the the initial HTML rendered by the framework identical to the reference (in
  `bench/frameworks/blueprint.html`), including `aria-hidden` attributes. The runner will run a
  preflight check to ensure the initial HTML rendered by the framework is identical to the
  reference.
- Do not change button IDs (`run`, `runlots`, `add`, `update`, `clear`, `swaprows`, `sortasc`,
  `sortdesc`). Playwright will use these IDs to interact with the UI.
- Use the `bench/src/design-system.css` classes to style the UI. You may use up to 3 classes per
  element, including Tailwind classes and utilities.
- Do not use more than 3 CSS classes per element. If you need more than 3, then it means we need to
  rethink it or define a new component class in the `bench/src/design-system.css` file.
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
- Keep the preload icon (`.preloadicon.btn-close`) to avoid layout shifts.
