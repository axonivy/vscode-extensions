import { InscriptionClientJsonRpc, IvyScriptLanguage, MonacoUtil } from '@axonivy/inscription-core';
import { InscriptionClient } from '@axonivy/inscription-protocol';
import { App, ClientContextInstance, MonacoEditorUtil } from '@axonivy/inscription-editor';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import * as reactMonaco from 'monaco-editor/esm/vs/editor/editor.api';

declare var acquireVsCodeApi: any;

interface Message {
  command: string;
}

interface PidMessage extends Message {
  args: { pid?: string };
}

interface PortMessage extends Message {
  args: { port?: string } & PidMessage['args'];
}

export async function start(): Promise<void> {
  let client: Promise<InscriptionClient>;
  const root = ReactDOM.createRoot(document.getElementById('root')!);

  window.addEventListener('message', event => {
    const message = event.data;
    switch (message?.command) {
      case 'engine_port':
        if (!client) {
          startIvyScriptLSP(message);
          client = getInscriptionClient(message);
          client.then(client => root.render(render(client, (message as PortMessage).args.pid)));
        }
        break;
      case 'pid':
        if (client) {
          client.then(client => root.render(render(client, (message as PidMessage).args.pid)));
        } else {
          const vscode = acquireVsCodeApi();
          vscode.postMessage({ command: 'ready' });
        }
        break;
    }
  });
}

function startIvyScriptLSP(message: PortMessage) {
  MonacoEditorUtil.initMonaco(reactMonaco, 'dark');
  MonacoUtil.initStandalone();
  IvyScriptLanguage.startWebSocketClient(`ws://localhost:${message.args.port}/web-ide/ivy-script-lsp`);
}

async function getInscriptionClient(message: PortMessage) {
  const client = await InscriptionClientJsonRpc.startWebSocketClient(`ws://localhost:${message.args.port}/web-ide/ivy-inscription-lsp`);
  await client.initialize();
  return client;
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
