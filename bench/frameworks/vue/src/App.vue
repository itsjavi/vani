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
  <div class="container">
    <div class="bench-header jumbo-hero mb-3">
      <div class="row align-items-center g-0">
        <div class="col-lg-6">
          <h1 class="bench-title mb-0">Vue</h1>
        </div>
        <div class="col-lg-6">
          <div class="row g-2 bench-actions" id="app-actions">
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="run" @click="run">
                Create 1,000 rows
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="runlots" @click="runLots">
                Create 10,000 rows
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="add" @click="add">
                Append 1,000 rows
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="update" @click="update">
                Update every 10th row
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="clear" @click="clear">
                Clear
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="swaprows" @click="swapRows">
                Swap Rows
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="sortasc" @click="sortAsc">
                Sort Ascending
              </button>
            </div>
            <div class="col-6">
              <button type="button" class="btn btn-primary w-100" id="sortdesc" @click="sortDesc">
                Sort Descending
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <table class="table-hover table-striped test-data table align-middle">
      <tbody id="tbody">
        <tr
          v-for="{ id, label } of rows"
          :key="id"
          :class="{ 'table-active': id === selected }"
          v-memo="[label, id === selected]"
        >
          <td class="col-md-1">{{ id }}</td>
          <td class="col-md-4">
            <a class="lbl" href="/" @click.prevent="select(id)">{{ label }}</a>
          </td>
          <td class="col-md-1">
            <button
              class="btn-close remove"
              type="button"
              aria-label="Remove"
              @click.prevent="removeRow(id)"
            ></button>
          </td>
          <td class="col-md-6"></td>
        </tr>
      </tbody>
    </table>
    <span class="preloadicon btn-close" aria-hidden="true"></span>
  </div>
</template>
