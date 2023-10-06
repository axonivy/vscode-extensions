import { ElectronApplication, _electron } from '@playwright/test';
import { downloadAndUnzipVSCode } from '@vscode/test-electron';
import * as path from 'path';

const args = [
  '--disable-updates',
  '--disable-workspace-trust',
  '--disable-extensions',
  '--extensionDevelopmentPath=' + path.resolve(__dirname, '../../../vscode-extensions/project-explorer/extension'),
  '--extensionDevelopmentPath=' + path.resolve(__dirname, '../../../vscode-extensions/engine/extension'),
  '--new-window',
  '--profile-temp',
  '--skip-release-notes',
  '--skip-welcome',
  '--no-sandbox',
  '--disable-gpu-sandbox'
];

export async function launchElectronApp(workspacePath: string): Promise<ElectronApplication> {
  return await _electron.launch({
    env: { ...process.env, NODE_ENV: 'development' },
    executablePath: await downloadAndUnzipVSCode('insiders'),
    args: [...args, workspacePath]
  });
}
