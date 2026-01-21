// ─────────────────────────────────────────────
// HTML element helpers
// ─────────────────────────────────────────────

import { el, type ElementProps, type VChild } from './runtime'

type ElementTagName = keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap

function createElementFn<E extends ElementTagName>(tag: E) {
  return (propsOrChild?: ElementProps<E> | VChild | null, ...children: VChild[]) =>
    el(tag, propsOrChild, ...children)
}

// Basic and semantic elements
export const div = createElementFn('div')
export const span = createElementFn('span')
export const ul = createElementFn('ul')
export const li = createElementFn('li')
export const ol = createElementFn('ol')
export const dl = createElementFn('dl')
export const dt = createElementFn('dt')
export const dd = createElementFn('dd')
export const main = createElementFn('main')
export const header = createElementFn('header')
export const footer = createElementFn('footer')
export const section = createElementFn('section')
export const article = createElementFn('article')
export const aside = createElementFn('aside')
export const nav = createElementFn('nav')

// Interactive elements
export const details = createElementFn('details')
export const summary = createElementFn('summary')
export const a = createElementFn('a')
export const button = createElementFn('button')
export const input = createElementFn('input')
export const output = createElementFn('output')
export const textarea = createElementFn('textarea')
export const select = createElementFn('select')
export const option = createElementFn('option')
export const optgroup = createElementFn('optgroup')
export const label = createElementFn('label')
export const form = createElementFn('form')
export const progress = createElementFn('progress')
export const meter = createElementFn('meter')
export const fieldset = createElementFn('fieldset')
export const legend = createElementFn('legend')
export const datalist = createElementFn('datalist')

// Media elements
export const figure = createElementFn('figure')
export const figcaption = createElementFn('figcaption')
export const img = createElementFn('img')
export const picture = createElementFn('picture')
export const source = createElementFn('source')
export const video = createElementFn('video')
export const audio = createElementFn('audio')
export const iframe = createElementFn('iframe')
export const embed = createElementFn('embed')

// Prose elements
export const time = createElementFn('time')
export const mark = createElementFn('mark')
export const p = createElementFn('p')
export const h1 = createElementFn('h1')
export const h2 = createElementFn('h2')
export const h3 = createElementFn('h3')
export const h4 = createElementFn('h4')
export const h5 = createElementFn('h5')
export const h6 = createElementFn('h6')
export const code = createElementFn('code')
export const pre = createElementFn('pre')
export const blockquote = createElementFn('blockquote')
export const var_ = createElementFn('var')
export const kbd = createElementFn('kbd')
export const samp = createElementFn('samp')
export const cite = createElementFn('cite')
export const dfn = createElementFn('dfn')
export const abbr = createElementFn('abbr')
export const small = createElementFn('small')
export const strong = createElementFn('strong')
export const em = createElementFn('em')
export const br = createElementFn('br')
export const hr = createElementFn('hr')

// Tables
export const table = createElementFn('table')
export const caption = createElementFn('caption')
export const colgroup = createElementFn('colgroup')
export const col = createElementFn('col')
export const tbody = createElementFn('tbody')
export const thead = createElementFn('thead')
export const tfoot = createElementFn('tfoot')
export const tr = createElementFn('tr')
export const td = createElementFn('td')
export const th = createElementFn('th')

// Scripting elements
export const style = createElementFn('style')
export const script = createElementFn('script')
export const noscript = createElementFn('noscript')
export const template = createElementFn('template')
export const slot = createElementFn('slot')

// SVG elements
export const svg = createElementFn('svg')
export const g = createElementFn('g')
export const path = createElementFn('path')
export const circle = createElementFn('circle')
export const rect = createElementFn('rect')
export const line = createElementFn('line')
export const polyline = createElementFn('polyline')
export const polygon = createElementFn('polygon')
export const ellipse = createElementFn('ellipse')
export const defs = createElementFn('defs')
export const clipPath = createElementFn('clipPath')
export const mask = createElementFn('mask')
export const pattern = createElementFn('pattern')
export const linearGradient = createElementFn('linearGradient')
export const radialGradient = createElementFn('radialGradient')
export const stop = createElementFn('stop')
export const use = createElementFn('use')
