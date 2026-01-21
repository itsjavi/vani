import { component } from '@/vani'
import * as h from '@/vani/html'
import { cn, renderHighlightedTokens, type HighlightedTokens } from './utils'

type CopyableCodeBlockProps = {
  code: string
  tokens: HighlightedTokens
  className?: string
}

const writeToClipboard = async (code: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(code)
    return true
  }

  if (typeof document === 'undefined') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = code
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const succeeded = document.execCommand('copy')
  document.body.removeChild(textarea)
  return succeeded
}

export const CopyableCodeBlock = component<CopyableCodeBlockProps>((props, handle) => {
  let showTick = false
  let tickTimeoutId: ReturnType<typeof setTimeout> | null = null

  handle.effect(() => {
    return () => {
      if (tickTimeoutId) {
        clearTimeout(tickTimeoutId)
      }
    }
  })

  const triggerTick = () => {
    showTick = true
    handle.update()

    if (tickTimeoutId) {
      clearTimeout(tickTimeoutId)
    }

    tickTimeoutId = setTimeout(() => {
      showTick = false
      handle.update()
    }, 1200)
  }

  const onCopy = async () => {
    const success = await writeToClipboard(props.code)
    if (success) {
      triggerTick()
    }
  }

  return () =>
    h.button(
      {
        type: 'button',
        className: cn(
          'group inline-flex max-w-full items-start gap-3',
          'cursor-pointer text-left',
          'rounded-2xl focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:outline-none',
        ),
        onclick: () => {
          void onCopy()
        },
        ariaLabel: 'Copy code to clipboard',
      },
      renderHighlightedTokens(props.tokens, cn('cursor-pointer', props.className)),
      h.span(
        {
          className: cn(
            'pointer-events-none mt-2 inline-flex h-6 w-6 items-center justify-center',
            'rounded-full bg-emerald-500/90 text-[12px] font-semibold text-white shadow-lg shadow-emerald-500/30',
            'transition',
            {
              'translate-y-0 opacity-100': showTick,
              'translate-y-1 opacity-0': !showTick,
            },
          ),
          ariaHidden: 'true',
        },
        '✓',
      ),
    )
})
