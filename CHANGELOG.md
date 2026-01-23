# CHANGELOG

This changelog documents important changes done to the `vani` runtime library, and the reason behind
the decisions made.

## 2026-01-23

- Renamed `handle.effect` to `handle.onBeforeMount` to clarify timing: it runs during setup before
  the first render. The name "effect" was confusing because it implied React-style behavior.
- Added `handle.onMount(fn)` that fires after the first render. The callback receives
  `(getNodes, parent)` where `getNodes` is lazy and only traverses the DOM if called, avoiding
  unnecessary work when the callback only needs the mount signal.
- Both lifecycle hooks support cleanup by returning a function, which is registered alongside
  `handle.onCleanup()` cleanups.
- Added `HydrationError` for structural hydration failures; `hydrateToDOM()` logs these while
  rethrowing non-hydration errors to keep failures obvious.
- `renderSvgString()` now throws on invalid SVG input instead of silently accepting parse errors.
- Async component rejections are now surfaced with a clear console error and rethrown so they are
  not silently dropped.

## 2026-01-22

- Added Solid-inspired signals (`signal`, `derive`, `effect`) plus `text()`/`attr()` helpers for
  opt-in fine-grained updates without changing the explicit update model.
- Added `update({ onlyAttributes: true })` to patch root attributes while preserving existing event
  listeners and children.
- Key diffing via `renderKeyedChildren()` now optimizes list ordering to move only when necessary
  and mount keyed rows in-place to avoid redundant DOM moves and per-row scheduling overhead during
  large list creation.
- Added `batch()` to coalesce update scheduling within a tick alongside urgent/transition queues.
- Updated benchmarks, docs, and examples to reflect the new APIs and guidance.
- Allowed `renderToDOM`, `hydrateToDOM`, and `renderToString` to accept a single component in
  addition to arrays for simpler entry points.
