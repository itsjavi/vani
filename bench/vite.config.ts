import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { defineConfig } from 'vite'
import frameworkPlugins from './plugins/vite-plugin-multi-framework'
import htmlPages from './plugins/vite-plugin-multi-html'

export default defineConfig({
  plugins: [
    tailwindcss(),
    frameworkPlugins({
      frameworks: ['preact', 'react', 'remix', 'solid', 'svelte', 'vue'],
    }),
    htmlPages({
      pageDirs: {
        '/': 'src/pages/',
        '/frameworks': 'frameworks/',
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@/bench': path.resolve(__dirname, 'src'),
      '@/bench/*': path.resolve(__dirname, 'src/*'),
      vani: path.resolve(__dirname, '../src/vani'),
      'vani/*': path.resolve(__dirname, '../src/vani/*'),
    },
  },
})
