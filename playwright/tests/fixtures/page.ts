import { Page, test as base, ElectronApplication, expect } from '@playwright/test';
import { defaultWorkspacePath } from '../workspaces/workspace';
import { launchElectronApp } from '../utils/app';

let electronApp: ElectronApplication;

export const test = base.extend<{ page: Page; pageFor(workspace: string): Promise<Page> }>({
  page: async ({}, use, testInfo) => {
    const page = await pageFor(defaultWorkspacePath, testInfo.title);
    await use(page);
    await electronApp.close();
  },
  pageFor: async ({}, use, testInfo) => {
    await use(workspace => pageFor(workspace, testInfo.title));
    await electronApp.close();
  }
});

export async function pageFor(workspace: string, testTitle: string): Promise<Page> {
  electronApp = await launchElectronApp(workspace, testTitle);
  const page = await electronApp.firstWindow();
  await expect(page.locator('div.command-center')).toBeAttached();
  return page;
}
