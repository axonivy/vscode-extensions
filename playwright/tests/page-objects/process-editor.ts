import { Page } from 'playwright-core';
import { ViewData } from './view';
import { expect } from 'playwright/test';
import { Editor } from './editor';
import { InscriptionView } from './inscription-view';
import { Locator } from '@playwright/test';

export class ProcessEditor extends Editor {
  constructor(page: Page, editorFile: string = 'ProcurementRequestUserTask.p.json') {
    const outputViewData: ViewData = {
      tabSelector: `div.tab:has-text("${editorFile}")`,
      viewSelector: 'body > div > div[data-parent-flow-to-element-id] >> visible = true'
    };
    super(editorFile, outputViewData, page);
  }

  override async isViewVisible() {
    await this.isTabVisible();
    const graph = this.viewFrameLoactor().locator('.sprotty-graph');
    await expect(graph).toBeVisible();
  }

  locatorForPID(pid: string) {
    return this.viewFrameLoactor().locator(`[id$="_${pid}"]`);
  }

  locatorForElementType(type: string) {
    return this.viewFrameLoactor().locator(type);
  }

  async typeText(text: string) {
    await this.page.keyboard.type(text);
  }

  async openInscriptionView(pid?: string) {
    if (pid) {
      await this.locatorForPID(pid).dblclick();
    } else {
      await this.viewFrameLoactor().locator('#btn_inscription_toggle').click();
    }
    const view = this.inscriptionView();
    await view.assertViewVisible();
    return view;
  }

  inscriptionView() {
    return new InscriptionView(this.page, this.viewFrameLoactor().locator('.inscription-ui-container'));
  }

  async startProcessAndAssertExecuted(startEvent: Locator, executedElement: Locator) {
    await startEvent.click();
    const playButton = this.viewFrameLoactor().locator('i.ivy.ivy-play');
    await playButton.click();
    await expect(executedElement).toHaveClass(/executed/, { timeout: 5_000 });
  }
}
