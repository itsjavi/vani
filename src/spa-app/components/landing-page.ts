import { component, type DomRef } from '@/vani'
import * as h from '@/vani/html'
import BarChart3Icon from 'lucide-static/icons/bar-chart-3.svg?vani'
import BookOpenIcon from 'lucide-static/icons/book-open.svg?vani'
import GithubIcon from 'lucide-static/icons/github.svg?vani'
import NotepadTextIcon from 'lucide-static/icons/notepad-text.svg?vani'
import { CopyableCodeBlock } from './copyable-code-block'
import { LandingPageExamples } from './landing-page-examples'
import { LiveSandboxDialog } from './live-sandbox'
import { PackageManagerTabs } from './package-manager-tabs'
import { cn, getHighlightedTokens } from './utils'

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Principles', href: '#principles' },
  { label: 'API', href: '#api' },
]

const featureCards = [
  {
    icon: '⚡️',
    title: 'Explicit Updates',
    description: 'Only re-render when you call handle.update(). Predictable without magic.',
  },
  {
    icon: '🔦',
    title: 'Signals (optional)',
    description: 'Opt-in fine-grained updates with signal(), text(), and attr().',
  },
  {
    icon: '🧱',
    title: 'Subtree Ownership',
    description: 'Each component owns a DOM range. Updates never touch parents or siblings.',
  },
  {
    icon: '🧪',
    title: 'Runtime‑First',
    description: 'JS-first and transpiler-free, with an optional JSX adapter.',
  },
  {
    icon: '🌊',
    title: 'SSR + Hydration',
    description: 'Anchor‑based hydration with deterministic behavior and no heuristics.',
  },
  {
    icon: '🏝️',
    title: 'Client‑Only Islands',
    description: 'Mark subtrees as clientOnly for interactive islands.',
  },
  {
    icon: '🧠',
    title: 'Async Components',
    description: 'Promise‑based components with fallbacks, still explicit.',
  },
  {
    icon: '🧩',
    title: 'Incremental Adoption',
    description: 'Mount Vani widgets inside existing apps without much effort.',
  },
  {
    icon: '📦',
    title: 'ESM‑First Portability',
    description: 'Ships small ESM modules for browsers, Node, Deno, or Bun.',
  },
]

const principles = [
  {
    title: 'No Hidden Work',
    description: 'No diffing and no implicit reactivity by default. Signals are opt-in.',
  },
  {
    title: 'Leaf‑Only Updates',
    description: 'Rendering cost scales with subtree size, not app size.',
  },
  {
    title: 'DOM Is Yours',
    description:
      'Access the rendered DOM subtree directly—no hidden layer between you and the DOM.',
  },
  {
    title: 'Simple Debugging',
    description: 'Stack traces and behavior are readable and obvious.',
  },
]

const Header = component(() => {
  return () =>
    h.header(
      {
        className: cn(
          'sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur',
          'text-white',
        ),
      },
      h.div(
        {
          className: cn(
            'mx-auto flex max-w-6xl flex-col items-center',
            'justify-between px-6 py-4 lg:grid lg:grid-cols-3',
            'gap-4',
          ),
        },
        h.a(
          { className: 'flex items-center gap-1', href: '#' },
          h.img({ src: '/logo-trimmed.png', alt: 'Vani Logo', className: 'h-8 w-12' }),
          h.span({ className: 'text-lg font-extrabold font-stretch-150% tracking-tight' }, 'vani'),
        ),
        h.nav(
          { className: ' items-center gap-6 text-sm text-slate-200 flex lg:place-self-center' },
          ...navItems.map((item) =>
            h.a(
              {
                href: item.href,
                className:
                  'transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
              },
              item.label,
            ),
          ),
        ),
        h.div(
          { className: 'hidden lg:flex items-center gap-3 lg:place-self-end' },
          h.a(
            {
              href: 'https://github.com/itsjavi/vani',
              className: cn(
                'inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white',
                'transition hover:border-white/40 hover:bg-white/10',
              ),
              target: '_blank',
              rel: 'noreferrer',
              ariaLabel: 'Github',
            },
            GithubIcon({ size: 16, className: 'size-[1.2rem]' }),
            // '',
          ),
          h.a(
            {
              href: 'https://github.com/itsjavi/vani/blob/main/DOCS.md',
              className: cn(
                'rounded-full border border-white/20 px-4 py-2 text-sm text-white',
                'transition hover:border-white/40 hover:bg-white/10',
              ),
              target: '_blank',
              rel: 'noreferrer',
            },
            'Docs',
          ),
          h.a(
            {
              href: '#api',
              className: cn(
                'rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950',
                'shadow-lg shadow-white/20 transition hover:bg-slate-100',
              ),
            },
            'Get Started',
          ),
        ),
      ),
    )
})

