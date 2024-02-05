import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    headless: process.env.CI ? true : false,
    permissions: ['clipboard-read'],
    trace: 'on'
  },
  testDir: './tests',
  workers: process.env.RUN_IN_BRWOSER ? 2 : 1,
  retries: process.env.CI ? 2 : 0,
  timeout: process.env.CI ? 120_000 : 60_000,
  expect: { timeout: 30_000 },
  reporter: process.env.CI ? [['junit', { outputFile: 'report.xml' }]] : 'html'
});
