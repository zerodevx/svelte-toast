import { defineConfig } from '@playwright/test'
import check from 'is-port-reachable'

const dev = await check(5173, { host: 'localhost' })

export default defineConfig({
  webServer: {
    command: 'npx vite build && npx vite preview',
    port: dev ? 5173 : 4173,
    reuseExistingServer: dev
  },
  use: {
    baseURL: `http://localhost:${dev ? '5173' : '4173/svelte-toast/'}`
  },
  testDir: 'tests',
  testMatch: '**/*.js'
})
