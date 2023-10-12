import { Locator, Page, expect } from '@playwright/test';
import { PageObject } from './page-object';

export interface ViewData {
  tabSelector: string;
  viewSelector: string;
}

export class View extends PageObject {
  constructor(private readonly data: ViewData, page: Page) {
    super(page);
  }

  get tabLocator(): Locator {
    return this.page.locator(this.data.tabSelector);
  }

  get viewLocator(): Locator {
    return this.page.locator(this.data.viewSelector);
  }

  async isTabVisible(): Promise<void> {
    await expect(this.tabLocator).toBeVisible();
  }

  async isViewVisible(): Promise<void> {
    await expect(this.viewLocator).toBeVisible();
  }

  async isActive(): Promise<void> {
    await expect(this.tabLocator).toHaveClass(/checked/);
  }

  async isDirty(): Promise<void> {
    await expect(this.tabLocator).toHaveClass(/dirty/);
  }

  async isNotDirty(): Promise<void> {
    await expect(this.tabLocator).not.toHaveClass(/dirty/);
  }

  async revertAndCloseEditor(): Promise<void> {
    await this.tabLocator.click();
    await this.executeCommand('View: Revert and Close Editor');
    await expect(this.tabLocator).toBeHidden();
  }
}
