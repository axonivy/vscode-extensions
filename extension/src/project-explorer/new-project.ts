import * as vscode from 'vscode';
import path from 'path';
import { TreeSelection, treeSelectionToUri } from './tree-selection';
import { ivyEngineManager } from '../engine/engine-manager';

export interface NewProjectParams {
  name: string;
  groupId: string;
  projectId: string;
  defaultNamespace: string;
  path: string;
}

export async function addNewProject(selection: TreeSelection) {
  const selectedUri = await treeSelectionToUri(selection);
  const input = await collectNewProjectParams(selectedUri);
  if (input) {
    ivyEngineManager.createProject(input);
  }
}

async function collectNewProjectParams(selectedUri: vscode.Uri): Promise<NewProjectParams | undefined> {
  const prompt = `Project Location: ${selectedUri.path}`;
  const name = await vscode.window.showInputBox({
    title: 'Project Name',
    validateInput: validateProjectName,
    prompt,
    ignoreFocusOut: true
  });
  if (!name) {
    return;
  }
  const projectPath = path.join(selectedUri.fsPath, name);
  const groupId = await vscode.window.showInputBox({ title: 'Group Id', value: name, validateInput: validateId, ignoreFocusOut: true });
  if (!groupId) {
    return;
  }
  const projectId = await vscode.window.showInputBox({ title: 'Project Id', value: name, validateInput: validateId, ignoreFocusOut: true });
  if (!projectId) {
    return;
  }
  const defaultNamespace = await vscode.window.showInputBox({
    title: 'Default Namespace',
    value: name === groupId && name === projectId ? name.replaceAll('-', '.') : `${groupId}.${projectId}`.replaceAll('-', '.'),
    validateInput: validateNamespace,
    ignoreFocusOut: true
  });
  if (!defaultNamespace) {
    return;
  }
  return { path: projectPath, name, groupId, projectId, defaultNamespace };
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