type HeroSectionProps = {
  onTryLive: () => void
}

const HeroSection = component((props: HeroSectionProps) => {
  return () =>
    h.section(
      {
        className: cn(
          'relative overflow-hidden bg-gradient-to-b from-slate-950 via-amber-950 to-slate-950',
          'text-white',
        ),
      },
      h.div({
        className: cn(
          'pointer-events-none absolute inset-0',
          'bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%)]',
        ),
      }),
      h.div(
        {
          className: cn(
            'mx-auto flex max-w-6xl flex-col gap-12 px-6 py-20 md:flex-row md:items-center',
          ),
        },
        h.div(
          { className: 'flex-1 space-y-6' },
          h.div(
            { className: 'flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em]' },
            h.span(
              { className: 'rounded-full bg-white/10 px-3 py-1 text-slate-200' },
              'Explicit by design',
            ),
            h.span({ className: 'rounded-full bg-white/10 px-3 py-1 text-slate-200' }, 'No VDOM'),
            h.span(
              { className: 'rounded-full bg-white/10 px-3 py-1 text-slate-200' },
              'No compiler',
            ),
            h.span(
              { className: 'rounded-full bg-white/10 px-3 py-1 text-slate-200' },
              'No dependencies',
            ),
            h.span(
              { className: 'rounded-full bg-white/10 px-3 py-1 text-slate-200' },
              '~5KB gzipped',
            ),
          ),
          h.h1(
            { className: 'text-4xl font-semibold tracking-tight md:text-6xl' },
            'Build fast UIs with zero magic.',
          ),
          h.p(
            { className: 'max-w-xl text-base text-slate-300 md:text-lg' },
            'Vani is a Web‑Standards‑first UI runtime with explicit updates, anchor‑owned subtrees,',
            ' and a clear and predictable rendering model across SPA and static sites.',
          ),
          h.div(
            { className: cn('flex flex-col gap-4') },
            h.div(
              { className: cn('flex flex-wrap items-center gap-4') },
              h.a(
                {
                  href: '#api',
                  className: cn(
                    'rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950',
                    'shadow-xl shadow-sky-500/20 transition hover:bg-slate-100',
                  ),
                },
                'Start building',
              ),
              h.button(
                {
                  type: 'button',
                  className: cn(
                    'rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white',
                    'transition hover:border-white/40 hover:bg-white/10',
                  ),
                  onclick: props.onTryLive,
                },
                h.span(
                  { className: 'relative flex items-center gap-2' },
                  h.span(
                    { className: 'relative flex h-2.5 w-2.5 items-center justify-center' },
                    h.span(
                      {
                        className:
                          'absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400/70',
                      },
                      '',
                    ),
                    h.span({ className: 'relative h-2.5 w-2.5 rounded-full bg-amber-400' }, ''),
                  ),
                  'Try it live',
                ),
              ),
              // DemoButton({
              //   // label: 'JSX demo',
              //   // children: 'It is JSX live',
              //   onclick: props.onTryLive,
              //   className: cn(
              //     'rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white',
              //     'transition hover:border-white/40 hover:bg-white/10',
              //   ),
              // }),
              h.a(
                {
                  href: 'https://github.com/itsjavi/vani',
                  target: '_blank',
                  rel: 'noreferrer',
                  className: cn(
                    'rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white',
                    'transition hover:border-white/40 hover:bg-white/10',
                  ),
                },
                'View on GitHub',
              ),
            ),
            h.div(
              { className: cn('flex flex-wrap items-center gap-6') },
              h.a(
                {
                  href: 'https://context7.com/itsjavi/vani',
                  target: '_blank',
                  rel: 'noreferrer',
                  className: cn(
                    'inline-flex items-center gap-2 text-base text-slate-300',
                    'underline decoration-dotted underline-offset-4',
                    'transition hover:text-white',
                  ),
                },
                BookOpenIcon({ size: 18, className: 'size-4' }),
                'Context7',
              ),
              h.a(
                {
                  href: 'https://context7.com/itsjavi/vani/llms.txt?tokens=15000',
                  target: '_blank',
                  rel: 'noreferrer',
                  className: cn(
                    'inline-flex items-center gap-2 text-base text-slate-300',
                    'underline decoration-dotted underline-offset-4',
                    'transition hover:text-white',
                  ),
                },
                NotepadTextIcon({ size: 18, className: 'size-4' }),
                'llms.txt',
              ),
              h.a(
                {
                  href: '/benchmarks',
                  className: cn(
                    'inline-flex items-center gap-2 text-base text-slate-300',
                    'underline decoration-dotted underline-offset-4',
                    'transition hover:text-white',
                  ),
                },
                BarChart3Icon({ size: 18, className: 'size-4' }),
                'Benchmarks',
              ),
            ),
          ),
        ),
        h.div(
          { className: 'flex-1' },
          h.div(
            {
              className: cn(
                'rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-sky-500/10',
                'backdrop-blur',
              ),
            },
            h.div(
              { className: 'flex items-center justify-between text-sm text-slate-300' },
              h.span({ className: 'font-bold text-lg' }, 'Simple by design'),
              // h.span(
              //   { className: 'bg-cyan-500/20 px-2 py-1 rounded-full text-xs' },
              //   'Zero dependencies',
              // ),
            ),
            h.div(
              { className: 'mt-6 space-y-4' },
              h.div(
                { className: 'rounded-2xl bg-white/5 p-4' },
                h.p({ className: 'text-sm text-slate-200' }, 'Web‑standard HTML props'),
                h.p(
                  { className: 'mt-2 text-xs text-slate-400' },
                  'Use real attributes, styles, and events—no special syntax.',
                ),
              ),
              h.div(
                { className: 'rounded-2xl bg-white/5 p-4' },
                h.p({ className: 'text-sm text-slate-200' }, 'JS-first, zero compiler'),
                h.p(
                  { className: 'mt-2 text-xs text-slate-400' },
                  'Just TypeScript functions and DOM APIs, plus an optional JSX adapter.',
                ),
              ),
              h.div(
                { className: 'rounded-2xl bg-white/5 p-4' },
                h.p({ className: 'text-sm text-slate-200' }, 'SPA, SSR, and SSG'),
                h.p(
                  { className: 'mt-2 text-xs text-slate-400' },
                  'Same runtime, multiple delivery modes with explicit control.',
                ),
              ),
            ),
          ),
        ),
      ),
    )
})

