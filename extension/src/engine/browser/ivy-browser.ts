import * as vscode from 'vscode';
import { registerCommand, executeCommand } from '../../base/commands';
import { IvyBrowserViewProvider } from './ivy-browser-view-provider';
import { resolveClientEngineHost } from '../../base/url-util';

export async function activateIvyBrowser(context: vscode.ExtensionContext, baseUri: string) {
  const provider = new IvyBrowserViewProvider(context.extensionUri, baseUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(IvyBrowserViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
  registerCommand('engine.ivyBrowserOpen', context, async (url?: string) => {
    if (!url) {
      url =
        (await vscode.window.showInputBox({
          prompt: 'Enter url',
          value: 'https://dev.axonivy.com/'
        })) ?? '';
    } else {
      url = resolveClientEngineHost(url);
    }
    provider.refreshWebviewHtml(url);
    executeCommand(`${IvyBrowserViewProvider.viewType}.focus`);
  });

  registerCommand('engine.openInExternalBrowser', context, () => {
    provider.openInExternalBrowser();
  });
}
