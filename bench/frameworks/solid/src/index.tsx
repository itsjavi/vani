import { createSelector, createSignal, For } from 'solid-js'
import { render } from 'solid-js/web'
import {
  get10000Rows,
  get1000Rows,
  remove,
  sortRows,
  swapRows,
  updatedEvery10thRow,
  type Row,
} from '../../shared'

export const name = 'solid'

function App() {
  let [rows, setRows] = createSignal<Row[]>([])
  let [selected, setSelected] = createSignal<number | null>(null)

  let run = () => {
    setRows(get1000Rows())
    setSelected(null)
  }

  let runLots = () => {
    setRows(get10000Rows())
    setSelected(null)
  }

  let add = () => {
    setRows((current) => [...current, ...get1000Rows()])
  }

  let update = () => {
    setRows((current) => updatedEvery10thRow(current))
  }

  let clear = () => {
    setRows([])
    setSelected(null)
  }

  let swap = () => {
    setRows((current) => swapRows(current))
  }

  let removeRow = (id: number) => {
    setRows((current) => remove(current, id))
  }

  let sortAsc = () => {
    setRows((current) => sortRows(current, true))
  }

  let sortDesc = () => {
    setRows((current) => sortRows(current, false))
  }

  let isSelected = createSelector(selected)

  return (
    <div class="container">
      <div class="bench-header jumbo-hero mb-3">
        <div class="row align-items-center g-0">
          <div class="col-lg-6">
            <h1 class="bench-title mb-0">SolidJS</h1>
          </div>
          <div class="col-lg-6">
            <div class="row g-2 bench-actions" id="app-actions">
              <div class="col-6">
                <button id="run" class="btn btn-primary w-100" type="button" onClick={run}>
                  Create 1,000 rows
                </button>
              </div>
              <div class="col-6">
                <button id="runlots" class="btn btn-primary w-100" type="button" onClick={runLots}>
                  Create 10,000 rows
                </button>
              </div>
              <div class="col-6">
                <button id="add" class="btn btn-primary w-100" type="button" onClick={add}>
                  Append 1,000 rows
                </button>
              </div>
              <div class="col-6">
                <button id="update" class="btn btn-primary w-100" type="button" onClick={update}>
                  Update every 10th row
                </button>
              </div>
              <div class="col-6">
                <button id="clear" class="btn btn-primary w-100" type="button" onClick={clear}>
                  Clear
                </button>
              </div>
              <div class="col-6">
                <button id="swaprows" class="btn btn-primary w-100" type="button" onClick={swap}>
                  Swap Rows
                </button>
              </div>
              <div class="col-6">
                <button id="sortasc" class="btn btn-primary w-100" type="button" onClick={sortAsc}>
                  Sort Ascending
                </button>
              </div>
              <div class="col-6">
                <button
                  id="sortdesc"
                  class="btn btn-primary w-100"
                  type="button"
                  onClick={sortDesc}
                >
                  Sort Descending
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <table class="table-hover table-striped test-data table align-middle">
        <tbody id="tbody">
          <For each={rows()}>
            {(row) => {
              let rowId = row.id
              return (
                <tr class={isSelected(rowId) ? 'table-active' : ''}>
                  <td class="col-md-1">{rowId}</td>
                  <td class="col-md-4">
                    <a
                      class="lbl"
                      href="/"
                      onClick={(event) => {
                        event.preventDefault()
                        setSelected(rowId)
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
                      onClick={(event) => {
                        event.preventDefault()
                        removeRow(rowId)
                      }}
                    />
                  </td>
                  <td class="col-md-6" />
                </tr>
              )
            }}
          </For>
        </tbody>
      </table>
      <span class="preloadicon btn-close" aria-hidden="true" />
    </div>
  )
}

let el = document.getElementById('main')!
render(App, el)
