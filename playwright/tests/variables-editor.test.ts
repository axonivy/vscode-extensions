import { Page, expect, test } from '@playwright/test';
import { pageFor } from './fixtures/page';
import { VariablesEditor } from './page-objects/variables-editor';
import { noEngineWorkspacePath } from './workspaces/workspace';

test.describe('Variables Editor', () => {
  let page: Page;
  let editor: VariablesEditor;

  test.beforeAll(async ({}, testInfo) => {
    page = await pageFor(noEngineWorkspacePath, testInfo.titlePath[1]);
  });

  test.beforeEach(async () => {
    editor = new VariablesEditor(page);
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
    await editor.saveAllFiles();
    await editor.executeCommand('View: Reopen Editor With Text');
    await editor.activeEditorHasText(`Variables:
  newKey: newValue
`);

    await editor.executeCommand('Select All');
    await editor.typeText(`Variables:
  originalKey: originalValue
`);
    await editor.saveAllFiles();
    await editor.executeCommand('View: Reopen Editor With...', 'Axon Ivy Variables Editor');
    expect(await editor.hasKey('originalKey'));
    expect(await editor.hasValue('originalValue'));
  });
});
