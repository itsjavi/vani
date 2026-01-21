import { a, button, component, div, h1, span, table, tbody, td, tr, type Handle } from '../../vani'
import { buildData, type RowItem } from './build-dummy-data'

interface BenchmarkActions {
  create1000Rows: () => void
  create10000Rows: () => void
  append1000Rows: () => void
  updateEvery10thRow: () => void
  clear: () => void
  swapRows: () => void
  deleteRow: (id: number) => void
  selectRow: (id: number) => void
}

// Selection store - separate from rows to avoid full table re-renders
class SelectionStore {
  selectedRowId: number | null = null
  private updateHandles: Map<number, Handle> = new Map()

  subscribe(rowId: number, handle: Handle) {
    this.updateHandles.set(rowId, handle)
    return () => {
      this.updateHandles.delete(rowId)
    }
  }

  selectRow(id: number) {
    const prevId = this.selectedRowId
    this.selectedRowId = id

    // Only update the affected rows (previously selected and newly selected)
    if (prevId !== null && prevId !== id) {
      const prevHandle = this.updateHandles.get(prevId)
      if (prevHandle) prevHandle.update()
    }
    if (id !== null) {
      const newHandle = this.updateHandles.get(id)
      if (newHandle) newHandle.update()
    }
  }

  clearSelection() {
    const prevId = this.selectedRowId
    this.selectedRowId = null
    if (prevId !== null) {
      const handle = this.updateHandles.get(prevId)
      if (handle) handle.update()
    }
  }

  isSelected(rowId: number): boolean {
    return this.selectedRowId === rowId
  }
}

// Rows store - manages the rows array
class RowsStore {
  rows: RowItem[] = []
  private updateHandles: Set<Handle> = new Set()

  subscribe(handle: Handle) {
    this.updateHandles.add(handle)
    return () => {
      this.updateHandles.delete(handle)
    }
  }

  private notify() {
    this.updateHandles.forEach((handle) => handle.update())
  }

  create1000Rows() {
    this.rows = buildData(1000)
    this.notify()
  }

  create10000Rows() {
    this.rows = buildData(10000)
    this.notify()
  }

  append1000Rows() {
    this.rows = [...this.rows, ...buildData(1000)]
    this.notify()
  }

  updateEvery10thRow() {
    this.rows = this.rows.map((row, index) => {
      // Update every 10th row starting from the first (indices 0, 10, 20, 30, ...)
      if (index % 10 === 0) {
        return { ...row, label: row.label + ' !!!' }
      }
      return row
    })
    this.notify()
  }

  clear() {
    this.rows = []
    this.notify()
  }

  swapRows() {
    if (this.rows.length >= 999) {
      const newRows = [...this.rows]
      ;[newRows[1], newRows[998]] = [newRows[998], newRows[1]]
      this.rows = newRows
      this.notify()
    }
  }

  deleteRow(id: number) {
    this.rows = this.rows.filter((r) => r.id !== id)
    this.notify()
  }

  getRows(): RowItem[] {
    return this.rows
  }
}

// Global store instances
const rowsStore = new RowsStore()
const selectionStore = new SelectionStore()

// Row component - keyed for efficient updates
// Each row subscribes to selection changes individually to avoid full table re-renders
const TableRow = component<{
  item: RowItem
  onSelect: () => void
  onDelete: () => void
}>((props, handle) => {
  // Subscribe to selection changes for this specific row
  handle.effect(() => {
    return selectionStore.subscribe(props.item.id, handle)
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
              props.onSelect()
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
              props.onDelete()
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
export const DataTable = component((_, handle: Handle) => {
  // Subscribe to rows updates only (not selection)
  handle.effect(() => {
    const unsubscribe = rowsStore.subscribe(handle)
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
    }
  })

  return () =>
    table(
      { className: 'table table-hover table-striped test-data' },
      tbody(
        { id: 'tbody' },
        ...rowsStore.getRows().map((item) =>
          TableRow({
            key: item.id,
            item,
            onSelect: () => selectionStore.selectRow(item.id),
            onDelete: () => {
              rowsStore.deleteRow(item.id)
              if (selectionStore.isSelected(item.id)) {
                selectionStore.clearSelection()
              }
            },
          }),
        ),
      ),
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

export const Controls = component(() => {
  return () => {
    console.log('Controls re-rendered')
    return div(
      { className: 'jumbotron' },
      div(
        { className: 'row' },
        div({ className: 'col-md-6' }, h1('vani-"keyed"')),
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
          ),
        ),
      ),
    )
  }
})

export const containerChildren = [
  Controls(),
  DataTable(),
  () => span({ className: '', ariaHidden: 'true' }, '❌'),
]
