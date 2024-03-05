import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { InscriptionActionArgs } from '@axonivy/inscription-protocol';
import { InscriptionActionHandler } from '../inscription-action-handler';

export class OpenPageActionHandler implements InscriptionActionHandler {
  actionId = 'openPage' as const;
  async handle(actionArgs: InscriptionActionArgs): Promise<void> {
    const path = actionArgs.payload.toString();
    if (isUrl(path)) {
      openUrlInBrowser(path);
    } else if (isDocumentPath(path)) {
      openInExplorer(path);
    } else {
      vscode.window.showInformationMessage('The entered url is not valid.');
    }
  }
}

function isUrl(absolutePath: string) {
  return /^https?:\/\//i.test(absolutePath);
}

function openUrlInBrowser(absolutePath: string) {
  vscode.env.openExternal(vscode.Uri.parse(absolutePath));
}

function isDocumentPath(absolutePath: string) {
  const normalizedPath = path.normalize(absolutePath);
  if (fs.existsSync(normalizedPath)) {
    const stats = fs.statSync(normalizedPath);
    return stats.isFile();
  }

  return false;
}

function openInExplorer(absolutePath: string) {
  vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(absolutePath));
}
