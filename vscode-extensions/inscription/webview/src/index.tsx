import { InscriptionClientJsonRpc, IvyScriptLanguage, MonacoUtil } from '@axonivy/inscription-core';
import { InscriptionClient } from '@axonivy/inscription-protocol';
import { App, ClientContextInstance, MonacoEditorUtil } from '@axonivy/inscription-editor';
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
  webSocketUrl: string
  appName: string;
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
    case 'connect.to.engine':
      handleConnectToEngineCommand(message);
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

function handleConnectToEngineCommand(message: ConnectToEngineMessage) {
  if (client) {
    return;
  }
  const url = resolveUrl(message);
  startIvyScriptLSP(url);
  startInscriptionClient(url);
}

function resolveUrl(message: ConnectToEngineMessage) {
  return `${message.webSocketUrl}${message.appName}/`;
}

function startIvyScriptLSP(url: string) {
  MonacoEditorUtil.initMonaco(reactMonaco, 'dark');
  MonacoUtil.initStandalone();
  IvyScriptLanguage.startWebSocketClient(url + 'ivy-script-lsp');
}

function startInscriptionClient(url: string) {
  client = InscriptionClientJsonRpc.startWebSocketClient(url + 'ivy-inscription-lsp');
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
