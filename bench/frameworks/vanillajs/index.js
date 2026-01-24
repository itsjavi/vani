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
} from '../shared.js'

const viewToggle = document.querySelector('#view-toggle')
const appActions = document.querySelector('#app-actions')
let table = document.querySelector('.test-data')
let pokeboxGrid = document.querySelector('#pokebox-grid')
const preloadIcon = document.querySelector('.preloadicon')

const listIcon = '📊'
const gridIcon = '📦'

const resolveView = () => {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')
  return view === 'pokeboxes' ? 'pokeboxes' : 'datatable'
}

const navigateToView = (nextView) => {
  const url = new URL(window.location.href)
  url.searchParams.set('view', nextView)
  window.location.assign(url.toString())
}

const renderViewToggle = (currentView) => {
  if (!viewToggle) return
  const buildButton = (view, icon, label) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `bench-view-btn${currentView === view ? ' is-active' : ''}`
    button.setAttribute('aria-pressed', currentView === view ? 'true' : 'false')
    button.setAttribute('aria-label', label)
    button.title = label
    button.textContent = icon
    button.addEventListener('click', () => navigateToView(view))
    return button
  }
  viewToggle.replaceChildren(
    buildButton('datatable', listIcon, 'View data table'),
    buildButton('pokeboxes', gridIcon, 'View pokeboxes'),
  )
}

const renderActions = (actions) => {
  if (!appActions) return
  appActions.replaceChildren()
  for (const action of actions) {
    const col = document.createElement('div')
    col.className = 'col-6'
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'btn btn-primary w-100'
    button.id = action.id
    button.textContent = action.label
    col.appendChild(button)
    appActions.appendChild(col)
  }
}

const initDataTableView = () => {
  if (!table) return
  table.hidden = false
  if (pokeboxGrid) {
    pokeboxGrid.remove()
    pokeboxGrid = null
  }

  const tbody = document.querySelector('#tbody')
  const template = document.querySelector('template')
  if (!tbody || !template) return

  let rows = []
  let selectedId = null

  const rowTemplate = template.content.firstElementChild
  if (!rowTemplate) return

  // Keep direct element references to avoid repeated DOM queries.
  let rowById = new Map()
  let labelById = new Map()
  let selectedRowEl = null

  const createRow = (row) => {
    const cloned = rowTemplate.cloneNode(true)
    cloned.dataset.id = String(row.id)
    const cells = cloned.children
    const idCell = cells[0]
    const labelEl = cells[1]?.firstElementChild
    if (idCell) idCell.textContent = String(row.id)
    if (!labelEl) {
      return cloned
    }
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
      rows.push(...newRows)
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
      if (rows.length <= 998) return
      const rowA = rows[1]
      const rowB = rows[998]
      rows = swapRows(rows)
      const elA = rowById.get(rowA.id)
      const elB = rowById.get(rowB.id)
      if (!elA || !elB) {
        renderRows()
        return
      }
      const nextA = elA.nextSibling
      tbody.insertBefore(elA, elB)
      tbody.insertBefore(elB, nextA)
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

  renderActions([
    { id: 'run', label: 'Create 1,000 rows' },
    { id: 'runlots', label: 'Create 10,000 rows' },
    { id: 'add', label: 'Append 1,000 rows' },
    { id: 'update', label: 'Update every 10th row' },
    { id: 'clear', label: 'Clear' },
    { id: 'swaprows', label: 'Swap Rows' },
    { id: 'sortasc', label: 'Sort Ascending' },
    { id: 'sortdesc', label: 'Sort Descending' },
  ])

  appActions?.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const button = target.closest('button')
    if (!button || !button.id) return

    event.preventDefault()
    if (app[button.id]) app[button.id]()
  })
}

