import * as h from '@/vani/html'
import { component, signal, startTransition, text, type DomRef, type Handle } from '@/vani/local'
import SparklesIcon from 'lucide-static/icons/sparkles.svg?vani'
import { CopyableCodeBlock } from './copyable-code-block'
import { jsxExamples } from './jsx-examples'
import { cn, getHighlightedTokens } from './utils'

type Example = {
  title: string
  description: string
  code: string
  tokens: ReturnType<typeof getHighlightedTokens>
  demo: () => any
}

const CounterExample = component((_, handle: Handle) => {
  let count = 0

  return () =>
    h.div(
      { className: 'space-y-3' },
      h.p({ className: 'text-sm text-slate-300' }, `Count: ${count}`),
      h.button(
        {
          type: 'button',
          className:
            'rounded-full bg-emerald-400/90 px-4 py-2 text-xs font-semibold text-slate-900',
          onclick: () => {
            count += 1
            handle.update()
          },
        },
        'Increment',
      ),
    )
})

const SignalExample = component(() => {
  const [count, setCount] = signal(0)

  return () =>
    h.div(
      { className: 'space-y-3' },
      h.p(
        { className: 'text-sm text-slate-300' },
        text(() => `Count: ${count()}`),
      ),
      h.button(
        {
          type: 'button',
          className: 'rounded-full bg-indigo-400/90 px-4 py-2 text-xs font-semibold text-slate-900',
          onclick: () => setCount((value) => value + 1),
        },
        'Increment',
      ),
    )
})

const ToggleExample = component((_, handle: Handle) => {
  let open = false

  return () =>
    h.div(
      { className: 'space-y-3' },
      h.button(
        {
          type: 'button',
          className:
            'rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white',
          onclick: () => {
            open = !open
            handle.update()
          },
        },
        open ? 'Hide details' : 'Show details',
      ),
      open
        ? h.div(
            {
              className: 'rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200',
            },
            'This panel is rendered conditionally.',
          )
        : null,
    )
})

const FormExample = component((_, handle: Handle) => {
  let name = ''
  let submitted = false

  return () =>
    h.form(
      {
        className: 'space-y-3',
        onsubmit: (event: SubmitEvent) => {
          event.preventDefault()
          submitted = true
          handle.update()
        },
      },
      h.label({ className: 'text-xs text-slate-300' }, 'Name'),
      h.input({
        type: 'text',
        value: name,
        className:
          'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white',
        oninput: (event: Event) => {
          name = (event.currentTarget as HTMLInputElement).value
        },
      }),
      h.button(
        {
          type: 'submit',
          className: 'rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900',
        },
        'Submit',
      ),
      submitted
        ? h.p({ className: 'text-xs text-emerald-300' }, `Submitted: ${name || 'Anonymous'}`)
        : null,
    )
})

type ListItem = { id: string; label: string; done: boolean }

const ListRow = component<{
  item: ListItem
  onToggle: (id: string) => void
  onRemove: (id: string) => void
}>((props) => {
  return () =>
    h.li(
      {
        className:
          'flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs',
      },
      h.button(
        {
          type: 'button',
          className: cn('text-left', { 'text-slate-400 line-through': props.item.done }),
          onclick: () => props.onToggle(props.item.id),
        },
        props.item.label,
      ),
      h.button(
        {
          type: 'button',
          className: 'text-slate-400 hover:text-white',
          onclick: () => props.onRemove(props.item.id),
        },
        'Remove',
      ),
    )
})

const ListExample = component((_, handle: Handle) => {
  let items: ListItem[] = [
    { id: 'a', label: 'Ship Vani', done: false },
    { id: 'b', label: 'Write docs', done: true },
  ]

  const toggle = (id: string) => {
    items = items.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    handle.update()
  }

  const remove = (id: string) => {
    items = items.filter((item) => item.id !== id)
    handle.update()
  }

  const add = () => {
    const id = String(Date.now())
    items = [...items, { id, label: 'New item', done: false }]
    handle.update()
  }

  return () =>
    h.div(
      { className: 'space-y-3' },
      h.ul(
        { className: 'space-y-2' },
        ...items.map((item) => ListRow({ key: item.id, item, onToggle: toggle, onRemove: remove })),
      ),
      h.button(
        {
          type: 'button',
          className:
            'rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white',
          onclick: add,
        },
        'Add item',
      ),
    )
})

type GlobalState = { count: number }

let globalState: GlobalState = { count: 0 }
const globalListeners = new Set<() => void>()

