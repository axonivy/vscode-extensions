import type { CustomTextEditorProvider, ExtensionContext, TextDocument, WebviewPanel } from 'vscode';
import { window } from 'vscode';
import type { MessageParticipant } from 'vscode-messenger-common';
import { messenger } from '../..';
import { registerOpenConfigEditorCmd } from '../command-helper';
import type { OpenActionMessage } from '../process-editor/inscription-view/open-action';
import { createWebViewContent } from '../webview-helper';
import { setupCommunication } from './webview-communication';

export class RestClientEditorProvider implements CustomTextEditorProvider {
  static readonly viewType = 'ivy.restClientEditor';

  private messageParticipant?: MessageParticipant;

  private constructor(
    readonly context: ExtensionContext,
    readonly websocketUrl: URL
  ) {}

  static register(context: ExtensionContext, websocketUrl: URL) {
    const provider = new RestClientEditorProvider(context, websocketUrl);
    registerOpenConfigEditorCmd('ivyEditor.openRestClientEditor', context, 'rest-clients.yaml', message => provider.onOpenMessage(message));
    const providerRegistration = window.registerCustomEditorProvider(RestClientEditorProvider.viewType, provider);
    return providerRegistration;
  }

  private onOpenMessage(message?: OpenActionMessage) {
    if (!message || !this.messageParticipant) {
      return;
    }
    messenger.sendNotification({ method: 'openAction' }, this.messageParticipant, message);
  }

  resolveCustomTextEditor(document: TextDocument, webviewPanel: WebviewPanel) {
    this.messageParticipant = setupCommunication(this.websocketUrl, messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'restclient-editor');
  }
}
