import type { FormActionArgs } from '@axonivy/form-editor-protocol';
import { DisposableCollection } from '@eclipse-glsp/vscode-integration';
import type { TextDocument, WebviewPanel } from 'vscode';
import { commands, Uri } from 'vscode';
import { Messenger } from 'vscode-messenger';
import type { MessageParticipant, NotificationType } from 'vscode-messenger-common';
import { IvyEngineManager } from '../../engine/engine-manager';
import { IvyBrowserViewProvider } from '../../views/browser/ivy-browser-view-provider';
import { updateTextDocumentContent } from '../content-writer';
import { resolveEditorContext, type EditorConnection, type EditorContext } from '../editor-connection';
import { EditorWebSocketForwarder } from '../editor-websocket-forwarder';
import {
    hasEditorFileContent,
    InitializeConnectionRequest,
    isAction,
    noUnknownAction,
    openUrlExternally,
    WebviewReadyNotification
} from '../notification-helper';

const FormWebSocketMessage: NotificationType<unknown> = { method: 'formWebSocketMessage' };

export const setupCommunication = async (connection: EditorConnection, messenger: Messenger, webviewPanel: WebviewPanel, document: TextDocument) => {
  const context = await resolveEditorContext(connection, document.fileName);
  const messageParticipant = messenger.registerWebviewPanel(webviewPanel);
  const toDispose = new DisposableCollection(
    new FormEditorWebSocketForwarder(connection, messenger, messageParticipant, document, context),
    messenger.onNotification(
      WebviewReadyNotification,
      () => messenger.sendNotification(InitializeConnectionRequest, messageParticipant, context),
      { sender: messageParticipant }
    ),
    webviewPanel.onDidDispose(() => toDispose.dispose())
  );
};

class FormEditorWebSocketForwarder extends EditorWebSocketForwarder {
  constructor(connection: EditorConnection, messenger: Messenger, messageParticipant: MessageParticipant, document: TextDocument, context: EditorContext) {
    super(connection, 'ivy-form-lsp', messenger, messageParticipant, FormWebSocketMessage, document, context);
  }

  protected override handleClientMessage(message: unknown) {
    if (isAction<FormActionArgs>(message)) {
      const file = this.document.uri.path;
      const path = file.substring(0, file.lastIndexOf('.f.json'));
      switch (message.params.actionId) {
        case 'openUrl':
          openUrlExternally(message.params.payload);
          break;
        case 'openPreview':
          IvyBrowserViewProvider.instance.openInBrowser(message.params.payload);
          break;
        case 'openProcess':
          commands.executeCommand('vscode.open', Uri.parse(`${path}Process.p.json`));
          break;
        case 'openDataClass':
          commands.executeCommand('vscode.open', Uri.parse(`${path}Data.d.json`));
          break;
        case 'openComponent':
          openComponent(message.params);
          break;
        default:
          noUnknownAction(message.params.actionId);
      }
    }
    super.handleClientMessage(message);
  }

  protected override handleServerMessage(message: string) {
    const obj = JSON.parse(message);
    if (hasEditorFileContent(obj)) {
      updateTextDocumentContent(this.document, obj.result).then(() => super.handleServerMessage(message));
    } else {
      super.handleServerMessage(message);
    }
  }
}

const openComponent = async (action: FormActionArgs) => {
  IvyEngineManager.instance.engineApi?.getComponentForm({ componentId: action.payload, project: action.context.project }).then(form => {
    commands.executeCommand('vscode.open', Uri.parse(form.uri ?? ''));
  });
};
