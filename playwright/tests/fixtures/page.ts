import { Browser, ElectronApplication, Page, test as base, chromium } from '@playwright/test';
import { prebuiltWorkspacePath } from '../workspaces/workspace';
import { launchElectronApp } from '../utils/app';
import { FileExplorer } from '../page-objects/explorer-view';

let electronApp: ElectronApplication;
let browser: Browser;
const runInBrowser = process.env.RUN_IN_BRWOSER ? true : false;

export const test = base.extend<{ page: Page; pageFor(workspace: string): Promise<Page> }>({
  page: async ({}, use, testInfo) => {
    const page = await pageFor(prebuiltWorkspacePath, testInfo.title);
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
  const page = await electronApp.firstWindow();
  await initialize(page);
  return page;
}

async function launchBrowser(workspace: string): Promise<Page> {
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`http://localhost:3000/?folder=/home/workspace/${workspace.split('/tests/workspaces/')[1]}`);
  await initialize(page);
  return page;
}

async function initialize(page: Page) {
  const fileExplorer = new FileExplorer(page);
  await fileExplorer.hasAnyStatusMessage();
  await fileExplorer.saveAllFiles();
  await fileExplorer.closeAllTabs();
  await fileExplorer.collapseFolders();
}
