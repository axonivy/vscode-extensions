import 'reflect-metadata';
import * as vscode from 'vscode';
import { YamlEditorProvider } from './config-editor/editor-provider';
import { IvyProjectExplorer } from './project-explorer/ivy-project-explorer';
import { IvyEngineManager } from './engine/engine-manager';
import { Commands, registerAndSubscribeCommand } from './base/commands';
import { activateIvyBrowser } from './engine/browser/ivy-browser';
import { activateProcessEditor } from './process-editor/ivy-extension';
import { NewProcessParams } from './project-explorer/new-process';
import { NewProjectParams } from './project-explorer/new-project';

let ivyEngineManager: IvyEngineManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const projectExplorer = new IvyProjectExplorer(context);

  ivyEngineManager = new IvyEngineManager(context);
  registerAndSubscribeCommand(context, Commands.ENGINE_START_MANAGER, () => ivyEngineManager.start());
  registerAndSubscribeCommand(context, Commands.PROCESS_EDITOR_ACTIVATE, () => activateProcessEditor(context));
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
  registerAndSubscribeCommand(context, Commands.ENGINE_CREATE_PROCESS, (newProcessParams: NewProcessParams) =>
    ivyEngineManager.createProcess(newProcessParams)
  );
  registerAndSubscribeCommand(context, Commands.ENGINE_CREATE_PROJECT, (newProjectParams: NewProjectParams) =>
    ivyEngineManager.createProject(newProjectParams)
  );
  registerAndSubscribeCommand(context, Commands.ENGINE_OPEN_DEV_WF_UI, () => ivyEngineManager.openDevWfUi());
  registerAndSubscribeCommand(context, Commands.ENGINE_OPEN_ENGINE_COCKPIT, () => ivyEngineManager.openEngineCockpit());
  registerAndSubscribeCommand(context, Commands.ENGINE_START_PROCESS, (processStartUri: string) =>
    ivyEngineManager.startProcess(processStartUri)
  );
  projectExplorer.hasIvyProjects().then(hasIvyProjcts => {
    if (hasIvyProjcts) {
      ivyEngineManager.start();
    }
  });
  activateIvyBrowser(context, '');
  context.subscriptions.push(YamlEditorProvider.register(context));
}

export async function deactivate(context: vscode.ExtensionContext): Promise<void> {
  await ivyEngineManager.stop();
}
