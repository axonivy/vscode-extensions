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

  cellInsideTable(tableCount: number, cellCount: number): Locator {
    const firstTable = this.parent.getByRole('table').nth(tableCount);
    return firstTable.getByRole('cell').nth(cellCount);
  }

  async clickButton(label: string) {
    await this.parent.getByRole('button', { name: label }).click();
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
    await contentAssist.getByText(expectedCompletion, { exact: true }).locator('span.highlight').click();
    await expect(contentAssist).toBeHidden();
  }

  monacoContentAssist(): Locator {
    return this.parent.locator('div.editor-widget.suggest-widget');
  }
}
