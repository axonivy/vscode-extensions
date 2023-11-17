import { executeCommand } from '../base/commands';
import { GlspVscodeConnector, GlspEditorProvider } from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';

export default class IvyEditorProvider extends GlspEditorProvider {
  diagramType = 'ivy-glsp-process';
  static readonly viewType = 'ivy.glspDiagram';
  private webSocketAddress?: string;

  constructor(
    protected readonly extensionContext: vscode.ExtensionContext,
    protected override readonly glspVscodeConnector: GlspVscodeConnector
  ) {
    super(glspVscodeConnector);
    this.webSocketAddress = process.env.WEB_SOCKET_ADDRESS;
  }

  setUpWebview(
    _document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
    clientId: string
  ): void {
    const webview = webviewPanel.webview;
    webviewPanel.webview.options = {
      enableScripts: true
    };

    webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'ready':
          webview.postMessage({ command: 'connect.to.web.sockets', server: this.webSocketAddress ?? '' });
          webview.postMessage({ command: 'theme', theme: vsCodeThemeToInscriptionMonacoTheme(vscode.window.activeColorTheme) });
          break;
        case 'startProcess':
          executeCommand('engine.startProcess', message.processStartUri);
          break;
      }
    });

    vscode.window.onDidChangeActiveColorTheme(theme =>
      webview.postMessage({ command: 'theme', theme: vsCodeThemeToInscriptionMonacoTheme(theme) })
    );

    const vsCodeThemeToInscriptionMonacoTheme = (theme: vscode.ColorTheme) => {
      if (theme.kind === vscode.ColorThemeKind.Dark || theme.kind === vscode.ColorThemeKind.HighContrast) {
        return 'dark';
      }
      return 'light';
    };

    const nonce = getNonce();

    const fs = require('fs');
    const manifest = JSON.parse(fs.readFileSync(this.getAppUri('build.manifest.json').fsPath));

    const rootHtmlKey = this.findRootHtmlKey(manifest);

    const relativeRootPath = manifest[rootHtmlKey]['file'] as string;
    const indexJs = webview.asWebviewUri(this.getAppUri(relativeRootPath));

    const relativeCssFilePaths = manifest[rootHtmlKey]['css'] as string[];
    const cssUris = relativeCssFilePaths.map(relativePath => webview.asWebviewUri(this.getAppUri(relativePath)));
    cssUris.push(webview.asWebviewUri(vscode.Uri.joinPath(this.extensionContext.extensionUri, 'css', 'inscription-editor.css')));

    const contentSecurityPolicy =
      `default-src 'none';` +
      `style-src 'unsafe-inline' ${webview.cspSource};` +
      `img-src ${webview.cspSource} https: data:;` +
      `script-src 'nonce-${nonce}';` +
      `worker-src ${webview.cspSource};` +
      `font-src ${webview.cspSource};` +
      `connect-src ${webview.cspSource} ${this.webSocketAddress}`;

    webviewPanel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">
          <meta name="viewport" content="width=device-width, height=device-height">
          ${cssUris.map(cssUri => `<link rel="stylesheet" type="text/css" href="${cssUri}" />`).join('\n')}
        </head>
        <body>
          <div id="${clientId}_container" class="main-widget"></div>
          <div id="inscription"></div>
          <script nonce="${nonce}" type="module" src="${indexJs}"></script>
        </body>
      </html>`;
  }

  private getAppUri(...pathSegments: string[]) {
    return vscode.Uri.joinPath(this.extensionContext.extensionUri, 'webviews', 'dist', 'process-editor', ...pathSegments);
  }

  private findRootHtmlKey(buildManifest: object) {
    return Object.keys(buildManifest).filter(key => key.endsWith('index.html'))[0];
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
