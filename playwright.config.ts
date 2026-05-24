import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: "http://localhost:1998",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    // Disable CSS animations so Playwright's "stable" check never gets fooled
    // by sub-pixel reflows from animate-pulse / transitions.
    contextOptions: {
      reducedMotion: "reduce",
    },
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:1998",
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
