import * as vscode from 'vscode';
import { findRootEntry, parseBuildManifest } from '../base/build-manifest';
import { calcNonce } from '../base/webview-nonce';
import { Messenger } from 'vscode-messenger';
import { FormWebSocketMessage, WebSocketForwarder } from '../websocket-forwarder';
import { NotificationType } from 'vscode-messenger-common';

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const InitializeConnectionRequest: NotificationType<{ file: string }> = { method: 'initializeConnection' };

export default class FormEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'ivy.formEditor';

  constructor(protected readonly context: vscode.ExtensionContext, protected readonly messenger: Messenger) {}

  public static register(context: vscode.ExtensionContext, messenger: Messenger): vscode.Disposable {
    const provider = new FormEditorProvider(context, messenger);
    return vscode.window.registerCustomEditorProvider(FormEditorProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    });
  }

  resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel): void | Thenable<void> {
    const webSocketAddress = process.env.WEB_SOCKET_ADDRESS;
    if (!webSocketAddress) {
      throw Error('No Ivy Engine Url available');
    }

    const messageParticipant = this.messenger.registerWebviewPanel(webviewPanel);
    const webSocketForwarder = new WebSocketForwarder('ivy-form-lsp', this.messenger, messageParticipant, FormWebSocketMessage);
    this.messenger.onNotification(
      WebviewReadyNotification,
      () => this.messenger.sendNotification(InitializeConnectionRequest, messageParticipant, { file: document.fileName }),
      { sender: messageParticipant }
    );
    webviewPanel.onDidDispose(() => webSocketForwarder.dispose());

    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = this.webViewContent(webviewPanel.webview);
  }

  webViewContent(webview: vscode.Webview): string {
    const manifest = parseBuildManifest(this.getAppUri('build.manifest.json').fsPath);
    const rootEntry = findRootEntry(manifest)!;
    const relevantScriptFiles = rootEntry.chunk.dynamicImports
      ? new Set<string>([rootEntry.source, ...rootEntry.chunk.dynamicImports])
      : [rootEntry.source];

    const scriptSources = Array.from(relevantScriptFiles)
      .map(chunk => manifest[chunk])
      .filter(chunk => !chunk.isDynamicEntry)
      .map(chunk => webview.asWebviewUri(this.getAppUri(chunk.file)));

    const cssUris = rootEntry.chunk.css?.map(relativePath => webview.asWebviewUri(this.getAppUri(relativePath))) ?? [];

    const nonce = calcNonce();

    const contentSecurityPolicy = `
      default-src 'none';
      style-src 'unsafe-inline' ${webview.cspSource};
      img-src ${webview.cspSource} https: data:;
      script-src 'nonce-${nonce}' *;
      worker-src ${webview.cspSource} blob: data:;
      font-src ${webview.cspSource};
      connect-src ${webview.cspSource}`;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">
          <meta name="viewport" content="width=device-width, height=device-height">
          ${cssUris.map(cssUri => `<link rel="stylesheet" type="text/css" href="${cssUri}" />`).join('\n')}
        </head>
        <body>
          <div id="root"></div>
          ${scriptSources.map(jsUri => `<script nonce="${nonce}" type="module" src="${jsUri}"></script>`).join('\n')}
        </body>
      </html>`;
  }

  private getAppUri(...pathSegments: string[]) {
    return vscode.Uri.joinPath(this.context.extensionUri, 'webviews', 'form-editor', 'dist', ...pathSegments);
  }
}
