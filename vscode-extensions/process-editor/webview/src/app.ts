import '../css/colors.css';
import '@eclipse-glsp/vscode-integration-webview/css/glsp-vscode.css';
import '../css/diagram.css';

import { ivyBreakpointModule, createIvyDiagramContainer, ivyOpenInscriptionModule } from '@axonivy/process-editor';
import { DiagramServerProxy, ICopyPasteHandler, TYPES } from '@eclipse-glsp/client';
import {
  GLSPDiagramIdentifier,
  GLSPDiagramWidget,
  GLSPDiagramWidgetFactory,
  GLSPStarter,
  GLSPVscodeDiagramServer,
  VsCodeApi
} from '@eclipse-glsp/vscode-integration-webview';
import { CopyPasteHandlerProvider } from '@eclipse-glsp/vscode-integration-webview/lib/copy-paste-handler-provider';
import { Container } from 'inversify';
import { IvyGLSPDiagramWidget } from './ivy-diagram-widget';

class IvyGLSPStarter extends GLSPStarter {
  createContainer(diagramIdentifier: GLSPDiagramIdentifier): Container {
    const container = createIvyDiagramContainer(diagramIdentifier.clientId);
    container.load(ivyBreakpointModule);
    container.load(ivyOpenInscriptionModule);
    return container;
  }

  protected override addVscodeBindings(container: Container, diagramIdentifier: GLSPDiagramIdentifier): void {
    container.bind(VsCodeApi).toConstantValue(this.vscodeApi);
    // own IvyGLSPDiagramWidget
    container.bind(IvyGLSPDiagramWidget).toSelf().inSingletonScope();
    container.bind(GLSPDiagramWidget).toService(IvyGLSPDiagramWidget);
    container.bind(GLSPDiagramWidgetFactory).toFactory(context => () => context.container.get<IvyGLSPDiagramWidget>(IvyGLSPDiagramWidget));
    container.bind(GLSPDiagramIdentifier).toConstantValue(diagramIdentifier);
    container
      .bind(CopyPasteHandlerProvider)
      .toProvider(
        ctx => () => new Promise<ICopyPasteHandler>(resolve => resolve(ctx.container.get<ICopyPasteHandler>(TYPES.ICopyPasteHandler)))
      );
    container.bind(GLSPVscodeDiagramServer).toSelf().inSingletonScope();
    container.bind(TYPES.ModelSource).toService(GLSPVscodeDiagramServer);
    container.bind(DiagramServerProxy).toService(GLSPVscodeDiagramServer);

    this.configureExtensionActionHandler(container, diagramIdentifier);
  }
}

export function launch(): void {
  new IvyGLSPStarter();
}
