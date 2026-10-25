import { defineConfig, devices } from '@playwright/test'

// End-to-end tests drive the real app against a disposable Jellyfin in Docker (see e2e/jellyfin.sh).
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: { baseURL: 'http://localhost:5199', locale: 'en-US', trace: 'retain-on-failure', ...devices['Desktop Chrome'] },
  webServer: { command: 'npx vite --port 5199 --strictPort', url: 'http://localhost:5199', reuseExistingServer: !process.env.CI },
})
