import { OutputView } from '~/page-objects/output-view';
import { VsCodeBrowser } from '~/page-objects/vscode-browser';
import { expect, test } from '../fixtures/baseTest';
import { ProcessEditor } from '../page-objects/process-editor';
import { embeddedEngineWorkspace, portalPerformanceWorkspacePath } from '../workspaces/workspace';

test.describe('Dummy test to download embedded engine', () => {
  test.use({ workspace: embeddedEngineWorkspace });

  test('Download, unpack and start engine', async ({ wsPage }) => {
    await new OutputView(wsPage).checkIfEngineStarted();
  });
});

test.describe('Portal performance', () => {
  test.use({ workspace: portalPerformanceWorkspacePath });

  test('Portal home', async ({ wsPage, electronApp }) => {
    await wsPage.statusMessageContains('Axon Ivy: Success - Deploying project');
    const editor = new ProcessEditor(wsPage, 'PortalStart.p.json');
    await editor.open();
    await wsPage.executeCommand('View: Hide Panel');
    const start = editor.elementByPID('1549F58C18A6C562-f28');
    const vscodeBrowser = await VsCodeBrowser.openBrowser(() => editor.startProcessAndAssertExecuted(start, start), { electronApp });
    await expect(vscodeBrowser.browserPage.locator('span.default-welcome-image')).toBeVisible();
  });
});
