import { renderToString } from '@/vani/ssr'
import SpaApp from './app'
import rootDoc from './root.html?raw'

function assembleDoc(pageBody: string) {
  const clientScript = import.meta.env.PROD
    ? "<script type='module' src='{{VANI_ENTRY_CLIENT_JS_URL}}'></script>"
    : "<script type='module' src='/src/spa-app/entry-client.ts'></script>"

  const cssLink = import.meta.env.PROD
    ? `<link rel='stylesheet' href='{{VANI_STYLES_URL}}'>`
    : `<link rel='stylesheet' href='/src/spa-app/styles.css'>`

  return rootDoc
    .replace('<!--vani:head-->', [cssLink].join('\n'))
    .replace('<!--vani:root-->', [pageBody, clientScript].join('\n'))
}

export default {
  fetch: async () => {
    const renderedApp = await renderToString(SpaApp({}))
    return new Response(assembleDoc(renderedApp), {
      headers: { 'Content-Type': 'text/html' },
    })
  },
}
