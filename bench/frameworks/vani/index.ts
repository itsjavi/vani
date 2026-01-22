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
  type DomRef,
  type Handle,
} from 'vani'
import type { Row } from '../shared'
import {
  get10000Rows,
  get1000Rows,
  remove,
  sortRows,
  swapRows,
  updatedEvery10thRow,
} from '../shared'

export const name = 'vani'

let rows: Row[] = []
let selectedId: number | null = null

const tbodyRef: DomRef<HTMLTableSectionElement> = { current: null }

const renderRows = () => {
  if (!tbodyRef.current) return
  renderKeyedChildren(
    tbodyRef.current,
    rows.map((item) =>
      TableRow({
        key: item.id,
        item,
        isSelected: selectedId === item.id,
      }),
    ),
  )
}

const setRows = (nextRows: Row[]) => {
  rows = nextRows
  renderRows()
}

const setSelected = (id: number | null) => {
  selectedId = id
  renderRows()
}

const removeRow = (id: number) => {
  if (selectedId === id) selectedId = null
  setRows(remove(rows, id))
}

const TableRow = component<{ item: Row; isSelected: boolean }>((props) => {
  return () =>
    tr(
      {
        className: { 'table-active': props.isSelected },
      },
      td({ className: 'col-md-1' }, String(props.item.id)),
      td(
        { className: 'col-md-4' },
        a(
          {
            className: 'lbl',
            href: '/',
            onclick: (e: MouseEvent) => {
              e.preventDefault()
              setSelected(props.item.id)
            },
          },
          props.item.label,
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
            removeRow(props.item.id)
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

const SmallpadButton = component(
  ({ id, label, onClick }: { id: string; label: string; onClick: () => void }) => {
    return () =>
      div(
        { className: 'col-6' },
        button({ type: 'button', className: 'btn btn-primary w-100', id, onclick: onClick }, label),
      )
  },
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
            SmallpadButton({
              key: 'run',
              id: 'run',
              label: 'Create 1,000 rows',
              onClick: () => {
                selectedId = null
                setRows(get1000Rows())
              },
            }),
            SmallpadButton({
              key: 'runlots',
              id: 'runlots',
              label: 'Create 10,000 rows',
              onClick: () => {
                selectedId = null
                setRows(get10000Rows())
              },
            }),
            SmallpadButton({
              key: 'add',
              id: 'add',
              label: 'Append 1,000 rows',
              onClick: () => setRows([...rows, ...get1000Rows()]),
            }),
            SmallpadButton({
              key: 'update',
              id: 'update',
              label: 'Update every 10th row',
              onClick: () => setRows(updatedEvery10thRow(rows)),
            }),
            SmallpadButton({
              key: 'clear',
              id: 'clear',
              label: 'Clear',
              onClick: () => {
                selectedId = null
                setRows([])
              },
            }),
            SmallpadButton({
              key: 'swaprows',
              id: 'swaprows',
              label: 'Swap Rows',
              onClick: () => setRows(swapRows(rows)),
            }),
            SmallpadButton({
              key: 'sortasc',
              id: 'sortasc',
              label: 'Sort Ascending',
              onClick: () => setRows(sortRows(rows, true)),
            }),
            SmallpadButton({
              key: 'sortdesc',
              id: 'sortdesc',
              label: 'Sort Descending',
              onClick: () => setRows(sortRows(rows, false)),
            }),
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

renderToDOM([App()], rootNode)
