import * as vscode from 'vscode';
import { createWebViewContent } from '../webview-helper';
import { registerNewVariablesFileCmd } from './new-variable-file-cmd';
import { setupCommunication } from './webview-communication';
import { messenger } from '../..';

export class VariableEditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = 'ivy.variableEditor';

  private constructor(readonly context: vscode.ExtensionContext, readonly websocketUrl: URL) {}

  static register(context: vscode.ExtensionContext, websocketUrl: URL): vscode.Disposable {
    registerNewVariablesFileCmd(context);
    const provider = new VariableEditorProvider(context, websocketUrl);
    const providerRegistration = vscode.window.registerCustomEditorProvider(VariableEditorProvider.viewType, provider);
    return providerRegistration;
  }

  resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    setupCommunication(this.websocketUrl, messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'config-editor');
  }
}
