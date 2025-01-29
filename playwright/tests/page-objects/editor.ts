import { Page, expect } from '@playwright/test';
import { View, ViewData } from './view';
import { getCtrlOrMeta } from '../utils/keyboard';

export class Editor extends View {
  constructor(
    private readonly editorFile: string,
    viewData: ViewData,
    page: Page
  ) {
    super(viewData, page);
  }

  async openEditorFile() {
    await this.page.keyboard.press(getCtrlOrMeta() + '+KeyP');
    await this.quickInputBox().locator('input.input').fill(this.editorFile);
    await this.page.locator('span.monaco-icon-name-container').getByText(this.editorFile).first().click();
  }

  async revertAndCloseEditor() {
    if (await this.tabLocator.isVisible()) {
      await this.tabLocator.click({ delay: 500 });
      await this.executeCommand('View: Revert and Close Editor');
    }
    await expect(this.tabLocator).toBeHidden();
  }
}
