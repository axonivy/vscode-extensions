import { executeCommand } from '../base/commands';
import { GlspVscodeConnector, GlspEditorProvider, DisposableCollection, Disposable } from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';
import { NotificationType, RequestType, MessageParticipant } from 'vscode-messenger-common';
import { InscriptionWebSocketMessage, IvyScriptWebSocketMessage, WebSocketForwarder } from '../websocket-forwarder';
import { Messenger } from 'vscode-messenger';
import { findEditorWorker, findRootEntry, findRootHtml, parseBuildManifest } from '../base/build-manifest';
import fs from 'fs';
import { DomUtils, parseDocument } from 'htmlparser2';
import { Element, Text } from 'domhandler';
import { render } from 'dom-serializer';

const ColorThemeChangedNotification: NotificationType<'dark' | 'light'> = { method: 'colorThemeChanged' };
const WebviewConnectionReadyNotification: NotificationType<void> = { method: 'connectionReady' };
const InitializeConnectionRequest: RequestType<void, void> = { method: 'initializeConnection' };
const StartProcessRequest: RequestType<string, void> = { method: 'startProcess' };

export default class IvyEditorProvider extends GlspEditorProvider {
  diagramType = 'ivy-glsp-process';
  static readonly viewType = 'ivy.glspDiagram';

  constructor(
    protected readonly extensionContext: vscode.ExtensionContext,
    protected override readonly glspVscodeConnector: GlspVscodeConnector
  ) {
    super(glspVscodeConnector);
  }

  async setUpWebview(
    _document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
    clientId: string
  ): Promise<void> {
    const webview = webviewPanel.webview;
    webviewPanel.webview.options = {
      enableScripts: true
    };

    const client = this.glspVscodeConnector['clientMap'].get(clientId);
    const messenger = this.glspVscodeConnector.messenger;
    const messageParticipant = client?.webviewEndpoint.messageParticipant;
    if (messageParticipant) {
      const toDispose = this.setupCommunication(messenger, messageParticipant);
      webviewPanel.onDidDispose(() => toDispose.dispose());
    }
    webviewPanel.webview.html = this.createWebviewContent(webview);
  }

  private setupCommunication(messenger: Messenger, messageParticipant: MessageParticipant): Disposable {
    return new DisposableCollection(
      new WebSocketForwarder('ivy-inscription-lsp', messenger, messageParticipant, InscriptionWebSocketMessage),
      new WebSocketForwarder('ivy-script-lsp', messenger, messageParticipant, IvyScriptWebSocketMessage),
      messenger.onNotification(
        WebviewConnectionReadyNotification,
        () => this.handleWebviewReadyNotification(messenger, messageParticipant),
        { sender: messageParticipant }
      ),
      messenger.onRequest(StartProcessRequest, startUri => executeCommand('engine.startProcess', startUri), { sender: messageParticipant }),
      vscode.window.onDidChangeActiveColorTheme(theme =>
        messenger.sendNotification(ColorThemeChangedNotification, messageParticipant, this.vsCodeThemeToMonacoTheme(theme))
      )
    );
  }

  private async handleWebviewReadyNotification(messenger: Messenger, messageParticipant: MessageParticipant) {
    await messenger.sendRequest(InitializeConnectionRequest, messageParticipant);
    messenger.sendNotification(
      ColorThemeChangedNotification,
      messageParticipant,
      this.vsCodeThemeToMonacoTheme(vscode.window.activeColorTheme)
    );
  }

  private vsCodeThemeToMonacoTheme(theme: vscode.ColorTheme) {
    return theme.kind === vscode.ColorThemeKind.Dark || theme.kind === vscode.ColorThemeKind.HighContrast ? 'dark' : 'light';
  }

  private createWebviewContent(webview: vscode.Webview): string {
    // read HTML "template" from process editor webview and adapt as webview resource
    const nonce = createNonce();

    const manifest = parseBuildManifest(this.getAppUri('build.manifest.json').fsPath);

    // create process editor HTML document from "template"
    const processEditorHtmlUri = findRootHtml(this.getAppUri(), manifest);
    const processEditorHtmlContent = fs.readFileSync(processEditorHtmlUri.fsPath, 'utf-8');
    const processEditorDocument = parseDocument(processEditorHtmlContent, { xmlMode: true, decodeEntities: false });
    const processEditorHead = DomUtils.getElementsByTagName('head', [processEditorDocument])[0];
    const processEditorBody = DomUtils.getElementsByTagName('body', [processEditorDocument])[0];

    // replace script and style references with webview URI references as otherwise we get an net::ERR_ACCESS_DENIED error
    Array.from(DomUtils.getElementsByTagName('script', processEditorDocument)).forEach(DomUtils.removeElement);
    Array.from(DomUtils.getElementsByTagName('link', processEditorDocument)).forEach(DomUtils.removeElement);

    // index root script, we skip other scripts as they are loaded dynamically within the application
    const indexScript = new Element('script', {
      src: webview.asWebviewUri(this.getAppUri(findRootEntry(manifest).chunk.file)).toString(),
      type: 'module',
      async: 'true',
      nonce: nonce
    });
    DomUtils.appendChild(processEditorBody, indexScript);

    // CSS files
    const webviewCssUris = findRootEntry(manifest).chunk.css?.map(relativePath => webview.asWebviewUri(this.getAppUri(relativePath))) ?? [];
    webviewCssUris.push(webview.asWebviewUri(vscode.Uri.joinPath(this.extensionContext.extensionUri, 'css', 'inscription-editor.css')));
    for (const cssUri of webviewCssUris) {
      const styleLink = new Element('link', {
        href: cssUri.toString(),
        type: 'text/css',
        rel: 'stylesheet'
      });
      DomUtils.appendChild(processEditorHead, styleLink);
    }

    // script to set the editor worker location, needed to load the editor worker from the webview as it only allows blob: or data: fetching
    const editorWorkerLocation = webview.asWebviewUri(findEditorWorker(this.getAppUri(), manifest)!);
    const editorWorkerLocationScript = new Element('script', { nonce: nonce }, [
      new Text(`const editorWorkerLocation = "${editorWorkerLocation}";`)
    ]);
    DomUtils.appendChild(processEditorHead, editorWorkerLocationScript);

    // set the content security policy to specify what the webview is allowed to access
    const csp = new Element('meta', {
      httpEquiv: 'Content-Security-Policy',
      content:
        `default-src 'none';` +
        `style-src 'unsafe-inline' ${webview.cspSource};` +
        `img-src ${webview.cspSource} https: data:;` +
        `script-src 'nonce-${nonce}' *;` +
        `worker-src ${webview.cspSource} blob: data:;` +
        `font-src ${webview.cspSource};` +
        `connect-src ${webview.cspSource}`
    });
    DomUtils.appendChild(processEditorHead, csp);
    return render(processEditorDocument, { xmlMode: true, decodeEntities: false, selfClosingTags: false });
  }

  private getAppUri(...pathSegments: string[]) {
    return vscode.Uri.joinPath(this.extensionContext.extensionUri, 'webviews', 'process-editor', 'dist', ...pathSegments);
  }
}

function createNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
