import { Page, expect, Locator } from '@playwright/test';
import { View, ViewData } from './view';

export abstract class ExplorerView extends View {
  constructor(private viewName: string, page: Page) {
    const data: ViewData = {
      tabSelector: `div.pane-header:has-text("${viewName}")`,
      viewSelector: ''
    };
    super(data, page);
  }

  override get viewLocator(): Locator {
    return this.page.getByRole('tree', { name: this.viewName });
  }

  async isHidden(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.tabLocator).toBeHidden();
  }

  async openView(): Promise<void> {
    if (!(await this.page.locator(`${this.data.tabSelector}.expanded`).isVisible())) {
      await this.tabLocator.click();
    }
    await expect(this.viewLocator).toBeVisible();
  }

  async closeView(): Promise<void> {
    if (await this.page.locator(`${this.data.tabSelector}.expanded`).isVisible()) {
      await this.tabLocator.click();
    }
    await expect(this.viewLocator).toBeHidden();
  }

  async hasNode(name: string): Promise<void> {
    const node = this.viewLocator.getByText(name);
    await expect(node).toBeVisible();
  }

  async hasNoNode(name: string): Promise<void> {
    const node = this.viewLocator.getByText(name);
    await expect(node).not.toBeAttached();
  }
}

export class ProjectExplorerView extends ExplorerView {
  constructor(page: Page) {
    super('Axon Ivy Projects', page);
  }
}

export class OutlineExplorerView extends ExplorerView {
  constructor(page: Page) {
    super('Process Outline', page);
  }

  async selectNode(name: string): Promise<void> {
    await this.viewLocator.getByText(name).click();
    await this.isSelected(name);
  }

  async isSelected(name: string): Promise<void> {
    const selected = this.viewLocator.locator('.monaco-list-row.selected');
    await expect(selected).toContainText(name);
  }

  async doubleClickExpandable(name: string): Promise<void> {
    await this.viewLocator.getByText(name).dblclick();
  }
}
