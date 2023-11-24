import * as vscode from 'vscode';

export function setStatusBarMessage(text: string) {
  vscode.window.setStatusBarMessage(text, 5_000);
}
