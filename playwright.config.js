import check from 'is-port-reachable'

const dev = await check(5173, { host: 'localhost' })

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  webServer: {
    command: 'npm run build && npm run preview',
    port: dev ? 5173 : 4173,
    reuseExistingServer: dev
  },
  testDir: 'tests',
}

export default config
