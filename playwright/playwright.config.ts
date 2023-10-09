import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    screenshot: 'on',
    trace: 'retain-on-failure'
  }
});
