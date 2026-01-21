import { component, type Handle } from '@/vani'
import * as h from '@/vani/html'
import { cn } from './utils'

const jsxCounterCode = [
  'const Counter = component((_, handle) => {',
  '  let count = 0;',
  '  return () => (',
  '    <div>',
  '      <p>Count: {count}</p>',
  '      <button',
  '        type="button"',
  '        onclick={() => {',
  '          count += 1;',
  '          handle.update();',
  '        }}',
  '      >',
  '        Increment',
  '      </button>',
  '    </div>',
  '  );',
  '});',
].join('\n')

const jsxInteropCode = [
  'import * as h from "@vanijs/vani/html";',
  '',
  'const Badge = component<{ label: string }>((props) => {',
  '  return () => <span>{props.label}</span>;',
  '});',
  '',
  'const Panel = component(() => {',
  '  return () =>',
  '    h.div(',
  '      "Mixed render:",',
  '      Badge({ label: "JSX component" }),',
  '      h.span("inside a non-JSX component")',
  '    );',
  '});',
].join('\n')

export const jsxExamples = {
  counter: {
    code: jsxCounterCode,
    demo: component((_, handle: Handle) => {
      let count = 0
      return () => (
        <div className={cn('space-y-3')}>
          <p className={cn('text-sm text-slate-300')}>Count: {count}</p>
          <button
            type="button"
            className={cn(
              'rounded-full bg-emerald-400/90 px-4 py-2 text-xs font-semibold text-slate-900',
            )}
            onclick={() => {
              count += 1
              handle.update()
            }}
          >
            Increment
          </button>
        </div>
      )
    }),
  },
  interop: {
    code: jsxInteropCode,
    demo: component(() => {
      const JsxBadge = component<{ label: string }>((props) => {
        return () => (
          <span
            className={cn(
              'rounded-full border border-white/20 px-3 py-1 text-[10px] text-slate-200',
            )}
          >
            {props.label}
          </span>
        )
      })

      return () =>
        h.div(
          { className: 'space-y-3 text-xs text-slate-300' },
          h.p('Mixed render:'),
          h.div(
            { className: 'flex flex-wrap items-center gap-2' },
            JsxBadge({ label: 'JSX component' }),
            h.span('inside a non-JSX component.'),
          ),
        )
    }),
  },
}
