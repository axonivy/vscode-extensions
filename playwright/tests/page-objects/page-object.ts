import { Locator, Page, expect } from '@playwright/test';
import { executeCommand } from '../utils/command';

export abstract class PageObject {
  constructor(readonly page: Page) {}

  async executeCommand(command: string): Promise<void> {
    await executeCommand(this.page, command);
  }

  async isAxonIvyActionItemChecked() {
    await this.isActionItemChecked('Axon Ivy');
  }

  async isActionItemChecked(label: string) {
    await expect(this.page.locator('li.action-item.checked').getByLabel(label).first()).toBeVisible();
  }

  async showAxonIvyContainer() {
    await this.page.locator('li.action-item').getByLabel('Axon Ivy').first().click();
    await this.isAxonIvyActionItemChecked();
  }

  async isNotificationVisible(title: string): Promise<void> {
    const notification = this.notificationLocator(title);
    await expect(notification).toBeVisible();
  }

  async awaitNotification(title: string): Promise<void> {
    const notification = this.notificationLocator(title);
    await expect(notification).toBeVisible();
    await expect(notification).toBeHidden();
  }

  private notificationLocator(title: string): Locator {
    return this.page.locator(`div.notification-list-item-message:has-text("${title}")`);
  }

  async provideUserInput(input?: string): Promise<void> {
    await this.page.locator('.quick-input-widget').focus();
    if (input) {
      await this.page.keyboard.type(input);
    }
    await this.page.keyboard.press('Enter');
  }
}
