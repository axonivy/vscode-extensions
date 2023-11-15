import { commands } from 'vscode';

export async function executeCommand(command: Command, ...rest: any[]) {
  return commands.executeCommand(command, ...rest);
}

export async function registerCommand(command: Command, callback: (...args: any[]) => any) {
  commands.registerCommand(command, callback);
}
export type Command = 'setContext' | 'vscode.open' | EngineCommand | ProjectViewCommand | ViewCommand;
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
  | 'ivyProjects.buildAll'
  | 'ivyProjects.deployAll'
  | 'ivyProjects.buildAndDeployAll'
  | 'ivyProjects.buildProject'
  | 'ivyProjects.deployProject'
  | 'ivyProjects.buildAndDeployProject'
  | 'ivyProjects.addBusinessProcess'
  | 'ivyProjects.addCallableSubProcess'
  | 'ivyProjects.addWebServiceProcess'
  | 'ivyProjects.deleteEntry'
  | 'ivyProjects.addNewProject'
  | 'ivyProjects.getIvyProjects';
type ViewCommand = 'ivyBrowserView.focus' | 'ivyProjects.focus' | 'ivyProcessOutline.selectElement';
