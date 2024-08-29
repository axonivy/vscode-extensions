import { expect, Locator } from '@playwright/test';
import { test } from './fixtures/page';
import { ProcessEditor } from './page-objects/process-editor';
import { animationWorkspacePath } from './workspaces/workspace';

test.describe('Process Animation', () => {
  let processEditor: ProcessEditor;
  let start: Locator;

  test.beforeEach(async ({ pageFor }) => {
    const page = await pageFor(animationWorkspacePath);
    processEditor = new ProcessEditor(page, 'Animation.p.json');
    start = processEditor.locatorForPID('190EEC366DECC66A-f0');
    await processEditor.openEditorFile();
    await processEditor.isViewVisible();
    await processEditor.hasDeployProjectStatusMessage();
  });

  test('with activated animation', async () => {
    await processEditor.executeCommand('Axon Ivy: Activate Process Animation');
    await processEditor.page.waitForTimeout(2_000); // ensure config is respected
    const scriptInCallSub = processEditor.locatorForPID('190EEC3ABECE2C88-f3');
    await processEditor.startProcessAndAssertExecuted(start, scriptInCallSub);
  });

  test('with deactivated animation', async () => {
    await processEditor.executeCommand('Axon Ivy: Deactivate Process Animation');
    await processEditor.page.waitForTimeout(2_000); // ensure config is respected
    const callSub = processEditor.locatorForPID('190EEC366DECC66A-f3');
    await processEditor.startProcessAndAssertExecuted(start, callSub);
    await processEditor.page.waitForTimeout(1_00); // to ensure no jump
    await expect(callSub).toBeVisible();
  });
});
