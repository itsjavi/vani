import pokeData from '../assets/pokemon'

let idCounter = 1
let boxIdCounter = 1

/**
 * @param {string | object | string[] | null | undefined | false} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes
    .map((cls) => {
      if (typeof cls === 'string') {
        return cls
      }
      if (Array.isArray(cls)) {
        return cn(...cls)
      }
      if (cls === null || cls === undefined || cls === false || cls === '') {
        return null
      }
      if (typeof cls === 'object') {
        return Object.entries(cls)
          .filter(([_, value]) => value)
          .map(([key]) => key.trim())
          .join(' ')
      }
      return null
    })
    .filter(Boolean)
    .join(' ')
}

// --- Data Table Benchmark Suite helpers ----
/**
 * @typedef {Object} Row
 * @property {number} id
 * @property {string} label
 * @property {import('../assets/pokemon').Pkm} pkm
 */

const pkmNouns = pokeData.pokemon
  .slice(2)
  .filter((pkm) => !pkm.isForm)
  .map((pkm) => pkm.id)

// adjectives, colors, nouns
const A = [
    'pretty',
    'large',
    'big',
    'small',
    'tall',
    'short',
    'long',
    'handsome',
    'plain',
    'quaint',
    'clean',
    'elegant',
    'easy',
    'angry',
    'crazy',
    'helpful',
    'mushy',
    'odd',
    'unsightly',
    'adorable',
    'important',
    'inexpensive',
    'cheap',
    'expensive',
    'fancy',
  ],
  C = [
    'red',
    'yellow',
    'blue',
    'green',
    'pink',
    'brown',
    'purple',
    'brown',
    'white',
    'black',
    'orange',
  ],
  N = pkmNouns

/**
 *
 * @param {number} count
 * @returns {Row[]}
 */
export function buildData(count) {
  let data = new Array(count)

  for (let i = 0; i < count; i++) {
    // Use deterministic selection based on index to ensure same data every time
    data[i] = {
      id: idCounter++,
      label: `${A[i % A.length]} ${C[i % C.length]} ${N[i % N.length]}`,
    }
  }

  return data
}

/**
 * @returns {Row[]}
 */
export function get1000Rows() {
  return buildData(1000)
}

/**
 * @returns {Row[]}
 */
export function get10000Rows() {
  return buildData(10000)
}

/**
 * @param {Row[]} data
 * @returns {Row[]}
 */
export function updatedEvery10thRow(data) {
  let newData = data.slice(0)
  for (let i = 0, d = data, len = d.length; i < len; i += 10) {
    newData[i] = { id: data[i].id, label: data[i].label + ' !!!' }
  }
  return newData
}

/**
 * @param {Row[]} data
 * @returns {Row[]}
 */
export function swapRows(data) {
  let d = data.slice()
  if (d.length > 998) {
    let tmp = d[1]
    d[1] = d[998]
    d[998] = tmp
  }
  return d
}

/**
 * @param {Row[]} data
 * @param {number} id
 * @returns {Row[]}
 */
export function remove(data, id) {
  return data.filter((d) => d.id !== id)
}

/**
 * @param {Row[]} data
 * @param {boolean} ascending
 * @returns {Row[]}
 */
export function sortRows(data, ascending = true) {
  let sorted = data.slice().sort((a, b) => {
    if (ascending) {
      return a.label.localeCompare(b.label)
    } else {
      return b.label.localeCompare(a.label)
    }
  })
  return sorted
}

// --- Pokebox Benchmark Suite helpers ----

export const pkmList = pokeData.pokemon
const pkmById = new Map(pokeData.pokemon.map((pkm) => [pkm.id, pkm]))
const pkmByNid = new Map(pokeData.pokemon.map((pkm) => [pkm.nid, pkm]))

export function getPkmById(id) {
  if (!pkmById.has(id)) {
    throw new Error(`Pokémon with id ${id} not found`)
  }
  return pkmById.get(id)
}

export function getPkmByNid(nid) {
  if (!pkmByNid.has(nid)) {
    throw new Error(`Pokémon with nid ${nid} not found`)
  }
  return pkmByNid.get(nid)
}

// --- Pokebox Benchmark Suite helpers ----

export const POKEBOX_ROWS = 5
export const POKEBOX_COLS = 6
export const POKEBOX_SIZE = POKEBOX_ROWS * POKEBOX_COLS

/**
 * @typedef {{ pkm: import('../assets/pokemon').Pkm; caught: boolean }} PokeCell
 * @typedef {PokeCell | null} PokeSlot
 * @typedef {{ id: number; cells: PokeSlot[] }} PokeBox
 */

/**
 * @param {number} flatIndex
 * @returns {{ boxIndex: number; cellIndex: number }}
 */
export function resolveCellPosition(flatIndex) {
  return {
    boxIndex: Math.floor(flatIndex / POKEBOX_SIZE),
    cellIndex: flatIndex % POKEBOX_SIZE,
  }
}

/**
 * @param {number} startIndex
 * @returns {{ box: PokeBox; nextIndex: number }}
 */
