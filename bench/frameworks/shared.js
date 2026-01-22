let idCounter = 1

/**
 * @typedef {Object} Row
 * @property {number} id
 * @property {string} label
 */

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
  N = [
    'table',
    'chair',
    'house',
    'bbq',
    'desk',
    'car',
    'pony',
    'cookie',
    'sandwich',
    'burger',
    'pizza',
    'mouse',
    'keyboard',
  ]

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
