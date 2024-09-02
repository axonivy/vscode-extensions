import { Page, expect } from '@playwright/test';
import { VariablesEditor } from './page-objects/variables-editor';
import { prebuiltWorkspacePath } from './workspaces/workspace';
import { test } from './fixtures/page';

test.describe('Variables Editor', () => {
  let page: Page;
  let editor: VariablesEditor;

  test.beforeEach(async ({ pageFor }) => {
    page = await pageFor(prebuiltWorkspacePath);
    editor = new VariablesEditor(page);
    await editor.hasDeployProjectStatusMessage();
    await editor.openEditorFile();
    await editor.isTabVisible();
    await editor.isViewVisible();
  });

  test.afterEach(async () => {
    await editor.revertAndCloseEditor();
  });

  test('Read and write', async () => {
    expect(await editor.hasKey('originalKey'));
    expect(await editor.hasValue('originalValue'));

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
    // expect(await editor.hasKey('originalKey'));
    // expect(await editor.hasValue('originalValue'));
  });
});
