import { InscriptionClientJsonRpc, IvyScriptLanguage, MonacoUtil } from '@axonivy/inscription-core';
import { InscriptionClient } from '@axonivy/inscription-protocol';
import { App } from '@axonivy/inscription-editor';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClientContextInstance, MonacoEditorUtil } from '@axonivy/inscription-editor';
import './index.css';
import * as reactMonaco from 'monaco-editor/esm/vs/editor/editor.api';

declare var acquireVsCodeApi: any;

interface Message {
  command: string;
}

interface PidMessage extends Message {
  args: { pid?: string };
}

export async function start(): Promise<void> {
  MonacoEditorUtil.initMonaco(reactMonaco, 'dark');
  // for the demonstration we do not load web workers as their support is not great in web extensions
  // potential work arounds can be found here: https://github.com/microsoft/vscode/issues/87282
  MonacoUtil.initStandalone();
  IvyScriptLanguage.startWebSocketClient('ws://localhost:8081/designer/ivy-script-lsp');

  const root = ReactDOM.createRoot(document.getElementById('root')!);
  const client = await InscriptionClientJsonRpc.startWebSocketClient(`ws://localhost:8081/designer/ivy-inscription-lsp`);
  await client.initialize();

  window.addEventListener('message', event => {
    const message = event.data;
    switch (message?.command) {
      case 'pid':
        root.render(render(client, (message as PidMessage).args.pid));
        break;
    }
  });

  root.render(render(client));

  const vscode = acquireVsCodeApi();
  vscode.postMessage({ command: 'ready' });
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
