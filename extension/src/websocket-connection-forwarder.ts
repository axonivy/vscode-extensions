import { WebSocket } from 'ws';
import { createWebSocketConnection, WebSocketWrapper } from '@eclipse-glsp/protocol';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import vscode from 'vscode';
import { NotificationType, MessageParticipant } from 'vscode-messenger-common';
import { messenger } from './messenger';

export const InscriptionWebSocketMessage: NotificationType<string> = { method: 'inscriptionWebSocketMessage' };
export const IvyScriptWebSocketMessage: NotificationType<string> = { method: 'ivyScriptWebSocketMessage' };

export class WebSocketConnectionForwarder implements vscode.Disposable {
  private toDispose = new DisposableCollection();
  private webSocket: WebSocket;

  constructor(
    webSocketAddress: string,
    private messageParticipant: MessageParticipant,
    private notificationType: NotificationType<string>
  ) {
    this.webSocket = new WebSocket(webSocketAddress);
    this.webSocket.onopen = () => {
      this.initialize();
    };
  }

  private initialize(): void {
    vscode.Disposable;
    const wrappedWebSocket = wrapWebSocket(this.webSocket);
    const connection = createWebSocketConnection(wrappedWebSocket);
    connection.listen();

    this.toDispose.push(
      connection.onClose(() => this.webSocket.close()),
      messenger.onNotification(
        this.notificationType,
        message => {
          wrappedWebSocket.send(message);
        },
        {
          sender: this.messageParticipant
        }
      )
    );
    this.webSocket.on('message', msg => {
      messenger.sendNotification(this.notificationType, this.messageParticipant, msg.toString());
    });
  }

  protected decodeMessage(buffer: Uint8Array): string {
    return new TextDecoder().decode(buffer);
  }

  dispose(): void {
    this.toDispose.dispose();
    this.webSocket.close();
  }
}

export function wrapWebSocket(socket: WebSocket): WebSocketWrapper {
  return {
    send: content => socket.send(content),
    onMessage: cb => socket.on('message', cb),
    onClose: cb => socket.on('close', cb),
    onError: cb => socket.on('error', cb),
    dispose: () => socket.close()
  };
}
