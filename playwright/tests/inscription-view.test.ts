import { Page, expect, test } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { pageFor } from './fixtures/page';
import { prebuiltWorkspacePath, randomArtefactName, removeFromWorkspace } from './workspaces/workspace';
import { BrowserView } from './page-objects/browser-view';
import { wait } from './utils/timeout';

const userDialogPID1 = '15254DCE818AD7A2-f3';
const userDialogPID2 = '15254DCE818AD7A2-f14';
const userTaskPID = '15254DCE818AD7A2-f17';

test.describe('Inscription View', () => {
  let page: Page;
  let browserView: BrowserView;
  let processEditor: ProcessEditor;
  const cleanUp = () => {
    removeFromWorkspace(prebuiltWorkspacePath, 'src_hd', 'prebuiltProject');
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
    let element = processEditor.locatorForPID(userDialogPID1);
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
    const inscriptionView = await processEditor.openInscriptionView(userDialogPID1);
    const nameAccordion = inscriptionView.accordionFor('General');
    await expect(nameAccordion).toBeVisible();
    await nameAccordion.click();

    const inputField = inscriptionView.inputFieldFor('Display name');
    await expect(inputField).toHaveText('Enter Request');
    const element = processEditor.locatorForPID(userDialogPID1);
    await expect(element).toHaveText('Enter Request');

    const newDisplayName = 'a new display name for this test';
    await inputField.clear();
    await inputField.fill(newDisplayName);
    await inputField.blur();
    await expect(inputField).toHaveText(newDisplayName);
    await expect(element).toHaveText(newDisplayName);
  });

  test('OpenPage-Action - valid file - Means/Document Table', async () => {
    const inscriptionView = await processEditor.openInscriptionView(userDialogPID1);
    const generalAccordion = inscriptionView.accordionFor('General');
    await expect(generalAccordion).toBeVisible();
    await generalAccordion.click();

    await inscriptionView.clickButton('Means / Documents');
    await inscriptionView.clickButton('Add row');

    const firstRowURLCell = inscriptionView.cellInsideTable(0, 3);
    await firstRowURLCell.locator('input').fill('pom.xml');
    await wait(page);
    await inscriptionView.cellInsideTable(0, 2).click();
    await wait(page);
    await inscriptionView.clickButton('Open URL');
    const activeTabElement = await page.$('.tab.active');
    expect(activeTabElement).not.toBeNull();
    expect(await activeTabElement?.getAttribute('data-resource-name')).toEqual('pom.xml');

    const closeButtonOfActiveTab = await activeTabElement?.$('.action-label.codicon.codicon-close');
    await closeButtonOfActiveTab?.click();
  });

  test('OpenPage-Action in Browers - Open Help', async () => {
    browserView = new BrowserView(page);
    const inscriptionView = await processEditor.openInscriptionView(userDialogPID1);
    await inscriptionView.clickButton('Open Help for User Dialog');
    expect((await browserView.input().inputValue()).toString()).toMatch(
      /^https:\/\/developer\.axonivy\.com.*process-elements\/user-dialog\.html$/
    );
  });

  test('Monaco Editor completion', async () => {
    await processEditor.executeCommand('View: Toggle Panel Visibility');
    const inscriptionView = await processEditor.openInscriptionView(userDialogPID1);
    const outputAccordion = inscriptionView.accordionFor('Output');
    await expect(outputAccordion).toBeVisible();
    await outputAccordion.click();
    await inscriptionView.sectionFor('Code').click();
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
    await inscriptionView.writeToMonacoEditorWithCompletion('.de', 'debug(Object message,Throwable t)');
    await expect(monacoEditor).toHaveText('ivy.log.debug(message, t)');
  });

  test('Create new Sub Process', async () => {
    const inscriptionView = await processEditor.openInscriptionView('15254DCE818AD7A2-f5');
    await inscriptionView.accordionFor('Process').click();
    const processStartField = inscriptionView.parent.getByRole('combobox');
    await expect(processStartField).toBeEmpty();
    await inscriptionView.clickButton('Create new Sub Process');
    const processName = randomArtefactName();
    await inscriptionView.provideUserInput(processName);
    await processEditor.isDirty();
    await processEditor.isInactive();
    await processEditor.tabLocator.click();
    await expect(processStartField).toHaveValue(`${processName}:call()`);
  });

  test('Create Html Dialog', async () => {
    await processEditor.hasNoStatusMessage();
    const inscriptionView = await processEditor.openInscriptionView(userDialogPID1);
    await inscriptionView.accordionFor('Dialog').click();
    const dialogField = inscriptionView.parent.getByRole('combobox');
    await expect(dialogField).toBeEmpty();
    await inscriptionView.clickButton('Create new Html Dialog');
    const userDialogName = randomArtefactName();
    await inscriptionView.provideUserInput('JSF');
    await inscriptionView.provideUserInput(userDialogName);
    await inscriptionView.provideUserInput();
    await inscriptionView.provideUserInput();
    await inscriptionView.provideUserInput();
    await processEditor.isDirty();
    await processEditor.isInactive();
    await processEditor.isTabWithNameVisible(`${userDialogName}.xhtml`);
    await processEditor.tabLocator.click();
    await expect(dialogField).toHaveValue(`prebuiltProject.${userDialogName}:start()`);
  });

  test('Create Form Dialog', async () => {
    await processEditor.hasNoStatusMessage();
    const inscriptionView = await processEditor.openInscriptionView(userDialogPID2);
    await inscriptionView.accordionFor('Dialog').click();
    const dialogField = inscriptionView.parent.getByRole('combobox');
    await expect(dialogField).toBeEmpty();
    await inscriptionView.clickButton('Create new Html Dialog');
    const userDialogName = randomArtefactName();
    await inscriptionView.provideUserInput('Form');
    await inscriptionView.provideUserInput(userDialogName);
    await inscriptionView.provideUserInput();
    await processEditor.isDirty();
    await processEditor.isInactive();
    await processEditor.isTabWithNameVisible(`${userDialogName}.f.json`);
    await processEditor.tabLocator.click();
    await expect(dialogField).toHaveValue(`prebuiltProject.${userDialogName}:start()`);
  });

  test('Create Offline Dialog', async () => {
    await processEditor.hasNoStatusMessage();
    const inscriptionView = await processEditor.openInscriptionView(userTaskPID);
    await inscriptionView.accordionFor('Dialog').click();
    const dialogField = inscriptionView.parent.getByRole('combobox');
    await expect(dialogField).toBeEmpty();
    await inscriptionView.clickButton('Create new Html Dialog');
    const userDialogName = randomArtefactName();
    await inscriptionView.provideUserInput('JSFOffline');
    await inscriptionView.provideUserInput(userDialogName);
    await inscriptionView.provideUserInput();
    await processEditor.isDirty();
    await processEditor.isInactive();
    await processEditor.isTabWithNameVisible(`${userDialogName}.xhtml`);
    await processEditor.tabLocator.click();
    await expect(dialogField).toHaveValue(`prebuiltProject.${userDialogName}:start()`);
  });
});
