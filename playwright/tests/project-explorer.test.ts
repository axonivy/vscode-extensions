import { test } from './fixtures/page';
import { OutlineExplorerView, ProjectExplorerView } from './page-objects/explorer-view';
import { empty, multiProjectWorkspacePath, noProjectWorkspacePath, removeFromWorkspace } from './workspaces/workspace';
import { ProcessEditor } from './page-objects/process-editor';
import { expect } from '@playwright/test';

test.describe('Project Explorer', () => {
  test('Ensure Project Explorer is hidden as there is no Ivy Project', async ({ pageFor }) => {
    const page = await pageFor(noProjectWorkspacePath);
    const explorer = new ProjectExplorerView(page);
    await explorer.isHidden();
  });

  test('Ensure Process Outline Explorer is hidden as there is no Ivy Project', async ({ pageFor }) => {
    const page = await pageFor(noProjectWorkspacePath);
    const explorer = new OutlineExplorerView(page);
    await explorer.isHidden();
  });

  test('Verify that Project Explorer lists several Ivy Projects', async ({ pageFor }) => {
    const page = await pageFor(multiProjectWorkspacePath);
    const explorer = new ProjectExplorerView(page);
    await explorer.hasNode('ivy-project-1');
    await explorer.hasNode('ivy-project-2');
    await explorer.hasNoNode('ivy-project-3');
    await explorer.hasNoNode('no-ivy-project');
  });

  test('Add Project, add Process and execute Process', async ({ pageFor }) => {
    const projectName = 'testProject';
    removeFromWorkspace(empty, projectName);
    const page = await pageFor(empty);
    const explorer = new ProjectExplorerView(page);
    await explorer.showAxonIvyContainer();
    await expect(explorer.page.locator('.welcome-view-content')).toContainText('Add Project');
    await explorer.addProject(projectName);
    await explorer.isNotificationVisible('Build Project');
    await explorer.awaitNotification('Deploy Ivy Projects');

    let processEditor = new ProcessEditor(page, 'BusinessProcess.p.json');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    const end = processEditor.locatorForElementType('g.end\\:taskEnd');
    await processEditor.startProcessAndAssertExecuted(start, end);
    await processEditor.revertAndCloseEditor();

    await explorer.addProcess(projectName, 'testProcess');
    await explorer.awaitNotification('Deploy Ivy Projects');
    processEditor = new ProcessEditor(page, 'testProcess.p.json');
    await processEditor.openEditorFile();
    await processEditor.startProcessAndAssertExecuted(start, end);
    await processEditor.revertAndCloseEditor();

    removeFromWorkspace(empty, projectName);
  });
});
