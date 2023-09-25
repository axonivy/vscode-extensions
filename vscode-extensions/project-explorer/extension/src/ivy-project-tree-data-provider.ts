import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FileStat } from './file-stat';

interface Entry {
  uri: vscode.Uri;
  type: vscode.FileType;
  iconPath?: string;
}

export const IVY_RPOJECT_FILE_PATTERN = '**/.project';

export class IvyProjectTreeDataProvider implements vscode.TreeDataProvider<Entry> {
  private ivyProjects: Promise<string[]>;
  private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | null | void> = new vscode.EventEmitter<
    Entry | undefined | null | void
  >();
  readonly onDidChangeTreeData: vscode.Event<Entry | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor() {
    this.ivyProjects = this.findIvyProjects();
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
    this.ivyProjects = this.findIvyProjects();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: Entry): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.uri,
      element.type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    );
    if (element.type === vscode.FileType.File) {
      treeItem.command = { command: 'vscode.open', title: 'Open File', arguments: [element.uri] };
      treeItem.contextValue = 'file';
    }
    if (element.iconPath) {
      treeItem.iconPath = element.iconPath;
    }
    return treeItem;
  }

  async getChildren(element?: Entry): Promise<Entry[]> {
    if (element) {
      const children = await this.readDirectory(element.uri);
      return children.map(([name, type]) => ({ uri: vscode.Uri.file(path.join(element.uri.fsPath, name)), type }));
    }
    return (await this.ivyProjects).map(dir => ({
      uri: vscode.Uri.file(dir),
      type: vscode.FileType.Directory,
      iconPath: path.join(__dirname, '..', 'assets', 'ivy-logo.svg')
    }));
  }

  async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const children = await this.readdir(uri.fsPath);

    const result: [string, vscode.FileType][] = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const fileStat = await this.fileStat(path.join(uri.fsPath, child));
      result.push([child, fileStat.type]);
    }

    return Promise.resolve(result);
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
}
