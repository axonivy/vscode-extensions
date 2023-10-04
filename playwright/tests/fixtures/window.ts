import { Page, test as base } from '@playwright/test';
import { defaultWorkspacePath } from '../workspaces/workspace';
import { launchElectronApp } from '../utils/app';
import { executeCloseAllEditorGroupsCommand } from '../utils/command';

export const test = base.extend<{ window: Page }>({
  // eslint-disable-next-line no-empty-pattern
  window: async ({}, use) => {
    const app = await launchElectronApp(defaultWorkspacePath);
    const window = await app.firstWindow();
    await executeCloseAllEditorGroupsCommand(window);
    await use(window);
    await app.close();
  }
});
