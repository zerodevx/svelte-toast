import { defineConfig } from '@playwright/test'

export default defineConfig({
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true
  },
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/
})
