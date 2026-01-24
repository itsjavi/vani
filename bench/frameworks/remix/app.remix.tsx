import type { PokeBox, Row } from '@/bench/core'
import {
  appendBoxes,
  get10000Rows,
  get1000Rows,
  prependBoxes,
  remove,
  removeEveryNthBox,
  removeFormCells,
  replaceFirstBoxes,
  sortRows,
  swapBoxSets,
  swapRows,
  toggleAllCaught,
  toggleEveryNthCaught,
  updatedEvery10thRow,
} from '@/bench/core'
import { cn } from '@/bench/lib/utils'
import { createRoot, type Handle } from 'remix/component'

export const name = 'remix'

type View = 'datatable' | 'pokeboxes'

const listIcon = '📊'
const gridIcon = '📦'

const resolveView = (): View => {
  const params = new URLSearchParams(window.location.search)
  return params.get('view') === 'pokeboxes' ? 'pokeboxes' : 'datatable'
}

const navigateToView = (view: View) => {
  const url = new URL(window.location.href)
  url.searchParams.set('view', view)
  window.location.assign(url.toString())
}

function ViewToggle() {
  return ({ currentView }: { currentView: View }) => (
    <div class={cn('bench-view-toggle')} id="view-toggle">
      <button
        type="button"
        class={cn('bench-view-button', {
          'bench-view-button-active': currentView === 'datatable',
        })}
        aria-pressed={currentView === 'datatable'}
        aria-label="View data table"
        title="View data table"
        on={{ click: () => navigateToView('datatable') }}
      >
        {listIcon}
      </button>
      <button
        type="button"
        class={cn('bench-view-button', {
          'bench-view-button-active': currentView === 'pokeboxes',
        })}
        aria-pressed={currentView === 'pokeboxes'}
        aria-label="View pokeboxes"
        title="View pokeboxes"
        on={{ click: () => navigateToView('pokeboxes') }}
      >
        {gridIcon}
      </button>
    </div>
  )
}

type HeaderAction = { id: string; label: string; onClick: () => void }

