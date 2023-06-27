import {
  ActionMessage,
  Args,
  GlspVscodeClient,
  GlspVscodeConnector,
  MessageOrigin,
  MessageProcessingResult,
  NavigateToExternalTargetAction
} from '@eclipse-glsp/vscode-integration';
import * as vscode from 'vscode';
import IvyEditorProvider from './ivy-editor-provider';

export class IvyVscodeConnector<D extends vscode.CustomDocument = vscode.CustomDocument> extends GlspVscodeConnector {
  getActiveSelection(): string[] {
    for (let [id, client] of this.clientMap) {
      if (client.webviewPanel.active) {
        return this.clientSelectionMap.get(id)?.selectedElementsIDs || [];
      }
    }
    return [];
  }

  protected override handleNavigateToExternalTargetAction(
    message: ActionMessage<NavigateToExternalTargetAction>,
    _client: GlspVscodeClient<D> | undefined,
    _origin: MessageOrigin
  ): MessageProcessingResult {
    const { uri, args } = message.action.target;
    const absolutePath = args?.['absolutePath'] as string;
    if (absolutePath) {
      this.openWithProcessEditor(absolutePath);
    } else {
      this.showTextDocument(uri, args);
    }

    // Do not propagate action
    return { processedMessage: undefined, messageChanged: true };
  }

  private openWithProcessEditor(absolutePath: string): void {
    vscode.commands.executeCommand('vscode.openWith', vscode.Uri.parse(absolutePath), IvyEditorProvider.viewType);
  }
  private showTextDocument(uri: string, args: Args | undefined): void {
    const SHOW_OPTIONS = 'jsonOpenerOptions';
    let showOptions = { ...args };

    // Give server the possibility to provide options through the `showOptions` field by providing a
    // stringified version of the `TextDocumentShowOptions`
    // See: https://code.visualstudio.com/api/references/vscode-api#TextDocumentShowOptions
    const showOptionsField = args?.[SHOW_OPTIONS];
    if (showOptionsField) {
      showOptions = { ...args, ...JSON.parse(showOptionsField.toString()) };
    }

    vscode.window.showTextDocument(vscode.Uri.parse(uri), showOptions).then(
      () => undefined, // onFulfilled: Do nothing.
      () => undefined // onRejected: Do nothing - This is needed as error handling in case the navigationTarget does not exist.
    );
  }
}
