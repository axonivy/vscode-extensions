import { GlspVscodeConnector } from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';
import { InscriptionViewProvider } from './inscription-view-provider';

const WORKFLOW_EXTENSION_ID = 'axonivy.vscode-process-editor-extension';

interface GlspApi {
  connector: GlspVscodeConnector & { getActiveSelection(): string[] };
}

function pidOf(selection: string[]): string | undefined {
  return selection.length > 0 ? selection[0] : undefined;
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new InscriptionViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(InscriptionViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  const glspApi = vscode.extensions.getExtension(WORKFLOW_EXTENSION_ID)?.exports as GlspApi | undefined;
  if (!glspApi) {
    console.warn(`Extension with Id '${WORKFLOW_EXTENSION_ID}' not found.`);
  } else {
    const currentSelection = glspApi.connector.getActiveSelection();
    provider.setPid(pidOf(currentSelection));
    glspApi.connector.onSelectionUpdate(selection => {
      provider.setPid(pidOf(selection.selectedElementsIDs));
    });
  }
}
