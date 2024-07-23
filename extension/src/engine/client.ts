import { WebSocket } from 'ws';
import { WebIdeClientJsonRpc } from './api/jsonrpc';
import { toSocketConnection } from './api/socket-connection';
import { ProcessBean } from './api/generated/openapi-dev';
import { executeCommand } from '../base/commands';
import * as vscode from 'vscode';
import { config } from '../base/configurations';

export const WebIdeClientProvider = (webSocketUrl: URL) => {
  const webSocket = new WebSocket(new URL('ivy-web-ide-lsp', webSocketUrl));
  webSocket.onopen = () => {
    const connection = toSocketConnection(webSocket);
    WebIdeClientJsonRpc.startClient(connection).then(client => {
      client.animationSettings(settings());
      client.onOpenEditor.set(process => handleOpenEditor(process));
      vscode.workspace.onDidChangeConfiguration(e => {
        e.affectsConfiguration('process.animation') ? client.animationSettings(settings()) : {};
      });
    });
  };
};

const handleOpenEditor = (process: ProcessBean): boolean => {
  if (!process.uri) {
    return false;
  }
  switch (config.processAnimationMode()) {
    case 'all':
      return openEditor(process);
    case 'currentProcess':
      return isCurrentProcess(process);
    case 'openProcesses':
      if (isOpenProcesses(process)) {
        return openEditor(process);
      }
      return false;
    case 'noDialogProcesses':
      if (process.kind === 'HTML_DIALOG') {
        return false;
      }
      return openEditor(process);
    case 'noEmbeddedProcesses':
      //TODO: check if embedded
      return openEditor(process);
    default:
      return false;
  }
  //TODO: wait on editor to be ready
};

const isOpenProcesses = (process: ProcessBean) => {
  if (!process.uri) {
    return false;
  }
  const processUri = vscode.Uri.parse(process.uri);
  return (
    vscode.window.tabGroups.all
      .flatMap(tabGroup => tabGroup.tabs.flatMap(tabs => tabs.input as { uri: vscode.Uri }))
      .filter(input => input && input.uri)
      .filter(input => input.uri.fsPath === processUri.fsPath).length > 0
  );
};

const isCurrentProcess = (process: ProcessBean) => {
  const tabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
  if (tabInput instanceof vscode.TabInputCustom && process.uri) {
    return tabInput.uri.fsPath === vscode.Uri.parse(process.uri).fsPath;
  }
  return false;
};

const openEditor = (process: ProcessBean): boolean => {
  if (!process.uri) {
    return false;
  }
  executeCommand('vscode.open', vscode.Uri.parse(process.uri));
  return true;
};

const settings = () => {
  return { animate: config.processAnimationAnimate() ?? false, speed: config.processAnimationSpeed() ?? 50 };
};
