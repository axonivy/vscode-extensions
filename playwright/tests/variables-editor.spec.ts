import { expect } from '@playwright/test';
import { VariablesEditor } from './page-objects/variables-editor';
import { randomArtefactName } from './workspaces/workspace';
import { BrowserView } from './page-objects/browser-view';
import { test } from './fixtures/baseTest';

test.describe('Variables Editor', () => {
  let editor: VariablesEditor;

  test.beforeEach(async ({ page }) => {
    editor = new VariablesEditor(page);
    await editor.hasDeployProjectStatusMessage();
    await editor.openEditorFile();
    await editor.isTabVisible();
    await editor.executeCommand('View: Reopen Editor With...', 'Axon Ivy Variables Editor');
    await editor.isViewVisible();
  });

  test('Read, write and open help', async ({ page }) => {
    await editor.hasKey('originalKey');
    await editor.hasValue('originalValue', false);
    const newValue = `originalValue-${randomArtefactName()}`;
    await editor.selectFirstRow();
    await editor.updateValue(newValue);
    await page.waitForTimeout(300);
    await editor.saveAllFiles();
    await editor.executeCommand('View: Reopen Editor With Text Editor');
    await editor.activeEditorHasText(`originalKey: ${newValue}`);
    await editor.revertAndCloseEditor();
  });

  test('Open Help', async ({ page }) => {
    const browserView = new BrowserView(page);
    await editor.viewFrameLoactor().getByRole('button', { name: /Help/ }).click();
    const helpLink = await browserView.input().inputValue();
    expect(helpLink).toMatch(/^https:\/\/developer\.axonivy\.com.*configuration\/variables\.html$/);
  });
});
