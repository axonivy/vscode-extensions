import { Locator, Page, expect } from '@playwright/test';
import { PageObject } from './page-object';

export class InscriptionView extends PageObject {
  constructor(page: Page, readonly parent: Locator) {
    super(page);
  }

  async assertViewVisible() {
    await expect(this.parent).toBeVisible();
  }

  header(): Locator {
    return this.parent.locator('.header-title');
  }

  accordionFor(name: string): Locator {
    return this.parent.locator(`.accordion-trigger:has-text("${name}")`);
  }

  inputFieldFor(label: string): Locator {
    return this.parent.getByLabel(label, { exact: true });
  }

  monacoEditor(): Locator {
    return this.parent.locator('.view-lines.monaco-mouse-cursor-text');
  }

  async triggerMonacoContentAssist() {
    await this.page.keyboard.press('Control+Space');
  }

  async writeToMonacoEditorWithCompletion(input: string, expectedCompletion: string) {
    await this.typeText(input);
    const contentAssist = this.monacoContentAssist();
    await expect(contentAssist).toBeVisible();
    await expect(contentAssist).toContainText(expectedCompletion);
    await this.page.keyboard.press('Enter');
  }

  monacoContentAssist(): Locator {
    return this.parent.locator('div.editor-widget.suggest-widget');
  }
}
