import { Browser, ElectronApplication, Page, test as base, chromium } from '@playwright/test';
import { defaultWorkspacePath } from '../workspaces/workspace';
import { launchElectronApp } from '../utils/app';
import path from 'path';
import { PageObject } from '../page-objects/page-object';

let electronApp: ElectronApplication;
let browser: Browser;
const runInBrowser = process.env.RUN_IN_BRWOSER ? true : false;

export const test = base.extend<{ page: Page; pageFor(workspace: string): Promise<Page> }>({
  page: async ({}, use, testInfo) => {
    const page = await pageFor(defaultWorkspacePath, testInfo.title);
    await use(page);
    await close();
  },
  pageFor: async ({}, use, testInfo) => {
    await use(workspace => pageFor(workspace, testInfo.title));
    await close();
  }
});

export async function pageFor(workspace: string, testTitle: string): Promise<Page> {
  await close();
  if (runInBrowser) {
    return launchBrowser(workspace);
  }
  return launchElectron(workspace, testTitle);
}

async function close() {
  if (runInBrowser && browser) {
    await browser.close();
    return;
  }
  if (electronApp) {
    await electronApp.close();
  }
}

async function launchElectron(workspace: string, testTitle: string): Promise<Page> {
  electronApp = await launchElectronApp(workspace, testTitle);
  return await electronApp.firstWindow();
}

async function launchBrowser(workspace: string): Promise<Page> {
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:3000/?folder=/home/workspace/${path.basename(workspace)}`);
  await page.waitForLoadState('networkidle');
  await new PageObject(page).closeAllTabs();
  return page;
}
