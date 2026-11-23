import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "lectures",
  timeout: 30_000,
  // On CI, fail the run if a test.only was committed by mistake.
  forbidOnly: !!process.env.CI,
  // Retry only on CI, where a retry also records a trace (see `trace` below).
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    headless: true,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
  },
  // Every test runs once per project. Test code never chooses the browser: the built-in
  // `page` fixture is created from the project's settings, so every pattern is cross-browser.
  // Run one browser with --project=chrome or --project=firefox.
  projects: [
    {
      name: "chrome",
      // The installed Google Chrome (stable channel), not Playwright's bundled Chromium.
      // If Chrome is missing, install it with: npx playwright install chrome
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],
});
