import { expect } from '@playwright/test';
import { test } from './fixtures/window';
import { OutputView } from './page-objects/output-view';
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

  test('check default engine settings', async ({ windowFor }) => {
    const window = await windowFor(noProjectWorkspacePath);
    const settingsView = new SettingsView(window);
    await settingsView.openDefaultSettings();
    await settingsView.containsSetting('"runEmbeddedEngine": true');
    await settingsView.containsSetting('"engineUrl": "http://localhost:8080/"');
  });

  test('ensure that embedded engine is not started due to settings', async ({ windowFor }) => {
    const window = await windowFor(noEngineWorkspacePath);
    await executeCloseAllEditorGroupsCommand(window);
    const outputview = new OutputView(window);
    await expect(outputview.viewLocator).toBeHidden();
    const settingsView = new SettingsView(window);
    await settingsView.openWorkspaceSettings();
    await settingsView.containsSetting('"runEmbeddedEngine": false');
    await settingsView.containsSetting('"engineUrl": "http://localhost:8080/"');
  });

  test('ensure that embedded engine is not started due to missing project file', async ({ windowFor }) => {
    const window = await windowFor(noProjectWorkspacePath);
    await executeCloseAllEditorGroupsCommand(window);
    const outputview = new OutputView(window);
    await expect(outputview.viewLocator).toBeHidden();
    const settingsView = new SettingsView(window);
    await settingsView.openWorkspaceSettings();
    await settingsView.containsSetting('"runEmbeddedEngine": true');
  });
});
