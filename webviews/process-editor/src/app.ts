import '@eclipse-glsp/vscode-integration-webview/css/glsp-vscode.css';
import '../css/colors.css';
import 'vscode-webview-common/css/colors.css';
import '../css/diagram.css';

import { MonacoEditorUtil } from '@axonivy/process-editor-inscription-view';
import { createIvyDiagramContainer, ivyBreakpointModule, ivyOpenDataClassModule, ivyOpenFormModule } from '@axonivy/process-editor';
import { ivyInscriptionModule } from '@axonivy/process-editor-inscription';
import { ContainerConfiguration, navigationModule, createDiagramOptionsModule, EditMode } from '@eclipse-glsp/client';
import { GLSPStarter, GLSPDiagramIdentifier, WebviewGlspClient, GLSPDiagramWidget } from '@eclipse-glsp/vscode-integration-webview';
import { Container, ContainerModule } from 'inversify';
import { NotificationType } from 'vscode-messenger-common';
import { Messenger } from 'vscode-messenger-webview';
import ivyStartActionModule from './start/di.config';
import { ivyStartupDiagramModule } from './startup';
import noopContextMenuServiceModule from './context-menu/di.config';
import { initTranslation } from './i18n';
import { IvyDiagramWidget } from './ivy-diagram-widget';

type ColorTheme = 'dark' | 'light';
const ColorThemeChangedNotification: NotificationType<ColorTheme> = { method: 'colorThemeChanged' };

export interface ProcessEditorDiagramIdentifier extends GLSPDiagramIdentifier {
  diff?: {
    id: string;
    side: 'left' | 'right';
    content: string;
  };
}

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
      ivyStartupDiagramModule,
      ivyOpenDataClassModule,
      ivyOpenFormModule,
      navigationModule
    );
  }

  protected override createDiagramOptionsModule(identifier: ProcessEditorDiagramIdentifier): ContainerModule {
    const glspClient = new WebviewGlspClient({ id: identifier.diagramType, messenger: this.messenger });
    return createDiagramOptionsModule({
      clientId: identifier.clientId,
      diagramType: identifier.diagramType,
      glspClientProvider: async () => glspClient,
      sourceUri: decodeURIComponent(identifier.uri),
      editMode: identifier.diff ? EditMode.READONLY : EditMode.EDITABLE
    });
  }

  protected override addVscodeBindings(container: Container, diagramIdentifier: ProcessEditorDiagramIdentifier): void {
    container.bind(Messenger).toConstantValue(this.messenger);
    container.bind(GLSPDiagramIdentifier).toConstantValue(diagramIdentifier);
    container.rebind(GLSPDiagramWidget).to(IvyDiagramWidget).inSingletonScope();
  }
}

export function launch() {
  initMonaco();
  initTranslation();
  new IvyGLSPStarter();
}

// Must be set in the IvyEditorProvider when the webview HTML code is generated
declare const editorWorkerLocation: string;

async function initMonaco(): Promise<unknown> {
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
  // So what we do instead is to expose the editor worker location as Webview Uri in our IvyEditorProvider and store it in the 'editorWorkerLocation' variable.
  // We then fetch the script stored at that location and translate it into a blob as blob and data URLs are supported for workers.
  //
  // Packaging with Vite has it's own handling of web workers so it can be properly accessed without any custom configuration.
  // We therefore trigger the generation of the necessary script file here through the import so that we can later expose the generated file under the
  // 'editorWorkerLocation' variable:
  import('monaco-editor/esm/vs/editor/editor.worker?worker');

  if (!editorWorkerLocation) {
    console.warn('Could not find editor worker location for web worker creation. Initialize without dedicated web worker support.');
    return MonacoEditorUtil.configureInstance({ theme: 'light', worker: { skip: true } });
  }
  try {
    const script = await fetch(editorWorkerLocation);
    if (script.status === 404) {
      throw Error('File not found ' + editorWorkerLocation);
    }
    const blob = await script.blob();
    class BlobWorker extends Worker {
      constructor(workerId?: string, label?: string, url = URL.createObjectURL(blob)) {
        super(url, { name: workerId ?? label });
        this.addEventListener('error', () => URL.revokeObjectURL(url));
      }
    }
    return MonacoEditorUtil.configureInstance({ theme: 'light', worker: { workerConstructor: BlobWorker } });
  } catch (error) {
    console.error('Problem with retrieving the editor worker script. Initialize without dedicated web worker support.', error);
    return MonacoEditorUtil.configureInstance({ theme: 'light', worker: { skip: true } });
  }
}
