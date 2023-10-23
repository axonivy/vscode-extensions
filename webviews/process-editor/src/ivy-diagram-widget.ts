import { DiagramServerProxy, EnableToolPaletteAction, RequestModelAction, RequestTypeHintsAction } from '@eclipse-glsp/client';
import { GLSPDiagramWidget } from '@eclipse-glsp/vscode-integration-webview';
import { EnableViewportAction } from '@axonivy/process-editor-protocol';
import { injectable } from 'inversify';

@injectable()
export abstract class IvyGLSPDiagramWidget extends GLSPDiagramWidget {
  override dispatchInitialActions(): void {
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
  }
}
