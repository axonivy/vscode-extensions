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
  '--no-sandbox',
  '--window-size=1920,1080'
];

export async function launchElectronApp(workspacePath: string, testTitle: string): Promise<ElectronApplication> {
  return await _electron.launch({
    env: { ...process.env, NODE_ENV: 'development' },
    executablePath: await downloadAndUnzipVSCode('insiders'),
    args: [...args, workspacePath],
    recordVideo: {
      dir: path.join(__dirname, '..', '..', 'playwright-videos', testTitle.replaceAll(' ', '_'))
    }
  });
}
