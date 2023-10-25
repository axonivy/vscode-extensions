import * as vscode from 'vscode';
import { Entry } from './ivy-project-tree-data-provider';
import { Commands, executeCommand } from '../base/commands';

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
  const namespace = await vscode.window.showInputBox({ title: 'Namespace', placeHolder: '<default>' });
  if (!namespace && namespace !== '') {
    return;
  }
  const kind = await vscode.window.showQuickPick(['Business Process', 'Callable Sub Process', 'Web Service Process']);
  if (!kind) {
    return;
  }
  const path = entry.uri.fsPath;
  return { name, kind, path, namespace };
}
