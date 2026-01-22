import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/frameworks/vue/',
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        app: './src/main.html',
      },
    },
  },
  server: {
    open: '/src/main.html',
  },
})
