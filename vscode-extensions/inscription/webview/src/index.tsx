import { InscriptionClientJsonRpc, IvyScriptLanguage, MonacoUtil } from '@axonivy/inscription-core';
import { InscriptionClient } from '@axonivy/inscription-protocol';
import { App, ClientContextInstance, MonacoEditorUtil, ThemeMode } from '@axonivy/inscription-editor';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import * as reactMonaco from 'monaco-editor/esm/vs/editor/editor.api';

declare var acquireVsCodeApi: any;
var vscode = acquireVsCodeApi();
var client: Promise<InscriptionClient> | undefined;
var root: ReactDOM.Root;

interface Message {
  command: string;
}

interface PidMessage extends Message {
  pid: string;
}

interface ConnectToEngineMessage extends PidMessage {
  webSocketAddress: string;
  theme: string;
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
    case 'pid':
      handlePidCommand(message);
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

function handlePidCommand(message: PidMessage) {
  if (client) {
    client.then(client => root.render(render(client, message.pid)));
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

export function render(inscriptionClient: InscriptionClient, pid: string = ''): React.ReactElement {
  return (
    <React.StrictMode>
      <ClientContextInstance.Provider value={{ client: inscriptionClient }}>
        <App pid={pid} />
      </ClientContextInstance.Provider>
    </React.StrictMode>
  );
}

start();
