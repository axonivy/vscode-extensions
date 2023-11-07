import { Page, expect } from '@playwright/test';
import { test } from './fixtures/page';
import { OutputView } from './page-objects/output-view';
import { noEngineWorkspacePath, noProjectWorkspacePath } from './workspaces/workspace';
import { SettingsView } from './page-objects/settings-view';
import { executeCloseAllEditorGroupsCommand } from './utils/command';

test.describe('Engine', () => {
  let page: Page;

  test.afterEach(async () => {
    await executeCloseAllEditorGroupsCommand(page);
  });

  test('check if embedded engine has started', async ({ page: fixturePage }) => {
    page = fixturePage;
    const outputview = new OutputView(page);
    await outputview.isTabVisible();
    await outputview.isActive();
    await outputview.isViewVisible();
    await outputview.checkIfEngineStarted();
  });

  test('check default engine settings', async ({ pageFor }) => {
    page = await pageFor(noProjectWorkspacePath);
    const settingsView = new SettingsView(page);
    await settingsView.openDefaultSettings();
    await settingsView.containsSetting('"runEmbeddedEngine": true');
    await settingsView.containsSetting('"engineUrl": "http://localhost:8080/"');
  });

  test('ensure that embedded engine is not started due to settings', async ({ pageFor }) => {
    page = await pageFor(noEngineWorkspacePath);
    const settingsView = new SettingsView(page);
    await settingsView.isAxonIvyActionItemChecked();
    await settingsView.openWorkspaceSettings();
    await settingsView.containsSetting('"runEmbeddedEngine": false');
    await settingsView.containsSetting('"engineUrl": "http://localhost:8080/"');
    const outputview = new OutputView(page);
    await expect(outputview.viewLocator).toBeHidden();
  });

  test('ensure that embedded engine is not started due to missing project file', async ({ pageFor }) => {
    page = await pageFor(noProjectWorkspacePath);
    const settingsView = new SettingsView(page);
    await settingsView.openWorkspaceSettings();
    await settingsView.containsSetting('"runEmbeddedEngine": true');
    const outputview = new OutputView(page);
    await expect(outputview.viewLocator).toBeHidden();
  });
});
