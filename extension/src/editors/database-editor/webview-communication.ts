import type { DatabaseActionArgs } from '@axonivy/database-editor-protocol';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import type { TextDocument, WebviewPanel } from 'vscode';
import { Messenger } from 'vscode-messenger';
import type { MessageParticipant, NotificationType } from 'vscode-messenger-common';
import { updateTextDocumentContent } from '../content-writer';
import { resolveEditorContext, type EditorConnection, type EditorContext } from '../editor-connection';
import { EditorWebSocketForwarder } from '../editor-websocket-forwarder';
import {
  hasEditorFileContent,
  InitializeConnectionRequest,
  isAction,
  noUnknownAction,
  openUrlExternally,
  WebviewReadyNotification
} from '../notification-helper';

const ConfigWebSocketMessage: NotificationType<unknown> = { method: 'databaseWebSocketMessage' };

export const setupCommunication = async (connection: EditorConnection, messenger: Messenger, webviewPanel: WebviewPanel, document: TextDocument) => {
  const context = await resolveEditorContext(connection, document.fileName);
  const messageParticipant = messenger.registerWebviewPanel(webviewPanel);
  const toDispose = new DisposableCollection(
    new DatabaseEditorWebSocketForwarder(connection, messenger, messageParticipant, document, context),
    messenger.onNotification(
      WebviewReadyNotification,
      () => messenger.sendNotification(InitializeConnectionRequest, messageParticipant, context),
      { sender: messageParticipant }
    ),
    webviewPanel.onDidDispose(() => toDispose.dispose())
  );
};

class DatabaseEditorWebSocketForwarder extends EditorWebSocketForwarder {
  constructor(connection: EditorConnection, messenger: Messenger, messageParticipant: MessageParticipant, document: TextDocument, context: EditorContext) {
    super(connection, 'ivy-database-lsp', messenger, messageParticipant, ConfigWebSocketMessage, document, context);
  }

  protected override handleClientMessage(message: unknown) {
    if (isAction<DatabaseActionArgs>(message)) {
      switch (message.params.actionId) {
        case 'openUrl':
          openUrlExternally(message.params.payload);
          break;
        default:
          noUnknownAction(message.params.actionId);
      }
    }
    super.handleClientMessage(message);
  }

  protected override async handleServerMessage(message: string) {
    const obj = JSON.parse(message);
    if (hasEditorFileContent(obj)) {
      await updateTextDocumentContent(this.document, obj.result);
    }
    super.handleServerMessage(message);
  }
}
