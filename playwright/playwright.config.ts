import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: 0,
  timeout: 60 * 1000,
  expect: { timeout: 30 * 1000 },
  reporter: process.env.CI ? [['junit', { outputFile: 'report.xml' }]] : 'html'
});
