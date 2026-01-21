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
import { type RowItem } from '../benchmark-generators'
import { RowsStore, SelectionStore, type BenchmarkActions } from '../benchmark-state-managers'

export const name = 'vani'

// Global store instances
const rowsStore = new RowsStore()
const selectionStore = new SelectionStore()

// Row component - keyed for efficient updates
// Each row subscribes to selection changes individually to avoid full table re-renders
const TableRow = component<{
  item: RowItem
}>((props, handle) => {
  // Subscribe to selection changes for this specific row
  handle.effect(() => {
    return selectionStore.subscribe(props.item.id, handle.update)
  })

  return () => {
    // Read selection state during render so it's always current
    const selected = selectionStore.isSelected(props.item.id)

    return tr(
      {
        className: { danger: selected },
      },
      td({ className: 'col-md-1' }, String(props.item.id)),
      td(
        { className: 'col-md-4' },
        a(
          {
            className: 'lbl',
            onclick: (e: MouseEvent) => {
              e.preventDefault()
              selectionStore.selectRow(props.item.id)
            },
          },
          props.item.label,
        ),
      ),
      td(
        { className: 'col-md-1' },
        a(
          {
            className: 'remove btn btn-default btn-xs',
            onclick: (e: MouseEvent) => {
              e.preventDefault()
              rowsStore.deleteRow(props.item.id)
              if (selectionStore.isSelected(props.item.id)) {
                selectionStore.clearSelection()
              }
            },
          },
          span({ className: '', ariaHidden: 'true' }, 'X'),
        ),
      ),
      td({ className: 'col-md-6' }),
    )
  }
})

// Table body component that manages rows state
const DataTable = component((_, handle: Handle) => {
  const tbodyRef: DomRef<HTMLTableSectionElement> = { current: null }

  const renderRows = () => {
    if (!tbodyRef.current) return
    const rowChildren = rowsStore.getRows().map((item) =>
      TableRow({
        key: item.id,
        item,
      }),
    )
    renderKeyedChildren(tbodyRef.current, rowChildren)
  }

  handle.effect(() => {
    const subscriptionHandle: Handle = {
      update: renderRows,
      updateSync: renderRows,
      dispose() {},
      onCleanup() {},
      effect() {},
    }

    const unsubscribe = rowsStore.subscribe(subscriptionHandle.update)
    queueMicrotask(renderRows)
    return unsubscribe
  })

  // Expose actions to window for benchmark driver
  handle.effect(() => {
    ;(globalThis as typeof globalThis & { benchmarkActions: BenchmarkActions }).benchmarkActions = {
      create1000Rows: () => {
        rowsStore.create1000Rows()
        selectionStore.clearSelection()
      },
      create10000Rows: () => {
        rowsStore.create10000Rows()
        selectionStore.clearSelection()
      },
      append1000Rows: () => rowsStore.append1000Rows(),
      updateEvery10thRow: () => rowsStore.updateEvery10thRow(),
      clear: () => {
        rowsStore.clear()
        selectionStore.clearSelection()
      },
      swapRows: () => rowsStore.swapRows(),
      deleteRow: (id: number) => {
        rowsStore.deleteRow(id)
        if (selectionStore.isSelected(id)) {
          selectionStore.clearSelection()
        }
      },
      selectRow: (id: number) => selectionStore.selectRow(id),
      sortRowsAsc: () => rowsStore.sortRowsAsc(),
      sortRowsDesc: () => rowsStore.sortRowsDesc(),
    }
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
    console.log('Controls re-rendered')
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
                rowsStore.create1000Rows()
                selectionStore.clearSelection()
              },
            }),
            SmallpadButton({
              key: 'runlots',
              id: 'runlots',
              label: 'Create 10,000 rows',
              onClick: () => {
                rowsStore.create10000Rows()
                selectionStore.clearSelection()
              },
            }),
            SmallpadButton({
              key: 'add',
              id: 'add',
              label: 'Append 1,000 rows',
              onClick: () => rowsStore.append1000Rows(),
            }),
            SmallpadButton({
              key: 'update',
              id: 'update',
              label: 'Update every 10th row',
              onClick: () => rowsStore.updateEvery10thRow(),
            }),
            SmallpadButton({
              key: 'clear',
              id: 'clear',
              label: 'Clear',
              onClick: () => {
                rowsStore.clear()
                selectionStore.clearSelection()
              },
            }),
            SmallpadButton({
              key: 'swaprows',
              id: 'swaprows',
              label: 'Swap Rows',
              onClick: () => rowsStore.swapRows(),
            }),
            SmallpadButton({
              key: 'sortasc',
              id: 'sortasc',
              label: 'Sort Asc',
              onClick: () => rowsStore.sortRowsAsc(),
            }),
            SmallpadButton({
              key: 'sortdesc',
              id: 'sortdesc',
              label: 'Sort Desc',
              onClick: () => rowsStore.sortRowsDesc(),
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
