import * as vscode from 'vscode';
import { YamlEditorProvider } from './config-editor/editor-provider';
import { IvyProjectExplorer } from './project-explorer/ivy-project-explorer';

export function activate(context: vscode.ExtensionContext) {
  new IvyProjectExplorer(context);
  context.subscriptions.push(YamlEditorProvider.register(context));
}
