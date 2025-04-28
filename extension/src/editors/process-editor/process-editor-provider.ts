import {
  CenterAction,
  configureDefaultCommands,
  GLSPDiagramIdentifier,
  GlspEditorProvider,
  GlspVscodeConnector,
  SelectAction,
  SocketGlspVscodeServer,
  WebviewEndpoint,
  Writable
} from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';
import { messenger } from '../..';
import { createWebViewContent } from '../webview-helper';
import { DIAGNOSTIC_ELEMENT_ID_QUERY_PARAM, ProcessVscodeConnector } from './process-vscode-connector';
import { setupCommunication } from './webview-communication';
export default class ProcessEditorProvider extends GlspEditorProvider {
  diagramType = 'ivy-glsp-process';
  static readonly viewType = 'ivy.glspDiagram';

  private webViewCount = 0;
  private constructor(
    protected readonly extensionContext: vscode.ExtensionContext,
    protected override readonly glspVscodeConnector: GlspVscodeConnector,
    readonly websocketUrl: URL
  ) {
    super(glspVscodeConnector);
  }

  async setUpWebview(
    _document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
    clientId: string
  ): Promise<void> {
    const client = this.glspVscodeConnector['clientMap'].get(clientId);
    setupCommunication(this.websocketUrl, this.glspVscodeConnector.messenger, webviewPanel, client?.webviewEndpoint.messageParticipant);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.extensionContext, webviewPanel.webview, 'process-editor');
  }

  override async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {
    const documentUriParams = new URLSearchParams(document.uri.query);
    const navigationTarget = documentUriParams.get(DIAGNOSTIC_ELEMENT_ID_QUERY_PARAM);
    // This is used to initialize GLSP for our diagram
    const diagramIdentifier: GLSPDiagramIdentifier = {
      diagramType: this.diagramType,
      uri: serializeUri(document.uri),
      clientId: `${this.diagramType}_${this.webViewCount++}`
    };

    const endpoint = new WebviewEndpoint({ diagramIdentifier, messenger: this.glspVscodeConnector.messenger, webviewPanel });

    // Register document/diagram panel/model in vscode connector
    this.glspVscodeConnector.registerClient({
      clientId: diagramIdentifier.clientId,
      diagramType: diagramIdentifier.diagramType,
      document: document,
      webviewEndpoint: endpoint
    });

    this.setUpWebview(document, webviewPanel, token, diagramIdentifier.clientId);

    if (navigationTarget) {
      endpoint.ready.then(() => {
        setTimeout(() => {
          endpoint.sendMessage({ clientId: diagramIdentifier.clientId, action: CenterAction.create([navigationTarget]) });
          endpoint.sendMessage({
            clientId: diagramIdentifier.clientId,
            action: SelectAction.setSelection([navigationTarget])
          });
        }, 500);
      });
    }
  }

  static register(context: vscode.ExtensionContext, websocketUrl: URL) {
    const workflowServer = new SocketGlspVscodeServer({
      clientId: 'ivy-glsp-web-ide-process-editor',
      clientName: 'ivy-glsp-web-ide-process-editor',
      connectionOptions: {
        webSocketAddress: new URL('ivy-glsp-web-ide-process-editor', websocketUrl).toString()
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
      new ProcessEditorProvider(context, ivyVscodeConnector, websocketUrl),
      {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false
      }
    );

    context.subscriptions.push(workflowServer, ivyVscodeConnector, customEditorProvider);
    workflowServer.start();

    configureDefaultCommands({ extensionContext: context, connector: ivyVscodeConnector, diagramPrefix: 'workflow' });
  }
}

function serializeUri(uri: vscode.Uri): string {
  // Remove optional navigation query parameters from the URI
  const uriWithoutQuery = uri.with({ query: '' });
  let uriString = uriWithoutQuery.toString();
  const match = uriString.match(/file:\/\/\/([a-z])%3A/i);
  if (match) {
    uriString = 'file:///' + match[1] + ':' + uriString.substring(match[0].length);
  }
  return uriString;
}
