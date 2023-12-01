import { test } from './fixtures/page';
import { ProcessEditor } from './page-objects/process-editor';
import { empty, removeFromWorkspace } from './workspaces/workspace';
import { FileExplorer } from './page-objects/explorer-view';

test.describe('Create Project', () => {
  const projectName = 'testProject';
  const rootFolder = 'parent';

  test.beforeAll(async () => {
    removeFromWorkspace(empty, rootFolder);
  });

  test.afterAll(async () => {
    removeFromWorkspace(empty, rootFolder);
  });

  test('Add Project and execute init Process', async ({ pageFor }) => {
    const page = await pageFor(empty);
    const explorer = new FileExplorer(page);
    await explorer.addNestedProject(rootFolder, projectName);
    await explorer.hasStatusMessage('Finished: Deploy Ivy Projects');
    await explorer.hasStatusMessage('Finished: Create new Project', 60_000);

    const processEditor = new ProcessEditor(page, 'BusinessProcess.p.json');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    const end = processEditor.locatorForElementType('g.end\\:taskEnd');
    await processEditor.startProcessAndAssertExecuted(start, end);
    await processEditor.closeAllTabs();
  });
});
