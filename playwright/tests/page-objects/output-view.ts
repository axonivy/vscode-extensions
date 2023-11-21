import { Page, expect } from '@playwright/test';
import { View, ViewData } from './view';

const outputViewData: ViewData = {
  tabSelector: 'li.action-item:has-text("Output")',
  viewSelector: 'div.output-view'
};

export class OutputView extends View {
  constructor(page: Page) {
    super(outputViewData, page);
  }

  async checkIfEngineStarted() {
    const expectedText = "Type 'shutdown' and confirm";
    await expect(async () => {
      await expect(this.viewLocator).toContainText(expectedText);
    }).toPass();
  }
}
