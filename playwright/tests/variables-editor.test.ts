import { Page, expect, test } from '@playwright/test';
import { pageFor } from './fixtures/page';
import { VariablesEditor } from './page-objects/variables-editor';
import { prebuiltWorkspacePath } from './workspaces/workspace';
import { BrowserView } from './page-objects/browser-view';

test.describe('Variables Editor', () => {
  let page: Page;
  let editor: VariablesEditor;

  test.beforeAll(async ({}, testInfo) => {
    page = await pageFor(prebuiltWorkspacePath, testInfo.titlePath[1]);
    editor = new VariablesEditor(page);
    await editor.hasDeployProjectStatusMessage();
    await editor.openEditorFile();
    await editor.isTabVisible();
    await editor.isViewVisible();
  });

  test('Read and write', async () => {
    await editor.hasKey('originalKey');
    await editor.hasValue('originalValue');

    await editor.selectFirstRow();
    await editor.editInput('originalKey', 'newKey');
    await editor.editInput('originalValue', 'newValue');
    await page.waitForTimeout(300);
    await editor.saveAllFiles();
    await editor.executeCommand('View: Reopen Editor With Text');
    const newContent = `Variables:
  newKey: newValue
`;
    await editor.activeEditorHasText(newContent);

    const originalContent = `Variables:
  originalKey: originalValue
`;
    await editor.executeCommand('Select All');
    await editor.typeText(originalContent);
    await editor.activeEditorHasText(originalContent);
    await editor.saveAllFiles();
    await editor.executeCommand('View: Reopen Editor With...', 'Axon Ivy Variables Editor');
    await editor.hasKey('originalKey');
    await editor.hasValue('originalValue');
  });

  test('Open Help', async () => {
    const browserView = new BrowserView(page);
    await editor.viewFrameLoactor().getByRole('button', { name: /Help/ }).click();
    const helpLink = await browserView.input().inputValue();
    expect(helpLink).toMatch(/^https:\/\/developer\.axonivy\.com.*configuration\/variables\.html$/);
  });
});
