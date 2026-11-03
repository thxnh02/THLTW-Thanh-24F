const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    channel: 'msedge',
    headless: true,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-edge', use: { ...devices['Desktop Edge'] } },
    { name: 'mobile-edge', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npm.cmd run dev -- --hostname 127.0.0.1 --port 3000',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: '/api',
      BACKEND_INTERNAL_URL: 'http://127.0.0.1:8000',
    },
  },
});
