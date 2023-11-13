import * as vscode from 'vscode';
import { IvyProjectTreeDataProvider, IVY_RPOJECT_FILE_PATTERN, Entry } from './ivy-project-tree-data-provider';
import { Commands, executeCommand } from '../base/commands';
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
    this.defineProcessModelFileWatcher();
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
    vscode.commands.registerCommand(`${VIEW_ID}.refreshEntry`, () => this.refresh());
    vscode.commands.registerCommand(`${VIEW_ID}.buildAll`, () => this.buildAll());
    vscode.commands.registerCommand(`${VIEW_ID}.deployAll`, () => this.deployAll());
    vscode.commands.registerCommand(`${VIEW_ID}.buildAndDeployAll`, () => this.buildAndDeployAll());
    vscode.commands.registerCommand(`${VIEW_ID}.buildProject`, (entry: Entry) => this.buildProject(entry));
    vscode.commands.registerCommand(`${VIEW_ID}.deployProject`, (entry: Entry) => this.deployProject(entry));
    vscode.commands.registerCommand(`${VIEW_ID}.buildAndDeployProject`, (entry: Entry) => this.buildAndDeployProject(entry));
    vscode.commands.registerCommand(`${VIEW_ID}.addBusinessProcess`, (entry: Entry) =>
      addNewProcess(this.getCmdEntry(entry), 'Business Process')
    );
    vscode.commands.registerCommand(`${VIEW_ID}.addCallableSubProcess`, (entry: Entry) =>
      addNewProcess(this.getCmdEntry(entry), 'Callable Sub Process')
    );
    vscode.commands.registerCommand(`${VIEW_ID}.addWebServiceProcess`, (entry: Entry) =>
      addNewProcess(this.getCmdEntry(entry), 'Web Service Process')
    );
    vscode.commands.registerCommand(`${VIEW_ID}.deleteEntry`, (entry: Entry) => {
      this.treeDataProvider.delete(this.getCmdEntry(entry)).then(() => this.treeDataProvider.refresh());
    });
    vscode.commands.registerCommand(`${VIEW_ID}.addNewProject`, () => addNewProject());
    vscode.commands.registerCommand(Commands.PROJECT_EXPLORER_GET_IVY_PROJECTS, () => this.treeDataProvider.getIvyProjects());
  }

  private defineIvyProjectFileWatcher(): void {
    const projectFileWatcher = vscode.workspace.createFileSystemWatcher(IVY_RPOJECT_FILE_PATTERN);
    projectFileWatcher.onDidChange(() => this.refresh());
    projectFileWatcher.onDidCreate(() => this.refresh());
    projectFileWatcher.onDidDelete(() => this.refresh());
  }

  private defineProcessModelFileWatcher(): void {
    const processModelFileWatcher = vscode.workspace.createFileSystemWatcher('**/processes/**/*.p.json');
    processModelFileWatcher.onDidCreate(e => {
      executeCommand('vscode.open', vscode.Uri.file(e.fsPath));
    });
    processModelFileWatcher.onDidDelete(e => {
      this.treeDataProvider.refresh();
    });
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
    executeCommand(Commands.ENGINE_BUILD_PROJECTS);
  }

  private async deployAll(): Promise<void> {
    executeCommand(Commands.ENGINE_DEPLOY_PROJECTS);
  }

  private async buildAndDeployAll(): Promise<void> {
    executeCommand(Commands.ENGINE_BUILD_AND_DEPLOY_PROJECTS);
  }

  private async buildProject(entry: Entry): Promise<void> {
    executeCommand(Commands.ENGINE_BUILD_PROJECT, entry.uri.fsPath);
  }

  private async deployProject(entry: Entry): Promise<void> {
    executeCommand(Commands.ENGINE_DEPLOY_PROJECT, entry.uri.fsPath);
  }

  private async buildAndDeployProject(entry: Entry): Promise<void> {
    executeCommand(Commands.ENGINE_BUILD_AND_DEPLOY_PROJECT, entry.uri.fsPath);
  }

  private setProjectExplorerActivationCondition(hasIvyProjects: boolean): void {
    executeCommand(Commands.VSCODE_SET_CONTEXT, 'ivy:hasIvyProjects', hasIvyProjects);
  }

  private focusIvyView(hasIvyProjects: boolean): void {
    if (hasIvyProjects) {
      executeCommand(`${VIEW_ID}.focus`);
    }
  }

  private activateEngineExtension(hasIvyProjects: boolean): void {
    if (hasIvyProjects) {
      executeCommand(Commands.ENGINE_START_MANAGER);
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
