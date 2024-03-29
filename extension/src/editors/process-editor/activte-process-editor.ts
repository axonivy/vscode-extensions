import { configureDefaultCommands, GlspVscodeConnector, SocketGlspVscodeServer, Writable } from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';

import ProcessEditorProvider from './process-editor-provider';
import { ProcessVscodeConnector } from './process-vscode-connector';
import { ProcessOutlineProvider } from './process-outline-provider';
import { registerCommand } from '../../base/commands';
import { Messenger } from 'vscode-messenger';

export function activateProcessEditor(context: vscode.ExtensionContext, messenger: Messenger): void {
  // Wrap server with quickstart component
  const webSocketAddress = process.env.WEB_SOCKET_ADDRESS;
  if (!webSocketAddress) {
    throw Error('No Ivy Engine Url available');
  }
  const workflowServer = new SocketGlspVscodeServer({
    clientId: 'ivy-glsp-web-ide-process-editor',
    clientName: 'ivy-glsp-web-ide-process-editor',
    connectionOptions: {
      webSocketAddress: webSocketAddress + 'ivy-glsp-web-ide-process-editor'
    }
  });

  // Initialize GLSP-VSCode connector with server wrapper
  const ivyVscodeConnector = new ProcessVscodeConnector({
    server: workflowServer,
    logging: true
  });
  // use our own custom messenger which may have a different configuration
  (ivyVscodeConnector as Writable<GlspVscodeConnector>).messenger = messenger;

  const customEditorProvider = vscode.window.registerCustomEditorProvider(
    ProcessEditorProvider.viewType,
    new ProcessEditorProvider(context, ivyVscodeConnector),
    {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false
    }
  );

  context.subscriptions.push(workflowServer, ivyVscodeConnector, customEditorProvider);
  workflowServer.start();

  const ivyProcessOutline = new ProcessOutlineProvider(context, ivyVscodeConnector);
  const treeView = vscode.window.createTreeView('ivyProcessOutline', { treeDataProvider: ivyProcessOutline, showCollapseAll: true });
  context.subscriptions.push(treeView);
  ivyVscodeConnector.onSelectedElement(selectedElement => {
    if (selectedElement) {
      const element = ivyProcessOutline.findElementBy(selectedElement.pid);
      if (element && treeView.visible) {
        treeView.reveal(element, { select: true });
      }
    }
  });
  registerCommand('ivyProcessOutline.selectElement', context, pid => ivyProcessOutline.select(pid));

  configureDefaultCommands({ extensionContext: context, connector: ivyVscodeConnector, diagramPrefix: 'workflow' });
}
