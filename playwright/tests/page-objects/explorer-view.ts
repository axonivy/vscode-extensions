import { Page, expect, Locator } from '@playwright/test';
import { View, ViewData } from './view';

export abstract class ExplorerView extends View {
  constructor(private viewName: string, page: Page) {
    const data: ViewData = {
      tabSelector: `div.pane-header:has-text("${viewName}")`,
      viewSelector: ''
    };
    super(data, page);
  }

  override get viewLocator(): Locator {
    return this.page.getByRole('tree', { name: this.viewName });
  }

  async isHidden(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(this.tabLocator).toBeHidden();
  }

  async openView(): Promise<void> {
    if (!(await this.page.locator(`${this.data.tabSelector}.expanded`).isVisible())) {
      await this.tabLocator.click();
    }
    await expect(this.viewLocator).toBeVisible();
  }

  async closeView(): Promise<void> {
    if (await this.page.locator(`${this.data.tabSelector}.expanded`).isVisible()) {
      await this.tabLocator.click();
    }
    await expect(this.viewLocator).toBeHidden();
  }

  async hasNode(name: string): Promise<void> {
    const node = this.viewLocator.getByText(name);
    await expect(node).toBeVisible();
  }

  async hasNoNode(name: string): Promise<void> {
    const node = this.viewLocator.getByText(name);
    await expect(node).not.toBeAttached();
  }

  async selectNode(name: string): Promise<void> {
    await this.viewLocator.getByText(name).click();
    await this.isSelected(name);
  }

  async isSelected(name: string): Promise<void> {
    const selected = this.viewLocator.locator('.monaco-list-row.selected');
    await expect(selected).toContainText(name);
  }

  async doubleClickExpandable(name: string): Promise<void> {
    await this.viewLocator.getByText(name).dblclick();
  }
}

export class FileExplorer extends ExplorerView {
  constructor(page: Page) {
    super('Explorer', page);
  }

  async addFolder(name: string): Promise<void> {
    await this.executeCommand('File: New Folder');
    await this.provideUserInput(name);
  }

  async addNestedProject(rootFolder: string, projectName: string): Promise<void> {
    await this.viewLocator.click();
    await this.addFolder(rootFolder);
    await this.selectNode(rootFolder);
    await this.executeCommand('Axon Ivy: New Project');
    await this.provideUserInput(projectName);
    await this.provideUserInput();
    await this.provideUserInput();
    await this.provideUserInput();
    await this.hasNode(rootFolder + '/' + projectName);
  }

  async addProcess(
    projectName: string,
    processName: string,
    kind: 'Business Process' | 'Callable Sub Process' | 'Web Service Process'
  ): Promise<void> {
    await this.selectNode(projectName);
    await this.executeCommand('Axon Ivy: New ' + kind);
    await this.provideUserInput(processName);
  }
}

export class ProjectExplorerView extends ExplorerView {
  constructor(page: Page) {
    super('Axon Ivy Projects', page);
  }

  async revealInExplorer(name: string): Promise<void> {
    await this.selectNode(name);
    await this.executeCommand('Axon Ivy: Reveal in Explorer');
  }
}

export class OutlineExplorerView extends ExplorerView {
  constructor(page: Page) {
    super('Process Outline', page);
  }
}
