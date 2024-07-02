import { commands, ExtensionContext } from 'vscode';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeCommand(command: Command, ...rest: any[]) {
  return commands.executeCommand(command, ...rest);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function registerCommand(command: Command, context: ExtensionContext, callback: (...args: any[]) => any) {
  context.subscriptions.push(commands.registerCommand(command, callback));
}
export type Command =
  | VSCodeCommand
  | EngineCommand
  | ProjectViewCommand
  | ViewCommand
  | 'yaml-variables-editor.new'
  | 'ivy.addDevContainer';
type VSCodeCommand = 'revealInExplorer' | 'setContext' | 'vscode.open' | 'copyFilePath';
type EngineCommand =
  | 'engine.deployProjects'
  | 'engine.buildProjects'
  | 'engine.buildAndDeployProjects'
  | 'engine.downloadDevEngine'
  | 'engine.setEngineDirectory';
type ProjectViewCommand =
  | 'ivyProjects.refreshEntry'
  | 'ivyProjects.buildProject'
  | 'ivyProjects.deployProject'
  | 'ivyProjects.buildAndDeployProject'
  | 'ivyProjects.addBusinessProcess'
  | 'ivyProjects.addCallableSubProcess'
  | 'ivyProjects.addWebServiceProcess'
  | 'ivyProjects.addNewProject'
  | 'ivyProjects.addNewHtmlDialog'
  | 'ivyProjects.addNewFormDialog'
  | 'ivyProjects.addNewOfflineDialog'
  | 'ivyProjects.revealInExplorer';
type ViewCommand =
  | 'ivyProcessOutline.selectElement'
  | 'ivyBrowserView.focus'
  | 'ivyBrowserView.open'
  | 'ivyBrowserView.openDevWfUi'
  | 'ivyBrowserView.openEngineCockpit';
