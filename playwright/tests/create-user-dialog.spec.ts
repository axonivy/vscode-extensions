import { test } from './fixtures/baseTest';
import { prebuiltWorkspacePath, randomArtefactName, removeFromWorkspace } from './workspaces/workspace';
import { expect } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { FileExplorer } from './page-objects/explorer-view';
import path from 'path';
import { FormEditor } from './page-objects/form-editor';

test.describe('Create User Dialog', () => {
  let explorer: FileExplorer;
  let processEditor: ProcessEditor;
  let userDialogName: string;
  const cleanUp = () => {
    const projectPath = path.join(prebuiltWorkspacePath);
    removeFromWorkspace(projectPath, 'src_hd', 'ch');
    removeFromWorkspace(projectPath, 'src_dataClasses', 'ch');
  };

  test.beforeAll(async ({}) => {
    cleanUp();
  });

  test.beforeEach(async ({ page }) => {
    explorer = new FileExplorer(page);
    await explorer.hasDeployProjectStatusMessage();
    processEditor = new ProcessEditor(page);
    userDialogName = randomArtefactName();
    await explorer.hasNoStatusMessage();
  });

  test.afterAll(async () => {
    cleanUp();
  });

  test('Add Html Dialog', async () => {
    await explorer.addUserDialog(userDialogName, 'ch.ivyteam.test', 'Html Dialog');
    await explorer.hasNode(`${userDialogName}.xhtml`);
    await explorer.hasNode(`${userDialogName}Data.d.json`);
    await explorer.hasNode(`${userDialogName}Process.p.json`);
    await explorer.isTabWithNameVisible(userDialogName + '.xhtml');
    await processEditor.activeEditorHasText('>Html Dialog</a>');
    await explorer.doubleClickNode(`${userDialogName}Process.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:htmlDialogStart');
    await expect(start).toBeVisible();
  });

  test('Add Offline Dialog', async () => {
    await explorer.addUserDialog(userDialogName, 'ch.ivyteam.test.offline', 'Offline Dialog');
    await explorer.hasNode(`${userDialogName}.xhtml`);
    await explorer.hasNode(`${userDialogName}Data.d.json`);
    await explorer.hasNode(`${userDialogName}Process.p.json`);
    await explorer.isTabWithNameVisible(userDialogName + '.xhtml');
    await processEditor.activeEditorHasText('>Offline Html Dialog</a>');
    await explorer.doubleClickNode(`${userDialogName}Process.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:htmlDialogStart');
    await expect(start).toBeVisible();
  });

  test('Add Form Dialog', async ({ page }) => {
    await explorer.addUserDialog(userDialogName, 'ch.ivyteam.test.form', 'Form Dialog');
    await explorer.hasNode(`${userDialogName}.f.json`);
    await explorer.hasNode(`${userDialogName}Data.d.json`);
    await explorer.hasNode(`${userDialogName}Process.p.json`);
    await explorer.isTabWithNameVisible(userDialogName + '.f.json');
    await explorer.hasNoStatusMessage();
    const formEditor = new FormEditor(page, `${userDialogName}.f.json`);
    await formEditor.isViewVisible();
    await explorer.doubleClickNode(`${userDialogName}Process.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:htmlDialogStart');
    await expect(start).toBeVisible();
    const xhtmlEditor = new FormEditor(page, `${userDialogName}.xhtml`);
    await xhtmlEditor.openEditorFile();
    await xhtmlEditor.isTabVisible();
    await xhtmlEditor.activeEditorHasText('<h:form id="form">');
    await xhtmlEditor.revertAndCloseEditor();
  });
});
