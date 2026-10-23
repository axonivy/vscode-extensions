import type { CustomTextEditorProvider, ExtensionContext, TextDocument, WebviewPanel } from 'vscode';
import { window } from 'vscode';
import { messenger } from '../..';
import { registerOpenConfigEditorCmd } from '../command-helper';
import type { EditorConnection } from '../editor-connection';
import { createWebViewContent } from '../webview-helper';
import { setupCommunication } from './webview-communication';

export class RoleEditorProvider implements CustomTextEditorProvider {
  static readonly viewType = 'ivy.roleEditor';

  private constructor(
    readonly context: ExtensionContext,
    readonly connection: EditorConnection
  ) {}

  static register(context: ExtensionContext, connection: EditorConnection) {
    registerOpenConfigEditorCmd('ivyEditor.openRoleEditor', context, 'roles.yaml');
    const provider = new RoleEditorProvider(context, connection);
    const providerRegistration = window.registerCustomEditorProvider(RoleEditorProvider.viewType, provider);
    return providerRegistration;
  }

  resolveCustomTextEditor(document: TextDocument, webviewPanel: WebviewPanel) {
    void setupCommunication(this.connection, messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'role-editor');
  }
}
