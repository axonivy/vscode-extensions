import { ClientContextProvider, ClientJsonRpc, QueryProvider, VariableEditor, initQueryClient } from '@axonivy/variable-editor';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { HOST_EXTENSION, NotificationType } from 'vscode-messenger-common';
import { Messenger, VsCodeApi } from 'vscode-messenger-webview';
import { WebviewMessageReader, WebviewMessageWriter } from 'vscode-webview-common';
import 'vscode-webview-common/css/colors.css';

declare function acquireVsCodeApi(): VsCodeApi;
const messenger = new Messenger(acquireVsCodeApi());

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const UpdateNotification: NotificationType<void> = { method: 'initializeConnection' };
const ConfigWebSocketMessage: NotificationType<unknown> = { method: 'configWebSocketMessage' };

export async function start() {
  const client = await ClientJsonRpc.startClient({
    reader: new WebviewMessageReader(messenger, ConfigWebSocketMessage),
    writer: new WebviewMessageWriter(messenger, ConfigWebSocketMessage)
  });
  const queryClient = initQueryClient();
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ClientContextProvider client={client}>
        <QueryProvider client={queryClient}>
          <VariableEditor app={''} pmv={''} file='/variables.yaml' />
        </QueryProvider>
      </ClientContextProvider>
    </React.StrictMode>
  );
}

messenger.onNotification(UpdateNotification, start);
messenger.start();
messenger.sendNotification(WebviewReadyNotification, HOST_EXTENSION);
