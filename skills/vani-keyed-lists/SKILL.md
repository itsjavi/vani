---
name: vani-keyed-lists
description: Build scalable lists with keyed rows and per-item updates
---

# Keyed Lists and Item Updates

Instructions for rendering lists where each row updates independently.

## When to Use

Use this when a list needs item-level updates without re-rendering the whole list.

## Steps

1. Represent items by id and store them in a `Map` or array with stable ids.
2. Create a row component that reads an item by id.
3. Use `key` on each row to preserve identity across reorders.
4. Store a `ComponentRef` per id so you can call `ref.current?.update()` for a single item.
5. Call the list handle only when list structure changes (add/remove/reorder).

## Arguments

- itemTypeName - name for the list item type (defaults to `Item`)
- listName - component name for the list (defaults to `List`)
- useMapStore - whether to store items in a `Map` (defaults to `true`)

## Examples

Example 1 usage pattern:

Implement a todo list with keyed rows and per-row updates on toggle.

Example 2 usage pattern:

Reorder items by id while preserving row identity with `key`.

## Output

Example output:

```
Created: src/list.ts
Notes: Row updates call ref.current?.update().
```

# Present Results to User

## Describe the list data structure, how refs are stored, and when the list handle updates.

name: vani-keyed-lists description: Build scalable Vani lists with keyed rows and per-item updates.
argument-hint: "[list feature]"

---

# Vani Keyed Lists Command

## When to use

Use this skill when building lists or collections that require efficient updates.

## Instructions

Follow these steps:

1. Model list items by id (Map or array with stable ids).
2. Create a `Row` component and pass `key`, `ref`, and item accessors.
3. Update a single item by mutating its data and calling `ref.current?.update()`.
4. Call the list handle only when structure changes (add/remove/reorder).

## Output expectations

- Use `ComponentRef` from `@vanijs/vani` for per-row updates.
- Avoid re-rendering the entire list for single-item changes.
- If $ARGUMENTS is provided, map it to the list domain and update flows.
