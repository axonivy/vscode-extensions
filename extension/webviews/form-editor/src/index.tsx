import 'vscode-webview-common/css/colors.css';
import './index.css';
import { App, ClientContextProvider, QueryProvider, initQueryClient } from '@axonivy/form-editor';
import { FormClientJsonRpc } from '@axonivy/form-editor-core';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { WebviewMessageReader, WebviewMessageWriter } from 'vscode-webview-common';
import { HOST_EXTENSION, NotificationType } from 'vscode-messenger-common';
import { VsCodeApi, Messenger } from 'vscode-messenger-webview';
import '@axonivy/form-editor/lib/style.css';

declare function acquireVsCodeApi(): VsCodeApi;
const messenger = new Messenger(acquireVsCodeApi());

type InitializeConnection = { file: string };

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const InitializeConnectionNotification: NotificationType<InitializeConnection> = { method: 'initializeConnection' };
const FormWebSocketMessage: NotificationType<unknown> = { method: 'formWebSocketMessage' };

export async function start({ file }: InitializeConnection): Promise<void> {
  const client = await FormClientJsonRpc.startClient({
    reader: new WebviewMessageReader(messenger, FormWebSocketMessage),
    writer: new WebviewMessageWriter(messenger, FormWebSocketMessage)
  });
  const queryClient = initQueryClient();

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  createRoot(rootElement).render(
    <React.StrictMode>
      <ClientContextProvider client={client}>
        <QueryProvider client={queryClient}>
          <App context={{ app: '', pmv: '', file }} />
        </QueryProvider>
      </ClientContextProvider>
    </React.StrictMode>
  );
}

messenger.onNotification(InitializeConnectionNotification, start);
messenger.start();
messenger.sendNotification(WebviewReadyNotification, HOST_EXTENSION);
