import { EnableToolPaletteAction, GLSPActionDispatcher, IDiagramStartup, TYPES } from '@eclipse-glsp/client';
import { ContainerModule, inject, injectable } from 'inversify';

import { EnableInscriptionAction } from '@axonivy/process-editor-inscription';
import { EnableViewportAction } from '@axonivy/process-editor-protocol';
import { RequestTypeHintsAction } from '@eclipse-glsp/vscode-integration';
import { WebviewReadyNotification } from '@eclipse-glsp/vscode-integration-webview';
import { HOST_EXTENSION, NotificationType, RequestType } from 'vscode-messenger-common';
import { Messenger } from 'vscode-messenger-webview';
import './index.css';
import { WebviewMessageReader } from './message-reader';
import { WebviewMessageWriter } from './message-writer';

const InitializeConnectionRequest: RequestType<void, void> = { method: 'initializeConnection' };
const InscriptionWebSocketMessage: NotificationType<unknown> = { method: 'inscriptionWebSocketMessage' };
const IvyScriptWebSocketMessage: NotificationType<unknown> = { method: 'ivyScriptWebSocketMessage' };

@injectable()
export class StandaloneDiagramStartup implements IDiagramStartup {
  @inject(Messenger) protected messenger: Messenger;
  @inject(GLSPActionDispatcher) protected actionDispatcher: GLSPActionDispatcher;

  async postRequestModel(): Promise<void> {
    this.actionDispatcher.dispatch(RequestTypeHintsAction.create());
    this.actionDispatcher.dispatch(EnableToolPaletteAction.create());
    this.actionDispatcher.dispatch(EnableViewportAction.create());

    this.messenger.onRequest(InitializeConnectionRequest, () => this.initConnection());
    this.messenger.sendNotification(WebviewReadyNotification, HOST_EXTENSION);
  }

  private initConnection() {
    this.actionDispatcher.onceModelInitialized().finally(() => {
      const ivyScript = this.toMessageConnection(IvyScriptWebSocketMessage);
      const inscription = this.toMessageConnection(InscriptionWebSocketMessage);
      this.actionDispatcher.dispatch(EnableInscriptionAction.create({ connection: { ivyScript, inscription } }));
    });
  }

  private toMessageConnection(notificationType: NotificationType<string>) {
    return {
      reader: new WebviewMessageReader(this.messenger, notificationType),
      writer: new WebviewMessageWriter(this.messenger, notificationType)
    };
  }
}

export const ivyStartupDiagramModule = new ContainerModule(bind => {
  bind(TYPES.IDiagramStartup).to(StandaloneDiagramStartup).inSingletonScope();
});