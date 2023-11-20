import { commands, ExtensionContext } from 'vscode';

export async function executeCommand(command: Command, ...rest: any[]) {
  return commands.executeCommand(command, ...rest);
}

export async function registerCommand(command: Command, context: ExtensionContext, callback: (...args: any[]) => any) {
  context.subscriptions.push(commands.registerCommand(command, callback));
}
export type Command = VSCodeCommand | EngineCommand | ProjectViewCommand | ViewCommand | 'yaml-variables-editor.new';
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
  | 'engine.openDevWfUi'
  | 'engine.openEngineCockpit'
  | 'engine.ivyBrowserOpen'
  | 'engine.openInExternalBrowser'
  | 'engine.startProcess'
  | 'engine.deleteProject'
  | 'process-editor.activate';
type ProjectViewCommand =
  | 'ivyProjects.refreshEntry'
  | 'ivyProjects.buildProject'
  | 'ivyProjects.deployProject'
  | 'ivyProjects.buildAndDeployProject'
  | 'ivyProjects.addBusinessProcess'
  | 'ivyProjects.addCallableSubProcess'
  | 'ivyProjects.addWebServiceProcess'
  | 'ivyProjects.addNewProject'
  | 'ivyProjects.getIvyProjects'
  | 'ivyProjects.revealInExplorer';
type ViewCommand = 'ivyBrowserView.focus' | 'ivyProcessOutline.selectElement';
