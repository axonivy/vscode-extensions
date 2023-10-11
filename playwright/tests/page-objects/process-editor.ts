import { Locator, Page } from 'playwright-core';
import { View, ViewData } from './view';
import { getCtrlOrMeta } from '../utils/keyboard';
import { expect } from 'playwright/test';
import { FrameLocator } from '@playwright/test';

export class ProcessEditor extends View {
  constructor(page: Page, private filePath: string = 'ProcurementRequestUserTask.p.json') {
    const outputViewData: ViewData = {
      tabSelector: `div.tab:has-text("${filePath}")`,
      viewSelector: 'div.editor-instance > div'
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
    const graph = (await this.viewFrameLoactor()).locator('.sprotty-graph');
    await expect(graph).toBeVisible();
  }

  async viewFrameLoactor(): Promise<FrameLocator> {
    await expect(this.page.locator('.monaco-breadcrumbs')).toContainText(this.filePath);
    await expect(this.viewLocator).toBeEnabled();
    await expect(this.viewLocator).toHaveAttribute('aria-flowto', /.*/);
    const flowtoId = await this.viewLocator.getAttribute('aria-flowto');
    return this.page.locator(`[id='${flowtoId}']`).frameLocator('iFrame').frameLocator('iFrame#active-frame');
  }

  async locatorForPID(pid: string): Promise<Locator> {
    return (await this.viewFrameLoactor()).locator(`[id$="_${pid}"]`);
  }

  async typeText(text: string): Promise<void> {
    await this.page.keyboard.type(text);
  }
}
