import { Page, expect, test } from '@playwright/test';
import { InscriptionView } from './page-objects/inscription-view';
import { ProcessEditor } from './page-objects/process-editor';
import { pageFor } from './fixtures/page';
import { defaultWorkspacePath } from './workspaces/workspace';
import { OutputView } from './page-objects/output-view';

const userDialogPID = '15254DCE818AD7A2-f3';

test.describe('Inscription View', () => {
  let page: Page;
  let processEditor: ProcessEditor;
  let inscriptionView: InscriptionView;

  test.beforeAll(async () => {
    page = await pageFor(defaultWorkspacePath, 'Inscription View');
    inscriptionView = new InscriptionView(page);
    const outputView = new OutputView(page);
    await outputView.checkIfEngineStarted();
  });

  test.beforeEach(async () => {
    processEditor = new ProcessEditor(page);
    await processEditor.openProcess();
    await processEditor.isViewVisible();
  });

  test.afterEach(async () => {
    await processEditor.revertAndCloseEditor();
  });

  test('Check Process Editor Connector', async () => {
    let element = processEditor.locatorForPID(userDialogPID);
    await expect(element).toBeVisible();
    await element.dblclick();
    await inscriptionView.isTabVisible();
    await inscriptionView.isViewVisible();
    let header = inscriptionView.header();
    await expect(header).toHaveText('User Dialog - Enter Request');

    element = processEditor.locatorForPID('15254DCE818AD7A2-f9');
    await element.click();
    header = inscriptionView.header();
    await expect(header).toHaveText('E-Mail - Notify Requester');
  });

  test('Change User Dialog display name', async () => {
    const element = processEditor.locatorForPID(userDialogPID);
    await element.dblclick();
    const nameAccordion = inscriptionView.accordionFor('Name');
    await expect(nameAccordion).toBeVisible();
    await nameAccordion.click();

    const inputField = inscriptionView.inputFieldFor('Display name');
    await expect(inputField).toHaveText('Enter Request');
    await expect(element).toHaveText('Enter Request');

    const newDisplayName = 'a new display name for this test';
    await inputField.clear();
    await inputField.fill(newDisplayName);
    await inputField.blur();
    await expect(inputField).toHaveText(newDisplayName);
    await element.click();
    await expect(element).toHaveText(newDisplayName);
  });

  test('Monaco Editor completion', async () => {
    const element = processEditor.locatorForPID(userDialogPID);
    await element.dblclick();
    const outputAccordion = inscriptionView.accordionFor('Output');
    await expect(outputAccordion).toBeVisible();
    await outputAccordion.click();
    const monacoEditor = inscriptionView.monacoEditor();
    await expect(monacoEditor).toBeVisible();

    await monacoEditor.click();
    const contentAssist = inscriptionView.monacoContentAssist();
    await expect(contentAssist).toBeHidden();
    await inscriptionView.triggerMonacoContentAssist();
    await expect(contentAssist).toBeVisible();

    await expect(monacoEditor).toHaveText('');
    await inscriptionView.writeToMonacoEditorWithCompletion('iv', 'ivy');
    await inscriptionView.writeToMonacoEditorWithCompletion('.l', 'log');
    await inscriptionView.writeToMonacoEditorWithCompletion('.de', 'debug');
    await expect(monacoEditor).toHaveText('ivy.log.debug(Object)');
  });
});
