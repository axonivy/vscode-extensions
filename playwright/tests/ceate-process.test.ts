import { test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { multiProjectWorkspacePath, removeFromWorkspace } from './workspaces/workspace';
import { Page, expect } from '@playwright/test';
import { OutputView } from './page-objects/output-view';
import { ProcessEditor } from './page-objects/process-editor';
import { ProjectExplorerView } from './page-objects/explorer-view';
import path from 'path';

test.describe('Create Process', () => {
  let page: Page;
  let explorer: ProjectExplorerView;
  let processEditor: ProcessEditor;
  const projectName = 'prebuiltProject';
  const cleanUp = () => removeFromWorkspace(path.join(multiProjectWorkspacePath, projectName), 'processes');

  test.beforeAll(async ({}, testInfo) => {
    cleanUp();
    page = await pageFor(multiProjectWorkspacePath, testInfo.titlePath[1]);
    const outputView = new OutputView(page);
    await outputView.checkIfEngineStarted();
    explorer = new ProjectExplorerView(page);
    await explorer.hasStatusMessage('Successful Project Initialization');
  });

  test.afterAll(async () => {
    cleanUp();
  });

  test('Add business process and execute it', async () => {
    await explorer.addProcess(projectName, 'testBusinessProcess', 'Business Process');
    await explorer.hasStatusMessage('Successful Project Deployment');
    processEditor = new ProcessEditor(page, 'testBusinessProcess.p.json');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    const end = processEditor.locatorForElementType('g.end\\:taskEnd');
    await processEditor.startProcessAndAssertExecuted(start, end);
  });

  test('Add nested business process', async () => {
    await explorer.addProcess(projectName, 'parent1/parent2/child', 'Business Process');
    await explorer.hasNode('parent1');
    await explorer.hasNode('parent2');
    await explorer.hasNode('child.p.json');
  });

  test('Add callable sub process', async () => {
    await explorer.addProcess(projectName, 'testCallableSubProcess', 'Callable Sub Process');
    processEditor = new ProcessEditor(page, 'testCallableSubProcess.p.json');
    const start = processEditor.locatorForElementType('g.start\\:callSubStart');
    await expect(start).toBeVisible();
  });

  test('Add web service process', async () => {
    await explorer.addProcess(projectName, 'testWebServiceProcess', 'Web Service Process');
    processEditor = new ProcessEditor(page, 'testCallableSubProcess.p.json');
    const start = processEditor.locatorForElementType('g.start\\:webserviceStart');
    await expect(start).toBeVisible();
  });
});
