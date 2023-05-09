import * as vscode from 'vscode';

import { GlspApi, activate as extensionActivate } from './ivy-extension';

export function activate(context: vscode.ExtensionContext): Promise<GlspApi> {
  return extensionActivate(context);
}