const initPokeboxView = () => {
  if (table) {
    table.remove()
    table = null
  }
  if (!pokeboxGrid) {
    pokeboxGrid = document.createElement('div')
    pokeboxGrid.className = 'pokebox-grid'
    pokeboxGrid.id = 'pokebox-grid'
    if (preloadIcon?.parentElement) {
      preloadIcon.parentElement.insertBefore(pokeboxGrid, preloadIcon)
    }
  }
  if (!pokeboxGrid) return
  if (table) table.hidden = true
  pokeboxGrid.hidden = false

  let boxes = []
  let nextPkmIndex = 0

  const renderBoxes = () => {
    const fragment = document.createDocumentFragment()
    boxes.forEach((box, boxIndex) => {
      const card = document.createElement('div')
      card.className = 'pokebox-card'
      card.dataset.boxIndex = String(boxIndex)

      const header = document.createElement('div')
      header.className = 'pokebox-header'
      const title = document.createElement('span')
      title.className = 'pokebox-title'
      title.textContent = `Box ${box.id}`
      const removeButton = document.createElement('button')
      removeButton.type = 'button'
      removeButton.className = 'btn-close pokebox-remove'
      removeButton.setAttribute('aria-label', `Remove Box ${box.id}`)
      removeButton.dataset.boxIndex = String(boxIndex)
      header.append(title, removeButton)

      const cells = document.createElement('div')
      cells.className = 'pokebox-cells'
      box.cells.forEach((cell, cellIndex) => {
        const cellButton = document.createElement('button')
        cellButton.type = 'button'
        cellButton.className = 'pokebox-cell'
        cellButton.dataset.boxIndex = String(boxIndex)
        cellButton.dataset.cellIndex = String(cellIndex)
        if (!cell) {
          cellButton.dataset.empty = 'true'
          cellButton.setAttribute('aria-label', `Empty cell ${cellIndex + 1}`)
        } else {
          if (cell.caught) {
            cellButton.dataset.caught = 'true'
          }
          cellButton.dataset.pkm = cell.pkm.nid
          cellButton.setAttribute('aria-label', `Pokemon ${cell.pkm.name}`)
          const sprite = document.createElement('span')
          sprite.className = `pkm-img pkm-img-${cell.pkm.nid}`
          sprite.setAttribute('aria-hidden', 'true')
          cellButton.appendChild(sprite)
          if (cell.caught) {
            const badge = document.createElement('span')
            badge.className = 'pokeball pokeball-sm pokebox-caught-badge'
            badge.setAttribute('aria-hidden', 'true')
            cellButton.appendChild(badge)
          }
        }
        cells.appendChild(cellButton)
      })

      card.append(header, cells)
      fragment.appendChild(card)
    })
    pokeboxGrid.replaceChildren(fragment)
  }

  const app = {
    append40() {
      const result = appendBoxes(boxes, 40, nextPkmIndex)
      boxes = result.boxes
      nextPkmIndex = result.nextIndex
      renderBoxes()
    },
    prepend40() {
      const result = prependBoxes(boxes, 40, nextPkmIndex)
      boxes = result.boxes
      nextPkmIndex = result.nextIndex
      renderBoxes()
    },
    remove3rdbox() {
      boxes = removeEveryNthBox(boxes, 3)
      renderBoxes()
    },
    swapboxsets() {
      boxes = swapBoxSets(boxes, 3)
      renderBoxes()
    },
    replacefirst6() {
      const result = replaceFirstBoxes(boxes, 6, nextPkmIndex)
      boxes = result.boxes
      nextPkmIndex = result.nextIndex
      renderBoxes()
    },
    removeforms() {
      boxes = removeFormCells(boxes)
      renderBoxes()
    },
    toggleall() {
      boxes = toggleAllCaught(boxes)
      renderBoxes()
    },
    toggle3rd() {
      boxes = toggleEveryNthCaught(boxes, 3)
      renderBoxes()
    },
  }

  renderActions([
    { id: 'append40', label: 'Append 40 boxes' },
    { id: 'prepend40', label: 'Prepend 40 boxes' },
    { id: 'remove3rdbox', label: 'Remove every 3rd box' },
    { id: 'swapboxsets', label: 'Swap box sets' },
    { id: 'replacefirst6', label: 'Replace first 6 boxes' },
    { id: 'removeforms', label: 'Remove form variants' },
    { id: 'toggleall', label: 'Toggle all as caught' },
    { id: 'toggle3rd', label: 'Toggle every 3rd cell' },
  ])

  appActions?.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const button = target.closest('button')
    if (!button || !button.id) return

    event.preventDefault()
    if (app[button.id]) app[button.id]()
  })

  pokeboxGrid.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const removeButton = target.closest('.pokebox-remove')
    if (removeButton instanceof HTMLButtonElement) {
      event.preventDefault()
      const boxIndex = Number(removeButton.dataset.boxIndex)
      if (Number.isFinite(boxIndex)) {
        boxes.splice(boxIndex, 1)
        renderBoxes()
      }
      return
    }

    const cellButton = target.closest('.pokebox-cell')
    if (!(cellButton instanceof HTMLButtonElement)) return
    const boxIndex = Number(cellButton.dataset.boxIndex)
    const cellIndex = Number(cellButton.dataset.cellIndex)
    if (!Number.isFinite(boxIndex) || !Number.isFinite(cellIndex)) return
    const box = boxes[boxIndex]
    if (!box) return
    const cell = box.cells[cellIndex]
    if (!cell) return
    cell.caught = !cell.caught
    if (cell.caught) {
      cellButton.dataset.caught = 'true'
      if (!cellButton.querySelector('.pokebox-caught-badge')) {
        const badge = document.createElement('span')
        badge.className = 'pokeball pokeball-sm pokebox-caught-badge'
        badge.setAttribute('aria-hidden', 'true')
        cellButton.appendChild(badge)
      }
    } else {
      delete cellButton.dataset.caught
      cellButton.querySelector('.pokebox-caught-badge')?.remove()
    }
  })
}

const view = resolveView()
renderViewToggle(view)
if (view === 'pokeboxes') {
  initPokeboxView()
} else {
  initDataTableView()
}
