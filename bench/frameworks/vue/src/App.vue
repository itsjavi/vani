<script setup lang="ts">
import { ref, shallowRef } from 'vue'
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
} from '../../shared.js'

const listIcon = '📊'
const gridIcon = '📦'

const resolveView = () => {
  const params = new URLSearchParams(window.location.search)
  return params.get('view') === 'pokeboxes' ? 'pokeboxes' : 'datatable'
}

const navigateToView = (nextView: string) => {
  const url = new URL(window.location.href)
  url.searchParams.set('view', nextView)
  window.location.assign(url.toString())
}

const view = resolveView()

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

const boxes = ref([])
let nextPkmIndex = 0

function append40() {
  const result = appendBoxes(boxes.value, 40, nextPkmIndex)
  nextPkmIndex = result.nextIndex
  boxes.value = result.boxes
}

function prepend40() {
  const result = prependBoxes(boxes.value, 40, nextPkmIndex)
  nextPkmIndex = result.nextIndex
  boxes.value = result.boxes
}

function remove3rdBox() {
  boxes.value = removeEveryNthBox(boxes.value, 3)
}

function swapBoxSetsAction() {
  boxes.value = swapBoxSets(boxes.value, 3)
}

function replaceFirst6() {
  const result = replaceFirstBoxes(boxes.value, 6, nextPkmIndex)
  nextPkmIndex = result.nextIndex
  boxes.value = result.boxes
}

function removeForms() {
  boxes.value = removeFormCells(boxes.value)
}

function markAll() {
  boxes.value = toggleAllCaught(boxes.value)
}

function toggle3rd() {
  boxes.value = toggleEveryNthCaught(boxes.value, 3)
}

function removeBox(index: number) {
  boxes.value = boxes.value.filter((_, idx) => idx !== index)
}

function toggleCell(boxIndex: number, cellIndex: number) {
  const box = boxes.value[boxIndex]
  if (!box) return
  const cell = box.cells[cellIndex]
  if (!cell) return
  boxes.value = boxes.value.map((currentBox, index) => {
    if (index !== boxIndex) return currentBox
    const cells = currentBox.cells.slice()
    cells[cellIndex] = { ...cell, caught: !cell.caught }
    return { ...currentBox, cells }
  })
}
</script>

<template>
  <div class="container">
    <div class="bench-header jumbo-hero mb-3">
      <div class="row align-items-center g-0">
        <div class="col-lg-6">
          <div class="bench-view-toggle" id="view-toggle">
            <button
              type="button"
              class="bench-view-btn"
              :class="{ 'is-active': view === 'datatable' }"
              :aria-pressed="view === 'datatable'"
              aria-label="View data table"
              title="View data table"
              @click="navigateToView('datatable')"
            >
              {{ listIcon }}
            </button>
            <button
              type="button"
              class="bench-view-btn"
              :class="{ 'is-active': view === 'pokeboxes' }"
              :aria-pressed="view === 'pokeboxes'"
              aria-label="View pokeboxes"
              title="View pokeboxes"
              @click="navigateToView('pokeboxes')"
            >
              {{ gridIcon }}
            </button>
          </div>
          <h1 class="bench-title mb-0">Vue</h1>
        </div>
        <div class="col-lg-6">
          <div class="row g-2 bench-actions" id="app-actions">
            <template v-if="view === 'pokeboxes'">
              <div class="col-6">
                <button type="button" class="btn btn-primary w-100" id="append40" @click="append40">
                  Append 40 boxes
                </button>
              </div>
              <div class="col-6">
                <button
                  type="button"
                  class="btn btn-primary w-100"
                  id="prepend40"
                  @click="prepend40"
                >
                  Prepend 40 boxes
                </button>
              </div>
              <div class="col-6">
                <button
                  type="button"
                  class="btn btn-primary w-100"
                  id="remove3rdbox"
                  @click="remove3rdBox"
                >
                  Remove every 3rd box
                </button>
              </div>
              <div class="col-6">
                <button
                  type="button"
                  class="btn btn-primary w-100"
                  id="swapboxsets"
                  @click="swapBoxSetsAction"
                >
                  Swap box sets
                </button>
              </div>
              <div class="col-6">
                <button
                  type="button"
                  class="btn btn-primary w-100"
                  id="replacefirst6"
                  @click="replaceFirst6"
                >
                  Replace first 6 boxes
                </button>
              </div>
              <div class="col-6">
                <button
                  type="button"
                  class="btn btn-primary w-100"
                  id="removeforms"
                  @click="removeForms"
                >
                  Remove form variants
                </button>
              </div>
              <div class="col-6">
                <button type="button" class="btn btn-primary w-100" id="toggleall" @click="markAll">
                  Toggle all as caught
                </button>
              </div>
              <div class="col-6">
                <button
                  type="button"
                  class="btn btn-primary w-100"
                  id="toggle3rd"
                  @click="toggle3rd"
                >
                  Toggle every 3rd cell
                </button>
              </div>
            </template>
            <template v-else>
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
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-if="view === 'pokeboxes'" class="pokebox-grid" id="pokebox-grid">
      <div
        v-for="(box, boxIndex) in boxes"
        :key="boxIndex"
        class="pokebox-card"
        :data-box-index="boxIndex"
      >
        <div class="pokebox-header">
          <span class="pokebox-title">Box {{ box.id }}</span>
          <button
            type="button"
            class="btn-close pokebox-remove"
            :aria-label="`Remove Box ${box.id}`"
            :data-box-index="boxIndex"
            @click.prevent="removeBox(boxIndex)"
          ></button>
        </div>
        <div class="pokebox-cells">
          <button
            v-for="(cell, cellIndex) in box.cells"
            :key="`${boxIndex}-${cellIndex}`"
            type="button"
            class="pokebox-cell"
            :data-box-index="boxIndex"
            :data-cell-index="cellIndex"
            :data-empty="cell ? undefined : 'true'"
            :data-caught="cell?.caught ? 'true' : undefined"
            :aria-label="cell ? `Pokemon ${cell.pkm.name}` : `Empty cell ${cellIndex + 1}`"
            @click.prevent="toggleCell(boxIndex, cellIndex)"
          >
            <span v-if="cell" :class="`pkm-img pkm-img-${cell.pkm.nid}`" aria-hidden="true"></span>
            <span
              v-if="cell?.caught"
              class="pokeball pokeball-sm pokebox-caught-badge"
              aria-hidden="true"
            ></span>
          </button>
        </div>
      </div>
    </div>
    <table v-else class="table-hover table-striped test-data table align-middle">
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
