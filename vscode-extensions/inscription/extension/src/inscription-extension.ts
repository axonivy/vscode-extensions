import { GlspVscodeConnector } from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';
import { InscriptionViewProvider } from './inscription-view-provider';

const WORKFLOW_EXTENSION_ID = 'axonivy.vscode-process-editor-extension';

interface GlspApi {
  connector: GlspVscodeConnector & { getActiveSelection(): string[] };
}

let trackedGlspSelection: string[] = [];
function getPid(): string | undefined {
  return trackedGlspSelection.length > 0 ? trackedGlspSelection[0] : undefined;
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new InscriptionViewProvider(context.extensionUri);

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(InscriptionViewProvider.viewType, provider));

  const glspApi = vscode.extensions.getExtension(WORKFLOW_EXTENSION_ID)?.exports as GlspApi | undefined;
  if (!glspApi) {
    // should not happen as we added the extension as an extension dependency in the package.json
    console.warn(`Extension with Id '${WORKFLOW_EXTENSION_ID}' not found.`);
  } else {
    trackedGlspSelection = glspApi.connector.getActiveSelection();
    glspApi.connector.onSelectionUpdate(selection => {
      trackedGlspSelection = selection;
      provider.setPid(getPid());
    });
  }
}
