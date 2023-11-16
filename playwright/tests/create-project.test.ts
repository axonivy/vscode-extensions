import { test } from './fixtures/page';
import { ProcessEditor } from './page-objects/process-editor';
import { empty, removeFromWorkspace } from './workspaces/workspace';
import { FileExplorer } from './page-objects/explorer-view';

test.describe('Create Project', () => {
  const projectName = 'testProject';

  test.beforeAll(async () => {
    removeFromWorkspace(empty, projectName);
  });

  test.afterAll(async () => {
    removeFromWorkspace(empty, projectName);
  });

  test('Add Project and execute init Process', async ({ pageFor }) => {
    const page = await pageFor(empty);
    const explorer = new FileExplorer(page);
    await explorer.addProject(projectName);
    await explorer.hasStatusMessage('Successful Project Deployment', 60_000);

    const processEditor = new ProcessEditor(page, 'BusinessProcess.p.json');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    const end = processEditor.locatorForElementType('g.end\\:taskEnd');
    await processEditor.startProcessAndAssertExecuted(start, end);
    await processEditor.revertAndCloseEditor();
  });
});
