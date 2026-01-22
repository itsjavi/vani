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

<div id="app" class="container">
  <div class="jumbotron">
    <div class="row">
      <div class="col-md-6">
        <h1>Svelte (with runes)</h1>
      </div>
      <div class="col-md-6">
        <div class="row">
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="run" onclick={run}>
              Create 1,000 rows
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="runlots" onclick={runLots}>
              Create 10,000 rows
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="add" onclick={add}>
              Append 1,000 rows
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button
              type="button"
              class="btn btn-primary btn-block"
              id="update"
              onclick={partialUpdate}
            >
              Update every 10th row
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="clear" onclick={clear}>
              Clear
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button
              type="button"
              class="btn btn-primary btn-block"
              id="swaprows"
              onclick={swapRows}
            >
              Swap Rows
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="sortasc" onclick={sortAsc}>
              Sort Ascending
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button
              type="button"
              class="btn btn-primary btn-block"
              id="sortdesc"
              onclick={sortDesc}
            >
              Sort Descending
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <table class="table table-hover table-striped test-data">
    <tbody>
      {#each data as row (row.id)}
        <tr class={selected === row.id ? 'danger' : ''}>
          <td class="col-md-1">{row.id}</td>
          <td class="col-md-4">
            <a
              href="#/"
              onclick={(event) => {
                event.preventDefault()
                selected = row.id
              }}
            >
              {row.label}
            </a>
          </td>
          <td class="col-md-1">
            <a
              href="#/"
              onclick={(event) => {
                event.preventDefault()
                removeRow(row.id)
              }}
              aria-label="Remove"
            >
              <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
            </a>
          </td>
          <td class="col-md-6"></td>
        </tr>
      {/each}
    </tbody>
  </table>
  <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</div>
