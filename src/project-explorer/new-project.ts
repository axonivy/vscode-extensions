import * as vscode from 'vscode';
import { Commands, executeCommand } from '../base/commands';
import path from 'path';

export interface NewProjectParams {
  name: string;
  groupId: string;
  projectId: string;
  defaultNamespace: string;
  path: string;
}

export async function addNewProject(): Promise<void> {
  const input = await collectNewProjectParams();
  if (input) {
    executeCommand(Commands.ENGINE_CREATE_PROJECT, input);
  }
}

async function collectNewProjectParams(): Promise<NewProjectParams | undefined> {
  if (!vscode.workspace.workspaceFolders) {
    return;
  }
  const name = await vscode.window.showInputBox({ title: 'Project Name' });
  if (!name) {
    return;
  }
  const groupId = await vscode.window.showInputBox({ title: 'Group Id', value: name });
  if (!groupId) {
    return;
  }
  const projectId = await vscode.window.showInputBox({ title: 'Project Id', value: name });
  if (!projectId) {
    return;
  }
  const defaultNamespace = await vscode.window.showInputBox({ title: 'Default Namespace', value: name });
  if (!defaultNamespace) {
    return;
  }
  const projectPath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, name);
  return { path: projectPath, name, groupId, projectId, defaultNamespace };
}
