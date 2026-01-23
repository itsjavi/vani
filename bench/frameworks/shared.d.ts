export type Row = {
  id: number
  label: string
  pkm: Pkm
}
export type Pkm = {
  id: string
  nid: string
  name: string
  formName: string | null
  isForm: boolean
  gen: number
  forms: string[]
}

type ClassName = string | object | string[] | null | undefined | false | ClassName[]
export declare function cn(...classes: ClassName[]): string

export declare function buildData(count: number): Row[]
export declare function get1000Rows(): Row[]
export declare function get10000Rows(): Row[]
export declare function updatedEvery10thRow(data: Row[]): Row[]
export declare function swapRows(data: Row[]): Row[]
export declare function remove(data: Row[], id: number): Row[]
export declare function sortRows(data: Row[], ascending?: boolean): Row[]

export declare const pkmList: Pkm[]
export declare function getPkmById(id: string): Pkm
export declare function getPkmByNid(nid: string): Pkm

export type PokeCell = {
  pkm: Pkm
  caught: boolean
}
export type PokeSlot = PokeCell | null
export type PokeBox = {
  id: number
  cells: PokeSlot[]
}

export declare const POKEBOX_ROWS: number
export declare const POKEBOX_COLS: number
export declare const POKEBOX_SIZE: number
export declare function resolveCellPosition(flatIndex: number): {
  boxIndex: number
  cellIndex: number
}
export declare function createBox(startIndex?: number): {
  box: PokeBox
  nextIndex: number
}
export declare function createBoxes(
  count: number,
  startIndex?: number,
): {
  boxes: PokeBox[]
  nextIndex: number
}
export declare function appendBoxes(
  boxes: PokeBox[],
  count: number,
  startIndex?: number,
): {
  boxes: PokeBox[]
  nextIndex: number
}
export declare function prependBoxes(
  boxes: PokeBox[],
  count: number,
  startIndex?: number,
): {
  boxes: PokeBox[]
  nextIndex: number
}
export declare function replaceFirstBoxes(
  boxes: PokeBox[],
  count: number,
  startIndex?: number,
): {
  boxes: PokeBox[]
  nextIndex: number
}
export declare function flattenBoxes(boxes: PokeBox[]): PokeSlot[]
export declare function redistributeBoxes(boxCount: number, cells: PokeSlot[]): PokeBox[]
export declare function redistributeBoxes(boxes: PokeBox[], cells: PokeSlot[]): PokeBox[]
export declare function removeEveryNthBox(boxes: PokeBox[], nth: number): PokeBox[]
export declare function swapBoxSets(boxes: PokeBox[], count: number): PokeBox[]
export declare function toggleAllCaught(boxes: PokeBox[]): PokeBox[]
export declare function removeFormCells(boxes: PokeBox[]): PokeBox[]
export declare function toggleEveryNthCaught(boxes: PokeBox[], nth: number): PokeBox[]
