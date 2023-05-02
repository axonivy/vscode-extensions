import { test, expect } from '@playwright/test';

test.describe('Dialog Starts', () => {
  test('change will update mapping tree', async ({ page }) => {
    await page.goto('');
    await page.getByRole('tab', { name: 'Call' }).click();
    const dialog = page.getByLabel('Dialog');
    await dialog.fill('Acc');
    await page.getByRole('option', { name: 'AcceptRequest' }).first().click();
    await expect(page.getByRole('row')).toHaveCount(3);

    await dialog.fill('test');
    await page.getByRole('option', { name: 'test1' }).click();
    await expect(page.getByRole('row')).toHaveCount(1);
  });
});
