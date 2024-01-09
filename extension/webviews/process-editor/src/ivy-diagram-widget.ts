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

const WebviewReadyNotification: NotificationType<void> = { method: 'ready' };
const InitializeServerRequest: RequestType<string, void> = { method: 'initializeServer' };

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
      this.actionDispatcher
        .onceModelInitialized()
        .finally(() => this.actionDispatcher.dispatch(EnableInscriptionAction.create({ connection: { server } })));
    }
  }
}
