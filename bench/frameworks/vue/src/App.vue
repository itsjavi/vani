<script setup>
import { ref, shallowRef } from 'vue'
import {
  get10000Rows,
  get1000Rows,
  remove,
  sortRows,
  swapRows as swapRowsData,
  updatedEvery10thRow,
} from '../../shared.js'

const selected = ref(null)
const rows = shallowRef([])

function setRows(update) {
  rows.value = update
}

function add() {
  setRows(rows.value.concat(get1000Rows()))
}

function removeRow(id) {
  setRows(remove(rows.value, id))
  if (selected.value === id) selected.value = null
}

function select(id) {
  selected.value = id
}

function run() {
  setRows(get1000Rows())
  selected.value = null
}

function update() {
  setRows(updatedEvery10thRow(rows.value))
}

function runLots() {
  setRows(get10000Rows())
  selected.value = null
}

function clear() {
  setRows([])
  selected.value = null
}

function swapRows() {
  setRows(swapRowsData(rows.value))
}

function sortAsc() {
  setRows(sortRows(rows.value, true))
}

function sortDesc() {
  setRows(sortRows(rows.value, false))
}
</script>

<template>
  <div class="jumbotron">
    <div class="row">
      <div class="col-md-6">
        <h1>Vue.js 3 (keyed)</h1>
      </div>
      <div class="col-md-6">
        <div class="row">
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="run" @click="run">
              Create 1,000 rows
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="runlots" @click="runLots">
              Create 10,000 rows
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="add" @click="add">
              Append 1,000 rows
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="update" @click="update">
              Update every 10th row
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="clear" @click="clear">
              Clear
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="swaprows" @click="swapRows">
              Swap Rows
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="sortasc" @click="sortAsc">
              Sort Ascending
            </button>
          </div>
          <div class="col-sm-6 smallpad">
            <button type="button" class="btn btn-primary btn-block" id="sortdesc" @click="sortDesc">
              Sort Descending
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <table class="table-hover table-striped test-data table">
    <tbody>
      <tr
        v-for="{ id, label } of rows"
        :key="id"
        :class="{ danger: id === selected }"
        :data-label="label"
        v-memo="[label, id === selected]"
      >
        <td class="col-md-1">{{ id }}</td>
        <td class="col-md-4">
          <a @click="select(id)">{{ label }}</a>
        </td>
        <td class="col-md-1">
          <a @click="removeRow(id)">
            <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
          </a>
        </td>
        <td class="col-md-6"></td>
      </tr>
    </tbody>
  </table>
  <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</template>
