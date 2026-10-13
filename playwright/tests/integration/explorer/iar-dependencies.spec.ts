import { expect, test } from '~/fixtures/baseTest';
import { ProjectExplorerView } from '~/page-objects/explorer-view';
import { installTestIar, testIarCoordinates } from '~/utils/test-iar';
import { iarDependencyWorkspacePath } from '~/workspaces/workspace';

// const restClientFileName = 'rest-clients.yaml';
const projectExplorerItem = testIarCoordinates.artifactId;

test.beforeAll(async () => {
  await installTestIar();
});

test.describe('IAR project dependencies', () => {
  test.use({ workspace: iarDependencyWorkspacePath });

  test('shows the IAR dependencies', async ({ wsPage }) => {
    const projectExplorer = new ProjectExplorerView(wsPage);
    await projectExplorer.openView();
    await projectExplorer.expandNodeExact('IAR Dependencies');

    const iarProject = projectExplorer.view.getByRole('treeitem').filter({ hasText: projectExplorerItem }).first();
    await expect(iarProject).toContainText(testIarCoordinates.version);
    await expect(iarProject.locator('.codicon-lock')).toBeVisible();

    // await projectExplorer.expandNodeExact(projectExplorerItem);
    // await projectExplorer.hasNodeExact('config');
    // await projectExplorer.expandNodeExact('config');
    // await projectExplorer.scrollToNodeExact(restClientFileName);
    // await projectExplorer.hasNodeExact(restClientFileName);
  });
});
