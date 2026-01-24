import { pkmDataset, type Pkm } from './data'

export type Row = {
  id: number
  label: string
  pkm: Pkm | null
}

let idCounter = 1

const pkmNouns = pkmDataset.pokemon
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

export function buildData(count: number): Row[] {
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

export function get1000Rows() {
  return buildData(1000)
}

export function get10000Rows() {
  return buildData(10000)
}

export function updatedEvery10thRow(data: Row[]): Row[] {
  let newData = data.slice(0)
  for (let i = 0, d = data, len = d.length; i < len; i += 10) {
    newData[i] = { id: data[i].id, label: data[i].label + ' !!!', pkm: data[i].pkm }
  }
  return newData
}

export function swapRows(data: Row[]): Row[] {
  let d = data.slice()
  if (d.length > 998) {
    let tmp = d[1]
    d[1] = d[998]
    d[998] = tmp
  }
  return d
}

export function remove(data: Row[], id: number): Row[] {
  return data.filter((d) => d.id !== id)
}

export function sortRows(data: Row[], ascending = true): Row[] {
  let sorted = data.slice().sort((a, b) => {
    if (ascending) {
      return a.label.localeCompare(b.label)
    } else {
      return b.label.localeCompare(a.label)
    }
  })
  return sorted
}
