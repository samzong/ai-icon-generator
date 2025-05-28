import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e', // Directory for test files
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000', // Base URL for tests
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // You can add more browsers here like Firefox or WebKit if needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  // Run your dev server before starting the tests:
  webServer: {
    command: 'npm run dev:noturbo', // Command to start the dev server (without Turbopack)
    url: 'http://localhost:3000', // URL to wait for
    reuseExistingServer: !process.env.CI, // Reuse server if already running (except in CI)
    timeout: 120 * 1000, // Increase timeout for server to start (milliseconds)
    stdout: 'pipe', // Pipe stdout to capture logs
    stderr: 'pipe', // Pipe stderr to capture logs
  },
});
