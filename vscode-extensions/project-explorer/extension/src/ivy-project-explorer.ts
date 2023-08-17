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
    const projectFileWatcher = vscode.workspace.createFileSystemWatcher(IVY_RPOJECT_FILE_PATTERN);
    projectFileWatcher.onDidChange(() => this.refresh());
    this.hasIvyProjectsAndNotify();
  }

  refresh(): void {
    this.treeDataProvider.refresh();
    this.hasIvyProjectsAndNotify();
  }

  hasIvyProjectsAndNotify(): void {
    this.treeDataProvider.hasIvyProjects().then(hasIvyProjects => this.notify(hasIvyProjects));
  }

  notify(hasIvyProjects: boolean) {
    this.setHasIvyProjectsToContext(hasIvyProjects);
    this.activateEngineExtension(hasIvyProjects);
  }

  setHasIvyProjectsToContext(hasIvyProjects: boolean): void {
    vscode.commands.executeCommand('setContext', 'ivy:hasIvyProjects', hasIvyProjects);
  }

  activateEngineExtension(hasIvyProjects: boolean): void {
    if (hasIvyProjects) {
      executeCommand(Commands.ENGINE_EXTENSION_EXECUTE);
    }
  }
}
