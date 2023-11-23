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

  async closeAllTabs() {
    await executeCommand(this.page, 'view: close all editor groups');
    await expect(this.page.locator('div.tab')).toBeHidden();
  }

  async isFileTabVisible(fileName: string) {
    const tabSelector = `div.tab:has-text("${fileName}")`;
    await expect(this.page.locator(tabSelector)).toBeVisible();
  }
}
