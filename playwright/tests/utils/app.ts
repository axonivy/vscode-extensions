import { ElectronApplication, _electron } from '@playwright/test';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';
import * as path from 'path';

const args = [
  '--disable-updates',
  '--disable-workspace-trust',
  '--extensionDevelopmentPath=' + path.resolve(__dirname, '../../../vscode-extensions/project-explorer/extension'),
  '--extensionDevelopmentPath=' + path.resolve(__dirname, '../../../vscode-extensions/engine/extension'),
  '--new-window',
  '--skip-release-notes',
  '--skip-welcome',
  '--disable-gpu'
];

export async function launchElectronApp(workspacePath: string): Promise<ElectronApplication> {
  console.log(process.env.ELECTRON_ENV);
  console.log(process.env.DISPLAY);
  return await _electron.launch({
    env: {
      DISPLAY: process.env.DISPLAY!
    },
    executablePath: await downloadAndUnzipVSCode('insiders'),
    args: [...args, workspacePath],
    recordVideo: {
      dir: './'
    }
  });
}
