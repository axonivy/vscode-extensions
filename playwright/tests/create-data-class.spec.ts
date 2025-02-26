import { test } from './fixtures/baseTest';
import { prebuiltWorkspacePath, randomArtefactName, removeFromWorkspace } from './workspaces/workspace';
import { FileExplorer } from './page-objects/explorer-view';
import path from 'path';
import { DataClassEditor } from './page-objects/data-class-editor';
import { Editor } from './page-objects/editor';

test.describe('Create Data Class', () => {
  test.afterAll(async () => {
    const projectPath = path.join(prebuiltWorkspacePath);
    removeFromWorkspace(projectPath, 'dataclasses', 'ch');
    removeFromWorkspace(projectPath, 'src_dataClasses', 'ch');
  });

  test('Add new Data Class', async ({ page }) => {
    const explorer = new FileExplorer(page);
    await explorer.hasDeployProjectStatusMessage();
    const dataClassName = randomArtefactName();
    await explorer.addDataClass(dataClassName, 'ch.ivyteam.test.data');
    await explorer.hasNode(`${dataClassName}.d.json`);
    const dataClassEditor = new DataClassEditor(page, `${dataClassName}.d.json`);
    await dataClassEditor.isViewVisible();
    const javaEditor = new Editor(`${dataClassName}.java`, page);
    await javaEditor.openEditorFile();
    await javaEditor.isTabVisible();
    await javaEditor.activeEditorHasText(`package ch.ivyteam.test.data;`);
    await javaEditor.activeEditorHasText(`public class ${dataClassName} extends ch.ivyteam.ivy.scripting.objects.CompositeObject`);
  });
});
