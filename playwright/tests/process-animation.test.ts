import { test } from './fixtures/page';
import { ProcessEditor } from './page-objects/process-editor';
import { prebuiltWorkspacePath } from './workspaces/workspace';

test.describe('Process Animation', () => {
  test('Animate Call Sub', async ({ pageFor }) => {
    const page = await pageFor(prebuiltWorkspacePath);
    const processEditor = new ProcessEditor(page, 'Animation.p.json');
    await processEditor.hasDeployProjectStatusMessage();
    await processEditor.openEditorFile();
    await processEditor.isViewVisible();
    await processEditor.hasNoStatusMessage();

    const start = processEditor.locatorForPID('190E9B4311474684-f0');
    const scriptInCallSub = processEditor.locatorForPID('190E938617AE0413-f3');
    await processEditor.startProcessAndAssertExecuted(start, scriptInCallSub);
  });
});
