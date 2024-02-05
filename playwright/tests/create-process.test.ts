import { test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { multiProjectWorkspacePath, randomArtefactName, removeFromWorkspace } from './workspaces/workspace';
import { Page, expect } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { FileExplorer } from './page-objects/explorer-view';
import path from 'path';
import { wait } from './utils/timeout';

test.describe('Create Process', () => {
  let page: Page;
  let explorer: FileExplorer;
  let processEditor: ProcessEditor;
  let processName: string;
  const projectName = 'prebuiltProject';
  const cleanUp = () => removeFromWorkspace(path.join(multiProjectWorkspacePath, projectName), 'processes');

  test.beforeAll(async ({}, testInfo) => {
    cleanUp();
    page = await pageFor(multiProjectWorkspacePath, testInfo.titlePath[1]);
    explorer = new FileExplorer(page);
    processEditor = new ProcessEditor(page);
    await processEditor.hasStatusMessage('Finished: Deploy Ivy Projects');
  });

  test.beforeEach(async () => {
    processName = randomArtefactName();
  });

  test.afterEach(async () => {
    await processEditor.closeAllTabs();
    await wait(page);
  });

  test.afterAll(async () => {
    cleanUp();
  });

  test('Add business process and execute it', async () => {
    await processEditor.hasNoStatusMessage();
    await explorer.addProcess(projectName, processName, 'Business Process');
    await explorer.hasNode(`${processName}.p.json`);
    await explorer.hasStatusMessage('Finished: Deploy Ivy Projects');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    const end = processEditor.locatorForElementType('g.end\\:taskEnd');
    await processEditor.startProcessAndAssertExecuted(start, end);
  });

  test('Assert that process gets redeployed after editing', async () => {
    await processEditor.hasNoStatusMessage();
    await explorer.addProcess(projectName, processName, 'Business Process');
    await explorer.hasStatusMessage('Finished: Deploy Ivy Projects');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    await processEditor.hasNoStatusMessage();
    await processEditor.appendActivity(start, 'Script');
    const script = processEditor.locatorForElementType('g.script');
    await expect(script).toHaveClass(/selected/);
    await processEditor.saveAllFiles();
    await explorer.hasStatusMessage('Finished: Deploy Ivy Projects');
    await processEditor.startProcessAndAssertExecuted(start, script);
  });

  test('Add nested business process', async () => {
    await explorer.addProcess(projectName, `parent1/parent2/${processName}`, 'Business Process');
    await explorer.hasNode('parent1');
    await explorer.hasNode('parent2');
    await explorer.hasNode(`${processName}.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    await expect(start).toBeVisible();
  });

  test('Add callable sub process', async () => {
    await explorer.addProcess(projectName, processName, 'Callable Sub Process');
    await explorer.hasNode(`${processName}.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:callSubStart');
    await expect(start).toBeVisible();
  });

  test('Add web service process', async () => {
    await explorer.addProcess(projectName, processName, 'Web Service Process');
    await explorer.hasNode(`${processName}.p.json`);
    const start = processEditor.locatorForElementType('g.start\\:webserviceStart');
    await expect(start).toBeVisible();
  });
});
