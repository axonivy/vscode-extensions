import * as vscode from 'vscode';
import { InscriptionViewProvider } from './inscription-view-provider';
import { ProcessEditorConnector } from '../base/process-editor-connector';

export function activateInscription(context: vscode.ExtensionContext, processEditorConnector: ProcessEditorConnector) {
  const provider = new InscriptionViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(InscriptionViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );
  const currentSelection = processEditorConnector.getSelectedElement();
  provider.setSelectedElement(currentSelection);
  processEditorConnector.onSelectedElement(selection => {
    provider.setSelectedElement(selection);
  });
}
