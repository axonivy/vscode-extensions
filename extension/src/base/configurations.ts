import * as vscode from 'vscode';

type AnimationFollowMode = 'all' | 'currentProcess' | 'openProcesses' | 'noDialogProcesses' | 'noEmbeddedProcesses';

const configs = () => vscode.workspace.getConfiguration();

export namespace config {
  export const engineRunByExtension = () => configs().get<boolean>('engine.runByExtension');
  export const engineDirectory = () => configs().get<string>('engine.directory');
  export const engineUrl = () => configs().get<string>('engine.url');
  export const projectExcludePattern = () => configs().get<string>('project.excludePattern');
  export const projectMaximumNumber = () => configs().get<number>('project.maximumNumber');
  export const projectUseMavenBuilder = () => configs().get<boolean>('project.useMavenBuilder');
  export const processAnimationAnimate = () => configs().get<boolean>('process.animation.animate');
  export const processAnimationSpeed = () => configs().get<number>('process.animation.speed');
  export const processAnimationMode = () => configs().get<AnimationFollowMode>('process.animation.mode');

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
    await configs().update('engine.directory', selection[0].fsPath, true);
  }
}
