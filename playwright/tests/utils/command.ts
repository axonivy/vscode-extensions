import { Page, expect } from '@playwright/test';

export async function executeCommand(page: Page, command: string): Promise<void> {
  await expect(page.locator('div.command-center')).toBeAttached();
  await page.keyboard.press('F1');
  await expect(page.locator('.quick-input-widget')).toBeVisible();
  await page.keyboard.insertText(command);
  await expect(page.locator('.quick-input-widget')).toContainText(command);
  await page.keyboard.press('Enter');
  await expect(page.locator('.quick-input-widget')).toBeHidden();
}

export async function executeCloseAllEditorGroupsCommand(page: Page) {
  await executeCommand(page, 'View: Close All Editor Groups');
}
