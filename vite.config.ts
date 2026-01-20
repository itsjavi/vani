import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { defineConfig } from 'vite'
import { vaniSpaPlugin } from './src/app/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  // base: '/vani/',
  plugins: [
    tailwindcss(),
    vaniSpaPlugin({
      entryClientFile: 'src/app/entry-client.ts',
      entryServerFile: 'src/app/entry-server.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
