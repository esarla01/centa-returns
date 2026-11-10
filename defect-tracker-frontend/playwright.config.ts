import { defineConfig } from '@playwright/test';

// Browser tests. They need the backend and frontend running against a
// throwaway database; see e2e/README.md.
export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    viewport: { width: 1680, height: 1000 },
    // The people who use this are in Turkey; date handling must be right there.
    timezoneId: 'Europe/Istanbul',
    screenshot: 'only-on-failure',
  },
});