const getGlobalState = () => globalState
const setGlobalState = (next: GlobalState) => {
  globalState = next
  for (const listener of globalListeners) listener()
}
const subscribeGlobal = (listener: () => void) => {
  globalListeners.add(listener)
  return () => {
    globalListeners.delete(listener)
  }
}

const GlobalStateExample = component((_, handle: Handle) => {
  handle.onBeforeMount(() => subscribeGlobal(() => handle.update()))

  return () => {
    const { count } = getGlobalState()
    return h.div(
      { className: 'space-y-3' },
      h.p({ className: 'text-sm text-slate-300' }, `Global count: ${count}`),
      h.div(
        { className: 'flex gap-2' },
        h.button(
          {
            type: 'button',
            className:
              'rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white',
            onclick: () => setGlobalState({ count: count - 1 }),
          },
          'Decrease',
        ),
        h.button(
          {
            type: 'button',
            className:
              'rounded-full bg-emerald-400/90 px-3 py-2 text-xs font-semibold text-slate-900',
            onclick: () => setGlobalState({ count: count + 1 }),
          },
          'Increase',
        ),
      ),
    )
  }
})

const TransitionExample = component((_, handle: Handle) => {
  let query = ''
  let visible = ['apples', 'oranges', 'pears', 'grapes']

  const applyFilter = (value: string) => {
    startTransition(() => {
      const next = value.trim().toLowerCase()
      visible = ['apples', 'oranges', 'pears', 'grapes'].filter((item) => item.includes(next))
      handle.update()
    })
  }

  return () =>
    h.div(
      { className: 'space-y-3' },
      h.input({
        type: 'text',
        value: query,
        className:
          'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white',
        placeholder: 'Filter fruit...',
        oninput: (event) => {
          query = (event.currentTarget as HTMLInputElement).value
        },
      }),
      h.button(
        {
          type: 'button',
          className:
            'rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white',
          onclick: () => applyFilter(query),
        },
        'Apply filter',
      ),
      h.ul({ className: 'space-y-1 text-xs text-slate-300' }, ...visible.map((item) => h.li(item))),
    )
})

const AsyncExample = component(async () => {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return () =>
    h.div(
      {
        className: 'rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200',
      },
      'Async content loaded.',
    )
})

const ClientOnlyClock = component((_, handle: Handle) => {
  let now = new Date()

  handle.onBeforeMount(() => {
    const id = setInterval(() => {
      now = new Date()
      handle.update()
    }, 1000)
    return () => clearInterval(id)
  })

  return () =>
    h.div(
      {
        className: 'rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200',
      },
      `Client clock: ${now.toLocaleTimeString()}`,
    )
})

const RefExample = component((_, handle: Handle) => {
  const inputRef: DomRef<HTMLInputElement> = { current: null }
  let message = ''

  return () =>
    h.div(
      { className: 'space-y-3' },
      h.input({
        type: 'text',
        ref: inputRef,
        value: message,
        className:
          'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white',
        placeholder: 'Focus me',
        oninput: (event) => {
          message = (event.currentTarget as HTMLInputElement).value
        },
      }),
      h.div(
        { className: 'flex flex-wrap gap-2' },
        h.button(
          {
            type: 'button',
            className:
              'rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white',
            onclick: () => {
              inputRef.current?.focus()
            },
          },
          'Focus input',
        ),
        h.button(
          {
            type: 'button',
            className:
              'rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white',
            onclick: () => {
              message = inputRef.current?.value ?? message
              handle.update()
            },
          },
          'Read value',
        ),
      ),
      h.p({ className: 'text-xs text-slate-300' }, `Value: ${message || '...'}`),
    )
})

const ControlledInputExample = component((_, handle: Handle) => {
  const inputRef: DomRef<HTMLInputElement> = { current: null }
  let value = ''

  const updateWithFocus = () => {
    const prev = inputRef.current
    const start = prev?.selectionStart ?? null
    const end = prev?.selectionEnd ?? null

    handle.updateSync()

    const next = inputRef.current
    if (next) {
      next.focus()
      if (start != null && end != null) {
        next.setSelectionRange(start, end)
      }
    }
  }

  return () =>
    h.div(
      { className: 'space-y-3' },
      h.input({
        ref: inputRef,
        type: 'text',
        value,
        className:
          'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white',
        placeholder: 'Type to update live',
        oninput: (event) => {
          value = (event.currentTarget as HTMLInputElement).value
          updateWithFocus()
        },
      }),
      h.p({ className: 'text-xs text-slate-300' }, `Live: ${value || '...'}`),
    )
})

