import { Message } from 'vscode-jsonrpc/lib/common/messages.js';
import { AbstractMessageWriter, MessageWriter } from 'vscode-jsonrpc/lib/common/messageWriter.js';
import { HOST_EXTENSION, NotificationType } from 'vscode-messenger-common';
import { Messenger } from 'vscode-messenger-webview';

export class WebSocketMessageWriter extends AbstractMessageWriter implements MessageWriter {
  protected errorCount = 0;

  constructor(private readonly messenger: Messenger, private notificationType: NotificationType<string>) {
    super();
  }

  end(): void {}

  async write(msg: Message): Promise<void> {
    try {
      const content = JSON.stringify(msg);
      this.messenger.sendNotification(this.notificationType, HOST_EXTENSION, content);
    } catch (e) {
      this.errorCount++;
      this.fireError(e, msg, this.errorCount);
    }
  }
}
