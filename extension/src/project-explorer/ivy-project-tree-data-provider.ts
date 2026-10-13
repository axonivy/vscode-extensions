import fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import {
  Diagnostic,
  DiagnosticSeverity,
  EventEmitter,
  FileType,
  l10n,
  Range,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  workspace,
  type TreeDataProvider,
  type Command as VSCodeCommand
} from 'vscode';
import { executeCommand, type KnownCommand } from '../base/commands';
import { config } from '../base/configurations';
import { IvyDiagnostics } from '../engine/diagnostics';
import type { ProjectBean } from '../engine/api/generated/client';
import { iarContentUri } from './iar-content-provider';

const __dirname = import.meta.dirname;
interface IvyCommand extends VSCodeCommand {
  command: KnownCommand;
}

export interface Entry {
  uri: Uri;
  type: FileType;
  label?: string;
  description?: string;
  tooltip?: string;
  iconPath?: TreeItem['iconPath'];
  collapsibleState?: TreeItemCollapsibleState;
  contextValue?: string;
  kind?: 'workspaceProject' | 'iarDependencyGroup' | 'iarDependency' | 'iarContentDirectory' | 'iarContentFile';
  archivePath?: string;
  archiveEntryPath?: string;
  parent?: Entry;
  command?: IvyCommand;
}

export const IVY_PROJECT_FILE_PATTERN = '**/{.ivyproject,.project}';
const IVY_PROJECT_CONTEXT_VALUE = 'ivyProject';
const IVY_PROJECT_REQUIRES_CONVERSION_CONTEXT_VALUE = 'requiresConversion';

export const isIvyProject = (projectFile: Uri) => {
  const projectFilePath = projectFile.fsPath;
  try {
    if (path.basename(projectFilePath) === '.ivyproject') {
      return true;
    }
    const content = fs.readFileSync(projectFile.fsPath, 'utf8');
    return content.includes('<nature>ch.ivyteam.ivy.project.IvyProjectNature</nature>');
  } catch {
    return false;
  }
};

type ProjectFindResult = {
  projects: string[];
  diagnostics: Map<Uri, Diagnostic>;
};

export class IvyProjectTreeDataProvider implements TreeDataProvider<Entry> {
  private ivyProjects: Promise<ProjectFindResult>;
  private iarProjects?: Promise<ProjectBean[]>;
  private iarArchives = new Map<string, AdmZip>();
  private _onDidChangeTreeData = new EventEmitter<Entry | undefined | null>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private entryCache = new Map<string, Entry>();

  private readonly excludePattern: string;
  private readonly maxResults: number;

  constructor(
    readonly activateEnginePromise: Promise<void>,
    private readonly findEngineProjects: () => Promise<ProjectBean[] | undefined>
  ) {
    this.excludePattern = config.projectExcludePattern() ?? '';
    this.maxResults = config.projectMaximumNumber() ?? 50;
    this.ivyProjects = this.findIvyProjects();
  }

  private cacheEntry(entry: Entry) {
    this.entryCache.set(entry.uri.fsPath, entry);
  }

  private async findIvyProjects() {
    const projectFiles = await workspace.findFiles(IVY_PROJECT_FILE_PATTERN, this.excludePattern, this.maxResults);
    const distinctProjectDirs = [...new Set(projectFiles.filter(p => isIvyProject(p)).map(p => path.dirname(p.fsPath)))];
    const projectsPerBaseName = new Map<string, string[]>();
    for (const projectDir of distinctProjectDirs) {
      const baseName = path.basename(projectDir).toLowerCase();
      projectsPerBaseName.set(baseName, [...(projectsPerBaseName.get(baseName) ?? []), projectDir]);
    }
    const validProjects: string[] = [];
    const diagnostics = new Map<Uri, Diagnostic>();
    [...projectsPerBaseName.entries()].forEach(([baseName, projectDirs]) => {
      if (projectDirs.length === 1 && projectDirs[0]) {
        validProjects.push(projectDirs[0]);
      } else if (projectDirs.length > 1) {
        projectDirs.forEach(dir => {
          const message = `Multiple project directories with the same name '${baseName}' found: ${projectDirs.join(', ')}. Please cleanup the workspace.`;
          diagnostics.set(Uri.file(dir), new Diagnostic(new Range(0, 0, 0, 0), message, DiagnosticSeverity.Error));
        });
      }
    });
    await executeCommand('setContext', 'ivy:hasIvyProjects', validProjects.length > 0);
    return { projects: validProjects.sort(), diagnostics };
  }

