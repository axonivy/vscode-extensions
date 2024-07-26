import { expect, test } from '@playwright/test';
import { pageFor } from './fixtures/page';
import { ProcessEditor } from './page-objects/process-editor';
import { animationWorkspacePath } from './workspaces/workspace';

test.describe('Process Animation', () => {
  let processEditor: ProcessEditor;

  test.beforeEach(async ({}, testInfo) => {
    const page = await pageFor(animationWorkspacePath, testInfo.titlePath[1]);
    processEditor = new ProcessEditor(page, 'Animation.p.json');
    await processEditor.hasDeployProjectStatusMessage();
    await processEditor.openEditorFile();
    await processEditor.isViewVisible();
  });

  test.afterEach(async () => {
    await processEditor.closeAllTabs();
  });

  test('with activated animation', async () => {
    await processEditor.executeCommand('Axon Ivy: Activate Process Animation');
    const start = processEditor.locatorForPID('190EEC366DECC66A-f0');
    const scriptInCallSub = processEditor.locatorForPID('190EEC3ABECE2C88-f3');
    await processEditor.startProcessAndAssertExecuted(start, scriptInCallSub);
  });

  test('with deactivated animation', async () => {
    await processEditor.executeCommand('Axon Ivy: Deactivate Process Animation');
    const start = processEditor.locatorForPID('190EEC366DECC66A-f0');
    const callSub = processEditor.locatorForPID('190EEC366DECC66A-f3');
    await processEditor.startProcessAndAssertExecuted(start, callSub);
    await processEditor.page.waitForTimeout(500); // to ensure no jump
    await expect(callSub).toBeVisible();
  });
});
