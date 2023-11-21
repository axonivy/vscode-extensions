import { Page, expect } from '@playwright/test';
import { executeCommand } from '../utils/command';

export abstract class PageObject {
  constructor(readonly page: Page) {}

  async executeCommand(command: string) {
    await executeCommand(this.page, command);
  }

  async isExplorerActionItemChecked() {
    await this.isActionItemChecked('Explorer');
  }

  async isActionItemChecked(label: string) {
    await expect(this.page.locator('li.action-item.checked').getByLabel(label).first()).toBeVisible();
  }

  async hasStatusMessage(message: string, timeout?: number) {
    await expect(this.page.locator('#status\\.extensionMessage')).toHaveText(message, { timeout });
  }

  async provideUserInput(input?: string) {
    await this.page.locator('.quick-input-widget').focus();
    if (input) {
      await this.page.keyboard.type(input);
    }
    await this.page.keyboard.press('Enter');
  }
}
