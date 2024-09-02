import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    headless: process.env.CI ? true : false,
    permissions: ['clipboard-read'],
    trace: 'retain-on-failure'
  },
  testDir: './tests',
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['junit', { outputFile: 'report.xml' }]] : 'html'
});
