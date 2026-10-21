import { test as setup } from '@playwright/test';
import { resolveCliArgsFromVSCodeExecutablePath } from '@vscode/test-electron';
import { exec, execFileSync } from 'child_process';
import { promisify } from 'node:util';
import path from 'path';
import { runDownloadAndUnzipVSCode } from './utils/download-vscode';

const execAsync = promisify(exec);
const PATH_PREBUILT_PROJECT = path.resolve('playwright/tests/workspaces/prebuiltProject');

const buildPrebuiltProject = async () => {
  const { stdout, stderr } = await execAsync(`mvn -ntp -f ${PATH_PREBUILT_PROJECT}/pom.xml clean package`, {
    encoding: 'utf8',
    windowsHide: true
  });
};

setup('Setup', async ({}) => {
  // Only build the prebuilt project if running locally
  if (process.env.CI !== 'true') {
    await buildPrebuiltProject();
  }

  const skipVSCodeDownload = process.env.RUN_IN_BROWSER ? true : false;
  if (!skipVSCodeDownload) {
    const vscodePath = await runDownloadAndUnzipVSCode();
    const [cliPath] = resolveCliArgsFromVSCodeExecutablePath(vscodePath);
    if (!cliPath) {
      throw new Error('Unable to resolve VS Code CLI path');
    }
    const extensionDir = path.resolve(process.cwd(), 'test-extension-dir');
    const args = [
      '--install-extension',
      'vscjava.vscode-java-pack',
      '--install-extension',
      'axonivy.vscode-designer-14',
      '--extensions-dir',
      extensionDir
    ];
    const isWindows = process.platform === 'win32';
    execFileSync(cliPath, isWindows ? args.map(arg => `"${arg}"`) : args, {
      shell: isWindows
    });
  } else {
    console.log('Skipping VSCode download as RUN_IN_BROWSER is set to true');
  }
});
