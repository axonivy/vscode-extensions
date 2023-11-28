import * as vscode from 'vscode';
import { executeCommand } from '../base/commands';
import { resolveNamespaceFromPath } from './util';

export type ProcessKind = 'Business Process' | 'Callable Sub Process' | 'Web Service Process';

export interface NewProcessParams {
  name: string;
  kind: ProcessKind;
  namespace: string;
  path: string;
}

const prompt =
  'Enter the new process name e.g. "myProcess". You can also specify its directory name in the form "parentDirectory/subDirectory/myProcess".';

export async function addNewProcess(selectedUri: vscode.Uri, projectDir: string, kind: ProcessKind) {
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
  const resolvedNamespace = await resolveNamespaceFromPath(selectedUri, projectDir, 'processes');
  const placeHolder = 'newProcessName';
  const nameWithNamespace = await vscode.window.showInputBox({
    title: 'Process Name',
    prompt,
    placeHolder,
    value: resolvedNamespace ? resolvedNamespace + placeHolder : undefined,
    valueSelection: resolvedNamespace ? [resolvedNamespace.length, -1] : undefined,
    validateInput: validateNameWithNamespace,
    ignoreFocusOut: true
  });
  if (!nameWithNamespace) {
    return;
  }
  const nameStartIndex = nameWithNamespace.lastIndexOf('/') + 1;
  const name = nameWithNamespace.substring(nameStartIndex, nameWithNamespace.length);
  const namespace = nameWithNamespace.substring(0, nameStartIndex);
  return { name, kind, path: projectDir, namespace };
}

function validateNameWithNamespace(value: string): string | undefined {
  const pattern = /^\w+(\/\w+)*$/;
  if (pattern.test(value)) {
    return;
  }
  return `Alphanumeric name expected. ${prompt}`;
}
