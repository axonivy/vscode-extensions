import { WebSocket } from 'ws';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import vscode from 'vscode';
import { NotificationType, MessageParticipant } from 'vscode-messenger-common';
import { messenger } from './messenger';
import { InscriptionActionArgs } from '@axonivy/inscription-protocol';
import { ActionHandlers } from './inscription-action-handler';

export const InscriptionWebSocketMessage: NotificationType<unknown> = { method: 'inscriptionWebSocketMessage' };
export const IvyScriptWebSocketMessage: NotificationType<unknown> = { method: 'ivyScriptWebSocketMessage' };

export class WebSocketForwarder implements vscode.Disposable {
  private readonly toDispose = new DisposableCollection();
  private readonly webSocket: WebSocket;

  constructor(
    wsEndPoint: 'ivy-inscription-lsp' | 'ivy-script-lsp',
    private readonly messageParticipant: MessageParticipant,
    private readonly notificationType: NotificationType<unknown>
  ) {
    this.webSocket = new WebSocket(buildWebSocketUrl(wsEndPoint));
    this.webSocket.onopen = () => {
      this.initialize();
    };
  }

  private initialize(): void {
    this.toDispose.push(
      messenger.onNotification(this.notificationType, message => this.handleClientMessage(message), {
        sender: this.messageParticipant
      })
    );
    this.webSocket.on('message', msg => {
      messenger.sendNotification(this.notificationType, this.messageParticipant, msg.toString());
    });
  }

  private handleClientMessage(message: unknown) {
    if (this.isAction(message)) {
      const handler = this.actionHandlerFor(message.params);
      if (handler) {
        handler.handle(message.params, (type: string) =>
          messenger.sendNotification(this.notificationType, this.messageParticipant, JSON.stringify({ method: type }))
        );
        return;
      }
    }
    this.webSocket.send(JSON.stringify(message));
  }

  private isAction(obj: unknown): obj is { method: string; params: InscriptionActionArgs } {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'method' in obj &&
      obj.method === 'action' &&
      'params' in obj &&
      typeof obj.params === 'object'
    );
  }

  private actionHandlerFor(action: InscriptionActionArgs) {
    return ActionHandlers.find(handler => handler.actionId === action.actionId);
  }

  dispose(): void {
    this.toDispose.dispose();
    this.webSocket.close();
  }
}

function buildWebSocketUrl(endPoint: string) {
  const baseUrl = process.env.WEB_SOCKET_ADDRESS ?? '';
  if (baseUrl.endsWith('/')) {
    return `${baseUrl}${endPoint}`;
  }
  return `${baseUrl}/${endPoint}`;
}
