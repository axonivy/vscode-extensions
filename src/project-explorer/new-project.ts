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
  const workspacePath = await getWorkspacePath();
  if (!workspacePath) {
    return;
  }
  const name = await vscode.window.showInputBox({ title: 'Project Name', validateInput: validateProjectName });
  if (!name) {
    return;
  }
  const projectPath = path.join(workspacePath, name);
  const groupId = await vscode.window.showInputBox({ title: 'Group Id', value: name, validateInput: validateId });
  if (!groupId) {
    return;
  }
  const projectId = await vscode.window.showInputBox({ title: 'Project Id', value: name, validateInput: validateId });
  if (!projectId) {
    return;
  }
  const defaultNamespace = await vscode.window.showInputBox({
    title: 'Default Namespace',
    value: name === groupId && name === projectId ? name.replaceAll('-', '.') : `${groupId}.${projectId}`.replaceAll('-', '.'),
    validateInput: validateNamespace
  });
  if (!defaultNamespace) {
    return;
  }
  return { path: projectPath, name, groupId, projectId, defaultNamespace };
}

async function getWorkspacePath(): Promise<string | undefined> {
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    return;
  }
  if (vscode.workspace.workspaceFolders.length === 1) {
    return vscode.workspace.workspaceFolders[0].uri.fsPath;
  }
  const workspacePath = await vscode.window.showQuickPick(
    vscode.workspace.workspaceFolders.map(w => w.uri.fsPath),
    { title: 'Select a workspace for the new project.' }
  );
  if (workspacePath) {
    return workspacePath;
  }
  return;
}

function validateProjectName(value: string): string | undefined {
  const pattern = /^[\w-]+$/;
  if (pattern.test(value)) {
    return;
  }
  return 'Invalid project name.';
}

function validateId(value: string): string | undefined {
  const pattern = /^\w+(\.\w+)*(-\w+)*$/;
  if (pattern.test(value)) {
    return;
  }
  return 'Invalid id.';
}

function validateNamespace(value: string): string | undefined {
  const pattern = /^\w+(\.\w+)*$/;
  if (pattern.test(value)) {
    return;
  }
  return 'Invalid namespace.';
}
