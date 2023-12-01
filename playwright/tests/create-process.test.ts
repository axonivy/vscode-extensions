import { test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { multiProjectWorkspacePath, removeFromWorkspace } from './workspaces/workspace';
import { Page, expect } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { FileExplorer } from './page-objects/explorer-view';
import path from 'path';
import { wait } from './utils/timeout';

test.describe('Create Process', () => {
  let page: Page;
  let explorer: FileExplorer;
  let processEditor: ProcessEditor;
  const projectName = 'prebuiltProject';
  const cleanUp = () => removeFromWorkspace(path.join(multiProjectWorkspacePath, projectName), 'processes');

  test.beforeAll(async ({}, testInfo) => {
    cleanUp();
    page = await pageFor(multiProjectWorkspacePath, testInfo.titlePath[1]);
    explorer = new FileExplorer(page);
    processEditor = new ProcessEditor(page);
    await processEditor.hasStatusMessage('Finished: Deploy Ivy Projects');
  });

  test.afterEach(async () => {
    await processEditor.closeAllTabs();
    await wait(page);
  });

  test.afterAll(async () => {
    cleanUp();
  });

  test('Add business process and execute it', async () => {
    await explorer.addProcess(projectName, 'testBusinessProcess', 'Business Process');
    await explorer.hasNoNode('testBusinessProcess.p.json');
    await explorer.hasStatusMessage('Finished: Deploy Ivy Projects');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    const end = processEditor.locatorForElementType('g.end\\:taskEnd');
    await processEditor.startProcessAndAssertExecuted(start, end);
  });

  test('Assert that process gets redeployed after editing', async () => {
    await explorer.addProcess(projectName, 'addScriptToMe', 'Business Process');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    await processEditor.appendActivityAndSave(start, 'Script');
    const script = processEditor.locatorForElementType('g.script');
    await expect(script).toHaveClass(/selected/);
    await processEditor.saveAllFiles();
    await processEditor.startProcessAndAssertExecuted(start, script);
  });

  test('Add nested business process', async () => {
    await explorer.addProcess(projectName, 'parent1/parent2/child', 'Business Process');
    await explorer.hasNoNode('parent1');
    await explorer.hasNoNode('parent2');
    await explorer.hasNoNode('child.p.json');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    await expect(start).toBeVisible();
  });

  test('Add callable sub process', async () => {
    await explorer.addProcess(projectName, 'testCallableSubProcess', 'Callable Sub Process');
    await explorer.hasNoNode('testCallableSubProcess.p.json');
    const start = processEditor.locatorForElementType('g.start\\:callSubStart');
    await expect(start).toBeVisible();
  });

  test('Add web service process', async () => {
    await explorer.addProcess(projectName, 'testWebServiceProcess', 'Web Service Process');
    await explorer.hasNoNode('testWebServiceProcess.p.json');
    const start = processEditor.locatorForElementType('g.start\\:webserviceStart');
    await expect(start).toBeVisible();
  });
});
