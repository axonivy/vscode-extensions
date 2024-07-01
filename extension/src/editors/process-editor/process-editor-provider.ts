import { GlspVscodeConnector, GlspEditorProvider } from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';
import { setupCommunication } from './webview-communication';
import { createWebViewContent } from '../webview-helper';

export default class ProcessEditorProvider extends GlspEditorProvider {
  diagramType = 'ivy-glsp-process';
  static readonly viewType = 'ivy.glspDiagram';

  constructor(
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
}
