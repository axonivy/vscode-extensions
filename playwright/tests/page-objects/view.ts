import { Locator, Page, expect } from '@playwright/test';
import { PageObject } from './page-object';

export interface ViewData {
  tabSelector: string;
  viewSelector: string;
  viewName?: string;
}

export class View extends PageObject {
  constructor(private data: ViewData, page: Page) {
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
}
