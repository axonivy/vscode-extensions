import 'reflect-metadata';
import * as vscode from 'vscode';
import { Messenger, MessengerDiagnostic } from 'vscode-messenger';
import { Command, registerCommand } from './base/commands';
import { config } from './base/configurations';
import { setStatusBarMessage } from './base/status-bar-message';
import { activateIvyBrowser } from './browser/ivy-browser';
import { VariableEditorProvider } from './editors/config-editor/variable-editor-provider';
import { addDevContainer } from './dev-container/command';
import { IvyEngineManager } from './engine/engine-manager';
import { activateProcessEditor } from './editors/process-editor/activte-process-editor';
import { IvyProjectExplorer } from './project-explorer/ivy-project-explorer';
import { NewProcessParams } from './project-explorer/new-process';
import { NewProjectParams } from './project-explorer/new-project';
import { NewUserDialogParams } from './project-explorer/new-user-dialog';
import FormEditorProvider from './editors/form-editor/form-editor-provider';

let ivyEngineManager: IvyEngineManager;
const devEnginePermalink = 'https://dev.axonivy.com/permalink/dev/axonivy-engine-slim.zip';

export async function activate(context: vscode.ExtensionContext): Promise<MessengerDiagnostic> {
  const messenger = new Messenger({ ignoreHiddenViews: false });

  ivyEngineManager = new IvyEngineManager(context);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registerCmd = (command: Command, callback: (...args: any[]) => any) => registerCommand(command, context, callback);
  registerCmd('engine.startIvyEngineManager', () => ivyEngineManager.start());
  registerCmd('process-editor.activate', () => activateProcessEditor(context, messenger));
  registerCmd('form-editor.activate', () => FormEditorProvider.register(context, messenger));
  registerCmd('engine.deployProjects', () => ivyEngineManager.deployProjects());
  registerCmd('engine.buildProjects', () => ivyEngineManager.buildProjects());
  registerCmd('engine.buildAndDeployProjects', () => ivyEngineManager.buildAndDeployProjects());
  registerCmd('engine.buildAndDeployProject', (ivyProjectDirectory: string) => ivyEngineManager.buildAndDeployProject(ivyProjectDirectory));
  registerCmd('engine.buildProject', (ivyProjectDirectory: string) => ivyEngineManager.buildProject(ivyProjectDirectory));
  registerCmd('engine.deployProject', (ivyProjectDirectory: string) => ivyEngineManager.deployProject(ivyProjectDirectory));
  registerCmd('engine.createProcess', (params: NewProcessParams) => ivyEngineManager.createProcess(params));
  registerCmd('engine.createProject', (params: NewProjectParams) => ivyEngineManager.createProject(params));
  registerCmd('engine.createUserDialog', (params: NewUserDialogParams) => ivyEngineManager.createUserDialog(params));
  registerCmd('engine.openDevWfUi', () => ivyEngineManager.openDevWfUi());
  registerCmd('engine.openEngineCockpit', () => ivyEngineManager.openEngineCockpit());
  registerCmd('engine.startProcess', (processStartUri: string) => ivyEngineManager.startProcess(processStartUri));
  registerCmd('engine.deleteProject', (ivyProjectDirectory: string) => ivyEngineManager.deleteProject(ivyProjectDirectory));
  registerCmd('engine.downloadDevEngine', () => vscode.env.openExternal(vscode.Uri.parse(devEnginePermalink)));
  registerCmd('engine.setEngineDirectory', () => config.setEngineDirectory());
  registerCmd('ivy.addDevContainer', () => addDevContainer(context.extensionUri));
  new IvyProjectExplorer(context);
  activateIvyBrowser(context, '');
  context.subscriptions.push(VariableEditorProvider.register(context, messenger));
  setStatusBarMessage('Axon Ivy Extension activated');

  return messenger.diagnosticApi();
}

export async function deactivate() {
  await ivyEngineManager.stop();
}
