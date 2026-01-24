import { createRoot } from 'react-dom/client'
import App from './app.react'

const el = document.getElementById('main')!
createRoot(el).render(App())
