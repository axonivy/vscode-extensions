import { App, ClientContextProvider, RestClientClientJsonRpc, initQueryClient } from '@axonivy/restclient-editor';
import '@axonivy/restclient-editor/lib/editor.css';
import type { OpenActionMessage } from '@axonivy/restclient-editor/lib/editor/Editor';
import { HotkeysProvider, ThemeProvider, Toaster } from '@axonivy/ui-components';
import { type InitializeConnection, initMessenger, toConnection } from '@axonivy/vscode-webview-common';
import '@axonivy/vscode-webview-common/css/colors.css';
import { QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Messenger, type VsCodeApi } from 'vscode-messenger-webview';
import { initTranslation } from './i18n';

let render: (openActionMessage?: OpenActionMessage) => void;

declare function acquireVsCodeApi(): VsCodeApi;
const messenger = new Messenger(acquireVsCodeApi());

let openActionMessage: OpenActionMessage;
messenger.onNotification<OpenActionMessage>({ method: 'openAction' }, message => {
  openActionMessage = message;
  render(openActionMessage);
});

export async function start({ file }: InitializeConnection) {
  const connection = toConnection(messenger, 'restClientWebSocketMessage');
  const client = await RestClientClientJsonRpc.startClient(connection);
  const queryClient = initQueryClient();
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  initTranslation();
  const context = { app: '', project: '', file };
  await client.initialize(context);

  const root = createRoot(rootElement);
  render = (openActionMessage?: OpenActionMessage) =>
    root.render(
      <React.StrictMode>
        <ThemeProvider disabled={true}>
          <ClientContextProvider client={client}>
            <QueryClientProvider client={queryClient}>
              <HotkeysProvider initiallyActiveScopes={['global']}>
                <App context={context} openActionMessage={openActionMessage} />
                <Toaster closeButton={true} />
              </HotkeysProvider>
            </QueryClientProvider>
          </ClientContextProvider>
        </ThemeProvider>
      </React.StrictMode>
    );
  render(openActionMessage);
}

initMessenger(messenger, start);
