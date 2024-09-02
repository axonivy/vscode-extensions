import { test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { prebuiltEmptyWorkspacePath, randomArtefactName, removeFromWorkspace } from './workspaces/workspace';
import { Page, expect } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { FileExplorer } from './page-objects/explorer-view';

test.describe('Create Process', () => {
  let page: Page;
  let explorer: FileExplorer;
  let processEditor: ProcessEditor;
  let processName: string;
  const cleanUp = () => removeFromWorkspace(prebuiltEmptyWorkspacePath, 'processes');

  test.beforeAll(async ({}, testInfo) => {
    cleanUp();
    page = await pageFor(prebuiltEmptyWorkspacePath, testInfo.titlePath[1]);
    explorer = new FileExplorer(page);
    await explorer.hasDeployProjectStatusMessage();
  });

  test.beforeEach(async () => {
    processName = randomArtefactName();
    processEditor = new ProcessEditor(page, `${processName}.p.json`);
    await processEditor.hasNoStatusMessage();
    await explorer.hidePanel();
  });

  test.afterEach(async () => {
    await processEditor.closeAllTabs();
  });

  test.afterAll(async () => {
    cleanUp();
  });

  test('Add business process and execute it', async () => {
    await explorer.addProcess(processName, 'Business Process');
    await explorer.hasNoStatusMessage();
    await explorer.hasNode(`${processName}.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    const end = processEditor.locatorForElementType('g.end\\:taskEnd');
    await processEditor.startProcessAndAssertExecuted(start, end);
  });

  test('Assert that process gets redeployed after editing', async () => {
    await explorer.addProcess(processName, 'Business Process');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    await processEditor.appendActivity(start, 'Script');
    await processEditor.isDirty();
    await page.waitForTimeout(1000);
    await processEditor.saveAllFiles();
    await page.waitForTimeout(3000);
    const script = processEditor.locatorForElementType('g.script');
    await expect(script).toHaveClass(/selected/);
    await processEditor.startProcessAndAssertExecuted(start, script);
  });

  test('Add nested business process', async () => {
    await explorer.addProcess(`parent1/parent2/${processName}`, 'Business Process');
    await explorer.hasNode('parent1');
    await explorer.hasNode('parent2');
    await explorer.hasNode(`${processName}.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    await expect(start).toBeVisible();
  });

  test('Add callable sub process', async () => {
    await explorer.addProcess(processName, 'Callable Sub Process');
    await explorer.hasNode(`${processName}.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:callSubStart');
    await expect(start).toBeVisible();
  });

  test('Add web service process', async () => {
    await explorer.addProcess(processName, 'Web Service Process');
    await explorer.hasNode(`${processName}.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:webserviceStart');
    await expect(start).toBeVisible();
  });
});
