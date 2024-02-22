import '@eclipse-glsp/vscode-integration-webview/css/glsp-vscode.css';
import '../css/colors.css';
import '../css/diagram.css';

import { MonacoUtil } from '@axonivy/inscription-core';
import { MonacoEditorUtil } from '@axonivy/inscription-editor';
import { createIvyDiagramContainer, ivyBreakpointModule } from '@axonivy/process-editor';
import { ivyInscriptionModule } from '@axonivy/process-editor-inscription';
import { ContainerConfiguration } from '@eclipse-glsp/client';
import { GLSPStarter } from '@eclipse-glsp/vscode-integration-webview';
import { Container } from 'inversify';
import * as reactMonaco from 'monaco-editor/esm/vs/editor/editor.api';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import { NotificationType } from 'vscode-messenger-common';
import { Messenger } from 'vscode-messenger-webview';
import ivyStartActionModule from './start/di.config';
import { ivyStartupDiagramModule } from './startup';
import noopContextMenuServiceModule from './context-menu/di.config';

type ColorTheme = 'dark' | 'light';
const ColorThemeChangedNotification: NotificationType<ColorTheme> = { method: 'colorThemeChanged' };

class IvyGLSPStarter extends GLSPStarter {
  constructor() {
    super();
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

  createContainer(...containerConfiguration: ContainerConfiguration): Container {
    return createIvyDiagramContainer(
      'sprotty',
      noopContextMenuServiceModule,
      ...containerConfiguration,
      ivyBreakpointModule,
      ivyStartActionModule,
      ivyInscriptionModule,
      ivyStartupDiagramModule
    );
  }

  protected override addVscodeBindings(container: Container) {
    container.bind(Messenger).toConstantValue(this.messenger);
  }
}

export function launch() {
  new IvyGLSPStarter();
}
