import { BaseRpcClient, Connection, createMessageConnection, Disposable } from '@axonivy/jsonrpc';
import { Callback, WebIdeClient } from './jsonrpc-protocol';
import { ProcessBean } from './generated/client';

export interface WebIdeOnRequestTypes {
  openEditor: [ProcessBean, Promise<boolean>];
}

export type AnimationSettings = {
  animate: boolean;
  speed: number;
  mode: string;
};

export interface WebIdeNotificationTypes {
  animationSettings: [AnimationSettings];
}

export class WebIdeClientJsonRpc extends BaseRpcClient implements WebIdeClient {
  onOpenEditor = new Callback<ProcessBean, Promise<boolean>>();
  protected override setupConnection(): void {
    super.setupConnection();
    this.toDispose.push(this.onOpenEditor);
    this.onRequest('openEditor', data => this.onOpenEditor.call(data) ?? new Promise(() => false));
  }

  animationSettings(settings: AnimationSettings) {
    return this.sendNotification('animationSettings', settings);
  }

  sendNotification<K extends keyof WebIdeNotificationTypes>(command: K, args: WebIdeNotificationTypes[K][0]) {
    return args === undefined ? this.connection.sendNotification(command) : this.connection.sendNotification(command, args);
  }

  onRequest<K extends keyof WebIdeOnRequestTypes>(
    kind: K,
    listener: (args: WebIdeOnRequestTypes[K][0]) => WebIdeOnRequestTypes[K][1]
  ): Disposable {
    return this.connection.onRequest(kind, listener);
  }

  public static async startClient(connection: Connection): Promise<WebIdeClient> {
    const messageConnection = createMessageConnection(connection.reader, connection.writer);
    const client = new WebIdeClientJsonRpc(messageConnection);
    client.start();
    connection.reader.onClose(() => client.stop());
    return client;
  }
}
