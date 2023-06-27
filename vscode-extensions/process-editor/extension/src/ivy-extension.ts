import { configureDefaultCommands, SocketGlspVscodeServer } from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';

import IvyEditorProvider from './ivy-editor-provider';
import { IvyVscodeConnector } from './ivy-vscode-connector';

const DEFAULT_SERVER_PORT = '5007';

export interface GlspApi {
  connector: IvyVscodeConnector;
}

export async function activate(context: vscode.ExtensionContext): Promise<GlspApi> {
  // Wrap server with quickstart component
  const workflowServer = new SocketGlspVscodeServer({
    clientId: 'ivy-glsp-process',
    clientName: 'ivy-glsp-process',
    connectionOptions: {
      port: JSON.parse(process.env.GLSP_SERVER_PORT || DEFAULT_SERVER_PORT)
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

  configureDefaultCommands({ extensionContext: context, connector: ivyVscodeConnector, diagramPrefix: 'workflow' });
  return { connector: ivyVscodeConnector };
}
