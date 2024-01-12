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
import { IWebSocket, WebSocketMessageReader, WebSocketMessageWriter } from 'vscode-ws-jsonrpc';

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const InitializeConnectionRequest: RequestType<void, void> = { method: 'initializeConnection' };
const InscriptionWebSocketMessage: NotificationType<string> = { method: 'inscriptionWebSocketMessage' };
const IvyScriptWebSocketMessage: NotificationType<string> = { method: 'ivyScriptWebSocketMessage' };

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

    this.messenger.onRequest(InitializeConnectionRequest, () => this.initConnection());
    this.messenger.sendNotification(WebviewReadyNotification, HOST_EXTENSION);
  }

  private initConnection() {
    if (this.actionDispatcher instanceof GLSPActionDispatcher) {
      this.actionDispatcher.onceModelInitialized().finally(() => {
        const ivyScript = {
          reader: new WebSocketMessageReader(this.wrapWebSocket(IvyScriptWebSocketMessage)),
          writer: new WebSocketMessageWriter(this.wrapWebSocket(IvyScriptWebSocketMessage))
        };
        const inscription = {
          reader: new WebSocketMessageReader(this.wrapWebSocket(InscriptionWebSocketMessage)),
          writer: new WebSocketMessageWriter(this.wrapWebSocket(InscriptionWebSocketMessage))
        };
        this.actionDispatcher.dispatch(EnableInscriptionAction.create({ connection: { ivyScript, inscription } }));
      });
    }
  }

  private wrapWebSocket(notificationType: NotificationType<string>): IWebSocket {
    return {
      send: content => this.messenger.sendNotification(notificationType, HOST_EXTENSION, content),
      onMessage: callback => this.messenger.onNotification(notificationType, callback),
      onError: () => {},
      onClose: () => {},
      dispose: () => {}
    };
  }
}
