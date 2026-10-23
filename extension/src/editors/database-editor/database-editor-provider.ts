import type { CustomTextEditorProvider, ExtensionContext, TextDocument, WebviewPanel } from 'vscode';
import { window } from 'vscode';
import { messenger } from '../..';
import { registerOpenConfigEditorCmd } from '../command-helper';
import type { EditorConnection } from '../editor-connection';
import { createWebViewContent } from '../webview-helper';
import { setupCommunication } from './webview-communication';

export class DatabaseEditorProvider implements CustomTextEditorProvider {
  static readonly viewType = 'ivy.databaseEditor';

  private constructor(
    readonly context: ExtensionContext,
    readonly connection: EditorConnection
  ) {}

  static register(context: ExtensionContext, connection: EditorConnection) {
    registerOpenConfigEditorCmd('ivyEditor.openDatabaseEditor', context, 'databases.yaml');
    const provider = new DatabaseEditorProvider(context, connection);
    return window.registerCustomEditorProvider(DatabaseEditorProvider.viewType, provider);
  }

  resolveCustomTextEditor(document: TextDocument, webviewPanel: WebviewPanel) {
    void setupCommunication(this.connection, messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'database-editor');
  }
}
