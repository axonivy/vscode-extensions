import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import {
  Disposable,
  EventEmitter,
  FileSystemError,
  FilePermission,
  FileType,
  Uri,
  type FileChangeEvent,
  type FileStat,
  type FileSystemProvider
} from 'vscode';

export const IAR_CONTENT_SCHEME = 'axonivy-iar-content';
const IVY_CONTENT_PATH = 'META-INF/ivy';

export interface IarProjectContext {
  app: string;
  project: string;
}

export interface IarEditorLocation extends IarProjectContext {
  file: string;
}

const iarProjectContexts = new Map<string, IarProjectContext>();
const iarEditorLocations = new Map<string, IarEditorLocation>();

export const applicationNameFromIvyProjectId = (projectId: string) => /^~([^/]+)\//.exec(projectId)?.[1];

export const iarContentUri = (archivePath: string, entryPath: string, projectContext?: IarProjectContext) => {
  if (projectContext) {
    iarProjectContexts.set(path.resolve(archivePath), projectContext);
  }
  const rememberEditorLocation = (uri: Uri) => {
    if (projectContext) {
      const file = entryPath.replace(/^META-INF\/ivy\/?/, '');
      if (file) {
        iarEditorLocations.set(iarUriKey(uri), { ...projectContext, file });
      }
    }
    return uri;
  };
  if (isIarArchive(archivePath) && entryPath.endsWith('.p.json')) {
    const archiveUri = Uri.file(path.resolve(archivePath)).toString();
    const encodedEntryPath = entryPath
      .split('/')
      .filter(Boolean)
      .map(segment => encodeURIComponent(segment))
      .join('/');
    return rememberEditorLocation(Uri.parse(`jar:${archiveUri}!/${encodedEntryPath}`));
  }

  const contentPath = entryPath.replace(/^META-INF\/ivy\/?/, '');
  const uriPath = [path.basename(archivePath), ...contentPath.split('/').filter(Boolean)]
    .map(segment => encodeURIComponent(segment))
    .join('/');
  const query = new URLSearchParams({ archive: archivePath, entry: entryPath });
  if (projectContext) {
    query.set('app', projectContext.app);
    query.set('project', projectContext.project);
  }
  return rememberEditorLocation(Uri.parse(`${IAR_CONTENT_SCHEME}:/${uriPath}?${query.toString()}`));
};

export const iarEditorLocation = (uri: Uri): IarEditorLocation | undefined => {
  const registeredLocation = iarEditorLocations.get(iarUriKey(uri));
  if (registeredLocation) {
    return registeredLocation;
  }
  if (uri.scheme === 'jar') {
    const jarLocation = parseJarUri(uri);
    const projectContext = jarLocation && iarProjectContexts.get(path.resolve(jarLocation.archivePath));
    if (!jarLocation || !projectContext) {
      return;
    }
    const file = jarLocation.entryPath.replace(/^META-INF\/ivy\/?/, '');
    if (!file || file.split('/').some(segment => segment === '.' || segment === '..')) {
      return;
    }
    return { ...projectContext, file };
  }
  if (uri.scheme !== IAR_CONTENT_SCHEME) {
    return;
  }
  const query = new URLSearchParams(uri.query);
  const app = query.get('app');
  const project = query.get('project');
  const archiveEntryPath = query.get('entry');
  if (!app || !project || !archiveEntryPath) {
    return;
  }
  const file = archiveEntryPath.replace(/^META-INF\/ivy\/?/, '');
  if (!file || file.split('/').some(segment => segment === '.' || segment === '..')) {
    return;
  }
  return { app, project, file };
};

export class IarContentFileSystemProvider implements FileSystemProvider {
  private readonly onDidChangeFileEmitter = new EventEmitter<FileChangeEvent[]>();
  readonly onDidChangeFile = this.onDidChangeFileEmitter.event;
  private readonly archives = new Map<string, AdmZip>();

  watch(_uri: Uri, _options: { readonly recursive: boolean; readonly excludes: readonly string[] }) {
    return new Disposable(() => undefined);
  }

  stat(uri: Uri): FileStat {
    const { archivePath, entryPath } = this.resolveUri(uri);
    const localPath = this.localPath(archivePath, entryPath);
    if (localPath) {
      try {
        const stat = fs.statSync(localPath);
        return {
          type: stat.isDirectory() ? FileType.Directory : FileType.File,
          ctime: stat.birthtimeMs,
          mtime: stat.mtimeMs,
          size: stat.size,
          permissions: FilePermission.Readonly
        };
      } catch {
        throw FileSystemError.FileNotFound(uri);
      }
    }

    const archive = this.getArchive(archivePath);
    const normalizedPath = entryPath.replace(/\/$/, '');
    const archiveEntry = archive.getEntry(normalizedPath) ?? archive.getEntry(`${normalizedPath}/`);
    if (archiveEntry && !archiveEntry.isDirectory) {
      const mtime = this.archiveMtime(archivePath);
      return {
        type: FileType.File,
        ctime: mtime,
        mtime,
        size: archiveEntry.getData().byteLength,
        permissions: FilePermission.Readonly
      };
    }
    const isDirectory = archiveEntry?.isDirectory || archive.getEntries().some(entry => entry.entryName.startsWith(`${normalizedPath}/`));
    if (isDirectory) {
      const mtime = this.archiveMtime(archivePath);
      return { type: FileType.Directory, ctime: mtime, mtime, size: 0, permissions: FilePermission.Readonly };
    }
    throw FileSystemError.FileNotFound(uri);
  }

