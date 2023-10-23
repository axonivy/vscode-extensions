import * as vscode from 'vscode';
import { YamlEditorProvider } from './editor-provider';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(YamlEditorProvider.register(context));
}
