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
  type PokeBox,
  type Row,
} from '@/bench/core'
import {
  a,
  button,
  component,
  div,
  h1,
  renderKeyedChildren,
  span,
  table,
  tbody,
  td,
  tr,
  type ComponentRef,
  type DomRef,
  type Handle,
  type HtmlProps,
} from 'vani-local'

export const name = 'vani'

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

const ViewToggle = component<{ currentView: View }>(({ currentView }) => {
  return () =>
    div(
      { className: 'bench-view-toggle', id: 'view-toggle' },
      button(
        {
          type: 'button',
          className: {
            'bench-view-button': true,
            'bench-view-button-active': currentView === 'datatable',
          },
          ariaPressed: currentView === 'datatable' ? 'true' : 'false',
          ariaLabel: 'View data table',
          title: 'View data table',
          onclick: () => navigateToView('datatable'),
        },
        listIcon,
      ),
      button(
        {
          type: 'button',
          className: {
            'bench-view-button': true,
            'bench-view-button-active': currentView === 'pokeboxes',
          },
          ariaPressed: currentView === 'pokeboxes' ? 'true' : 'false',
          ariaLabel: 'View pokeboxes',
          title: 'View pokeboxes',
          onclick: () => navigateToView('pokeboxes'),
        },
        gridIcon,
      ),
    )
})

type HeaderAction = {
  id: string
  label: string
  onClick: () => void
}

const ActionButton = component(
  ({ id, label, onClick }: { id: string; label: string; onClick: () => void }) =>
    () =>
      button(
        {
          type: 'button',
          className: 'bench-button bench-button-primary w-full',
          id,
          onclick: onClick,
        },
        label,
      ),
)

