import { test, expect, Page } from '@playwright/test';
import { pageFor } from './fixtures/page';
import { ProcessEditor } from './page-objects/process-editor';
import { animationWorkspacePath } from './workspaces/workspace';
import { FileExplorer } from './page-objects/explorer-view';

test.describe('Process Animation', () => {
  let page: Page;

  test.beforeAll(async ({}, testInfo) => {
    page = await pageFor(animationWorkspacePath, testInfo.titlePath[1]);
    await new FileExplorer(page).hasDeployProjectStatusMessage();
  });

  test('with activated animation', async () => {
    test.skip(process.platform === 'win32');
    const processEditor = new ProcessEditor(page, 'Animation.p.json');
    await processEditor.openEditorFile();
    const start = processEditor.locatorForPID('190EEC366DECC66A-f0');
    await expect(start).toBeVisible();

    await processEditor.executeCommand('Axon Ivy: Activate Process Animation');
    await processEditor.page.waitForTimeout(2_000); // ensure config is respected
    const taskInCallSub = processEditor.locatorForPID('190EEC3ABECE2C88-f5');
    await processEditor.startProcessAndAssertExecuted(start, taskInCallSub);
    await processEditor.page.waitForTimeout(500); //ensure animation finished
  });

  test('with deactivated animation', async () => {
    const processEditor = new ProcessEditor(page, 'NoAnimation.p.json');
    await processEditor.openEditorFile();
    const start = processEditor.locatorForPID('191A2645F90CDC61-f0');
    await expect(start).toBeVisible();

    await processEditor.executeCommand('Axon Ivy: Deactivate Process Animation');
    await processEditor.page.waitForTimeout(2_000); // ensure config is respected
    const callSub = processEditor.locatorForPID('191A2645F90CDC61-f3');
    await processEditor.startProcessAndAssertExecuted(start, callSub);
    await processEditor.page.waitForTimeout(1_000); // to ensure no jump
    await expect(callSub).toBeVisible();
  });
});
