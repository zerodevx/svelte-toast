import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import adapter from '@sveltejs/adapter-static'
import { readFileSync } from 'node:fs'

const { version: name } = JSON.parse(readFileSync(new URL('package.json', import.meta.url), 'utf8'))

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({ fallback: '404.html' }),
    paths: {
      base: process.argv.includes('dev') ? '' : '/svelte-toast'
    },
    version: { name }
  },
  preprocess: [vitePreprocess()]
}

export default config
