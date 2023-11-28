import { Locator, Page, expect } from '@playwright/test';

export class PageObject {
  constructor(readonly page: Page) {}

  async executeCommand(command: string) {
    await expect(this.page.locator('div.command-center')).toBeAttached();
    await this.page.keyboard.press('F1');
    await expect(this.page.locator('.quick-input-list')).toBeVisible();
    await this.quickInputBox()
      .locator('input.input')
      .fill('>' + command);
    await this.page.locator(`.focused .quick-input-list-entry:has-text("${command}")`).click();
    await expect(this.page.locator('.quick-input-list')).not.toBeVisible();
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
    if (input) {
      await this.quickInputBox().locator('input.input').fill(input);
    }
    await this.quickInputBox().press('Enter');
  }

  async closeAllTabs() {
    await this.executeCommand('View: Close All Editor Groups');
    await expect(this.page.locator('div.tab')).toBeHidden();
  }

  async isTabWithNameVisible(name: string) {
    const tabSelector = `div.tab:has-text("${name}")`;
    await expect(this.page.locator(tabSelector)).toBeVisible();
  }

  async typeText(text: string, delay = 5) {
    await this.page.keyboard.type(text, { delay });
  }

  quickInputBox(): Locator {
    return this.page.locator('div.quick-input-box');
  }
}
