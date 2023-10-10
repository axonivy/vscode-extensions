import { FrameLocator, Locator, Page } from 'playwright-core';
import { View, ViewData } from './view';
import { getCtrlOrMeta } from '../utils/keyboard';
import { OutputView } from './output-view';
import { expect } from 'playwright/test';

export class ProcessEditor extends View {
  constructor(page: Page, private filePath: string = 'ProcurementRequestUserTask.p.json') {
    const outputViewData: ViewData = {
      tabSelector: `div.tab:has-text("${filePath}")`,
      viewSelector: 'div'
    };
    super(outputViewData, page);
  }

  async openProcess(): Promise<void> {
    const outputView = new OutputView(this.page);
    await outputView.checkIfEngineStarted();
    await this.page.keyboard.press(getCtrlOrMeta() + '+KeyP');
    await this.page.keyboard.insertText(this.filePath);
    await this.page.keyboard.press('Enter');
  }

  override async isViewVisible(): Promise<void> {
    await this.isTabVisible();
    const graph = this.viewFrameLoactor().locator('.sprotty-graph');
    await expect(graph).toBeVisible();
  }

  protected viewFrameLoactor(): FrameLocator {
    return this.viewLocator.frameLocator('iFrame').frameLocator('iFrame#active-frame');
  }

  locatorForPID(pid: string): Locator {
    return this.viewFrameLoactor().locator(`[id$="_${pid}"]`);
  }

  async isDirty(): Promise<boolean> {
    return this.elementContainsClass(await this.tabElement(), 'dirty');
  }

  async undoChanges(): Promise<void> {
    while (await this.isDirty()) {
      await this.tabLocator.click();
      await this.page.keyboard.press(getCtrlOrMeta() + '+KeyY');
    }
  }
}
