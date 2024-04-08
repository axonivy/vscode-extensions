import * as vscode from 'vscode';
import { setupCommunication } from './webview-communication';
import { createWebViewContent } from '../webview-helper';
import { messenger } from '../../base/messenger';

export default class FormEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'ivy.formEditor';

  constructor(protected readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new FormEditorProvider(context);
    return vscode.window.registerCustomEditorProvider(FormEditorProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    });
  }

  resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): void | Thenable<void> {
    setupCommunication(messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'form-editor');
  }
}
