import type { TextDocument } from 'vscode';
import { Messenger } from 'vscode-messenger';
import type { MessageParticipant, NotificationType } from 'vscode-messenger-common';
import { iarEditorLocation } from '../project-explorer/iar-content-provider';
import { WebSocketForwarder, type Endpoint } from './websocket-forwarder';

export class EditorWebSocketForwarder extends WebSocketForwarder {
  constructor(
    websocketUrl: URL,
    websocketEndpoint: Endpoint,
    messenger: Messenger,
    messageParticipant: MessageParticipant,
    notificationType: NotificationType<unknown>,
    readonly document: TextDocument
  ) {
    super(websocketUrl, websocketEndpoint, messenger, messageParticipant, notificationType);
  }

  override dispose(): void {
    const iarLocation = iarEditorLocation(this.document.uri);
    this.webSocket.send(
      JSON.stringify({
        method: 'refreshRdm',
        params: {
          app: iarLocation?.app ?? '',
          project: iarLocation?.project ?? '',
          file: iarLocation?.file ?? this.document.fileName
        }
      })
    );
    super.dispose();
  }
}
