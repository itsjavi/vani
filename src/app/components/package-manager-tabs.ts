import { component } from '@/vani'
import * as h from '@/vani/html'
import { CopyableCodeBlock } from './copyable-code-block'
import { cn, getHighlightedTokens } from './utils'

type PackageManager = {
  id: string
  label: string
  command: string
}

const packageManagers: PackageManager[] = [
  { id: 'npm', label: 'npm', command: 'npm install @vanijs/vani' },
  { id: 'pnpm', label: 'pnpm', command: 'pnpm add @vanijs/vani' },
  { id: 'bun', label: 'bun', command: 'bun add @vanijs/vani' },
  { id: 'deno', label: 'deno', command: 'deno add @vanijs/vani' },
  { id: 'yarn', label: 'yarn', command: 'yarn add @vanijs/vani' },
]

type HighlightedTokens = ReturnType<typeof getHighlightedTokens>

const packageManagerTokens = packageManagers.reduce<Record<string, HighlightedTokens>>(
  (acc, manager) => {
    acc[manager.id] = getHighlightedTokens(manager.command, 'shell')
    return acc
  },
  {},
)

export const PackageManagerTabs = component((_, handle) => {
  let activeIndex = 0

  return () => {
    const activeManager = packageManagers[activeIndex]

    return h.div(
      { className: 'mt-4 space-y-3' },
      h.div(
        { className: 'flex flex-wrap gap-2' },
        ...packageManagers.map((manager, index) =>
          h.button(
            {
              type: 'button',
              className: cn(
                'rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.24em] uppercase',
                'transition',
                {
                  'border-white/40 bg-white/10 text-white': index === activeIndex,
                  'border-white/10 text-slate-300 hover:border-white/30 hover:text-white':
                    index !== activeIndex,
                },
              ),
              onclick: () => {
                if (index === activeIndex) {
                  return
                }

                activeIndex = index
                handle.update()
              },
            },
            manager.label,
          ),
        ),
      ),
      CopyableCodeBlock({
        code: activeManager.command,
        tokens: packageManagerTokens[activeManager.id],
        className: 'mt-4',
      }),
    )
  }
})
