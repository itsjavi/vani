import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Row } from '../shared'
import {
  get10000Rows,
  get1000Rows,
  remove,
  sortRows,
  swapRows,
  updatedEvery10thRow,
} from '../shared'
// import { flushSync } from 'react-dom'

export const name = 'react'

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
    <div className="container">
      <div className="jumbotron">
        <div className="row">
          <div className="col-md-6">
            <h1>React</h1>
          </div>
          <div className="col-md-6">
            <div className="row">
              <div className="col-sm-6 smallpad">
                <button id="run" className="btn btn-primary btn-block" type="button" onClick={run}>
                  Create 1,000 rows
                </button>
              </div>
              <div className="col-sm-6 smallpad">
                <button
                  id="runlots"
                  className="btn btn-primary btn-block"
                  type="button"
                  onClick={runLots}
                >
                  Create 10,000 rows
                </button>
              </div>
              <div className="col-sm-6 smallpad">
                <button id="add" className="btn btn-primary btn-block" type="button" onClick={add}>
                  Append 1,000 rows
                </button>
              </div>
              <div className="col-sm-6 smallpad">
                <button
                  id="update"
                  className="btn btn-primary btn-block"
                  type="button"
                  onClick={update}
                >
                  Update every 10th row
                </button>
              </div>
              <div className="col-sm-6 smallpad">
                <button
                  id="clear"
                  className="btn btn-primary btn-block"
                  type="button"
                  onClick={clear}
                >
                  Clear
                </button>
              </div>
              <div className="col-sm-6 smallpad">
                <button
                  id="swaprows"
                  className="btn btn-primary btn-block"
                  type="button"
                  onClick={swap}
                >
                  Swap Rows
                </button>
              </div>
              <div className="col-sm-6 smallpad">
                <button
                  id="sortasc"
                  className="btn btn-primary btn-block"
                  type="button"
                  onClick={sortAsc}
                >
                  Sort Ascending
                </button>
              </div>
              <div className="col-sm-6 smallpad">
                <button
                  id="sortdesc"
                  className="btn btn-primary btn-block"
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
      <table className="table-hover table-striped test-data table">
        <tbody>
          {rows.map((row) => {
            let rowId = row.id
            return (
              <tr key={rowId} className={selected === rowId ? 'danger' : ''}>
                <td className="col-md-1">{rowId}</td>
                <td className="col-md-4">
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
                <td className="col-md-1">
                  <a
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      removeRow(rowId)
                    }}
                  >
                    <span className="glyphicon glyphicon-remove" aria-hidden="true" />
                  </a>
                </td>
                <td className="col-md-6" />
              </tr>
            )
          })}
        </tbody>
      </table>
      <span className="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
    </div>
  )
}

let el = document.getElementById('app')!
let root = createRoot(el)
root.render(<App />)
