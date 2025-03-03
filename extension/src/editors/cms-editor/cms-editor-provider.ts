import * as vscode from 'vscode';
import { registerNewCmsFileCmd } from './new-cms-file-cmd';
import { registerOpenCmsEditorCmd } from './open-cms-editor-cmd';

export class CmsEditorProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  static readonly viewType = 'ivy.cmsEditor';

  private constructor(
    readonly context: vscode.ExtensionContext,
    readonly websocketUrl: URL
  ) {}

  getTreeItem(element: vscode.TreeItem) {
    return element;
  }

  getChildren() {
    const item = new vscode.TreeItem('Open CMS Editor', vscode.TreeItemCollapsibleState.None);
    item.command = {
      command: 'cms-editor.open',
      title: 'Open CMS Editor'
    };
    return Promise.resolve([item]);
  }

  static register(context: vscode.ExtensionContext, websocketUrl: URL) {
    registerNewCmsFileCmd(context);
    registerOpenCmsEditorCmd(context, websocketUrl);
    const provider = new CmsEditorProvider(context, websocketUrl);
    const providerRegistration = vscode.window.registerTreeDataProvider(CmsEditorProvider.viewType, provider);
    return providerRegistration;
  }
}