const FeaturesSection = component(() => {
  return () =>
    h.section(
      { id: 'features', className: 'bg-slate-950 py-20 text-white' },
      h.div(
        { className: 'mx-auto flex max-w-6xl flex-col gap-12 px-6' },
        h.div(
          { className: 'space-y-4' },
          h.p(
            { className: 'text-sm font-semibold uppercase tracking-[0.2em] text-sky-400' },
            'Features',
          ),
          h.h2(
            { className: 'text-3xl font-semibold md:text-4xl' },
            'Everything you need, nothing you don’t.',
          ),
          h.p(
            { className: 'max-w-2xl text-base text-slate-300' },
            'A minimal runtime with powerful primitives.',
          ),
        ),
        h.div(
          { className: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' },
          ...featureCards.map((feature) =>
            h.div(
              {
                className: cn(
                  'rounded-2xl border border-white/10 bg-white/5 p-6',
                  'transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10',
                ),
              },
              h.div({ className: 'text-3xl' }, feature.icon),
              h.h3({ className: 'mt-4 text-lg font-semibold' }, feature.title),
              h.p({ className: 'mt-2 text-sm text-slate-300' }, feature.description),
            ),
          ),
        ),
      ),
    )
})

const PrinciplesSection = component(() => {
  return () =>
    h.section(
      { id: 'principles', className: 'bg-slate-950 py-20 text-white' },
      h.div(
        { className: 'mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[1.1fr_1fr]' },
        h.div(
          { className: 'space-y-4' },
          h.p(
            { className: 'text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400' },
            'Principles',
          ),
          h.h2({ className: 'text-3xl font-semibold md:text-4xl' }, 'Explicit by design.'),
          h.p(
            { className: 'max-w-xl text-base text-slate-300' },
            'Vani keeps rendering local, deterministic, and easy to reason about.',
          ),
          h.div(
            { className: 'rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6' },
            h.h3({ className: 'text-lg font-semibold text-emerald-200' }, 'SPA, SSR, SSG'),
            h.p(
              { className: 'mt-2 text-sm text-emerald-100/80' },
              'Use renderToDOM for SPA, renderToString for SSR/SSG, hydrateToDOM for activation.',
            ),
          ),
        ),
        h.div(
          { className: cn('grid gap-4 sm:grid-cols-2') },
          ...principles.map((item) =>
            h.div(
              { className: 'rounded-2xl border border-white/10 bg-white/5 p-6' },
              h.h3({ className: 'text-lg font-semibold' }, item.title),
              h.p({ className: 'mt-2 text-sm text-slate-300' }, item.description),
            ),
          ),
        ),
      ),
    )
})

const apiCode = [
  'import { component, div, button, renderToDOM } from "@vanijs/vani";',
  '',
  'const Counter = component((props, handle)',
  '  let count = 0;',
  '  return () => div(',
  '    `Count: ${count}`,',
  '    button({ onclick: () => { count++; handle.update(); } }, "Inc")',
  '  );',
  '});',
  '',
  'renderToDOM(Counter(), document.getElementById("app"));',
].join('\n')
const apiTokens = getHighlightedTokens(apiCode, 'ts')
const skillsCode = 'npx add-skill itsjavi/vani'
const skillsTokens = getHighlightedTokens(skillsCode, 'shell')

const ApiSection = component(() => {
  return () =>
    h.section(
      { id: 'api', className: 'bg-slate-950 py-20 text-white' },
      h.div(
        { className: 'mx-auto flex max-w-6xl flex-col gap-8 px-6' },
        h.div(
          { className: 'space-y-3' },
          h.p(
            { className: 'text-sm font-semibold uppercase tracking-[0.2em] text-purple-400' },
            'API',
          ),
          h.h2(
            { className: 'text-3xl font-semibold md:text-4xl' },
            'Tiny API surface, huge control.',
          ),
        ),
        h.div(
          {
            className: cn(
              'rounded-3xl border border-white/10 bg-white/5 p-6',
              'text-sm text-slate-200',
            ),
          },
          h.h3({ className: 'text-base font-semibold text-white' }, 'Install'),
          h.p({ className: 'mt-2 text-sm text-slate-300' }, 'Choose your package manager:'),
          PackageManagerTabs(),
        ),
        h.div(
          {
            className: cn(
              'rounded-3xl border border-white/10 bg-white/5 p-6',
              'text-sm text-slate-200',
            ),
          },
          h.h3({ className: 'text-base font-semibold text-white' }, 'Install skills'),
          h.p(
            { className: 'mt-2 text-sm text-slate-300' },
            'Supercharge your AI Agents with Vani skills:',
          ),
          h.div(
            { className: 'mt-3' },
            CopyableCodeBlock({ code: skillsCode, tokens: skillsTokens }),
          ),
        ),
        h.div(
          {
            className: cn(
              'rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6',
              'text-sm text-slate-200',
            ),
          },
          CopyableCodeBlock({ code: apiCode, tokens: apiTokens }),
        ),
        LandingPageExamples(),
      ),
    )
})

const Footer = component(() => {
  return () =>
    h.footer(
      { className: 'border-t border-white/10 bg-slate-950 py-10 text-white' },
      h.div(
        {
          className:
            'mx-auto flex max-w-6xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between',
        },
        h.div(
          { className: 'space-y-2 text-sm text-slate-400' },
          h.div(
            { className: 'flex items-center gap-2 text-white' },
            h.span('Vani'),
            h.span('·'),
            h.span({ className: 'text-slate-300 ' }, 'MIT License'),
          ),
          h.p('A Web‑Standards‑First UI runtime for explicit rendering.'),
        ),
        h.div(
          { className: 'flex flex-wrap items-center gap-4 text-sm text-slate-300' },
          h.a(
            { href: 'https://github.com/itsjavi/vani', target: '_blank', rel: 'noreferrer' },
            'GitHub',
          ),
          h.a({ href: '#features' }, 'Features'),
          h.a({ href: '#principles' }, 'Principles'),
          h.a({ href: '#api' }, 'API'),
        ),
      ),
    )
})

export const LandingPage = component(() => {
  const dialogRef: DomRef<HTMLDialogElement> = { current: null }

  const openLiveSandbox = () => {
    dialogRef.current?.showModal()
  }

  return () =>
    h.div(
      { className: 'min-h-screen bg-slate-950 text-white' },
      Header(),
      h.main(
        {},
        HeroSection({ onTryLive: openLiveSandbox }),
        FeaturesSection(),
        PrinciplesSection(),
        ApiSection(),
      ),
      Footer(),
      LiveSandboxDialog({ dialogRef }),
    )
})
