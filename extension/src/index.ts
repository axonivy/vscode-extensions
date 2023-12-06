import 'reflect-metadata';
import * as vscode from 'vscode';
import { YamlEditorProvider } from './config-editor/editor-provider';
import { IvyProjectExplorer } from './project-explorer/ivy-project-explorer';
import { IvyEngineManager } from './engine/engine-manager';
import { Command, registerCommand } from './base/commands';
import { activateProcessEditor } from './process-editor/ivy-extension';
import { NewProcessParams } from './project-explorer/new-process';
import { NewProjectParams } from './project-explorer/new-project';
import { NewUserDialogParams } from './project-explorer/new-user-dialog';
import { setStatusBarMessage } from './base/status-bar-message';
import { activateIvyBrowser } from './browser/ivy-browser';

let ivyEngineManager: IvyEngineManager;

export async function activate(context: vscode.ExtensionContext) {
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
  registerCmd('engine.createProcess', (params: NewProcessParams) => ivyEngineManager.createProcess(params));
  registerCmd('engine.createProject', (params: NewProjectParams) => ivyEngineManager.createProject(params));
  registerCmd('engine.createUserDialog', (params: NewUserDialogParams) => ivyEngineManager.createUserDialog(params));
  registerCmd('engine.openDevWfUi', () => ivyEngineManager.openDevWfUi());
  registerCmd('engine.openEngineCockpit', () => ivyEngineManager.openEngineCockpit());
  registerCmd('engine.startProcess', (processStartUri: string) => ivyEngineManager.startProcess(processStartUri));
  registerCmd('engine.deleteProject', (ivyProjectDirectory: string) => ivyEngineManager.deleteProject(ivyProjectDirectory));
  new IvyProjectExplorer(context);
  activateIvyBrowser(context, '');
  context.subscriptions.push(YamlEditorProvider.register(context));
  setStatusBarMessage('Axon Ivy Extension activated');
}

export async function deactivate() {
  await ivyEngineManager.stop();
}
