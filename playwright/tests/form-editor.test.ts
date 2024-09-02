import { expect } from 'playwright/test';
import { prebuiltWorkspacePath, randomArtefactName } from './workspaces/workspace';
import { Page } from '@playwright/test';
import { FormEditor } from './page-objects/form-editor';
import { test } from './fixtures/page';

test.describe('Form Editor', () => {
  let editor: FormEditor;
  let page: Page;

  test.beforeEach(async ({ pageFor }) => {
    page = await pageFor(prebuiltWorkspacePath);
    editor = new FormEditor(page);
    await editor.hasDeployProjectStatusMessage();
    await editor.openEditorFile();
    await editor.isViewVisible();
  });

  test('Open Form editor', async () => {
    const text = editor.locatorFor('.block-text');
    await expect(text).toBeVisible();
    await expect(text).toHaveText('This is my test');
    await editor.isNotDirty();
  });

  test('Edit input label', async () => {
    const input = editor.locatorFor('.block-input');
    await input.dblclick();
    const labelProperty = editor.locatorFor('#properties .ui-input').first();
    const newLabel = randomArtefactName();
    await labelProperty.fill(newLabel);
    await expect(input).toHaveText(newLabel);
    await editor.isDirty();
    await editor.saveAllFiles();
    await editor.isNotDirty();
    const xhtmlEditor = new FormEditor(page, 'testForm.xhtml');
    await xhtmlEditor.openEditorFile();
    await xhtmlEditor.isTabVisible();
    await xhtmlEditor.activeEditorHasText(`value="${newLabel}" />`);
    await xhtmlEditor.revertAndCloseEditor();
  });
});