const SvgExample = component(() => {
  return () =>
    h.div(
      { className: 'flex items-center gap-3 text-sm text-slate-200' },
      SparklesIcon({ size: 18, className: 'text-amber-300', 'aria-hidden': true }),
      h.span('Import any SVG with ?vani and use it as a component.'),
    )
})

const counterCode = [
  'const Counter = component((_, handle) => {',
  '  let count = 0;',
  '  return () =>',
  '    div(',
  '      `Count: ${count}`,',
  '      button({',
  '        onclick: () => {',
  '          count++;',
  '          handle.update();',
  '        },',
  '      }, "Increment")',
  '    );',
  '});',
].join('\n')

const toggleCode = [
  'const TogglePanel = component((_, handle) => {',
  '  let open = false;',
  '  return () =>',
  '    div(',
  '      button({',
  '        onclick: () => {',
  '          open = !open;',
  '          handle.update();',
  '        },',
  '      }, "Toggle"),',
  '      open ? div("Now you see me") : null,',
  '    );',
  '});',
].join('\n')

const formCode = [
  'const ContactForm = component((_, handle) => {',
  '  let name = "";',
  '  let submitted = false;',
  '  return () =>',
  '    form(',
  '      {',
  '        onsubmit: (e) => {',
  '          e.preventDefault();',
  '          submitted = true;',
  '          handle.update();',
  '        },',
  '      },',
  '      input({',
  '        oninput: (e) => {',
  '          name = e.currentTarget.value;',
  '        },',
  '      }),',
  '      button({ type: "submit" }, "Submit"),',
  '      submitted ? div(`Submitted: ${name}`) : null',
  '    );',
  '});',
].join('\n')

const listCode = [
  'type ListItem = {',
  '  id: string;',
  '  label: string;',
  '  done: boolean;',
  '};',
  '',
  'type ListRowProps = {',
  '  item: ListItem;',
  '  onToggle: (id: string) => void;',
  '  onRemove: (id: string) => void;',
  '};',
  '',
  'const ListRow = component<ListRowProps>((props) =>',
  '  () =>',
  '    li(',
  '      button({',
  '        onclick: () => props.onToggle(',
  '          props.item.id',
  '        ),',
  '      }, props.item.label),',
  '      button({',
  '        onclick: () => props.onRemove(',
  '          props.item.id',
  '        ),',
  '      }, "Remove")',
  '    )',
  ');',
  '',
  'const List = component((_, handle) => {',
  '  let items: ListItem[] = [',
  '    { id: "a", label: "Ship Vani", done: false }',
  '  ];',
  '  const toggle = (id: string) => {',
  '    items = items.map((item) =>',
  '      item.id === id',
  '        ? { ...item, done: !item.done }',
  '        : item',
  '    );',
  '    handle.update();',
  '  };',
  '  return () =>',
  '    ul(',
  '      ...items.map((item) =>',
  '        ListRow({',
  '          key: item.id,',
  '          item,',
  '          onToggle: toggle,',
  '          onRemove: (id) => {',
  '            items = items.filter(',
  '              (item) => item.id !== id',
  '            );',
  '            handle.update();',
  '          },',
  '        })',
  '      )',
  '    );',
  '});',
].join('\n')

const globalStateCode = [
  'type GlobalState = { count: number };',
  'let state: GlobalState = { count: 0 };',
  'const listeners = new Set<() => void>();',
  '',
  'const getState = () => state;',
  'const setState = (next: GlobalState) => {',
  '  state = next;',
  '  for (const l of listeners) l();',
  '};',
  'const subscribe = (l: () => void) => {',
  '  listeners.add(l);',
  '  return () => listeners.delete(l);',
  '};',
  '',
  'const Counter = component((_, handle) => {',
  '  handle.onBeforeMount(() => subscribe(',
  '    () => handle.update()',
  '  ));',
  '  return () => {',
  '    const { count } = getState();',
  '    return button({',
  '      onclick: () => setState({',
  '        count: count + 1',
  '      })',
  '    }, `Global: ${count}`);',
  '  };',
  '});',
].join('\n')

