import { test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { multiProjectWorkspacePath, removeFromWorkspace } from './workspaces/workspace';
import { Page, expect } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { FileExplorer } from './page-objects/explorer-view';
import path from 'path';
import { wait } from './utils/timeout';

test.describe('Create User Dialog', () => {
  let page: Page;
  let explorer: FileExplorer;
  let processEditor: ProcessEditor;
  const projectName = 'prebuiltProject';
  const cleanUp = () => removeFromWorkspace(path.join(multiProjectWorkspacePath, projectName), 'src_hd');

  test.beforeAll(async ({}, testInfo) => {
    cleanUp();
    page = await pageFor(multiProjectWorkspacePath, testInfo.titlePath[1]);
    explorer = new FileExplorer(page);
    await explorer.hasStatusMessage('Finished: Deploy Ivy Projects');
    processEditor = new ProcessEditor(page);
  });

  test.afterEach(async () => {
    await explorer.closeAllTabs();
    await wait(page);
  });

  test.afterAll(async () => {
    cleanUp();
  });

  test('Add Html Dialog', async () => {
    const name = 'testHtmlDialog';
    await explorer.addUserDialog(projectName, name, 'ch.ivyteam.test', 'Html Dialog');
    await explorer.hasNode(`${name}.rddescriptor`);
    await explorer.hasNode(`${name}.xhtml`);
    await explorer.hasNode(`${name}Data.ivyClass`);
    await explorer.hasNode(`${name}Process.p.json`);
    await explorer.isTabWithNameVisible(name + '.xhtml');
    await explorer.doubleClickNode(`${name}Process.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:htmlDialogStart');
    await expect(start).toBeVisible();
  });

  test('Add Offline Dialog', async () => {
    const name = 'testOfflineDialog';
    await explorer.addUserDialog(projectName, name, 'ch.ivyteam.test.offline', 'Offline Dialog');
    await explorer.hasNode(`${name}.rddescriptor`);
    await explorer.hasNode(`${name}.xhtml`);
    await explorer.hasNode(`${name}Data.ivyClass`);
    await explorer.hasNode(`${name}Process.p.json`);
    await explorer.isTabWithNameVisible(name + '.xhtml');
    await explorer.doubleClickNode(`${name}Process.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:htmlDialogStart');
    await expect(start).toBeVisible();
  });
});