function Header() {
  return ({
    title,
    currentView,
    actions,
  }: {
    title: string
    currentView: View
    actions: HeaderAction[]
  }) => (
    <div class={cn('bench-hero', 'bench-section')}>
      <div class={cn('bench-grid-2')}>
        <div class={cn('relative')}>
          <ViewToggle currentView={currentView} />
          <h1 class={cn('bench-title')}>{title}</h1>
        </div>
        <div>
          <div class={cn('bench-actions')} id="app-actions">
            {actions.map((action) => (
              <button
                id={action.id}
                class={cn('bench-button', 'bench-button-primary', 'w-full')}
                type="button"
                on={{ click: action.onClick }}
                key={action.id}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DataTableApp(handle: Handle) {
  let rows: Row[] = []
  let selected: number | null = null

  let run = () => {
    rows = get1000Rows()
    selected = null
    handle.update()
  }

  let runLots = () => {
    rows = get10000Rows()
    selected = null
    handle.update()
  }

  let add = () => {
    rows = [...rows, ...get1000Rows()]
    handle.update()
  }

  let update = () => {
    rows = updatedEvery10thRow(rows)
    handle.update()
  }

  let clear = () => {
    rows = []
    selected = null
    handle.update()
  }

  let swap = () => {
    rows = swapRows(rows)
    handle.update()
  }

  let removeRow = (id: number) => {
    rows = remove(rows, id)
    handle.update()
  }

  let sortAsc = () => {
    rows = sortRows(rows, true)
    handle.update()
  }

  let sortDesc = () => {
    rows = sortRows(rows, false)
    handle.update()
  }

  const actions: HeaderAction[] = [
    { id: 'run', label: 'Create 1,000 rows', onClick: run },
    { id: 'runlots', label: 'Create 10,000 rows', onClick: runLots },
    { id: 'add', label: 'Append 1,000 rows', onClick: add },
    { id: 'update', label: 'Update every 10th row', onClick: update },
    { id: 'clear', label: 'Clear', onClick: clear },
    { id: 'swaprows', label: 'Swap Rows', onClick: swap },
    { id: 'sortasc', label: 'Sort Ascending', onClick: sortAsc },
    { id: 'sortdesc', label: 'Sort Descending', onClick: sortDesc },
  ]

  return () => (
    <div class={cn('bench-container')}>
      <Header title="Remix" currentView="datatable" actions={actions} />
      <table class={cn('bench-data-table')}>
        <tbody id="tbody">
          {rows.map((row) => {
            let rowId = row.id
            return (
              <tr
                key={rowId}
                class={cn('bench-data-row', { 'bench-data-active': selected === rowId })}
              >
                <td class={cn('bench-data-cell', 'bench-data-id')}>{rowId}</td>
                <td class={cn('bench-data-cell')}>
                  <a
                    class={cn('bench-data-link')}
                    href="/"
                    on={{
                      click(event) {
                        event.preventDefault()
                        selected = rowId
                        handle.update()
                      },
                    }}
                  >
                    {row.label}
                  </a>
                </td>
                <td class={cn('bench-data-cell')}>
                  <button
                    class={cn('bench-data-remove')}
                    type="button"
                    aria-label="Remove"
                    on={{
                      click(event) {
                        event.preventDefault()
                        removeRow(rowId)
                      },
                    }}
                  />
                </td>
                <td class={cn('bench-data-cell')} />
              </tr>
            )
          })}
        </tbody>
      </table>
      <span class={cn('bench-preload-icon', 'bench-data-remove')} aria-hidden="true" />
    </div>
  )
}

function PokeboxApp(handle: Handle) {
  let boxes: PokeBox[] = []
  let nextPkmIndex = 0

  let append40 = () => {
    const result = appendBoxes(boxes, 40, nextPkmIndex)
    nextPkmIndex = result.nextIndex
    boxes = result.boxes
    handle.update()
  }

  let prepend40 = () => {
    const result = prependBoxes(boxes, 40, nextPkmIndex)
    nextPkmIndex = result.nextIndex
    boxes = result.boxes
    handle.update()
  }

  let remove3rdBox = () => {
    boxes = removeEveryNthBox(boxes, 3)
    handle.update()
  }

  let swapBoxSetsAction = () => {
    boxes = swapBoxSets(boxes, 3)
    handle.update()
  }

  let replaceFirst6 = () => {
    const result = replaceFirstBoxes(boxes, 6, nextPkmIndex)
    nextPkmIndex = result.nextIndex
    boxes = result.boxes
    handle.update()
  }

  let removeForms = () => {
    boxes = removeFormCells(boxes)
    handle.update()
  }

  let markAll = () => {
    boxes = toggleAllCaught(boxes)
    handle.update()
  }

  let toggle3rd = () => {
    boxes = toggleEveryNthCaught(boxes, 3)
    handle.update()
  }

  let removeBox = (boxIndex: number) => {
    boxes = boxes.filter((_, index) => index !== boxIndex)
    handle.update()
  }

  let toggleCell = (boxIndex: number, cellIndex: number) => {
    const box = boxes[boxIndex]
    if (!box) return
    const cell = box.cells[cellIndex]
    if (!cell) return
    boxes = boxes.map((currentBox, index) => {
      if (index !== boxIndex) return currentBox
      const cells = currentBox.cells.slice()
      cells[cellIndex] = { ...cell, caught: !cell.caught }
      return { ...currentBox, cells }
    })
    handle.update()
  }

  const actions: HeaderAction[] = [
    { id: 'append40', label: 'Append 40 boxes', onClick: append40 },
    { id: 'prepend40', label: 'Prepend 40 boxes', onClick: prepend40 },
    { id: 'remove3rdbox', label: 'Remove every 3rd box', onClick: remove3rdBox },
    { id: 'swapboxsets', label: 'Swap box sets', onClick: swapBoxSetsAction },
    { id: 'replacefirst6', label: 'Replace first 6 boxes', onClick: replaceFirst6 },
    { id: 'removeforms', label: 'Remove form variants', onClick: removeForms },
    { id: 'toggleall', label: 'Toggle all as caught', onClick: markAll },
    { id: 'toggle3rd', label: 'Toggle every 3rd cell', onClick: toggle3rd },
  ]

  return () => (
    <div class={cn('bench-container')}>
      <Header title="Remix" currentView="pokeboxes" actions={actions} />
      <div class={cn('bench-pokebox-grid')} id="pokebox-grid">
        {boxes.map((box, boxIndex) => (
          <div class={cn('bench-pokebox-card')} key={box.id} data-box-index={boxIndex}>
            <div class={cn('bench-pokebox-header')}>
              <span class={cn('bench-pokebox-title')}>Box {box.id}</span>
              <button
                type="button"
                class={cn('bench-pokebox-remove')}
                aria-label={`Remove Box ${box.id}`}
                data-box-index={boxIndex}
                on={{ click: () => removeBox(boxIndex) }}
              />
            </div>
            <div class={cn('bench-pokebox-cells')}>
              {box.cells.map((cell, cellIndex) => {
                const isEmpty = !cell
                const isCaught = cell?.caught
                return (
                  <button
                    type="button"
                    class={cn('bench-pokebox-cell')}
                    key={`${boxIndex}-${cellIndex}`}
                    data-box-index={boxIndex}
                    data-cell-index={cellIndex}
                    data-empty={isEmpty ? 'true' : undefined}
                    data-caught={isCaught ? 'true' : undefined}
                    aria-label={
                      isEmpty ? `Empty cell ${cellIndex + 1}` : `Pokemon ${cell!.pkm.name}`
                    }
                    on={{
                      click(event) {
                        event.preventDefault()
                        if (!cell) return
                        toggleCell(boxIndex, cellIndex)
                      },
                    }}
                  >
                    {cell ? (
                      <span class={`pkm-img pkm-img-${cell.pkm.nid}`} aria-hidden="true" />
                    ) : null}
                    {cell && isCaught ? (
                      <span class="pokeball pokeball-sm pokebox-caught-badge" aria-hidden="true" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <span class={cn('bench-preload-icon', 'bench-data-remove')} aria-hidden="true" />
    </div>
  )
}

export default function renderApp(node: HTMLElement) {
  const view = resolveView()
  const root = createRoot(node)
  const app = view === 'pokeboxes' ? <PokeboxApp /> : <DataTableApp />
  root.render(app)
}
