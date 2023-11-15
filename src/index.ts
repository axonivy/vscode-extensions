import 'reflect-metadata';
import * as vscode from 'vscode';
import { YamlEditorProvider } from './config-editor/editor-provider';
import { IvyProjectExplorer } from './project-explorer/ivy-project-explorer';
import { IvyEngineManager } from './engine/engine-manager';
import { registerCommand } from './base/commands';
import { activateIvyBrowser } from './engine/browser/ivy-browser';
import { activateProcessEditor } from './process-editor/ivy-extension';
import { NewProcessParams } from './project-explorer/new-process';
import { NewProjectParams } from './project-explorer/new-project';

let ivyEngineManager: IvyEngineManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const projectExplorer = new IvyProjectExplorer(context);

  ivyEngineManager = new IvyEngineManager(context);
  registerCommand('engine.startIvyEngineManager', () => ivyEngineManager.start());
  registerCommand('process-editor.activate', () => activateProcessEditor(context));
  registerCommand('engine.deployProjects', () => ivyEngineManager.deployProjects());
  registerCommand('engine.buildProjects', () => ivyEngineManager.buildProjects());
  registerCommand('engine.buildAndDeployProjects', () => ivyEngineManager.buildAndDeployProjects());
  registerCommand('engine.buildAndDeployProject', (ivyProjectDirectory: string) =>
    ivyEngineManager.buildAndDeployProject(ivyProjectDirectory)
  );
  registerCommand('engine.buildProject', (ivyProjectDirectory: string) => ivyEngineManager.buildProject(ivyProjectDirectory));
  registerCommand('engine.deployProject', (ivyProjectDirectory: string) => ivyEngineManager.deployProject(ivyProjectDirectory));
  registerCommand('engine.createProcess', (newProcessParams: NewProcessParams) => ivyEngineManager.createProcess(newProcessParams));
  registerCommand('engine.createProject', (newProjectParams: NewProjectParams) => ivyEngineManager.createProject(newProjectParams));
  registerCommand('engine.openDevWfUi', () => ivyEngineManager.openDevWfUi());
  registerCommand('engine.openEngineCockpit', () => ivyEngineManager.openEngineCockpit());
  registerCommand('engine.startProcess', (processStartUri: string) => ivyEngineManager.startProcess(processStartUri));
  registerCommand('engine.deleteProject', (ivyProjectDirectory: string) => ivyEngineManager.deleteProject(ivyProjectDirectory));
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
