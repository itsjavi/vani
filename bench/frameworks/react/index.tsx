import type { Dispatch } from 'react'
import { memo, useReducer, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
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

export const name = 'react'

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
  <div className="bench-view-toggle" id="view-toggle">
    <button
      type="button"
      className={cn('bench-view-btn', { 'is-active': currentView === 'datatable' })}
      aria-pressed={currentView === 'datatable'}
      aria-label="View data table"
      title="View data table"
      onClick={() => navigateToView('datatable')}
    >
      {listIcon}
    </button>
    <button
      type="button"
      className={cn('bench-view-btn', { 'is-active': currentView === 'pokeboxes' })}
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
  <div className="bench-header jumbo-hero mb-3">
    <div className="row align-items-center g-0">
      <div className="col-lg-6">
        <ViewToggle currentView={currentView} />
        <h1 className="bench-title mb-0">{title}</h1>
      </div>
      <div className="col-lg-6">
        <div className="row g-2 bench-actions" id="app-actions">
          {actions.map((action) => (
            <div className="col-6" key={action.id}>
              <button
                id={action.id}
                className="btn btn-primary w-100"
                type="button"
                onClick={action.onClick}
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

type State = {
  rows: Row[]
  selected: number | null
}

type Action =
  | { type: 'run' }
  | { type: 'runlots' }
  | { type: 'add' }
  | { type: 'update' }
  | { type: 'clear' }
  | { type: 'swap' }
  | { type: 'remove'; id: number }
  | { type: 'sortasc' }
  | { type: 'sortdesc' }
  | { type: 'select'; id: number }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'run':
      return { rows: get1000Rows(), selected: null }
    case 'runlots':
      return { rows: get10000Rows(), selected: null }
    case 'add':
      return { ...state, rows: [...state.rows, ...get1000Rows()] }
    case 'update':
      return { ...state, rows: updatedEvery10thRow(state.rows) }
    case 'clear':
      return { rows: [], selected: null }
    case 'swap':
      return { ...state, rows: swapRows(state.rows) }
    case 'remove':
      return { ...state, rows: remove(state.rows, action.id) }
    case 'sortasc':
      return { ...state, rows: sortRows(state.rows, true) }
    case 'sortdesc':
      return { ...state, rows: sortRows(state.rows, false) }
    case 'select':
      return { ...state, selected: action.id }
    default:
      return state
  }
}

type RowItemProps = {
  row: Row
  isSelected: boolean
  dispatch: Dispatch<Action>
}

const RowItem = memo(function RowItem({ row, isSelected, dispatch }: RowItemProps) {
  let rowId = row.id
  return (
    <tr className={isSelected ? 'table-active' : ''}>
      <td className="col-md-1">{rowId}</td>
      <td className="col-md-4">
        <a
          className="lbl"
          href="/"
          onClick={(event) => {
            event.preventDefault()
            dispatch({ type: 'select', id: rowId })
          }}
        >
          {row.label}
        </a>
      </td>
      <td className="col-md-1">
        <button
          className="btn-close remove"
          type="button"
          aria-label="Remove"
          onClick={(event) => {
            event.preventDefault()
            dispatch({ type: 'remove', id: rowId })
          }}
        />
      </td>
      <td className="col-md-6" />
    </tr>
  )
})

function DataTableApp() {
  let [state, dispatch] = useReducer(reducer, { rows: [], selected: null })

  let actions: HeaderAction[] = [
    { id: 'run', label: 'Create 1,000 rows', onClick: () => dispatch({ type: 'run' }) },
    { id: 'runlots', label: 'Create 10,000 rows', onClick: () => dispatch({ type: 'runlots' }) },
    { id: 'add', label: 'Append 1,000 rows', onClick: () => dispatch({ type: 'add' }) },
    { id: 'update', label: 'Update every 10th row', onClick: () => dispatch({ type: 'update' }) },
    { id: 'clear', label: 'Clear', onClick: () => dispatch({ type: 'clear' }) },
    { id: 'swaprows', label: 'Swap Rows', onClick: () => dispatch({ type: 'swap' }) },
    { id: 'sortasc', label: 'Sort Ascending', onClick: () => dispatch({ type: 'sortasc' }) },
    { id: 'sortdesc', label: 'Sort Descending', onClick: () => dispatch({ type: 'sortdesc' }) },
  ]

  return (
    <div className="container">
      <Header title="React" currentView="datatable" actions={actions} />
      <table className="table-hover table-striped test-data table align-middle">
        <tbody id="tbody">
          {state.rows.map((row) => (
            <RowItem
              key={row.id}
              row={row}
              isSelected={state.selected === row.id}
              dispatch={dispatch}
            />
          ))}
        </tbody>
      </table>
      <span className="preloadicon btn-close" aria-hidden="true" />
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
    <div className="container">
      <Header title="React" currentView="pokeboxes" actions={actions} />
      <div className="pokebox-grid" id="pokebox-grid">
        {boxes.map((box, boxIndex) => (
          <div className="pokebox-card" key={box.id} data-box-index={boxIndex}>
            <div className="pokebox-header">
              <span className="pokebox-title">Box {box.id}</span>
              <button
                type="button"
                className="btn-close pokebox-remove"
                aria-label={`Remove Box ${box.id}`}
                data-box-index={boxIndex}
                onClick={() => removeBox(boxIndex)}
              />
            </div>
            <div className="pokebox-cells">
              {box.cells.map((cell, cellIndex) => {
                const isEmpty = !cell
                const isCaught = cell?.caught
                return (
                  <button
                    type="button"
                    className="pokebox-cell"
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
                      <span className={`pkm-img pkm-img-${cell.pkm.nid}`} aria-hidden="true" />
                    ) : null}
                    {cell && isCaught ? (
                      <span
                        className="pokeball pokeball-sm pokebox-caught-badge"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <span className="preloadicon btn-close" aria-hidden="true" />
    </div>
  )
}

const view = resolveView()
let el = document.getElementById('main')!
let root = createRoot(el)
root.render(view === 'pokeboxes' ? <PokeboxApp /> : <DataTableApp />)
