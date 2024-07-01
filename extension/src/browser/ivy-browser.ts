import * as vscode from 'vscode';
import { IvyBrowserViewProvider } from './ivy-browser-view-provider';
import { executeCommand, registerCommand } from '../base/commands';
import { resolveClientEngineHost } from '../base/url-util';

export async function activateIvyBrowser(context: vscode.ExtensionContext) {
  const provider = new IvyBrowserViewProvider(context.extensionUri);
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
      url = resolveClientEngineHost(new URL(url)).toString();
    }
    provider.refreshWebviewHtml(url);
    executeCommand(`${IvyBrowserViewProvider.viewType}.focus`);
  });

  registerCommand('engine.openInExternalBrowser', context, () => {
    provider.openInExternalBrowser();
  });
}
