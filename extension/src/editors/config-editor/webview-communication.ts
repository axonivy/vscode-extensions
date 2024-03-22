import * as vscode from 'vscode';
import { Messenger } from 'vscode-messenger';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import { NotificationType } from 'vscode-messenger-common';

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const UpdateNotification: NotificationType<{ text: string }> = { method: 'update' };
const UpdateDocumentNotification: NotificationType<{ text: string }> = { method: 'updateDocument' };

export const setupCommunication = (messenger: Messenger, webviewPanel: vscode.WebviewPanel, document: vscode.TextDocument) => {
  const messageParticipant = messenger.registerWebviewPanel(webviewPanel);
  const toDispose = new DisposableCollection(
    messenger.onNotification(WebviewReadyNotification, () => updateWebview(document.getText()), { sender: messageParticipant }),
    messenger.onNotification(UpdateDocumentNotification, ({ text }) => updateYamlDocument(text), { sender: messageParticipant }),
    webviewPanel.onDidChangeViewState(() => {
      if (webviewPanel.active) {
        updateWebview(document.getText());
      }
    })
  );
  webviewPanel.onDidDispose(() => toDispose.dispose());

  const updateWebview = (text: string) => messenger.sendNotification(UpdateNotification, messageParticipant, { text });
  const updateYamlDocument = (text: string) => {
    const edit = new vscode.WorkspaceEdit();
    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);
    vscode.workspace.applyEdit(edit);
  };
};
