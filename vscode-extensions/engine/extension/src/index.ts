import * as vscode from 'vscode';
import { Commands, executeCommand, registerAndSubscribeCommand } from '@axonivy/vscode-base';
import { IvyEngineManager } from './engine-manager';

let ivyEngineManager: IvyEngineManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  ivyEngineManager = new IvyEngineManager(context);
  registerAndSubscribeCommand(context, Commands.ENGINE_START_MANAGER, () => ivyEngineManager.start());
  registerAndSubscribeCommand(context, Commands.ENGINE_DEPLOY_PMVS, () => ivyEngineManager.deployPmvs());
  registerAndSubscribeCommand(context, Commands.ENGINE_OPEN_DEV_WF_UI, () => ivyEngineManager.openDevWfUi());
  registerAndSubscribeCommand(context, Commands.ENGINE_OPEN_ENGINE_COCKPIT, () => ivyEngineManager.openEngineCockpit());
  const hasIvyProjects = await executeCommand(Commands.PROJECT_EXPLORER_HAS_IVY_PROJECTS);
  if (hasIvyProjects) {
    await ivyEngineManager.start();
  }
}

export async function deactivate(context: vscode.ExtensionContext): Promise<void> {
  ivyEngineManager.stop();
}
