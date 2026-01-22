import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/frameworks/vue/',
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: './src/main.js',
      output: {
        entryFileNames: 'main.js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  server: {
    open: '/src/main.html',
  },
})
