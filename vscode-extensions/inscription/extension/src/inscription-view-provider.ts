import * as vscode from 'vscode';

export const APP_DIR = 'dist';

export class InscriptionViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'inscriptionEditor';
  public static readonly TITLE = 'Inscription Editor';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  private _view?: vscode.WebviewView;
  private _pid?: string;

  public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
    this._view = webviewView;

    this._view?.webview.onDidReceiveMessage(message => {
      if (message?.command === 'ready') {
        this.sendMessageToWebview({ command: 'pid', args: { pid: this._pid } });
      }
    });

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this.getWebviewContent(webviewView.webview);
  }

  setPid(pid?: string): void {
    this._pid = pid;
    this.sendMessageToWebview({ command: 'pid', args: { pid } });
  }

  async sendMessageToWebview(message: unknown): Promise<void> {
    this._view?.webview.postMessage(message);
  }

  private getWebviewContent(webview: vscode.Webview): string {
    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    const manifest = require(this.getAppUri('build.manifest.json').path);
    const rootHtmlKey = this.findRootHtmlKey(manifest);
    if (!rootHtmlKey) {
      return '';
    }

    const relativeRootPath = manifest[rootHtmlKey]['file'] as string;
    const appRootUri = webview.asWebviewUri(this.getAppUri(relativeRootPath));

    const relativeCssFilePaths = manifest[rootHtmlKey]['css'] as string[];
    const cssUris = relativeCssFilePaths.map(relativePath => webview.asWebviewUri(this.getAppUri(relativePath)));
    cssUris.push(webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'css', 'inscription-editor.css')));

    const contentSecurityPolicy =
      `default-src 'none';` +
      `style-src 'unsafe-inline' ${webview.cspSource};` +
      `img-src ${webview.cspSource} https: data:;` +
      `script-src 'nonce-${nonce}';` +
      `worker-src ${webview.cspSource};` +
      `font-src ${webview.cspSource};` +
      `connect-src ${webview.cspSource} ws://localhost:8081/`;

    return `<!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  ${cssUris.map(cssUri => `<link rel="stylesheet" type="text/css" href="${cssUri}" />`).join('\n')}
                  <title>${InscriptionViewProvider.TITLE}</title>
              </head>
              <body>
                  <noscript>You need to enable JavaScript to run this app.</noscript>
                  <div id="root"></div>
                  <script nonce="${nonce}" type="module" src="${appRootUri}"></script>
              </body>
              </html>`;
  }

  private getAppUri(...pathSegments: string[]): vscode.Uri {
    return vscode.Uri.joinPath(this._extensionUri, APP_DIR, ...pathSegments);
  }

  private findRootHtmlKey(buildManifest: object): string | undefined {
    return Object.keys(buildManifest).filter(key => key.endsWith('.html'))[0];
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
