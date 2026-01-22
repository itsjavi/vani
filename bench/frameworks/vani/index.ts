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
  const rowChildren = rows.map((item) =>
    TableRow({
      key: item.id,
      item,
    }),
  )
  renderKeyedChildren(tbodyRef.current, rowChildren)
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

const TableRow = component<{ item: Row }>((props) => {
  return () =>
    tr(
      {
        className: { danger: selectedId === props.item.id },
      },
      td({ className: 'col-md-1' }, String(props.item.id)),
      td(
        { className: 'col-md-4' },
        a(
          {
            className: 'lbl',
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
        a(
          {
            onclick: (e: MouseEvent) => {
              e.preventDefault()
              removeRow(props.item.id)
            },
          },
          span({ className: 'glyphicon glyphicon-remove', ariaHidden: 'true' }),
        ),
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
      { className: 'table table-hover table-striped test-data' },
      tbody({ id: 'tbody', ref: tbodyRef }),
    )
})

const SmallpadButton = component(
  ({ id, label, onClick }: { id: string; label: string; onClick: () => void }) => {
    return () =>
      div(
        { className: 'col-sm-6 smallpad' },
        button(
          { type: 'button', className: 'btn btn-primary btn-block', id, onclick: onClick },
          label,
        ),
      )
  },
)

const Controls = component(() => {
  return () => {
    return div(
      { className: 'jumbotron' },
      div(
        { className: 'row' },
        div({ className: 'col-md-6' }, h1('Vani')),
        div(
          { className: 'col-md-6' },
          div(
            { className: 'row' },
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
              label: 'Sort Asc',
              onClick: () => setRows(sortRows(rows, true)),
            }),
            SmallpadButton({
              key: 'sortdesc',
              id: 'sortdesc',
              label: 'Sort Desc',
              onClick: () => setRows(sortRows(rows, false)),
            }),
          ),
        ),
      ),
    )
  }
})

const rootNode: HTMLElement | null = document.querySelector('#app')
if (!rootNode) {
  throw new Error('Root node not found')
}

const App = component(() => () => div({ className: 'container' }, Controls(), DataTable()))

renderToDOM([App()], rootNode)
