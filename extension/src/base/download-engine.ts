import * as vscode from 'vscode';

export async function downloadDevEngine() {
  return await vscode.env.openExternal(vscode.Uri.parse('https://dev.axonivy.com/permalink/dev/axonivy-engine-slim.zip'));
}
