import * as vscode from 'vscode';
import { messenger } from '../..';
import { createWebViewContent } from '../webview-helper';
import { registerOpenCmsEditorCmd } from './open-cms-editor-cmd';
import { setupCommunication } from './webview-communication';

export class CmsEditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = 'ivy.cmsEditor';

  private constructor(
    readonly context: vscode.ExtensionContext,
    readonly websocketUrl: URL
  ) {}

  static register(context: vscode.ExtensionContext, websocketUrl: URL) {
    registerOpenCmsEditorCmd(context, websocketUrl);
    const provider = new CmsEditorProvider(context, websocketUrl);
    return vscode.window.registerCustomEditorProvider(CmsEditorProvider.viewType, provider);
  }

  resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
    setupCommunication(this.websocketUrl, messenger, webviewPanel, document);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(this.context, webviewPanel.webview, 'cms-editor');
  }
}
