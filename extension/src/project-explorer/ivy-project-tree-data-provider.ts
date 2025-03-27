import * as path from 'path';
import * as vscode from 'vscode';
import { config } from '../base/configurations';

export interface Entry {
  uri: vscode.Uri;
  type: vscode.FileType;
  iconPath?: string | vscode.IconPath;
  contextValue?: string;
  parent?: Entry;
  collapsibleState?: vscode.TreeItemCollapsibleState;
  command?: vscode.Command;
}

export const IVY_RPOJECT_FILE_PATTERN = '**/.project';
const IVY_PROJECT_CONTEXT_VALUE = 'ivyProject';

export class IvyProjectTreeDataProvider implements vscode.TreeDataProvider<Entry> {
  private ivyProjects: Promise<string[]>;
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  private _onDidChangeTreeData = new vscode.EventEmitter<Entry | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private _onDidCreateTreeItem = new vscode.EventEmitter<Entry>();
  readonly onDidCreateTreeItem = this._onDidCreateTreeItem.event;

  private entryCache = new Map<string, Entry>();
  private openTabPaths: string[];
  private readonly excludePattern: string;
  private readonly maxResults: number;

  constructor() {
    this.openTabPaths = this.currentOpenTabPaths();
    this.excludePattern = config.projectExcludePattern() ?? '';
    this.maxResults = config.projectMaximumNumber() ?? 50;
    this.ivyProjects = this.findIvyProjects();
  }

  private currentOpenTabPaths() {
    return vscode.window.tabGroups.all
      .flatMap(tabGroup => tabGroup.tabs.flatMap(tabs => tabs.input as { uri: vscode.Uri }))
      .filter(input => input && input.uri)
      .map(input => input.uri.fsPath);
  }

  getEntryCache() {
    return this.entryCache;
  }

  private cacheEntry(entry: Entry) {
    this.entryCache.set(entry.uri.fsPath, entry);
  }

  private async findIvyProjects(): Promise<string[]> {
    const ivyProjectFiles = await vscode.workspace.findFiles(IVY_RPOJECT_FILE_PATTERN, this.excludePattern, this.maxResults);
    const ivyProjectFilesWihtInclude = await Promise.all(
      ivyProjectFiles.map(async uri => ({
        uri: uri,
        include: await this.containsIvyProjectNature(uri)
      }))
    );
    return ivyProjectFilesWihtInclude
      .filter(e => e.include)
      .map(e => path.dirname(e.uri.fsPath))
      .sort();
  }

  private async containsIvyProjectNature(uri: vscode.Uri): Promise<boolean> {
    const bytes = await vscode.workspace.fs.readFile(uri);
    const content = Buffer.from(bytes).toString('utf8');
    return content.includes('<nature>ch.ivyteam.ivy.project.IvyProjectNature</nature>');
  }

  async hasIvyProjects(): Promise<boolean> {
    return (await this.ivyProjects).length > 0;
  }

  async getIvyProjects(): Promise<string[]> {
    return this.ivyProjects;
  }

  refresh() {
    this.entryCache.clear();
    this.openTabPaths = this.currentOpenTabPaths();
    this.ivyProjects = this.findIvyProjects();
    this._onDidChangeTreeData.fire();
  }

  refreshSubtree(entry: Entry) {
    this.openTabPaths = this.currentOpenTabPaths();
    this._onDidChangeTreeData.fire(entry);
  }

  getTreeItem(element: Entry): vscode.TreeItem {
    const collapsibleState = this.collapsibleStateOf(element);
    const treeItem = new vscode.TreeItem(element.uri, collapsibleState);
    if (element.command) {
      treeItem.command = element.command;
    }
    if (element.iconPath) {
      treeItem.iconPath = element.iconPath;
    }
    if (element.contextValue) {
      treeItem.contextValue = element.contextValue;
    }
    this._onDidCreateTreeItem.fire(element);
    return treeItem;
  }

  private collapsibleStateOf(element: Entry): vscode.TreeItemCollapsibleState {
    if (element.collapsibleState !== undefined) {
      return element.collapsibleState;
    }
    if (element.type !== vscode.FileType.Directory) {
      return vscode.TreeItemCollapsibleState.None;
    }
    if (this.openTabPathStartsWith(element.uri.fsPath)) {
      return vscode.TreeItemCollapsibleState.Expanded;
    }
    return vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getParent(element: Entry): Promise<Entry | undefined> {
    return element.parent;
  }

  async getChildren(element?: Entry): Promise<Entry[]> {
    if (element) {
      const children = await this.readDirectory(element.uri);
      return children
        .map(([childName, childType]) => this.createAndCacheChild(element, childName, childType))
        .sort((a, b) => (a.type > b.type ? -1 : 0));
    }
    return (await this.ivyProjects).map(dir => this.createAndCacheRoot(dir));
  }

  private createAndCacheRoot(ivyProjectDir: string): Entry {
    const entry = {
      uri: vscode.Uri.file(ivyProjectDir),
      type: vscode.FileType.Directory,
      iconPath: path.join(__dirname, '..', 'assets', 'ivy-logo-black-background.svg'),
      contextValue: IVY_PROJECT_CONTEXT_VALUE
    };
    this.cacheEntry(entry);
    return entry;
  }

  private createAndCacheChild(parent: Entry, childName: string, childType: vscode.FileType): Entry {
    const childUri = vscode.Uri.file(path.join(parent.uri.fsPath, childName));
    const entry: Entry = { uri: childUri, type: childType, parent };
    if (childType === vscode.FileType.File) {
      entry.command = { command: 'vscode.open', title: 'Open File', arguments: [childUri] };
      entry.contextValue = 'file';
    }
    if (this.isCmsDirectory(parent, childName, childType)) {
      this.makeCmsEntry(entry);
    }
    this.cacheEntry(entry);
    return entry;
  }

  private isCmsDirectory(parent: Entry, name: string, type: vscode.FileType) {
    return parent.contextValue === IVY_PROJECT_CONTEXT_VALUE && name === 'cms' && type === vscode.FileType.Directory;
  }

  private makeCmsEntry(entry: Entry) {
    entry.collapsibleState = vscode.TreeItemCollapsibleState.None;
    entry.iconPath = {
      light: vscode.Uri.file(path.join(__dirname, '..', 'assets', 'light', 'cms.svg')),
      dark: vscode.Uri.file(path.join(__dirname, '..', 'assets', 'dark', 'cms.svg'))
    };
    entry.command = { command: 'ivyBrowserView.openCmsEditor', title: 'Open CMS Editor', arguments: [entry.uri] };
  }

  private openTabPathStartsWith(childPath: string): boolean {
    return this.openTabPaths.find(tabPath => tabPath.startsWith(childPath)) ? true : false;
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    return (await vscode.workspace.fs.readDirectory(uri)).filter(([childName]) => !childName.startsWith('.'));
  }
}
