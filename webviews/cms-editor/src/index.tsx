import { ClientContextProvider, ClientJsonRpc, CmsEditor, initQueryClient, QueryProvider } from '@axonivy/cms-editor';
import '@axonivy/cms-editor/lib/editor.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Messenger, VsCodeApi } from 'vscode-messenger-webview';
import { initMessenger, toConnection } from 'vscode-webview-common';
import 'vscode-webview-common/css/colors.css';

declare function acquireVsCodeApi(): VsCodeApi;
const messenger = new Messenger(acquireVsCodeApi());

export async function start() {
  const connection = toConnection(messenger, 'cmsWebSocketMessage');
  const client = await ClientJsonRpc.startClient(connection);
  const queryClient = initQueryClient();
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  createRoot(rootElement).render(
    <React.StrictMode>
      <ClientContextProvider client={client}>
        <QueryProvider client={queryClient}>
          <CmsEditor context={{ app: '', pmv: '' }} />
        </QueryProvider>
      </ClientContextProvider>
    </React.StrictMode>
  );
}

initMessenger(messenger, start);
