import { expect, test } from 'playwright/test';
import { pageFor } from './fixtures/page';
import { ProcessEditor } from './page-objects/process-editor';
import { defaultWorkspacePath } from './workspaces/workspace';
import { Page } from '@playwright/test';
import { OutputView } from './page-objects/output-view';
import { OutlineExplorerView } from './page-objects/explorer-view';

test.describe('Process Outline', () => {
  let processEditor: ProcessEditor;
  let page: Page;

  test.beforeAll(async ({}, testInfo) => {
    page = await pageFor(defaultWorkspacePath, testInfo.titlePath[1]);
    const outputView = new OutputView(page);
    await outputView.checkIfEngineStarted();
  });

  test.beforeEach(async () => {
    processEditor = new ProcessEditor(page, 'ProcessOutline.p.json');
    await processEditor.openEditorFile();
    await processEditor.isViewVisible();
  });

  test.afterEach(async () => {
    await processEditor.revertAndCloseEditor();
  });

  test('Verify that Process Outline Explorer lists several elements', async () => {
    const start = processEditor.locatorForPID('15254DCE818AD7A3-f0');
    await expect(start).toBeVisible();

    const explorer = new OutlineExplorerView(page);
    await explorer.openView();
    await explorer.hasNode('start.ivp');
    await explorer.hasNode('Sub 1');
    await explorer.hasNoNode('unknown');
    await explorer.hasNoNode('Accept Request');

    await processEditor.revertAndCloseEditor();
    await explorer.hasNoNode('start.ivp');
    await explorer.closeView();
  });

  test('Verify that Process Outline Explorer is selectable', async () => {
    const start = processEditor.locatorForPID('15254DCE818AD7A3-f0');
    const ut = processEditor.locatorForPID('15254DCE818AD7A3-S10-f7');
    await expect(start).toBeVisible();

    const explorer = new OutlineExplorerView(page);
    await explorer.openView();
    await explorer.selectNode('start.ivp');
    await expect(start).toHaveClass(/selected/);

    await explorer.doubleClickExpandable('Sub 1');
    await explorer.hasNode('Accept Request');
    await explorer.selectNode('Accept Request');
    await expect(ut).toBeVisible();
    await explorer.doubleClickExpandable('Sub 1');

    await explorer.selectNode('start.ivp');
    await expect(start).toBeVisible();
    await explorer.closeView();
  });

  test('Verify that Process Outline Explorer will be selected from the process', async () => {
    const start = processEditor.locatorForPID('15254DCE818AD7A3-f0');
    await expect(start).toBeVisible();

    const explorer = new OutlineExplorerView(page);
    await explorer.openView();
    await start.click();
    await expect(start).toHaveClass(/selected/);
    await explorer.isSelected('start.ivp');
    await explorer.closeView();
  });
});
