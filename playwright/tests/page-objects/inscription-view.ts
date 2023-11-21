import { Locator, Page, expect } from '@playwright/test';

export class InscriptionView {
  constructor(readonly page: Page, readonly parent: Locator) {}

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
    await this.page.keyboard.type(input);
    const contentAssist = this.monacoContentAssist();
    await expect(contentAssist).toBeVisible();
    await expect(contentAssist).toContainText(expectedCompletion);
    await this.page.keyboard.press('Enter');
  }

  monacoContentAssist(): Locator {
    return this.parent.locator('div.editor-widget.suggest-widget');
  }
}
