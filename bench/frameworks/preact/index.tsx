import { render } from 'preact'
import { useState } from 'preact/hooks'
import type { Row } from '../shared'
import {
  get10000Rows,
  get1000Rows,
  remove,
  sortRows,
  swapRows,
  updatedEvery10thRow,
} from '../shared'
// import { act } from 'preact/test-utils'

export const name = 'preact'

function App() {
  let [rows, setRows] = useState<Row[]>([])
  let [selected, setSelected] = useState<number | null>(null)

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

  return (
    <div class="container">
      <div class="jumbotron">
        <div class="row">
          <div class="col-md-6">
            <h1>Preact</h1>
          </div>
          <div class="col-md-6">
            <div class="row">
              <div class="col-sm-6 smallpad">
                <button id="run" class="btn btn-primary btn-block" type="button" onClick={run}>
                  Create 1,000 rows
                </button>
              </div>
              <div class="col-sm-6 smallpad">
                <button
                  id="runlots"
                  class="btn btn-primary btn-block"
                  type="button"
                  onClick={runLots}
                >
                  Create 10,000 rows
                </button>
              </div>
              <div class="col-sm-6 smallpad">
                <button id="add" class="btn btn-primary btn-block" type="button" onClick={add}>
                  Append 1,000 rows
                </button>
              </div>
              <div class="col-sm-6 smallpad">
                <button
                  id="update"
                  class="btn btn-primary btn-block"
                  type="button"
                  onClick={update}
                >
                  Update every 10th row
                </button>
              </div>
              <div class="col-sm-6 smallpad">
                <button id="clear" class="btn btn-primary btn-block" type="button" onClick={clear}>
                  Clear
                </button>
              </div>
              <div class="col-sm-6 smallpad">
                <button
                  id="swaprows"
                  class="btn btn-primary btn-block"
                  type="button"
                  onClick={swap}
                >
                  Swap Rows
                </button>
              </div>
              <div class="col-sm-6 smallpad">
                <button
                  id="sortasc"
                  class="btn btn-primary btn-block"
                  type="button"
                  onClick={sortAsc}
                >
                  Sort Ascending
                </button>
              </div>
              <div class="col-sm-6 smallpad">
                <button
                  id="sortdesc"
                  class="btn btn-primary btn-block"
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
      <table class="table-hover table-striped test-data table">
        <tbody>
          {rows.map((row) => {
            let rowId = row.id
            return (
              <tr key={rowId} class={selected === rowId ? 'danger' : ''}>
                <td class="col-md-1">{rowId}</td>
                <td class="col-md-4">
                  <a
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      setSelected(rowId)
                    }}
                  >
                    {row.label}
                  </a>
                </td>
                <td class="col-md-1">
                  <a
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      removeRow(rowId)
                    }}
                  >
                    <span class="glyphicon glyphicon-remove" aria-hidden="true" />
                  </a>
                </td>
                <td class="col-md-6" />
              </tr>
            )
          })}
        </tbody>
      </table>
      <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
    </div>
  )
}

let el = document.getElementById('app')!
render(<App />, el)
