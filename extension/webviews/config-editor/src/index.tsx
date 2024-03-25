import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { YAMLVariablesTable } from '@axonivy/config-editor';
import { HOST_EXTENSION, NotificationType } from 'vscode-messenger-common';
import { VsCodeApi, Messenger } from 'vscode-messenger-webview';

declare function acquireVsCodeApi(): VsCodeApi;
const messenger = new Messenger(acquireVsCodeApi());

type InitializeConnection = { text: string };

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const UpdateNotification: NotificationType<{ text: string }> = { method: 'update' };
const UpdateDocumentNotification: NotificationType<{ text: string }> = { method: 'updateDocument' };

export async function start({ text }: InitializeConnection): Promise<void> {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <YAMLVariablesTable
        content={text}
        onChange={text => messenger.sendNotification(UpdateDocumentNotification, HOST_EXTENSION, { text })}
      />
    </React.StrictMode>
  );
}

messenger.onNotification(UpdateNotification, start);
messenger.start();
messenger.sendNotification(WebviewReadyNotification, HOST_EXTENSION);
