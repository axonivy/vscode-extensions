import * as vscode from 'vscode';

const configs = vscode.workspace.getConfiguration();

export namespace config {
  export const engineRunEmbedded = configs.get<boolean>('engine.runEmbedded');
  export const engineDirectory = configs.get<string>('engine.directory');
  export const engineUrl = configs.get<string>('engine.url');
  export const projectExcludePattern = configs.get<string>('project.excludePattern');
  export const projectMaximumNumber = configs.get<number>('project.maximumNumber');

  export async function setEngineDirectory() {
    const selection = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: 'Select Engine Directory'
    });
    if (!selection) {
      return;
    }
    await configs.update('engine.directory', selection[0].fsPath, true);
  }
}
