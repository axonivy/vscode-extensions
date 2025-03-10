import { ClientContextProvider, ClientJsonRpc, DataClassEditor, QueryProvider, initQueryClient } from '@axonivy/dataclass-editor';
import { DataClassModel } from '@axonivy/dataclass-editor-protocol';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Messenger, VsCodeApi } from 'vscode-messenger-webview';
import { InitializeConnection, initMessenger, toConnection } from 'vscode-webview-common';
import 'vscode-webview-common/css/colors.css';
import '@axonivy/dataclass-editor/lib/editor.css';
import { ThemeProvider } from '@axonivy/ui-components';
import { NotificationType } from 'vscode-messenger-common';

declare function acquireVsCodeApi(): VsCodeApi;
const messenger = new Messenger(acquireVsCodeApi());

const InvalidateNotifaction: NotificationType<{ content: string }> = { method: 'invalidate' };

export async function start({ file }: InitializeConnection) {
  const connection = toConnection(messenger, 'dataclassWebSocketMessage');
  const client = await ClientJsonRpc.startClient(connection);
  const queryClient = initQueryClient();
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  messenger.onNotification(InvalidateNotifaction, p => {
    client
      .saveData({ context: { app: '', pmv: '', file }, data: JSON.parse(p.content) as DataClassModel, helpUrl: '' })
      .then(() => queryClient.invalidateQueries());
  });
  createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider disabled={true}>
        <ClientContextProvider client={client}>
          <QueryProvider client={queryClient}>
            <DataClassEditor context={{ app: '', pmv: '', file }} />
          </QueryProvider>
        </ClientContextProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

initMessenger(messenger, start);
