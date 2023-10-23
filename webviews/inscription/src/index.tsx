import { InscriptionClientJsonRpc, IvyScriptLanguage, MonacoUtil } from '@axonivy/inscription-core';
import { MonacoEditorUtil } from '@axonivy/inscription-editor';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import * as reactMonaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ConnectToEngineMessage, Message } from './message';
import InscriptionView from './InscriptionView';
import { QueryClient } from '@tanstack/react-query';

declare var acquireVsCodeApi: any;
var vscode = acquireVsCodeApi();

export async function start(): Promise<void> {
  window.addEventListener('message', handleMessages);
  vscode.postMessage({ command: 'ready' });
}

function handleMessages(event: MessageEvent<Message>) {
  const message = event.data;
  switch (message.command) {
    case 'connect.to.web.sockets':
      handleConnectToWebSocketsCommand(message);
      break;
    case 'theme':
      reactMonaco.editor.defineTheme(MonacoEditorUtil.DEFAULT_THEME_NAME, MonacoEditorUtil.themeData(message.theme));
      break;
  }
}

function handleConnectToWebSocketsCommand(message: ConnectToEngineMessage) {
  const webSocketAddress = message.webSocketAddress;
  MonacoEditorUtil.initMonaco(reactMonaco, 'dark');
  MonacoUtil.initStandalone();
  IvyScriptLanguage.startWebSocketClient(webSocketAddress + 'ivy-script-lsp');

  const queryClient = new QueryClient();

  startInscriptionClient(message.webSocketAddress).then(client => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <InscriptionView client={client} queryClient={queryClient} />
      </React.StrictMode>
    );
    vscode.postMessage({ command: 'connected' });
  });
}

async function startInscriptionClient(webSocketAddress: string) {
  const client = await InscriptionClientJsonRpc.startWebSocketClient(webSocketAddress + 'ivy-inscription-lsp');
  await client.initialize();
  return client;
}

start();
