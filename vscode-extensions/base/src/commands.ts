import { commands, ExtensionContext } from 'vscode';

export namespace Commands {
  export const VSCODE_SET_CONTEXT = 'setContext';
  export const ENGINE_START_MANAGER = 'vscode-engine-extension.startIvyEngineManager';
  export const ENGINE_DEPLOY_PMVS = 'vscode-engine-extension.deployPmvs';
  export const ENGINE_OPEN_DEV_WF_UI = 'vscode-engine-extension.openDevWfUi';
  export const ENGINE_OPEN_ENGINE_COCKPIT = 'vscode-engine-extension.openEngineCockpit';
  export const PROJECT_EXPLORER_HAS_IVY_PROJECTS = 'vscode-project-explorer-extension.hasIvyProjects';
  export const PROJECT_EXPLORER_GET_IVY_PROJECTS = 'vscode-project-explorer-extension.getIvyProjects';
}

export async function executeCommand(commandName: string, ...rest: any[]) {
  return commands.executeCommand(commandName, ...rest);
}

export async function registerAndSubscribeCommand(context: ExtensionContext, command: string, callback: (...args: any[]) => any) {
  context.subscriptions.push(commands.registerCommand(command, callback));
}
