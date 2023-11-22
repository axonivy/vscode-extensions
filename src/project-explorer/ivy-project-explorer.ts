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
    this.hasIvyProjects().then(hasIvyProjects => this.setProjectExplorerActivationCondition(hasIvyProjects));
  }

  private registerCommands(context: vscode.ExtensionContext) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registerCmd = (command: Command, callback: (...args: any[]) => any) => registerCommand(command, context, callback);
    registerCmd(`${VIEW_ID}.refreshEntry`, () => this.refresh());
    registerCmd(`${VIEW_ID}.buildProject`, (selection: TreeSelection) => this.execute('engine.buildProject', selection));
    registerCmd(`${VIEW_ID}.deployProject`, (selection: TreeSelection) => this.execute('engine.deployProject', selection));
    registerCmd(`${VIEW_ID}.buildAndDeployProject`, (selection: TreeSelection) => this.execute('engine.buildAndDeployProject', selection));
    registerCmd(`${VIEW_ID}.addBusinessProcess`, (selection: TreeSelection) => this.addProcess('Business Process', selection));
    registerCmd(`${VIEW_ID}.addCallableSubProcess`, (selection: TreeSelection) => this.addProcess('Callable Sub Process', selection));
    registerCmd(`${VIEW_ID}.addWebServiceProcess`, (selection: TreeSelection) => this.addProcess('Web Service Process', selection));
    registerCmd(`${VIEW_ID}.addNewProject`, (selection: TreeSelection) => addNewProject(selection));
    registerCmd(`${VIEW_ID}.addNewHtmlDialog`, (selection: TreeSelection) => this.addUserDialog(selection, 'Html Dialog'));
    registerCmd(`${VIEW_ID}.addNewOfflineDialog`, (selection: TreeSelection) => this.addUserDialog(selection, 'Offline Dialog'));
    registerCmd(`${VIEW_ID}.getIvyProjects`, () => this.treeDataProvider.getIvyProjects());
    registerCmd(`${VIEW_ID}.revealInExplorer`, (entry: Entry) => executeCommand('revealInExplorer', this.getCmdEntry(entry)?.uri));
  }

  private defineFileWatchers() {
    vscode.workspace.createFileSystemWatcher(IVY_RPOJECT_FILE_PATTERN, false, true, true).onDidCreate(() => this.refresh());
    vscode.workspace.createFileSystemWatcher('**/*', true, true, false).onDidDelete(e =>
      this.treeDataProvider
        .getIvyProjects()
        .then(projects => this.deleteProjectOnEngine(e, projects))
        .then(() => this.refresh())
    );
    vscode.workspace.createFileSystemWatcher('**/*.p.json', true, false, true).onDidChange(e => this.execute('engine.deployProject', e));
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
    this.setProjectExplorerActivationCondition(hasIvyProjects);
    this.activateEngineExtension(hasIvyProjects);
  }

  private async execute(command: Command, selection: TreeSelection) {
    executeTreeSelectionCommand(command, selection, this.treeDataProvider.getIvyProjects());
  }

  private async addProcess(kind: ProcessKind, selection: TreeSelection) {
    const projectDir = await treeSelectionToProjectPath(selection, this.treeDataProvider.getIvyProjects());
    if (!projectDir) {
      return;
    }
    const selectedUri = await treeSelectionToUri(selection);
    addNewProcess(selectedUri, projectDir, kind);
  }

  private async addUserDialog(selection: TreeSelection, type: DialogType) {
    treeSelectionToProjectPath(selection, this.treeDataProvider.getIvyProjects()).then(projectDir =>
      projectDir ? addNewUserDialog(projectDir, type) : {}
    );
  }

  private setProjectExplorerActivationCondition(hasIvyProjects: boolean) {
    executeCommand('setContext', 'ivy:hasIvyProjects', hasIvyProjects);
  }

  private activateEngineExtension(hasIvyProjects: boolean) {
    if (hasIvyProjects) {
      executeCommand('engine.startIvyEngineManager');
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
