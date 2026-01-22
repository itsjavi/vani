import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { defineConfig } from 'vite'
import vaniStaticSiteGenerator from './src/ecosystem/vite-plugin-vani-ssg'
import vaniSvgImports from './src/ecosystem/vite-plugin-vani-svg'

// https://vite.dev/config/
export default defineConfig({
  // base: '/vani/',
  plugins: [
    tailwindcss(),
    vaniSvgImports(),
    vaniStaticSiteGenerator({
      entryClientFile: 'src/spa-app/entry-client.ts',
      entryServerFile: 'src/spa-app/entry-server.ts',
    }),
  ],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // { find: /^vani$/, replacement: path.resolve(__dirname, './src/vani/index.ts') },
      // {
      //   find: /^vani\/jsx-runtime$/,
      //   replacement: path.resolve(__dirname, './src/vani/jsx-runtime.ts'),
      // },
      // {
      //   find: /^vani\/jsx-dev-runtime$/,
      //   replacement: path.resolve(__dirname, './src/vani/jsx-dev-runtime.ts'),
      // },
    ],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (moduleId /*, _meta*/) => {
          if (moduleId.includes('codemirror') || moduleId.includes('babel')) {
            return 'codemirror'
          }
          if (moduleId.includes('shiki')) {
            return 'shiki'
          }
          if (moduleId.includes('node_modules')) {
            // tailwind and lucide basically
            return 'vendor'
          }
          return null
        },
      },
    },
  },
})
