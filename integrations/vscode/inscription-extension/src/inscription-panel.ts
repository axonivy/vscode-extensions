import * as vscode from 'vscode';

export const APP_DIR = 'dist';

export function createWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions & vscode.WebviewPanelOptions {
  return {
    enableScripts: true,
    // And restrict the webview to only loading content from our extension's app directory.
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, APP_DIR), vscode.Uri.joinPath(extensionUri, 'css')],
    retainContextWhenHidden: true
  };
}

export class InscriptionEditorPanel {
  public static readonly VIEW_TYPE = 'inscriptionEditor';
  public static readonly TITLE = 'Inscription Editor';
  public static INSTANCE: InscriptionEditorPanel | undefined;

  private toDispose: vscode.Disposable[] = [];
  private webviewReady: Promise<void>;

  private constructor(protected panel: vscode.WebviewPanel, protected extensionUri: vscode.Uri) {
    this.panel.onDidDispose(() => this.dispose(), null, this.toDispose);

    this.webviewReady = new Promise<void>(resolve => {
      const readyListener = this.webview.onDidReceiveMessage(message => {
        if (message?.command === 'ready') {
          resolve();
          readyListener.dispose();
        }
      });
    });
    this.updateWebview();
  }

  get webview(): vscode.Webview {
    return this.panel.webview;
  }

  setPid(pid?: string): void {
    this.sendMessageToWebview({ command: 'pid', args: { pid } });
  }

  async sendMessageToWebview(message: unknown): Promise<void> {
    await this.webviewReady;
    if (!this.disposed) {
      this.webview.postMessage(message);
    }
  }

  private async updateWebview(): Promise<void> {
    this.webview.html = await this.getWebviewContent();
  }

  private async getWebviewContent(): Promise<string> {
    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    const manifest = require(this.getAppUri('build.manifest.json').path);
    const rootHtmlKey = this.findRootHtmlKey(manifest);
    if (!rootHtmlKey) {
      return '';
    }

    const relativeRootPath = manifest[rootHtmlKey]['file'] as string;
    const appRootUri = this.webview.asWebviewUri(this.getAppUri(relativeRootPath));

    const relativeCssFilePaths = manifest[rootHtmlKey]['css'] as string[];
    const cssUris = relativeCssFilePaths.map(relativePath => this.webview.asWebviewUri(this.getAppUri(relativePath)));
    cssUris.push(this.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'css', 'inscription-editor.css')));

    const contentSecurityPolicy =
      `default-src 'none';` +
      `style-src 'unsafe-inline' ${this.webview.cspSource};` +
      `img-src ${this.webview.cspSource} https: data:;` +
      `script-src 'nonce-${nonce}';` +
      `worker-src ${this.webview.cspSource};` +
      `font-src ${this.webview.cspSource};` +
      `connect-src ${this.webview.cspSource} ws://localhost:8081/`;

    return `<!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  ${cssUris.map(cssUri => `<link rel="stylesheet" type="text/css" href="${cssUri}" />`).join('\n')}
                  <title>${InscriptionEditorPanel.TITLE}</title>
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

  get disposed(): boolean {
    return this.toDispose.length === 0;
  }

  dispose(): void {
    InscriptionEditorPanel.INSTANCE = undefined;
    this.panel.dispose();
    while (this.toDispose.length) {
      this.toDispose.pop()?.dispose();
    }
  }

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    // If we already have a panel, show it.
    if (InscriptionEditorPanel.INSTANCE) {
      InscriptionEditorPanel.INSTANCE.panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      InscriptionEditorPanel.VIEW_TYPE,
      InscriptionEditorPanel.TITLE,
      column || vscode.ViewColumn.Two,
      createWebviewOptions(extensionUri)
    );

    InscriptionEditorPanel.INSTANCE = new InscriptionEditorPanel(panel, extensionUri);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    panel.webview.options = createWebviewOptions(extensionUri);
    InscriptionEditorPanel.INSTANCE = new InscriptionEditorPanel(panel, extensionUri);
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
