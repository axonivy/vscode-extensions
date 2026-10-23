import type { CustomTextEditorProvider, ExtensionContext, TextDocument, WebviewPanel } from 'vscode';
import { window } from 'vscode';
import { messenger } from '../..';
import type { EditorConnection } from '../editor-connection';
import { createWebViewContent } from '../webview-helper';
import { setupCommunication } from './webview-communication';

export class CaseMapEditorProvider implements CustomTextEditorProvider {
  static readonly viewType = 'ivy.casemapEditor';

  private constructor(
    readonly context: ExtensionContext,
    readonly connection: EditorConnection
  ) {}

  static register(context: ExtensionContext, connection: EditorConnection) {
    const provider = new CaseMapEditorProvider(context, connection);
    const providerRegistration = window.registerCustomEditorProvider(CaseMapEditorProvider.viewType, provider);
    return providerRegistration;
  }

  resolveCustomTextEditor(document: TextDocument, webviewPanel: WebviewPanel) {
    void setupCommunication(this.connection, messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'casemap-editor');
  }
}
