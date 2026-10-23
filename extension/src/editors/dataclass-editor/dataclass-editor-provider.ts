import type { CustomTextEditorProvider, ExtensionContext, TextDocument, WebviewPanel } from 'vscode';
import { window } from 'vscode';
import { messenger } from '../..';
import type { EditorConnection } from '../editor-connection';
import { createWebViewContent } from '../webview-helper';
import { setupCommunication } from './webview-communication';

export default class DataClassEditorProvider implements CustomTextEditorProvider {
  private static readonly viewType = 'ivy.dataClassEditor';

  private constructor(
    readonly context: ExtensionContext,
    readonly connection: EditorConnection
  ) {}

  static register(context: ExtensionContext, connection: EditorConnection) {
    const provider = new DataClassEditorProvider(context, connection);
    return window.registerCustomEditorProvider(DataClassEditorProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    });
  }

  resolveCustomTextEditor(document: TextDocument, webviewPanel: WebviewPanel) {
    void setupCommunication(this.connection, messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'dataclass-editor');
  }
}
