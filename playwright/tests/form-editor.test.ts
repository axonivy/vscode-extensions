import { expect, test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { prebuiltWorkspacePath, randomArtefactName } from './workspaces/workspace';
import { Page } from '@playwright/test';
import { FormEditor } from './page-objects/form-editor';
import { BrowserView } from './page-objects/browser-view';

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
    await input.dblclick();
    const labelProperty = editor.locatorFor('#properties').getByLabel('Label');
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

  test('Open Help', async () => {
    const browserView = new BrowserView(page);
    await editor.locatorFor('.block-input').dblclick();
    const inscriptionView = editor.locatorFor('#properties');
    await inscriptionView.getByRole('button', { name: /Help/ }).click();
    expect((await browserView.input().inputValue()).toString()).toMatch(
      /^https:\/\/developer\.axonivy\.com.*user-dialogs\/form-editor\.html$/
    );
  });
});
