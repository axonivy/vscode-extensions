import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    headless: process.env.CI ? true : false,
    permissions: ['clipboard-read'],
    trace: 'retain-on-failure'
  },
  testDir: './tests',
  workers: 1,
  retries: 0,
  timeout: 60 * 1000,
  expect: { timeout: 30 * 1000 },
  reporter: process.env.CI ? [['junit', { outputFile: 'report.xml' }]] : 'html'
});
