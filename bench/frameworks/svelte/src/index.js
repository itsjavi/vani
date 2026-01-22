import { mount } from 'svelte'
import App from './app.svelte'

const root = document.querySelector('#main')
if (!root) throw new Error('#main not found')

mount(App, {
  target: root,
})
