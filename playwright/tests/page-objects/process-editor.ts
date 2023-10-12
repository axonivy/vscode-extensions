import { Locator, Page } from 'playwright-core';
import { ViewData } from './view';
import { getCtrlOrMeta } from '../utils/keyboard';
import { expect } from 'playwright/test';
import { IFrameView } from './iframe-view';

export class ProcessEditor extends IFrameView {
  constructor(page: Page, private filePath: string = 'ProcurementRequestUserTask.p.json') {
    const outputViewData: ViewData = {
      tabSelector: `div.tab:has-text("${filePath}")`,
      viewSelector: 'body > div > div[data-parent-flow-to-element-id] >> visible = true'
    };
    super(outputViewData, page);
  }

  async openProcess(): Promise<void> {
    await this.page.keyboard.press(getCtrlOrMeta() + '+KeyP');
    await this.page.keyboard.insertText(this.filePath);
    await this.page.locator(`div.quick-input-list-entry.has-actions:has-text("${this.filePath}")`).click();
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
