import { Page, expect, test } from '@playwright/test';
import { pageFor } from './fixtures/page';
import { prebuiltWorkspacePath } from './workspaces/workspace';
import { BrowserView } from './page-objects/browser-view';

test.describe('Browser View', () => {
  let page: Page;
  let browserView: BrowserView;

  test.beforeAll(async ({}, testInfo) => {
    page = await pageFor(prebuiltWorkspacePath, testInfo.titlePath[1]);
    browserView = new BrowserView(page);
    await browserView.hasDeployProjectStatusMessage();
  });

  test('Toolbar', async () => {
    const home = /home.xhtml/;
    const starts = /starts.xhtml/;
    await browserView.openDevWfUi();
    await assertToolbarInput(/dev-workflow-ui/);

    await browserView.home().click();
    await assertToolbarInput(home);

    const startLink = browserView.content().locator('#menuform\\:sr_starts');
    await expect(startLink).toBeVisible();
    await browserView.content().locator('#menuform\\:sr_starts').click();
    await assertToolbarInput(starts);

    await browserView.reload().click({ clickCount: 2 });
    await assertToolbarInput(starts);

    await browserView.back().click();
    await assertToolbarInput(starts);

    await browserView.back().click();
    await assertToolbarInput(home);

    await browserView.forward().click();
    await assertToolbarInput(starts);
  });

  test('Open Engine Cockpit', async () => {
    await browserView.openCockpit();
    await assertToolbarInput(/system\/engine-cockpit/);
  });

  test('Open NEO', async () => {
    await browserView.openNEO();
    await assertToolbarInput(/neo/);
  });

  async function assertToolbarInput(value: RegExp) {
    await expect(browserView.input()).toHaveValue(value);
  }
});
