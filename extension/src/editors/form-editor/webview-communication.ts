import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { WebSocketForwarder } from '../websocket-forwarder';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import { MessageParticipant, NotificationType } from 'vscode-messenger-common';

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
    new FormEditorWebSocketForwarder(messenger, messageParticipant, document),
    messenger.onNotification(
      WebviewReadyNotification,
      () => messenger.sendNotification(InitializeConnectionRequest, messageParticipant, { file: document.fileName }),
      { sender: messageParticipant }
    )
  );
  webviewPanel.onDidDispose(() => toDispose.dispose());
};

export class FormEditorWebSocketForwarder extends WebSocketForwarder {
  private readonly saveListener: vscode.Disposable;

  constructor(messenger: Messenger, messageParticipant: MessageParticipant, readonly document: vscode.TextDocument) {
    super('ivy-form-lsp', messenger, messageParticipant, FormWebSocketMessage);
    this.saveListener = vscode.workspace.onDidSaveTextDocument(e => {
      if (e.uri === document.uri) {
        super.handleClientMessage({ method: 'build', params: { app: '', pmv: '', file: this.document.uri.fsPath } });
      }
    });
  }

  protected override handleClientMessage(message: unknown) {
    if (this.isSaveData(message)) {
      message.method = 'content';
    }
    super.handleClientMessage(message);
  }

  protected override handleServerMessage(message: string): void {
    const obj = JSON.parse(message);
    if (this.isContent(obj)) {
      this.writeTextDocument(obj.result.content);
      return;
    }
    super.handleServerMessage(message);
  }

  isSaveData = (obj: unknown): obj is { method: string } => {
    return typeof obj === 'object' && obj !== null && 'method' in obj && obj.method === 'saveData';
  };

  isContent = (obj: unknown): obj is { result: { content: string } } => {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'result' in obj &&
      typeof obj.result === 'object' &&
      obj.result !== null &&
      'content' in obj.result &&
      typeof obj.result.content === 'string'
    );
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

  override dispose(): void {
    super.dispose();
    this.saveListener.dispose();
  }
}
