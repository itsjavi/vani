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
      <div className="bench-header jumbo-hero mb-3">
        <div className="row align-items-center g-0">
          <div className="col-lg-6">
            <h1 className="bench-title mb-0">React</h1>
          </div>
          <div className="col-lg-6">
            <div className="row g-2 bench-actions" id="app-actions">
              <div className="col-6">
                <button id="run" className="btn btn-primary w-100" type="button" onClick={run}>
                  Create 1,000 rows
                </button>
              </div>
              <div className="col-6">
                <button
                  id="runlots"
                  className="btn btn-primary w-100"
                  type="button"
                  onClick={runLots}
                >
                  Create 10,000 rows
                </button>
              </div>
              <div className="col-6">
                <button id="add" className="btn btn-primary w-100" type="button" onClick={add}>
                  Append 1,000 rows
                </button>
              </div>
              <div className="col-6">
                <button
                  id="update"
                  className="btn btn-primary w-100"
                  type="button"
                  onClick={update}
                >
                  Update every 10th row
                </button>
              </div>
              <div className="col-6">
                <button id="clear" className="btn btn-primary w-100" type="button" onClick={clear}>
                  Clear
                </button>
              </div>
              <div className="col-6">
                <button
                  id="swaprows"
                  className="btn btn-primary w-100"
                  type="button"
                  onClick={swap}
                >
                  Swap Rows
                </button>
              </div>
              <div className="col-6">
                <button
                  id="sortasc"
                  className="btn btn-primary w-100"
                  type="button"
                  onClick={sortAsc}
                >
                  Sort Ascending
                </button>
              </div>
              <div className="col-6">
                <button
                  id="sortdesc"
                  className="btn btn-primary w-100"
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
      <table className="table-hover table-striped test-data table align-middle">
        <tbody id="tbody">
          {rows.map((row) => {
            let rowId = row.id
            return (
              <tr key={rowId} className={selected === rowId ? 'table-active' : ''}>
                <td className="col-md-1">{rowId}</td>
                <td className="col-md-4">
                  <a
                    className="lbl"
                    href="/"
                    onClick={(event) => {
                      event.preventDefault()
                      setSelected(rowId)
                    }}
                  >
                    {row.label}
                  </a>
                </td>
                <td className="col-md-1">
                  <button
                    className="btn-close remove"
                    type="button"
                    aria-label="Remove"
                    onClick={(event) => {
                      event.preventDefault()
                      removeRow(rowId)
                    }}
                  />
                </td>
                <td className="col-md-6" />
              </tr>
            )
          })}
        </tbody>
      </table>
      <span className="preloadicon btn-close" aria-hidden="true" />
    </div>
  )
}

let el = document.getElementById('main')!
let root = createRoot(el)
root.render(<App />)
