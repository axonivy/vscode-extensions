import { Page, test as base, ElectronApplication } from '@playwright/test';
import { defaultWorkspacePath } from '../workspaces/workspace';
import { launchElectronApp } from '../utils/app';
import { executeCloseAllEditorGroupsCommand } from '../utils/command';

let electronApp: ElectronApplication;

export const test = base.extend<{ window: Page; windowFor(workspace: string): Promise<Page> }>({
  window: async ({}, use, testInfo) => {
    const window = await windowFor(defaultWorkspacePath, testInfo.title);
    await use(window);
    await electronApp.close();
  },
  windowFor: async ({}, use, testInfo) => {
    await use(workspace => windowFor(workspace, testInfo.title));
    await electronApp.close();
  }
});

export async function windowFor(workspace: string, testTitle: string): Promise<Page> {
  electronApp = await launchElectronApp(workspace, testTitle);
  const window = await electronApp.firstWindow();
  await executeCloseAllEditorGroupsCommand(window);
  return window;
}
