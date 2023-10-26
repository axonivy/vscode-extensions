import * as vscode from 'vscode';
import { Entry, IvyProjectTreeDataProvider } from './ivy-project-tree-data-provider';
import { Commands, executeCommand } from '../base/commands';
import path from 'path';

export interface NewProcessParams {
  name: string;
  kind: string;
  namespace: string;
  path: string;
}

export async function addNewProcess(entry: Entry): Promise<void> {
  if (!entry) {
    throw new Error('Select a Project before creating a new process');
  }
  const input = await collectNewProcessParams(entry);
  if (input) {
    executeCommand(Commands.ENGINE_CREATE_PROCESS, input);
  }
}

async function collectNewProcessParams(entry: Entry): Promise<NewProcessParams | undefined> {
  const name = await vscode.window.showInputBox({ title: 'Process Name' });
  if (!name) {
    return;
  }
  const root = IvyProjectTreeDataProvider.rootOf(entry);
  const resolvedNamespace = resolveNamespaceFromPath(entry, root);
  const namespace = await vscode.window.showInputBox({ title: 'Namespace', value: resolvedNamespace });
  if (!namespace && namespace !== '') {
    return;
  }
  const kind = await vscode.window.showQuickPick(['Business Process', 'Callable Sub Process', 'Web Service Process']);
  if (!kind) {
    return;
  }
  const path = root.uri.fsPath;
  return { name, kind, path, namespace };
}

function resolveNamespaceFromPath(entry: Entry, root: Entry): string {
  const entryPath = entry.type === vscode.FileType.File ? path.dirname(entry.uri.path) : entry.uri.path;
  const processPath = path.join(root.uri.path, 'processes') + path.sep;
  if (entryPath.startsWith(processPath)) {
    const namespace = entryPath.replace(processPath, '').replaceAll(path.sep, '/');
    return namespace;
  }
  return '';
}
