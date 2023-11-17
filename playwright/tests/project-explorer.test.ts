import { test } from './fixtures/page';
import { FileExplorer, OutlineExplorerView, ProjectExplorerView } from './page-objects/explorer-view';
import { multiProjectWorkspacePath, noProjectWorkspacePath } from './workspaces/workspace';

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
    await explorer.openView();
    await explorer.hasNode('ivy-project-1');
    await explorer.hasNode('ivy-project-2');
    await explorer.hasNoNode('ivy-project-3');
    await explorer.hasNoNode('no-ivy-project');
    await explorer.hasNoNode('excluded');
    await explorer.closeView();
  });

  test('Reveal in Explorer', async ({ pageFor }) => {
    const page = await pageFor(multiProjectWorkspacePath);
    const explorer = new ProjectExplorerView(page);
    await explorer.openView();
    await explorer.selectNode('prebuiltProject');
    await explorer.revealInExplorer('dataclasses');
    const fileExplorer = new FileExplorer(page);
    await fileExplorer.isSelected('dataclasses');
    await explorer.closeView();
  });
});
