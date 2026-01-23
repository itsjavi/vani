import './styles.css'

import { button, div, h1, img, span } from '@/vani/html'

import { component, fragment, mount, type Component, type Handle } from '@/vani/runtime'
import { cn } from './utils'

// ─────────────────────────────────────────────
// Static components (should NEVER re-render)
// ─────────────────────────────────────────────

// This component needs no mount() wrapper in order to be used as a child.
const StaticHeader = component(() => {
  console.log('[render] StaticHeader')

  return () => div({ className: 'bg-neutral-800 text-white p-4' }, 'Static header (never updates)')
})

// This one does need a mount() wrapper in order to be used as a child.
const StaticFooter: Component = () => {
  console.log('[render] StaticFooter')

  return () =>
    div({ className: 'bg-neutral-800 text-white p-4 mt-4' }, 'Static footer (never updates)')
}

const Counter = component<{ label: string }>((props, handle: Handle) => {
  let count = 0

  return () => {
    console.log(`[render] Counter ${props.label}`)

    return div(
      {
        className: cn('m-4 border border-neutral-300 p-4'),
      },

      span({ className: 'mr-4' }, `${props.label}: ${count}`),

      button(
        {
          className: 'btn',
          onclick: () => {
            count++
            handle.update() // 🔥 only THIS subtree
          },
        },
        'Increment',
      ),
    )
  }
})

const CountersTest = component(() => {
  console.log('[render] App')

  return () =>
    div(
      StaticHeader(),
      Counter({ label: 'A' }),
      Counter({ label: 'B' }),

      mount(StaticFooter, {}),
    )
})

const TimerTest = component((_, handle) => {
  handle.onBeforeMount(() => {
    const id = setInterval(() => {
      console.log('tick')
    }, 1000)

    return () => {
      clearInterval(id)
      console.log('timer cleaned')
    }
  })

  return () =>
    div(
      'Timer running…',
      button({ className: 'btn', onclick: () => handle.dispose() }, 'Remove timer'),
    )
})

const sleepMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const HydrationTest = component(async (_, handle) => {
  let count = 0

  if (typeof window !== 'undefined') {
    await sleepMs(4_000)
  }

  return () =>
    div(
      `Count: ${count}`,
      button(
        {
          className: 'btn',
          onclick: () => {
            count++
            handle.update()
          },
        },
        'Inc',
      ),
    )
})

const HeroSection = component(() => {
  return () =>
    div(
      {
        className: cn(
          'flex flex-row gap-4 bg-black p-4 text-white',
          'border-border items-center justify-center border-b',
        ),
      },
      img({ src: '/logo-trimmed.png', alt: 'Hero Section', className: 'w-10 h-10' }),
      h1({ className: 'text-2xl font-bold' }, 'Vani - A Web-Standards-First UI Runtime'),
    )
})

export const TestPage = component(() => {
  return () =>
    fragment(
      HeroSection(),
      HydrationTest({ fallback: () => div('Loading...') }),
      TimerTest(),
      CountersTest(),
    )
})
