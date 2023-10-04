import * as vscode from 'vscode';
import { IvyProjectTreeDataProvider, IVY_RPOJECT_FILE_PATTERN, Entry } from './ivy-project-tree-data-provider';
import { Commands, executeCommand } from '@axonivy/vscode-base';

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
    this.hasIvyProjects().then(hasIvyProjects => this.setProjectExplorerActivationCondition(hasIvyProjects));
  }

  private registerCommands(): void {
    vscode.commands.registerCommand(`${VIEW_ID}.refreshEntry`, () => this.refresh());
    vscode.commands.registerCommand(`${VIEW_ID}.buildAndDeployAll`, () => this.buildAndDeployAll());
    vscode.commands.registerCommand(`${VIEW_ID}.buildAndDeployProject`, (entry: Entry) => this.buildAndDeployProject(entry));
    vscode.commands.registerCommand(`${VIEW_ID}.refreshFileSelection`, () => this.syncProjectExplorerSelectionWithActiveTab());
    vscode.commands.registerCommand(Commands.PROJECT_EXPLORER_HAS_IVY_PROJECTS, () => this.hasIvyProjects());
    vscode.commands.registerCommand(Commands.PROJECT_EXPLORER_GET_IVY_PROJECTS, () => this.treeDataProvider.getIvyProjects());
  }

  private defineIvyProjectFileWatcher(): void {
    const projectFileWatcher = vscode.workspace.createFileSystemWatcher(IVY_RPOJECT_FILE_PATTERN);
    projectFileWatcher.onDidChange(() => this.refresh());
    projectFileWatcher.onDidCreate(() => this.refresh());
    projectFileWatcher.onDidDelete(() => this.refresh());
  }

  private async hasIvyProjects(): Promise<boolean> {
    return this.treeDataProvider.hasIvyProjects();
  }

  private async refresh(): Promise<void> {
    this.treeDataProvider.refresh();
    const hasIvyProjects = await this.hasIvyProjects();
    this.setProjectExplorerActivationCondition(hasIvyProjects);
    this.activateEngineExtension(hasIvyProjects);
  }

  private async buildAndDeployAll(): Promise<void> {
    executeCommand(Commands.ENGINE_BUILD_AND_DEPLOY_PROJECTS);
  }

  private async buildAndDeployProject(entry: Entry): Promise<void> {
    executeCommand(Commands.ENGINE_BUILD_AND_DEPLOY_PROJECT, entry.uri.fsPath);
  }

  private setProjectExplorerActivationCondition(hasIvyProjects: boolean): void {
    executeCommand(Commands.VSCODE_SET_CONTEXT, 'ivy:hasIvyProjects', hasIvyProjects);
  }

  private activateEngineExtension(hasIvyProjects: boolean): void {
    if (hasIvyProjects) {
      executeCommand(Commands.ENGINE_START_MANAGER);
    }
  }

  private changeTabListener(event: vscode.TabChangeEvent): void {
    if (!event.changed) {
      return;
    }
    this.syncProjectExplorerSelectionWithActiveTab();
  }

  private syncProjectExplorerSelectionWithActiveTab(): void {
    const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input as { uri: vscode.Uri };
    if (tabInput && tabInput.uri) {
      const entry = this.treeDataProvider.getEntryCache().get(tabInput.uri.fsPath);
      if (entry && this.treeView.visible) {
        this.treeView.reveal(entry);
      }
    }
  }
}
