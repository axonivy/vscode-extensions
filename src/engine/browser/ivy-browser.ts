import * as vscode from 'vscode';
import { Commands, registerAndSubscribeCommand, executeCommand } from '../../base/commands';
import { IvyBrowserViewProvider } from './ivy-browser-view-provider';

export async function activateIvyBrowser(context: vscode.ExtensionContext, baseUri: string) {
  const provider = new IvyBrowserViewProvider(context.extensionUri, baseUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(IvyBrowserViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
  registerAndSubscribeCommand(context, Commands.ENGINE_IVY_BROWSER_OPEN, async (url?: string) => {
    if (!url) {
      url =
        (await vscode.window.showInputBox({
          prompt: 'Enter url',
          value: 'https://dev.axonivy.com/'
        })) ?? '';
    }
    provider.refreshWebviewHtml(url);
    executeCommand(`${IvyBrowserViewProvider.viewType}.focus`);
  });

  registerAndSubscribeCommand(context, Commands.ENGINE_OPEN_IN_EXTERNAL_BROWSER, () => {
    provider.openInExternalBrowser();
  });
}