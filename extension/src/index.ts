import 'reflect-metadata';
import * as vscode from 'vscode';
import { Messenger, MessengerDiagnostic } from 'vscode-messenger';
import { Command, registerCommand } from './base/commands';
import { config } from './base/configurations';
import { setStatusBarMessage } from './base/status-bar-message';
import { activateIvyBrowser } from './browser/ivy-browser';
import { addDevContainer } from './dev-container/command';
import { IvyEngineManager } from './engine/engine-manager';
import { IvyProjectExplorer } from './project-explorer/ivy-project-explorer';

let ivyEngineManager: IvyEngineManager;

export const messenger = new Messenger({ ignoreHiddenViews: false });

export const downloadDevEngine = () =>
  vscode.env.openExternal(vscode.Uri.parse('https://dev.axonivy.com/permalink/dev/axonivy-engine-slim.zip'));

export async function activate(context: vscode.ExtensionContext): Promise<MessengerDiagnostic> {
  ivyEngineManager = IvyEngineManager.init(context);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registerCmd = (command: Command, callback: (...args: any[]) => any) => registerCommand(command, context, callback);
  registerCmd('engine.deployProjects', () => ivyEngineManager.deployProjects());
  registerCmd('engine.buildProjects', () => ivyEngineManager.buildProjects());
  registerCmd('engine.buildAndDeployProjects', () => ivyEngineManager.buildAndDeployProjects());
  registerCmd('engine.buildAndDeployProject', (ivyProjectDirectory: string) => ivyEngineManager.buildAndDeployProject(ivyProjectDirectory));
  registerCmd('engine.buildProject', (ivyProjectDirectory: string) => ivyEngineManager.buildProject(ivyProjectDirectory));
  registerCmd('engine.deployProject', (ivyProjectDirectory: string) => ivyEngineManager.deployProject(ivyProjectDirectory));
  registerCmd('engine.openDevWfUi', () => ivyEngineManager.openDevWfUi());
  registerCmd('engine.openEngineCockpit', () => ivyEngineManager.openEngineCockpit());
  registerCmd('engine.downloadDevEngine', downloadDevEngine);
  registerCmd('engine.setEngineDirectory', () => config.setEngineDirectory());
  registerCmd('ivy.addDevContainer', () => addDevContainer(context.extensionUri));
  new IvyProjectExplorer(context);
  activateIvyBrowser(context);
  setStatusBarMessage('Axon Ivy Extension activated');

  return messenger.diagnosticApi();
}

export async function deactivate() {
  await ivyEngineManager.stop();
}
