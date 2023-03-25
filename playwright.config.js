import check from 'is-port-reachable'

const dev = await check(5173, { host: 'localhost' })

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  webServer: {
    command: 'npx vite build && npx vite preview',
    port: dev ? 5173 : 4173,
    reuseExistingServer: dev
  },
  use: {
    baseURL: `http://localhost:${dev ? '5173' : '4173/svelte-toast/'}`
  },
  testDir: 'tests'
}

export default config
