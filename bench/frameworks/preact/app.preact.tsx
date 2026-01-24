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
import { useRef, useState } from 'preact/hooks'

export const name = 'preact'

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

const ViewToggle = ({ currentView }: { currentView: View }) => (
  <div class={cn('bench-view-toggle')} id="view-toggle">
    <button
      type="button"
      class={cn('bench-view-button', {
        'bench-view-button-active': currentView === 'datatable',
      })}
      aria-pressed={currentView === 'datatable'}
      aria-label="View data table"
      title="View data table"
      onClick={() => navigateToView('datatable')}
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
      onClick={() => navigateToView('pokeboxes')}
    >
      {gridIcon}
    </button>
  </div>
)

type HeaderAction = { id: string; label: string; onClick: () => void }

const Header = ({
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
              onClick={action.onClick}
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

function DataTableApp() {
  let [rows, setRows] = useState<Row[]>([])
  let [selected, setSelected] = useState<number | null>(null)

  let run = () => {
    setRows(get1000Rows())
    setSelected(null)
  }

  let runLots = () => {
    setRows(get10000Rows())
    setSelected(null)
  }

  let add = () => {
    setRows((current) => [...current, ...get1000Rows()])
  }

  let update = () => {
    setRows((current) => updatedEvery10thRow(current))
  }

  let clear = () => {
    setRows([])
    setSelected(null)
  }

  let swap = () => {
    setRows((current) => swapRows(current))
  }

  let removeRow = (id: number) => {
    setRows((current) => remove(current, id))
  }

  let sortAsc = () => {
    setRows((current) => sortRows(current, true))
  }

  let sortDesc = () => {
    setRows((current) => sortRows(current, false))
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

  return (
    <div class={cn('bench-container')}>
      <Header title="Preact" currentView="datatable" actions={actions} />
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
                    onClick={(event) => {
                      event.preventDefault()
                      setSelected(rowId)
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
                    onClick={(event) => {
                      event.preventDefault()
                      removeRow(rowId)
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

function PokeboxApp() {
  const [boxes, setBoxes] = useState<PokeBox[]>([])
  const nextPkmIndex = useRef(0)

  const append40 = () => {
    setBoxes((current) => {
      const result = appendBoxes(current, 40, nextPkmIndex.current)
      nextPkmIndex.current = result.nextIndex
      return result.boxes
    })
  }

  const prepend40 = () => {
    setBoxes((current) => {
      const result = prependBoxes(current, 40, nextPkmIndex.current)
      nextPkmIndex.current = result.nextIndex
      return result.boxes
    })
  }

  const remove3rdBox = () => {
    setBoxes((current) => removeEveryNthBox(current, 3))
  }

  const swapBoxSetsAction = () => {
    setBoxes((current) => swapBoxSets(current, 3))
  }

  const replaceFirst6 = () => {
    setBoxes((current) => {
      const result = replaceFirstBoxes(current, 6, nextPkmIndex.current)
      nextPkmIndex.current = result.nextIndex
      return result.boxes
    })
  }

  const removeForms = () => {
    setBoxes((current) => removeFormCells(current))
  }

  const markAll = () => {
    setBoxes((current) => toggleAllCaught(current))
  }

  const toggle3rd = () => {
    setBoxes((current) => toggleEveryNthCaught(current, 3))
  }

  const removeBox = (boxIndex: number) => {
    setBoxes((current) => current.filter((_, index) => index !== boxIndex))
  }

  const toggleCell = (boxIndex: number, cellIndex: number) => {
    setBoxes((current) => {
      const box = current[boxIndex]
      if (!box) return current
      const cell = box.cells[cellIndex]
      if (!cell) return current
      return current.map((currentBox, index) => {
        if (index !== boxIndex) return currentBox
        const cells = currentBox.cells.slice()
        cells[cellIndex] = { ...cell, caught: !cell.caught }
        return { ...currentBox, cells }
      })
    })
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

  return (
    <div class={cn('bench-container')}>
      <Header title="Preact" currentView="pokeboxes" actions={actions} />
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
                onClick={() => removeBox(boxIndex)}
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
                    onClick={(event) => {
                      event.preventDefault()
                      if (!cell) return
                      toggleCell(boxIndex, cellIndex)
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

export default function App() {
  const view = resolveView()
  return view === 'pokeboxes' ? <PokeboxApp /> : <DataTableApp />
}
