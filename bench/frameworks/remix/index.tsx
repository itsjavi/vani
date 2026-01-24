import { type Handle, createRoot } from '@remix-run/component'
import type { PokeBox, Row } from '../shared'
import {
  appendBoxes,
  cn,
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
} from '../shared'

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
    <div class="bench-view-toggle" id="view-toggle">
      <button
        type="button"
        class={cn('bench-view-btn', { 'is-active': currentView === 'datatable' })}
        aria-pressed={currentView === 'datatable'}
        aria-label="View data table"
        title="View data table"
        on={{ click: () => navigateToView('datatable') }}
      >
        {listIcon}
      </button>
      <button
        type="button"
        class={cn('bench-view-btn', { 'is-active': currentView === 'pokeboxes' })}
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
    <div class="bench-header jumbo-hero mb-3">
      <div class="row align-items-center g-0">
        <div class="col-lg-6">
          <ViewToggle currentView={currentView} />
          <h1 class="bench-title mb-0">{title}</h1>
        </div>
        <div class="col-lg-6">
          <div class="row g-2 bench-actions" id="app-actions">
            {actions.map((action) => (
              <div class="col-6" key={action.id}>
                <button
                  id={action.id}
                  class="btn btn-primary w-100"
                  type="button"
                  on={{ click: action.onClick }}
                >
                  {action.label}
                </button>
              </div>
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

  const setRows = (nextRows: Row[]) => {
    rows = nextRows
    handle.update()
  }

  const setSelected = (nextSelected: number | null) => {
    selected = nextSelected
    handle.update()
  }

  const run = () => {
    rows = get1000Rows()
    selected = null
    handle.update()
  }

  const runLots = () => {
    rows = get10000Rows()
    selected = null
    handle.update()
  }

  const add = () => {
    setRows([...rows, ...get1000Rows()])
  }

  const update = () => {
    setRows(updatedEvery10thRow(rows))
  }

  const clear = () => {
    rows = []
    selected = null
    handle.update()
  }

  const swap = () => {
    setRows(swapRows(rows))
  }

  const removeRow = (id: number) => {
    rows = remove(rows, id)
    if (selected === id) {
      selected = null
    }
    handle.update()
  }

  const sortAsc = () => {
    setRows(sortRows(rows, true))
  }

  const sortDesc = () => {
    setRows(sortRows(rows, false))
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
    <div class="container">
      <Header title="Remix" currentView="datatable" actions={actions} />
      <table class="table-hover table-striped test-data table align-middle">
        <tbody id="tbody">
          {rows.map((row) => {
            let rowId = row.id
            return (
              <tr key={rowId} class={selected === rowId ? 'table-active' : ''}>
                <td class="col-md-1">{rowId}</td>
                <td class="col-md-4">
                  <a
                    class="lbl"
                    href="/"
                    on={{
                      click: (event) => {
                        event.preventDefault()
                        setSelected(rowId)
                      },
                    }}
                  >
                    {row.label}
                  </a>
                </td>
                <td class="col-md-1">
                  <button
                    class="btn-close remove"
                    type="button"
                    aria-label="Remove"
                    on={{
                      click: (event) => {
                        event.preventDefault()
                        removeRow(rowId)
                      },
                    }}
                  />
                </td>
                <td class="col-md-6" />
              </tr>
            )
          })}
        </tbody>
      </table>
      <span class="preloadicon btn-close" aria-hidden="true" />
    </div>
  )
}

function PokeboxApp(handle: Handle) {
  let boxes: PokeBox[] = []
  let nextPkmIndex = 0

  const setBoxes = (nextBoxes: PokeBox[]) => {
    boxes = nextBoxes
    handle.update()
  }

  const append40 = () => {
    const result = appendBoxes(boxes, 40, nextPkmIndex)
    boxes = result.boxes
    nextPkmIndex = result.nextIndex
    handle.update()
  }

  const prepend40 = () => {
    const result = prependBoxes(boxes, 40, nextPkmIndex)
    boxes = result.boxes
    nextPkmIndex = result.nextIndex
    handle.update()
  }

  const remove3rdBox = () => {
    setBoxes(removeEveryNthBox(boxes, 3))
  }

  const swapBoxSetsAction = () => {
    setBoxes(swapBoxSets(boxes, 3))
  }

  const replaceFirst6 = () => {
    const result = replaceFirstBoxes(boxes, 6, nextPkmIndex)
    boxes = result.boxes
    nextPkmIndex = result.nextIndex
    handle.update()
  }

  const removeForms = () => {
    setBoxes(removeFormCells(boxes))
  }

  const markAll = () => {
    setBoxes(toggleAllCaught(boxes))
  }

  const toggle3rd = () => {
    setBoxes(toggleEveryNthCaught(boxes, 3))
  }

  const removeBox = (boxIndex: number) => {
    setBoxes(boxes.filter((_, index) => index !== boxIndex))
  }

  const toggleCell = (boxIndex: number, cellIndex: number) => {
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
    <div class="container">
      <Header title="Remix" currentView="pokeboxes" actions={actions} />
      <div class="pokebox-grid" id="pokebox-grid">
        {boxes.map((box, boxIndex) => (
          <div class="pokebox-card" key={box.id} data-box-index={boxIndex}>
            <div class="pokebox-header">
              <span class="pokebox-title">Box {box.id}</span>
              <button
                type="button"
                class="btn-close pokebox-remove"
                aria-label={`Remove Box ${box.id}`}
                data-box-index={boxIndex}
                on={{ click: () => removeBox(boxIndex) }}
              />
            </div>
            <div class="pokebox-cells">
              {box.cells.map((cell, cellIndex) => {
                const isEmpty = !cell
                const isCaught = cell?.caught
                return (
                  <button
                    type="button"
                    class="pokebox-cell"
                    key={`${boxIndex}-${cellIndex}`}
                    data-box-index={boxIndex}
                    data-cell-index={cellIndex}
                    data-empty={isEmpty ? 'true' : undefined}
                    data-caught={isCaught ? 'true' : undefined}
                    aria-label={
                      isEmpty ? `Empty cell ${cellIndex + 1}` : `Pokemon ${cell!.pkm.name}`
                    }
                    on={{
                      click: (event) => {
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
      <span class="preloadicon btn-close" aria-hidden="true" />
    </div>
  )
}

const view = resolveView()
let el = document.getElementById('main')!
let root = createRoot(el)
root.render(view === 'pokeboxes' ? <PokeboxApp /> : <DataTableApp />)
