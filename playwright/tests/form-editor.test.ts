import { expect, test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { prebuiltWorkspacePath } from './workspaces/workspace';
import { Page } from '@playwright/test';
import { FormEditor } from './page-objects/form-editor';

test.describe('Form Editor', () => {
  let editor: FormEditor;
  let page: Page;

  test.beforeAll(async ({}, testInfo) => {
    page = await pageFor(prebuiltWorkspacePath, testInfo.titlePath[1]);
    editor = new FormEditor(page);
    await editor.hasDeployProjectStatusMessage();
  });

  test.beforeEach(async () => {
    await editor.openEditorFile();
    await editor.isViewVisible();
  });

  test.afterEach(async () => {
    await editor.revertAndCloseEditor();
  });

  test('Open Form editor', async () => {
    const text = editor.locatorFor('.block-text');
    await expect(text).toBeVisible();
    await expect(text).toHaveText('This is my test');
    await editor.isNotDirty();
  });
});
