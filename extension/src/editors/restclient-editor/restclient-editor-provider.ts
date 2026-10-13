import type { CustomTextEditorProvider, ExtensionContext, TextDocument, Uri, WebviewPanel } from 'vscode';
import { window } from 'vscode';
import type { MessageParticipant } from 'vscode-messenger-common';
import { messenger } from '../..';
import { registerOpenConfigEditorCmd } from '../command-helper';
import type { OpenActionMessage } from '../process-editor/inscription-view/open-action';
import { createWebViewContent } from '../webview-helper';
import { RestClientWebSocketMessage, setupCommunication } from './webview-communication';

export class RestClientEditorProvider implements CustomTextEditorProvider {
  static readonly viewType = 'ivy.restClientEditor';

  private readonly connections = new Map<string, Promise<MessageParticipant | undefined>>();

  private constructor(
    readonly context: ExtensionContext,
    readonly websocketUrl: URL
  ) {}

  static register(context: ExtensionContext, websocketUrl: URL) {
    const provider = new RestClientEditorProvider(context, websocketUrl);
    registerOpenConfigEditorCmd('ivyEditor.openRestClientEditor', context, 'rest-clients.yaml', (message, uri) => provider.onOpenMessage(message, uri));
    const providerRegistration = window.registerCustomEditorProvider(RestClientEditorProvider.viewType, provider);
    return providerRegistration;
  }

  private async onOpenMessage(message: OpenActionMessage | undefined, uri: Uri) {
    if (!message) {
      return;
    }
    const connection = this.connections.get(uri.toString());
    const messageParticipant = await connection;
    if (!messageParticipant || this.connections.get(uri.toString()) !== connection) {
      return;
    }
    const notification =
      message.method === 'selectElement'
        ? { jsonrpc: '2.0', method: message.method, params: message.payload }
        : { jsonrpc: '2.0', method: message.method };
    messenger.sendNotification(RestClientWebSocketMessage, messageParticipant, JSON.stringify(notification));
  }

  resolveCustomTextEditor(document: TextDocument, webviewPanel: WebviewPanel) {
    const key = document.uri.toString();
    const connection = setupCommunication(this.websocketUrl, messenger, webviewPanel, document);
    this.connections.set(key, connection);
    webviewPanel.onDidDispose(() => {
      if (this.connections.get(key) === connection) {
        this.connections.delete(key);
      }
    });
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'restclient-editor');
  }
}
