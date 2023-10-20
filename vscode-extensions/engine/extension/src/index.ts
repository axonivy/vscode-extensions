import * as vscode from 'vscode';
import { Commands, executeCommand, registerAndSubscribeCommand } from '@axonivy/vscode-base';
import { IvyEngineManager } from './engine-manager';
import { activateIvyBrowser } from './browser/ivy-browser';

let ivyEngineManager: IvyEngineManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  ivyEngineManager = new IvyEngineManager(context);
  registerAndSubscribeCommand(context, Commands.ENGINE_START_MANAGER, () => ivyEngineManager.start());
  registerAndSubscribeCommand(context, Commands.ENGINE_DEPLOY_PROJECTS, () => ivyEngineManager.deployProjects());
  registerAndSubscribeCommand(context, Commands.ENGINE_BUILD_PROJECTS, () => ivyEngineManager.buildProjects());
  registerAndSubscribeCommand(context, Commands.ENGINE_BUILD_AND_DEPLOY_PROJECTS, () => ivyEngineManager.buildAndDeployProjects());
  registerAndSubscribeCommand(context, Commands.ENGINE_BUILD_AND_DEPLOY_PROJECT, (ivyProjectDirectory: string) =>
    ivyEngineManager.buildAndDeployProject(ivyProjectDirectory)
  );
  registerAndSubscribeCommand(context, Commands.ENGINE_BUILD_PROJECT, (ivyProjectDirectory: string) =>
    ivyEngineManager.buildProject(ivyProjectDirectory)
  );
  registerAndSubscribeCommand(context, Commands.ENGINE_DEPLOY_PROJECT, (ivyProjectDirectory: string) =>
    ivyEngineManager.deployProject(ivyProjectDirectory)
  );
  registerAndSubscribeCommand(context, Commands.ENGINE_OPEN_DEV_WF_UI, () => ivyEngineManager.openDevWfUi());
  registerAndSubscribeCommand(context, Commands.ENGINE_OPEN_ENGINE_COCKPIT, () => ivyEngineManager.openEngineCockpit());
  registerAndSubscribeCommand(context, Commands.ENGINE_START_PROCESS, (processStartUri: string) =>
    ivyEngineManager.startProcess(processStartUri)
  );
  const hasIvyProjects = await executeCommand(Commands.PROJECT_EXPLORER_HAS_IVY_PROJECTS);
  if (hasIvyProjects) {
    await ivyEngineManager.start();
  }
  activateIvyBrowser(context, ivyEngineManager.devWfUiUri());
}

export async function deactivate(context: vscode.ExtensionContext): Promise<void> {
  ivyEngineManager.stop();
}