  async hasIvyProjects(): Promise<boolean> {
    return (await this.ivyProjects).projects.length > 0;
  }

  async getIvyProjects(): Promise<string[]> {
    return this.ivyProjects.then(result => result.projects);
  }

  async getDiagnostics(): Promise<Map<Uri, Diagnostic>> {
    return this.ivyProjects.then(result => result.diagnostics);
  }

  refresh() {
    this.ivyProjects = this.findIvyProjects();
    this.iarProjects = undefined;
    this.iarArchives.clear();
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: Entry): TreeItem {
    const projectNeedsConversion =
      element.kind === 'workspaceProject' &&
      IvyDiagnostics.instance
        .projectFileUrisToBeConverted()
        .map(uri => uri.fsPath)
        .map(projectFile => path.dirname(projectFile))
        .includes(element.uri.fsPath);

    const treeItem = element.label
      ? new TreeItem(element.label, element.collapsibleState)
      : new TreeItem(element.uri, element.collapsibleState);
    if (element.kind === 'iarContentDirectory' || element.kind === 'iarContentFile') {
      treeItem.resourceUri = element.uri;
    }
    if (projectNeedsConversion) {
      treeItem.description = '(needs conversion)';
    } else if (element.description) {
      treeItem.description = element.description;
    }
    if (element.tooltip) {
      treeItem.tooltip = element.tooltip;
    }
    if (element.command) {
      treeItem.command = element.command;
    }
    if (element.iconPath) {
      treeItem.iconPath = element.iconPath;
    }
    if (element.contextValue) {
      let itemContextValue = element.contextValue;
      itemContextValue += projectNeedsConversion ? `+${IVY_PROJECT_REQUIRES_CONVERSION_CONTEXT_VALUE}` : '';
      treeItem.contextValue = itemContextValue;
    }
    return treeItem;
  }

  async getParent(element: Entry): Promise<Entry | undefined> {
    return element.parent;
  }

  async getChildren(element?: Entry): Promise<Entry[]> {
    await this.activateEnginePromise;
    if (element?.kind === 'iarDependencyGroup') {
      return (await this.getIarProjects()).map(project => ({
        uri: Uri.file(project.projectDirectory),
        type: FileType.Directory,
        label: project.artifactId,
        description: project.version,
        tooltip: `${project.groupId}:${project.artifactId}:${project.version}`,
        iconPath: new ThemeIcon('lock'),
        collapsibleState: TreeItemCollapsibleState.Collapsed,
        kind: 'iarDependency',
        archivePath: project.projectDirectory,
        archiveEntryPath: 'META-INF/ivy',
        parent: element
      }));
    }
    if (element?.kind === 'iarDependency' || element?.kind === 'iarContentDirectory') {
      return this.getIarContentChildren(element);
    }
    if (element) {
      return [];
    }
    const workspaceProjects = (await this.ivyProjects).projects.map(dir => this.createAndCacheRoot(dir));
    const iarProjects = await this.getIarProjects();
    if (iarProjects.length === 0) {
      return workspaceProjects;
    }
    return [...workspaceProjects, this.createIarGroup()];
  }

