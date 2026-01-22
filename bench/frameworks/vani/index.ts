import {
  a,
  button,
  component,
  div,
  h1,
  renderKeyedChildren,
  renderToDOM,
  span,
  table,
  tbody,
  td,
  tr,
  type ComponentRef,
  type DomRef,
  type Handle,
} from 'vani'
import {
  get10000Rows,
  get1000Rows,
  remove,
  sortRows,
  swapRows,
  updatedEvery10thRow,
  type Row,
} from '../shared'

export const name = 'vani'

let rows: Row[] = []
let selectedId: number | null = null
const rowById = new Map<number, Row>()
const rowRefs = new Map<number, ComponentRef>()

const tbodyRef: DomRef<HTMLTableSectionElement> = { current: null }

const renderRows = () => {
  if (!tbodyRef.current) return
  renderKeyedChildren(
    tbodyRef.current,
    rows.map((item) =>
      TableRow({
        key: item.id,
        ref: getRowRef(item.id),
        id: item.id,
      }),
    ),
  )
}

const getRowRef = (id: number) => {
  let ref = rowRefs.get(id)
  if (!ref) {
    ref = { current: null }
    rowRefs.set(id, ref)
  }
  return ref
}

const setRows = (nextRows: Row[]) => {
  rows = nextRows
  renderRows()
}

const resetRows = (nextRows: Row[]) => {
  selectedId = null
  rowById.clear()
  rowRefs.clear()
  rows = nextRows
  for (const row of rows) rowById.set(row.id, row)
  renderRows()
}

const appendRows = (nextRows: Row[]) => {
  rows.push(...nextRows)
  for (const row of nextRows) rowById.set(row.id, row)
  renderRows()
}

const clearRows = () => {
  selectedId = null
  rows = []
  rowById.clear()
  rowRefs.clear()
  renderRows()
}

const setSelected = (id: number | null) => {
  if (selectedId === id) return
  const prev = selectedId
  selectedId = id
  if (prev !== null) {
    rowRefs.get(prev)?.current?.update({ onlyAttributes: true })
  }
  if (selectedId !== null) {
    rowRefs.get(selectedId)?.current?.update({ onlyAttributes: true })
  }
}

const removeRow = (id: number) => {
  if (selectedId === id) setSelected(null)
  rowById.delete(id)
  rowRefs.delete(id)
  setRows(remove(rows, id))
}

const TableRow = component<{ id: number }>((props) => {
  return () =>
    tr(
      {
        className: { 'table-active': selectedId === props.id },
      },
      td({ className: 'col-md-1' }, String(props.id)),
      td(
        { className: 'col-md-4' },
        a(
          {
            className: 'lbl',
            href: '/',
            onclick: (e: MouseEvent) => {
              e.preventDefault()
              setSelected(props.id)
            },
          },
          rowById.get(props.id)?.label ?? '',
        ),
      ),
      td(
        { className: 'col-md-1' },
        button({
          type: 'button',
          className: 'btn-close remove',
          ariaLabel: 'Remove',
          onclick: (e: MouseEvent) => {
            e.preventDefault()
            removeRow(props.id)
          },
        }),
      ),
      td({ className: 'col-md-6' }),
    )
})

const DataTable = component((_, handle: Handle) => {
  handle.effect(() => {
    queueMicrotask(renderRows)
  })

  return () =>
    table(
      { className: 'table-hover table-striped test-data table align-middle' },
      tbody({ id: 'tbody', ref: tbodyRef }),
    )
})

const actions = [
  { id: 'run', label: 'Create 1,000 rows', onClick: () => resetRows(get1000Rows()) },
  { id: 'runlots', label: 'Create 10,000 rows', onClick: () => resetRows(get10000Rows()) },
  { id: 'add', label: 'Append 1,000 rows', onClick: () => appendRows(get1000Rows()) },
  {
    id: 'update',
    label: 'Update every 10th row',
    onClick: () => {
      rows = updatedEvery10thRow(rows)
      for (let i = 0; i < rows.length; i += 10) {
        const row = rows[i]
        rowById.set(row.id, row)
        rowRefs.get(row.id)?.current?.update()
      }
    },
  },
  { id: 'clear', label: 'Clear', onClick: clearRows },
  { id: 'swaprows', label: 'Swap Rows', onClick: () => setRows(swapRows(rows)) },
  { id: 'sortasc', label: 'Sort Ascending', onClick: () => setRows(sortRows(rows, true)) },
  { id: 'sortdesc', label: 'Sort Descending', onClick: () => setRows(sortRows(rows, false)) },
]

const ActionButton = component(
  ({ id, label, onClick }: { id: string; label: string; onClick: () => void }) =>
    () =>
      div(
        { className: 'col-6' },
        button({ type: 'button', className: 'btn btn-primary w-100', id, onclick: onClick }, label),
      ),
)

const Controls = component(() => {
  return () => {
    return div(
      { className: 'bench-header jumbo-hero mb-3' },
      div(
        { className: 'row align-items-center g-0' },
        div({ className: 'col-lg-6' }, h1({ className: 'bench-title mb-0' }, 'Vani')),
        div(
          { className: 'col-lg-6' },
          div(
            { className: 'row g-2 bench-actions', id: 'app-actions' },
            ...actions.map((action) =>
              ActionButton({
                key: action.id,
                id: action.id,
                label: action.label,
                onClick: action.onClick,
              }),
            ),
          ),
        ),
      ),
    )
  }
})

const rootNode: HTMLElement | null = document.querySelector('#main')
if (!rootNode) {
  throw new Error('Root node not found')
}

const App = component(
  () => () =>
    div(
      { className: 'container' },
      Controls(),
      DataTable(),
      span({ className: 'preloadicon btn-close', ariaHidden: 'true' }),
    ),
)

renderToDOM(App(), rootNode)
