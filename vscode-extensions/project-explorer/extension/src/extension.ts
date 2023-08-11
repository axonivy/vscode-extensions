import * as vscode from 'vscode';
import { IvyProjectExplorer } from './ivy-project-explorer';

export function activate(context: vscode.ExtensionContext) {
  new IvyProjectExplorer(context);
}
