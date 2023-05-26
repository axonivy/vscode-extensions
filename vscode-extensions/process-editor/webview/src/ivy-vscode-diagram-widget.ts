import { DiagramServerProxy, EnableToolPaletteAction, RequestModelAction, RequestTypeHintsAction } from '@eclipse-glsp/client';
import { EnableViewportAction } from '@axonivy/process-editor';
import { injectable } from 'inversify';
import { VscodeDiagramWidget } from 'sprotty-vscode-webview';

const windowsUriCheck = new RegExp('^file:///.:/');

@injectable()
export abstract class IvyGLSPVscodeDiagramWidget extends VscodeDiagramWidget {
  protected override initializeSprotty(): void {
    if (this.modelSource instanceof DiagramServerProxy) {
      this.modelSource.clientId = this.diagramIdentifier.clientId;
    }
    this.actionDispatcher.dispatch(
      RequestModelAction.create({
        options: {
          sourceUri: decodeURI(this.diagramIdentifier.uri),
          diagramType: this.diagramIdentifier.diagramType
        }
      })
    );

    this.actionDispatcher.dispatch(RequestTypeHintsAction.create());
    this.actionDispatcher.dispatch(EnableToolPaletteAction.create());
    this.actionDispatcher.dispatch(EnableViewportAction.create());
  }
}

export function decodeURI(uri: string): string {
  if (windowsUriCheck.test(uri)) {
    const windowsUri = uri.replace('file:///', 'file://');
    return decodeURIComponent(windowsUri);
  }
  return decodeURIComponent(uri);
}