  private async getIarProjects() {
    this.iarProjects ??= this.findEngineProjects().then(projects =>
      (projects ?? []).filter(project => project.id.isIar).sort((a, b) => {
        const aCoordinate = `${a.groupId}:${a.artifactId}:${a.version}`;
        const bCoordinate = `${b.groupId}:${b.artifactId}:${b.version}`;
        return aCoordinate.localeCompare(bCoordinate);
      })
    );
    return this.iarProjects;
  }

  private getIarContentChildren(parent: Entry): Entry[] {
    const archivePath = parent.archivePath;
    const parentEntryPath = parent.archiveEntryPath;
    if (!archivePath || !parentEntryPath) {
      return [];
    }
    const children = this.isDirectory(archivePath)
      ? this.getIarDirectoryChildren(archivePath, parentEntryPath)
      : this.getIarArchiveChildren(archivePath, parentEntryPath);
    return children
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.entryPath.localeCompare(b.entryPath);
      })
      .map(({ entryPath, isDirectory }) => ({
        uri: iarContentUri(archivePath, entryPath),
        type: isDirectory ? FileType.Directory : FileType.File,
        label: path.posix.basename(entryPath),
        collapsibleState: isDirectory ? TreeItemCollapsibleState.Collapsed : undefined,
        kind: isDirectory ? 'iarContentDirectory' : 'iarContentFile',
        archivePath,
        archiveEntryPath: entryPath,
        command: isDirectory ? undefined : { command: 'vscode.open', title: 'Open', arguments: [iarContentUri(archivePath, entryPath)] },
        parent
      }));
  }

  private getIarArchiveChildren(archivePath: string, parentEntryPath: string) {
    const archive = this.getIarArchive(archivePath);
    const prefix = `${parentEntryPath.replace(/\/$/, '')}/`;
    const children = new Map<string, boolean>();
    for (const archiveEntry of archive.getEntries()) {
      if (!archiveEntry.entryName.startsWith(prefix)) {
        continue;
      }
      const relativePath = archiveEntry.entryName.slice(prefix.length);
      if (!relativePath) {
        continue;
      }
      const [name, ...remainingPath] = relativePath.split('/').filter(Boolean);
      if (!name) {
        continue;
      }
      const childPath = `${prefix}${name}`;
      const isDirectory = archiveEntry.isDirectory || remainingPath.length > 0;
      children.set(childPath, (children.get(childPath) ?? false) || isDirectory);
    }
    return [...children].map(([entryPath, isDirectory]) => ({ entryPath, isDirectory }));
  }

  private getIarDirectoryChildren(projectDirectory: string, parentEntryPath: string) {
    const directory = path.join(projectDirectory, ...parentEntryPath.split('/'));
    try {
      return fs
        .readdirSync(directory, { withFileTypes: true })
        .filter(entry => entry.isDirectory() || entry.isFile())
        .map(entry => ({
          entryPath: path.posix.join(parentEntryPath, entry.name),
          isDirectory: entry.isDirectory()
        }));
    } catch {
      return [];
    }
  }

  private isDirectory(filePath: string) {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  }

  private getIarArchive(archivePath: string) {
    let archive = this.iarArchives.get(archivePath);
    if (!archive) {
      archive = new AdmZip(archivePath);
      this.iarArchives.set(archivePath, archive);
    }
    return archive;
  }

  private createIarGroup(): Entry {
    return {
      uri: Uri.parse('axonivy:iar-dependencies'),
      type: FileType.Directory,
      label: l10n.t('IAR Dependencies'),
      iconPath: new ThemeIcon('library'),
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      kind: 'iarDependencyGroup'
    };
  }

  private createAndCacheRoot(ivyProjectDir: string): Entry {
    const entry: Entry = {
      uri: Uri.file(ivyProjectDir),
      type: FileType.Directory,
      iconPath: path.join(__dirname, '..', 'assets', 'ivy-logo-black-background.svg'),
      contextValue: IVY_PROJECT_CONTEXT_VALUE,
      kind: 'workspaceProject'
    };
    this.cacheEntry(entry);
    return entry;
  }
}
