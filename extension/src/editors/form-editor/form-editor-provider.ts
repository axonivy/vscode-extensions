import * as vscode from 'vscode';
import { setupCommunication } from './webview-communication';
import { createWebViewContent } from '../webview-helper';
import { messenger } from '../..';

export default class FormEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'ivy.formEditor';

  constructor(readonly context: vscode.ExtensionContext, readonly websocketUrl: URL) {}

  static register(context: vscode.ExtensionContext, websocketUrl: URL): vscode.Disposable {
    const provider = new FormEditorProvider(context, websocketUrl);
    return vscode.window.registerCustomEditorProvider(FormEditorProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    });
  }

  resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): void | Thenable<void> {
    setupCommunication(this.websocketUrl, messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'form-editor');
  }
}