const transitionCode = [
  'const FilterList = component((_, handle) => {',
  '  let query = "";',
  '  let visible = ["apples", "oranges"];',
  '  const applyFilter = (value) => {',
  '    startTransition(() => {',
  '      const next = value.trim().toLowerCase();',
  '      visible = items.filter((item) =>',
  '        item.includes(next)',
  '      );',
  '      handle.update();',
  '    });',
  '  };',
  '  return () => div(',
  '    input({',
  '      oninput: (e) => {',
  '        query = e.currentTarget.value;',
  '      },',
  '    }),',
  '    button({',
  '      onclick: () => applyFilter(query),',
  '    }, "Apply filter")',
  '  );',
  '});',
].join('\n')

const asyncCode = [
  'const AsyncCard = component(async () => {',
  '  await new Promise((r) => setTimeout(r, 400));',
  '  return () => div("Async content loaded.");',
  '});',
  '',
  'AsyncCard({',
  '  fallback: () => div("Loading..."),',
  '});',
].join('\n')

const clientOnlyCode = [
  'const Clock = component((_, handle) => {',
  '  let now = new Date();',
  '  handle.onBeforeMount(() => {',
  '    const id = setInterval(() => {',
  '      now = new Date();',
  '      handle.update();',
  '    }, 1000);',
  '    return () => clearInterval(id);',
  '  });',
  '  return () => div(',
  '    `Client clock: ${now.toLocaleTimeString()}`',
  '  );',
  '});',
  '',
  'Clock({',
  '  clientOnly: true,',
  '  fallback: () => div("Loading..."),',
  '});',
].join('\n')

const refCode = [
  'const FocusInput = component((_, handle) => {',
  '  const ref: DomRef<HTMLInputElement> = {',
  '    current: null,',
  '  };',
  '  let message = "";',
  '  return () => div(',
  '    input({',
  '      ref,',
  '      oninput: (e) => {',
  '        message = e.currentTarget.value;',
  '      },',
  '    }),',
  '    button({ onclick: () => ref.current?.focus() },',
  '      "Focus input"',
  '    ),',
  '    button({',
  '      onclick: () => {',
  '        message = ref.current?.value ?? "";',
  '        handle.update();',
  '      },',
  '    }, "Read value"),',
  '    div(`Value: ${message}`)',
  '  );',
  '});',
].join('\n')

const controlledCode = [
  'const ControlledInput = component((_, handle) => {',
  '  const ref: DomRef<HTMLInputElement> = {',
  '    current: null,',
  '  };',
  '  let value = "";',
  '',
  '  const updateWithFocus = () => {',
  '    const prev = ref.current;',
  '    const start = prev?.selectionStart ?? null;',
  '    const end = prev?.selectionEnd ?? null;',
  '    handle.updateSync();',
  '    const next = ref.current;',
  '    if (next) {',
  '      next.focus();',
  '      if (start != null && end != null) {',
  '        next.setSelectionRange(start, end);',
  '      }',
  '    }',
  '  };',
  '',
  '  return () => div(',
  '    input({',
  '      ref,',
  '      value,',
  '      oninput: (e) => {',
  '        value = e.currentTarget.value;',
  '        updateWithFocus();',
  '      },',
  '    }),',
  '    div(`Live: ${value}`)',
  '  );',
  '});',
].join('\n')

const svgCode = [
  "import SparklesIcon from 'lucide-static/icons/sparkles.svg?vani';",
  "import { div, span } from '@vanijs/vani';",
  '',
  'export const SvgExample = () =>',
  '  div(',
  "    { className: 'flex items-center gap-3 text-sm' },",
  "    SparklesIcon({ size: 18, className: 'text-amber-300', 'aria-hidden': true }),",
  "    span('Import any SVG with ?vani and use it as a component.')",
  '  );',
].join('\n')

const signalCode = [
  "import { component, button, div, signal, text } from '@vanijs/vani';",
  '',
  'const Counter = component(() => {',
  '  const [count, setCount] = signal(0);',
  '  return () =>',
  '    div(',
  '      text(() => `Count: ${count()}`),',
  '      button({ onclick: () => setCount((value) => value + 1) }, "Increment")',
  '    );',
  '});',
].join('\n')

