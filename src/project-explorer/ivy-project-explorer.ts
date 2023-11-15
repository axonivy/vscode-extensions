import * as vscode from 'vscode';
import { IvyProjectTreeDataProvider, IVY_RPOJECT_FILE_PATTERN, Entry } from './ivy-project-tree-data-provider';
import { executeCommand, registerCommand } from '../base/commands';
import { addNewProcess } from './new-process';
import path from 'path';
import { addNewProject } from './new-project';

export const VIEW_ID = 'ivyProjects';

export class IvyProjectExplorer {
  private treeDataProvider: IvyProjectTreeDataProvider;
  private treeView: vscode.TreeView<Entry>;

  constructor(context: vscode.ExtensionContext) {
    this.treeDataProvider = new IvyProjectTreeDataProvider();
    this.treeView = vscode.window.createTreeView(VIEW_ID, { treeDataProvider: this.treeDataProvider, showCollapseAll: true });
    context.subscriptions.push(this.treeView);
    this.registerCommands();
    this.defineIvyProjectFileWatcher();
    vscode.window.tabGroups.onDidChangeTabs(async event => this.changeTabListener(event));

    this.treeDataProvider.onDidCreateTreeItem(entry => {
      this.revealActiveEntry(entry);
    });

    this.hasIvyProjects().then(hasIvyProjects => {
      this.setProjectExplorerActivationCondition(hasIvyProjects);
      this.focusIvyView(hasIvyProjects);
    });
  }

  private registerCommands(): void {
    registerCommand(`${VIEW_ID}.refreshEntry`, () => this.refresh());
    registerCommand(`${VIEW_ID}.buildAll`, () => this.buildAll());
    registerCommand(`${VIEW_ID}.deployAll`, () => this.deployAll());
    registerCommand(`${VIEW_ID}.buildAndDeployAll`, () => this.buildAndDeployAll());
    registerCommand(`${VIEW_ID}.buildProject`, (entry: Entry) => this.buildProject(entry));
    registerCommand(`${VIEW_ID}.deployProject`, (entry: Entry) => this.deployProject(entry));
    registerCommand(`${VIEW_ID}.buildAndDeployProject`, (entry: Entry) => this.buildAndDeployProject(entry));
    registerCommand(`${VIEW_ID}.addBusinessProcess`, (entry: Entry) => addNewProcess('Business Process', this.getCmdEntry(entry)));
    registerCommand(`${VIEW_ID}.addCallableSubProcess`, (entry: Entry) => addNewProcess('Callable Sub Process', this.getCmdEntry(entry)));
    registerCommand(`${VIEW_ID}.addWebServiceProcess`, (entry: Entry) => addNewProcess('Web Service Process', this.getCmdEntry(entry)));
    registerCommand(`${VIEW_ID}.deleteEntry`, (entry: Entry) => {
      this.treeDataProvider.delete(this.getCmdEntry(entry)).then(() => this.treeDataProvider.refresh());
    });
    registerCommand(`${VIEW_ID}.addNewProject`, () => addNewProject());
    registerCommand(`${VIEW_ID}.getIvyProjects`, () => this.treeDataProvider.getIvyProjects());
  }

  private defineIvyProjectFileWatcher(): void {
    const projectFileWatcher = vscode.workspace.createFileSystemWatcher(IVY_RPOJECT_FILE_PATTERN);
    projectFileWatcher.onDidChange(() => this.refresh());
    projectFileWatcher.onDidCreate(() => this.refresh());
    projectFileWatcher.onDidDelete(() => this.refresh());
  }

  public async hasIvyProjects(): Promise<boolean> {
    return this.treeDataProvider.hasIvyProjects();
  }

  private async refresh(): Promise<void> {
    this.treeDataProvider.refresh();
    const hasIvyProjects = await this.hasIvyProjects();
    this.setProjectExplorerActivationCondition(hasIvyProjects);
    this.activateEngineExtension(hasIvyProjects);
  }

  private async buildAll(): Promise<void> {
    executeCommand('engine.buildProjects');
  }

  private async deployAll(): Promise<void> {
    executeCommand('engine.deployProjects');
  }

  private async buildAndDeployAll(): Promise<void> {
    executeCommand('engine.buildAndDeployProjects');
  }

  private async buildProject(entry: Entry): Promise<void> {
    executeCommand('engine.buildProject', entry.uri.fsPath);
  }

  private async deployProject(entry: Entry): Promise<void> {
    executeCommand('engine.deployProject', entry.uri.fsPath);
  }

  private async buildAndDeployProject(entry: Entry): Promise<void> {
    executeCommand('engine.buildAndDeployProject', entry.uri.fsPath);
  }

  private setProjectExplorerActivationCondition(hasIvyProjects: boolean): void {
    executeCommand('setContext', 'ivy:hasIvyProjects', hasIvyProjects);
  }

  private focusIvyView(hasIvyProjects: boolean): void {
    if (hasIvyProjects) {
      executeCommand(`${VIEW_ID}.focus`);
    }
  }

  private activateEngineExtension(hasIvyProjects: boolean): void {
    if (hasIvyProjects) {
      executeCommand('engine.startIvyEngineManager');
    }
  }

  private changeTabListener(event: vscode.TabChangeEvent): void {
    if (event.changed.length > 0) {
      this.syncProjectExplorerSelectionWithActiveTab();
    }
  }

  private syncProjectExplorerSelectionWithActiveTab(): void {
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

  private refreshRecursively(entryPath: string): void {
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

  private revealActiveEntry(entry: Entry): void {
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
