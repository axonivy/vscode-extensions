import { expect, test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { prebuiltWorkspacePath, randomArtefactName } from './workspaces/workspace';
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

  test('Edit input label', async () => {
    const input = editor.locatorFor('.block-input');
    await input.click();
    const labelProperty = editor.locatorFor('[id=":re:-input"]');
    const newLabel = randomArtefactName();
    await labelProperty.fill(newLabel);
    await expect(input).toHaveText(newLabel);
    await editor.isDirty();
    await editor.saveAllFiles();
    await editor.isNotDirty();
    const xhtmlEditor = new FormEditor(page, 'test.xhtml');
    await xhtmlEditor.openEditorFile();
    await xhtmlEditor.isTabVisible();
    await xhtmlEditor.activeEditorHasText(`value="${newLabel}" />`);
    await xhtmlEditor.revertAndCloseEditor();
  });
});
