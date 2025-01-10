import fs from 'fs';
import * as vscode from 'vscode';

// from https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/manifest.ts
export type ViteManifest = Record<string, ViteManifestChunk>;

export interface ViteManifestChunk {
  src?: string;
  file: string;
  css?: string[];
  assets?: string[];
  isEntry?: boolean;
  name?: string;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
}

export interface ViteManifestEntry {
  source: string;
  chunk: ViteManifestChunk;
}

export const ROOT_ENTRY = 'index.html';
export const EDITOR_WORKER_ENTRY = 'editor.worker.js?worker';

export function parseBuildManifest(path: string): ViteManifest {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

export function findRootEntry(manifest: ViteManifest): ViteManifestEntry {
  const entry = Object.entries(manifest).find(entry => entry[1].isEntry);
  if (!entry) {
    throw new Error('Could not find root entry');
  }
  return { source: entry[0], chunk: entry[1] };
}

export function findEditorWorkerWrapperChunk(manifest: ViteManifest): ViteManifestChunk | undefined {
  return Object.entries(manifest).find(entry => entry[0].endsWith(EDITOR_WORKER_ENTRY))?.[1];
}

export function findRootHtml(appPath: vscode.Uri, manifest: ViteManifest): vscode.Uri {
  const rootEntry = findRootEntry(manifest);
  return vscode.Uri.joinPath(appPath, rootEntry.chunk.src ?? rootEntry.source);
}

export function findEditorWorker(appPath: vscode.Uri, manifest: ViteManifest): vscode.Uri | undefined {
  // Finding the location of the editor worker is a bit tricky as Vite automatically generates a wrapper for it
  // But for web views we need the actual code so we can turn it into a blob URL later on
  const workerWrapper = findEditorWorkerWrapperChunk(manifest);
  if (!workerWrapper) {
    return;
  }
  // find the editor worker file that is not the wrapper
  const assetsDirectory = vscode.Uri.joinPath(appPath, 'assets');
  const assetFiles = fs.readdirSync(assetsDirectory.fsPath);
  const editorWorker = assetFiles.find(fileName => fileName.includes('editor.worker') && !workerWrapper.file.includes(fileName));
  return editorWorker ? vscode.Uri.joinPath(assetsDirectory, editorWorker) : undefined;
}