export function createBox(startIndex = 0) {
  let cells = new Array(POKEBOX_SIZE)
  let nextIndex = startIndex
  let id = boxIdCounter++
  for (let i = 0; i < POKEBOX_SIZE; i++) {
    let pkm = pkmList[nextIndex % pkmList.length]
    cells[i] = { pkm, caught: false }
    nextIndex += 1
  }
  return { box: { id, cells }, nextIndex }
}

/**
 * @param {number} count
 * @param {number} startIndex
 * @returns {{ boxes: PokeBox[]; nextIndex: number }}
 */
export function createBoxes(count, startIndex = 0) {
  let boxes = []
  let nextIndex = startIndex
  for (let i = 0; i < count; i++) {
    let result = createBox(nextIndex)
    boxes.push(result.box)
    nextIndex = result.nextIndex
  }
  return { boxes, nextIndex }
}

/**
 * @param {PokeBox[]} boxes
 * @param {number} count
 * @param {number} startIndex
 * @returns {{ boxes: PokeBox[]; nextIndex: number }}
 */
export function appendBoxes(boxes, count, startIndex = 0) {
  let result = createBoxes(count, startIndex)
  return { boxes: [...boxes, ...result.boxes], nextIndex: result.nextIndex }
}

/**
 * @param {PokeBox[]} boxes
 * @param {number} count
 * @param {number} startIndex
 * @returns {{ boxes: PokeBox[]; nextIndex: number }}
 */
export function prependBoxes(boxes, count, startIndex = 0) {
  let result = createBoxes(count, startIndex)
  return { boxes: [...result.boxes, ...boxes], nextIndex: result.nextIndex }
}

/**
 * @param {PokeBox[]} boxes
 * @param {number} count
 * @param {number} startIndex
 * @returns {{ boxes: PokeBox[]; nextIndex: number }}
 */
export function replaceFirstBoxes(boxes, count, startIndex = 0) {
  const replaceCount = Math.min(count, boxes.length)
  const result = createBoxes(replaceCount, startIndex)
  return {
    boxes: [...result.boxes, ...boxes.slice(replaceCount)],
    nextIndex: result.nextIndex,
  }
}

/**
 * @param {PokeBox[]} boxes
 * @returns {PokeSlot[]}
 */
export function flattenBoxes(boxes) {
  let cells = []
  for (let box of boxes) {
    cells.push(...box.cells)
  }
  return cells
}

/**
 * @param {number | PokeBox[]} boxesOrCount
 * @param {PokeSlot[]} cells
 * @returns {PokeBox[]}
 */
export function redistributeBoxes(boxesOrCount, cells) {
  const boxCount = Array.isArray(boxesOrCount) ? boxesOrCount.length : boxesOrCount
  const existingIds = Array.isArray(boxesOrCount) ? boxesOrCount.map((box) => box.id) : null
  let boxes = []
  let cursor = 0
  for (let i = 0; i < boxCount; i++) {
    let boxCells = new Array(POKEBOX_SIZE)
    for (let j = 0; j < POKEBOX_SIZE; j++) {
      boxCells[j] = cursor < cells.length ? cells[cursor] : null
      cursor += 1
    }
    boxes.push({ id: existingIds ? existingIds[i] : boxIdCounter++, cells: boxCells })
  }
  return boxes
}

const isEveryNth = (index, nth) => (index + 1) % nth === 0

/**
 * @param {PokeBox[]} boxes
 * @param {number} nth
 * @returns {PokeBox[]}
 */
export function removeEveryNthBox(boxes, nth) {
  if (nth <= 0) return boxes.slice()
  return boxes.filter((_, index) => !isEveryNth(index, nth))
}

/**
 * @param {PokeBox[]} boxes
 * @param {number} count
 * @returns {PokeBox[]}
 */
export function swapBoxSets(boxes, count) {
  if (count <= 0 || boxes.length < count * 2) return boxes.slice()
  const start = boxes.slice(0, count)
  const endStart = boxes.length - count
  const end = boxes.slice(endStart)
  return [...end, ...boxes.slice(count, endStart), ...start]
}

/**
 * @param {PokeBox[]} boxes
 * @returns {PokeBox[]}
 */
/**
 * @param {PokeBox[]} boxes
 * @returns {PokeBox[]}
 */
export function toggleAllCaught(boxes) {
  return boxes.map((box) => ({
    cells: box.cells.map((cell) => (cell ? { ...cell, caught: !cell.caught } : null)),
  }))
}

/**
 * @param {PokeBox[]} boxes
 * @returns {PokeBox[]}
 */
export function removeFormCells(boxes) {
  let cells = flattenBoxes(boxes).filter((cell) => cell && !cell.pkm.isForm)
  return redistributeBoxes(boxes, cells)
}

/**
 * @param {PokeBox[]} boxes
 * @param {number} nth
 * @returns {PokeBox[]}
 */
export function toggleEveryNthCaught(boxes, nth) {
  if (nth <= 0) return boxes.slice()
  let cells = flattenBoxes(boxes).map((cell, index) => {
    if (!cell || !isEveryNth(index, nth)) return cell
    return { ...cell, caught: !cell.caught }
  })
  return redistributeBoxes(boxes, cells)
}
