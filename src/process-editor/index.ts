import 'reflect-metadata';
import * as vscode from 'vscode';

import { activate as extensionActivate } from './ivy-extension';
import { ProcessEditorExtension } from '../base/process-editor-connector';

export function activate(context: vscode.ExtensionContext): Promise<ProcessEditorExtension> {
  return extensionActivate(context);
}
