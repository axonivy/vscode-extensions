import { Page, expect, test } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { pageFor } from './fixtures/page';
import { prebuiltWorkspacePath, randomArtefactName, removeFromWorkspace } from './workspaces/workspace';
import { ProblemsView } from './page-objects/problems-view';

const userDialogPID = '15254DCE818AD7A2-f3';

test.describe('Inscription View', () => {
  let page: Page;
  let processEditor: ProcessEditor;
  const cleanUp = () => {
    removeFromWorkspace(prebuiltWorkspacePath, 'src_hd');
    removeFromWorkspace(prebuiltWorkspacePath, 'processes');
  };

  test.beforeAll(async ({}, testInfo) => {
    cleanUp();
    page = await pageFor(prebuiltWorkspacePath, testInfo.titlePath[1]);
    processEditor = new ProcessEditor(page);
    await processEditor.hasDeployProjectStatusMessage();
  });

  test.beforeEach(async () => {
    await processEditor.openEditorFile();
    await processEditor.isViewVisible();
  });

  test.afterEach(async () => {
    await processEditor.revertAndCloseEditor();
  });

  test.afterAll(() => {
    cleanUp();
  });

  test('Check Process Editor Connector', async () => {
    let element = processEditor.locatorForPID(userDialogPID);
    await expect(element).toBeVisible();
    await element.dblclick();
    const inscriptionView = processEditor.inscriptionView();
    await inscriptionView.assertViewVisible();
    await expect(inscriptionView.header()).toHaveText('User Dialog - Enter Request');

    element = processEditor.locatorForPID('15254DCE818AD7A2-f0');
    await element.click();
    await expect(inscriptionView.header()).toHaveText('Start - start.ivp');
  });

  test('Change User Dialog display name', async () => {
    const inscriptionView = await processEditor.openInscriptionView(userDialogPID);
    const nameAccordion = inscriptionView.accordionFor('General');
    await expect(nameAccordion).toBeVisible();
    await nameAccordion.click();

    const inputField = inscriptionView.inputFieldFor('Display name');
    await expect(inputField).toHaveText('Enter Request');
    const element = processEditor.locatorForPID(userDialogPID);
    await expect(element).toHaveText('Enter Request');

    const newDisplayName = 'a new display name for this test';
    await inputField.clear();
    await inputField.fill(newDisplayName);
    await inputField.blur();
    await expect(inputField).toHaveText(newDisplayName);
    await expect(element).toHaveText(newDisplayName);
  });

  test('Monaco Editor completion', async () => {
    await processEditor.executeCommand('View: Toggle Panel Visibility');
    const inscriptionView = await processEditor.openInscriptionView(userDialogPID);
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
    await inscriptionView.writeToMonacoEditorWithCompletion('.de', 'debug(Object,Throwable)');
    await expect(monacoEditor).toHaveText('ivy.log.debug(Object,Throwable)');
  });

  test('Create new Sub Process', async () => {
    const inscriptionView = await processEditor.openInscriptionView('15254DCE818AD7A2-f5');
    await inscriptionView.accordionFor('Process Call').click();
    const processStartField = inscriptionView.inputFieldFor('Process start');
    await expect(processStartField).toBeEmpty();
    await inscriptionView.clickButton('Create new Sub Process');
    const processName = randomArtefactName();
    await inscriptionView.provideUserInput(processName);
    await processEditor.isDirty();
    await processEditor.isInactive();
    await processEditor.tabLocator.click();
    await expect(processStartField).toHaveValue(`${processName}:call()`);
  });

  test('Create new Html Dialog', async () => {
    await processEditor.hasNoStatusMessage();
    const inscriptionView = await processEditor.openInscriptionView(userDialogPID);
    await inscriptionView.accordionFor('Call').click();
    const dialogField = inscriptionView.inputFieldFor('Dialog');
    await expect(dialogField).toBeEmpty();
    await inscriptionView.clickButton('Create new Html Dialog');
    const userDialogName = randomArtefactName();
    await inscriptionView.provideUserInput(userDialogName);
    await inscriptionView.provideUserInput();
    await inscriptionView.provideUserInput();
    await inscriptionView.provideUserInput();
    await processEditor.isDirty();
    await processEditor.isInactive();
    await processEditor.tabLocator.click();
    await expect(dialogField).toHaveValue(`prebuiltProject.${userDialogName}:start()`);
  });

  test('Check existing validation', async () => {
    const callSub = processEditor.locatorForPID('15254DCE818AD7A2-f5');
    await processEditor.hasWarning(callSub);
    const problemsView = await ProblemsView.initProblemsView(page);
    await problemsView.hasWarning('SubProcessCall target is not defined.');
  });

  test('Check live validation', async () => {
    const pid = '15254DCE818AD7A2-f15';
    const script = processEditor.locatorForPID(pid);
    await processEditor.hasNoValidationMarker(script);
    const inscriptionView = await processEditor.openInscriptionView(pid);
    await inscriptionView.accordionFor('Script').click();
    const monacoEditor = inscriptionView.monacoEditor();
    await monacoEditor.click();
    await monacoEditor.pressSequentially('make test error');
    await processEditor.hasError(script);
    const problemsView = await ProblemsView.initProblemsView(page);
    await problemsView.hasError("Output code: Unexpected token: identifier 'error'");
  });
});
