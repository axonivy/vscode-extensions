import { InscriptionClientJsonRpc, IvyScriptLanguage, MonacoUtil } from '@axonivy/inscription-core';
import { InscriptionClient } from '@axonivy/inscription-protocol';
import { App, ClientContextInstance, MonacoEditorUtil, ThemeMode } from '@axonivy/inscription-editor';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import * as reactMonaco from 'monaco-editor/esm/vs/editor/editor.api';
import { SelectedElement } from '@axonivy/vscode-base';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

declare var acquireVsCodeApi: any;
var vscode = acquireVsCodeApi();
var client: Promise<InscriptionClient> | undefined;
var root: ReactDOM.Root;

interface Message {
  command: string;
}

interface SelectedElementMessage extends Message {
  selectedElement: SelectedElement;
}

interface ConnectToEngineMessage extends Message {
  webSocketAddress: string;
}

interface SetMonacoThemeMessage extends Message {
  theme: string;
}

export async function start(): Promise<void> {
  root = ReactDOM.createRoot(document.getElementById('root')!);
  vscode.postMessage({ command: 'ready' });
  window.addEventListener('message', handleMessages);
}

function handleMessages(event: MessageEvent<any>) {
  const message = event.data;
  switch (message?.command) {
    case 'selectedElement':
      handleSelectedElementCommand(message);
      break;
    case 'connect.to.web.sockets':
      handleConnectToWebSocketsCommand(message);
      break;
    case 'theme':
      const themeMessage = message as SetMonacoThemeMessage;
      reactMonaco.editor.defineTheme(MonacoEditorUtil.DEFAULT_THEME_NAME, MonacoEditorUtil.themeData(themeMessage.theme as ThemeMode));
      break;
  }
}

function handleSelectedElementCommand(message: SelectedElementMessage) {
  if (client) {
    client.then(client => root.render(render(client, message.selectedElement)));
    return;
  }
  vscode.postMessage({ command: 'ready' });
}

function handleConnectToWebSocketsCommand(message: ConnectToEngineMessage) {
  if (client) {
    return;
  }
  startIvyScriptLSP(message.webSocketAddress);
  startInscriptionClient(message.webSocketAddress);
}

function startIvyScriptLSP(webSocketAddress: string) {
  MonacoEditorUtil.initMonaco(reactMonaco, 'dark');
  MonacoUtil.initStandalone();
  IvyScriptLanguage.startWebSocketClient(webSocketAddress + 'ivy-script-lsp');
}

function startInscriptionClient(webSocketAddress: string) {
  client = InscriptionClientJsonRpc.startWebSocketClient(webSocketAddress + 'ivy-inscription-lsp');
  client.then(cl => cl.initialize());
}

const queryClient = new QueryClient();

export function render(inscriptionClient: InscriptionClient, selectedElement: SelectedElement = undefined): React.ReactElement {
  return (
    <React.StrictMode>
      <ClientContextInstance.Provider value={{ client: inscriptionClient }}>
        <QueryClientProvider client={queryClient}>{renderApp(selectedElement)}</QueryClientProvider>
      </ClientContextInstance.Provider>
    </React.StrictMode>
  );

  function renderApp(selectedElement: SelectedElement): React.ReactElement {
    if (selectedElement) {
      return <App app={selectedElement.app} pmv={selectedElement.pmv} pid={selectedElement.pid} />;
    }
    return <App app='' pmv='' pid='' />;
  }
}

start();
