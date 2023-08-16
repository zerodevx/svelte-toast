import { vitePreprocess } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-static'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync(new URL('package.json', import.meta.url), 'utf8'))
const dev = process.argv.includes('dev')

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    paths: {
      base: dev ? '' : '/svelte-toast'
    },
    version: {
      name: version
    }
  },
  preprocess: [vitePreprocess({})]
}

export default config
