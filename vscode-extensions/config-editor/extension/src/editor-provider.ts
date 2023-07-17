import * as vscode from 'vscode';
import { getNonce, getUri } from './util';

export class YamlEditorProvider implements vscode.CustomTextEditorProvider {
  private static newFileId = 1;
  private static readonly viewType = 'yaml-variables-editor';

  constructor(private readonly context: vscode.ExtensionContext) {}

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    vscode.commands.registerCommand('yaml-variables-editor.new', () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage('Creating new YAML files currently requires opening a workspace');
        return;
      }

      const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, `variables-${YamlEditorProvider.newFileId++}.yaml`).with({
        scheme: 'untitled'
      });

      vscode.commands.executeCommand('vscode.openWith', uri, YamlEditorProvider.viewType);
    });

    const provider = new YamlEditorProvider(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(YamlEditorProvider.viewType, provider);
    return providerRegistration;
  }

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'out'), vscode.Uri.joinPath(this.context.extensionUri, 'dist')]
    };
    webviewPanel.webview.html = this.getWebviewContent(webviewPanel.webview, this.context.extensionUri);

    function updateWebview() {
      webviewPanel.webview.postMessage({
        type: 'update',
        text: document.getText()
      });
    }

    const changeViewStateSubscription = webviewPanel.onDidChangeViewState(() => {
      if (webviewPanel.active) {
        updateWebview();
      }
    });

    webviewPanel.onDidDispose(() => {
      changeViewStateSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage(e => {
      switch (e.type) {
        case 'updateDocument':
          this.updateYamlDocument(document, e.text);
          webviewPanel.webview.postMessage({
            type: 'update',
            text: e.text
          });
          break;
      }
    });

    updateWebview();
  }

  protected updateYamlDocument(document: vscode.TextDocument, yaml: any) {
    const edit = new vscode.WorkspaceEdit();

    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), yaml);

    return vscode.workspace.applyEdit(edit);
  }

  private getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const stylesUri = getUri(webview, extensionUri, ['dist', 'assets', 'index.css']);
    const codiconFontUri = getUri(webview, extensionUri, ['dist', 'assets', 'codicon.ttf']);
    const scriptUri = getUri(webview, extensionUri, ['dist', 'assets', 'index.js']);
    const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>YAML Table Variables Editor</title>
          <style nonce="${nonce}">
            @font-face {
              font-family: "codicon";
              font-display: block;
              src: url("${codiconFontUri}") format("truetype");
            }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}
