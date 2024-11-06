import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { WebSocketForwarder } from '../websocket-forwarder';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import { MessageParticipant, NotificationType } from 'vscode-messenger-common';
import { FormActionArgs } from '@axonivy/form-editor-protocol';
import { IvyBrowserViewProvider } from '../../browser/ivy-browser-view-provider';

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const InitializeConnectionRequest: NotificationType<{ file: string }> = { method: 'initializeConnection' };
const FormWebSocketMessage: NotificationType<unknown> = { method: 'formWebSocketMessage' };

export const setupCommunication = (
  websocketUrl: URL,
  messenger: Messenger,
  webviewPanel: vscode.WebviewPanel,
  document: vscode.TextDocument
) => {
  const messageParticipant = messenger.registerWebviewPanel(webviewPanel);
  const toDispose = new DisposableCollection(
    new FormEditorWebSocketForwarder(websocketUrl, messenger, messageParticipant, document),
    messenger.onNotification(
      WebviewReadyNotification,
      () => messenger.sendNotification(InitializeConnectionRequest, messageParticipant, { file: document.fileName }),
      { sender: messageParticipant }
    )
  );
  webviewPanel.onDidDispose(() => toDispose.dispose());
};

class FormEditorWebSocketForwarder extends WebSocketForwarder {
  constructor(
    websocketUrl: URL,
    messenger: Messenger,
    messageParticipant: MessageParticipant,
    readonly document: vscode.TextDocument
  ) {
    super(websocketUrl, 'ivy-form-lsp', messenger, messageParticipant, FormWebSocketMessage);
  }

  protected override handleClientMessage(message: unknown) {
    if (this.isSaveData(message)) {
      message.method = 'content';
    }
    if (this.isAction(message)) {
      const file = this.document.uri.path;
      const path = file.substring(0, file.lastIndexOf('.f.json'));
      if (message.params.actionId === 'openProcess') {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${path}Process.p.json`));
      }
      if (message.params.actionId === 'openDataClass') {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${path}Data.d.json`));
      }
      if (message.params.actionId === 'openUrl') {
        IvyBrowserViewProvider.instance.open(message.params.payload);
      }
      return;
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

  isAction = (obj: unknown): obj is { method: string; params: FormActionArgs } => {
    return typeof obj === 'object' && obj !== null && 'method' in obj && obj.method === 'action';
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
}
