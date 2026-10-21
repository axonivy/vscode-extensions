import { expect, test } from '~/fixtures/baseTest';
import { ProblemsView } from '~/page-objects/problems-view';
import { VsCodeBrowser } from '~/page-objects/vscode-browser';
import { XhtmlEditor } from '~/page-objects/xhtml-editor';

test('XHTML uses a dedicated language mode without HTML/CSS diagnostics', async ({ wsPage }) => {
  const editor = new XhtmlEditor(wsPage, 'xhtml-validation.xhtml');
  await editor.open();

  const problems = await ProblemsView.initProblemsView(wsPage);
  await expect(problems.view).not.toContainText(/property value expected|self-closing|trailing solidus/i);
});

test('XHTML provides CSS completions and hover in style blocks', async ({ wsPage }) => {
  const editor = new XhtmlEditor(wsPage, 'xhtml-validation.xhtml');
  await editor.open();

  await editor.expectCompletionAtLineColumn('background', 8, 9);

  await editor.goToLineColumn(7, 10);
  await wsPage.page.keyboard.press('Control+K');
  await wsPage.page.keyboard.press('Control+I');
  const hover = wsPage.page.locator('.monaco-hover');
  await expect(hover).toContainText(/color/i);
});

test('xhtml completions', async ({ wsPage }) => {
  const editor = new XhtmlEditor(wsPage);
  await editor.open();
  await editor.expectCompletionAtLineColumn('p:media', 20, 16);
  await editor.expectCompletionAtLineColumn('rendered', 20, 23);
  await editor.expectCompletionAtLineColumn('h:body', 19, 10);
});

test('xhtml definitions', async ({ wsPage }) => {
  test.setTimeout(60_000); // slow test due to java activation
  const editor = new XhtmlEditor(wsPage);
  await editor.open();
  await wsPage.activateExpensiveJavaStandardMode();
  await editor.expectDefinitionAtLineColumn('WorkflowBean.java', 24, 64);
  await editor.expectDefinitionAtLineColumn('IvyJsf.java', 24, 111);
  await editor.expectDefinitionAtLineColumn('IvyJsf.java', 24, 115);
  await editor.expectDefinitionAtLineColumn('ContentManagement.java', 24, 118);
});

test('xhtml preview', async ({ wsPage, electronApp }) => {
  const editor = new XhtmlEditor(wsPage);
  await editor.open();
  await wsPage.hasReadyStatusMessage();

  await wsPage.executeCommand('Axon Ivy: Deploy All Projects');
  await wsPage.statusMessageContains('Axon Ivy: Success - Deploying project');
  const vscodeBrowser = await VsCodeBrowser.openBrowser(() => wsPage.page.getByRole('button', { name: 'Open Dialog Preview' }).click(), {
    electronApp,
    page: wsPage.page
  });
  const frame = vscodeBrowser.browserPage.frameLocator('iframe');
  const button = frame.getByRole('button', { name: 'Proceed' });
  await expect(vscodeBrowser.browserPage.locator('#iFrameForm\\:frameTaskName')).toHaveText('Preview');
  await expect(async () => {
    await vscodeBrowser.reload();
    await expect(button).toBeVisible({ timeout: 3_000 });
  }).toPass();

  await editor.close();

  const overlay = frame.locator('#selectionOverlay');
  await expect(overlay).toHaveCount(0);
  await vscodeBrowser.browserPage.locator('#iFrameForm\\:previewElementPicker').click();
  await expect(overlay).toHaveCount(1);
  await button.click();
  await expect(overlay).toHaveCount(1);
  await vscodeBrowser.browserPage.locator('#iFrameForm\\:previewElementPicker').click();
  await expect(overlay).toHaveCount(0);

  await editor.expectTabVisible();
  await expect(editor.content.locator('.active-line-number')).toHaveText('25');
});
