import { ElectronApplication, _electron } from '@playwright/test';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';
import * as path from 'path';

const args = [
  '--disable-updates',
  '--disable-workspace-trust',
  '--extensionDevelopmentPath=' + path.resolve(__dirname, '../../../vscode-extensions/project-explorer/extension'),
  '--extensionDevelopmentPath=' + path.resolve(__dirname, '../../../vscode-extensions/engine/extension'),
  '--new-window',
  '--profile-temp',
  '--skip-release-notes',
  '--skip-welcome',
  '--no-sandbox',
  '--disable-gpu'
];

export async function launchElectronApp(workspacePath: string): Promise<ElectronApplication> {
  return await _electron.launch({
    executablePath: await downloadAndUnzipVSCode('insiders'),
    args: [...args, workspacePath],
    recordVideo: {
      dir: './'
    }
  });
}
