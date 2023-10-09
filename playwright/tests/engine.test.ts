import { expect } from '@playwright/test';
import { test } from './fixtures/window';
import { OutputView } from './page-objects/output-view';
import { launchElectronApp } from './utils/app';
import { noEngineWorkspacePath, noProjectWorkspacePath } from './workspaces/workspace';
import { SettingsView } from './page-objects/settings-view';
import { executeCloseAllEditorGroupsCommand } from './utils/command';

test.describe('Engine Extension', () => {
  test('check if embedded engine has started', async ({ window }) => {
    const outputview = new OutputView(window);
    await outputview.isTabVisible();
    await outputview.isActive();
    await outputview.isViewVisible();
    await outputview.checkIfEngineStarted();
  });

  test('check default engine settings', async ({ window }) => {
    const settingsView = new SettingsView(window);
    await settingsView.openDefaultSettings();
    await settingsView.containsSetting('"runEmbeddedEngine": true');
    await settingsView.containsSetting('"engineUrl": "http://localhost:8080/"');
  });

  test('ensure that embedded engine is not started due to settings', async () => {
    const app = await launchElectronApp(noEngineWorkspacePath);
    const window = await app.firstWindow();
    await executeCloseAllEditorGroupsCommand(window);
    await window.screenshot({ path: 'shot.png' });
    const outputview = new OutputView(window);
    await expect(outputview.viewLocator).toBeHidden();
    const settingsView = new SettingsView(window);
    await settingsView.openWorkspaceSettings();
    await settingsView.containsSetting('"runEmbeddedEngine": false');
    await settingsView.containsSetting('"engineUrl": "http://localhost:8080/"');
    app.close();
  });

  test('ensure that embedded engine is not started due to missing project file', async () => {
    const app = await launchElectronApp(noProjectWorkspacePath);
    const window = await app.firstWindow();
    await executeCloseAllEditorGroupsCommand(window);
    const outputview = new OutputView(window);
    await expect(outputview.viewLocator).toBeHidden();
    const settingsView = new SettingsView(window);
    await settingsView.openWorkspaceSettings();
    await settingsView.containsSetting('"runEmbeddedEngine": true');
    app.close();
  });
});
