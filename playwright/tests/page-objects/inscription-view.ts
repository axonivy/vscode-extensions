import { Locator, Page, expect } from '@playwright/test';
import { ViewData } from './view';
import { IFrameView } from './iframe-view';

export class InscriptionView extends IFrameView {
  constructor(page: Page) {
    const outputViewData: ViewData = {
      tabSelector: 'li.action-item:has-text("INSCRIPTION")',
      viewSelector: 'body > div > div:not([data-parent-flow-to-element-id]) >> visible = true'
    };
    super(outputViewData, page);
  }

  override async isViewVisible(): Promise<void> {
    await expect(this.viewFrameLoactor().locator('.editor-root')).toBeVisible();
  }

  header(): Locator {
    return this.viewFrameLoactor().locator('.header-title');
  }

  accordionFor(name: string): Locator {
    return this.viewFrameLoactor().locator(`.accordion-trigger:has-text("${name}")`);
  }

  inputFieldFor(label: string): Locator {
    return this.viewFrameLoactor().getByLabel(label, { exact: true });
  }

  monacoEditor(): Locator {
    return this.viewFrameLoactor().locator('.view-lines.monaco-mouse-cursor-text');
  }

  async triggerMonacoContentAssist(): Promise<void> {
    await this.page.keyboard.press('Control+Space');
  }

  async writeToMonacoEditorWithCompletion(input: string, expectedCompletion: string): Promise<void> {
    await this.page.keyboard.type(input);
    const contentAssist = this.monacoContentAssist();
    await expect(contentAssist).toBeVisible();
    await expect(contentAssist).toContainText(expectedCompletion);
    await this.page.keyboard.press('Enter');
  }

  monacoContentAssist(): Locator {
    return this.viewFrameLoactor().locator('div.editor-widget.suggest-widget');
  }
}
