import { Page } from 'playwright-core';
import { ViewData } from './view';
import { expect } from 'playwright/test';
import { Editor } from './editor';

export class FormEditor extends Editor {
  constructor(page: Page, editorFile: string = 'testForm.f.json') {
    const outputViewData: ViewData = {
      tabSelector: `div.tab:has-text("${editorFile}")`,
      viewSelector: 'body > div > div[data-parent-flow-to-element-id] >> visible = true'
    };
    super(editorFile, outputViewData, page);
  }

  override async isViewVisible() {
    await this.isTabVisible();
    const graph = this.viewFrameLoactor().locator('#canvas');
    await expect(graph).toBeVisible();
  }

  locatorFor(type: string) {
    return this.viewFrameLoactor().locator(type);
  }

  get toolbar() {
    return this.viewFrameLoactor().locator('.toolbar');
  }
}
