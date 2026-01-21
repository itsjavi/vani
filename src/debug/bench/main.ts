import { renderToDOM, span } from '../../vani'
import { Controls, DataTable } from './components'

const rootNode: HTMLElement | null = document.querySelector('#app')
if (!rootNode) {
  throw new Error('Root node not found')
}

renderToDOM(
  [
    Controls(),
    DataTable(),
    () => () => span({ className: 'preloadicon glyphicon glyphicon-remove', ariaHidden: 'true' }),
  ],
  rootNode,
)
