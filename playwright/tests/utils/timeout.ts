import { Page } from '@playwright/test';

const timeout = process.env.CI ? 5_000 : 0;
export const wait = async (page: Page) => await page.waitForTimeout(timeout);
