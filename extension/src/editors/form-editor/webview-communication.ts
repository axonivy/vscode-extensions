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
    new WebSocketForwarder('ivy-form-lsp', messenger, messageParticipant, FormWebSocketMessage),
    messenger.onNotification(
      WebviewReadyNotification,
      () => messenger.sendNotification(InitializeConnectionRequest, messageParticipant, { file: document.fileName }),
      { sender: messageParticipant }
    )
  );
  webviewPanel.onDidDispose(() => toDispose.dispose());
};
