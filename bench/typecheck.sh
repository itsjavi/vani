#! /bin/bash

pnpm tsc --noEmit
pnpm tsc --noEmit -p tsconfigs/tsconfig.app.json
pnpm tsc --noEmit -p tsconfigs/tsconfig.preact.json
pnpm tsc --noEmit -p tsconfigs/tsconfig.react.json
pnpm tsc --noEmit -p tsconfigs/tsconfig.remix.json
pnpm tsc --noEmit -p tsconfigs/tsconfig.solid.json
pnpm tsc --noEmit -p tsconfigs/tsconfig.svelte.json
pnpm tsc --noEmit -p tsconfigs/tsconfig.vani.json
pnpm tsc --noEmit -p tsconfigs/tsconfig.vanilla.json
pnpm tsc --noEmit -p tsconfigs/tsconfig.vue.json