import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'junit' : 'html',
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:3000/mock.html',
    trace: 'on-first-retry',
    headless: process.env.CI ? true : false
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox']
      }
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari']
      }
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'yarn start:mock',
    url: 'http://localhost:3000/mock.html',
    reuseExistingServer: !process.env.CI
  }
};

export default config;
