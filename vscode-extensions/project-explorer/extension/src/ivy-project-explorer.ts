import * as vscode from 'vscode';
import { IvyProjectTreeDataProvider, IVY_RPOJECT_FILE_PATTERN } from './ivy-project-tree-data-provider';
import { Commands, executeCommand } from '@axonivy/vscode-base';

export const VIEW_ID = 'ivyProjects';

export class IvyProjectExplorer {
  private treeDataProvider: IvyProjectTreeDataProvider;

  constructor(context: vscode.ExtensionContext) {
    this.treeDataProvider = new IvyProjectTreeDataProvider();
    context.subscriptions.push(vscode.window.createTreeView(VIEW_ID, { treeDataProvider: this.treeDataProvider }));
    vscode.commands.registerCommand(`${VIEW_ID}.refreshEntry`, () => this.refresh());
    vscode.commands.registerCommand(Commands.PROJECT_EXPLORER_HAS_IVY_PROJECTS, () => this.hasIvyProjects());
    const projectFileWatcher = vscode.workspace.createFileSystemWatcher(IVY_RPOJECT_FILE_PATTERN);
    projectFileWatcher.onDidChange(() => this.refresh());
    projectFileWatcher.onDidCreate(() => this.refresh());
    projectFileWatcher.onDidDelete(() => this.refresh());
    this.hasIvyProjects().then(hasIvyProjects => this.setProjectExplorerActivationCondition(hasIvyProjects));
  }

  async hasIvyProjects(): Promise<boolean> {
    return this.treeDataProvider.hasIvyProjects();
  }

  async refresh(): Promise<void> {
    this.treeDataProvider.refresh();
    const hasIvyProjects = await this.hasIvyProjects();
    this.setProjectExplorerActivationCondition(hasIvyProjects);
    this.activateEngineExtension(hasIvyProjects);
  }

  setProjectExplorerActivationCondition(hasIvyProjects: boolean): void {
    executeCommand(Commands.VSCODE_SET_CONTEXT, 'ivy:hasIvyProjects', hasIvyProjects);
  }

  activateEngineExtension(hasIvyProjects: boolean): void {
    if (hasIvyProjects) {
      executeCommand(Commands.ENGINE_RESOLVE_URL);
    }
  }
}
