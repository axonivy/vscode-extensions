import {
  ActionMessage,
  Args,
  GlspVscodeClient,
  GlspVscodeConnector,
  GlspVscodeConnectorOptions,
  MessageOrigin,
  MessageProcessingResult,
  NavigateToExternalTargetAction,
  SModelRootSchema,
  SelectionState
} from '@eclipse-glsp/vscode-integration';
import { Action, InitializeResult, SetModelAction } from '@eclipse-glsp/protocol';
import * as vscode from 'vscode';
import IvyEditorProvider from './ivy-editor-provider';
import { ProcessEditorConnector, SelectedElement } from '../base/process-editor-connector';
import { OpenInscriptionAction } from '@axonivy/process-editor-protocol';

type IvyGlspClient = GlspVscodeClient & { app: string; pmv: string };

export class IvyVscodeConnector<D extends vscode.CustomDocument = vscode.CustomDocument>
  extends GlspVscodeConnector
  implements ProcessEditorConnector
{
  private readonly emitter = new vscode.EventEmitter<SelectedElement>();
  private readonly onSelectedElementUpdate = this.emitter.event;
  protected readonly onDidChangeActiveGlspEditorEventEmitter = new vscode.EventEmitter<{ client: GlspVscodeClient<D> }>();

  constructor(options: GlspVscodeConnectorOptions) {
    super(options);

    this.onSelectionUpdate(selection => this.selectionChange(selection));
  }

  get onDidChangeActiveGlspEditor() {
    return this.onDidChangeActiveGlspEditorEventEmitter.event;
  }

  override registerClient(client: GlspVscodeClient<D>): Promise<InitializeResult> {
    this.onDidChangeActiveGlspEditorEventEmitter.fire({ client });

    client.webviewPanel.onDidChangeViewState(e => {
      if (e.webviewPanel.active) {
        this.onDidChangeActiveGlspEditorEventEmitter.fire({ client });
      }
    });
    return super.registerClient(client).then(result => {
      // Register server action handlers which are handled by this vscode integration
      result.serverActions[client.diagramType].push(OpenInscriptionAction.KIND);
      return result;
    });
  }

  onSelectedElement(listener: (selectedElement: SelectedElement) => any): void {
    this.onSelectedElementUpdate(listener);
  }

  getSelectedElement(): SelectedElement {
    for (let [id, client] of this.clientMap) {
      if (client.webviewPanel.active) {
        const pids = this.clientSelectionMap.get(id)?.selectedElementsIDs || [];
        const ivyClient = client as IvyGlspClient;
        if (pids.length > 0) {
          return this.newSelectedElement(ivyClient, pids[0]);
        }
      }
    }
    return undefined;
  }

  private newSelectedElement(client: IvyGlspClient, pid: string): SelectedElement {
    return {
      app: client.app,
      pmv: client.pmv,
      pid: pid
    };
  }

  private selectionChange(selection: SelectionState) {
    const selectedElement = this.toSelectedElement(selection.selectedElementsIDs);
    this.emitter.fire(selectedElement);
  }

  private toSelectedElement(pids: string[]): SelectedElement {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (let [_, client] of this.clientMap) {
      if (client.webviewPanel.active) {
        const ivyClient = client as IvyGlspClient;
        if (pids.length > 0) {
          return this.newSelectedElement(ivyClient, pids[0]);
        }
      }
    }
    return undefined;
  }

  public override sendActionToClient(clientId: string, action: Action): void {
    super.sendActionToClient(clientId, action);
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

  protected override processMessage(message: unknown, origin: MessageOrigin): MessageProcessingResult {
    if (ActionMessage.is(message)) {
      if (SetModelAction.is(message.action)) {
        const action = message.action;
        const client = this.clientMap.get(message.clientId);
        const ivyClient = client as IvyGlspClient;
        const newRoot = action.newRoot as SModelRootSchema & { args: { app: string; pmv: string } };
        ivyClient.app = newRoot.args.app;
        ivyClient.pmv = newRoot.args.pmv;
      }

      if (OpenInscriptionAction.is(message.action)) {
        vscode.commands.executeCommand('inscriptionEditor.focus');
        return { processedMessage: undefined, messageChanged: true };
      }
    }
    return super.processMessage(message, origin);
  }
}
