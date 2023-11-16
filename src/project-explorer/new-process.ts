import * as vscode from 'vscode';
import { executeCommand } from '../base/commands';
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

export async function addNewProcess(selectedUri: vscode.Uri, projectDir: string, kind: ProcessKind): Promise<void> {
  const input = await collectNewProcessParams(selectedUri, projectDir, kind);
  if (input) {
    executeCommand('engine.createProcess', input);
  }
}

async function collectNewProcessParams(
  selectedUri: vscode.Uri,
  projectDir: string,
  kind: ProcessKind
): Promise<NewProcessParams | undefined> {
  const resolvedNamespace = await resolveNamespaceFromPath(selectedUri, projectDir);
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
  return { name, kind, path: projectDir, namespace };
}

async function resolveNamespaceFromPath(selectedUri: vscode.Uri, projectDir: string): Promise<string | undefined> {
  const fileStat = await vscode.workspace.fs.stat(selectedUri);
  const selectedPath = fileStat.type === vscode.FileType.File ? path.dirname(selectedUri.path) : selectedUri.path;
  const processPath = path.join(projectDir, 'processes') + path.sep;
  if (selectedPath.startsWith(processPath)) {
    const namespace = selectedPath.replace(processPath, '').replaceAll(path.sep, '/');
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
