import { Page, expect, test } from '@playwright/test';
import { pageFor } from './fixtures/page';
import { VariablesEditor } from './page-objects/variables-editor';
import { prebuiltWorkspacePath, randomArtefactName } from './workspaces/workspace';
import { BrowserView } from './page-objects/browser-view';

test.describe('Variables Editor', () => {
  let page: Page;
  let editor: VariablesEditor;

  test.beforeAll(async ({}, testInfo) => {
    page = await pageFor(prebuiltWorkspacePath, testInfo.titlePath[1]);
    editor = new VariablesEditor(page);
    await editor.hasDeployProjectStatusMessage();
  });

  test.beforeEach(async () => {
    await editor.openEditorFile();
    await editor.isTabVisible();
    await editor.executeCommand('View: Reopen Editor With...', 'Axon Ivy Variables Editor');
    await editor.isViewVisible();
  });

  test('Read and write', async () => {
    await editor.hasKey('originalKey');
    await editor.hasValue('originalValue', false);
    const newValue = `originalValue-${randomArtefactName()}`;
    await editor.selectFirstRow();
    await editor.updateValue(newValue);
    await page.waitForTimeout(300);
    await editor.saveAllFiles();
    await editor.executeCommand('View: Reopen Editor With Text Editor');
    await editor.activeEditorHasText(`originalKey: ${newValue}`);
  });

  test('Open Help', async () => {
    const browserView = new BrowserView(page);
    await editor.viewFrameLoactor().getByRole('button', { name: /Help/ }).click();
    const helpLink = await browserView.input().inputValue();
    expect(helpLink).toMatch(/^https:\/\/developer\.axonivy\.com.*configuration\/variables\.html$/);
  });
});
