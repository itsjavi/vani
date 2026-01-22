import {
  get10000Rows,
  get1000Rows,
  remove,
  sortRows,
  swapRows,
  updatedEvery10thRow,
} from '../shared.js'

const tbody = document.querySelector('#tbody')
const template = document.querySelector('template')

let rows = []
let selectedId = null

const rowTemplate = template.content.firstElementChild
// Keep direct element references to avoid repeated DOM queries.
let rowById = new Map()
let labelById = new Map()
let selectedRowEl = null

const createRow = (row) => {
  const cloned = rowTemplate.cloneNode(true)
  cloned.dataset.id = String(row.id)
  cloned.firstElementChild.textContent = String(row.id)
  const labelEl = cloned.querySelector('a.lbl')
  labelEl.textContent = row.label
  rowById.set(row.id, cloned)
  labelById.set(row.id, labelEl)
  if (selectedId === row.id) cloned.classList.add('table-active')
  return cloned
}

const renderRows = () => {
  rowById.clear()
  labelById.clear()
  const fragment = document.createDocumentFragment()
  for (const row of rows) {
    fragment.appendChild(createRow(row))
  }
  // replaceChildren avoids an extra clear pass and reduces layout churn.
  tbody.replaceChildren(fragment)
  selectedRowEl = selectedId === null ? null : (rowById.get(selectedId) ?? null)
}

const appendRows = (newRows) => {
  const fragment = document.createDocumentFragment()
  for (const row of newRows) {
    fragment.appendChild(createRow(row))
  }
  tbody.appendChild(fragment)
}

const updateSelectedRow = (nextSelectedId) => {
  if (selectedRowEl) {
    selectedRowEl.classList.remove('table-active')
  }
  selectedId = nextSelectedId
  selectedRowEl = selectedId === null ? null : (rowById.get(selectedId) ?? null)
  if (selectedRowEl) selectedRowEl.classList.add('table-active')
}

const app = {
  run() {
    rows = get1000Rows()
    selectedId = null
    renderRows()
  },
  runlots() {
    rows = get10000Rows()
    selectedId = null
    renderRows()
  },
  add() {
    const newRows = get1000Rows()
    rows = [...rows, ...newRows]
    appendRows(newRows)
  },
  update() {
    rows = updatedEvery10thRow(rows)
    for (let i = 0; i < rows.length; i += 10) {
      const row = rows[i]
      const label = labelById.get(row.id)
      if (label) label.textContent = row.label
    }
  },
  clear() {
    rows = []
    selectedId = null
    selectedRowEl = null
    rowById.clear()
    labelById.clear()
    tbody.replaceChildren()
  },
  swaprows() {
    rows = swapRows(rows)
    renderRows()
  },
  sortasc() {
    rows = sortRows(rows, true)
    renderRows()
  },
  sortdesc() {
    rows = sortRows(rows, false)
    renderRows()
  },
}

tbody.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return

  const rowElement = target.closest('tr')
  if (!rowElement) return

  if (target.closest('.lbl')) {
    event.preventDefault()
    const id = Number(rowElement.dataset.id)
    updateSelectedRow(selectedId === id ? null : id)
    return
  }

  if (target.closest('.remove')) {
    event.preventDefault()
    const id = Number(rowElement.dataset.id)
    rows = remove(rows, id)
    rowElement.remove()
    rowById.delete(id)
    labelById.delete(id)
    if (selectedId === id) {
      selectedId = null
      selectedRowEl = null
    }
  }
})

document.querySelector('#app-actions').addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return

  const button = target.closest('button')
  if (!button || !button.id) return

  event.preventDefault()
  if (app[button.id]) app[button.id]()
})
