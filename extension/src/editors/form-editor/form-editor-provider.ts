import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { setupCommunication } from './webview-communication';
import { createWebViewContent } from '../webview-helper';

export default class FormEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'ivy.formEditor';

  constructor(protected readonly context: vscode.ExtensionContext, protected readonly messenger: Messenger) {}

  public static register(context: vscode.ExtensionContext, messenger: Messenger): vscode.Disposable {
    const provider = new FormEditorProvider(context, messenger);
    return vscode.window.registerCustomEditorProvider(FormEditorProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    });
  }

  resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): void | Thenable<void> {
    setupCommunication(this.messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'form-editor');
  }
}
