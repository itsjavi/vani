---
name: bench-workflow
description: Configure, author, and run benchmark implementations in bench/.
---

# Bench Workflow

## When to Use

- Adding a new framework implementation under `bench/frameworks/`
- Wiring a framework into the shared Vite setup
- Adding or updating manual UI tests in `bench/src/pages`
- Running or validating benchmark results

## Steps

1. **Add or update a framework implementation**
   - Create `bench/frameworks/<id>/index.html` that imports `../../src/styles.css` and uses the
     `.bench-shell` body class.
   - Add `index.ts` and `app.<suffix>` with the framework-specific entry.
   - Keep initial DOM aligned to the blueprint markup.

2. **Wire up configuration**
   - Register the framework in `bench/package.json` under `benchmarks.frameworks`.
   - Add the framework to `bench/plugins/vite-plugin-multi-framework.ts` and the `frameworks` list
     in `bench/vite.config.ts`.
   - Add a `bench/tsconfigs/tsconfig.<id>.json` and include it in `bench/tsconfig.json` references.

3. **Apply design system rules**
   - Prefer `bench/src/design-system.css` classes for UI.
   - Use at most 3 classes per element; add a new component class if you need more.

4. **Add or update manual UI tests**
   - Create a new directory under `bench/src/pages/manual-tests/<test>/`.
   - Add the test to the homepage list in `bench/src/pages/index.ts`.

5. **Run and verify**
   - `pnpm --filter benchmarks dev` for local UI checks.
   - `pnpm --filter benchmarks bench` to run the benchmark runner.

## Output

Provide:

- The files created or updated
- Any new framework IDs or view names
- Commands to run for verification

## Present Results to User

Give a concise bullet list of changes, then a short test plan.
