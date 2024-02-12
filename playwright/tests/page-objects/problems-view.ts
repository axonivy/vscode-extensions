import { Page, expect } from '@playwright/test';
import { View, ViewData } from './view';

const problemsViewData: ViewData = {
  tabSelector: 'li.action-item:has-text("Problems")',
  viewSelector: 'div.markers-panel-container'
};

export class ProblemsView extends View {
  constructor(page: Page) {
    super(problemsViewData, page);
  }

  static async initProblemsView(page: Page) {
    const problemsView = new ProblemsView(page);
    await problemsView.tabLocator.click();
    await problemsView.isChecked();
    return problemsView;
  }

  private async hasMaker(message: string, type: 'error' | 'warning') {
    const marker = this.viewLocator.locator(`div.monaco-tl-row:has-text("${message}")`);
    await expect(marker).toBeVisible();
    await expect(marker.locator(`div.marker-icon.${type}`)).toBeVisible();
  }

  async hasWarning(message: string) {
    this.hasMaker(message, 'warning');
  }

  async hasError(message: string) {
    this.hasMaker(message, 'error');
  }
}
