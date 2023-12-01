import { Locator, Page, expect } from '@playwright/test';
import { ViewData } from './view';
import { Editor } from './editor';

export class VariablesEditor extends Editor {
  constructor(page: Page, editorFile = 'variables.yaml') {
    const outputViewData: ViewData = {
      tabSelector: `div.tab:has-text("${editorFile}")`,
      viewSelector: 'body > div > div[data-parent-flow-to-element-id] >> visible = true'
    };
    super(editorFile, outputViewData, page);
  }

  override async isViewVisible() {
    const header = this.viewFrameLoactor().locator('vscode-data-grid-cell:has-text("Key")');
    await expect(header).toBeVisible();
  }

  async hasKey(key: string) {
    const field = this.viewFrameLoactor().locator(`vscode-text-field[grid-column="1"][current-value="${key}"]`);
    await expect(field).toBeVisible();
  }

  async hasValue(value: string) {
    const field = this.viewFrameLoactor().locator(`vscode-text-field[grid-column="2"][current-value="${value}"]`);
    await expect(field).toBeVisible();
  }

  entries(): Locator {
    return this.viewFrameLoactor().locator('vscode-text-field');
  }

  async add(key: string, value: string) {
    await this.clickButton('Add');
    const keyField = this.viewFrameLoactor().locator('vscode-text-field[grid-column="1"][current-value=""]');
    await keyField.click({ delay: 300 });
    await this.typeText(key, 100);

    const valueField = this.viewFrameLoactor().locator('vscode-text-field[grid-column="2"][current-value=""]').locator('input');
    await valueField.click({ delay: 300 });
    await this.typeText(value, 100);
  }

  async addParentNode(parent: string) {
    await this.clickButton('Add Parent Node');
    const keyField = this.viewFrameLoactor().locator('vscode-text-field[grid-column="1"][current-value=""]').locator('input');
    await keyField.fill(parent);
  }

  async clickButton(label: string) {
    const button = this.viewFrameLoactor().locator(`vscode-button[aria-label="${label}"]`).last();
    await button.click();
  }
}
