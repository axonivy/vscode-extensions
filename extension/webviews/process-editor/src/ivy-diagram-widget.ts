import {
  DiagramServerProxy,
  EnableToolPaletteAction,
  RequestModelAction,
  RequestTypeHintsAction,
  GLSPActionDispatcher
} from '@eclipse-glsp/client';
import { GLSPDiagramWidget } from '@eclipse-glsp/vscode-integration-webview';
import { EnableViewportAction } from '@axonivy/process-editor-protocol';
import { EnableInscriptionAction } from '@axonivy/process-editor-inscription';
import { injectable, inject } from 'inversify';
import { Messenger } from 'vscode-messenger-webview';
import { NotificationType, HOST_EXTENSION, RequestType } from 'vscode-messenger-common';
import { WebSocketMessageWriter } from './message-writer';
import { WebSocketMessageReader } from './message-reader';

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const InitializeServerRequest: RequestType<string, void> = { method: 'initializeServer' };
export const InscriptionWebSocketMessage: NotificationType<string> = { method: 'inscriptionWebSocketMessage' };
export const IvyScriptWebSocketMessage: NotificationType<string> = { method: 'ivyScriptWebSocketMessage' };

@injectable()
export abstract class IvyGLSPDiagramWidget extends GLSPDiagramWidget {
  @inject(Messenger) protected messenger: Messenger;

  override dispatchInitialActions() {
    if (this.modelSource instanceof DiagramServerProxy) {
      this.modelSource.clientId = this.diagramIdentifier.clientId;
    }
    this.actionDispatcher.dispatch(
      RequestModelAction.create({
        options: {
          sourceUri: decodeURIComponent(this.diagramIdentifier.uri),
          diagramType: this.diagramIdentifier.diagramType
        }
      })
    );

    this.actionDispatcher.dispatch(RequestTypeHintsAction.create());
    this.actionDispatcher.dispatch(EnableToolPaletteAction.create());
    this.actionDispatcher.dispatch(EnableViewportAction.create());

    this.messenger.onRequest(InitializeServerRequest, server => this.initServer(server));
    this.messenger.sendNotification(WebviewReadyNotification, HOST_EXTENSION);
  }

  private initServer(server: string) {
    if (this.actionDispatcher instanceof GLSPActionDispatcher) {
      this.actionDispatcher.onceModelInitialized().finally(() => {
        const ivyScript = {
          reader: new WebSocketMessageReader(this.messenger, IvyScriptWebSocketMessage),
          writer: new WebSocketMessageWriter(this.messenger, IvyScriptWebSocketMessage)
        };
        const inscription = {
          reader: new WebSocketMessageReader(this.messenger, InscriptionWebSocketMessage),
          writer: new WebSocketMessageWriter(this.messenger, InscriptionWebSocketMessage)
        };
        console.log(server);
        this.actionDispatcher.dispatch(EnableInscriptionAction.create({ connection: { ivyScript, inscription } }));
      });
    }
  }
}
