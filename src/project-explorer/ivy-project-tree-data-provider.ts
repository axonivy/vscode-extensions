import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FileStat } from './file-stat';

export interface Entry {
  uri: vscode.Uri;
  type: vscode.FileType;
  iconPath?: string;
  contextValue?: string;
  parent?: Entry;
}

export const IVY_RPOJECT_FILE_PATTERN = '**/.project';

export class IvyProjectTreeDataProvider implements vscode.TreeDataProvider<Entry> {
  private ivyProjects: Promise<string[]>;
  private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | null | void> = new vscode.EventEmitter<
    Entry | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<Entry | undefined | null | void> = this._onDidChangeTreeData.event;

  private _onDidCreateTreeItem: vscode.EventEmitter<Entry> = new vscode.EventEmitter<Entry>();
  readonly onDidCreateTreeItem: vscode.Event<Entry> = this._onDidCreateTreeItem.event;

  private entryCache = new Map<string, Entry>();
  private openTabPaths: string[];

  constructor() {
    this.openTabPaths = this.currentOpenTabPaths();
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
    const ivyProjectFiles = await vscode.workspace.findFiles(IVY_RPOJECT_FILE_PATTERN);
    return ivyProjectFiles
      .filter(uri => this.containsIvyProjectNature(uri.fsPath))
      .map(projectFile => path.dirname(projectFile.fsPath))
      .sort();
  }

  private containsIvyProjectNature(path: string) {
    const contents = fs.readFileSync(path, 'utf-8');
    return contents.includes('<nature>ch.ivyteam.ivy.project.IvyProjectNature</nature>');
  }

  async hasIvyProjects(): Promise<boolean> {
    return (await this.ivyProjects).length > 0;
  }

  async getIvyProjects(): Promise<string[]> {
    return await this.ivyProjects;
  }

  refresh(): void {
    this.entryCache.clear();
    this.openTabPaths = this.currentOpenTabPaths();
    this.ivyProjects = this.findIvyProjects();
    this._onDidChangeTreeData.fire();
  }

  refreshSubtree(entry: Entry): void {
    this.openTabPaths = this.currentOpenTabPaths();
    this._onDidChangeTreeData.fire(entry);
  }

  getTreeItem(element: Entry): vscode.TreeItem {
    const collapsibleState = this.collapsibleStateOf(element);
    const treeItem = new vscode.TreeItem(element.uri, collapsibleState);
    if (element.type === vscode.FileType.File) {
      treeItem.command = { command: 'vscode.open', title: 'Open File', arguments: [element.uri] };
      treeItem.contextValue = 'file';
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
      return children.map(([childName, childType]) => this.createAndCacheChild(element, childName, childType));
    }
    return (await this.ivyProjects).map(dir => this.createAndCacheRoot(dir));
  }

  private createAndCacheRoot(ivyProjectDir: string): Entry {
    const entry = {
      uri: vscode.Uri.file(ivyProjectDir),
      type: vscode.FileType.Directory,
      iconPath: path.join(__dirname, '..', 'assets', 'ivy-logo-black-background.svg'),
      contextValue: 'ivyProject'
    };
    this.cacheEntry(entry);
    return entry;
  }

  private createAndCacheChild(parent: Entry, childName: string, childType: vscode.FileType): Entry {
    const childUri = vscode.Uri.file(path.join(parent.uri.fsPath, childName));
    const entry = { uri: childUri, type: childType, parent };
    this.cacheEntry(entry);
    return entry;
  }

  private openTabPathStartsWith(childPath: string): boolean {
    return this.openTabPaths.find(tabPath => tabPath.startsWith(childPath)) ? true : false;
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const children = await this.readdir(uri.fsPath);
    const result: [string, vscode.FileType][] = [];
    for (const child of children) {
      const fileStat = await this.fileStat(path.join(uri.fsPath, child));
      result.push([child, fileStat.type]);
    }
    return result;
  }

  async readdir(path: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(path, (error, children) => this.handleResult(resolve, reject, error, this.normalizeNFC(children)));
    });
  }

  normalizeNFC(items: string[]): string[] {
    if (process.platform !== 'darwin') {
      return items;
    }

    if (Array.isArray(items)) {
      return items.map(item => item.normalize('NFC'));
    }
    return [];
  }

  async fileStat(path: string): Promise<vscode.FileStat> {
    return new FileStat(await this.fsStats(path));
  }

  async fsStats(path: string): Promise<fs.Stats> {
    return new Promise<fs.Stats>((resolve, reject) => {
      fs.stat(path, (error, stat) => this.handleResult(resolve, reject, error, stat));
    });
  }

  handleResult<T>(resolve: (result: T) => void, reject: (error: Error) => void, error: Error | null | undefined, result: T): void {
    if (error) {
      reject(this.massageError(error));
    } else {
      resolve(result);
    }
  }

  massageError(error: Error & { code?: string }): Error {
    if (error.code === 'ENOENT') {
      return vscode.FileSystemError.FileNotFound();
    }

    if (error.code === 'EISDIR') {
      return vscode.FileSystemError.FileIsADirectory();
    }

    if (error.code === 'EEXIST') {
      return vscode.FileSystemError.FileExists();
    }

    if (error.code === 'EPERM' || error.code === 'EACCES') {
      return vscode.FileSystemError.NoPermissions();
    }

    return error;
  }

  static rootOf(child: Entry): Entry {
    if (child.parent) {
      return this.rootOf(child.parent);
    }
    return child;
  }

  async delete(entry: Entry): Promise<void> {
    vscode.workspace.fs.delete(entry.uri, { recursive: true });
  }
}
