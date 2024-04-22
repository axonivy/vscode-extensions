import { Page, expect } from '@playwright/test';
import { Editor } from './editor';
import { ViewData } from './view';

export class VariablesEditor extends Editor {
  constructor(page: Page, editorFile = 'variables.yaml') {
    const outputViewData: ViewData = {
      tabSelector: `div.tab:has-text("${editorFile}")`,
      viewSelector: 'body > div > div[data-parent-flow-to-element-id] >> visible = true'
    };
    super(editorFile, outputViewData, page);
  }

  override async isViewVisible() {
    const header = this.viewFrameLoactor().locator(
      "//div[contains(@class, 'master-toolbar')]/div/div[contains(text(), 'Variables Editor')]"
    );
    await expect(header).toBeVisible();
  }

  async hasKey(key: string) {
    const field = this.viewFrameLoactor().locator(`//td/div/span[contains(text(), '${key}')]`);
    await expect(field).toBeVisible();
  }

  async hasValue(value: string) {
    const field = this.viewFrameLoactor().locator(`//td/div[contains(text(), '${value}')]`);
    await expect(field).toBeVisible();
  }

  async selectFirstRow() {
    const firstRow = this.viewFrameLoactor().locator('//tbody/tr');
    await firstRow.click();
  }

  async editInput(oldValue: string, newValue: string) {
    const input = this.viewFrameLoactor().locator(`input[value='${oldValue}']`);
    await input.clear();
    await this.typeText(newValue);
  }
}
