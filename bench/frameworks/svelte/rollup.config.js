import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import svelte from 'rollup-plugin-svelte'

const plugins = [
  resolve({ browser: true }),
  svelte({
    emitCss: false,
  }),
]

if (process.env.production) {
  plugins.push(terser())
}

export default {
  input: 'index.js',
  output: {
    file: 'dist/main.js',
    format: 'iife',
    name: 'main',
  },
  onwarn: (warning, warn) => {
    if (warning.code === 'CIRCULAR_DEPENDENCY') {
      return
    }
    warn(warning)
  },
  plugins,
}
