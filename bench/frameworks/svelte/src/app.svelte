<script>
  import {
    get10000Rows,
    get1000Rows,
    remove,
    sortRows,
    swapRows as swapRowsData,
    updatedEvery10thRow,
  } from '../../shared.js'

  let data = $state.raw([])
  let selected = $state.raw(null)

  const add = () => (data = [...data, ...get1000Rows()]),
    clear = () => {
      data = []
      selected = null
    },
    partialUpdate = () => {
      data = updatedEvery10thRow(data)
    },
    removeRow = (id) => {
      data = remove(data, id)
      if (selected === id) selected = null
    },
    run = () => {
      data = get1000Rows()
      selected = null
    },
    runLots = () => {
      data = get10000Rows()
      selected = null
    },
    swapRows = () => {
      data = swapRowsData(data)
    },
    sortAsc = () => {
      data = sortRows(data, true)
    },
    sortDesc = () => {
      data = sortRows(data, false)
    }
</script>

<div class="container">
  <div class="bench-header jumbo-hero mb-3">
    <div class="row align-items-center g-0">
      <div class="col-lg-6">
        <h1 class="bench-title mb-0">Svelte</h1>
      </div>
      <div class="col-lg-6">
        <div class="row g-2 bench-actions" id="app-actions">
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
            <button type="button" class="btn btn-primary w-100" id="update" onclick={partialUpdate}>
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
        </div>
      </div>
    </div>
  </div>
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
  <span class="preloadicon btn-close" aria-hidden="true"></span>
</div>
