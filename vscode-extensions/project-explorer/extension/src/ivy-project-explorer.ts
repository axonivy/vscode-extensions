import * as vscode from 'vscode';
import { IvyProjectTreeDataProvider } from './ivy-project-tree-data-provider';

export const VIEW_ID = 'ivyProjects';

export class IvyProjectExplorer {
  constructor(context: vscode.ExtensionContext) {
    const treeDataProvider = new IvyProjectTreeDataProvider();
    context.subscriptions.push(vscode.window.createTreeView(VIEW_ID, { treeDataProvider }));
    treeDataProvider.hasIvyProjcts().then(hasIvyProjcts => this.setHasIvyProjectsToContext(hasIvyProjcts));
  }

  setHasIvyProjectsToContext(hasIvyProjcts: boolean) {
    vscode.commands.executeCommand('setContext', 'ivy:hasIvyProjects', hasIvyProjcts);
  }
}
