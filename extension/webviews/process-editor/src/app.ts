import '@eclipse-glsp/vscode-integration-webview/css/glsp-vscode.css';
import '../css/colors.css';
import '../css/diagram.css';

import { MonacoEditorUtil } from '@axonivy/inscription-editor';
import { createIvyDiagramContainer, ivyBreakpointModule } from '@axonivy/process-editor';
import { ivyInscriptionModule } from '@axonivy/process-editor-inscription';
import { ContainerConfiguration } from '@eclipse-glsp/client';
import { GLSPStarter } from '@eclipse-glsp/vscode-integration-webview';
import { Container } from 'inversify';
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
    this.messenger.onNotification(ColorThemeChangedNotification, theme => MonacoEditorUtil.setTheme(theme));
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
  initMonaco();
  new IvyGLSPStarter();
}

declare global {
  // Must be set in the IvyEditorProvider when the webview HTML code is generated
  const editorWorkerLocation: string;
}

async function initMonaco(): Promise<void> {
  // Packaging with Vite has it's own handling of web workers so it can be properly accessed without any custom configuration.
  // We therefore import the worker here and to trigger the generation in the 'dist' directory.
  //
  await import('monaco-editor/esm/vs/editor/editor.worker?worker');
  //
  // According to the documentation (https://code.visualstudio.com/api/extension-guides/webview#using-web-workers) web worker
  // support within web views is limited. So we cannot access the script directly or through fetching directly without running into:
  //
  // > Failed to construct 'Worker': Script at 'https://file+.vscode-resource.vscode-cdn.net/[...]' cannot be accessed from origin 'vscode-webview://[...]'.
  //
  // Not creating any workers or unsuccessfully creating workers will show the following warnings in the console.
  //
  // > "Could not create web worker(s). Falling back to loading web worker code in main thread, which might cause UI freezes."
  // > "You must define a function MonacoEnvironment.getWorkerUrl or MonacoEnvironment.getWorker"
  //
  // So what we do is we expose the editor worker location as Webview Uri in our IvyEditorProvider and store it in the 'editorWorkerLocation' variable.
  // From there, we fetch the script properly and create a blob worker from that.
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const script = await fetch((globalThis as any).editorWorkerLocation);
  const blob = await script.blob();
  class BlobWorker extends Worker {
    constructor(workerId?: string, label?: string, url = URL.createObjectURL(blob)) {
      super(url, { name: workerId ?? label });
      this.addEventListener('error', () => {
        URL.revokeObjectURL(url);
      });
    }
  }
  MonacoEditorUtil.configureInstance({ theme: 'light', worker: { workerConstructor: BlobWorker } });
}
