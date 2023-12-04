import { test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { multiProjectWorkspacePath, removeFromWorkspace } from './workspaces/workspace';
import { Page, expect } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { FileExplorer } from './page-objects/explorer-view';
import path from 'path';
import { wait } from './utils/timeout';
import { randomInt } from 'crypto';

test.describe('Create User Dialog', () => {
  let page: Page;
  let explorer: FileExplorer;
  let processEditor: ProcessEditor;
  let userDialogName: string;
  const projectName = 'prebuiltProject';
  const cleanUp = () => removeFromWorkspace(path.join(multiProjectWorkspacePath, projectName), 'src_hd');

  test.beforeAll(async ({}, testInfo) => {
    cleanUp();
    page = await pageFor(multiProjectWorkspacePath, testInfo.titlePath[1]);
    explorer = new FileExplorer(page);
    await explorer.hasStatusMessage('Finished: Deploy Ivy Projects');
    processEditor = new ProcessEditor(page);
  });

  test.beforeEach(async () => {
    userDialogName = 'hd' + randomInt(10_000).toString();
  });

  test.afterEach(async () => {
    await explorer.closeAllTabs();
    await wait(page);
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
});
