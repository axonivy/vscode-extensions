import { commands } from 'vscode';

export namespace Commands {
  export const VSCODE_SET_CONTEXT = 'setContext';
  export const ENGINE_RESOLVE_URL = 'vscode-engine-extension.resolveEngineUrl';
  export const PROJECT_EXPLORER_HAS_IVY_PROJECTS = 'vscode-project-explorer-extension.hasIvyProjects';
  export const PROCESS_EDITOR_ACTIVATE = 'vscode-process-editor-extension.activate';
}

export async function executeCommand(commandName: string, ...rest: any[]) {
  return commands.executeCommand(commandName, ...rest);
}
