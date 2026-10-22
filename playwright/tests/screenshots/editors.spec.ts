import { expect, test } from '~/fixtures/baseTest';
import { DatabaseEditor } from '~/page-objects/database-editor';
import { ProcessEditor } from '~/page-objects/process-editor';
import { VsCodeBrowser } from '~/page-objects/vscode-browser';
import { prebuiltWorkspacePath, screenshotProject } from '~/workspaces/workspace';
import { FormEditor } from '../page-objects/form-editor';
import { screenshot, screenshotLocator } from './screenshot-util';

test.use({ workspace: screenshotProject });

test('process editor', async ({ wsPage }) => {
  const editor = new ProcessEditor(wsPage, 'quickstart.p.json');
  await editor.open();
  await expect(editor.graph).toBeVisible();
  await screenshot(wsPage.page, 'editor-process');
});

test('form editor preview', async ({ wsPage, electronApp }) => {
  const editor = new FormEditor(wsPage);
  await editor.open();

  await expect(editor.main.locator('.selected')).toHaveCount(0);
  const timeout = { timeout: 3_000 };
  await wsPage.executeCommand('Axon Ivy: Deploy All Projects');
  await wsPage.statusMessageContains('Axon Ivy: Success - Deploying project');
  const vscodeBrowser = await VsCodeBrowser.openBrowser(() => editor.toolbar.getByRole('button', { name: 'Open Dialog Preview' }).click(), { electronApp });
  await expect(vscodeBrowser.browserPage.locator('#iFrameForm\\:frameTaskName')).toHaveText('Preview', timeout);
  await expect(async () => {
    await vscodeBrowser.reload();
    await expect(vscodeBrowser.browserPage.frameLocator('iframe').getByRole('textbox')).toBeVisible(timeout);
  }).toPass();

  await new Promise(resolve => setTimeout(resolve, 1000)); // wait for the preview to be fully rendered
  await screenshot(wsPage.page, 'editor-form-preview');
});

test.describe('database editor', () => {
  test.use({ workspace: prebuiltWorkspacePath });

  test('generate wizard', async ({ wsPage }) => {
    const editor = new DatabaseEditor(wsPage);
    await editor.open();
    await editor.main.getByRole('button', { name: /Generate Data Classes, Forms and Processes/ }).click();

    const wizard = editor.webViewFrame.getByRole('dialog');
    await expect(wizard).toBeVisible();
    const database = wizard.getByRole('combobox');
    await expect(database).toBeVisible();
    await database.click();
    const demoDatabase = editor.webViewFrame.getByRole('option', { name: 'demo_db' });
    await expect(demoDatabase).toBeVisible();
    await demoDatabase.click();
    await expect(database).toContainText('demo_db');
    await screenshotLocator(wsPage.page, wizard, 'editor-database-generate-wizard', { margin: 0 });

    await wizard.getByRole('button', { name: 'Next' }).click();
    const tableSelection = wizard.getByRole('region', { name: 'Tables' });
    await expect(tableSelection).toBeVisible();
    await expect(tableSelection.getByRole('textbox')).toBeVisible();
    await screenshotLocator(wsPage.page, wizard, 'editor-database-generate-wizard-tables', { margin: 0 });
  });
});
