import { Locator, Page } from 'playwright-core';
import { ViewData } from './view';
import { expect } from 'playwright/test';
import { Editor } from './editor';

export class ProcessEditor extends Editor {
  constructor(page: Page, editorFile: string = 'ProcurementRequestUserTask.p.json') {
    const outputViewData: ViewData = {
      tabSelector: `div.tab:has-text("${editorFile}")`,
      viewSelector: 'body > div > div[data-parent-flow-to-element-id] >> visible = true'
    };
    super(editorFile, outputViewData, page);
  }

  override async isViewVisible(): Promise<void> {
    await this.isTabVisible();
    const graph = this.viewFrameLoactor().locator('.sprotty-graph');
    await expect(graph).toBeVisible();
  }

  locatorForPID(pid: string): Locator {
    return this.viewFrameLoactor().locator(`[id$="_${pid}"]`);
  }

  async typeText(text: string): Promise<void> {
    await this.page.keyboard.type(text);
  }
}
