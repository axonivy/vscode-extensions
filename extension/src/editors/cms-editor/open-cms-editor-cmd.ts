import * as vscode from 'vscode';
import { messenger } from '../..';
import { registerCommand } from '../../base/commands';
import { createWebViewContent } from '../webview-helper';
import { setupCommunication } from './webview-communication';

export const registerOpenCmsEditorCmd = (context: vscode.ExtensionContext, websocketUrl: URL) => {
  registerCommand('cms-editor.open', context, () => {
    const webviewPanel = vscode.window.createWebviewPanel('cms-editor', 'CMS', vscode.ViewColumn.One);
    setupCommunication(websocketUrl, messenger, webviewPanel);
    webviewPanel.webview.options = { enableScripts: true };
    webviewPanel.webview.html = createWebViewContent(context, webviewPanel.webview, 'cms-editor');
  });
};