const examples: Example[] = [
  {
    title: 'Explicit updates',
    description: 'State changes only re-render when you call handle.update().',
    code: counterCode,
    tokens: getHighlightedTokens(counterCode, 'ts'),
    demo: () => CounterExample(),
  },
  {
    title: 'Signals (optional)',
    description: 'Fine-grained updates with signal(), text(), and attr().',
    code: signalCode,
    tokens: getHighlightedTokens(signalCode, 'ts'),
    demo: () => SignalExample(),
  },
  {
    title: 'JSX mode counter',
    description: 'Use JSX syntax with the Vani JSX runtime.',
    code: jsxExamples.counter.code,
    tokens: getHighlightedTokens(jsxExamples.counter.code, 'ts'),
    demo: () => jsxExamples.counter.demo(),
  },
  {
    title: 'JSX inside JS-first',
    description: 'Render JSX components inside element-helper trees.',
    code: jsxExamples.interop.code,
    tokens: getHighlightedTokens(jsxExamples.interop.code, 'ts'),
    demo: () => jsxExamples.interop.demo(),
  },
  {
    title: 'Conditional rendering',
    description: 'Use normal control flow to show or hide UI based on state.',
    code: toggleCode,
    tokens: getHighlightedTokens(toggleCode, 'ts'),
    demo: () => ToggleExample(),
  },
  {
    title: 'Forms with explicit submit',
    description: 'Input changes do not re-render until the user submits.',
    code: formCode,
    tokens: getHighlightedTokens(formCode, 'ts'),
    demo: () => FormExample(),
  },
  {
    title: 'Keyed lists',
    description: 'Keep item identity stable and update explicitly.',
    code: listCode,
    tokens: getHighlightedTokens(listCode, 'ts'),
    demo: () => ListExample(),
  },
  {
    title: 'Global state',
    description: 'Subscribe to shared state and update explicitly.',
    code: globalStateCode,
    tokens: getHighlightedTokens(globalStateCode, 'ts'),
    demo: () => GlobalStateExample(),
  },
  {
    title: 'Controlled inputs',
    description: 'Update on every keystroke while preserving focus.',
    code: controlledCode,
    tokens: getHighlightedTokens(controlledCode, 'ts'),
    demo: () => ControlledInputExample(),
  },
  {
    title: 'SVG components',
    description: 'Import SVGs with ?vani and render them as components.',
    code: svgCode,
    tokens: getHighlightedTokens(svgCode, 'ts'),
    demo: () => SvgExample(),
  },
  {
    title: 'Client-only islands',
    description: 'Mark islands with clientOnly: true (verify by disabling JS and reloading).',
    code: clientOnlyCode,
    tokens: getHighlightedTokens(clientOnlyCode, 'ts'),
    demo: () =>
      ClientOnlyClock({
        clientOnly: true,
        fallback: () =>
          h.div(
            {
              className: 'rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200',
            },
            'Loading...',
          ),
      }),
  },
  {
    title: 'Transitions',
    description: 'Defer non-urgent UI work to keep interactions snappy.',
    code: transitionCode,
    tokens: getHighlightedTokens(transitionCode, 'ts'),
    demo: () => TransitionExample(),
  },
  {
    title: 'Async components',
    description: 'Return a Promise of a render function with a fallback.',
    code: asyncCode,
    tokens: getHighlightedTokens(asyncCode, 'ts'),
    demo: () =>
      AsyncExample({
        fallback: () =>
          h.div(
            {
              className: 'rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200',
            },
            'Loading...',
          ),
      }),
  },
  {
    title: 'DOM refs',
    description: 'Access DOM nodes and control focus explicitly.',
    code: refCode,
    tokens: getHighlightedTokens(refCode, 'ts'),
    demo: () => RefExample(),
  },
]

export const LandingPageExamples = component(() => {
  return () =>
    h.div(
      { className: 'space-y-10' },
      ...examples.map((example, index) => {
        const flipped = index % 2 === 1
        return h.div(
          { className: 'space-y-4' },
          h.div(
            { className: 'space-y-1' },
            h.h3({ className: 'text-lg font-semibold text-white' }, example.title),
            h.p({ className: 'text-sm text-slate-300' }, example.description),
          ),
          h.div(
            {
              className: cn('flex flex-col gap-6 md:flex-row md:items-stretch', {
                'md:flex-row-reverse': flipped,
              }),
            },
            h.div(
              {
                className: cn(
                  'flex-1 rounded-3xl border border-white/10 bg-white/5 p-6',
                  'shadow-lg shadow-black/20',
                ),
              },
              example.demo(),
            ),
            h.div(
              {
                className: cn(
                  'flex-1 rounded-3xl border border-white/10 bg-slate-950/80 p-6',
                  'max-h-[360px] overflow-auto',
                  'shadow-lg shadow-black/20',
                ),
              },
              CopyableCodeBlock({
                code: example.code,
                tokens: example.tokens,
                className: 'text-xs',
              }),
            ),
          ),
        )
      }),
    )
})
