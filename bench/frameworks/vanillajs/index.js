import { get10000Rows, get1000Rows, remove, sortRows, swapRows, updatedEvery10thRow } from '../shared.js'

const tbody = document.querySelector('#tbody')
const template = document.querySelector('template')

let rows = []
let selectedId = null

const rowTemplate = template.content.firstElementChild

const createRow = (row) => {
  const cloned = rowTemplate.cloneNode(true)
  cloned.dataset.id = String(row.id)
  cloned.firstElementChild.textContent = String(row.id)
  cloned.querySelector('a.lbl').textContent = row.label
  if (selectedId === row.id) cloned.classList.add('danger')
  return cloned
}

const renderRows = () => {
  const fragment = document.createDocumentFragment()
  for (const row of rows) {
    fragment.appendChild(createRow(row))
  }
  tbody.textContent = ''
  tbody.appendChild(fragment)
}

const appendRows = (newRows) => {
  const fragment = document.createDocumentFragment()
  for (const row of newRows) {
    fragment.appendChild(createRow(row))
  }
  tbody.appendChild(fragment)
}

const updateSelectedRow = (nextSelectedId) => {
  if (selectedId !== null) {
    const prevRow = tbody.querySelector(`tr[data-id="${selectedId}"]`)
    if (prevRow) prevRow.classList.remove('danger')
  }
  selectedId = nextSelectedId
  if (selectedId !== null) {
    const nextRow = tbody.querySelector(`tr[data-id="${selectedId}"]`)
    if (nextRow) nextRow.classList.add('danger')
  }
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
      const rowEl = tbody.children[i]
      if (rowEl) {
        const label = rowEl.querySelector('a.lbl')
        if (label) label.textContent = rows[i].label
      }
    }
  },
  clear() {
    rows = []
    selectedId = null
    tbody.textContent = ''
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

  if (target.closest('a.lbl')) {
    event.preventDefault()
    const id = Number(rowElement.dataset.id)
    updateSelectedRow(selectedId === id ? null : id)
    return
  }

  if (target.closest('a.remove') || target.classList.contains('remove')) {
    event.preventDefault()
    const id = Number(rowElement.dataset.id)
    rows = remove(rows, id)
    rowElement.remove()
    if (selectedId === id) selectedId = null
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