  readDirectory(uri: Uri): [string, FileType][] {
    const { archivePath, entryPath } = this.resolveUri(uri);
    if (this.stat(uri).type !== FileType.Directory) {
      throw FileSystemError.FileNotADirectory(uri);
    }
    const localPath = this.localPath(archivePath, entryPath);
    if (localPath) {
      return fs.readdirSync(localPath, { withFileTypes: true }).map(entry => [
        entry.name,
        entry.isDirectory() ? FileType.Directory : FileType.File
      ]);
    }

    const prefix = `${entryPath.replace(/\/$/, '')}/`;
    const children = new Map<string, FileType>();
    for (const entry of this.getArchive(archivePath).getEntries()) {
      if (!entry.entryName.startsWith(prefix)) {
        continue;
      }
      const [name, ...remainingPath] = entry.entryName.slice(prefix.length).split('/').filter(Boolean);
      if (!name) {
        continue;
      }
      const type = entry.isDirectory || remainingPath.length > 0 ? FileType.Directory : FileType.File;
      if (type === FileType.Directory || !children.has(name)) {
        children.set(name, type);
      }
    }
    return [...children.entries()];
  }

  readFile(uri: Uri): Uint8Array {
    const { archivePath, entryPath } = this.resolveUri(uri);
    const localPath = this.localPath(archivePath, entryPath);
    if (localPath) {
      try {
        const stat = fs.statSync(localPath);
        if (stat.isDirectory()) {
          throw FileSystemError.FileIsADirectory(uri);
        }
        return fs.readFileSync(localPath);
      } catch (error) {
        if (error instanceof FileSystemError) {
          throw error;
        }
        throw FileSystemError.FileNotFound(uri);
      }
    }

    const archiveEntry = this.getArchive(archivePath).getEntry(entryPath);
    if (!archiveEntry) {
      throw FileSystemError.FileNotFound(uri);
    }
    if (archiveEntry.isDirectory) {
      throw FileSystemError.FileIsADirectory(uri);
    }
    return archiveEntry.getData();
  }

  createDirectory(uri: Uri): void {
    throw FileSystemError.NoPermissions(uri);
  }

  writeFile(uri: Uri, _content: Uint8Array, _options: { readonly create: boolean; readonly overwrite: boolean }): void {
    throw FileSystemError.NoPermissions(uri);
  }

  delete(uri: Uri, _options: { readonly recursive: boolean }): void {
    throw FileSystemError.NoPermissions(uri);
  }

  rename(oldUri: Uri, _newUri: Uri, _options: { readonly overwrite: boolean }): void {
    throw FileSystemError.NoPermissions(oldUri);
  }

  private resolveUri(uri: Uri) {
    if (uri.scheme === 'jar') {
      const jarLocation = parseJarUri(uri);
      if (!jarLocation) {
        throw FileSystemError.FileNotFound(uri);
      }
      return jarLocation;
    }
    const archivePath = new URLSearchParams(uri.query).get('archive');
    if (!archivePath) {
      throw FileSystemError.FileNotFound(uri);
    }
    const relativePath = uri.path.split('/').filter(Boolean).slice(1).join('/');
    const entryPath = relativePath ? path.posix.join(IVY_CONTENT_PATH, relativePath) : IVY_CONTENT_PATH;
    return { archivePath, entryPath };
  }

  private localPath(archivePath: string, entryPath: string) {
    try {
      if (fs.statSync(archivePath).isDirectory()) {
        return path.join(archivePath, ...entryPath.split('/'));
      }
    } catch {
      // The project directory is an IAR archive, not an exploded directory.
    }
    return undefined;
  }

  private archiveMtime(archivePath: string) {
    try {
      return fs.statSync(archivePath).mtimeMs;
    } catch {
      return 0;
    }
  }

  private getArchive(archivePath: string) {
    let archive = this.archives.get(archivePath);
    if (!archive) {
      archive = new AdmZip(archivePath);
      this.archives.set(archivePath, archive);
    }
    return archive;
  }
}

const isIarArchive = (archivePath: string) => {
  try {
    return fs.statSync(archivePath).isFile();
  } catch {
    return archivePath.toLowerCase().endsWith('.iar');
  }
};

const iarUriKey = (uri: Uri) => {
  const uriString = uri.toString();
  return uri.scheme === 'jar'
    ? uriString.replace(/^jar:file%3a/i, 'jar:file:').replace(/%21(?=\/)/gi, '!')
    : uriString;
};

const parseJarUri = (uri: Uri) => {
  // Uri.toString() may escape the nested file URI (`file:` and `!/`). Depending
  // on how the URI was created, `path` can be decoded already or still contain
  // those escapes, so handle both representations.
  const uriString = uri.toString();
  const paths = [uri.path, uriString.startsWith('jar:') ? uriString.slice('jar:'.length) : uriString];
  for (const rawPath of paths) {
    let nestedUri = rawPath;
    try {
      nestedUri = decodeURIComponent(rawPath);
    } catch {
      // Keep the URI path as-is if it contains a literal percent character.
    }
    const fileUriStart = nestedUri.indexOf('file:');
    if (fileUriStart < 0) {
      continue;
    }
    nestedUri = nestedUri.slice(fileUriStart);
    const separatorIndex = nestedUri.indexOf('!/');
    if (separatorIndex < 0) {
      continue;
    }
    const archiveUri = Uri.parse(nestedUri.slice(0, separatorIndex));
    if (archiveUri.scheme !== 'file') {
      continue;
    }
    const entryPath = nestedUri.slice(separatorIndex + 2).replace(/^\/+/, '');
    return { archivePath: archiveUri.fsPath, entryPath };
  }
};
