import { ElectronApplication, _electron } from '@playwright/test';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';
import * as path from 'path';
import { downloadVersion } from './download-vscode';

const args = [
  '--disable-updates',
  '--disable-workspace-trust',
  '--extensionDevelopmentPath=' + path.resolve(__dirname, '../../../extension/'),
  '--new-window',
  '--skip-release-notes',
  '--skip-welcome',
  '--no-sandbox'
];

export async function launchElectronApp(workspacePath: string, testTitle: string): Promise<ElectronApplication> {
  return await _electron.launch({
    executablePath: await downloadAndUnzipVSCode(downloadVersion),
    args: [...args, workspacePath],
    recordVideo: {
      dir: path.join(__dirname, '..', '..', 'playwright-videos', testTitle.replaceAll(' ', '_'))
    }
  });
}
