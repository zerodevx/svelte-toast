import { defineConfig } from 'cypress'

export default defineConfig({
  screenshotOnRunFailure: false,
  video: false,
  e2e: {
    baseUrl: 'http://localhost:3000'
  }
})
