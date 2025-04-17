import { expect } from 'playwright/test';
import { FormEditor } from './page-objects/form-editor';
import { BrowserView } from './page-objects/browser-view';
import { test } from './fixtures/baseTest';

test.describe('Form Editor', () => {
  let editor: FormEditor;

  test.beforeEach(async ({ page }) => {
    editor = new FormEditor(page);
    await editor.hasDeployProjectStatusMessage();
    await editor.openEditorFile();
    await editor.isViewVisible();
  });

  test('Edit input label', async ({ page }) => {
    const text = editor.locatorFor('.block-text');
    await expect(text).toBeVisible();
    await expect(text).toHaveText('This is my test');
    await editor.isNotDirty();

    const input = editor.locatorFor('.block-input');
    await input.dblclick();
    const labelProperty = editor.locatorFor('#properties').getByLabel('Label');
    const newLabel = 'newTestLabel';
    await labelProperty.click();
    await expect(labelProperty).toBeFocused();
    await page.keyboard.type(newLabel);
    await expect(input).toHaveText(newLabel);
    await editor.isDirty();
    await editor.saveAllFiles();
    await editor.isNotDirty();
    const xhtmlEditor = new FormEditor(page, 'testForm.xhtml');
    await xhtmlEditor.openEditorFile();
    await xhtmlEditor.isTabVisible();
    await xhtmlEditor.activeEditorHasText(`value="${newLabel}" />`);
    await xhtmlEditor.revertAndCloseEditor();
  });

  test('Open Help', async ({ page }) => {
    const browserView = new BrowserView(page);
    await editor.locatorFor('.block-input').dblclick();
    const inscriptionView = editor.locatorFor('#properties');
    await inscriptionView.getByRole('button', { name: /Help/ }).click();
    expect((await browserView.input().inputValue()).toString()).toMatch(/^https:\/\/developer\.axonivy\.com.*user-dialogs\/form-editor\.html$/);
  });

  test('Preview', async ({ page }) => {
    const browserView = new BrowserView(page);
    await editor.toolbar.getByRole('button', { name: 'Open Preview' }).click();
    const browser = browserView.content();
    await expect(browser.locator('#iFrameForm\\:frameTaskName')).toHaveText('Preview');
    const frame = browser.frameLocator('iframe');
    const input = frame.getByRole('textbox');
    await expect(input).toBeVisible();
    await editor.closeAllTabs();

    const overlay = frame.locator('#selectionOverlay');
    await expect(overlay).toBeHidden();
    await browser.locator('#iFrameForm\\:previewElementPicker').click();
    await expect(overlay).toBeVisible();
    await input.click();
    await expect(overlay).toBeHidden();

    await editor.isViewVisible();
    await expect(editor.locatorFor('.block-input')).toHaveClass(/selected/);
  });
});
