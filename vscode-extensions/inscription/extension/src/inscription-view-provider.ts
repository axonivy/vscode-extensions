import * as vscode from 'vscode';

export const APP_DIR = 'dist';

export class InscriptionViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'inscriptionEditor';
  public static readonly TITLE = 'Inscription Editor';

  private view?: vscode.WebviewView;
  private pid?: string;
  private host?: string;
  private port?: string;
  private appName?: string;

  constructor(private readonly extensionUri: vscode.Uri) {
    this.host = process.env.ENGINE_HOST;
    this.port = process.env.ENGINE_PORT;
    this.appName = process.env.APP_NAME;
  }

  public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
    this.view = webviewView;

    this.view?.webview.onDidReceiveMessage(message => {
      if (message?.command === 'ready' && this.pid) {
        this.sendMessageToWebview({ command: 'connect.to.engine', host: this.host, port: this.port, appName: this.appName });
        this.sendMessageToWebview({ command: 'pid', pid: this.pid });
      }
    });

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getWebviewContent(webviewView.webview);
  }

  setPid(pid?: string): void {
    this.pid = pid;
    this.sendMessageToWebview({ command: 'pid', pid: pid });
  }

  async sendMessageToWebview(message: unknown): Promise<void> {
    this.view?.webview.postMessage(message);
  }

  private getWebviewContent(webview: vscode.Webview): string {
    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    const manifest = require(this.getAppUri('build.manifest.json').fsPath);
    const rootHtmlKey = this.findRootHtmlKey(manifest);
    if (!rootHtmlKey) {
      return '';
    }

    const relativeRootPath = manifest[rootHtmlKey]['file'] as string;
    const appRootUri = webview.asWebviewUri(this.getAppUri(relativeRootPath));

    const relativeCssFilePaths = manifest[rootHtmlKey]['css'] as string[];
    const cssUris = relativeCssFilePaths.map(relativePath => webview.asWebviewUri(this.getAppUri(relativePath)));
    cssUris.push(webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'css', 'inscription-editor.css')));

    const contentSecurityPolicy =
      `default-src 'none';` +
      `style-src 'unsafe-inline' ${webview.cspSource};` +
      `img-src ${webview.cspSource} https: data:;` +
      `script-src 'nonce-${nonce}';` +
      `worker-src ${webview.cspSource};` +
      `font-src ${webview.cspSource};` +
      `connect-src ${webview.cspSource} ws://${this.host}:${this.port}/`;

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
    return vscode.Uri.joinPath(this.extensionUri, APP_DIR, ...pathSegments);
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
