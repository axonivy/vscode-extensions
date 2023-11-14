import * as vscode from 'vscode';
import { Entry, IvyProjectTreeDataProvider } from './ivy-project-tree-data-provider';
import { Commands, executeCommand } from '../base/commands';
import path from 'path';

export type ProcessKind = 'Business Process' | 'Callable Sub Process' | 'Web Service Process';

export interface NewProcessParams {
  name: string;
  kind: ProcessKind;
  namespace: string;
  path: string;
}

const prompt =
  'Enter the new process name e.g. "myProcess". You can also specify its directory name in the form "parentDirectory/subDirectory/myProcess".';

export async function addNewProcess(kind: ProcessKind, entry?: Entry): Promise<void> {
  if (!entry) {
    throw new Error('Select a Project before creating a new process');
  }
  const input = await collectNewProcessParams(entry, kind);
  if (input) {
    executeCommand(Commands.ENGINE_CREATE_PROCESS, input);
  }
}

async function collectNewProcessParams(entry: Entry, kind: ProcessKind): Promise<NewProcessParams | undefined> {
  const root = IvyProjectTreeDataProvider.rootOf(entry);
  const resolvedNamespace = resolveNamespaceFromPath(entry, root);
  const placeHolder = 'newProcessName';
  const nameWithNamespace = await vscode.window.showInputBox({
    title: 'Process Name',
    prompt,
    placeHolder,
    value: resolvedNamespace ? resolvedNamespace + placeHolder : undefined,
    valueSelection: resolvedNamespace ? [resolvedNamespace.length, -1] : undefined,
    validateInput: validateNameWithNamespace
  });
  if (!nameWithNamespace) {
    return;
  }
  const nameStartIndex = nameWithNamespace.lastIndexOf('/') + 1;
  const name = nameWithNamespace.substring(nameStartIndex, nameWithNamespace.length);
  const namespace = nameWithNamespace.substring(0, nameStartIndex);
  const path = root.uri.fsPath;
  return { name, kind, path, namespace };
}

function resolveNamespaceFromPath(entry: Entry, root: Entry): string | undefined {
  const entryPath = entry.type === vscode.FileType.File ? path.dirname(entry.uri.path) : entry.uri.path;
  const processPath = path.join(root.uri.path, 'processes') + path.sep;
  if (entryPath.startsWith(processPath)) {
    const namespace = entryPath.replace(processPath, '').replaceAll(path.sep, '/');
    return namespace + '/';
  }
  return undefined;
}

function validateNameWithNamespace(value: string): string | undefined {
  const pattern = /^\w+(\/\w+)*$/;
  if (pattern.test(value)) {
    return;
  }
  return `Alphanumeric name expected. ${prompt}`;
}
