import fs from 'fs';
import * as vscode from 'vscode';
import { registerCommand } from '../../base/commands';
import { CmsEditorProvider } from './cms-editor-provider';

const fileName = 'cms_en.yaml';

export const registerNewCmsFileCmd = (context: vscode.ExtensionContext) => {
  registerCommand('yaml-cms-editor.new', context, () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace found');
      return;
    }
    const cmsPath = vscode.Uri.joinPath(workspaceFolders[0].uri, 'cms');
    if (!fs.existsSync(cmsPath.fsPath)) {
      vscode.workspace.fs.createDirectory(cmsPath);
    }
    const filePath = vscode.Uri.joinPath(cmsPath, fileName);
    if (fs.existsSync(filePath.fsPath)) {
      vscode.window.showErrorMessage(`${fileName} file already exists`);
      return;
    }
    vscode.workspace.fs.writeFile(filePath, new TextEncoder().encode(''));
    vscode.commands.executeCommand('vscode.openWith', filePath, CmsEditorProvider.viewType);
  });
};
