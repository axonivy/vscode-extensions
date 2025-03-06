import 'vscode-webview-common/css/colors.css';
import './index.css';
import { App, ClientContextProvider, QueryProvider, initQueryClient } from '@axonivy/form-editor';
import { FormClientJsonRpc } from '@axonivy/form-editor-core';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { InitializeConnection, initMessenger, toConnection } from 'vscode-webview-common';
import { VsCodeApi, Messenger } from 'vscode-messenger-webview';
import '@axonivy/form-editor/lib/editor.css';
import { ThemeProvider } from '@axonivy/ui-components';

declare function acquireVsCodeApi(): VsCodeApi;
const messenger = new Messenger(acquireVsCodeApi());

export async function start({ file }: InitializeConnection): Promise<void> {
  const connection = toConnection(messenger, 'formWebSocketMessage');
  const client = await FormClientJsonRpc.startClient(connection);
  const queryClient = initQueryClient();

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider disabled={true}>
        <ClientContextProvider client={client}>
          <QueryProvider client={queryClient}>
            <App context={{ app: '', pmv: '', file }} />
          </QueryProvider>
        </ClientContextProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

initMessenger(messenger, start);
