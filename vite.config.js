import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import fs from 'node:fs/promises'

const { version } = JSON.parse(await fs.readFile('package.json'))

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    __VERSION__: JSON.stringify(version)
  }
})
