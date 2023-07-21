import * as vscode from 'vscode';
import { InscriptionViewProvider } from './inscription-view-provider';
import { PROCESS_EDITOR_EXTENSION_ID, ProcessEditorExtension } from 'vscode-base';

export function activate(context: vscode.ExtensionContext) {
  const provider = new InscriptionViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(InscriptionViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  const processEditor = vscode.extensions.getExtension(PROCESS_EDITOR_EXTENSION_ID)?.exports as ProcessEditorExtension | undefined;
  if (!processEditor) {
    console.warn(`Extension with Id '${PROCESS_EDITOR_EXTENSION_ID}' not found.`);
  } else {
    const currentSelection = processEditor.connector.getSelectedElement();
    provider.setSelectedElement(currentSelection);
    processEditor.connector.onSelectedElement(selection => {
      provider.setSelectedElement(selection);
    });
  }
}
