import * as vscode from 'vscode';

export class IvyBrowserViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ivyBrowserView';

  private view?: vscode.WebviewView;
  private url: string;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
    this.view = webviewView;
    webviewView.webview.options = { enableForms: true, enableScripts: true };
    webviewView.webview.html = this.getWebviewContent(webviewView.webview);
  }

  public refreshWebviewHtml(url: string): void {
    this.url = url;
    if (!this.view) {
      return;
    }
    this.view.webview.html = this.getWebviewContent(this.view.webview);
  }

  private getWebviewContent(webview: vscode.Webview) {
    const browserCss = this.extensionResourceUrl(webview, 'src', 'browser', 'css', 'browser.css');
    const nonce = getNonce();
    return `<!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="Content-type" content="text/html;charset=UTF-8">
      <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        font-src data:;
        style-src ${webview.cspSource};
        script-src 'nonce-${nonce}';
        frame-src *;
        ">
      <link rel="stylesheet" type="text/css" href="${browserCss}">
    </head>
    <body>
      <header class="header">
      </header>
      <div class="content">
        <iframe src="${this.url}" sandbox="allow-scripts allow-forms allow-same-origin allow-downloads"></iframe>
      </div>
    </body>
    </html>`;
  }

  private extensionResourceUrl(webview: vscode.Webview, ...pathSegments: string[]): vscode.Uri {
    return webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...pathSegments));
  }

  openInExternalBrowser(): void {
    vscode.env.openExternal(vscode.Uri.parse(this.url));
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
