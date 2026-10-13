import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { Uri, type TextDocumentContentProvider } from 'vscode';

export const IAR_CONTENT_SCHEME = 'axonivy-iar-content';

export const iarContentUri = (archivePath: string, entryPath: string) => {
  const uriPath = `/archives/${encodeURIComponent(path.basename(archivePath))}/${entryPath
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')}`;
  const query = new URLSearchParams({ archive: archivePath, entry: entryPath });
  return Uri.parse(`${IAR_CONTENT_SCHEME}:${uriPath}?${query.toString()}`);
};

export class IarContentDocumentProvider implements TextDocumentContentProvider {
  private readonly archives = new Map<string, AdmZip>();

  provideTextDocumentContent(uri: Uri): string {
    const query = new URLSearchParams(uri.query);
    const archivePath = query.get('archive');
    const entryPath = query.get('entry');
    if (!archivePath || !entryPath) {
      return '';
    }
    try {
      if (fs.statSync(archivePath).isDirectory()) {
        return fs.readFileSync(path.join(archivePath, ...entryPath.split('/')), 'utf8');
      }
    } catch {
      // Fall back to reading the IAR archive below.
    }
    const archive = this.getArchive(archivePath);
    return archive.getEntry(entryPath)?.getData().toString('utf8') ?? '';
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
