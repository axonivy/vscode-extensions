import { pageFor, test } from './fixtures/page';
import { multiProjectWorkspacePath, removeFromWorkspace } from './workspaces/workspace';
import { Page, expect } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { FileExplorer } from './page-objects/explorer-view';
import path from 'path';
import { wait } from './utils/timeout';
import { randomInt } from 'crypto';

test.describe.only(() => {
  let page: Page;
  let explorer: FileExplorer;
  let processEditor: ProcessEditor;
  let processName: string;
  const projectName = 'prebuiltProject';
  const cleanUp = () => removeFromWorkspace(path.join(multiProjectWorkspacePath, projectName), 'processes');
  const setup = async () => {
    explorer = new FileExplorer(page);
    processEditor = new ProcessEditor(page);
    await processEditor.hasStatusMessage('Finished: Deploy Ivy Projects');
  };

  test.beforeAll(async () => {
    cleanUp();
  });

  test.beforeEach(async () => {
    processName = randomInt(10_000).toString();
  });

  test.afterEach(async () => {
    await processEditor.closeAllTabs();
    await wait(page);
  });

  test.afterAll(async () => {
    cleanUp();
  });

  test.describe('Create', () => {
    test.beforeAll(async ({}, testInfo) => {
      page = await pageFor(multiProjectWorkspacePath, testInfo.titlePath[1]);
      await setup();
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

  test.describe('Create and Execute', () => {
    test.beforeEach(async ({ pageFor }) => {
      page = await pageFor(multiProjectWorkspacePath);
      await setup();
    });

    test('Add business process and execute it', async () => {
      await explorer.addProcess(projectName, processName, 'Business Process');
      await explorer.hasNode(`${processName}.p.json`);
      await explorer.hasNoStatusMessage();
      const start = processEditor.locatorForElementType('g.start\\:requestStart');
      const end = processEditor.locatorForElementType('g.end\\:taskEnd');
      await processEditor.startProcessAndAssertExecuted(start, end);
    });

    test('Assert that process gets redeployed after editing', async () => {
      await explorer.addProcess(projectName, processName, 'Business Process');
      await explorer.hasNode(`${processName}.p.json`);
      await explorer.hasNoStatusMessage();
      const start = processEditor.locatorForElementType('g.start\\:requestStart');
      await processEditor.appendActivity(start, 'Script');
      const script = processEditor.locatorForElementType('g.script');
      await expect(script).toHaveClass(/selected/);
      await processEditor.saveAllFiles();
      await explorer.hasStatusMessage('Finished: Deploy Ivy Projects');
      await processEditor.startProcessAndAssertExecuted(start, script);
    });
  });
});
