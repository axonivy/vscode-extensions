import { Page, test as base, expect } from '@playwright/test';
import { defaultWorkspacePath } from '../workspaces/workspace';
import { launchElectronApp } from '../utils/app';
import { executeCloseAllEditorGroupsCommand } from '../utils/command';

export const test = base.extend<{ window: Page }>({
  window: async ({}, use, testInfo) => {
    const app = await launchElectronApp(defaultWorkspacePath, testInfo.title);
    const window = await app.firstWindow();
    expect(window).toBeDefined();
    await executeCloseAllEditorGroupsCommand(window);
    await use(window);
    await app.close();
  }
});
