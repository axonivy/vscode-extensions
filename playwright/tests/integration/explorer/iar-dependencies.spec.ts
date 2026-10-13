import { expect, test } from '~/fixtures/baseTest';
import { ProjectExplorerView } from '~/page-objects/explorer-view';
import { RestClientEditor } from '~/page-objects/restclient-editor';
import { buildTestIar, installTestIar, testIarProject } from '~/utils/test-iar';
import { iarDependencyWorkspacePath, prebuiltWorkspacePath } from '~/workspaces/workspace';

const restClientFileName = 'rest-clients.yaml';
const projectExplorerItem = testIarProject.artifactId;

test.describe('IAR project dependencies', () => {
  test.use({ workspace: iarDependencyWorkspacePath });

  test.beforeAll(async () => {
    await buildTestIar(prebuiltWorkspacePath);
    await installTestIar();
  });

  test('shows the IAR dependency version and its META-INF/ivy files', async ({ wsPage }) => {
    const projectExplorer = new ProjectExplorerView(wsPage);
    await projectExplorer.openView();
    await projectExplorer.expandNodeExact('IAR Dependencies');

    const iarProject = projectExplorer.view.getByRole('treeitem').filter({ hasText: projectExplorerItem }).first();
    await expect(iarProject).toContainText(testIarProject.version);
    await expect(iarProject.locator('.codicon-lock')).toBeVisible();

    await projectExplorer.expandNodeExact(projectExplorerItem);
    await projectExplorer.hasNodeExact('config');
    await projectExplorer.expandNodeExact('config');
    await projectExplorer.scrollToNodeExact(restClientFileName);
    await projectExplorer.hasNodeExact(restClientFileName);
  });

  test('opens an IAR file in its webview editor and keeps it read-only', async ({ wsPage }) => {
    test.setTimeout(90_000);
    const projectExplorer = new ProjectExplorerView(wsPage);
    await projectExplorer.openView();
    await projectExplorer.expandNodeExact('IAR Dependencies');
    await projectExplorer.expandNodeExact(projectExplorerItem);
    await projectExplorer.expandNodeExact('config');
    await projectExplorer.scrollToNodeExact(restClientFileName);
    await projectExplorer.selectNodeExact(restClientFileName);

    const editor = new RestClientEditor(wsPage, restClientFileName);
    await editor.expectTabVisible();
    await editor.expectTabActive();
    await editor.expectWebViewVisible();
    await expect(editor.webViewFrame.getByRole('button', { name: /Add Rest Client/ })).toHaveCount(0);
    await editor.rows.first().click();
    const keyInput = editor.detail.getByRole('textbox', { name: 'Key' });
    await expect(keyInput).toHaveValue('personService');
    await expect(keyInput).toBeDisabled();
  });
});
