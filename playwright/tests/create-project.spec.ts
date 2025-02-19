import { test } from './fixtures/baseTest';
import { ProcessEditor } from './page-objects/process-editor';
import { empty, removeFromWorkspace } from './workspaces/workspace';
import { FileExplorer } from './page-objects/explorer-view';
import { ProblemsView } from './page-objects/problems-view';

test.describe('Create Project', () => {
  const rootFolder = 'parent';

  test.beforeAll(async () => {
    removeFromWorkspace(empty, rootFolder);
  });

  test.afterAll(async () => {
    removeFromWorkspace(empty, rootFolder);
  });

  test.use({ workspace: empty });

  test('Add Project and execute init Process', async ({ page }) => {
    const explorer = new FileExplorer(page);
    await explorer.addNestedProject(rootFolder, 'testProject');
    await explorer.hasStatusMessage('Finished: Create new Project', 60_000);
    await explorer.hasNoStatusMessage();

    const problemsView = await ProblemsView.initProblemsView(page);
    await problemsView.hasNoMarker();

    const processEditor = new ProcessEditor(page, 'BusinessProcess.p.json');
    const start = processEditor.locatorForElementType('g.start\\:requestStart');
    const end = processEditor.locatorForElementType('g.end\\:taskEnd');
    await processEditor.startProcessAndAssertExecuted(start, end);
  });
});
