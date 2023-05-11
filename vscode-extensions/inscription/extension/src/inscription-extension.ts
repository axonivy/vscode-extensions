import { GlspVscodeConnector } from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';
import { InscriptionEditorPanel } from './inscription-panel';

const WORKFLOW_EXTENSION_ID = 'axonivy.@axonivy/vscode-process-editor-extension';

interface GlspApi {
  connector: GlspVscodeConnector & { getActiveSelection(): string[] };
}

let trackedGlspSelection: string[] = [];
function getPid(): string | undefined {
  return trackedGlspSelection.length > 0 ? trackedGlspSelection[0] : undefined;
}

export function activate(context: vscode.ExtensionContext) {
  const glspApi = vscode.extensions.getExtension(WORKFLOW_EXTENSION_ID)?.exports as GlspApi | undefined;
  if (!glspApi) {
    // should not happen as we added the extension as an extension dependency in the package.json
    console.warn(`Extension with Id '${WORKFLOW_EXTENSION_ID}' not found.`);
  } else {
    trackedGlspSelection = glspApi.connector.getActiveSelection();
    glspApi.connector.onSelectionUpdate(selection => {
      trackedGlspSelection = selection;
      InscriptionEditorPanel.INSTANCE?.setPid(getPid());
    });
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('inscriptionView.open', () => {
      InscriptionEditorPanel.createOrShow(context.extensionUri);
      InscriptionEditorPanel.INSTANCE?.setPid(getPid());
    })
  );
  context.subscriptions.push({ dispose: () => InscriptionEditorPanel.INSTANCE?.dispose() });

  if (vscode.window.registerWebviewPanelSerializer) {
    // Make sure we register a serializer in activation event to persist webviews across sessions
    vscode.window.registerWebviewPanelSerializer(InscriptionEditorPanel.VIEW_TYPE, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: any) {
        InscriptionEditorPanel.revive(webviewPanel, context.extensionUri);
        InscriptionEditorPanel.INSTANCE?.setPid(getPid());
      }
    });
  }
}
