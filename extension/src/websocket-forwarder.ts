import { WebSocket } from 'ws';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import vscode from 'vscode';
import { NotificationType, MessageParticipant } from 'vscode-messenger-common';
import { messenger } from './messenger';
import { InscriptionActionArgs } from '@axonivy/inscription-protocol';
import { ActionHandlers } from './inscription-action-handler';

export const InscriptionWebSocketMessage: NotificationType<string> = { method: 'inscriptionWebSocketMessage' };
export const IvyScriptWebSocketMessage: NotificationType<string> = { method: 'ivyScriptWebSocketMessage' };

export class WebSocketForwarder implements vscode.Disposable {
  private readonly toDispose = new DisposableCollection();
  private readonly webSocket: WebSocket;

  constructor(
    wsEndPoint: 'ivy-inscription-lsp' | 'ivy-script-lsp',
    private readonly messageParticipant: MessageParticipant,
    private readonly notificationType: NotificationType<string>
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

  private handleClientMessage(message: string) {
    const obj = JSON.parse(message);
    if (obj?.method === 'action') {
      const handler = this.actionHandlerFor(obj.params);
      if (handler) {
        handler.handle(obj.params);
        return;
      }
    }
    this.webSocket.send(message);
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
