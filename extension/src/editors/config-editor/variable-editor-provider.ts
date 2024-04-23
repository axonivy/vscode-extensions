import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { createWebViewContent } from '../webview-helper';
import { registerNewVariablesFileCmd } from './new-variable-file-cmd';
import { setupCommunication } from './webview-communication';

export class VariableEditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = 'ivy.variableEditor';

  constructor(private readonly context: vscode.ExtensionContext, private readonly messenger: Messenger) {}

  public static register(context: vscode.ExtensionContext, messenger: Messenger): vscode.Disposable {
    registerNewVariablesFileCmd(context);
    const provider = new VariableEditorProvider(context, messenger);
    const providerRegistration = vscode.window.registerCustomEditorProvider(VariableEditorProvider.viewType, provider);
    return providerRegistration;
  }

  public async resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    setupCommunication(this.messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'config-editor');
  }
}
