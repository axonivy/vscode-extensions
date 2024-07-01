import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import { MessageParticipant, NotificationType } from 'vscode-messenger-common';
import { WebSocketForwarder } from '../websocket-forwarder';

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const InitializeConnectionRequest: NotificationType<{ file: string }> = { method: 'initializeConnection' };
const ConfigWebSocketMessage: NotificationType<unknown> = { method: 'configWebSocketMessage' };

export const setupCommunication = (
  websocketUrl: URL,
  messenger: Messenger,
  webviewPanel: vscode.WebviewPanel,
  document: vscode.TextDocument
) => {
  const messageParticipant = messenger.registerWebviewPanel(webviewPanel);
  const toDispose = new DisposableCollection(
    new VariableEditorWebSocketForwarder(websocketUrl, messenger, messageParticipant, document),
    messenger.onNotification(
      WebviewReadyNotification,
      () => messenger.sendNotification(InitializeConnectionRequest, messageParticipant, { file: document.fileName }),
      { sender: messageParticipant }
    )
  );
  webviewPanel.onDidDispose(() => toDispose.dispose());
};

class VariableEditorWebSocketForwarder extends WebSocketForwarder {
  constructor(websocketUrl: URL, messenger: Messenger, messageParticipant: MessageParticipant, readonly document: vscode.TextDocument) {
    super(websocketUrl, 'ivy-config-lsp', messenger, messageParticipant, ConfigWebSocketMessage);
  }

  protected override handleClientMessage(message: unknown) {
    if (this.isSaveData(message)) {
      this.writeTextDocument(message.params.data);
    }
    super.handleClientMessage(message);
  }

  isSaveData = (obj: unknown): obj is { jsonrpc: string; id: number; method: string; params: { data: string } } => {
    return typeof obj === 'object' && obj !== null && 'method' in obj && obj.method === 'saveData';
  };

  writeTextDocument = (content: string) => {
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.replace(
      this.document.uri,
      new vscode.Range(new vscode.Position(0, 0), new vscode.Position(this.document.lineCount + 1, 0)),
      content
    );
    vscode.workspace.applyEdit(workspaceEdit);
  };
}
