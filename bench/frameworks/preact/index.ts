import { render } from 'preact'
import App from './app.preact'

const el = document.getElementById('main')!
render(App(), el)
