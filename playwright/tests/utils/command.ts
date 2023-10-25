import { Page, expect } from '@playwright/test';

export async function executeCommand(page: Page, command: string): Promise<void> {
  await expect(page.locator('div.command-center')).toBeAttached();
  await page.keyboard.press('F1');
  await expect(page.locator('.quick-input-list')).toBeVisible();
  await page.keyboard.insertText(command);
  await page.locator(`.focused .quick-input-list-entry:has-text("${command}")`).click();
  await expect(page.locator('.quick-input-list')).not.toBeVisible();
}

export async function executeCloseAllEditorGroupsCommand(page: Page) {
  await executeCommand(page, 'View: Close All Editor Groups');
}
