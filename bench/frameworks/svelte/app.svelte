<script>
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
    swapRows as swapRowsData,
    toggleAllCaught,
    toggleEveryNthCaught,
    updatedEvery10thRow,
  } from '@/bench/core'
  import { cn } from '@/bench/lib/utils'

  const listIcon = '📊'
  const gridIcon = '📦'

  const resolveView = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('view') === 'pokeboxes' ? 'pokeboxes' : 'datatable'
  }

  const navigateToView = (nextView) => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', nextView)
    window.location.assign(url.toString())
  }

  let view = resolveView()
  let data = $state.raw([])
  let selected = $state.raw(null)
  let boxes = $state.raw([])
  let nextPkmIndex = 0

  const add = () => (data = [...data, ...get1000Rows()])
  const clear = () => {
    data = []
    selected = null
  }
  const partialUpdate = () => {
    data = updatedEvery10thRow(data)
  }
  const removeRow = (id) => {
    data = remove(data, id)
    if (selected === id) selected = null
  }
  const run = () => {
    data = get1000Rows()
    selected = null
  }
  const runLots = () => {
    data = get10000Rows()
    selected = null
  }
  const swapRows = () => {
    data = swapRowsData(data)
  }
  const sortAsc = () => {
    data = sortRows(data, true)
  }
  const sortDesc = () => {
    data = sortRows(data, false)
  }

  const append40 = () => {
    const result = appendBoxes(boxes, 40, nextPkmIndex)
    nextPkmIndex = result.nextIndex
    boxes = result.boxes
  }
  const prepend40 = () => {
    const result = prependBoxes(boxes, 40, nextPkmIndex)
    nextPkmIndex = result.nextIndex
    boxes = result.boxes
  }
  const remove3rdBox = () => {
    boxes = removeEveryNthBox(boxes, 3)
  }
  const swapBoxSetsAction = () => {
    boxes = swapBoxSets(boxes, 3)
  }
  const replaceFirst6 = () => {
    const result = replaceFirstBoxes(boxes, 6, nextPkmIndex)
    nextPkmIndex = result.nextIndex
    boxes = result.boxes
  }
  const removeForms = () => {
    boxes = removeFormCells(boxes)
  }
  const markAll = () => {
    boxes = toggleAllCaught(boxes)
  }
  const toggle3rd = () => {
    boxes = toggleEveryNthCaught(boxes, 3)
  }
  const removeBox = (boxIndex) => {
    boxes = boxes.filter((_, index) => index !== boxIndex)
  }
  const toggleCell = (boxIndex, cellIndex) => {
    const box = boxes[boxIndex]
    if (!box) return
    const cell = box.cells[cellIndex]
    if (!cell) return
    boxes = boxes.map((currentBox, index) => {
      if (index !== boxIndex) return currentBox
      const cells = currentBox.cells.slice()
      cells[cellIndex] = { ...cell, caught: !cell.caught }
      return { ...currentBox, cells }
    })
  }
</script>

