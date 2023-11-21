import { Page, expect } from '@playwright/test';
import { View, ViewData } from './view';
import { getCtrlOrMeta } from '../utils/keyboard';

export class Editor extends View {
  constructor(private readonly editorFile: string, viewData: ViewData, page: Page) {
    super(viewData, page);
  }

  async openEditorFile() {
    await this.page.keyboard.press(getCtrlOrMeta() + '+KeyP');
    await this.page.keyboard.insertText(this.editorFile);
    await this.page.locator(`div.quick-input-list-entry.has-actions:has-text("${this.editorFile}")`).first().click();
  }

  async revertAndCloseEditor() {
    if (await this.tabLocator.isVisible()) {
      await this.tabLocator.click();
      await this.executeCommand('View: Revert and Close Editor');
    }
    await expect(this.tabLocator).toBeHidden();
  }
}
