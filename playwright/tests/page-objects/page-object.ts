import { Page, expect } from '@playwright/test';
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
}
