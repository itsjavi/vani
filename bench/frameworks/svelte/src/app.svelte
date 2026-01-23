<script>
  import {
    appendBoxes,
    cn,
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
  } from '../../shared.js'

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

<div class="container">
  <div class="bench-header jumbo-hero mb-3">
    <div class="row align-items-center g-0">
      <div class="col-lg-6">
        <div class="bench-view-toggle" id="view-toggle">
          <button
            type="button"
            class={cn('bench-view-btn', { 'is-active': view === 'datatable' })}
            aria-pressed={view === 'datatable'}
            aria-label="View data table"
            title="View data table"
            onclick={() => navigateToView('datatable')}
          >
            {listIcon}
          </button>
          <button
            type="button"
            class={cn('bench-view-btn', { 'is-active': view === 'pokeboxes' })}
            aria-pressed={view === 'pokeboxes'}
            aria-label="View pokeboxes"
            title="View pokeboxes"
            onclick={() => navigateToView('pokeboxes')}
          >
            {gridIcon}
          </button>
        </div>
        <h1 class="bench-title mb-0">Svelte</h1>
      </div>
      <div class="col-lg-6">
        <div class="row g-2 bench-actions" id="app-actions">
          {#if view === 'pokeboxes'}
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="append40" onclick={append40}>
                Append 40 boxes
              </button>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-primary w-100"
                id="prepend40"
                onclick={prepend40}
              >
                Prepend 40 boxes
              </button>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-primary w-100"
                id="remove3rdbox"
                onclick={remove3rdBox}
              >
                Remove every 3rd box
              </button>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-primary w-100"
                id="swapboxsets"
                onclick={swapBoxSetsAction}
              >
                Swap box sets
              </button>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-primary w-100"
                id="replacefirst6"
                onclick={replaceFirst6}
              >
                Replace first 6 boxes
              </button>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-primary w-100"
                id="removeforms"
                onclick={removeForms}
              >
                Remove form variants
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="toggleall" onclick={markAll}>
                Toggle all as caught
              </button>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-primary w-100"
                id="toggle3rd"
                onclick={toggle3rd}
              >
                Toggle every 3rd cell
              </button>
            </div>
          {:else}
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="run" onclick={run}>
                Create 1,000 rows
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="runlots" onclick={runLots}>
                Create 10,000 rows
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="add" onclick={add}>
                Append 1,000 rows
              </button>
            </div>
            <div class="col-6">
              <button
                type="button"
                class="btn btn-primary w-100"
                id="update"
                onclick={partialUpdate}
              >
                Update every 10th row
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="clear" onclick={clear}>
                Clear
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="swaprows" onclick={swapRows}>
                Swap Rows
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="sortasc" onclick={sortAsc}>
                Sort Ascending
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="sortdesc" onclick={sortDesc}>
                Sort Descending
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
  {#if view === 'pokeboxes'}
    <div class="pokebox-grid" id="pokebox-grid">
      {#each boxes as box, boxIndex}
        <div class="pokebox-card" data-box-index={boxIndex}>
          <div class="pokebox-header">
            <span class="pokebox-title">Box {box.id}</span>
            <button
              type="button"
              class="btn-close pokebox-remove"
              aria-label={`Remove Box ${box.id}`}
              data-box-index={boxIndex}
              onclick={(event) => {
                event.preventDefault()
                removeBox(boxIndex)
              }}
            ></button>
          </div>
          <div class="pokebox-cells">
            {#each box.cells as cell, cellIndex}
              <button
                type="button"
                class="pokebox-cell"
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
                {/if}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <table class="table-hover table-striped test-data table align-middle">
      <tbody id="tbody">
        {#each data as row (row.id)}
          <tr class={selected === row.id ? 'table-active' : ''}>
            <td class="col-md-1">{row.id}</td>
            <td class="col-md-4">
              <a
                class="lbl"
                href="/"
                onclick={(event) => {
                  event.preventDefault()
                  selected = row.id
                }}
              >
                {row.label}
              </a>
            </td>
            <td class="col-md-1">
              <button
                class="btn-close remove"
                type="button"
                aria-label="Remove"
                onclick={(event) => {
                  event.preventDefault()
                  removeRow(row.id)
                }}
              ></button>
            </td>
            <td class="col-md-6"></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
  <span class="preloadicon btn-close" aria-hidden="true"></span>
</div>
