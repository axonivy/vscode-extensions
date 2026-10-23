import type { CaseMapActionArgs } from '@axonivy/case-map-editor-protocol';
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

const CaseMapWebSocketMessage: NotificationType<unknown> = { method: 'caseMapWebSocketMessage' };

export const setupCommunication = async (connection: EditorConnection, messenger: Messenger, webviewPanel: WebviewPanel, document: TextDocument) => {
  const context = await resolveEditorContext(connection, document.fileName);
  const messageParticipant = messenger.registerWebviewPanel(webviewPanel);
  const toDispose = new DisposableCollection(
    new CaseMapEditorWebSocketForwarder(connection, messenger, messageParticipant, document, context),
    messenger.onNotification(
      WebviewReadyNotification,
      () => messenger.sendNotification(InitializeConnectionRequest, messageParticipant, context),
      { sender: messageParticipant }
    ),
    webviewPanel.onDidDispose(() => toDispose.dispose())
  );
};

class CaseMapEditorWebSocketForwarder extends EditorWebSocketForwarder {
  constructor(connection: EditorConnection, messenger: Messenger, messageParticipant: MessageParticipant, document: TextDocument, context: EditorContext) {
    super(connection, 'ivy-case-map-lsp', messenger, messageParticipant, CaseMapWebSocketMessage, document, context);
  }

  protected override handleClientMessage(message: unknown) {
    if (isAction<CaseMapActionArgs>(message)) {
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
