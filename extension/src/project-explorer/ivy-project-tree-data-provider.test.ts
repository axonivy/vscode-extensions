import { beforeEach, expect, test, vi } from 'vitest';
import { FilePermission, FileType, ThemeIcon, TreeItemCollapsibleState } from 'vscode';
import { applicationNameFromIvyProjectId, iarEditorLocation, IarContentFileSystemProvider } from './iar-content-provider';
import { IvyProjectTreeDataProvider } from './ivy-project-tree-data-provider';

const mocks = vi.hoisted(() => ({
  findFiles: vi.fn(),
  findEngineProjects: vi.fn(),
  executeCommand: vi.fn()
}));

vi.mock('vscode', () => {
  class EventEmitter<T> {
    event = vi.fn();
    fire = vi.fn();
  }
  class TreeItem {
    description?: string;
    tooltip?: string;
    iconPath?: unknown;
    resourceUri?: unknown;
    contextValue?: string;
    command?: unknown;
    constructor(
      public label: unknown,
      public collapsibleState?: number
    ) {}
  }
  class ThemeIcon {
    constructor(public id: string) {}
  }
  class Range {
    constructor(..._args: number[]) {}
  }
  class Diagnostic {
    constructor(..._args: unknown[]) {}
  }
  class Disposable {
    constructor(_dispose: () => void) {}
  }
  class FileSystemError extends Error {
    static FileNotFound = (message?: string) => new FileSystemError(message);
    static FileNotADirectory = (message?: string) => new FileSystemError(message);
    static FileIsADirectory = (message?: string) => new FileSystemError(message);
    static NoPermissions = (message?: string) => new FileSystemError(message);
  }
  const parseUri = (value: string) => {
    const parsed = new URL(value);
    const uriPath = decodeURIComponent(parsed.pathname);
    return { fsPath: uriPath, path: uriPath, scheme: parsed.protocol.slice(0, -1), query: parsed.search.slice(1) };
  };
  return {
    Diagnostic,
    DiagnosticSeverity: { Error: 0 },
    Disposable,
    EventEmitter,
    FileSystemError,
    FilePermission: { Readonly: 1 },
    FileType: { File: 1, Directory: 2 },
    Range,
    ThemeIcon,
    TreeItem,
    TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
    Uri: {
      file: (fsPath: string) => ({ fsPath }),
      parse: parseUri
    },
    l10n: {
      t: (message: string, ...args: unknown[]) =>
        args.reduce<string>((text, arg, index) => text.replace(`{${index}}`, String(arg)), message)
    },
    workspace: { findFiles: mocks.findFiles }
  };
});

vi.mock('adm-zip', () => ({
  default: class AdmZip {
    constructor(_archivePath: string) {}

    getEntries() {
      return [
        { entryName: 'META-INF/ivy/process/', isDirectory: true },
        { entryName: 'META-INF/ivy/process/hello.p.json', isDirectory: false },
        { entryName: 'META-INF/ivy/variables.yaml', isDirectory: false },
        { entryName: 'META-INF/services/service.txt', isDirectory: false }
      ];
    }

    getEntry(entryPath: string) {
      if (entryPath !== 'META-INF/ivy/process/hello.p.json') {
        return undefined;
      }
      return { entryName: entryPath, isDirectory: false, getData: () => Buffer.from('{"name":"IAR process"}') };
    }
  }
}));

vi.mock('../base/commands', () => ({ executeCommand: mocks.executeCommand }));
vi.mock('../base/configurations', () => ({ config: { projectExcludePattern: () => '', projectMaximumNumber: () => 50 } }));
vi.mock('../engine/diagnostics', () => ({ IvyDiagnostics: { instance: { projectFileUrisToBeConverted: () => [] } } }));

