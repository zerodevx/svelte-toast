import preprocess from 'svelte-preprocess'
import adapter from '@sveltejs/adapter-static'

const dev = process.argv.includes('dev')

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      fallback: '404.html'
    }),
    paths: {
      base: dev ? '' : '/svelte-toast'
    }
  },
  compilerOptions: {
    dev,
    css: 'external'
  },
  package: {
    emitTypes: false // to remove after migrating away from hand-written d.ts
  },
  preprocess: [
    preprocess({
      postcss: true
    })
  ]
}

export default config
