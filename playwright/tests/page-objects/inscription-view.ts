import { FrameLocator, Locator, Page, expect } from '@playwright/test';
import { View, ViewData } from './view';

export class InscriptionView extends View {
  constructor(page: Page) {
    const outputViewData: ViewData = {
      tabSelector: 'li.action-item:has-text("IVY")',
      viewSelector: 'div'
    };
    super(outputViewData, page);
  }

  protected viewFrameLoactor(): FrameLocator {
    return this.viewLocator.frameLocator('iFrame').nth(1).frameLocator('iFrame');
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
