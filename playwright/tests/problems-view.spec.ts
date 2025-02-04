import { Page, test } from '@playwright/test';
import { ProcessEditor } from './page-objects/process-editor';
import { pageFor } from './fixtures/page';
import { prebuiltWorkspacePath } from './workspaces/workspace';
import { ProblemsView } from './page-objects/problems-view';

test.describe('Problems View', () => {
  let page: Page;
  let processEditor: ProcessEditor;

  test.beforeAll(async ({}, testInfo) => {
    page = await pageFor(prebuiltWorkspacePath, testInfo.titlePath[1]);
    processEditor = new ProcessEditor(page, 'Validation.p.json');
    await processEditor.hasDeployProjectStatusMessage();
  });

  test.beforeEach(async () => {
    await processEditor.openEditorFile();
    await processEditor.isViewVisible();
    await processEditor.executeCommand('View: Focus into Panel');
  });

  test.afterEach(async () => {
    await processEditor.revertAndCloseEditor();
  });

  test('Check existing warning', async () => {
    const trigger = processEditor.locatorForPID('18D9CDFA8F58DA2B-f3');
    await processEditor.hasWarning(trigger);
    const problemsView = await ProblemsView.initProblemsView(page);
    await problemsView.hasWarning('TriggerCall target is not defined.', '18D9CDFA8F58DA2B-f3');
  });

  test('Check existing error', async () => {
    const script = processEditor.locatorForPID('18D9CDFA8F58DA2B-f5');
    await processEditor.hasError(script);
    const problemsView = await ProblemsView.initProblemsView(page);
    await problemsView.hasError('Output code: A statement is expected, not an expression (maybe missing semicolon)', '18D9CDFA8F58DA2B-f5');
  });

  test('Check live validation', async () => {
    const pid = '18D9CDFA8F58DA2B-f7';
    const script = processEditor.locatorForPID(pid);
    await processEditor.hasNoValidationMarker(script);
    const inscriptionView = await processEditor.openInscriptionView(pid);
    await inscriptionView.openAccordion('Output');
    await inscriptionView.openCollapsible('Code');
    const monacoEditor = inscriptionView.monacoEditor();
    await monacoEditor.click();
    await inscriptionView.typeText('make test error');
    await processEditor.hasError(script);
    const problemsView = await ProblemsView.initProblemsView(page);
    await problemsView.hasError("Output code: Unexpected token: identifier '", '18D9CDFA8F58DA2B-f7');
  });
});
