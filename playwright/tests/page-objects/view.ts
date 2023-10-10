import { ElementHandle, Locator, Page, expect } from '@playwright/test';
import { PageObject } from './page-object';

export interface ViewData {
  tabSelector: string;
  viewSelector: string;
  viewName?: string;
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

  protected tabElement(): Promise<ElementHandle<SVGElement | HTMLElement> | null> {
    return this.page.$(this.data.tabSelector);
  }

  protected async elementContainsClass(
    element: ElementHandle<SVGElement | HTMLElement> | null | undefined,
    cssClass: string
  ): Promise<boolean> {
    if (element) {
      const classValue = await element.getAttribute('class');
      if (classValue) {
        return classValue?.split(' ').includes(cssClass);
      }
    }
    return false;
  }
}
