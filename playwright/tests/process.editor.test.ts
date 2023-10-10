import { expect } from 'playwright/test';
import { test, windowFor } from './fixtures/window';
import { ProcessEditor } from './page-objects/process-editor';
import { defaultWorkspacePath, userDialogPID } from './workspaces/workspace';
import { Page } from '@playwright/test';
import { executeCloseAllEditorGroupsCommand } from './utils/command';

test.describe('Process Editor', () => {
  let processEditor: ProcessEditor;
  let window: Page;

  test.beforeAll(async () => {
    window = await windowFor(defaultWorkspacePath, 'Process Editor');
  });

  test.beforeEach(async () => {
    processEditor = new ProcessEditor(window);
    await processEditor.openProcess();
    await processEditor.isViewVisible();
  });

  test.afterEach(async () => {
    await processEditor.undoChanges();
    await executeCloseAllEditorGroupsCommand(window);
  });

  test('Check if User Dialog is visible', async () => {
    const userDialog = processEditor.locatorForPID(userDialogPID);
    await expect(userDialog).toBeVisible();
    expect(await processEditor.isDirty()).toBe(false);
  });

  test('Change User Dialog position', async () => {
    const userDialog = processEditor.locatorForPID(userDialogPID);
    const boundingBoxBefore = await userDialog.boundingBox();
    expect(boundingBoxBefore).toBeDefined();
    await userDialog.dragTo(userDialog, { force: true, targetPosition: { x: 1, y: 1 } });

    const boundingBoxAfter = await userDialog.boundingBox();
    expect(boundingBoxAfter).toBeDefined();
    expect(boundingBoxAfter!.x).not.toBe(boundingBoxBefore!.x);
    expect(boundingBoxAfter!.y).not.toBe(boundingBoxBefore!.y);
    expect(await processEditor.isDirty()).toBe(true);
  });
});
