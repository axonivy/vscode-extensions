import { commands, ExtensionContext } from 'vscode';

export namespace Commands {
  export const VSCODE_SET_CONTEXT = 'setContext';
  export const ENGINE_START_MANAGER = 'engine.startIvyEngineManager';
  export const ENGINE_DEPLOY_PROJECTS = 'engine.deployProjects';
  export const ENGINE_BUILD_PROJECTS = 'engine.buildProjects';
  export const ENGINE_DEPLOY_PROJECT = 'engine.deployProject';
  export const ENGINE_BUILD_PROJECT = 'engine.buildProject';
  export const ENGINE_BUILD_AND_DEPLOY_PROJECT = 'engine.buildAndDeployProject';
  export const ENGINE_BUILD_AND_DEPLOY_PROJECTS = 'engine.buildAndDeployProjects';
  export const ENGINE_OPEN_DEV_WF_UI = 'engine.openDevWfUi';
  export const ENGINE_OPEN_ENGINE_COCKPIT = 'engine.openEngineCockpit';
  export const ENGINE_IVY_BROWSER_OPEN = 'engine.ivyBrowserOpen';
  export const ENGINE_OPEN_IN_EXTERNAL_BROWSER = 'engine.openInExternalBrowser';
  export const ENGINE_START_PROCESS = 'engine.startProcess';
  export const PROJECT_EXPLORER_GET_IVY_PROJECTS = 'project-explorer.getIvyProjects';
  export const PROCESS_EDITOR_ACTIVATE = 'process-editor.activate';
}

export async function executeCommand(commandName: string, ...rest: any[]) {
  return commands.executeCommand(commandName, ...rest);
}

export async function registerAndSubscribeCommand(context: ExtensionContext, command: string, callback: (...args: any[]) => any) {
  context.subscriptions.push(commands.registerCommand(command, callback));
}
