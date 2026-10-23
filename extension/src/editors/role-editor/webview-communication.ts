import type { RoleActionArgs } from '@axonivy/role-editor-protocol';
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

const RoleWebSocketMessage: NotificationType<unknown> = { method: 'roleWebSocketMessage' };

export const setupCommunication = async (
  connection: EditorConnection,
  messenger: Messenger,
  webviewPanel: WebviewPanel,
  document: TextDocument
) => {
  const context = await resolveEditorContext(connection, document.fileName);
  const messageParticipant = messenger.registerWebviewPanel(webviewPanel);
  const toDispose = new DisposableCollection(
    new RoleEditorWebSocketForwarder(connection, messenger, messageParticipant, document, context),
    messenger.onNotification(
      WebviewReadyNotification,
      () =>
        messenger.sendNotification(InitializeConnectionRequest, messageParticipant, {
          workspaceId: connection.workspaceId,
          projectId: context.projectId,
          file: context.file
        }),
      { sender: messageParticipant }
    ),
    webviewPanel.onDidDispose(() => toDispose.dispose())
  );
};

class RoleEditorWebSocketForwarder extends EditorWebSocketForwarder {
  constructor(
    connection: EditorConnection,
    messenger: Messenger,
    messageParticipant: MessageParticipant,
    document: TextDocument,
    context: EditorContext
  ) {
    super(connection, 'ivy-role-lsp', messenger, messageParticipant, RoleWebSocketMessage, document, context);
  }

  protected override handleClientMessage(message: unknown) {
    if (isAction<RoleActionArgs>(message)) {
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

  protected override handleServerMessage(message: string) {
    const obj = JSON.parse(message);
    if (hasEditorFileContent(obj)) {
      updateTextDocumentContent(this.document, obj.result).then(() => super.handleServerMessage(message));
    } else {
      super.handleServerMessage(message);
    }
  }
}
