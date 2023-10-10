import { Page, expect } from '@playwright/test';
import { View, ViewData } from './view';
import { getCtrlOrMeta } from '../utils/keyboard';

const settingsViewData: ViewData = {
  tabSelector: 'div.tab.tab-actions-right',
  viewSelector: 'div.editor-instance'
};

export class SettingsView extends View {
  constructor(page: Page) {
    super(settingsViewData, page);
  }

  async openWorkspaceSettings() {
    await this.executeCommand('Preferences: Open Workspace Settings (JSON)');
  }

  async openDefaultSettings() {
    await this.executeCommand('Preferences: Open Default Settings (JSON)');
  }

  override async isActive(): Promise<void> {
    await expect(this.tabLocator).toHaveClass(/active/);
  }

  async containsSetting(expectedSetting: string) {
    await expect(this.viewLocator).toBeVisible();
    await this.viewLocator.click();
    await this.page.keyboard.press(getCtrlOrMeta() + '+ArrowDown');
    await this.page.keyboard.press(getCtrlOrMeta() + '+End');
    await expect(this.viewLocator).toContainText(expectedSetting);
  }
}
