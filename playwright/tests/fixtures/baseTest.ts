import { test as base, _electron, Page } from '@playwright/test';
import { downloadAndUnzipVSCode } from '@vscode/test-electron/out/download';
export { expect } from '@playwright/test';
import path from 'path';
import { prebuiltWorkspacePath } from '../workspaces/workspace';

export const test = base.extend<{ workspace: string; page: Page }>({
  workspace: prebuiltWorkspacePath,
  page: async ({ workspace }, use) => {
    const vscodePath = await downloadAndUnzipVSCode('insiders');
    const electronApp = await _electron.launch({
      executablePath: vscodePath,
      args: [
        '--no-sandbox',
        '--disable-gpu-sandbox',
        '--disable-updates',
        '--skip-welcome',
        '--skip-release-notes',
        '--disable-workspace-trust',
        `--extensionDevelopmentPath=${path.resolve(__dirname, '../../../extension/')}`,
        workspace
      ]
    });
    const page = await electronApp.firstWindow();
    await page.context().tracing.start({ screenshots: true, snapshots: true, title: test.info().title });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
    const tracePath = test.info().outputPath('trace.zip');
    await page.context().tracing.stop({ path: tracePath });
    test.info().attachments.push({ name: 'trace', path: tracePath, contentType: 'application/zip' });
    await electronApp.close();
  }
});
