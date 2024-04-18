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
  | 'engine.startIvyEngineManager'
  | 'engine.deployProjects'
  | 'engine.buildProjects'
  | 'engine.deployProject'
  | 'engine.buildProject'
  | 'engine.buildAndDeployProject'
  | 'engine.buildAndDeployProjects'
  | 'engine.createProcess'
  | 'engine.createProject'
  | 'engine.createUserDialog'
  | 'engine.openDevWfUi'
  | 'engine.openEngineCockpit'
  | 'engine.ivyBrowserOpen'
  | 'engine.openInExternalBrowser'
  | 'engine.startProcess'
  | 'engine.deleteProject'
  | 'engine.downloadDevEngine'
  | 'engine.setEngineDirectory'
  | 'process-editor.activate'
  | 'form-editor.activate';
type ProjectViewCommand =
  | 'ivyProjects.refreshEntry'
  | 'ivyProjects.buildProject'
  | 'ivyProjects.deployProject'
  | 'ivyProjects.buildAndDeployProject'
  | 'ivyProjects.addProcess'
  | 'ivyProjects.addBusinessProcess'
  | 'ivyProjects.addCallableSubProcess'
  | 'ivyProjects.addWebServiceProcess'
  | 'ivyProjects.addNewProject'
  | 'ivyProjects.addNewHtmlDialog'
  | 'ivyProjects.addNewForm'
  | 'ivyProjects.addNewOfflineDialog'
  | 'ivyProjects.getIvyProjects'
  | 'ivyProjects.revealInExplorer';
type ViewCommand = 'ivyBrowserView.focus' | 'ivyProcessOutline.selectElement';
