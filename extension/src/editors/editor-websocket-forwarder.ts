import type { TextDocument } from 'vscode';
import { Messenger } from 'vscode-messenger';
import type { MessageParticipant, NotificationType } from 'vscode-messenger-common';
import type { EditorConnection, EditorContext } from './editor-connection';
import { WebSocketForwarder, type Endpoint } from './websocket-forwarder';

export class EditorWebSocketForwarder extends WebSocketForwarder {
  constructor(
    connection: EditorConnection,
    websocketEndpoint: Endpoint,
    messenger: Messenger,
    messageParticipant: MessageParticipant,
    notificationType: NotificationType<unknown>,
    readonly document: TextDocument,
    readonly editorContext?: EditorContext
  ) {
    super(connection, websocketEndpoint, messenger, messageParticipant, notificationType);
  }

  override dispose(): void {
    const context = this.editorContext ?? { workspaceId: this.connection.workspaceId, projectId: '', file: this.document.fileName };
    this.webSocket.send(JSON.stringify({ method: 'refreshRdm', params: context }));
    super.dispose();
  }
}
