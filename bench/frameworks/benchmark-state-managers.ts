import { buildData, type RowItem } from './benchmark-generators'

// Generic stores for managing the state of the benchmarks.

export interface BenchmarkActions {
  create1000Rows: () => void
  create10000Rows: () => void
  append1000Rows: () => void
  updateEvery10thRow: () => void
  clear: () => void
  swapRows: () => void
  deleteRow: (id: number) => void
  selectRow: (id: number) => void
  sortRowsAsc: () => void
  sortRowsDesc: () => void
}

// Selection store - separate from rows to avoid full table re-renders
export class SelectionStore<UpdateFn extends () => void> {
  selectedRowId: number | null = null
  private updateHandles: Map<number, UpdateFn> = new Map()

  subscribe(rowId: number, handle: UpdateFn) {
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
      if (prevHandle) prevHandle()
    }
    if (id !== null) {
      const newHandle = this.updateHandles.get(id)
      if (newHandle) newHandle()
    }
  }

  clearSelection() {
    const prevId = this.selectedRowId
    this.selectedRowId = null
    if (prevId !== null) {
      const handle = this.updateHandles.get(prevId)
      if (handle) handle()
    }
  }

  isSelected(rowId: number): boolean {
    return this.selectedRowId === rowId
  }
}

// Rows store - manages the rows array
export class RowsStore<UpdateFn extends () => void> {
  rows: RowItem[] = []
  private updateHandles: Set<UpdateFn> = new Set()

  subscribe(handle: UpdateFn) {
    this.updateHandles.add(handle)
    return () => {
      this.updateHandles.delete(handle)
    }
  }

  private notify() {
    this.updateHandles.forEach((handle) => handle())
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

  sortRowsAsc() {
    this.rows = [...this.rows].sort((a, b) => a.id - b.id)
    this.notify()
  }

  sortRowsDesc() {
    this.rows = [...this.rows].sort((a, b) => b.id - a.id)
    this.notify()
  }
}
