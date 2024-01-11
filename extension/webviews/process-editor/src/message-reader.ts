/* eslint-disable @typescript-eslint/no-explicit-any */

import { Disposable } from 'vscode-jsonrpc';
import { DataCallback, AbstractMessageReader, MessageReader } from 'vscode-jsonrpc/lib/common/messageReader.js';
import { NotificationType } from 'vscode-messenger-common';
import { Messenger } from 'vscode-messenger-webview';

export class WebSocketMessageReader extends AbstractMessageReader implements MessageReader {
  protected state: 'initial' | 'listening' | 'closed' = 'initial';
  protected callback: DataCallback | undefined;
  protected readonly events: { message?: any; error?: any }[] = [];

  constructor(private readonly messenger: Messenger, private notificationType: NotificationType<string>) {
    super();
    this.messenger.onNotification(this.notificationType, message => this.readMessage(message));
  }

  listen(callback: DataCallback): Disposable {
    if (this.state === 'initial') {
      this.state = 'listening';
      this.callback = callback;
      while (this.events.length !== 0) {
        const event = this.events.pop()!;
        if (event.message) {
          this.readMessage(event.message);
        } else if (event.error) {
          this.fireError(event.error);
        } else {
          this.fireClose();
        }
      }
    }
    return {
      dispose: () => {
        if (this.callback === callback) {
          this.callback = undefined;
        }
      }
    };
  }

  protected readMessage(message: any): void {
    if (this.state === 'initial') {
      this.events.splice(0, 0, { message });
    } else if (this.state === 'listening') {
      try {
        const data = JSON.parse(message);
        this.callback!(data);
      } catch (err) {
        const error: Error = {
          name: '' + 400,
          message: `Error during message parsing, reason = ${typeof err === 'object' ? (err as any).message : 'unknown'}`
        };
        this.fireError(error);
      }
    }
  }

  protected override fireError(error: any): void {
    if (this.state === 'initial') {
      this.events.splice(0, 0, { error });
    } else if (this.state === 'listening') {
      super.fireError(error);
    }
  }

  protected override fireClose(): void {
    if (this.state === 'initial') {
      this.events.splice(0, 0, {});
    } else if (this.state === 'listening') {
      super.fireClose();
    }
    this.state = 'closed';
  }
}
