# CHANGELOG

This changelog documents important changes done to the `vani` runtime library, and the reason behind
the decisions made.

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
