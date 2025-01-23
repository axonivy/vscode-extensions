import { test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { ProcessEditor } from './page-objects/process-editor';
import { prebuiltWorkspacePath } from './workspaces/workspace';
import { Page } from '@playwright/test';
import { FormEditor } from './page-objects/form-editor';

let processEditor: ProcessEditor;
let formEditor: FormEditor;
let page: Page;

test.beforeAll(async ({}, testInfo) => {
  page = await pageFor(prebuiltWorkspacePath, testInfo.titlePath[1]);
  processEditor = new ProcessEditor(page, 'testFormProcess.p.json');
  formEditor = new FormEditor(page, 'testForm.f.json');
  await processEditor.hasDeployProjectStatusMessage();
});

test.beforeEach(async () => {
  await processEditor.openEditorFile();
  await processEditor.isViewVisible();
});

test.afterEach(async () => {
  await processEditor.revertAndCloseEditor();
});

test('Jump between editors', async () => {
  await processEditor.toolbar.locator('.tool-bar-button[title*="Open Form"]').click();
  await formEditor.isViewVisible();
  await formEditor.toolbar.getByRole('button', { name: 'Open Process' }).click();
  await processEditor.isViewVisible();
});
