import { component, el, type DomRef, type Handle } from '@/vani'
import * as h from '@/vani/html'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { cn } from './utils'

type LiveSandboxProps = {
  dialogRef: DomRef<HTMLDialogElement>
}

const defaultCode = [
  "import { component, div, button } from '@vanijs/vani'",
  '',
  'const Counter = component((_, handle) => {',
  '  let count = 0',
  '  return () =>',
  '    div(',
  '      {className: ["p-4 bg-blue-500/10 rounded-xl",\n        "flex items-center gap-4"]},',
  '      `Count: ${count}`,',
  '      button(',
  '        {',
  '          className: ["px-4 py-2 rounded-xl",\n            "bg-blue-600 hover:opacity-90"],',
  '          onclick: () => {',
  '            count += 1',
  '            handle.update()',
  '          },',
  '        },',
  "        'Increment',",
  '      ),',
  '    )',
  '})',
  '',
  'export default Counter',
].join('\n')

const iframeSrcDoc = [
  '<!doctype html>',
  '<html>',
  '<head>',
  '<meta charset="utf-8" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1" />',
  // '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css" />',
  '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" crossorigin="anonymous"></script>',
  '<style>',
  '  :root { color-scheme: dark; }',
  '  body { margin: 0; background: #0f172a; color: #e2e8f0; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }',
  '  #root { min-height: 100vh; padding: 24px; }',
  '  .empty { border: 1px dashed rgba(148, 163, 184, 0.5); border-radius: 16px; padding: 20px; color: #94a3b8; }',
  '  .error { color: #fca5a5; white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }',
  '</style>',
  '<script type="importmap">',
  JSON.stringify(
    {
      imports: {
        '@vanijs/vani': 'https://esm.sh/@vanijs/vani@latest',
      },
    },
    null,
    2,
  ),
  '</script>',
  '</head>',
  '<body>',
  '<div id="root"></div>',
  '<script type="module">',
  "import { renderToDOM, isComponentInstance } from 'https://esm.sh/@vanijs/vani@0latest';",
  'const root = document.getElementById("root");',
  'let handles = [];',
  'const clearHandles = () => {',
  '  for (const handle of handles) handle.dispose();',
  '  handles = [];',
  '};',
  'const renderEmpty = (title, body) => {',
  '  clearHandles();',
  '  root.innerHTML = `<div class="empty"><strong>${title}</strong><div style="margin-top:8px;">${body}</div></div>`;',
  '};',
  'const renderError = (message) => {',
  '  clearHandles();',
  '  root.innerHTML = `<div class="empty"><strong>Runtime error</strong><div class="error" style="margin-top:12px;">${message}</div></div>`;',
  '};',
  'const run = async (code) => {',
  '  try {',
  '    const blob = new Blob([code], { type: "text/javascript" });',
  '    const url = URL.createObjectURL(blob);',
  '    const mod = await import(url);',
  '    URL.revokeObjectURL(url);',
  '    const exported = mod?.default;',
  '    if (!exported) {',
  '      renderEmpty("No default export", "Export a Vani component as default.");',
  '      return;',
  '    }',
  '    let mountable = exported;',
  '    if (typeof exported === "function" && !isComponentInstance(exported)) {',
  '      try {',
  '        const maybe = exported();',
  '        if (isComponentInstance(maybe)) {',
  '          mountable = maybe;',
  '        }',
  '      } catch {',
  '        mountable = exported;',
  '      }',
  '    }',
  '    if (typeof mountable !== "function" && !isComponentInstance(mountable)) {',
  '      renderEmpty("Unsupported export", "Default export must be a Vani component or factory.");',
  '      return;',
  '    }',
  '    clearHandles();',
  '    root.innerHTML = "";',
  '    handles = renderToDOM(mountable, root);',
  '  } catch (error) {',
  '    renderError(error instanceof Error ? error.stack ?? error.message : String(error));',
  '  }',
  '};',
  'window.addEventListener("message", (event) => {',
  '  if (!event.data || event.data.type !== "vani-code") return;',
  '  run(event.data.code);',
  '});',
  'renderEmpty("Ready", "Waiting for code...");',
  '</script>',
  '</body>',
  '</html>',
].join('\n')

