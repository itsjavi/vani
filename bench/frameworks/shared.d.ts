export type Row = {
  id: number
  label: string
}
export declare function buildData(count: number): any[]
export declare function get1000Rows(): Row[]
export declare function get10000Rows(): Row[]
export declare function updatedEvery10thRow(data: Row[]): Row[]
export declare function swapRows(data: Row[]): Row[]
export declare function remove(data: Row[], id: number): Row[]
export declare function sortRows(data: Row[], ascending?: boolean): Row[]
