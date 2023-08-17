import { commands } from 'vscode';

export namespace Commands {
  export const ENGINE_EXTENSION_EXECUTE = 'vscode-engine-extension.execute';
}

export async function executeCommand(commandName: string, ...rest: any[]) {
  return commands.executeCommand(commandName, ...rest);
}
