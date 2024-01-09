import '../css/colors.css';
import '@eclipse-glsp/vscode-integration-webview/css/glsp-vscode.css';
import '../css/diagram.css';

import { ivyBreakpointModule, createIvyDiagramContainer } from '@axonivy/process-editor';
import { ivyInscriptionModule } from '@axonivy/process-editor-inscription';
import { DiagramServerProxy, ICopyPasteHandler, TYPES } from '@eclipse-glsp/client';
import {
  GLSPDiagramIdentifier,
  GLSPDiagramWidget,
  GLSPDiagramWidgetFactory,
  GLSPStarter,
  GLSPVscodeDiagramServer,
  VsCodeApi,
  CopyPasteHandlerProvider
} from '@eclipse-glsp/vscode-integration-webview';
import { Container } from 'inversify';
import { IvyGLSPDiagramWidget } from './ivy-diagram-widget';
import ivyStartActionModule from './start/di.config';
import * as reactMonaco from 'monaco-editor/esm/vs/editor/editor.api';
import { MonacoEditorUtil } from '@axonivy/inscription-editor';
import { MonacoUtil } from '@axonivy/inscription-core';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import { Messenger, VsCodeApi as WebviewVsCodeApi } from 'vscode-messenger-webview';
import { NotificationType } from 'vscode-messenger-common';

type ColorTheme = 'dark' | 'light';
const ColorThemeChangedNotification: NotificationType<ColorTheme> = { method: 'colorThemeChanged' };

class IvyGLSPStarter extends GLSPStarter {
  private readonly messenger = new Messenger(this.vscodeApi as WebviewVsCodeApi);

  constructor() {
    super();
    this.messenger.start();
    this.initMonaco();
  }

  private initMonaco() {
    MonacoUtil.initStandalone(editorWorker).then(() => MonacoEditorUtil.initMonaco(reactMonaco, 'light'));
    this.messenger.onNotification(ColorThemeChangedNotification, this.updateMonacoTheme);
  }

  private updateMonacoTheme(theme: ColorTheme) {
    MonacoUtil.monacoInitialized().then(() =>
      reactMonaco.editor.defineTheme(MonacoEditorUtil.DEFAULT_THEME_NAME, MonacoEditorUtil.themeData(theme))
    );
  }

  createContainer(diagramIdentifier: GLSPDiagramIdentifier): Container {
    const container = createIvyDiagramContainer(diagramIdentifier.clientId);
    container.load(ivyBreakpointModule);
    container.load(ivyStartActionModule);
    container.load(ivyInscriptionModule);
    return container;
  }

  protected override addVscodeBindings(container: Container, diagramIdentifier: GLSPDiagramIdentifier) {
    container.bind(VsCodeApi).toConstantValue(this.vscodeApi);
    container.bind(Messenger).toConstantValue(this.messenger);
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

export function launch() {
  new IvyGLSPStarter();
}
