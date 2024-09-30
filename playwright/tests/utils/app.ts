import { ElectronApplication, _electron } from '@playwright/test';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';
import * as path from 'path';
import { downloadVersion } from './download-version';

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
  const executablePath = await downloadAndUnzipVSCode(downloadVersion);
  return await _electron.launch({
    executablePath,
    env: {},
    args: [...args, workspacePath],
    recordVideo: recordVideo(testTitle)
  });
}

function recordVideo(testTitle: string) {
  if (process.platform == 'win32') {
    return;
  }
  return {
    dir: path.join(__dirname, '..', '..', 'playwright-videos', testTitle.replaceAll(' ', '_'))
  };
}
