import { test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { multiProjectWorkspacePath, randomArtefactName, removeFromWorkspace } from './workspaces/workspace';
import { Page, expect } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { FileExplorer } from './page-objects/explorer-view';
import path from 'path';
import { FormEditor } from './page-objects/form-editor';

test.describe('Create User Dialog', () => {
  let page: Page;
  let explorer: FileExplorer;
  let processEditor: ProcessEditor;
  let userDialogName: string;
  const projectName = 'prebuiltProject';
  const cleanUp = () => removeFromWorkspace(path.join(multiProjectWorkspacePath, projectName), 'src_hd', 'ch');

  test.beforeAll(async ({}, testInfo) => {
    cleanUp();
    page = await pageFor(multiProjectWorkspacePath, testInfo.titlePath[1]);
    explorer = new FileExplorer(page);
    await explorer.hasDeployProjectStatusMessage();
    processEditor = new ProcessEditor(page);
  });

  test.beforeEach(async () => {
    userDialogName = randomArtefactName();
    await explorer.hasNoStatusMessage();
  });

  test.afterEach(async () => {
    await explorer.closeAllTabs();
  });

  test.afterAll(async () => {
    cleanUp();
  });

  test('Add Html Dialog', async () => {
    await explorer.addUserDialog(projectName, userDialogName, 'ch.ivyteam.test', 'Html Dialog');
    await explorer.hasNode(`${userDialogName}.rddescriptor`);
    await explorer.hasNode(`${userDialogName}.xhtml`);
    await explorer.hasNode(`${userDialogName}Data.ivyClass`);
    await explorer.hasNode(`${userDialogName}Process.p.json`);
    await explorer.isTabWithNameVisible(userDialogName + '.xhtml');
    await processEditor.activeEditorHasText('>Html Dialog</a>');
    await explorer.doubleClickNode(`${userDialogName}Process.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:htmlDialogStart');
    await expect(start).toBeVisible();
  });

  test('Add Offline Dialog', async () => {
    await explorer.addUserDialog(projectName, userDialogName, 'ch.ivyteam.test.offline', 'Offline Dialog');
    await explorer.hasNode(`${userDialogName}.rddescriptor`);
    await explorer.hasNode(`${userDialogName}.xhtml`);
    await explorer.hasNode(`${userDialogName}Data.ivyClass`);
    await explorer.hasNode(`${userDialogName}Process.p.json`);
    await explorer.isTabWithNameVisible(userDialogName + '.xhtml');
    await processEditor.activeEditorHasText('>Offline Html Dialog</a>');
    await explorer.doubleClickNode(`${userDialogName}Process.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:htmlDialogStart');
    await expect(start).toBeVisible();
  });

  test('Add Form Dialog', async () => {
    await explorer.addUserDialog(projectName, userDialogName, 'ch.ivyteam.test.form', 'Form Dialog');
    await explorer.hasNode(`${userDialogName}.rddescriptor`);
    await explorer.hasNode(`${userDialogName}.f.json`);
    await explorer.hasNode(`${userDialogName}Data.ivyClass`);
    await explorer.hasNode(`${userDialogName}Process.p.json`);
    await explorer.isTabWithNameVisible(userDialogName + '.f.json');
    await explorer.hasDeployProjectStatusMessage(60_000);
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
