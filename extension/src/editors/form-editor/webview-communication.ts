import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { WebSocketForwarder } from '../websocket-forwarder';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import { NotificationType } from 'vscode-messenger-common';

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const InitializeConnectionRequest: NotificationType<{ file: string }> = { method: 'initializeConnection' };
const FormWebSocketMessage: NotificationType<unknown> = { method: 'formWebSocketMessage' };

export const setupCommunication = (messenger: Messenger, webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument) => {
  const webSocketAddress = process.env.WEB_SOCKET_ADDRESS;
  if (!webSocketAddress) {
    throw Error('No Ivy Engine Url available');
  }
  const messageParticipant = messenger.registerWebviewPanel(webviewPanel);
  const toDispose = new DisposableCollection(
    new FormEditorWebSocketForwarder('ivy-form-lsp', messenger, messageParticipant, FormWebSocketMessage),
    messenger.onNotification(
      WebviewReadyNotification,
      () => messenger.sendNotification(InitializeConnectionRequest, messageParticipant, { file: document.fileName }),
      { sender: messageParticipant }
    )
  );
  webviewPanel.onDidDispose(() => toDispose.dispose());
};

export class FormEditorWebSocketForwarder extends WebSocketForwarder {
  protected override handleClientMessage(message: unknown) {
    if (this.isSaveData(message)) {
      message.method = 'saveDataAndBuild';
    }
    super.handleClientMessage(message);
  }

  isSaveData = (obj: unknown): obj is { method: string } => {
    return typeof obj === 'object' && obj !== null && 'method' in obj && obj.method === 'saveData';
  };
}
