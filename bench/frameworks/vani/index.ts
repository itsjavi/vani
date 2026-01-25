import { renderToDOM } from 'vani-local'
import App from './app'

const rootNode: HTMLElement | null = document.querySelector('#main')
if (!rootNode) {
  throw new Error('Root node not found')
}

renderToDOM(App(), rootNode)
