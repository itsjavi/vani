#! /bin/bash

echo "Type checking app..."
pnpm tsc --noEmit
pnpm tsc --noEmit -p tsconfigs/tsconfig.app.json
echo "Type checking preact..."
pnpm tsc --noEmit -p tsconfigs/tsconfig.preact.json
echo "Type checking react..."
pnpm tsc --noEmit -p tsconfigs/tsconfig.react.json
echo "Type checking remix..."
pnpm tsc --noEmit -p tsconfigs/tsconfig.remix.json
echo "Type checking solid..."
pnpm tsc --noEmit -p tsconfigs/tsconfig.solid.json
echo "Type checking svelte..."
pnpm tsc --noEmit -p tsconfigs/tsconfig.svelte.json
echo "Type checking vani..."
pnpm tsc --noEmit -p tsconfigs/tsconfig.vani.json
echo "Type checking vanilla..."
pnpm tsc --noEmit -p tsconfigs/tsconfig.vanilla.json
echo "Type checking vue..."
pnpm tsc --noEmit -p tsconfigs/tsconfig.vue.json

echo "typecheck DONE"