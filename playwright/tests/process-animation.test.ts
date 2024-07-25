import { ProcessEditor } from './page-objects/process-editor';
import { prebuiltWorkspacePath } from './workspaces/workspace';
import { pageFor } from './fixtures/page';
import { test } from '@playwright/test';

test.describe('Process Animation', () => {
  let processEditor: ProcessEditor;

  test.beforeAll(async ({}, testInfo) => {
    const page = await pageFor(prebuiltWorkspacePath, testInfo.titlePath[1]);
    processEditor = new ProcessEditor(page, 'Animation.p.json');
    await processEditor.hasDeployProjectStatusMessage();
  });

  test.beforeEach(async () => {
    await processEditor.openEditorFile();
    await processEditor.isViewVisible();
  });

  test('Animate Call Sub', async () => {
    const start = processEditor.locatorForPID('190E9B4311474684-f0');
    const scriptInCallSub = processEditor.locatorForPID('190E938617AE0413-f3');
    await processEditor.startProcessAndAssertExecuted(start, scriptInCallSub);
  });
});
