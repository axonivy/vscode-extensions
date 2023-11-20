import 'reflect-metadata';
import * as vscode from 'vscode';
import { YamlEditorProvider } from './config-editor/editor-provider';
import { IvyProjectExplorer } from './project-explorer/ivy-project-explorer';
import { IvyEngineManager } from './engine/engine-manager';
import { Command, registerCommand } from './base/commands';
import { activateIvyBrowser } from './engine/browser/ivy-browser';
import { activateProcessEditor } from './process-editor/ivy-extension';
import { NewProcessParams } from './project-explorer/new-process';
import { NewProjectParams } from './project-explorer/new-project';

let ivyEngineManager: IvyEngineManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const projectExplorer = new IvyProjectExplorer(context);

  ivyEngineManager = new IvyEngineManager(context);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registerCmd = (command: Command, callback: (...args: any[]) => any) => registerCommand(command, context, callback);
  registerCmd('engine.startIvyEngineManager', () => ivyEngineManager.start());
  registerCmd('process-editor.activate', () => activateProcessEditor(context));
  registerCmd('engine.deployProjects', () => ivyEngineManager.deployProjects());
  registerCmd('engine.buildProjects', () => ivyEngineManager.buildProjects());
  registerCmd('engine.buildAndDeployProjects', () => ivyEngineManager.buildAndDeployProjects());
  registerCmd('engine.buildAndDeployProject', (ivyProjectDirectory: string) => ivyEngineManager.buildAndDeployProject(ivyProjectDirectory));
  registerCmd('engine.buildProject', (ivyProjectDirectory: string) => ivyEngineManager.buildProject(ivyProjectDirectory));
  registerCmd('engine.deployProject', (ivyProjectDirectory: string) => ivyEngineManager.deployProject(ivyProjectDirectory));
  registerCmd('engine.createProcess', (newProcessParams: NewProcessParams) => ivyEngineManager.createProcess(newProcessParams));
  registerCmd('engine.createProject', (newProjectParams: NewProjectParams) => ivyEngineManager.createProject(newProjectParams));
  registerCmd('engine.openDevWfUi', () => ivyEngineManager.openDevWfUi());
  registerCmd('engine.openEngineCockpit', () => ivyEngineManager.openEngineCockpit());
  registerCmd('engine.startProcess', (processStartUri: string) => ivyEngineManager.startProcess(processStartUri));
  registerCmd('engine.deleteProject', (ivyProjectDirectory: string) => ivyEngineManager.deleteProject(ivyProjectDirectory));
  projectExplorer.hasIvyProjects().then(hasIvyProjcts => {
    if (hasIvyProjcts) {
      ivyEngineManager.start();
    }
  });
  activateIvyBrowser(context, '');
  context.subscriptions.push(YamlEditorProvider.register(context));
}

export async function deactivate() {
  await ivyEngineManager.stop();
}
