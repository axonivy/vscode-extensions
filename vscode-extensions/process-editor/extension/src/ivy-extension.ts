import { configureDefaultCommands, SocketGlspVscodeServer } from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';

import IvyEditorProvider from './ivy-editor-provider';
import { IvyVscodeConnector } from './ivy-vscode-connector';
import { ProcessEditorExtension } from '@axonivy/vscode-base';
import { IvyProcessOutlineProvider } from './ivy-process-outline';

export async function activate(context: vscode.ExtensionContext): Promise<ProcessEditorExtension> {
  // Wrap server with quickstart component
  const webSocketAddress = process.env.WEB_SOCKET_ADDRESS;
  if (!webSocketAddress) {
    throw Error('No Ivy Engine Url available');
  }
  const workflowServer = new SocketGlspVscodeServer({
    clientId: 'ivy-web-ide-glsp-process',
    clientName: 'ivy-web-ide-glsp-process',
    connectionOptions: {
      webSocketAddress: webSocketAddress + 'ivy-web-ide-glsp-process'
    }
  });

  // Initialize GLSP-VSCode connector with server wrapper
  const ivyVscodeConnector = new IvyVscodeConnector({
    server: workflowServer,
    logging: true
  });

  const customEditorProvider = vscode.window.registerCustomEditorProvider(
    IvyEditorProvider.viewType,
    new IvyEditorProvider(context, ivyVscodeConnector),
    {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: false
    }
  );

  context.subscriptions.push(workflowServer, ivyVscodeConnector, customEditorProvider);
  workflowServer.start();

  const ivyProcessOutline = new IvyProcessOutlineProvider(context, ivyVscodeConnector);
  const treeView = vscode.window.createTreeView('ivyProcessOutline', { treeDataProvider: ivyProcessOutline, showCollapseAll: true });
  ivyVscodeConnector.onSelectedElement(selectedElement => {
    if (selectedElement) {
      const element = ivyProcessOutline.findElementBy(selectedElement.pid);
      if (element && treeView.visible) {
        treeView.reveal(element, { select: true });
      }
    }
  });
  vscode.commands.registerCommand('ivyProcessOutline.selectElement', pid => ivyProcessOutline.select(pid));

  configureDefaultCommands({ extensionContext: context, connector: ivyVscodeConnector, diagramPrefix: 'workflow' });
  return { connector: ivyVscodeConnector };
}
