import { ClientContextProvider, ClientJsonRpc, QueryProvider, VariableEditor, initQueryClient } from '@axonivy/variable-editor';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { HOST_EXTENSION, NotificationType } from 'vscode-messenger-common';
import { Messenger, VsCodeApi } from 'vscode-messenger-webview';
import { WebviewMessageReader, WebviewMessageWriter } from 'vscode-webview-common';
import 'vscode-webview-common/css/colors.css';
import '@axonivy/variable-editor/lib/editor.css';

declare function acquireVsCodeApi(): VsCodeApi;
const messenger = new Messenger(acquireVsCodeApi());

type InitializeConnection = { file: string };

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const InitializeConnectionNotification: NotificationType<InitializeConnection> = { method: 'initializeConnection' };
const ConfigWebSocketMessage: NotificationType<unknown> = { method: 'configWebSocketMessage' };

export async function start({ file }: InitializeConnection): Promise<void> {
  const client = await ClientJsonRpc.startClient({
    reader: new WebviewMessageReader(messenger, ConfigWebSocketMessage),
    writer: new WebviewMessageWriter(messenger, ConfigWebSocketMessage)
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
          <VariableEditor context={{ app: '', pmv: '', file }} />
        </QueryProvider>
      </ClientContextProvider>
    </React.StrictMode>
  );
}

messenger.onNotification(InitializeConnectionNotification, start);
messenger.start();
messenger.sendNotification(WebviewReadyNotification, HOST_EXTENSION);