beforeEach(() => {
  mocks.findFiles.mockResolvedValue([{ fsPath: '/workspace/local/.ivyproject' }]);
  mocks.findEngineProjects.mockResolvedValue([
    {
      artifactId: 'workspace-project',
      groupId: 'com.example',
      id: { id: 'workspace-project', name: 'workspace-project', project: 'test-app', isIar: false },
      version: '1.0.0',
      projectDirectory: '/workspace/local'
    },
    {
      artifactId: 'shared-project',
      groupId: 'com.example',
      id: {
        id: '~test-app/test-app/1/shared-project',
        name: 'shared-project',
        project: 'shared-project',
        isIar: true
      },
      version: '2.1.0',
      projectDirectory: '/home/user/.m2/repository/com/example/shared-project/2.1.0/shared-project-2.1.0.iar'
    }
  ]);
});

test('lists IAR projects in a separate read-only section', async () => {
  const provider = new IvyProjectTreeDataProvider(Promise.resolve(), mocks.findEngineProjects);

  const roots = await provider.getChildren();
  expect(roots.map(entry => entry.kind)).toEqual(['workspaceProject', 'iarDependencyGroup']);
  expect(roots[1]?.label).toBe('IAR Dependencies');
  expect(roots[1]?.collapsibleState).toBe(TreeItemCollapsibleState.Collapsed);

  const dependencies = await provider.getChildren(roots[1]);
  expect(dependencies).toHaveLength(1);
  expect(dependencies[0]).toMatchObject({
    label: 'shared-project',
    description: '2.1.0',
    kind: 'iarDependency',
    type: FileType.Directory
  });
  expect(dependencies[0]?.iconPath).toBeInstanceOf(ThemeIcon);
  expect((dependencies[0]?.iconPath as ThemeIcon).id).toBe('lock');
  expect(provider.getTreeItem(dependencies[0]!).contextValue).toBeUndefined();
});

test('extracts the hosting application name from an engine project id', () => {
  expect(applicationNameFromIvyProjectId('~Developer-prebuiltproject/Developer-prebuiltproject/1/genderize-io-connector')).toBe(
    'Developer-prebuiltproject'
  );
  expect(applicationNameFromIvyProjectId('genderize-io-connector')).toBeUndefined();
});

test('shows only the META-INF/ivy tree and opens files as read-only documents', async () => {
  const provider = new IvyProjectTreeDataProvider(Promise.resolve(), mocks.findEngineProjects);
  const [workspaceProject, iarGroup] = await provider.getChildren();
  const [iarDependency] = await provider.getChildren(iarGroup);
  const rootEntries = await provider.getChildren(iarDependency);

  expect(rootEntries.map(entry => entry.label)).toEqual(['process', 'variables.yaml']);
  expect(rootEntries[0]?.kind).toBe('iarContentDirectory');
  expect(rootEntries[1]?.type).toBe(FileType.File);

  const [processFile] = await provider.getChildren(rootEntries[0]);
  expect(processFile?.label).toBe('hello.p.json');
  expect(processFile?.command?.command).toBe('vscode.open');
  expect(provider.getTreeItem(processFile!).resourceUri).toBe(processFile?.uri);
  const fsProvider = new IarContentFileSystemProvider();
  const fileUri = processFile!.command!.arguments![0] as import('vscode').Uri;
  expect(fileUri.path).toBe('/shared-project-2.1.0.iar/process/hello.p.json');
  expect(iarEditorLocation(fileUri)).toEqual({ app: 'test-app', project: 'shared-project', file: 'process/hello.p.json' });
  expect(fsProvider.stat(fileUri).permissions).toBe(FilePermission.Readonly);
  expect(Buffer.from(fsProvider.readFile(fileUri)).toString('utf8')).toBe('{"name":"IAR process"}');
  expect(fsProvider.readDirectory(iarDependency!.uri)).toEqual([['process', FileType.Directory], ['variables.yaml', FileType.File]]);
  expect(() => fsProvider.writeFile(fileUri, new Uint8Array(), { create: true, overwrite: true })).toThrow();
  expect(workspaceProject?.kind).toBe('workspaceProject');
});
