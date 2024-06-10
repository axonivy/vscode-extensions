import { Locator, Page, expect } from '@playwright/test';

export class PageObject {
  constructor(readonly page: Page) {}

  async executeCommand(command: string, ...userInputs: Array<string>) {
    await expect(this.page.locator('div.command-center')).toBeAttached();
    await this.page.keyboard.press('F1');
    await expect(this.page.locator('.quick-input-list')).toBeVisible();
    await this.quickInputBox()
      .locator('input.input')
      .fill('>' + command);
    await this.page.locator(`.quick-input-list-entry:has-text("${command}")`).nth(0).click({ force: true });
    for (const userInput of userInputs) {
      this.provideUserInput(userInput);
    }
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

  async hasDeployProjectStatusMessage(timeout?: number) {
    await this.hasStatusMessage('Finished: Deploy Ivy Projects', timeout);
  }

  async hasNoStatusMessage() {
    await expect(this.page.locator('#status\\.extensionMessage')).toBeHidden();
  }

  async hasAnyStatusMessage() {
    await expect(this.page.locator('#status\\.extensionMessage')).toBeVisible();
  }

  async provideUserInput(input?: string) {
    if (input) {
      await this.quickInputBox().locator('input.input').fill(input);
    }
    await this.quickInputBox().click({ delay: 100 });
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

  async saveAllFiles() {
    const dirtyLocator = this.page.locator('div.dirty');
    if (await dirtyLocator.isHidden()) {
      return;
    }
    await expect(async () => {
      if (await dirtyLocator.isVisible()) {
        await this.executeCommand('File: Save All Files');
      }
      expect(await dirtyLocator.isHidden()).toBeTruthy();
    }).toPass();
  }

  async activeEditorHasText(text: string) {
    await expect(this.page.locator('div.editor-container')).toContainText(text);
  }
}
