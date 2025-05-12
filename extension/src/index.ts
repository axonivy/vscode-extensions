import 'reflect-metadata';
import * as vscode from 'vscode';
import { Messenger, MessengerDiagnostic } from 'vscode-messenger';
import { registerCommand } from './base/commands';
import { config } from './base/configurations';
import { addDevContainer } from './dev-container/command';
import { IvyEngineManager } from './engine/engine-manager';
import { IvyProjectExplorer } from './project-explorer/ivy-project-explorer';
import { statusBarItem } from './base/status-bar';

let ivyEngineManager: IvyEngineManager;

export const messenger = new Messenger({ ignoreHiddenViews: false });

export async function activate(context: vscode.ExtensionContext): Promise<MessengerDiagnostic> {
  ivyEngineManager = IvyEngineManager.init(context);

  registerCommand('engine.deployProjects', context, () => ivyEngineManager.deployProjects());
  registerCommand('engine.buildProjects', context, () => ivyEngineManager.buildProjects());
  registerCommand('engine.buildAndDeployProjects', context, () => ivyEngineManager.buildAndDeployProjects());
  registerCommand('engine.setEngineDirectory', context, () => config.setEngineDirectory());
  registerCommand('engine.activateAnimation', context, async () => await config.setProcessAnimationAnimate(true));
  registerCommand('engine.deactivateAnimation', context, async () => await config.setProcessAnimationAnimate(false));
  registerCommand('engine.reloadEngine', context, async () => await ivyEngineManager.reloadEngine());
  registerCommand('ivy.addDevContainer', context, () => addDevContainer(context.extensionUri));
  IvyProjectExplorer.init(context);

  context.subscriptions.push(statusBarItem);
  statusBarItem.show();

  return messenger.diagnosticApi();
}

export async function deactivate() {
  await ivyEngineManager.stop();
}
