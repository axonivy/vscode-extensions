import '../css/colors.css';
import '@eclipse-glsp/vscode-integration-webview/css/glsp-vscode.css';

import { ivyBreakpointModule, createIvyDiagramContainer } from '@axonivy/process-editor';
import { DiagramServerProxy, ICopyPasteHandler, TYPES } from '@eclipse-glsp/client';
import { GLSPStarter, GLSPVscodeDiagramServer } from '@eclipse-glsp/vscode-integration-webview';
import { CopyPasteHandlerProvider } from '@eclipse-glsp/vscode-integration-webview/lib/copy-paste-handler-provider';
import { GLSPDiagramIdentifier } from '@eclipse-glsp/vscode-integration-webview/lib/diagram-identifer';
import { Container } from 'inversify';
import { SprottyDiagramIdentifier, VscodeDiagramWidgetFactory, VscodeDiagramWidget, VscodeDiagramServer } from 'sprotty-vscode-webview';
import { VsCodeApi } from 'sprotty-vscode-webview/lib/services';
import { IvyGLSPVscodeDiagramWidget } from './ivy-vscode-diagram-widget';

class IvyGLSPStarter extends GLSPStarter {
  createContainer(diagramIdentifier: SprottyDiagramIdentifier): Container {
    const container = createIvyDiagramContainer(diagramIdentifier.clientId);
    container.load(ivyBreakpointModule);
    return container;
  }

  protected override addVscodeBindings(container: Container, diagramIdentifier: GLSPDiagramIdentifier): void {
    container.bind(VsCodeApi).toConstantValue(this.vscodeApi);
    // own IvyGLSPVscodeDiagramWidget
    container.bind(IvyGLSPVscodeDiagramWidget).toSelf().inSingletonScope();
    container.bind(VscodeDiagramWidget).toService(IvyGLSPVscodeDiagramWidget);
    container
      .bind(VscodeDiagramWidgetFactory)
      .toFactory(context => () => context.container.get<IvyGLSPVscodeDiagramWidget>(IvyGLSPVscodeDiagramWidget));
    container.bind(GLSPDiagramIdentifier).toConstantValue(diagramIdentifier);
    container
      .bind(CopyPasteHandlerProvider)
      .toProvider(
        ctx => () => new Promise<ICopyPasteHandler>(resolve => resolve(ctx.container.get<ICopyPasteHandler>(TYPES.ICopyPasteHandler)))
      );
    container.bind(SprottyDiagramIdentifier).toService(GLSPDiagramIdentifier);
    container.bind(GLSPVscodeDiagramServer).toSelf().inSingletonScope();
    container.bind(VscodeDiagramServer).toService(GLSPVscodeDiagramServer);
    container.bind(TYPES.ModelSource).toService(GLSPVscodeDiagramServer);
    container.bind(DiagramServerProxy).toService(GLSPVscodeDiagramServer);

    this.configureExtensionActionHandler(container, diagramIdentifier);
  }
}

export function launch(): void {
  new IvyGLSPStarter();
}
