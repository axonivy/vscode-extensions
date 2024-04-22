import * as path from 'path';
import fs from 'fs';
import { randomInt } from 'crypto';

export const prebuiltWorkspacePath = path.resolve(__dirname, './multi-project/prebuiltProject');
export const noEngineWorkspacePath = path.resolve(__dirname, './no-engine');
export const noProjectWorkspacePath = path.resolve(__dirname, './no-project');
export const multiProjectWorkspacePath = path.resolve(__dirname, './multi-project');
export const empty = path.resolve(__dirname, './empty');

export function removeFromWorkspace(...paths: string[]) {
  if (process.env.CI) {
    return;
  }
  fs.rmSync(path.resolve(...paths), { recursive: true, force: true });
}

export function randomArtefactName() {
  return 'test' + randomInt(10_000).toString();
}
