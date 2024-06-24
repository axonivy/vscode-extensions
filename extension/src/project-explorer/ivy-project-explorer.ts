import * as vscode from 'vscode';
import { IvyProjectTreeDataProvider, IVY_RPOJECT_FILE_PATTERN, Entry } from './ivy-project-tree-data-provider';
import { Command, executeCommand, registerCommand } from '../base/commands';
import { ProcessKind, addNewProcess } from './new-process';
import path from 'path';
import { addNewProject } from './new-project';
import { TreeSelection, executeTreeSelectionCommand, treeSelectionToProjectPath, treeSelectionToUri } from './tree-selection';
import { DialogType, addNewUserDialog } from './new-user-dialog';

export const VIEW_ID = 'ivyProjects';

export class IvyProjectExplorer {
  private treeDataProvider: IvyProjectTreeDataProvider;
  private treeView: vscode.TreeView<Entry>;

  constructor(context: vscode.ExtensionContext) {
    this.treeDataProvider = new IvyProjectTreeDataProvider();
    this.treeView = vscode.window.createTreeView(VIEW_ID, { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
    context.subscriptions.push(this.treeView);
    this.registerCommands(context);
    this.defineFileWatchers();
    vscode.window.tabGroups.onDidChangeTabs(async event => this.changeTabListener(event));
    this.treeDataProvider.onDidCreateTreeItem(entry => {
      this.revealActiveEntry(entry);
    });
    this.hasIvyProjects().then(hasIvyProjects =>
      this.setProjectExplorerActivationCondition(hasIvyProjects).then(() => this.activateEngineExtension(hasIvyProjects))
    );
  }

  private registerCommands(context: vscode.ExtensionContext) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registerCmd = (command: Command, callback: (...args: any[]) => any) => registerCommand(command, context, callback);
    registerCmd(`${VIEW_ID}.refreshEntry`, () => this.refresh());
    registerCmd(`${VIEW_ID}.buildProject`, (selection: TreeSelection) => this.execute('engine.buildProject', selection));
    registerCmd(`${VIEW_ID}.deployProject`, (selection: TreeSelection) => this.execute('engine.deployProject', selection));
    registerCmd(`${VIEW_ID}.buildAndDeployProject`, (selection: TreeSelection) => this.execute('engine.buildAndDeployProject', selection));
    registerCmd(`${VIEW_ID}.addProcess`, (selection: TreeSelection, pid: string) => this.addProcess(selection, undefined, pid));
    registerCmd(`${VIEW_ID}.addBusinessProcess`, (selection: TreeSelection) => this.addProcess(selection, 'Business Process'));
    registerCmd(`${VIEW_ID}.addCallableSubProcess`, (selection: TreeSelection) => this.addProcess(selection, 'Callable Sub Process'));
    registerCmd(`${VIEW_ID}.addWebServiceProcess`, (selection: TreeSelection) => this.addProcess(selection, 'Web Service Process'));
    registerCmd(`${VIEW_ID}.addNewProject`, (selection: TreeSelection) => addNewProject(selection));
    registerCmd(`${VIEW_ID}.addNewHtmlDialog`, (selection: TreeSelection, selections?: [TreeSelection], pid?: string) =>
      this.addUserDialog(selection, 'JSF', pid)
    );
    registerCmd(`${VIEW_ID}.addNewFormDialog`, (selection: TreeSelection, selections?: [TreeSelection], pid?: string) =>
      this.addUserDialog(selection, 'Form', pid)
    );
    registerCmd(`${VIEW_ID}.addNewOfflineDialog`, (selection: TreeSelection, selections?: [TreeSelection], pid?: string) =>
      this.addUserDialog(selection, 'JSFOffline', pid)
    );
    registerCmd(`${VIEW_ID}.getIvyProjects`, () => this.treeDataProvider.getIvyProjects());
    registerCmd(`${VIEW_ID}.revealInExplorer`, (entry: Entry) => executeCommand('revealInExplorer', this.getCmdEntry(entry)?.uri));
  }

  private defineFileWatchers() {
    vscode.workspace.createFileSystemWatcher(IVY_RPOJECT_FILE_PATTERN, false, true, true).onDidCreate(async () => await this.refresh());
    vscode.workspace.createFileSystemWatcher('**/*', true, true, false).onDidDelete(e =>
      this.treeDataProvider
        .getIvyProjects()
        .then(projects => this.deleteProjectOnEngine(e, projects))
        .then(() => this.refresh())
    );
    vscode.workspace
      .createFileSystemWatcher('**/{cms,config,webContent}/**/*', true, false, true)
      .onDidChange(e => this.execute('engine.deployProject', e));
  }

  private deleteProjectOnEngine(uri: vscode.Uri, ivyProjects: string[]) {
    const filePath = uri.fsPath;
    for (const project of ivyProjects) {
      if (project === filePath || project.startsWith(uri.fsPath + path.sep)) {
        executeCommand('engine.deleteProject', project);
      }
    }
  }

  public async hasIvyProjects(): Promise<boolean> {
    return this.treeDataProvider.hasIvyProjects();
  }

  private async refresh() {
    this.treeDataProvider.refresh();
    const hasIvyProjects = await this.hasIvyProjects();
    await this.setProjectExplorerActivationCondition(hasIvyProjects);
    await this.activateEngineExtension(hasIvyProjects);
  }

  private async execute(command: Command, selection: TreeSelection) {
    executeTreeSelectionCommand(command, selection, this.treeDataProvider.getIvyProjects());
  }

  private async addProcess(selection: TreeSelection, kind?: ProcessKind, pid?: string) {
    const projectPath = await treeSelectionToProjectPath(selection, this.treeDataProvider.getIvyProjects());
    if (projectPath) {
      await addNewProcess(await treeSelectionToUri(selection), projectPath, kind, pid);
      return;
    }
    vscode.window.showErrorMessage('Add Process: no valid Axon Ivy Project selected.');
  }

  private async addUserDialog(selection: TreeSelection, type: DialogType, pid?: string) {
    const projectPath = await treeSelectionToProjectPath(selection, this.treeDataProvider.getIvyProjects());
    if (projectPath) {
      await addNewUserDialog(await treeSelectionToUri(selection), projectPath, type, pid);
      return;
    }
    vscode.window.showWarningMessage('Add User Dialog: no valid Axon Ivy Project selected.');
  }

  private async setProjectExplorerActivationCondition(hasIvyProjects: boolean) {
    await executeCommand('setContext', 'ivy:hasIvyProjects', hasIvyProjects);
  }

  private async activateEngineExtension(hasIvyProjects: boolean) {
    if (hasIvyProjects) {
      await executeCommand('engine.startIvyEngineManager');
    }
  }

  private changeTabListener(event: vscode.TabChangeEvent) {
    if (event.changed.length > 0) {
      this.syncProjectExplorerSelectionWithActiveTab();
    }
  }

  private syncProjectExplorerSelectionWithActiveTab() {
    const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input as { uri: vscode.Uri };
    if (tabInput && tabInput.uri && this.treeView.visible) {
      const entryPath = tabInput.uri.fsPath;
      const entry = this.treeDataProvider.getEntryCache().get(entryPath);
      if (entry) {
        this.treeView.reveal(entry, { expand: true });
        return;
      }
      this.refreshRecursively(path.dirname(entryPath));
    }
  }

  private refreshRecursively(entryPath: string) {
    const entry = this.treeDataProvider.getEntryCache().get(entryPath);
    if (entry) {
      this.treeDataProvider.refreshSubtree(entry);
      return;
    }
    const parentEntryPath = path.dirname(entryPath);
    if (vscode.workspace.getWorkspaceFolder(vscode.Uri.file(parentEntryPath))) {
      this.refreshRecursively(parentEntryPath);
    }
  }

  private revealActiveEntry(entry: Entry) {
    const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input as { uri: vscode.Uri };
    if (tabInput && tabInput.uri && this.treeView.visible) {
      if (tabInput.uri.path.startsWith(entry.uri.path)) {
        this.treeView.reveal(entry, { expand: true });
      }
    }
  }

  private getCmdEntry(entry: Entry): Entry | undefined {
    if (entry) {
      return entry;
    }
    if (this.treeView.selection.length > 0) {
      return this.treeView.selection[0];
    }
    return undefined;
  }
}