const editorBaseStyles = [
  '.cm-editor{position:relative;box-sizing:border-box;height:100%;}',
  '.cm-scroller{display:flex;align-items:flex-start;overflow:auto;height:100%;font-size:16px;}',
  '.cm-content{margin:0;padding:0;white-space:pre;word-break:normal;box-sizing:border-box;}',
  '.cm-line{display:block;padding:0 2px;}',
  '.cm-gutters{flex-shrink:0;background:rgba(15,23,42,0.6);color:#94a3b8;',
  'border-right:1px solid rgba(148,163,184,0.2);}',
  '.cm-gutter{min-width:2ch;box-sizing:border-box;padding:0 6px 0 8px;text-align:right;}',
  '.cm-activeLine{background:rgba(148,163,184,0.08);}',
].join('')

export const LiveSandboxDialog = component((props: LiveSandboxProps, handle: Handle) => {
  const editorRef: DomRef<HTMLDivElement> = { current: null }
  const iframeRef: DomRef<HTMLIFrameElement> = { current: null }
  let view: EditorView | null = null
  let latestCode = defaultCode
  let debounceId: ReturnType<typeof setTimeout> | null = null

  const sendCode = (code: string) => {
    latestCode = code
    iframeRef.current?.contentWindow?.postMessage({ type: 'vani-code', code }, '*')
  }

  const scheduleSend = (code: string) => {
    if (debounceId) clearTimeout(debounceId)
    debounceId = setTimeout(() => sendCode(code), 200)
  }

  handle.effect(() => {
    const initId = setTimeout(() => {
      if (!editorRef.current) return

      const state = EditorState.create({
        doc: defaultCode,
        extensions: [
          javascript({ typescript: true }),
          vscodeDark,
          EditorState.tabSize.of(2),
          EditorView.lineWrapping,
          keymap.of([indentWithTab, ...defaultKeymap]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              scheduleSend(update.state.doc.toString())
            }
          }),
        ],
      })

      view = new EditorView({ state, parent: editorRef.current })
      sendCode(defaultCode)
      iframeRef.current?.setAttribute('sandbox', 'allow-scripts')
    }, 0)

    return () => {
      clearTimeout(initId)
      if (debounceId) clearTimeout(debounceId)
      view?.destroy()
      view = null
    }
  })

  return () =>
    el(
      'dialog',
      {
        ref: props.dialogRef,
        className: cn(
          'm-0 h-full w-full max-w-none rounded-none border border-white/10 bg-slate-950 text-white',
          'backdrop:bg-slate-950/70',
        ),
        onclick: (event: MouseEvent) => {
          if (event.target === props.dialogRef.current) {
            props.dialogRef.current?.close()
          }
        },
      },
      h.style({}, editorBaseStyles),
      h.div(
        {
          className: cn(
            'flex items-center justify-between border-b border-white/10 px-6 py-4',
            'bg-slate-950/80',
          ),
        },
        h.div(
          { className: 'space-y-1' },
          h.h2({ className: 'text-lg font-semibold' }, 'Live Playground'),
          h.p({ className: 'text-xs text-slate-400' }, 'Default export must be a component.'),
        ),
        h.button(
          {
            type: 'button',
            className:
              'rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white',
            onclick: () => props.dialogRef.current?.close(),
          },
          'Close',
        ),
      ),
      h.div(
        {
          className: cn('grid h-[calc(100vh-88px)] gap-4 p-6', 'lg:grid-cols-[1.1fr_1fr]'),
        },
        h.div(
          {
            className: cn(
              'flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5',
              'shadow-lg shadow-slate-950/50',
            ),
          },
          h.div(
            { className: 'border-b border-white/10 px-4 py-2 text-xs uppercase text-slate-400' },
            'Code',
          ),
          h.div({ ref: editorRef, className: 'min-h-[320px] flex-1' }),
        ),
        h.div(
          {
            className: cn(
              'flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5',
              'shadow-lg shadow-slate-950/50',
            ),
          },
          h.div(
            { className: 'border-b border-white/10 px-4 py-2 text-xs uppercase text-slate-400' },
            'Preview',
          ),
          h.iframe({
            ref: iframeRef,
            className: 'min-h-[320px] flex-1 bg-slate-950',
            srcdoc: iframeSrcDoc,
            onload: () => sendCode(latestCode),
          }),
        ),
      ),
    )
})
