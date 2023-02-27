import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    svelte({
      configFile: false,
      compilerOptions: {
        dev: false,
        css: 'injected'
      },
      emitCss: false
    })
  ],
  build: {
    outDir: './dist/dist',
    minify: 'terser',
    lib: {
      entry: './src/lib/index.js',
      name: 'window',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      output: {
        extend: true
      }
    }
  }
})
