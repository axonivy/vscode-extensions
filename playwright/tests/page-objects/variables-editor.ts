import { Locator, Page, expect } from '@playwright/test';
import { ViewData } from './view';
import { Editor } from './editor';

export class VariablesEditor extends Editor {
  constructor(page: Page, editorFile: string = 'variables.yaml') {
    const outputViewData: ViewData = {
      tabSelector: `div.tab:has-text("${editorFile}")`,
      viewSelector: 'body > div > div[data-parent-flow-to-element-id] >> visible = true'
    };
    super(editorFile, outputViewData, page);
  }

  override async isViewVisible(): Promise<void> {
    const header = this.viewFrameLoactor().locator('vscode-data-grid-cell:has-text("Key")');
    await expect(header).toBeVisible();
  }

  async hasKey(key: string): Promise<void> {
    const field = this.viewFrameLoactor().locator(`vscode-text-field[grid-column="1"][current-value="${key}"]`);
    await expect(field).toBeVisible();
  }

  async hasValue(value: string): Promise<void> {
    const field = this.viewFrameLoactor().locator(`vscode-text-field[grid-column="2"][current-value="${value}"]`);
    await expect(field).toBeVisible();
  }

  entries(): Locator {
    return this.viewFrameLoactor().locator('vscode-text-field');
  }

  async add(key: string, value: string): Promise<void> {
    await this.clickButton('Add');
    const keyField = this.viewFrameLoactor().locator('vscode-text-field[grid-column="1"][current-value=""]');
    await keyField.click({ delay: 100 });
    await expect(keyField).toBeFocused();
    await this.typeText(key);

    const valueField = this.viewFrameLoactor().locator('vscode-text-field[grid-column="2"][current-value=""]');
    await valueField.click({ delay: 100 });
    await expect(valueField).toBeFocused();
    await this.typeText(value);
  }

  async addParentNode(parent: string): Promise<void> {
    await this.clickButton('Add Parent Node');
    const keyField = this.viewFrameLoactor().locator('vscode-text-field[grid-column="1"][current-value=""]');
    await keyField.click({ delay: 100 });
    await expect(keyField).toBeFocused();
    await this.typeText(parent);
  }

  async clickButton(label: string): Promise<void> {
    const button = this.viewFrameLoactor().locator(`vscode-button[aria-label="${label}"]`).last();
    await button.click();
  }

  async typeText(text: string): Promise<void> {
    await this.page.keyboard.type(text, { delay: 100 });
  }
}
