import * as vscode from 'vscode';
import { IvyBrowserViewProvider } from './ivy-browser-view-provider';
import { registerCommand } from '../base/commands';

export async function activateIvyBrowser(context: vscode.ExtensionContext) {
  const provider = IvyBrowserViewProvider.init(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(IvyBrowserViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
  registerCommand('engine.ivyBrowserOpen', context, async (url?: string) => provider.openInBrowser(url));
}
