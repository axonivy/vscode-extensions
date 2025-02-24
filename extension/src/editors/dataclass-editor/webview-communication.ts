import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { WebSocketForwarder } from '../websocket-forwarder';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import { MessageParticipant, NotificationType } from 'vscode-messenger-common';
import { DataActionArgs } from '@axonivy/dataclass-editor-protocol';
import { IvyBrowserViewProvider } from '../../browser/ivy-browser-view-provider';
import { InitializeConnectionRequest, WebviewReadyNotification } from '../notification-helper';
import { hasEditorFileContent, isAction } from '../notification-helper';
import { updateTextDocumentContent } from '../content-writer';

const DataClassWebSocketMessage: NotificationType<unknown> = { method: 'dataclassWebSocketMessage' };

export const setupCommunication = (
  websocketUrl: URL,
  messenger: Messenger,
  webviewPanel: vscode.WebviewPanel,
  document: vscode.TextDocument
) => {
  const messageParticipant = messenger.registerWebviewPanel(webviewPanel);
  const toDispose = new DisposableCollection(
    new DataClassEditorWebSocketForwarder(websocketUrl, messenger, messageParticipant, document),
    messenger.onNotification(
      WebviewReadyNotification,
      () => messenger.sendNotification(InitializeConnectionRequest, messageParticipant, { file: document.fileName }),
      { sender: messageParticipant }
    )
  );
  webviewPanel.onDidDispose(() => toDispose.dispose());
};

class DataClassEditorWebSocketForwarder extends WebSocketForwarder {
  constructor(
    websocketUrl: URL,
    messenger: Messenger,
    messageParticipant: MessageParticipant,
    readonly document: vscode.TextDocument
  ) {
    super(websocketUrl, 'ivy-data-class-lsp', messenger, messageParticipant, DataClassWebSocketMessage);
  }

  protected override handleClientMessage(message: unknown) {
    if (isAction<DataActionArgs>(message) && message.params.actionId === 'openUrl') {
      IvyBrowserViewProvider.instance.open(message.params.payload);
    }
    super.handleClientMessage(message);
  }

  protected override handleServerMessage(message: string) {
    const obj = JSON.parse(message);
    if (hasEditorFileContent(obj)) {
      updateTextDocumentContent(this.document, obj.result).then(() => super.handleServerMessage(message));
    } else {
      super.handleServerMessage(message);
    }
  }
}
