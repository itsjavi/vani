import { mount } from 'svelte'
import App from './app.svelte'

const root = document.querySelector('#app')
if (!root) throw new Error('#app not found')

mount(App, {
  target: root,
})
