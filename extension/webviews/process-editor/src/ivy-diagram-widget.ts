import {
  DiagramServerProxy,
  EnableToolPaletteAction,
  RequestModelAction,
  RequestTypeHintsAction,
  GLSPActionDispatcher
} from '@eclipse-glsp/client';
import { GLSPDiagramWidget, VsCodeApi } from '@eclipse-glsp/vscode-integration-webview';
import { EnableViewportAction } from '@axonivy/process-editor-protocol';
import { EnableInscriptionAction } from '@axonivy/process-editor-inscription';
import { injectable, inject } from 'inversify';

@injectable()
export abstract class IvyGLSPDiagramWidget extends GLSPDiagramWidget {
  @inject(VsCodeApi) protected vsCodeApi: VsCodeApi;

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

    this.vsCodeApi.postMessage({ command: 'ready' });

    window.addEventListener('message', (event: MessageEvent<{ command: string; server: string }>) => {
      if (event.data.command === 'connect.to.web.sockets') {
        if (this.actionDispatcher instanceof GLSPActionDispatcher) {
          this.actionDispatcher
            .onceModelInitialized()
            .finally(() => this.actionDispatcher.dispatch(EnableInscriptionAction.create({ connection: { server: event.data.server } })));
        }
      }
    });
  }
}