<div class={cn('bench-container')}>
  <div class={cn('bench-hero', 'bench-section')}>
    <div class={cn('bench-grid-2')}>
      <div class={cn('relative')}>
        <div class={cn('bench-view-toggle')} id="view-toggle">
          <button
            type="button"
            class={cn('bench-view-button', { 'bench-view-button-active': view === 'datatable' })}
            aria-pressed={view === 'datatable'}
            aria-label="View data table"
            title="View data table"
            onclick={() => navigateToView('datatable')}
          >
            {listIcon}
          </button>
          <button
            type="button"
            class={cn('bench-view-button', { 'bench-view-button-active': view === 'pokeboxes' })}
            aria-pressed={view === 'pokeboxes'}
            aria-label="View pokeboxes"
            title="View pokeboxes"
            onclick={() => navigateToView('pokeboxes')}
          >
            {gridIcon}
          </button>
        </div>
        <h1 class={cn('bench-title')}>Svelte</h1>
      </div>
      <div>
        <div class={cn('bench-actions')} id="app-actions">
          {#if view === 'pokeboxes'}
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="append40"
              onclick={append40}
            >
              Append 40 boxes
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="prepend40"
              onclick={prepend40}
            >
              Prepend 40 boxes
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="remove3rdbox"
              onclick={remove3rdBox}
            >
              Remove every 3rd box
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="swapboxsets"
              onclick={swapBoxSetsAction}
            >
              Swap box sets
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="replacefirst6"
              onclick={replaceFirst6}
            >
              Replace first 6 boxes
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="removeforms"
              onclick={removeForms}
            >
              Remove form variants
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="toggleall"
              onclick={markAll}
            >
              Toggle all as caught
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="toggle3rd"
              onclick={toggle3rd}
            >
              Toggle every 3rd cell
            </button>
          {:else}
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="run"
              onclick={run}
            >
              Create 1,000 rows
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="runlots"
              onclick={runLots}
            >
              Create 10,000 rows
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="add"
              onclick={add}
            >
              Append 1,000 rows
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="update"
              onclick={partialUpdate}
            >
              Update every 10th row
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="clear"
              onclick={clear}
            >
              Clear
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="swaprows"
              onclick={swapRows}
            >
              Swap Rows
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="sortasc"
              onclick={sortAsc}
            >
              Sort Ascending
            </button>
            <button
              type="button"
              class={cn('bench-button', 'bench-button-primary', 'w-full')}
              id="sortdesc"
              onclick={sortDesc}
            >
              Sort Descending
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
  {#if view === 'pokeboxes'}
    <div class={cn('bench-pokebox-grid')} id="pokebox-grid">
      {#each boxes as box, boxIndex}
        <div class={cn('bench-pokebox-card')} data-box-index={boxIndex}>
          <div class={cn('bench-pokebox-header')}>
            <span class={cn('bench-pokebox-title')}>Box {box.id}</span>
            <button
              type="button"
              class={cn('bench-pokebox-remove')}
              aria-label={`Remove Box ${box.id}`}
              data-box-index={boxIndex}
              onclick={(event) => {
                event.preventDefault()
                removeBox(boxIndex)
              }}
            ></button>
          </div>
          <div class={cn('bench-pokebox-cells')}>
            {#each box.cells as cell, cellIndex}
              <button
                type="button"
                class={cn('bench-pokebox-cell')}
                data-box-index={boxIndex}
                data-cell-index={cellIndex}
                data-empty={!cell ? 'true' : undefined}
                data-caught={cell?.caught ? 'true' : undefined}
                aria-label={cell ? `Pokemon ${cell.pkm.name}` : `Empty cell ${cellIndex + 1}`}
                onclick={(event) => {
                  event.preventDefault()
                  toggleCell(boxIndex, cellIndex)
                }}
              >
                {#if cell}
                  <span class={`pkm-img pkm-img-${cell.pkm.nid}`} aria-hidden="true"></span>
                  {#if cell.caught}
                    <span class="pokeball pokeball-sm pokebox-caught-badge" aria-hidden="true"
                    ></span>
                  {/if}
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <table class={cn('bench-data-table')}>
      <tbody id="tbody">
        {#each data as row (row.id)}
          <tr class={cn('bench-data-row', { 'bench-data-active': selected === row.id })}>
            <td class={cn('bench-data-cell', 'bench-data-id')}>{row.id}</td>
            <td class={cn('bench-data-cell')}>
              <a
                class={cn('bench-data-link')}
                href="/"
                onclick={(event) => {
                  event.preventDefault()
                  selected = row.id
                }}
              >
                {row.label}
              </a>
            </td>
            <td class={cn('bench-data-cell')}>
              <button
                class={cn('bench-data-remove')}
                type="button"
                aria-label="Remove"
                onclick={(event) => {
                  event.preventDefault()
                  removeRow(row.id)
                }}
              ></button>
            </td>
            <td class={cn('bench-data-cell')}></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
  <span class={cn('bench-preload-icon', 'bench-data-remove')} aria-hidden="true"></span>
</div>
