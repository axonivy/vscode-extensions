import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { setupCommunication } from './webview-communication';
import { registerNewVariablesFileCmd } from './new-variable-file-cmd';
import { createWebViewContent } from '../webview-helper';
import { Element, Text } from 'domhandler';

export class VariableEditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = 'yaml-variables-editor';

  constructor(private readonly context: vscode.ExtensionContext, private readonly messenger: Messenger) {}

  public static register(context: vscode.ExtensionContext, messenger: Messenger): vscode.Disposable {
    registerNewVariablesFileCmd(context);
    const provider = new VariableEditorProvider(context, messenger);
    const providerRegistration = vscode.window.registerCustomEditorProvider(VariableEditorProvider.viewType, provider);
    return providerRegistration;
  }

  public async resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    setupCommunication(this.messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'config-editor', (nonce, rootEntry, rootPath) => {
      const codiconFontUri = rootEntry.chunk.assets
        ?.map(relativePath => webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(rootPath, relativePath)))
        .at(0);
      return new Element('style', { nonce: nonce }, [
        new Text(`
          @font-face {
            font-family: "codicon";
            font-display: block;
            src: url("${codiconFontUri}") format("truetype");
          }`)
      ]);
    });
  }
}
