import { Page, expect, test } from '@playwright/test';
import { noEngineWorkspacePath } from './workspaces/workspace';
import { VariablesEditor } from './page-objects/variables-editor';
import { pageFor } from './fixtures/page';

test.describe('Variables Editor', () => {
  let page: Page;
  let editor: VariablesEditor;

  test.beforeAll(async ({}, testInfo) => {
    page = await pageFor(noEngineWorkspacePath, testInfo.titlePath[1]);
  });

  test.beforeEach(async () => {
    editor = new VariablesEditor(page);
    await editor.isAxonIvyActionItemChecked();
    await editor.openEditorFile();
    await editor.isTabVisible();
    await editor.isViewVisible();
  });

  test.afterEach(async () => {
    await editor.revertAndCloseEditor();
  });

  test('Check if initial key value pair is present', async () => {
    expect(await editor.hasKey('hello'));
    expect(await editor.hasValue('world'));
  });

  test('Delete initial key value pair', async () => {
    expect((await editor.entries().all()).length).toBe(2);
    await editor.clickButton('Delete');
    expect((await editor.entries().all()).length).toBe(0);
  });

  test('Add key value pairs', async () => {
    await editor.add('newKey', 'newValue');
    await editor.add('otherKey', 'otherValue');

    expect(await editor.hasKey('newKey'));
    expect(await editor.hasValue('newValue'));
    expect(await editor.hasKey('otherKey'));
    expect(await editor.hasValue('otherValue'));
  });

  test('Add parent node', async () => {
    await editor.addParentNode('aParent');
    expect(await editor.hasKey('aParent'));
  });
});
