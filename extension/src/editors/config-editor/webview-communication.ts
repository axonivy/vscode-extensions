import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import { NotificationType } from 'vscode-messenger-common';

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const InitializeConnectionRequest: NotificationType<{ file: string }> = { method: 'initializeConnection' };
const ConfigWebSocketMessage: NotificationType<unknown> = { method: 'configWebSocketMessage' };

export const setupCommunication = (messenger: Messenger, webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument) => {
  const messageParticipant = messenger.registerWebviewPanel(webviewPanel);
  const toDispose = new DisposableCollection(
    messenger.onNotification(WebviewReadyNotification, () => messenger.sendNotification(InitializeConnectionRequest, messageParticipant), {
      sender: messageParticipant
    }),
    messenger.onNotification(ConfigWebSocketMessage, msg => handleClientMessage(msg), { sender: messageParticipant }),
    webviewPanel.onDidChangeViewState(() => {
      if (webviewPanel.active) {
        updateWebview();
      }
    })
  );
  webviewPanel.onDidDispose(() => toDispose.dispose());

  const handleClientMessage = (message: unknown) => {
    if (isData(message)) {
      const result = { jsonrpc: message.jsonrpc, id: message.id, result: { context: message.params, data: document.getText() } };
      messenger.sendNotification(ConfigWebSocketMessage, messageParticipant, JSON.stringify(result));
    }
    if (isSaveData(message)) {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), message.params.data);
      vscode.workspace.applyEdit(edit);
      const result = { jsonrpc: message.jsonrpc, id: message.id, result: {} };
      messenger.sendNotification(ConfigWebSocketMessage, messageParticipant, JSON.stringify(result));
    }
  };

  const isData = (obj: unknown): obj is { jsonrpc: string; id: number; method: string; params: unknown } => {
    return typeof obj === 'object' && obj !== null && 'method' in obj && obj.method === 'data';
  };

  const isSaveData = (obj: unknown): obj is { jsonrpc: string; id: number; method: string; params: { data: string } } => {
    return typeof obj === 'object' && obj !== null && 'method' in obj && obj.method === 'saveData';
  };

  const updateWebview = () =>
    messenger.sendNotification(ConfigWebSocketMessage, messageParticipant, JSON.stringify({ method: 'onDataChanged' }));
};
