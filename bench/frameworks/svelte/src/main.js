import { mount } from 'svelte'
import Main from './Main.svelte'

const app = document.querySelector('#app')
if (!app) throw new Error('#app not found')

mount(Main, {
  target: app,
})
