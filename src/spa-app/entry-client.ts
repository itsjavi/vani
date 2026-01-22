import { hydrateToDOM } from '@/vani/runtime'
import SpaApp from './app'

// ─────────────────────────────────────────────
// Client-side hydration
// ─────────────────────────────────────────────
const appRoot = document.getElementById('root')
if (!appRoot) throw new Error('[vani] #root not found')

const hydrationData = {} // (globalThis as any).__vaniHydrationData || {}
const handlers = hydrateToDOM(SpaApp(hydrationData), appRoot)

// 🔥 update the handles to trigger the initial render
for (const handler of handlers) {
  handler.update()
}
