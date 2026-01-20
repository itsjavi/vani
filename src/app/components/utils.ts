import * as h from '@/vani/html'
import { classNames, type ClassName, type VChild } from '@/vani/runtime'
import bash from '@shikijs/langs/bash'
import typescript from '@shikijs/langs/typescript'
import shikiThemeConfig from '@shikijs/themes/github-dark'
import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { twMerge } from 'tailwind-merge'

// ─────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────
export function cn(...inputs: ClassName[]) {
  return twMerge(classNames(inputs))
}

const shikiTheme = 'github-dark'
const shikiHighlighter = createHighlighterCoreSync({
  themes: [shikiThemeConfig],
  langs: [typescript, bash],
  engine: createJavaScriptRegexEngine(),
})

export type HighlightedTokens = ReturnType<typeof shikiHighlighter.codeToTokens>['tokens']

export function getHighlightedTokens(code: string, lang: 'ts' | 'shell'): HighlightedTokens {
  return shikiHighlighter.codeToTokens(code, { lang, theme: shikiTheme }).tokens
}

export function renderHighlightedTokens(tokens: HighlightedTokens, className?: ClassName): VChild {
  return h.pre(
    { className: cn('font-mono text-sm whitespace-pre-wrap text-slate-200', className) },
    h.code(
      { className: 'block' },
      ...tokens.map((line) =>
        h.span(
          { className: 'block' },
          ...(line.length === 0
            ? [h.span(' ')]
            : line.map((token) =>
                token.color
                  ? h.span({ style: `color: ${token.color}` }, token.content)
                  : h.span(token.content),
              )),
        ),
      ),
    ),
  )
}

export function renderTypeScriptCode(code: string, className?: ClassName) {
  return renderHighlightedTokens(getHighlightedTokens(code, 'ts'), className)
}

export function renderBashCode(code: string, className?: ClassName) {
  return renderHighlightedTokens(getHighlightedTokens(code, 'shell'), className)
}
