import { WebSocket } from 'ws';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import vscode from 'vscode';
import { NotificationType, MessageParticipant } from 'vscode-messenger-common';
import { Messenger } from 'vscode-messenger';

export class WebSocketForwarder implements vscode.Disposable {
  readonly toDispose = new DisposableCollection();
  readonly webSocket: WebSocket;

  constructor(
    readonly websocketUrl: URL,
    readonly websocketEndpoint: 'ivy-inscription-lsp' | 'ivy-script-lsp' | 'ivy-form-lsp' | 'ivy-variables-lsp' | 'ivy-data-class-lsp',
    readonly messenger: Messenger,
    readonly messageParticipant: MessageParticipant,
    readonly notificationType: NotificationType<unknown>
  ) {
    this.webSocket = new WebSocket(new URL(websocketEndpoint, websocketUrl));
    this.webSocket.onopen = () => this.initialize();
  }

  protected initialize(): void {
    this.toDispose.push(
      this.messenger.onNotification(this.notificationType, message => this.handleClientMessage(message), {
        sender: this.messageParticipant
      })
    );
    this.webSocket.on('message', msg => this.handleServerMessage(msg.toString()));
  }

  protected handleServerMessage(message: string) {
    this.messenger.sendNotification(this.notificationType, this.messageParticipant, message);
  }

  protected handleClientMessage(message: unknown) {
    this.webSocket.send(JSON.stringify(message));
  }

  dispose(): void {
    this.toDispose.dispose();
    this.webSocket.close();
  }
}
