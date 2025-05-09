import * as vscode from 'vscode';

export const setStatusBarMessage = (text: string) => vscode.window.setStatusBarMessage(text, 5_000);

const createStatusBarItem = () => {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
  item.text = '$(type-hierarchy) Axon Ivy';
  if (vscode.workspace.workspaceFolders) {
    item.command = {
      command: 'ivyProjects.addNewProject',
      arguments: vscode.workspace.workspaceFolders.length > 0 ? [vscode.workspace.workspaceFolders[0].uri] : [],
      title: 'Add new Project'
    };
  }
  return item;
};

export const statusBarItem = createStatusBarItem();
