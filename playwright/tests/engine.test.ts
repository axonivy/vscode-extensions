import { Page, expect } from '@playwright/test';
import { test } from './fixtures/page';
import { OutputView } from './page-objects/output-view';
import { embeddedEngineWorkspace, noEngineWorkspacePath, noProjectWorkspacePath } from './workspaces/workspace';
import { SettingsView } from './page-objects/settings-view';

test.describe('Engine', () => {
  let page: Page;

  test('check if embedded engine has started', async ({ pageFor }) => {
    page = await pageFor(embeddedEngineWorkspace);
    const outputview = new OutputView(page);
    await outputview.isTabVisible();
    await outputview.isChecked();
    await outputview.isViewVisible();
    await outputview.checkIfEngineStarted();
  });

  test('check default engine settings', async ({ pageFor }) => {
    page = await pageFor(noProjectWorkspacePath);
    const settingsView = new SettingsView(page);
    await settingsView.openDefaultSettings();
    await settingsView.containsSetting('"engine.runByExtension": true');
    await settingsView.containsSetting('"engine.directory": ""');
    await settingsView.containsSetting('"engine.url": "http://localhost:8080/"');
    await settingsView.containsSetting('"project.excludePattern": "**/target/**"');
    await settingsView.containsSetting('"process.animation.animate": false');
    await settingsView.containsSetting('"process.animation.mode": "all"');
    await settingsView.containsSetting('"process.animation.speed": 50');
  });

  test('ensure that embedded engine is not started due to settings', async ({ pageFor }) => {
    page = await pageFor(noEngineWorkspacePath);
    const settingsView = new SettingsView(page);
    await settingsView.isExplorerActionItemChecked();
    await settingsView.openWorkspaceSettings();
    await settingsView.containsSetting('"engine.runByExtension": false');
    await settingsView.containsSetting('"engine.url": "http://localhost:8080/"');
    const outputview = new OutputView(page);
    await expect(outputview.viewLocator).toBeHidden();
  });

  test('ensure that embedded engine is not started due to missing project file', async ({ pageFor }) => {
    page = await pageFor(noProjectWorkspacePath);
    const settingsView = new SettingsView(page);
    await settingsView.openWorkspaceSettings();
    await settingsView.containsSetting('"engine.runByExtension": true');
    const outputview = new OutputView(page);
    await expect(outputview.viewLocator).toBeHidden();
  });
});
