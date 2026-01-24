<script setup lang="ts">
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
  type PokeBox,
  type Row,
} from '@/bench/core'
import { ref, shallowRef } from 'vue'

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

const selected = ref<number | null>(null)
const rows = shallowRef<Row[]>([])

function setRows(update: Row[]) {
  rows.value = update
}

function add() {
  setRows(rows.value.concat(get1000Rows()))
}

function removeRow(id: number) {
  setRows(remove(rows.value, id))
  if (selected.value === id) selected.value = null
}

function select(id: number | null) {
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

const boxes = ref<PokeBox[]>([])
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
  <div class="bench-container">
    <div class="bench-hero bench-section">
      <div class="bench-grid-2">
        <div class="relative">
          <div class="bench-view-toggle" id="view-toggle">
            <button
              type="button"
              class="bench-view-button"
              :class="{ 'bench-view-button-active': view === 'datatable' }"
              :aria-pressed="view === 'datatable'"
              aria-label="View data table"
              title="View data table"
              @click="navigateToView('datatable')"
            >
              {{ listIcon }}
            </button>
            <button
              type="button"
              class="bench-view-button"
              :class="{ 'bench-view-button-active': view === 'pokeboxes' }"
              :aria-pressed="view === 'pokeboxes'"
              aria-label="View pokeboxes"
              title="View pokeboxes"
              @click="navigateToView('pokeboxes')"
            >
              {{ gridIcon }}
            </button>
          </div>
          <h1 class="bench-title">Vue</h1>
        </div>
        <div>
          <div class="bench-actions" id="app-actions">
            <template v-if="view === 'pokeboxes'">
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="append40"
                @click="append40"
              >
                Append 40 boxes
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="prepend40"
                @click="prepend40"
              >
                Prepend 40 boxes
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="remove3rdbox"
                @click="remove3rdBox"
              >
                Remove every 3rd box
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="swapboxsets"
                @click="swapBoxSetsAction"
              >
                Swap box sets
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="replacefirst6"
                @click="replaceFirst6"
              >
                Replace first 6 boxes
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="removeforms"
                @click="removeForms"
              >
                Remove form variants
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="toggleall"
                @click="markAll"
              >
                Toggle all as caught
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="toggle3rd"
                @click="toggle3rd"
              >
                Toggle every 3rd cell
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="run"
                @click="run"
              >
                Create 1,000 rows
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="runlots"
                @click="runLots"
              >
                Create 10,000 rows
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="add"
                @click="add"
              >
                Append 1,000 rows
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="update"
                @click="update"
              >
                Update every 10th row
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="clear"
                @click="clear"
              >
                Clear
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="swaprows"
                @click="swapRows"
              >
                Swap Rows
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="sortasc"
                @click="sortAsc"
              >
                Sort Ascending
              </button>
              <button
                type="button"
                class="bench-button bench-button-primary w-full"
                id="sortdesc"
                @click="sortDesc"
              >
                Sort Descending
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-if="view === 'pokeboxes'" class="bench-pokebox-grid" id="pokebox-grid">
      <div
        v-for="(box, boxIndex) in boxes"
        :key="boxIndex"
        class="bench-pokebox-card"
        :data-box-index="boxIndex"
      >
        <div class="bench-pokebox-header">
          <span class="bench-pokebox-title">Box {{ box.id }}</span>
          <button
            type="button"
            class="bench-pokebox-remove"
            :aria-label="`Remove Box ${box.id}`"
            :data-box-index="boxIndex"
            @click.prevent="removeBox(boxIndex)"
          ></button>
        </div>
        <div class="bench-pokebox-cells">
          <button
            v-for="(cell, cellIndex) in box.cells"
            :key="`${boxIndex}-${cellIndex}`"
            type="button"
            class="bench-pokebox-cell"
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
    <table v-else class="bench-data-table">
      <tbody id="tbody">
        <!-- Don not use row memoization in the base Vue benchmark, that's unfair to other frameworks -->
        <!-- <tr v-memo="[label, id === selected]" ...> -->
        <tr
          v-for="{ id, label } of rows"
          :key="id"
          class="bench-data-row"
          :class="{ 'bench-data-active': id === selected }"
        >
          <td class="bench-data-cell bench-data-id">{{ id }}</td>
          <td class="bench-data-cell">
            <a class="bench-data-link" href="/" @click.prevent="select(id)">{{ label }}</a>
          </td>
          <td class="bench-data-cell">
            <button
              class="bench-data-remove"
              type="button"
              aria-label="Remove"
              @click.prevent="removeRow(id)"
            ></button>
          </td>
          <td class="bench-data-cell"></td>
        </tr>
      </tbody>
    </table>
    <span class="bench-preload-icon bench-data-remove" aria-hidden="true"></span>
  </div>
</template>