const Header = component(
  ({
    title,
    currentView,
    actions,
  }: {
    title: string
    currentView: View
    actions: HeaderAction[]
  }) =>
    () =>
      div(
        { className: 'bench-hero bench-section' },
        div(
          { className: 'bench-grid-2' },
          div(
            { className: 'relative' },
            ViewToggle({ currentView }),
            h1({ className: 'bench-title' }, title),
          ),
          div(
            {},
            div(
              { className: 'bench-actions', id: 'app-actions' },
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
      ),
)
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
        className: { 'bench-data-row': true, 'bench-data-active': selectedId === props.id },
      },
      td({ className: 'bench-data-cell bench-data-id' }, String(props.id)),
      td(
        { className: 'bench-data-cell' },
        a(
          {
            className: 'bench-data-link',
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
        { className: 'bench-data-cell' },
        button({
          type: 'button',
          className: 'bench-data-remove',
          ariaLabel: 'Remove',
          onclick: (e: MouseEvent) => {
            e.preventDefault()
            removeRow(props.id)
          },
        }),
      ),
      td({ className: 'bench-data-cell' }),
    )
})

const DataTable = component((_, handle: Handle) => {
  handle.onBeforeMount(() => {
    queueMicrotask(renderRows)
  })

  return () => table({ className: 'bench-data-table' }, tbody({ id: 'tbody', ref: tbodyRef }))
})

const datatableActions: HeaderAction[] = [
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

const DataTableApp = component(
  () => () =>
    div(
      { className: 'bench-container' },
      Header({ title: 'Vani', currentView: 'datatable', actions: datatableActions }),
      DataTable(),
      span({ className: 'bench-preload-icon bench-data-remove', ariaHidden: 'true' }),
    ),
)

type BoxEntry = {
  id: number
  box: PokeBox
}

const pokeboxGridRef: DomRef<HTMLDivElement> = { current: null }
let pokeboxes: BoxEntry[] = []
let nextPkmIndex = 0

const renderBoxes = () => {
  if (!pokeboxGridRef.current) return
  renderKeyedChildren(
    pokeboxGridRef.current,
    pokeboxes.map((entry, boxIndex) =>
      BoxCard({
        key: entry.id,
        entry,
        boxIndex,
      }),
    ),
  )
}

const setBoxes = (nextBoxes: BoxEntry[]) => {
  pokeboxes = nextBoxes
  renderBoxes()
}

const updateBoxCells = (nextBoxes: PokeBox[]) => {
  setBoxes(
    pokeboxes.map((entry, index) => ({
      ...entry,
      box: nextBoxes[index] ?? entry.box,
    })),
  )
}

const toggleCell = (boxIndex: number, cellIndex: number) => {
  const entry = pokeboxes[boxIndex]
  if (!entry) return
  const box = entry.box
  if (!box) return
  const cell = box.cells[cellIndex]
  if (!cell) return
  const nextBoxes = pokeboxes.map((currentBox, index) => {
    if (index !== boxIndex) return currentBox
    const cells = currentBox.box.cells.slice()
    cells[cellIndex] = { ...cell, caught: !cell.caught }
    return { ...currentBox, box: { id: currentBox.box.id, cells } }
  })
  setBoxes(nextBoxes)
}

const removeBox = (boxId: number) => {
  setBoxes(pokeboxes.filter((entry) => entry.id !== boxId))
}

const BoxCard = component<{ boxIndex: number; entry: BoxEntry }>((props) => {
  return () =>
    div(
      { className: 'bench-pokebox-card', 'data-box-index': String(props.boxIndex) },
      div(
        { className: 'bench-pokebox-header' },
        span({ className: 'bench-pokebox-title' }, `Box ${props.entry.id}`),
        button({
          type: 'button',
          className: 'bench-pokebox-remove',
          ariaLabel: `Remove Box ${props.entry.id}`,
          'data-box-index': String(props.boxIndex),
          'data-box-id': String(props.entry.id),
          onclick: () => removeBox(props.entry.id),
        }),
      ),
      div(
        { className: 'bench-pokebox-cells' },
        ...props.entry.box.cells.map((cell, cellIndex) => {
          const attrs: HtmlProps<'button'> = {
            type: 'button',
            className: 'bench-pokebox-cell',
            'data-box-index': String(props.boxIndex),
            'data-cell-index': String(cellIndex),
            ariaLabel: cell ? `Pokemon ${cell.pkm.name}` : `Empty cell ${cellIndex + 1}`,
            onclick: (event: MouseEvent) => {
              event.preventDefault()
              if (!cell) return
              toggleCell(props.boxIndex, cellIndex)
            },
          }
          if (cell?.caught) {
            attrs['data-caught'] = 'true'
          }
          if (!cell) {
            attrs['data-empty'] = 'true'
          }
          return button(
            attrs,
            cell
              ? span({ className: `pkm-img pkm-img-${cell.pkm.nid}`, ariaHidden: 'true' })
              : null,
            cell?.caught
              ? span({ className: 'pokeball pokeball-sm pokebox-caught-badge', ariaHidden: 'true' })
              : null,
          )
        }),
      ),
    )
})

const PokeboxGrid = component((_, handle: Handle) => {
  handle.onBeforeMount(() => {
    queueMicrotask(renderBoxes)
  })

  return () => div({ className: 'bench-pokebox-grid', id: 'pokebox-grid', ref: pokeboxGridRef })
})

const pokeboxActions: HeaderAction[] = [
  {
    id: 'append40',
    label: 'Append 40 boxes',
    onClick: () => {
      const result = appendBoxes(
        pokeboxes.map((entry) => entry.box),
        40,
        nextPkmIndex,
      )
      nextPkmIndex = result.nextIndex
      const newEntries = result.boxes.slice(pokeboxes.length).map((box) => ({
        id: box.id,
        box,
      }))
      setBoxes([...pokeboxes, ...newEntries])
    },
  },
  {
    id: 'prepend40',
    label: 'Prepend 40 boxes',
    onClick: () => {
      const result = prependBoxes(
        pokeboxes.map((entry) => entry.box),
        40,
        nextPkmIndex,
      )
      nextPkmIndex = result.nextIndex
      const newEntries = result.boxes.slice(0, 40).map((box) => ({
        id: box.id,
        box,
      }))
      setBoxes([...newEntries, ...pokeboxes])
    },
  },
  {
    id: 'remove3rdbox',
    label: 'Remove every 3rd box',
    onClick: () => {
      const entriesByBox = new Map(pokeboxes.map((entry) => [entry.box, entry]))
      const nextBoxes = removeEveryNthBox(
        pokeboxes.map((entry) => entry.box),
        3,
      )
      const nextEntries = nextBoxes
        .map((box) => entriesByBox.get(box))
        .filter((entry): entry is BoxEntry => Boolean(entry))
      setBoxes(nextEntries)
    },
  },
  {
    id: 'swapboxsets',
    label: 'Swap box sets',
    onClick: () => {
      const entriesByBox = new Map(pokeboxes.map((entry) => [entry.box, entry]))
      const nextBoxes = swapBoxSets(
        pokeboxes.map((entry) => entry.box),
        3,
      )
      const nextEntries = nextBoxes
        .map((box) => entriesByBox.get(box))
        .filter((entry): entry is BoxEntry => Boolean(entry))
      setBoxes(nextEntries)
    },
  },
  {
    id: 'replacefirst6',
    label: 'Replace first 6 boxes',
    onClick: () => {
      const result = replaceFirstBoxes(
        pokeboxes.map((entry) => entry.box),
        6,
        nextPkmIndex,
      )
      nextPkmIndex = result.nextIndex
      const nextEntries = pokeboxes.map((entry, index) => {
        const nextBox = result.boxes[index]
        if (!nextBox) return entry
        return { ...entry, id: nextBox.id, box: nextBox }
      })
      setBoxes(nextEntries)
    },
  },
  {
    id: 'removeforms',
    label: 'Remove form variants',
    onClick: () => updateBoxCells(removeFormCells(pokeboxes.map((entry) => entry.box))),
  },
  {
    id: 'toggleall',
    label: 'Toggle all as caught',
    onClick: () => updateBoxCells(toggleAllCaught(pokeboxes.map((entry) => entry.box))),
  },
  {
    id: 'toggle3rd',
    label: 'Toggle every 3rd cell',
    onClick: () =>
      updateBoxCells(
        toggleEveryNthCaught(
          pokeboxes.map((entry) => entry.box),
          3,
        ),
      ),
  },
]

const PokeboxApp = component(
  () => () =>
    div(
      { className: 'bench-container' },
      Header({ title: 'Vani', currentView: 'pokeboxes', actions: pokeboxActions }),
      PokeboxGrid(),
      span({ className: 'bench-preload-icon bench-data-remove', ariaHidden: 'true' }),
    ),
)

const App = component(() => () => {
  const view = resolveView()
  return view === 'pokeboxes' ? PokeboxApp() : DataTableApp()
})

export default App
