import { pkmDataset, type Pkm } from './data'

export const POKEBOX_ROWS = 5
export const POKEBOX_COLS = 6
export const POKEBOX_SIZE = POKEBOX_ROWS * POKEBOX_COLS

export const pkmList = pkmDataset.pokemon
export const pkmById = new Map(pkmDataset.pokemon.map((pkm) => [pkm.id, pkm]))
export const pkmByNid = new Map(pkmDataset.pokemon.map((pkm) => [pkm.nid, pkm]))

export type PokeCell = {
  pkm: Pkm
  caught: boolean
}
export type PokeSlot = PokeCell | null
export type PokeBox = {
  id: number
  cells: PokeSlot[]
}

let boxIdCounter = 1

export function resolveCellPosition(flatIndex: number): {
  boxIndex: number
  cellIndex: number
} {
  return {
    boxIndex: Math.floor(flatIndex / POKEBOX_SIZE),
    cellIndex: flatIndex % POKEBOX_SIZE,
  }
}

export function createBox(startIndex = 0): {
  box: PokeBox
  nextIndex: number
} {
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

export function createBoxes(
  count: number,
  startIndex = 0,
): {
  boxes: PokeBox[]
  nextIndex: number
} {
  let boxes = []
  let nextIndex = startIndex
  for (let i = 0; i < count; i++) {
    let result = createBox(nextIndex)
    boxes.push(result.box)
    nextIndex = result.nextIndex
  }
  return { boxes, nextIndex }
}

export function appendBoxes(
  boxes: PokeBox[],
  count: number,
  startIndex = 0,
): {
  boxes: PokeBox[]
  nextIndex: number
} {
  let result = createBoxes(count, startIndex)
  return { boxes: [...boxes, ...result.boxes], nextIndex: result.nextIndex }
}

export function prependBoxes(
  boxes: PokeBox[],
  count: number,
  startIndex = 0,
): {
  boxes: PokeBox[]
  nextIndex: number
} {
  let result = createBoxes(count, startIndex)
  return { boxes: [...result.boxes, ...boxes], nextIndex: result.nextIndex }
}

export function replaceFirstBoxes(
  boxes: PokeBox[],
  count: number,
  startIndex = 0,
): {
  boxes: PokeBox[]
  nextIndex: number
} {
  const replaceCount = Math.min(count, boxes.length)
  const result = createBoxes(replaceCount, startIndex)
  return {
    boxes: [...result.boxes, ...boxes.slice(replaceCount)],
    nextIndex: result.nextIndex,
  }
}

export function flattenBoxes(boxes: PokeBox[]): PokeSlot[] {
  let cells = []
  for (let box of boxes) {
    cells.push(...box.cells)
  }
  return cells
}

export function redistributeBoxes(boxesOrCount: number | PokeBox[], cells: PokeSlot[]): PokeBox[] {
  const boxCount = Array.isArray(boxesOrCount) ? boxesOrCount.length : boxesOrCount
  const existingIds = Array.isArray(boxesOrCount) ? boxesOrCount.map((box) => box.id) : null
  let boxes: PokeBox[] = []
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

const isEveryNth = (index: number, nth: number): boolean => (index + 1) % nth === 0

export function removeEveryNthBox(boxes: PokeBox[], nth: number): PokeBox[] {
  if (nth <= 0) return boxes.slice()
  return boxes.filter((_, index) => !isEveryNth(index, nth))
}

export function swapBoxSets(boxes: PokeBox[], count: number): PokeBox[] {
  if (count <= 0 || boxes.length < count * 2) return boxes.slice()
  const start = boxes.slice(0, count)
  const endStart = boxes.length - count
  const end = boxes.slice(endStart)
  return [...end, ...boxes.slice(count, endStart), ...start]
}

export function toggleAllCaught(boxes: PokeBox[]): PokeBox[] {
  return boxes.map((box: PokeBox) => ({
    id: box.id,
    cells: box.cells.map((cell: PokeSlot) => (cell ? { ...cell, caught: !cell.caught } : null)),
  }))
}

export function removeFormCells(boxes: PokeBox[]): PokeBox[] {
  let cells = flattenBoxes(boxes).filter((cell: PokeSlot) => cell && !cell.pkm.isForm)
  return redistributeBoxes(boxes, cells)
}

export function toggleEveryNthCaught(boxes: PokeBox[], nth: number): PokeBox[] {
  if (nth <= 0) return boxes.slice()
  let cells = flattenBoxes(boxes).map((cell: PokeSlot, index: number) => {
    if (!cell || !isEveryNth(index, nth)) return cell
    return { ...cell, caught: !cell.caught }
  })
  return redistributeBoxes(boxes, cells)
}
