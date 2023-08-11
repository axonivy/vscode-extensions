import * as vscode from 'vscode';
import { IvyProjectTreeDataProvider } from './ivy-project-tree-data-provider';

export class IvyProjectExplorer {
  viewId = 'ivyProjects';

  constructor(context: vscode.ExtensionContext) {
    const treeDataProvider = new IvyProjectTreeDataProvider();
    context.subscriptions.push(vscode.window.createTreeView(this.viewId, { treeDataProvider }));
    vscode.commands.executeCommand(`${this.viewId}.focus`);
  }
}
